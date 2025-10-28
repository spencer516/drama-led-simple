// @ts-ignore
import osc, { CueFeature, CueType } from "osc";
import { Logger } from "./render-display";

export default function startOSC(
  logger: Logger,
  onMessage: (cueType: osc.CueType, name: string) => unknown
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

  udpPort.on("message", (oscMsg: osc.OSCMessage) => {
    const [cueType, cueFeature] = oscMsg.address
      .replace("/qlab/event/workspace/", "")
      .split("/") as [CueType, CueFeature | null];

    if (cueFeature === "name") {
      const [{ value }] = oscMsg.args;

      const [_, file] = value.match(/\[LED:(\S+)\]/) ?? [];

      if (file != null) {
        onMessage(cueType, value);
      }
    }
  });

  udpPort.on("error", (error: string) => {
    console.log(error);
    logger.error("Error starting OSC server");
  });

  udpPort.on("ready", () => {
    logger.log("OSC Server Started");
    clearTimeout(timeout);
    resolve();
  });

  udpPort.open();

  return promise;
}
