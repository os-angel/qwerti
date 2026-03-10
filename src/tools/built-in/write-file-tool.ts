import { z } from "zod";
import { BaseTool, type ToolResult } from "../base-tool.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export class WriteFileTool extends BaseTool {
    name = "write_file";
    description = "Create or overwrite a file with the given content.";

    parameters = z.object({
        path: z.string().describe("Path to the file (absolute or relative to CWD)"),
        content: z.string().describe("Complete content to write to the file"),
    });

    permissionLevel: "write" = "write";

    async execute(args: { path: string; content: string }): Promise<ToolResult> {
        try {
            const absolutePath = path.isAbsolute(args.path)
                ? args.path
                : path.resolve(process.cwd(), args.path);

            // Ensure directory exists
            await fs.mkdir(path.dirname(absolutePath), { recursive: true });

            await fs.writeFile(absolutePath, args.content, "utf-8");

            return {
                result: `Successfully wrote ${args.content.length} characters to ${args.path}`,
                isError: false,
            };
        } catch (error: any) {
            return {
                result: `Error writing file: ${error.message}`,
                isError: true,
            };
        }
    }
}
