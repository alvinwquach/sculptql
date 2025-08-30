import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "queryData.json");

async function ensureDataFile() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(
        DATA_FILE,
        JSON.stringify({
          queryHistory: [],
          pinnedQueries: [],
          bookmarkedQueries: [],
          labeledQueries: [],
          showQueryHistory: false,
        })
      );
    }
  } catch (error) {
    console.error("Error ensuring data file:", error);
  }
}

export async function GET() {
  try {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading query data:", error);
    return NextResponse.json(
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
    const newData = await req.json();
    const currentData = JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
    const updatedData = { ...currentData, ...newData };
    await fs.writeFile(DATA_FILE, JSON.stringify(updatedData, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error writing query data:", error);
    return NextResponse.json(
      { error: "Failed to save query data" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await ensureDataFile();
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify({
        queryHistory: [],
        pinnedQueries: [],
        bookmarkedQueries: [],
        labeledQueries: [],
        showQueryHistory: false,
      })
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing query data:", error);
    return NextResponse.json(
      { error: "Failed to clear query data" },
      { status: 500 }
    );
  }
}
