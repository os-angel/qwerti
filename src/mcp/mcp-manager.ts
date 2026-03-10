import { MCPClient, type MCPServerConfig } from "./mcp-client.ts";
import { MCPToolAdapter } from "./mcp-tool-adapter.ts";
import { type EventBus } from "../core/event-bus.ts";
import { type ToolRegistry } from "../tools/tool-registry.ts";

export class MCPManager {
    private clients: Map<string, MCPClient> = new Map();

    constructor(private bus: EventBus, private registry: ToolRegistry) { }

    async addServer(config: MCPServerConfig): Promise<void> {
        const client = new MCPClient(config);
        await client.connect();
        this.clients.set(config.name, client);

        // Register tools in the global registry
        const tools = client.getTools();
        for (const tool of tools) {
            const adapter = new MCPToolAdapter(config.name, tool, client);
            this.registry.register(adapter);
        }

        this.bus.emit("error", { message: `Connected to MCP server: ${config.name} (${tools.length} tools)` });
    }

    async removeServer(name: string): Promise<void> {
        const client = this.clients.get(name);
        if (client) {
            await client.disconnect();
            this.clients.delete(name);
            // Note: In a full implementation, we should also remove tools from the registry.
            // For now, they will just fail if called.
        }
    }

    listServers() {
        return Array.from(this.clients.values()).map(c => ({
            name: c.config.name,
            connected: c.isConnected(),
            toolCount: c.getTools().length,
            tools: c.getTools().map((t: any) => t.name),
        }));
    }

    async shutdown() {
        for (const client of this.clients.values()) {
            await client.disconnect();
        }
        this.clients.clear();
    }
}
