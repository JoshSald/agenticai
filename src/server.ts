import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

import { app } from "./app";

const PORT = process.env.PORT || 3000;

const logsDir = path.join(process.cwd(), "logs");
const logFile = path.join(logsDir, "server.log");
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch {}

const writeLog = (level: "log" | "warn" | "error", args: any[]) => {
  try {
    const ts = new Date().toISOString();
    const line =
      `[${ts}] ${level.toUpperCase()}: ` +
      args
        .map((a) => {
          try {
            return typeof a === "string" ? a : JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(" ") +
      "\n";
    fs.appendFileSync(logFile, line);
  } catch {}
};

const originalLog = console.log.bind(console);
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

console.log = (...args: any[]) => {
  writeLog("log", args);
  originalLog(...args);
};
console.warn = (...args: any[]) => {
  writeLog("warn", args);
  originalWarn(...args);
};
console.error = (...args: any[]) => {
  writeLog("error", args);
  originalError(...args);
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
