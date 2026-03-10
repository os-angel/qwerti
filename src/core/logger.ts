import pino from "pino";
import path from "path";
import os from "os";
import fs from "fs";

const QWERTI_DIR = path.join(os.homedir(), ".qwerti");
const LOG_DIR = path.join(QWERTI_DIR, "logs");
const LOG_FILE = path.join(LOG_DIR, "qwerti.log");

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const transport = pino.transport({
    targets: [
        {
            target: "pino/file",
            options: { destination: LOG_FILE },
            level: process.env.LOG_LEVEL || "info",
        },
        ...(process.env.VERBOSE === "true"
            ? [
                {
                    target: "pino-pretty",
                    options: { colorize: true, destination: 2 }, // stderr
                    level: "debug",
                },
            ]
            : []),
    ],
});

export const logger = pino(transport);

export function createLogger(context: string) {
    return logger.child({ context });
}
