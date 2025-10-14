"use server";

export async function isCliMode(): Promise<boolean> {
  const hasDbConfig =
    !!process.env.DB_DIALECT &&
    (!!process.env.DB_HOST || !!process.env.DB_FILE);

  return hasDbConfig;
}
