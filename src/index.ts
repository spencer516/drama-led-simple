#!/usr/bin/env node
import "./utils/logger"; // Must be first to redirect console.log
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import loadBinFiles, { Frame } from "./utils/load-files";
import createDisplay from "./utils/render-display";
import startOSC from "./utils/start-osc-receiver";
import createOctoController, { SendToOcto } from "./utils/octo-controller";
import FrameController from "./utils/frame-controller";

const BRIGHTNESS_FACTOR = 0.25;

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

  const jsonIndex = await loadBinFiles(directory);

  let sendToOcto: ((frame: Frame) => unknown) | null;

  const logger = createDisplay(
    directory,
    jsonIndex,
    () => console.log("exiting..."),
    () => hardStop(sendToOcto)
  );

  if (!disableOcto) {
    [sendToOcto] = await createOctoController(logger, {
      startUniverse: 1200,
      brightnessFactor: BRIGHTNESS_FACTOR,
    });
  } else {
    sendToOcto = (_: Frame) => null;
  }

  const animationLoop = new FrameController(jsonIndex, logger, sendToOcto);

  await startOSC(
    logger,
    (args) => animationLoop.startID(args),
    (args) => animationLoop.stopID(args),
    () => {
      logger.log("HARD STOP!");
      animationLoop.stopAll();
      hardStop(sendToOcto);
    }
  );
}

function hardStop(sendToOcto: SendToOcto | null) {
  const frame: Frame = [];

  for (let channel = 1; channel < 96 * 3; channel++) {
    frame[channel] = 0;
  }
  sendToOcto?.(frame);
}

main().catch(console.error);
