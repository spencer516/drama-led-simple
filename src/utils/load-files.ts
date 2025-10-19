import { readdir, readFile } from "fs/promises";
import { join, basename } from "path";

export interface JsonIndex {
  [key: string]: any;
}

export default async function loadJsonFiles(
  directory: string
): Promise<JsonIndex> {
  const index: JsonIndex = {};

  try {
    const files = await readdir(directory);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    for (const file of jsonFiles) {
      const filePath = join(directory, file);
      const content = await readFile(filePath, "utf-8");
      const key = basename(file, ".json");

      try {
        index[key] = JSON.parse(content);
      } catch (error) {
        console.error(`Failed to parse ${file}:`, error);
      }
    }
  } catch (error) {
    console.error(`Failed to read directory ${directory}:`, error);
  }

  return index;
}
