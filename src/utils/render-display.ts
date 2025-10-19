import blessed from "blessed";
import { formatBytes } from "./format-bytes";
import { JsonIndex } from "./load-files";

type DisplayContent = {
  jsonIndex: JsonIndex;
  directory: string;
  currentFile: string;
  currentFrame: number;
};

export default function createDisplay(
  getContent: () => DisplayContent,
  onQuit: () => unknown
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

  function refreshDisplay() {
    const latestContent = getContent();
    const displayText = getDisplayContent(latestContent);

    box.setContent(displayText);
    screen.render();
  }

  refreshDisplay();

  // Update memory usage every 500ms
  const interval = setInterval(refreshDisplay, 16);

  // Quit on q or Ctrl+C
  screen.key(["q", "C-c"], () => {
    onQuit();
    clearInterval(interval);
    screen.destroy();
    process.exit(0);
  });

  screen.render();
}

function getDisplayContent({
  jsonIndex,
  directory,
  currentFile,
  currentFrame,
}: DisplayContent) {
  const memUsage = process.memoryUsage();
  const heapUsed = formatBytes(memUsage.heapUsed);
  const heapTotal = formatBytes(memUsage.heapTotal);
  const rss = formatBytes(memUsage.rss);

  const loadedFiles = Object.keys(jsonIndex).join(", ") || "none";
  const memoryHeap = `${heapUsed} / ${heapTotal}`;

  return `
{bold}{cyan-fg}LED Controller Status{/cyan-fg}{/bold}

{yellow-fg}Directory:{/yellow-fg} ${directory}
{yellow-fg}Loaded Files:{/yellow-fg} ${loadedFiles}

╔════════════════════════════════════════════════════════════╗
║ {bold}Current File:{/bold}     ${currentFile.padEnd(40)} ║
║ {bold}Current Frame:{/bold}    ${currentFrame.toString().padEnd(40)} ║
║ {bold}Memory (Heap):{/bold}    ${memoryHeap.padEnd(40)} ║
║ {bold}Memory (RSS):{/bold}     ${rss.padEnd(40)} ║
╚════════════════════════════════════════════════════════════╝
{gray-fg}Press 'q' or Ctrl+C to quit{/gray-fg}
    `.trim();
}
