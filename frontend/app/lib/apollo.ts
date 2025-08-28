import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
} from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { Observable } from "@apollo/client/utilities";
import {
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
} from "@apollo/client/errors";

// API endpoint
const API_URL = import.meta.env.VITE_API_URL as string;
const httpLink = new HttpLink({ uri: API_URL });

// Error handling link
const REFRESH_MUTATION = `mutation RefreshToken($refreshToken: String!) { refreshToken(refreshToken: $refreshToken) { token refreshToken refreshExpiresIn } }`;

async function requestTokenRefresh(
  refreshToken: string
): Promise<{ token: string | null; refreshToken: string | null }> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: REFRESH_MUTATION,
      variables: { refreshToken },
    }),
  });
  const json = await res.json();
  return {
    token: json?.data?.refreshToken?.token ?? null,
    refreshToken: json?.data?.refreshToken?.refreshToken ?? null,
  };
}

function goToLoginWithReturn() {
  if (typeof window === "undefined") return;
  const returnTo = encodeURIComponent(
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  );
  window.location.assign(`/login?returnTo=${returnTo}`);
}

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  if (CombinedGraphQLErrors.is(error)) {
    const messages = error.errors.map((e) => (e.message || "").toLowerCase());
    const codes = error.errors.map((e) =>
      (e.extensions?.code || "").toString()
    );
    const tokenExpired = messages.some((m) =>
      m.includes("signature has expired")
    );
    const invalidToken = messages.some((m) => m.includes("invalid token"));
    const isUnauthenticated = codes.some((c) => c === "UNAUTHENTICATED");
    if (!(tokenExpired || invalidToken || isUnauthenticated)) return;
    const currentRefresh = localStorage.getItem("refreshToken");
    if (!currentRefresh) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      goToLoginWithReturn();
      return;
    }

    return new Observable((observer) => {
      requestTokenRefresh(currentRefresh)
        .then(
          ({
            token,
            refreshToken,
          }: {
            token: string | null;
            refreshToken: string | null;
          }) => {
            if (token) {
              localStorage.setItem("token", token);
              if (refreshToken)
                localStorage.setItem("refreshToken", refreshToken);
              operation.setContext(({ headers = {} }) => ({
                headers: {
                  ...headers,
                  Authorization: `Bearer ${token}`,
                },
                _retry: true,
              }));
            } else {
              console.error("Token refresh returned no token");
              localStorage.removeItem("token");
              localStorage.removeItem("refreshToken");
              goToLoginWithReturn();
            }

            const subscriber = forward(operation).subscribe({
              next: (result) => observer.next(result),
              error: (err) => observer.error(err),
              complete: () => observer.complete(),
            });

            return () => subscriber.unsubscribe();
          }
        )
        .catch((err) => {
          console.error("Token refresh failed", err);
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          goToLoginWithReturn();
          observer.error(err);
        });
    });
  }

  if (CombinedProtocolErrors.is(error)) {
    error.errors.forEach(({ message, extensions }) => {
      console.error(`[Protocol error]: ${message}`, extensions);
    });
    return;
  }

  console.error(`[Network error]:`, error);
});

// Auth link
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem("token");
  if (token) {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    }));
  }
  return forward(operation);
});

// Public client (no auth)
export const publicClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

// Authenticated client (auth + error handling)
export const authClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
