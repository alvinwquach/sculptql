import { gql } from "@apollo/client";

export const RUN_QUERY = gql`
  # Run the query mutation
  mutation RunQuery($query: String!) {
    runQuery(query: $query) {
      rows
      rowCount
      fields
      payloadSize
      totalTime
      errorsCount
      error
    }
  }
`;
