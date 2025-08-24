import { gql } from "@apollo/client";
import { client } from "~/lib/apollo";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";
import { AuthError, AuthErrorCode } from "~/lib/errors";

const VERIFY = gql`
  mutation verifyToken($token: String!) {
    verifyToken(token: $token) {
      payload
    }
  }
`;

interface Payload {
  email: string;
  exp: number;
  origIat: number;
}

interface VerifyResult {
  verifyToken: {
    payload: Payload;
  };
}

export async function verify(token: string): Promise<Payload> {
  try {
    const { data } = await client.mutate<VerifyResult>({
      mutation: VERIFY,
      variables: { token },
      errorPolicy: "none",
    });
    debugger;
    if (!data?.verifyToken?.payload) {
      throw new AuthError(AuthErrorCode.UNKNOWN, "No payload returned");
    }

    return data.verifyToken.payload;
  } catch (err: unknown) {
    debugger;
    if (CombinedGraphQLErrors.is(err)) {
      for (const gqlErr of err.errors) {
        if (gqlErr.message.includes("Signature has expired")) {
          throw new AuthError(AuthErrorCode.EXPIRED, "Login expired");
        }
        if (gqlErr.message.includes("Invalid token")) {
          throw new AuthError(AuthErrorCode.INVALID, "Invalid token");
        }
      }
      throw new AuthError(
        AuthErrorCode.UNKNOWN,
        err.errors.map((e) => e.message).join(", ")
      );
    }

    if (ServerError.is(err)) {
      throw new AuthError(AuthErrorCode.NETWORK, "Network or server error");
    }

    if (err instanceof Error) {
      throw new AuthError(AuthErrorCode.UNKNOWN, err.message);
    }

    throw new AuthError(AuthErrorCode.UNKNOWN, "Unknown error");
  }
}
