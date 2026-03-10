import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { logger } from "../core/logger.ts";

export interface MCPServerConfig {
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
}

export class MCPClient {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private tools: any[] = [];
    private connected: boolean = false;

    constructor(public config: MCPServerConfig) { }

    async connect(): Promise<void> {
        try {
            this.transport = new StdioClientTransport({
                command: this.config.command,
                args: this.config.args ?? [],
                env: { ...(process.env as Record<string, string>), ...this.config.env },
            });

            this.client = new Client({
                name: "qwerti-client",
                version: "0.1.0",
            }, {
                capabilities: {},
            });

            await this.client.connect(this.transport);
            this.connected = true;

            const { tools } = await this.client.listTools();
            this.tools = tools;

            logger.info({ server: this.config.name, toolCount: this.tools.length }, "Connected to MCP server");
        } catch (error: any) {
            this.connected = false;
            logger.error({ server: this.config.name, error: error.message }, "Failed to connect to MCP server");
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
        }
        this.connected = false;
    }

    getTools() {
        return this.tools;
    }

    async callTool(name: string, args: Record<string, any>) {
        if (!this.client) throw new Error("MCP Client not connected");

        const result = await this.client.callTool({
            name,
            arguments: args,
        });

        return result;
    }

    isConnected() {
        return this.connected;
    }
}
