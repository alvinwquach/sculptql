import { HttpLink, ApolloClient, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/client-integration-nextjs";

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  const isBrowser = typeof window !== "undefined";

  const graphqlUrl = isBrowser
    ? "/api/graphql"
    : process.env.NEXT_PUBLIC_GRAPHQL_URL || "https://sculptql.com/api/graphql";

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: graphqlUrl,
      credentials: "include",
    }),
  });
});
