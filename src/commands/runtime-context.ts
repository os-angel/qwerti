import { type GlobalConfig } from "../config/global-config.ts";
import { type WorkspaceConfig } from "../config/workspace-config.ts";
import { type ModelRegistry } from "../providers/model-registry.ts";
import { type EventBus } from "../core/event-bus.ts";
import { type Message } from "../core/types.ts";
import { type ToolRegistry } from "../tools/tool-registry.ts";
import { type MCPManager } from "../mcp/mcp-manager.ts";
import { type SkillLoader } from "../skills/skill-loader.ts";
import { type SkillRegistry } from "../skills/skill-registry.ts";
import { type SessionStore } from "../agent/session-store.ts";
import { type PluginRegistry } from "../plugins/plugin-registry.ts";
import { type ContextManager } from "../agent/context-manager.ts";

export interface RuntimeContext {
    config: GlobalConfig;
    workspaceConfig: WorkspaceConfig | null;
    modelRegistry: ModelRegistry;
    bus: EventBus;
    cwd: string;
    addMessage: (msg: any) => void;
    updateMessage: (id: string, content: string) => void;
    setProcessing: (processing: boolean) => void;

    // Core Managers
    toolRegistry: ToolRegistry;
    contextManager: ContextManager;
    mcpManager: MCPManager;
    skillLoader: SkillLoader;
    skillRegistry: SkillRegistry;
    sessionStore: SessionStore;
    pluginRegistry: PluginRegistry;
}
