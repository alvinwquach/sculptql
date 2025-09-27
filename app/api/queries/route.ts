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

// Interface for the query data
export interface QueryData {
  queryHistory: QueryHistoryItem[];
  pinnedQueries: PinnedQuery[];
  bookmarkedQueries: BookmarkedQuery[];
  labeledQueries: LabeledQuery[];
  showQueryHistory: boolean;
}

// Set the default data for the query data
const defaultData: QueryData = {
  queryHistory: [],
  pinnedQueries: [],
  bookmarkedQueries: [],
  labeledQueries: [],
  showQueryHistory: false,
};

// Function to ensure the data file
async function ensureDataFile() {
  // Log the ensure data file
  console.log("[ensureDataFile] Checking data file at:", DATA_FILE);
  // Create the data file directory
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    // Access the data file
    await fs.access(DATA_FILE);
    

    // Log the data file exists
    console.log("[ensureDataFile] Data file exists.");
  } catch {
    // Log the data file does not exist
    console.log(
      "[ensureDataFile] Data file does not exist. Creating with default data..."
    );
    // Write the default data to the data file
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(defaultData, null, 2),
      "utf-8"
    );
  }
}

// Function to read the query data
async function readQueryData(): Promise<QueryData> {
  // Log the read query data
  console.log("[readQueryData] Reading query data...");
  // Ensure the data file
  await ensureDataFile();
  try {
    // Read the data file
    const rawData = await fs.readFile(DATA_FILE, "utf-8");
    // If the raw data is empty
    // Log the data file is empty
    if (!rawData.trim()) {
      console.log(
        "[readQueryData] Data file is empty. Returning default data."
      );
      // Return the default data
      return defaultData;
    }

    // Parse the raw data
    const parsedData = JSON.parse(rawData) as QueryData;
    // Log the successfully read data
    console.log("[readQueryData] Successfully read data:");
    // Log the parsed data
    console.log(parsedData);
    // Return the parsed data
    return parsedData;
  } catch (error) {
    console.error("[readQueryData] Error reading query data:", error);
    // Write the default data to the data file
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(defaultData, null, 2),
      "utf-8"
    );
    // Return the default data
    return defaultData;
  }
}

// Function to write the query data
async function writeQueryData(data: QueryData) {
  // Log the write query data
  console.log("[writeQueryData] Writing data to file...");
  // Log the data
  console.log(data);
  // Write the data to the data file
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  // Log the data written successfully
  console.log("[writeQueryData] Data written successfully.");
}

// Function to get the query data
export async function GET() {
  // Log the get query data
  console.log("[GET] API request received.");
  // Read the query data
  const data = await readQueryData();
  // Log the returning data
  console.log("[GET] Returning data:");
  // Log the data
  console.log(data);
  // Return the data
  return NextResponse.json<QueryData>(data);
}

// Function to post the query data
export async function POST(req: NextRequest) {
  // Log the post query data
  console.log("[POST] API request received.");
  // Set the new data to the unknown
  let newData: unknown;

  try {
    // Set the new data to the request json
    newData = await req.json();
    // Log the received json body
    console.log("[POST] Received JSON body:");
    // Log the new data
    console.log(newData);
  } catch (error) {
    // Log the invalid json in request body
    console.error("[POST] Invalid JSON in request body:", error);
    // Return the invalid json in request body
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  try {
    // Set the data to the new data
    const data = newData as QueryData;
    // Write the data to the data file
    await writeQueryData(data);
    // Log the data saved successfully
    console.log("[POST] Data saved successfully.");
    // Return the success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST] Error writing query data:", error);
    // Return the failed to save query data
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
