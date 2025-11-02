// @ts-ignore
import osc from "osc";
import { Logger } from "./render-display";
import { Filename, makeFile } from "./frame-controller";

type Params = {
  logger: Logger;
  onPlayCue: (file: Filename) => unknown;
  onStopCue: (file: Filename) => unknown;
  onPauseCue: (file: Filename) => unknown;
  onHardStop: () => unknown;
};

export default function startOSC({
  logger,
  onPlayCue,
  onStopCue,
  onPauseCue,
  onHardStop,
}: Params): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();

  const options = {
    localAddress: "127.0.0.1",
    localPort: 53000,
    metadata: true,
  };

  const udpPort = new osc.TCPSocketPort(options);

  const timeout = setTimeout(() => {
    logger.error("Timed out starting OSC server");
    reject("Timed out starting OSC server");
  }, 3000);

  const hardStopCues = ["pauseAll", "panicAll", "stopAll", "hardStopAll"];

  udpPort.on("message", (oscMsg: osc.OSCMessage) => {
    const trigger = oscMsg.address.replace("/qlab/event/workspace/", "");

    if (hardStopCues.includes(trigger)) {
      onHardStop();
      return;
    }

    // Nothing that isn't triggering a cue, we ignore.
    if (trigger !== "cue/start") {
      return;
    }

    const maybeFile = oscMsg.args.at(1)?.value ?? "";
    const cueType = oscMsg.args.at(3)?.value;
    const [_, file] = maybeFile.match(/(\S+)\.mp4/) ?? [];

    // If there's no file in the cue name, we ignore
    if (file == null) {
      return;
    }

    const typedFile = makeFile(file);

    if (cueType === "Video") {
      onPlayCue(typedFile);
    } else if (cueType === "Pause") {
      onPauseCue(typedFile);
    } else if (cueType === "Stop") {
      onStopCue(typedFile);
    }
  });

  udpPort.on("error", (error: string) => {
    logger.error(`Error starting OSC server: ${error}`);
  });

  udpPort.on("ready", () => {
    udpPort.send(
      {
        address: "/listen",
        args: [],
      },
      "127.0.0.1",
      53000
    );
    logger.log("OSC Server Started");
    clearTimeout(timeout);
    resolve();
  });

  udpPort.open();

  return promise;
}
