import { z } from "zod";
import { BaseTool, type ToolResult } from "../base-tool.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export class ListDirTool extends BaseTool {
    name = "list_dir";
    description = "List the contents of a directory with basic metadata (type, size).";
    permissionLevel: "read" | "write" | "execute" = "read";

    parameters = z.object({
        path: z.string().describe("Path to the directory (absolute or relative to CWD)"),
    });

    async execute(args: { path: string }): Promise<ToolResult> {
        try {
            const absolutePath = path.isAbsolute(args.path)
                ? args.path
                : path.resolve(process.cwd(), args.path);

            const entries = await fs.readdir(absolutePath, { withFileTypes: true });
            
            const results = await Promise.all(
                entries.map(async (entry) => {
                    const entryPath = path.join(absolutePath, entry.name);
                    let size = 0;
                    if (entry.isFile()) {
                        const stats = await fs.stat(entryPath);
                        size = stats.size;
                    }
                    
                    return {
                        name: entry.name,
                        type: entry.isDirectory() ? "directory" : "file",
                        size: size > 0 ? `${(size / 1024).toFixed(2)} KB` : "N/A",
                    };
                })
            );

            const sortedResults = results.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === "directory" ? -1 : 1;
            });

            const formattedHeader = `Contents of ${absolutePath}:\n`;
            const formattedEntries = sortedResults
                .map((e) => `[${e.type.toUpperCase()}] ${e.name.padEnd(30)} ${e.size}`)
                .join("\n");

            return {
                result: formattedHeader + formattedEntries,
                isError: false,
            };
        } catch (error: any) {
            return {
                result: `Error listing directory: ${error.message}`,
                isError: true,
            };
        }
    }
}
