export const getOperatorDetail = (operator: string): string => {
  // Map the operator to the operator details
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
  // Return the operator details
  return operatorDetails[operator.toUpperCase()] || "Operator";
};
