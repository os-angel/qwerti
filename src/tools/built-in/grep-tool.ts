import { z } from "zod";
import { BaseTool, type ToolResult } from "../base-tool.ts";
import fg from "fast-glob";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export class GrepTool extends BaseTool {
    name = "grep";
    description = "Search for content in files using a string or regex pattern. Returns matches with line numbers.";
    permissionLevel: "read" = "read";

    parameters = z.object({
        pattern: z.string().describe("The string or regex pattern to search for"),
        includes: z.string().optional().describe("Glob pattern for files to include (e.g. '**/*.ts')"),
        cwd: z.string().optional().describe("Root directory for search (default: current directory)"),
    });

    async execute(args: { pattern: string; includes?: string; cwd?: string }): Promise<ToolResult> {
        const cwd = args.cwd
            ? (path.isAbsolute(args.cwd) ? args.cwd : path.resolve(process.cwd(), args.cwd))
            : process.cwd();

        try {
            const pattern = new RegExp(args.pattern, "i");
            const files = await fg(args.includes || "**/*", {
                cwd,
                onlyFiles: true,
                suppressErrors: true,
                ignore: ["**/node_modules/**", "**/.git/**"],
            });

            const allMatches: string[] = [];

            for (const file of files) {
                const absolutePath = path.join(cwd, file);
                const content = await fs.readFile(absolutePath, "utf-8");
                const lines = content.split("\n");

                lines.forEach((line, index) => {
                    if (pattern.test(line)) {
                        allMatches.push(`${file}:${index + 1}: ${line.trim()}`);
                    }
                });

                if (allMatches.length > 100) break; // Limit results
            }

            if (allMatches.length === 0) {
                return { result: "No matches found.", isError: false };
            }

            return {
                result: `Found ${allMatches.length} matches${allMatches.length > 100 ? " (limited to first 100)" : ""}:\n${allMatches.join("\n")}`,
                isError: false
            };
        } catch (error: any) {
            return { result: `Error in native grep: ${error.message}`, isError: true };
        }
    }
}
