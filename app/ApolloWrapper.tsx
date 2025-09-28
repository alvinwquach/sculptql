"use client";

import { ApolloLink, HttpLink } from "@apollo/client";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
  SSRMultipartLink,
} from "@apollo/client-integration-nextjs";
import { PropsWithChildren } from "react";

// Function to create the persisted cache
const createPersistedCache = () => {
  // Create the cache
  const cache = new InMemoryCache({
    // Set the type policies
    typePolicies: {
      Query: {
        fields: {
          // Set the schema field with proper caching
          schema: {
            // Cache based on arguments to allow different queries to coexist
            keyArgs: (args) => {
              // Create a consistent cache key that handles undefined values and false values
              const key = {
                tableSearch: args?.tableSearch || null,
                columnSearch: args?.columnSearch || null,
                limit: args?.limit || null,
                includeSampleData: args?.includeSampleData || false
              };
              // Return the key as a JSON string
              return JSON.stringify(key);
            },
            // Merge the existing and incoming data
            merge(incoming) {
              // Always use the incoming data for schema queries
              return incoming;
            },
          },
        },
      },
      // Set the table field
      Table: {
        // Set the key fields to the table name
        keyFields: ['table_name'],
        // Set the fields
        fields: {
          values: {
            merge: false,
          },
        },
      },
    },
    // Set the result caching to true
    resultCaching: true,
  });

  return cache;
};

// Function to create Apollo Client
function makeClient() {
  // Create the is browser state by the window object and the undefined check
  const isBrowser = typeof window !== "undefined";
  // Create the graphql url by the browser 
  // or the next public graphql url
  const graphqlUrl = isBrowser
    ? "/api/graphql"
    : process.env.NEXT_PUBLIC_GRAPHQL_URL || "https://sculptql.com/api/graphql";
  // Create the http link
  const httpLink = new HttpLink({
    // Set the uri to the graphql url
    uri: graphqlUrl,
    // Set the credentials to include
    credentials: "include",
  });
  // Create the cache
  const cache = createPersistedCache();
  // Create the client
  const client = new ApolloClient({
    // Set the cache to the cache
    cache,
    // Set the link to the http link
    link: isBrowser
      // If the is browser is true, set the link to the http link
      ? httpLink
      // If the is browser is false, set the link to the ssr multipart link 
      // and the http link
      : ApolloLink.from([new SSRMultipartLink({ stripDefer: true }), httpLink]),
    // Set the default options to the watch query and the query
    defaultOptions: {
      // Set the watch query to the cache first and the error policy to all
      watchQuery: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
      // Set the fetch policy to cache first and the error policy to all
      query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
    },
  });
  // Return the client
  return client;
}

export function ApolloWrapper({ children }: PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
