// @ts-ignore
import osc from "osc";
import { Logger } from "./render-display";

export default function startOSC(
  logger: Logger,
  onMessage: (file: string, frame: number) => unknown
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
    const [frameArg] = oscMsg.args;
    // Convert the 1-indexed frames into 0-indexed
    const frameNumber = frameArg.value - 1;
    const fileName = oscMsg.address.replace("/", "");

    if (frameNumber < 0) {
      logger.warn(`Frames should start at at least 1 [file: ${fileName}]`);
    }

    onMessage(fileName, frameNumber);
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
