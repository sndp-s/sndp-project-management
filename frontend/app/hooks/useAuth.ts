import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

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

interface Organization {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  organization: Organization;
}

interface LoginResult {
  tokenAuth: {
    token: string;
    user: User;
  };
}

export function useAuth() {
  const [loginMutation, { loading, error }] = useMutation<LoginResult>(LOGIN);

  async function login(email: string, password: string) {
    const { data } = await loginMutation({ variables: { email, password } });
    // TODO: return informative error msgs
    if (!data) throw new Error("Login failed");
    return data.tokenAuth;
  }

  return { login };
}
