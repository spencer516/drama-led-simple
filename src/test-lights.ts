#!/usr/bin/env node
import createOctoController from "./utils/octo-controller";
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import loadJsonFiles, { Frame } from "./utils/load-files";

async function main() {
  const { red, green, blue } = await yargs(hideBin(process.argv))
    .option("red", {
      alias: "r",
      type: "number",
      description: "red (0-100)",
      default: 100,
    })
    .option("green", {
      alias: "g",
      type: "number",
      description: "green (0-100)",
      default: 100,
    })
    .option("blue", {
      alias: "b",
      type: "number",
      description: "blue (0-100)",
      default: 100,
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

  const [sendToOcto, close] = await createOctoController(logger, {
    startUniverse: 1200,
  });

  sendToOcto(makeEmptyFrame(red, green, blue));
  console.log(`Lights on at R:${red}, G:${green}, B:${blue}`);
  // close();
  // process.exit(0);
}

const start = 0;
const numLights = 96;

function makeEmptyFrame(red: number, green: number, blue: number): Frame {
  let frame: Frame = {};

  for (let i = start; i < numLights + start; i++) {
    frame[`${i * 3 + 1}`] = red;
    frame[`${i * 3 + 2}`] = green;
    frame[`${i * 3 + 3}`] = blue;
  }

  return frame;
}

main().catch(console.error);
