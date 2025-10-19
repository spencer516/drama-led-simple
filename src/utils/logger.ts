import fs from "fs";
import path from "path";

// Create a write stream for the log file
const logFilePath = path.join(process.cwd(), "program.log");
const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

// Store the original console.log
const originalConsoleLog = console.log;

// Override console.log to write to file
console.log = (...args: any[]) => {
  const timestamp = new Date().toISOString();
  const message = args
    .map((arg) =>
      typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
    )
    .join(" ");

  logStream.write(`[${timestamp}] ${message}\n`);
};

// Ensure the stream is closed when the process exits
process.on("exit", () => {
  logStream.end();
});

process.on("SIGINT", () => {
  logStream.end();
  process.exit(0);
});

process.on("SIGTERM", () => {
  logStream.end();
  process.exit(0);
});

// Export a function to restore original console.log if needed
export const restoreConsoleLog = () => {
  console.log = originalConsoleLog;
};

export default logStream;
