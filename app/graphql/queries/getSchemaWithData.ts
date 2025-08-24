import { gql } from "@apollo/client";

export const GET_SCHEMA_WITH_DATA = gql`
  query GetSchemaWithData(
    $tableSearch: String
    $columnSearch: String
    $limit: Int
  ) {
    schemaWithData(
      tableSearch: $tableSearch
      columnSearch: $columnSearch
      limit: $limit
    ) {
      table_catalog
      table_schema
      table_name
      table_type
      comment
      columns {
        column_name
        data_type
        is_nullable
        is_primary_key
      }
      primary_keys
      foreign_keys {
        column_name
        referenced_table
        referenced_column
        constraint_name
      }
      values
    }
  }
`;
