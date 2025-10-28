declare module "osc" {
  type UDPPortParams = {
    localAddress: string;
    localPort: number;
    metadata: boolean;
  };

  export type CueType = "go" | "cue/stop" | "cue/start" | "playhead";
  export type CueFeature = "number" | "name" | "uniqueID" | "type";
  export type QLabMessage =
    | `/qlab/event/workspace/${CueType}/${CueFeature}`
    | `/qlab/event/workspace/${CueType}`;

  export type OSCMessage = {
    address: QLabMessage;
    args: [{ type: "i"; value: string }];
  };

  class UDPPort {
    constructor(params: UDPPortParams);
    on(
      event: "message",
      callback: (oscMsg: OSCMessage, timeTag: any, info: any) => void
    ): void;
    on(event: "ready", callback: () => void): void;
    on(event: "error", callback: (message: string) => void): void;
    on(event: string, callback: (...args: any[]) => void): void;
    open(): void;
  }

  export { UDPPort };
}
