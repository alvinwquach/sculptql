import { gql } from "@apollo/client";

export const RUN_TEMPLATE_QUERY = gql`
  mutation RunTemplateQuery(
    $templateQuery: String!
    $parameters: [ParameterValueInput!]!
  ) {
    runTemplateQuery(templateQuery: $templateQuery, parameters: $parameters) {
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
