import { type BaseTool, type ToolDefinition, type ToolResult } from "./base-tool.ts";

export class ToolRegistry {
    private tools: Map<string, BaseTool> = new Map();

    register(tool: BaseTool): void {
        this.tools.set(tool.name, tool);
    }

    get(name: string): BaseTool | undefined {
        return this.tools.get(name);
    }

    async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
        const tool = this.tools.get(name);
        if (!tool) {
            return { result: `Unknown tool: ${name}`, isError: true };
        }

        try {
            const parsed = tool.parameters.safeParse(args);
            if (!parsed.success) {
                return {
                    result: `Invalid arguments for tool ${name}: ${parsed.error.message}`,
                    isError: true,
                };
            }
            return await tool.execute(parsed.data);
        } catch (error: any) {
            return {
                result: `Error executing tool ${name}: ${error.message}`,
                isError: true,
            };
        }
    }

    getToolDefinitions(): ToolDefinition[] {
        return Array.from(this.tools.values()).map(t => t.toDefinition());
    }

    list(): Array<{ name: string; description: string }> {
        return Array.from(this.tools.values()).map(t => ({
            name: t.name,
            description: t.description,
        }));
    }
}
