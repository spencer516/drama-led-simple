import { Sender } from "sacn";
import { networkInterface, checkSACNSocket } from "./sacn";
import { Logger } from "./render-display";
import { Frame } from "./load-files";

type ControllerArgs = {
  startUniverse: number;
  brightnessFactor: number;
};

type OctoFrame = {
  [frame: string]: number;
};

export type SendToOcto = (frame: Frame) => unknown;

export default async function createOctoController(
  logger: Logger,
  { startUniverse, brightnessFactor }: ControllerArgs
): Promise<[SendToOcto, () => unknown]> {
  const brightnessFactorClamped = Math.max(Math.min(brightnessFactor, 1), 0);
  // TODO: Put this back!!
  await checkSACNSocket(logger);

  logger.log(`Starting octo at universe ${startUniverse}`);

  const sender = new Sender({
    universe: startUniverse,
    iface: networkInterface,
    reuseAddr: true,
  });

  return [
    (frame: Frame) => {
      const octoFrame: OctoFrame = {};

      for (let channel = 0; channel < frame.length; channel++) {
        // Octo Frames are 1-indexed
        octoFrame[`${channel + 1}`] =
          (frame.at(channel) as number) * brightnessFactorClamped;
      }

      sender
        .send({
          payload: octoFrame,
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
