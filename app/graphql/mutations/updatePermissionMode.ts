import { gql } from "@apollo/client";

export const UPDATE_PERMISSION_MODE = gql`
  # Update the permission mode mutation
  mutation UpdatePermissionMode($mode: String!) {
    updatePermissionMode(mode: $mode)
  }
`;
