import { z } from "zod";
import { BaseTool, type ToolResult } from "../base-tool.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export class ReadFileTool extends BaseTool {
    name = "read_file";
    description = "Read the contents of a file. Returns the content with line numbers.";

    parameters = z.object({
        path: z.string().describe("Path to the file (absolute or relative to CWD)"),
        startLine: z.number().optional().describe("Line number to start from (1-based)"),
        endLine: z.number().optional().describe("Line number to end at (inclusive)"),
    });

    async execute(args: { path: string; startLine?: number; endLine?: number }): Promise<ToolResult> {
        try {
            const absolutePath = path.isAbsolute(args.path)
                ? args.path
                : path.resolve(process.cwd(), args.path);

            const content = await fs.readFile(absolutePath, "utf-8");
            const lines = content.split("\n");

            const start = (args.startLine ?? 1) - 1;
            const end = args.endLine ?? lines.length;

            const slicedLines = lines.slice(start, end);
            const formatted = slicedLines.map((line, i) => `${start + i + 1} | ${line}`).join("\n");

            return {
                result: formatted,
                isError: false,
            };
        } catch (error: any) {
            return {
                result: `Error reading file: ${error.message}`,
                isError: true,
            };
        }
    }
}
