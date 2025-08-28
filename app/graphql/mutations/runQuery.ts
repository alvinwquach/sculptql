import { gql } from "@apollo/client";

export const RUN_QUERY = gql`
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
