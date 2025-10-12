import { gql } from "@apollo/client";

export const GET_DIALECT = gql`
  # Get the dialect
  query GetDialect {
    dialect
  }
`;

export const GET_SCHEMA = gql`
  # Get the schema query
  query GetSchema($tableSearch: String, $columnSearch: String, $limit: Int) {
    schema(
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
    }
  }
`;