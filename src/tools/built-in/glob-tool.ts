import { z } from "zod";
import { BaseTool, type ToolResult } from "../base-tool.ts";
import fg from "fast-glob";
import * as path from "node:path";

export class GlobTool extends BaseTool {
    name = "glob";
    description = "Search for files using glob patterns (e.g. '**/*.ts'). Returns relative paths.";
    permissionLevel: "read" = "read";

    parameters = z.object({
        pattern: z.string().describe("The glob pattern to search for"),
        cwd: z.string().optional().describe("Root directory for search (default: current directory)"),
    });

    async execute(args: { pattern: string; cwd?: string }): Promise<ToolResult> {
        try {
            const cwd = args.cwd
                ? (path.isAbsolute(args.cwd) ? args.cwd : path.resolve(process.cwd(), args.cwd))
                : process.cwd();

            const files = await fg(args.pattern, {
                cwd,
                onlyFiles: true,
                suppressErrors: true,
            });

            if (files.length === 0) {
                return {
                    result: `No files found matching pattern: ${args.pattern}`,
                    isError: false,
                };
            }

            return {
                result: `Found ${files.length} files:\n${files.join("\n")}`,
                isError: false,
            };
        } catch (error: any) {
            return {
                result: `Error in glob search: ${error.message}`,
                isError: true,
            };
        }
    }
}
