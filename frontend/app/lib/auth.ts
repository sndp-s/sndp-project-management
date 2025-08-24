import { gql } from "@apollo/client";
import { publicClient } from "~/lib/apollo";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";
import { AuthError, AuthErrorCode } from "~/lib/errors";
import type { User } from "~/types/types.base";

//
// verify
//
const VERIFY = gql`
  mutation verifyToken($token: String!) {
    verifyToken(token: $token) {
      payload
    }
  }
`;

interface VerifyPayload {
  email: string;
  exp: number;
  origIat: number;
}
interface VerifyResult {
  verifyToken: {
    payload: VerifyPayload;
  };
}

export async function verify(token: string): Promise<VerifyPayload> {
  try {
    const { data } = await publicClient.mutate<VerifyResult>({
      mutation: VERIFY,
      variables: { token },
      errorPolicy: "none",
    });
    if (!data?.verifyToken?.payload) {
      throw new AuthError(AuthErrorCode.UNKNOWN, "No payload returned");
    }
    return data.verifyToken.payload;
  } catch (err: unknown) {
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

//
// login
//
const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    tokenAuth(email: $email, password: $password) {
      token
      user {
        id
        email
        organization {
          id
          name
        }
      }
    }
  }
`;

interface LoginPayload {
  token: string;
  user: User;
}
interface LoginResult {
  tokenAuth: LoginPayload;
}

export async function login(
  email: string,
  password: string
): Promise<LoginPayload> {
  try {
    const { data } = await publicClient.mutate<LoginResult>({
      mutation: LOGIN,
      variables: { email, password },
      errorPolicy: "none",
    });

    if (!data?.tokenAuth?.token) {
      throw new AuthError(AuthErrorCode.UNKNOWN, "No token returned");
    }

    // Save token for future requests
    localStorage.setItem("token", data.tokenAuth.token);

    return data.tokenAuth;
  } catch (err: unknown) {
    if (CombinedGraphQLErrors.is(err)) {
      throw new AuthError(
        AuthErrorCode.INVALID,
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
