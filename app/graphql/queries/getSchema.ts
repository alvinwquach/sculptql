import { gql } from "@apollo/client";

export const GET_SCHEMA = gql`
  query GetSchema($tableSearch: String, $columnSearch: String) {
    schema(tableSearch: $tableSearch, columnSearch: $columnSearch) {
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
    }
  }
`;
