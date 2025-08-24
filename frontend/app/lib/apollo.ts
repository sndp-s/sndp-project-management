import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
} from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import {
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
} from "@apollo/client/errors";

// API endpoint
const API_URL = import.meta.env.VITE_API_URL as string;
const httpLink = new HttpLink({ uri: API_URL });

// Error handling link
const errorLink = new ErrorLink(({ error, operation, forward }) => {
  if (CombinedGraphQLErrors.is(error)) {
    // GraphQL errors (resolver or validation errors)
    error.errors.forEach(({ message, extensions }) => {
      console.error(`[GraphQL error]: ${message}`, extensions);

      if (extensions?.code === "UNAUTHENTICATED") {
        // TODO: Handle token refresh here
        // return forward(operation) if retrying
      }
    });
  } else if (CombinedProtocolErrors.is(error)) {
    // Protocol-level issues (e.g., invalid responses)
    error.errors.forEach(({ message, extensions }) => {
      console.error(`[Protocol error]: ${message}`, extensions);
    });
  } else {
    // Network-level issue (server unreachable, CORS, etc.)
    console.error(`[Network error]:`, error);
  }
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
