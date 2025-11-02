import { JsonIndex } from "./load-files";
import { SendToOcto } from "./octo-controller";
import { ActiveCue, Logger } from "./render-display";

type FrameCallback = (frame: number) => unknown;

type Brand<K, T> = K & { __brand: T };

export type Filename = Brand<string, "Filename">;

export function makeFile(filename: string): Filename {
  return filename as Filename;
}

type Subscriber = {
  callback: FrameCallback;
  startFrame: number;
  totalFrames: number;
  file: Filename;
  currentFrame: number;
};

export default class FrameController {
  private subscribers: Map<Filename, Subscriber> = new Map();
  private pausedFiles: Map<Filename, Subscriber> = new Map();
  private running: boolean = false;
  private currentGlobalFrame = 0;
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

    this.currentGlobalFrame++;

    for (const subscriber of this.subscribers.values()) {
      const { callback, startFrame, totalFrames, file } = subscriber;

      const subscriberFrame = this.currentGlobalFrame - startFrame;

      if (subscriberFrame > totalFrames) {
        this.logger.log(`${file} completed`);
        this.stopSubscriber(subscriber);
      } else {
        const frame = this.currentGlobalFrame - startFrame;
        subscriber.currentFrame = frame;
        callback(frame);
      }
    }

    this.logState();

    // Schedule next tick, compensating for drift
    this.nextTickTime += this.frameDuration;
    const delay = Math.max(0, this.frameDuration - drift);

    this.timer = setTimeout(this.loop, delay);
  };

  private logState() {
    const activeCues: ActiveCue[] = [];

    for (const {
      file,
      currentFrame,
      totalFrames,
    } of this.subscribers.values()) {
      activeCues.push({
        file,
        state: "running",
        currentFrame,
        totalFrames,
      });
    }

    for (const [file, { currentFrame, totalFrames }] of this.pausedFiles) {
      activeCues.push({
        file,
        state: "paused",
        currentFrame,
        totalFrames,
      });
    }

    this.logger.setActiveCues(activeCues);
  }

  public stopAll() {
    for (const subscriber of this.subscribers.values()) {
      this.stopSubscriber(subscriber);
    }

    this.pausedFiles.clear();
  }

  public pauseFile(file: Filename) {
    const subscriber = this.subscribers.get(file);

    if (subscriber == null) {
      this.logger.warn(`No active cue for ${file}`);
      return;
    }

    this.pausedFiles.set(file, subscriber);
    this.logger.log(`Pausing file ${subscriber.file}`);
    this.stopSubscriber(subscriber);
  }

  public stopFile(file: Filename) {
    const subscriber = this.subscribers.get(file);

    if (subscriber != null) {
      this.logger.log(`Stopping file ${subscriber.file}`);
      this.stopSubscriber(subscriber);
    }

    // Remove from paused if it exists.
    if (this.pausedFiles.has(file)) {
      this.logger.log(`Stopping file ${file}`);
      this.pausedFiles.delete(file);
    }
  }

  public startFile(file: Filename) {
    if (!(file in this.jsonIndex)) {
      this.logger.error(`No file for ${file}`);
      return;
    }

    const frameData = this.jsonIndex[file];

    this.start(file, frameData.length - 1, (frameNumber) => {
      const frame = frameData.at(frameNumber);

      if (frame == null) {
        this.logger.warn(`No frame ${frameNumber} found for ${file}`);
      } else {
        this.sendToOcto(frame);
      }
    });
  }

  private start(file: Filename, totalFrames: number, callback: FrameCallback) {
    this.logger.log(`Starting file ${file}`);

    if (this.subscribers.has(file)) {
      this.stopFile(file);
    }

    const currentFrame = this.pausedFiles.get(file)?.currentFrame ?? 0;

    this.pausedFiles.delete(file);

    if (!this.running) {
      this.running = true;
      this.currentGlobalFrame = 0;
      this.nextTickTime = performance.now() + this.frameDuration;
      this.timer = setTimeout(this.loop, this.frameDuration);
    }

    const subscriber = {
      startFrame: this.currentGlobalFrame - currentFrame,
      file,
      callback,
      totalFrames,
      currentFrame: currentFrame,
    };

    this.subscribers.set(file, subscriber);
  }

  private stopSubscriber(subscriber: Subscriber) {
    this.subscribers.delete(subscriber.file);

    if (this.subscribers.size === 0) {
      this.stopImpl();
    }
  }

  private stopImpl() {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.currentGlobalFrame = 0;
    this.logState();
  }
}
