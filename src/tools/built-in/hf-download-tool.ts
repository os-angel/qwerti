import { z } from "zod";
import { BaseTool, type ToolResult } from "../base-tool.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import os from "node:os";

export class HFDownloadTool extends BaseTool {
    name = "hf_download";
    description = "Download a model file (GGUF) from Hugging Face. Requires the repo ID and file name.";
    permissionLevel: "write" = "write";

    parameters = z.object({
        repoId: z.string().describe("The repository ID (e.g., 'bartowski/Llama-3.2-1B-Instruct-GGUF')"),
        filename: z.string().describe("The specific GGUF file to download"),
        savePath: z.string().optional().describe("Local path to save the file (default: ~/.qwerti/models)"),
    });

    async execute(args: { repoId: string; filename: string; savePath?: string }): Promise<ToolResult> {
        const modelsDir = args.savePath || path.join(os.homedir(), ".qwerti", "models");

        try {
            await fs.mkdir(modelsDir, { recursive: true });
            const targetPath = path.join(modelsDir, args.filename);

            // Check if file exists
            try {
                await fs.access(targetPath);
                return { result: `File already exists at ${targetPath}`, isError: false };
            } catch {
                // Not found, continue
            }

            const url = `https://huggingface.co/${args.repoId}/resolve/main/${args.filename}`;
            console.log(`Downloading from ${url}...`);

            const response = await fetch(url);
            if (!response.ok) {
                return { result: `Failed to download: ${response.statusText} (${response.status})`, isError: true };
            }

            // Write to file using Bun
            await Bun.write(targetPath, response);

            return {
                result: `Successfully downloaded model to: ${targetPath}`,
                isError: false,
            };
        } catch (error: any) {
            return {
                result: `Error during HF download: ${error.message}`,
                isError: true,
            };
        }
    }
}
