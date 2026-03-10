import { z } from "zod";
import { BaseTool, type ToolResult } from "../base-tool.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export class EditFileTool extends BaseTool {
    name = "edit_file";
    description = "Edit a file by replacing a specific string (old_string) with a new string (new_string). The 'old_string' must be unique in the file to avoid unintended changes.";
    permissionLevel: "write" = "write";

    parameters = z.object({
        path: z.string().describe("Path to the file to edit"),
        old_string: z.string().describe("The exact text to replace"),
        new_string: z.string().describe("The text to replace it with"),
    });

    async execute(args: { path: string; old_string: string; new_string: string }): Promise<ToolResult> {
        try {
            const absolutePath = path.isAbsolute(args.path)
                ? args.path
                : path.resolve(process.cwd(), args.path);

            const content = await fs.readFile(absolutePath, "utf-8");

            // Check for uniqueness of old_string
            const occurrences = content.split(args.old_string).length - 1;

            if (occurrences === 0) {
                return {
                    result: `Error: 'old_string' not found in file: ${args.path}`,
                    isError: true,
                };
            }

            if (occurrences > 1) {
                return {
                    result: `Error: 'old_string' is not unique in file: ${args.path}. It appears ${occurrences} times. Please provide a more specific string.`,
                    isError: true,
                };
            }

            const newContent = content.replace(args.old_string, args.new_string);
            await fs.writeFile(absolutePath, newContent, "utf-8");

            return {
                result: `Successfully edited file: ${args.path}`,
                isError: false,
            };
        } catch (error: any) {
            return {
                result: `Error editing file: ${error.message}`,
                isError: true,
            };
        }
    }
}
