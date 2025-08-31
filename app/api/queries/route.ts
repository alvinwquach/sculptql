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

interface QueryData {
  queryHistory: QueryHistoryItem[];
  pinnedQueries: PinnedQuery[];
  bookmarkedQueries: BookmarkedQuery[];
  labeledQueries: LabeledQuery[];
  showQueryHistory: boolean;
}

function validateQueryData(data: unknown): data is Partial<QueryData> {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<QueryData>;
  return (
    (d.queryHistory === undefined || Array.isArray(d.queryHistory)) &&
    (d.pinnedQueries === undefined || Array.isArray(d.pinnedQueries)) &&
    (d.bookmarkedQueries === undefined || Array.isArray(d.bookmarkedQueries)) &&
    (d.labeledQueries === undefined || Array.isArray(d.labeledQueries)) &&
    (d.showQueryHistory === undefined ||
      typeof d.showQueryHistory === "boolean")
  );
}

function sanitizeQueryData(data: Partial<QueryData>): Partial<QueryData> {
  const sanitized: Partial<QueryData> = { ...data };

  if (sanitized.queryHistory) {
    sanitized.queryHistory = sanitized.queryHistory.map((item) => ({
      ...item,
      query:
        typeof item.query === "string"
          ? item.query.replace(/[\r\n\t]/g, " ")
          : item.query,
    }));
  }

  if (sanitized.pinnedQueries) {
    sanitized.pinnedQueries = sanitized.pinnedQueries.map((item) => ({
      ...item,
      query:
        typeof item.query === "string"
          ? item.query.replace(/[\r\n\t]/g, " ")
          : item.query,
    }));
  }

  if (sanitized.bookmarkedQueries) {
    sanitized.bookmarkedQueries = sanitized.bookmarkedQueries.map((item) => ({
      ...item,
      query:
        typeof item.query === "string"
          ? item.query.replace(/[\r\n\t]/g, " ")
          : item.query,
    }));
  }

  if (sanitized.labeledQueries) {
    sanitized.labeledQueries = sanitized.labeledQueries.map((item) => ({
      ...item,
      query:
        typeof item.query === "string"
          ? item.query.replace(/[\r\n\t]/g, " ")
          : item.query,
      label:
        typeof item.label === "string"
          ? item.label.replace(/[\r\n\t]/g, " ")
          : item.label,
    }));
  }

  return sanitized;
}

async function ensureDataFile() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      const defaultData: QueryData = {
        queryHistory: [],
        pinnedQueries: [],
        bookmarkedQueries: [],
        labeledQueries: [],
        showQueryHistory: false,
      };
      await fs.writeFile(
        DATA_FILE,
        JSON.stringify(defaultData, null, 2),
        "utf-8"
      );
    }
  } catch (error) {
    console.error("Error ensuring data file:", error);
    throw error;
  }
}

export async function GET() {
  try {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, "utf-8");
    let parsedData: QueryData;
    try {
      parsedData = JSON.parse(data) as QueryData;
    } catch (parseError) {
      console.error("Error parsing query data:", parseError);
      return NextResponse.json<QueryData>(
        {
          queryHistory: [],
          pinnedQueries: [],
          bookmarkedQueries: [],
          labeledQueries: [],
          showQueryHistory: false,
        },
        { status: 200 }
      );
    }
    return NextResponse.json<QueryData>(parsedData);
  } catch (error) {
    console.error("Error reading query data:", error);
    return NextResponse.json<QueryData>(
      {
        queryHistory: [],
        pinnedQueries: [],
        bookmarkedQueries: [],
        labeledQueries: [],
        showQueryHistory: false,
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDataFile();
    let newData: unknown;
    try {
      newData = await req.json();
      console.log("Received new data:", newData);
    } catch (error) {
      console.error("Error parsing request JSON:", error);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!validateQueryData(newData)) {
      console.error("Invalid data structure:", newData);
      return NextResponse.json(
        { error: "Invalid query data structure" },
        { status: 400 }
      );
    }

    // Sanitize new data
    const sanitizedNewData = sanitizeQueryData(newData);

    let currentData: QueryData;
    try {
      const fileData = await fs.readFile(DATA_FILE, "utf-8");
      currentData = JSON.parse(fileData) as QueryData;
    } catch (error) {
      console.error("Error reading or parsing current data:", error);
      currentData = {
        queryHistory: [],
        pinnedQueries: [],
        bookmarkedQueries: [],
        labeledQueries: [],
        showQueryHistory: false,
      };
    }

    const updatedData: QueryData = { ...currentData, ...sanitizedNewData };
    try {
      await fs.writeFile(
        DATA_FILE,
        JSON.stringify(updatedData, null, 2),
        "utf-8"
      );
      console.log("Successfully wrote updated data:", updatedData);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error writing to file:", error);
      return NextResponse.json(
        { error: "Failed to save query data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await ensureDataFile();
    const defaultData: QueryData = {
      queryHistory: [],
      pinnedQueries: [],
      bookmarkedQueries: [],
      labeledQueries: [],
      showQueryHistory: false,
    };
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(defaultData, null, 2),
      "utf-8"
    );
    console.log("Successfully cleared query data");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing query data:", error);
    return NextResponse.json(
      { error: "Failed to clear query data" },
      { status: 500 }
    );
  }
}
