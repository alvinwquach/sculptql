export const getOperatorDetail = (operator: string): string => {
  // PSEUDOCODE:
  // 1. Map operators to their descriptions
  // 2. Return description for the given operator

  const operatorDetails: { [key: string]: string } = {
    "=": "Equal to",
    "!=": "Not equal to",
    ">": "Greater than",
    "<": "Less than",
    ">=": "Greater than or equal to",
    "<=": "Less than or equal to",
    LIKE: "Pattern matching",
    "IS NULL": "Check for null",
    "IS NOT NULL": "Check for non-null",
    BETWEEN: "Range check",
  };
  return operatorDetails[operator.toUpperCase()] || "Operator";
};
