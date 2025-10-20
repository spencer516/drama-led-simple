import { createSocket } from "dgram";
import { Logger } from "./render-display";

export const networkInterface = "192.168.1.199";

export function checkSACNSocket(logger: Logger): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const socket = createSocket({ type: "udp4", reuseAddr: true });
    socket.bind(5568, () => {
      try {
        socket.setMulticastInterface(networkInterface);
        logger.log(`SACN Interface is live at ${networkInterface}`);
        resolve(true);
      } catch (err) {
        logger.error(`Failed to bind to SACN at ${networkInterface}`);
        reject(err);
      } finally {
        socket.close();
      }
    });
  });
}
