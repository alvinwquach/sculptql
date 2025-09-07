import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  QueryHistoryItem,
  PinnedQuery,
  BookmarkedQuery,
  LabeledQuery,
} from "@/app/types/query";

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
  console.log("[ensureDataFile] Checking data file at:", DATA_FILE);
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
    console.log("[ensureDataFile] Data file exists.");
  } catch {
    console.log(
      "[ensureDataFile] Data file does not exist. Creating with default data..."
    );
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(defaultData, null, 2),
      "utf-8"
    );
  }
}

async function readQueryData(): Promise<QueryData> {
  console.log("[readQueryData] Reading query data...");
  await ensureDataFile();
  try {
    const rawData = await fs.readFile(DATA_FILE, "utf-8");

    if (!rawData.trim()) {
      console.log(
        "[readQueryData] Data file is empty. Returning default data."
      );
      return defaultData;
    }

    const parsedData = JSON.parse(rawData) as QueryData;
    console.log("[readQueryData] Successfully read data:");
    console.log(parsedData);

    return parsedData;
  } catch (error) {
    console.error("[readQueryData] Error reading query data:", error);
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(defaultData, null, 2),
      "utf-8"
    );
    return defaultData;
  }
}

async function writeQueryData(data: QueryData) {
  console.log("[writeQueryData] Writing data to file...");
  console.log(data);
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  console.log("[writeQueryData] Data written successfully.");
}

export async function GET() {
  console.log("[GET] API request received.");
  const data = await readQueryData();
  console.log("[GET] Returning data:");
  console.log(data);
  return NextResponse.json<QueryData>(data);
}

export async function POST(req: NextRequest) {
  console.log("[POST] API request received.");
  let newData: unknown;

  try {
    newData = await req.json();
    console.log("[POST] Received JSON body:");
    console.log(newData);
  } catch (error) {
    console.error("[POST] Invalid JSON in request body:", error);
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  try {
    const data = newData as QueryData;
    await writeQueryData(data);
    console.log("[POST] Data saved successfully.");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST] Error writing query data:", error);
    return NextResponse.json(
      { error: "Failed to save query data" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  console.log("[DELETE] API request received. Resetting data...");
  try {
    await writeQueryData(defaultData);
    console.log("[DELETE] Data reset to default successfully.");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE] Error resetting data:", error);
    return NextResponse.json(
      { error: "Failed to clear query data" },
      { status: 500 }
    );
  }
}
