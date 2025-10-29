import blessed from "blessed";
import { formatBytes } from "./format-bytes";
import { JsonIndex } from "./load-files";
import { commify } from "./commify";

type DisplayContent = {
  jsonIndex: JsonIndex;
  directory: string;
  currentFile: string;
  currentFrame: string;
};

type MessageType = "warn" | "log" | "error";
type Message = {
  type: MessageType;
  text: string;
};

export type Logger = {
  warn: (message: string) => void;
  log: (message: string) => void;
  error: (message: string) => void;
  setCurrentFile: (file: string) => void;
  setCurrentFrame: (frame: number, totalFrames: number) => void;
};

export default function createDisplay(
  directory: string,
  jsonIndex: JsonIndex,
  // getContent: () => DisplayContent,
  onQuit: () => unknown,
  onClearLEDs: () => unknown
) {
  // Create a blessed screen
  const screen = blessed.screen({
    smartCSR: true,
    title: "LED Controller",
  });

  // Create a box for the table
  const box = blessed.box({
    top: "center",
    left: "center",
    width: "90%",
    height: "90%",
    content: "",
    tags: true,
    border: {
      type: "line",
    },
    style: {
      fg: "white",
      bg: "black",
      border: {
        fg: "#f0f0f0",
      },
    },
  });

  screen.append(box);

  let lastMemoryUpdate = 0;
  let cachedMemoryUsage = process.memoryUsage();
  const messages: Message[] = [];

  let currentFile = "[none]";
  let currentFrame = "-";

  const logger: Logger = {
    warn: (message: string) => {
      messages.unshift({ type: "warn", text: message });
      if (messages.length > 10) {
        messages.pop();
      }
      refreshDisplay();
    },
    log: (message: string) => {
      messages.unshift({ type: "log", text: message });
      if (messages.length > 10) {
        messages.pop();
      }
      refreshDisplay();
    },
    error: (message: string) => {
      messages.unshift({ type: "error", text: message });
      if (messages.length > 10) {
        messages.pop();
      }
      refreshDisplay();
    },
    setCurrentFile: (file: string) => {
      currentFile = file;
      refreshDisplay();
    },
    setCurrentFrame: (number: number, totalFrames: number) => {
      currentFrame = `${commify(number)} / ${commify(totalFrames)}`;
      refreshDisplay();
    },
  };

  function refreshDisplay() {
    const now = Date.now();
    if (now - lastMemoryUpdate >= 1000) {
      cachedMemoryUsage = process.memoryUsage();
      lastMemoryUpdate = now;
    }

    const displayText = getDisplayContent(
      { directory, jsonIndex, currentFile, currentFrame },
      cachedMemoryUsage,
      messages
    );

    box.setContent(displayText);
    screen.render();
  }

  refreshDisplay();

  // Quit on q or Ctrl+C
  screen.key(["q", "C-c"], () => {
    onQuit();
    screen.destroy();
    process.exit(0);
  });

  screen.key(["c"], () => {
    onClearLEDs();
  });

  screen.render();

  return logger;
}

function getDisplayContent(
  { jsonIndex, directory, currentFile, currentFrame }: DisplayContent,
  memUsage: NodeJS.MemoryUsage,
  messages: Message[]
) {
  const heapUsed = formatBytes(memUsage.heapUsed);
  const heapTotal = formatBytes(memUsage.heapTotal);
  const rss = formatBytes(memUsage.rss);

  const loadedFiles =
    Object.keys(jsonIndex)
      .map((file) => `${file} (${jsonIndex[file].length})`)
      .join(", ") || "none";
  const memoryHeap = `${heapUsed} / ${heapTotal}`;

  const messageList = messages
    .map((msg) => {
      const prefix = formatMessagePrefix(msg.type);
      return `${prefix} ${msg.text}`;
    })
    .join("\n");

  return `
{bold}{cyan-fg}Jesuit Drama LED Controller Status{/cyan-fg}{/bold}

{yellow-fg}Directory:{/yellow-fg} ${directory}
{yellow-fg}Loaded Files:{/yellow-fg} ${loadedFiles}

╔════════════════════════════════════════════════════════════╗
║ {bold}Current File:{/bold}     ${currentFile.padEnd(40)} ║
║ {bold}Current Frame:{/bold}    ${currentFrame.padEnd(40)} ║
║ {bold}Memory (Heap):{/bold}    ${memoryHeap.padEnd(40)} ║
║ {bold}Memory (RSS):{/bold}     ${rss.padEnd(40)} ║
╚════════════════════════════════════════════════════════════╝

${messageList ? `{bold}Messages:{/bold}\n${messageList}\n` : ""}
{gray-fg}Press 'q' to quit; Press 'c' to turn off LEDs{/gray-fg}
    `.trim();
}

function formatMessagePrefix(type: MessageType): string {
  switch (type) {
    case "warn":
      return "{bold}{yellow-fg}[WARNING]{/yellow-fg}{/bold}";
    case "log":
      return "{bold}{green-fg}[LOG]{/green-fg}{/bold}";
    case "error":
      return "{bold}{red-fg}[ERROR]{/red-fg}{/bold}";
  }
}
