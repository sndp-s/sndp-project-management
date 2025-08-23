import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const API_URL = import.meta.env.VITE_API_URL as string;

export const client = new ApolloClient({
  link: new HttpLink({ uri: API_URL }),
  cache: new InMemoryCache(),
});
