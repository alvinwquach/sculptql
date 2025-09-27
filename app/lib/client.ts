import { HttpLink, ApolloClient, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/client-integration-nextjs";

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  // Create the is browser state by the window object and the undefined check
  const isBrowser = typeof window !== "undefined";
  // Create the graphql url by the browser 
  // or the next public graphql url
  const graphqlUrl = isBrowser
    ? "/api/graphql"
    : process.env.NEXT_PUBLIC_GRAPHQL_URL || "https://sculptql.com/api/graphql";

  return new ApolloClient({
    // Set the cache to the in memory cache
    cache: new InMemoryCache(),
    // Set the link to the http link
    link: new HttpLink({
      // Set the uri to the graphql url
      uri: graphqlUrl,
      // Set the credentials to include
      credentials: "include",
    }),
  });
});
