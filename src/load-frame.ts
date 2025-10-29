#!/usr/bin/env node
import createOctoController from "./utils/octo-controller";
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import loadJsonFiles, { Frame } from "./utils/load-files";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("file", {
      alias: "f",
      type: "string",
      description: "the file to auto-run",
    })
    .option("directory", {
      alias: "d",
      type: "string",
      description: "Directory to search for JSON files",
      default: process.cwd(),
    })
    .option("frame", {
      alias: "r",
      type: "number",
      description: "the frame to load",
    })
    .help().argv;

  const logger = {
    warn(message: string) {
      console.warn(message);
    },
    log(message: string) {
      console.log(message);
    },
    error(message: string) {
      console.error(message);
    },
    setCurrentFile(file: string) {
      // do nothing
    },
    setCurrentFrame(frame: number, totalFrames: number) {
      // do nothing
    },
  };

  const { directory, file, frame } = argv;

  const jsonIndex = await loadJsonFiles(directory);

  if (file == null || !jsonIndex.hasOwnProperty(file)) {
    const availableFiles = Object.keys(jsonIndex);
    throw new Error(
      `You must provide a file from among: ${availableFiles.join(
        ", "
      )}. You provided ${file}`
    );
  }

  const framesData = jsonIndex[file] ?? [];
  const frameData = framesData.at(frame ?? 0);

  const [sendToOcto] = await createOctoController(logger, {
    startUniverse: 1200,
    brightnessFactor: 1,
  });

  if (frameData == null) {
    console.log("No data for frame");
  } else {
    sendToOcto(frameData);

    for await (const [lightFrame, index] of iterateLightsInFrame(frameData)) {
      sendToOcto(lightFrame);
      console.log(`Sending Light ${index}`, index);
    }
    for (let i = 0; i < 96; i++) {
      const r = frameData[i * 3 + 1];
      const g = frameData[i * 3 + 2];
      const b = frameData[i * 3 + 3];
      console.log(`Light ${i}: rgb(${r}, ${g}, ${b})`);
    }
  }
}

async function* iterateLightsInFrame(frameData: Frame) {
  let i = 0;

  while (i < 96) {
    const newFrame = makeEmptyFrame(0);

    newFrame[i * 3 + 1] = frameData[i * 3 + 1];
    newFrame[i * 3 + 2] = frameData[i * 3 + 2];
    newFrame[i * 3 + 3] = frameData[i * 3 + 3];

    yield [newFrame, i] as const;

    i++;

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

function makeEmptyFrame(val: number = 0): Frame {
  let frame: Frame = [];

  for (let i = 0; i < 96 * 3; i++) {
    frame[i] = val;
  }

  return frame;
}

main().catch(console.error);
