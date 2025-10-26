import { Sender } from "sacn";
import { networkInterface, checkSACNSocket } from "./sacn";
import { Logger } from "./render-display";
import { Frame } from "./load-files";

type ControllerArgs = {
  startUniverse: number;
};

export default async function createOctoController(
  logger: Logger,
  { startUniverse }: ControllerArgs
): Promise<[(frame: Frame) => unknown, () => unknown]> {
  await checkSACNSocket(logger);

  logger.log(`Starting octo at universe ${startUniverse}`);

  const sender = new Sender({
    universe: startUniverse,
    iface: networkInterface,
    reuseAddr: true,
  });

  return [
    (frame: Frame) => {
      const updatedFrame: Frame = {};

      for (const [key, val] of Object.entries(frame)) {
        updatedFrame[key] = val * 1;
      }

      sender
        .send({
          payload: updatedFrame,
          sourceName: "Drama LED Server",
          priority: 200,
        })
        .catch((err: unknown) =>
          logger.error(`Error Sending SACN: ${String(err)}`)
        );
    },
    () => sender.close(),
  ];
}
