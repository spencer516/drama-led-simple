declare module "osc" {
  type UDPPortParams = {
    localAddress: string;
    localPort: number;
    metadata: boolean;
  };

  export type OSCMessage = {
    address: string;
    args: [{ type: "s"; value: string }, { type: "i"; value: number }];
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
