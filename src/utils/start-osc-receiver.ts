// @ts-ignore
import osc, { CueFeature, CueType } from "osc";
import { Logger } from "./render-display";

export default function startOSC(
  logger: Logger,
  onGoCue: (args: { file: string; id: string }) => unknown,
  onStopCue: (args: { id: string }) => unknown,
  onHardStop: () => unknown
): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();

  const options = {
    localAddress: "127.0.0.1",
    localPort: 53001,
    metadata: true,
  };

  const udpPort = new osc.UDPPort(options);

  const timeout = setTimeout(() => {
    logger.error("Timed out starting OSC server");
    reject("Timed out starting OSC server");
  }, 3000);

  const goCues = ["go", "auditionGo"];
  const hardStopCues = ["pauseAll", "panicAll", "stopAll", "hardStopAll"];
  const stopCues = ["cue/stop"];

  udpPort.on("message", (oscMsg: osc.OSCMessage) => {
    const cueType = oscMsg.address.replace("/qlab/event/workspace/", "");

    if (hardStopCues.includes(cueType)) {
      onHardStop();
    } else if (goCues.includes(cueType)) {
      const maybeFile = oscMsg.args.at(1)?.value ?? "";
      const id = oscMsg.args.at(2)?.value;

      const [_, file] = maybeFile.match(/(\S+)\.mp4/) ?? [];

      if (file != null && id != null) {
        onGoCue({ file, id });
      }
    } else if (stopCues.includes(cueType)) {
      const id = oscMsg.args.at(2)?.value;
      if (id != null) {
        onStopCue({ id });
      }
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
