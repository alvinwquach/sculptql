export const stripQuotes = (str: string): string => {
  // PSEUDOCODE:
  // 1. Remove leading and trailing single or double quotes
  // 2. Return the cleaned string

  return str.replace(/^['"]|['"]$/g, "");
};


