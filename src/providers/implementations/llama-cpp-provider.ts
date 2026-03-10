import { BaseProvider, type ChatRequest, type StreamChunk } from "../base-provider.ts";

export class LlamaCppProvider extends BaseProvider {
    name: string;
    type = "llama-cpp" as const;
    private baseUrl: string;
    private modelId: string;
    private apiKey?: string;

    constructor(config: { name: string; baseUrl: string; model: string; apiKey?: string }) {
        super();
        this.name = config.name;
        this.baseUrl = config.baseUrl;
        this.modelId = config.model;
        this.apiKey = config.apiKey;
    }

    async *chat(request: ChatRequest): AsyncGenerator<StreamChunk> {
        const messages: any[] = [];

        if (request.systemPrompt) {
            messages.push({ role: "system", content: request.systemPrompt });
        }

        for (const m of request.messages) {
            if (m.role === "user") {
                messages.push({ role: "user", content: m.content });
            } else if (m.role === "assistant") {
                const msg: any = { role: "assistant", content: m.content || "" };
                if (m.toolCalls && m.toolCalls.length > 0) {
                    msg.tool_calls = m.toolCalls.map(tc => ({
                        id: tc.id,
                        type: "function",
                        function: {
                            name: tc.name,
                            arguments: typeof tc.args === "string" ? tc.args : JSON.stringify(tc.args),
                        },
                    }));
                }
                messages.push(msg);
            } else if (m.role === "tool" && m.toolResults) {
                for (const tr of m.toolResults) {
                    messages.push({
                        role: "tool",
                        tool_call_id: tr.callId,
                        content: tr.result,
                    });
                }
            }
        }

        const body: any = {
            model: this.modelId,
            messages,
            stream: true,
            temperature: request.temperature ?? 0.1,
            max_tokens: request.maxTokens ?? 4096,
        };

        if (request.tools && request.tools.length > 0) {
            body.tools = request.tools;
            body.tool_choice = "auto";
        }

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (this.apiKey) {
            // Azure OpenAI specifically uses api-key, fully compliant proxies use Bearer
            if (this.baseUrl.includes("openai.azure.com")) {
                headers["api-key"] = this.apiKey;
            } else {
                headers["Authorization"] = `Bearer ${this.apiKey}`;
            }
        }

        try {
            let url = "";

            const base = this.baseUrl.replace(/\/$/, "");
            if (this.baseUrl.includes("openai.azure.com")) {
                // Remove /v1 if accidentally included by user for raw azure proxy
                const cleanBase = base.replace(/\/v1$/, "");
                url = `${cleanBase}/openai/deployments/${this.modelId}/chat/completions?api-version=2024-02-15-preview`;
            } else if (base.endsWith("/v1")) {
                // Endpoint already includes /v1 (e.g., Databricks or Azure Foundry proxies)
                url = `${base}/chat/completions`;
            } else {
                url = `${base}/v1/chat/completions`;
            }

            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                signal: request.signal,
            });

            if (!response.ok) {
                throw new Error(`llama-cpp error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) return;

            const decoder = new TextDecoder();
            let buffer = "";

            const pendingToolCalls = new Map<number, {
                id: string;
                name: string;
                arguments: string;
            }>();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === "[DONE]") break;

                        try {
                            const data = JSON.parse(dataStr);
                            const delta = data.choices[0]?.delta;

                            if (delta?.content) {
                                const contentStr = typeof delta.content === 'string'
                                    ? delta.content
                                    : JSON.stringify(delta.content);
                                yield { type: "text", content: contentStr };
                            }

                            if (delta?.tool_calls) {
                                for (const tc of delta.tool_calls) {
                                    const index = tc.index ?? 0;

                                    if (!pendingToolCalls.has(index)) {
                                        pendingToolCalls.set(index, {
                                            id: tc.id || `call_${Math.random().toString(36).substring(7)}`,
                                            name: tc.function?.name || "",
                                            arguments: tc.function?.arguments || "",
                                        });
                                    } else {
                                        const existing = pendingToolCalls.get(index)!;
                                        if (tc.function?.arguments) {
                                            existing.arguments += tc.function.arguments;
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            // Ignore parse errors from partial chunks
                        }
                    }
                }
            }

            for (const [_, tc] of pendingToolCalls) {
                try {
                    const parsedArgs = JSON.parse(tc.arguments);
                    yield {
                        type: "tool_call",
                        toolCall: {
                            id: tc.id,
                            name: tc.name,
                            args: parsedArgs,
                        },
                    };
                } catch (parseErr) {
                    yield {
                        type: "error",
                        error: `Failed to parse tool call arguments for ${tc.name}: ${tc.arguments}`,
                    };
                }
            }

        } catch (error: any) {
            if (error.name === "AbortError") return;
            yield { type: "error", error: error.message };
        }
    }

    async listModels(): Promise<string[]> {
        if (this.baseUrl.includes("openai.azure.com") || this.baseUrl.includes("databricks") || this.baseUrl.includes("mcpfabric")) {
            return [this.modelId];
        }
        try {
            const base = this.baseUrl.replace(/\/$/, "");
            const res = await fetch(`${base}/v1/models`);
            const data = await res.json() as { data: any[] };
            return data.data.map((m: any) => m.id);
        } catch {
            return [this.modelId];
        }
    }

    async healthCheck(): Promise<boolean> {
        if (this.baseUrl.includes("openai.azure.com") || this.baseUrl.includes("databricks") || this.baseUrl.includes("mcpfabric")) {
            return true;
        }
        try {
            const base = this.baseUrl.replace(/\/$/, "");
            // If it identifies as ollama (usually port 11434), try their native tags API first
            if (this.baseUrl.includes(":11434")) {
                const res = await fetch(`${base}/api/tags`);
                if (res.ok) return true;
            }
            const res = await fetch(`${base}/v1/models`);
            return res.ok;
        } catch {
            return false;
        }
    }
}
