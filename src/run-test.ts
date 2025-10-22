import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import loadJsonFiles from "./utils/load-files";
import outputLightTable from "./utils/output-light-table";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("file", {
      alias: "f",
      type: "string",
      description: "the file to auto-run",
    })
    .option("lights", {
      type: "array",
      alias: "l",
      description: "the light indices to output",
    })
    .option("directory", {
      alias: "d",
      type: "string",
      description: "Directory to search for JSON files",
      default: process.cwd(),
    })
    .option("start-frame", {
      alias: "s",
      type: "number",
      description: "the frame to start from",
      default: 0,
    })
    .option("count-frames", {
      alias: "c",
      type: "number",
      description: "the number of frames to run through",
      default: Infinity,
    })
    .help().argv;

  const { directory, file, startFrame, countFrames, lights } = argv;
  const jsonIndex = await loadJsonFiles(directory);

  if (file == null || !jsonIndex.hasOwnProperty(file)) {
    const availableFiles = Object.keys(jsonIndex);
    throw new Error(
      `You must provide a file from among: ${availableFiles.join(
        ", "
      )}. You provided ${file}`
    );
  }

  const frameData = jsonIndex[file];
  const lightRGBIndices = (lights ?? []).map((light) => {
    const lightIndex = Number.isFinite(light)
      ? Number(light)
      : parseInt(`${light}`.replace(/[^\d]/g, ""));
    return [lightIndex, lightIndex * 3, lightIndex * 3 + 1, lightIndex * 3 + 2];
  });

  const endFrame = Math.min(startFrame + countFrames, frameData.length);
  const outputRows = [];

  for (let frame = startFrame; frame < endFrame; frame++) {
    const frameLights = frameData[frame];

    for (const [id, ir, ig, ib] of lightRGBIndices) {
      const r = frameLights[ir];
      const g = frameLights[ig];
      const b = frameLights[ib];

      outputRows.push({
        frame,
        id,
        r,
        g,
        b,
      });
    }
  }

  outputLightTable(outputRows);
}

main().catch(console.error);
