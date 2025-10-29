import { readdir, readFile } from "fs/promises";
import { join, basename } from "path";

export type Frame = number[];

export interface JsonIndex {
  [key: string]: Frame[];
}

export default async function loadBinFiles(
  directory: string
): Promise<JsonIndex> {
  const index: JsonIndex = {};

  try {
    const files = await readdir(directory);
    const jsonFiles = files.filter((file) => file.endsWith(".bin"));

    for (const file of jsonFiles) {
      const filePath = join(directory, file);
      const buffer = await readFile(filePath);
      const key = basename(file, ".bin");

      try {
        const array = new Int16Array(
          buffer.buffer,
          buffer.byteOffset,
          buffer.byteLength / 2
        );

        const frameData = chunkArray(array, 288);

        index[key] = frameData;
      } catch (error) {
        console.error(`Failed to parse ${file}:`, error);
      }
    }
  } catch (error) {
    console.error(`Failed to read directory ${directory}:`, error);
  }

  return index;
}

export function chunkArray(
  array: Int16Array<ArrayBufferLike>,
  chunkSize: number
): number[][] {
  const chunks: number[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(Array.from(array.slice(i, i + chunkSize)));
  }
  return chunks;
}
