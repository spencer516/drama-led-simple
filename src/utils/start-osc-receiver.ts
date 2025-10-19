// @ts-ignore
import osc from "osc";

export default function startOSC(
  onMessage: (file: string, frame: number) => unknown
): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();

  const options = {
    localAddress: "127.0.0.1",
    localPort: 53001,
    metadata: true,
  };

  const udpPort = new osc.UDPPort(options);

  const timeout = setTimeout(
    () => reject("Timed out starting OSC server"),
    3000
  );

  udpPort.on("message", (oscMsg: osc.OSCMessage) => {
    const [frameArg, fileArg] = oscMsg.args;
    onMessage(fileArg.value, frameArg.value);
  });

  udpPort.on("error", (error: string) => {
    console.log(error);
  });

  udpPort.on("ready", () => {
    clearTimeout(timeout);
    resolve();
  });

  udpPort.open();

  return promise;
}
