export const needsQuotes = (id: string) =>
  /[^a-z0-9_]/i.test(id) || /[A-Z]/.test(id);
