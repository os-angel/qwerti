import { BaseTool, type ToolResult } from "../tools/base-tool.ts";
import { type MCPClient } from "./mcp-client.ts";
import { jsonSchemaToZod } from "./schema-utils.ts";
import { z } from "zod";

export class MCPToolAdapter extends BaseTool {
    name: string;
    description: string;
    parameters: z.ZodObject<any>;

    constructor(
        private serverName: string,
        private mcpTool: any,
        private client: MCPClient
    ) {
        super();
        this.name = `mcp_${serverName}_${mcpTool.name}`;
        this.description = mcpTool.description || `MCP Tool from ${serverName}: ${mcpTool.name}`;
        this.parameters = jsonSchemaToZod(mcpTool.inputSchema || { type: "object", properties: {} });
    }

    async execute(args: any): Promise<ToolResult> {
        try {
            const result = await this.client.callTool(this.mcpTool.name, args);

            // Extract text content from parts
            const textContent = (result.content as any[])
                .filter((part: any) => part.type === "text")
                .map((part: any) => part.text)
                .join("\n");

            return {
                result: textContent || JSON.stringify(result.content, null, 2),
                isError: (result as any).isError || false,
            };
        } catch (error: any) {
            return {
                result: `MCP Error: ${error.message}`,
                isError: true,
            };
        }
    }
}
