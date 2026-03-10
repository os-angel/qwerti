export interface Message {
    id: string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    timestamp: number;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
}

export interface ToolCall {
    id: string;
    name: string;
    args: Record<string, unknown>;
}

export interface ToolResult {
    callId: string;
    name: string;
    result: string;
    isError: boolean;
}

export interface ProviderConfig {
    name: string;
    type: "ollama" | "azure" | "bedrock" | "vertex" | "databricks" | "llama-cpp" | "custom";
    model: string;
    baseUrl?: string;
    apiKey?: string;
    region?: string;         // Para Bedrock/Vertex
    projectId?: string;      // Para Vertex
    endpoint?: string;       // Para Azure/Databricks
    deploymentName?: string; // Para Azure
    extraHeaders?: Record<string, string>;
}

export interface SessionMeta {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    model: string;
    provider: string;
    messageCount: number;
}

export type AgentMode = "build" | "plan" | "research";
