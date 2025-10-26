#!/usr/bin/env node
import "./utils/logger"; // Must be first to redirect console.log
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import loadJsonFiles, { Frame } from "./utils/load-files";
import createDisplay from "./utils/render-display";
import startOSC from "./utils/start-osc-receiver";
import { commify } from "./utils/commify";
import createOctoController from "./utils/octo-controller";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("directory", {
      alias: "d",
      type: "string",
      description: "Directory to search for JSON files",
      default: process.cwd(),
    })
    .help().argv;

  const directory = argv.directory;
  const jsonIndex = await loadJsonFiles(directory);

  // State
  let currentFile = "[none]";
  let currentFrame = "-";

  let sendToOcto: ((frame: Frame) => unknown) | null;

  const logger = createDisplay(
    () => ({
      currentFile,
      currentFrame,
      jsonIndex,
      directory,
    }),
    () => {
      console.log("exiting...");
    },
    () => {
      const frame: Frame = {};

      for (let channel = 1; channel < 96 * 3; channel++) {
        frame[channel] = 0;
      }

      sendToOcto?.(frame);
    }
  );

  [sendToOcto] = await createOctoController(logger, {
    startUniverse: 1200,
  });

  await startOSC(logger, (file, frameNumber) => {
    const frameData = jsonIndex[file];
    const frameNumberWithComma = commify(frameNumber + 1);

    if (frameData == null) {
      logger.error(`No file for ${file}`);
      currentFile = file;
      currentFrame = "-";
    } else {
      const totalFrames = frameData.length;
      const frame = frameData.at(frameNumber);

      if (frame == null) {
        logger.warn(`No frame ${frameNumber} found for ${file}`);
      } else {
        sendToOcto(frame);
      }

      currentFile = file;
      currentFrame = `${frameNumberWithComma} / ${commify(totalFrames)}`;
    }
  });
}

main().catch(console.error);
