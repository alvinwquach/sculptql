export const getOperatorDetail = (operator: string): string => {
  switch (operator.toUpperCase()) {
    case "=":
      return "Equals";
    case "!=":
      return "Does not equal";
    case ">":
      return "Greater than";
    case "<":
      return "Less than";
    case ">=":
      return "Greater than or equal to";
    case "<=":
      return "Less than or equal to";
    case "LIKE":
      return "Pattern matching";
    default:
      return "";
  }
};
