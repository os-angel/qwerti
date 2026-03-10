import { z } from "zod";
import { BaseTool, type ToolResult } from "../base-tool.ts";

export class HFSearchTool extends BaseTool {
    name = "hf_search";
    description = "Search for GGUF models on Hugging Face (filters for GGUF by default).";
    permissionLevel: "read" = "read";

    parameters = z.object({
        query: z.string().describe("The name or keyword to search for (e.g., 'llama3', 'mistral')"),
        limit: z.number().optional().describe("Number of results to return (default: 5)"),
    });

    async execute(args: { query: string; limit?: number }): Promise<ToolResult> {
        const limit = args.limit || 5;
        // API: https://huggingface.co/api/models?search=[query]&filter=gguf&sort=downloads&direction=-1&limit=[limit]
        const url = `https://huggingface.co/api/models?search=${encodeURIComponent(args.query)}&filter=gguf&sort=downloads&direction=-1&limit=${limit}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                return { result: `Failed to fetch from HF: ${response.statusText}`, isError: true };
            }

            const models = await response.json() as any[];
            if (models.length === 0) {
                return { result: "No GGUF models found for query: " + args.query, isError: false };
            }

            const formatted = models.map((m: any) => {
                return `- **${m.id}** (Downloads: ${m.downloads})\n  *Tags: ${m.tags.slice(0, 5).join(", ")}*`;
            }).join("\n\n");

            return {
                result: `Top results for "${args.query}" (GGUF):\n\n${formatted}\n\nUse 'hf_download' to download a specific file from these repos.`,
                isError: false,
            };
        } catch (error: any) {
            return {
                result: `Error searching HF: ${error.message}`,
                isError: true,
            };
        }
    }
}
