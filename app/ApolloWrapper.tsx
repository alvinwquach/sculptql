"use client";

import { ApolloLink, HttpLink } from "@apollo/client";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
  SSRMultipartLink,
} from "@apollo/client-integration-nextjs";
import { PropsWithChildren } from "react";

function makeClient() {
  const isBrowser = typeof window !== "undefined";

  const graphqlUrl = isBrowser
    ? "/api/graphql"
    : process.env.NEXT_PUBLIC_GRAPHQL_URL || "https://sculptql.com/api/graphql";

  const httpLink = new HttpLink({
    uri: graphqlUrl,
    credentials: "include",
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: isBrowser
      ? httpLink
      : ApolloLink.from([new SSRMultipartLink({ stripDefer: true }), httpLink]),
  });
}

export function ApolloWrapper({ children }: PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
