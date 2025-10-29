#!/usr/bin/env node
import "./utils/logger"; // Must be first to redirect console.log
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import loadJsonFiles, { Frame } from "./utils/load-files";
import createDisplay from "./utils/render-display";
import startOSC from "./utils/start-osc-receiver";
import { commify } from "./utils/commify";
import createOctoController from "./utils/octo-controller";
import FrameController from "./utils/frame-controller";

async function main() {
  const { directory, disableOcto } = await yargs(hideBin(process.argv))
    .option("directory", {
      alias: "d",
      type: "string",
      description: "Directory to search for JSON files",
      default: process.cwd(),
    })
    .option("disable-octo", {
      alias: "o",
      type: "boolean",
      description: "Disable outputting to Octo",
      default: false,
    })
    .help().argv;

  const jsonIndex = await loadJsonFiles(directory);

  let sendToOcto: ((frame: Frame) => unknown) | null;

  const logger = createDisplay(
    directory,
    jsonIndex,
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

  if (!disableOcto) {
    [sendToOcto] = await createOctoController(logger, {
      startUniverse: 1200,
    });
  } else {
    sendToOcto = (_: Frame) => null;
  }

  const animationLoop = new FrameController(jsonIndex, logger, sendToOcto);

  await startOSC(logger, (cueType, file) => {
    if (cueType === "cue/start") {
      animationLoop.startFile(file);
    } else if (cueType === "cue/stop") {
      animationLoop.stopFile(file);
    }
  });
}

main().catch(console.error);
