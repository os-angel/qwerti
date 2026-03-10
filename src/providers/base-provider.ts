import { type Message, type ProviderConfig, type ToolCall } from "../core/types.ts";

export interface StreamChunk {
    type: "text" | "tool_call" | "done" | "error";
    content?: string;
    toolCall?: ToolCall;
    error?: string;
    usage?: { promptTokens: number; completionTokens: number };
}

export interface ChatRequest {
    messages: Message[];
    tools?: any[]; // Replaced ToolDefinition[] until Phase 3
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    signal?: AbortSignal;
}

export abstract class BaseProvider {
    abstract name: string;
    abstract type: ProviderConfig["type"];

    abstract chat(request: ChatRequest): AsyncGenerator<StreamChunk>;
    abstract listModels(): Promise<string[]>;
    abstract healthCheck(): Promise<boolean>;

    getInfo() {
        return {
            name: this.name,
            type: this.type,
        };
    }
}
