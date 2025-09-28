import { gql } from "@apollo/client";

export const GET_SCHEMA_VERSION = gql`
  # Get the schema version query
  query GetSchemaVersion {
    schemaVersion {
      version
      lastModified
      tableCount
    }
  }
`;
