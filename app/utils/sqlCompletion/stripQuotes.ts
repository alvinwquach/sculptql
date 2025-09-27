export const stripQuotes = (str: string): string => {
  // Remove leading and trailing single or double quotes
  return str.replace(/^['"]|['"]$/g, "");
};


