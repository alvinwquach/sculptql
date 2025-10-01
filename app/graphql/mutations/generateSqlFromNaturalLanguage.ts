import { gql } from "@apollo/client";

export const GENERATE_SQL_FROM_NATURAL_LANGUAGE = gql`
  # Mutation to generate SQL from natural language
  mutation GenerateSqlFromNaturalLanguage(
    $naturalLanguage: String!
    $schema: [TableSchemaInput!]!
    $dialect: String
  ) {
    generateSqlFromNaturalLanguage(
      naturalLanguage: $naturalLanguage
      schema: $schema
      dialect: $dialect
    ) {
      sql
    }
  }
`;

