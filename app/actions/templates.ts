"use server";

import fs from "fs/promises";
import path from "path";
import { QueryTemplate } from "@/app/types/query";
import { revalidatePath } from "next/cache";

const TEMPLATES_FILE = path.join(process.cwd(), "data", "queryTemplates.json");

interface TemplatesData {
  templates: QueryTemplate[];
}

const defaultData: TemplatesData = {
  templates: [],
};

async function ensureTemplatesFile() {
  await fs.mkdir(path.dirname(TEMPLATES_FILE), { recursive: true });
  try {
    await fs.access(TEMPLATES_FILE);
  } catch {
    await fs.writeFile(
      TEMPLATES_FILE,
      JSON.stringify(defaultData, null, 2),
      "utf-8"
    );
  }
}

async function readTemplatesData(): Promise<TemplatesData> {
  await ensureTemplatesFile();
  try {
    const rawData = await fs.readFile(TEMPLATES_FILE, "utf-8");
    if (!rawData.trim()) {
      return defaultData;
    }
    return JSON.parse(rawData) as TemplatesData;
  } catch (error) {
    console.error("Error reading templates:", error);
    await fs.writeFile(
      TEMPLATES_FILE,
      JSON.stringify(defaultData, null, 2),
      "utf-8"
    );
    return defaultData;
  }
}

async function writeTemplatesData(data: TemplatesData) {
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function getTemplates(): Promise<TemplatesData> {
  return await readTemplatesData();
}

export async function getTemplateById(
  id: string
): Promise<QueryTemplate | null> {
  const data = await readTemplatesData();
  return data.templates.find((t) => t.id === id) || null;
}

export async function createTemplate(
  template: Omit<QueryTemplate, "id" | "createdAt" | "updatedAt">
): Promise<QueryTemplate> {
  const data = await readTemplatesData();

  const id = `template_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;
  const now = new Date().toISOString();

  const newTemplate: QueryTemplate = {
    ...template,
    id,
    createdAt: now,
    updatedAt: now,
  };

  data.templates.push(newTemplate);
  await writeTemplatesData(data);
  revalidatePath("/editor");

  return newTemplate;
}

export async function updateTemplate(
  template: QueryTemplate
): Promise<QueryTemplate> {
  const data = await readTemplatesData();

  const index = data.templates.findIndex((t) => t.id === template.id);
  if (index === -1) {
    throw new Error("Template not found");
  }

  data.templates[index] = {
    ...template,
    updatedAt: new Date().toISOString(),
  };

  await writeTemplatesData(data);
  revalidatePath("/editor");

  return data.templates[index];
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const data = await readTemplatesData();
  const initialLength = data.templates.length;

  data.templates = data.templates.filter((t) => t.id !== id);

  if (data.templates.length === initialLength) {
    throw new Error("Template not found");
  }

  await writeTemplatesData(data);
  revalidatePath("/editor");

  return true;
}
