import { gql } from "@apollo/client";

export const INVALIDATE_SCHEMA_CACHE = gql`
  # Invalidate the schema cache mutation
  mutation InvalidateSchemaCache {
    invalidateSchemaCache
  }
`;
