import { JsonIndex } from "./load-files";
import { SendToOcto } from "./octo-controller";
import { Logger } from "./render-display";

type FrameCallback = (frame: number) => unknown;

type Subscriber = {
  callback: FrameCallback;
  startFrame: number;
  totalFrames: number;
  file: string;
};

export default class FrameController {
  private subscribers: Map<string, Subscriber> = new Map();
  private running: boolean = false;
  private currentFrame = 0;
  private timer: NodeJS.Timeout | null = null;
  private readonly frameDuration = 1000 / 60;
  private nextTickTime = 0;
  private jsonIndex: JsonIndex;
  private logger: Logger;
  private sendToOcto: SendToOcto;

  constructor(jsonIndex: JsonIndex, logger: Logger, sendToOcto: SendToOcto) {
    this.jsonIndex = jsonIndex;
    this.logger = logger;
    this.sendToOcto = sendToOcto;
  }

  private loop = () => {
    if (!this.running) return;

    const now = performance.now();
    const drift = now - this.nextTickTime;

    this.currentFrame++;

    for (const subscriber of this.subscribers.values()) {
      const { callback, startFrame, totalFrames, file } = subscriber;

      const subscriberFrame = this.currentFrame - startFrame;

      if (subscriberFrame > totalFrames) {
        this.logger.log(`${file} completed`);
        this.stopSubscriber(subscriber);
      } else {
        const frame = this.currentFrame - startFrame;
        this.logger.setCurrentFile(file);
        this.logger.setCurrentFrame(frame, totalFrames);
        callback(frame);
      }
    }

    // Schedule next tick, compensating for drift
    this.nextTickTime += this.frameDuration;
    const delay = Math.max(0, this.frameDuration - drift);

    this.timer = setTimeout(this.loop, delay);
  };

  public stopFile(file: string) {
    const subscriber = this.subscribers.get(file);

    if (subscriber != null) {
      this.logger.log(`Stopping file ${file}`);
      this.stopSubscriber(subscriber);
    }
  }

  public startFile(file: string) {
    if (!(file in this.jsonIndex)) {
      this.logger.error(`No file for ${file}`);
      return;
    }

    const frameData = this.jsonIndex[file];

    this.start(file, frameData.length, (frameNumber) => {
      const frame = frameData.at(frameNumber);

      if (frame == null) {
        this.logger.warn(`No frame ${frameNumber} found for ${file}`);
      } else {
        this.sendToOcto(frame);
      }
    });
  }

  private start(
    file: string,
    totalFrames: number,
    callback: FrameCallback
  ): () => unknown {
    this.logger.log(`Starting file ${file}`);
    if (!this.running) {
      this.running = true;
      this.currentFrame = 0;
      this.nextTickTime = performance.now() + this.frameDuration;
      this.timer = setTimeout(this.loop, this.frameDuration);
    }

    const subscriber = {
      startFrame: this.currentFrame,
      file,
      callback,
      totalFrames,
    };

    this.stopFile(file);
    this.subscribers.set(file, subscriber);

    return () => {
      this.stopSubscriber(subscriber);
    };
  }

  private stopSubscriber(subscriber: Subscriber) {
    this.subscribers.delete(subscriber.file);

    if (this.subscribers.size === 0) {
      this.stopImpl();
    }
  }

  private stopImpl() {
    this.logger.setCurrentFile("[none]");
    this.logger.setCurrentFrame(0, 0);
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.currentFrame = 0;
  }
}
