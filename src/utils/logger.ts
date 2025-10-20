import fs from "fs";
import path from "path";

// Find the project root by looking for package.json
const findProjectRoot = (startDir: string): string => {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, "package.json"))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  // Fallback to current working directory if package.json not found
  return process.cwd();
};

// Create a write stream for the log file at project root
const projectRoot = findProjectRoot(__dirname);
const logFilePath = path.join(projectRoot, "program.log");
const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

// Store the original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  trace: console.trace,
};

// Helper function to format arguments
const formatArgs = (args: any[]): string => {
  return args
    .map((arg) => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack}`;
      }
      return typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg);
    })
    .join(" ");
};

// Helper function to write to log
const writeToLog = (level: string, args: any[]) => {
  const timestamp = new Date().toISOString();
  const message = formatArgs(args);
  logStream.write(`[${timestamp}] [${level}] ${message}\n`);
};

// Override console.log
console.log = (...args: any[]) => {
  writeToLog("LOG", args);
};

// Override console.error
console.error = (...args: any[]) => {
  writeToLog("ERROR", args);
};

// Override console.warn
console.warn = (...args: any[]) => {
  writeToLog("WARN", args);
};

// Override console.info
console.info = (...args: any[]) => {
  writeToLog("INFO", args);
};

// Override console.debug
console.debug = (...args: any[]) => {
  writeToLog("DEBUG", args);
};

// Override console.trace
console.trace = (...args: any[]) => {
  const stack = new Error().stack || "";
  writeToLog("TRACE", [...args, "\n" + stack]);
};

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  const timestamp = new Date().toISOString();
  logStream.write(
    `[${timestamp}] [FATAL] Uncaught Exception: ${error.name}: ${error.message}\n${error.stack}\n`
  );
  logStream.end(() => {
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any) => {
  const timestamp = new Date().toISOString();
  const message =
    reason instanceof Error
      ? `${reason.name}: ${reason.message}\n${reason.stack}`
      : String(reason);
  logStream.write(
    `[${timestamp}] [FATAL] Unhandled Promise Rejection: ${message}\n`
  );
});

// Ensure the stream is closed when the process exits
process.on("exit", () => {
  logStream.end();
});

process.on("SIGINT", () => {
  const timestamp = new Date().toISOString();
  logStream.write(`[${timestamp}] [INFO] Process terminated by SIGINT\n`);
  logStream.end();
  process.exit(0);
});

process.on("SIGTERM", () => {
  const timestamp = new Date().toISOString();
  logStream.write(`[${timestamp}] [INFO] Process terminated by SIGTERM\n`);
  logStream.end();
  process.exit(0);
});

// Export a function to restore original console methods if needed
export const restoreConsole = () => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
  console.trace = originalConsole.trace;
};

export default logStream;
