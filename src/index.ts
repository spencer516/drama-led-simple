import "./utils/logger"; // Must be first to redirect console.log
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import loadJsonFiles from "./utils/load-files";
import createDisplay from "./utils/render-display";
import startOSC from "./utils/start-osc-receiver";

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
  let currentFile = "none";
  let currentFrame = 0;

  await startOSC((file, frame) => {
    console.log("", { file, frame });
    currentFile = file;
    currentFrame = frame;
  });

  createDisplay(
    () => ({
      currentFile,
      currentFrame,
      jsonIndex,
      directory,
    }),
    () => {
      console.log("exiting...");
    }
  );
}

main().catch(console.error);
