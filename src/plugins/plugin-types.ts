import { type GlobalConfig } from "../config/global-config.ts";
import { type WorkspaceConfig } from "../config/workspace-config.ts";
import { type EventBus } from "../core/event-bus.ts";
import { type ToolRegistry } from "../tools/tool-registry.ts";
import { type Message, type ToolResult } from "../core/types.ts";
import { type BaseTool } from "../tools/base-tool.ts";
import { type BaseCommand } from "../commands/base-command.ts";

export interface PluginInput {
    config: GlobalConfig;
    workspaceConfig: WorkspaceConfig | null;
    bus: EventBus;
    toolRegistry: ToolRegistry;
    cwd: string;
}

export interface PluginHooks {
    onInit?: () => Promise<void>;
    beforeChat?: (messages: Message[]) => Promise<Message[]>;
    afterChat?: (response: Message) => Promise<Message>;
    beforeToolExecution?: (name: string, args: Record<string, unknown>) => Promise<{
        name: string;
        args: Record<string, unknown>;
        skip?: boolean;
    }>;
    afterToolExecution?: (name: string, result: ToolResult) => Promise<ToolResult>;
    onModelChange?: (provider: string, model: string) => Promise<void>;
    onSessionCreate?: (sessionId: string) => Promise<void>;
    registerTools?: () => BaseTool[];
    registerCommands?: () => BaseCommand[];
    onShutdown?: () => Promise<void>;
}

export type PluginFactory = (input: PluginInput) => Promise<PluginHooks>;

export interface PluginManifest {
    name: string;
    version: string;
    description: string;
    author?: string;
    main: string;
    dependencies?: Record<string, string>;
}
