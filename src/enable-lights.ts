#!/usr/bin/env node
import blessed from "blessed";
import createOctoController from "./utils/octo-controller";

async function main() {
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
  };

  const sendToOcto = await createOctoController(logger, {
    startUniverse: 1200,
  });

  sendToOcto({
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
}

main().catch(console.error);
