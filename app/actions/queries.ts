"use server";

import fs from "fs/promises";
import path from "path";
import {
  QueryHistoryItem,
  PinnedQuery,
  BookmarkedQuery,
  LabeledQuery,
} from "@/app/types/query";
import { revalidatePath } from "next/cache";

const DATA_FILE = path.join(process.cwd(), "data", "queryData.json");

export interface QueryData {
  queryHistory: QueryHistoryItem[];
  pinnedQueries: PinnedQuery[];
  bookmarkedQueries: BookmarkedQuery[];
  labeledQueries: LabeledQuery[];
  showQueryHistory: boolean;
}

const defaultData: QueryData = {
  queryHistory: [],
  pinnedQueries: [],
  bookmarkedQueries: [],
  labeledQueries: [],
  showQueryHistory: false,
};

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(defaultData, null, 2),
      "utf-8"
    );
  }
}

async function readQueryData(): Promise<QueryData> {
  await ensureDataFile();
  try {
    const rawData = await fs.readFile(DATA_FILE, "utf-8");
    if (!rawData.trim()) {
      return defaultData;
    }
    return JSON.parse(rawData) as QueryData;
  } catch (error) {
    console.error("Error reading query data:", error);
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(defaultData, null, 2),
      "utf-8"
    );
    return defaultData;
  }
}

async function writeQueryData(data: QueryData) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function getQueryData(): Promise<QueryData> {
  return await readQueryData();
}

export async function saveQueryData(data: QueryData): Promise<boolean> {
  await writeQueryData(data);
  revalidatePath("/editor");
  return true;
}

export async function clearQueryData(): Promise<boolean> {
  await writeQueryData(defaultData);
  revalidatePath("/editor");
  return true;
}
