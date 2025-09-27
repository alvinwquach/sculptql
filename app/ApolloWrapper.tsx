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
  // Get the is browser
  const isBrowser = typeof window !== "undefined";

  // Get the graphql url
  const graphqlUrl = isBrowser
    // If the browser is defined
    ? "/api/graphql"
    // If the browser is not defined
    : process.env.NEXT_PUBLIC_GRAPHQL_URL || "https://sculptql.com/api/graphql";

  // Create the http link
  const httpLink = new HttpLink({
    // Set the uri to the graphql url
    uri: graphqlUrl,
    // Set the credentials to include
    credentials: "include",
  });

  return new ApolloClient({
    // Set the cache to the in memory cache
    cache: new InMemoryCache(),
    // Set the link to the http link if the browser is defined
    link: isBrowser
      // If the browser is defined
      ? httpLink
      // If the browser is not defined
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
