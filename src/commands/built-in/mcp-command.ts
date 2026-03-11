import { BaseCommand, type CommandResult } from "../base-command.ts";
import { type RuntimeContext } from "../runtime-context.ts";

export class MCPCommand extends BaseCommand {
    name = "mcp";
    description = "List connected MCP servers and their tools";

    async execute(args: string, ctx: RuntimeContext): Promise<CommandResult> {
        const servers = ctx.mcpManager.listServers();

        if (args.trim() === "list") {
            if (servers.length === 0) {
                return {
                    type: "message",
                    content: "No active MCP servers. Use '/add mcp' to connect one."
                };
            }
            const lines = servers.map(s =>
                `${s.connected ? "✅" : "❌"} ${s.name} (${s.toolCount} tools: ${s.tools.join(", ")})`
            );
            return {
                type: "message",
                content: `Connected MCP Servers:\n${lines.join("\n")}`
            };
        }

        // Default behavior: interactive UI
        return {
            type: "component",
            componentName: "mcp-selector",
        };
    }
}
