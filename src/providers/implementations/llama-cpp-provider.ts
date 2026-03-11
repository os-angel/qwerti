import { BaseProvider, type ChatRequest, type StreamChunk } from "../base-provider.ts";
import { logger } from "../../core/logger.ts";

export class LlamaCppProvider extends BaseProvider {
    name: string;
    type = "llama-cpp" as const;
    providerType: string;
    private baseUrl: string;
    private modelId: string;
    private apiKey?: string;

    constructor(config: { name: string; type?: string; baseUrl: string; model: string; apiKey?: string }) {
        super();
        this.name = config.name;
        this.providerType = config.type || "llama-cpp";
        this.baseUrl = config.baseUrl;
        this.modelId = config.model;
        this.apiKey = config.apiKey;
    }

    async *chat(request: ChatRequest): AsyncGenerator<StreamChunk> {
        const messages: any[] = [];
        if (request.systemPrompt) {
            messages.push({ role: "system", content: request.systemPrompt });
        }

        const isLocal = this.baseUrl.includes(":11434") || 
                       this.baseUrl.includes("localhost") || 
                       this.baseUrl.includes("127.0.0.1") ||
                       this.providerType === "ollama";

        const isCloudType = ["azure", "databricks", "vertex", "bedrock"].includes(this.providerType);

        let prunedMessages = request.messages;
        if (isLocal && !isCloudType) {
            prunedMessages = request.messages.slice(-5); // Keep slightly more for context
        }

        for (const m of prunedMessages) {
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
                    let res = tr.result;
                    if (tr.name === "list_dir" && isLocal && !isCloudType) {
                        const lines = res.split("\n");
                        const itemCount = lines.filter(line => line.trim().startsWith("[DIRECTORY]") || line.trim().startsWith("[FILE]")).length;
                        if (itemCount > 0) {
                            res = `[DIR_SUMMARY: ${itemCount} items]\n\n${res}`;
                        }
                    }
                    messages.push({
                        role: "tool",
                        tool_call_id: tr.callId,
                        content: res,
                    });
                }
            } else if (m.role === "tool" && (m as any).content) {
                // Fallback for when content is provided directly
                messages.push({
                    role: "tool",
                    tool_call_id: (m as any).tool_call_id || (m as any).id || "call_1",
                    content: (m as any).content
                });
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
                const cleanBase = base.replace(/\/v1$/, "");
                url = `${cleanBase}/openai/deployments/${this.modelId}/chat/completions?api-version=2024-02-15-preview`;
            } else if (this.providerType === "databricks") {
                const host = base.split('/mlflow/v1')[0].split('/api/2.0')[0];
                url = `${host}/serving-endpoints/${this.modelId}/invocations`;
            } else if (base.endsWith("/v1")) {
                url = `${base}/chat/completions`;
            } else {
                url = `${base}/v1/chat/completions`;
            }

            let response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                signal: request.signal,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                if (response.status === 400 && errorBody.includes("does not support tools") && body.tools) {
                    delete body.tools;
                    delete body.tool_choice;
                    response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: request.signal });
                } else {
                    throw new Error(`Provider error: ${response.status} - ${errorBody}`);
                }
            }

            const reader = response.body?.getReader();
            if (!reader) return;
            const decoder = new TextDecoder();
            let buffer = "";
            let assistantContentForFallback = "";
            const pendingToolCalls = new Map<number, { id: string; name: string; arguments: string; }>();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    const cleanLine = line.trim();
                    if (cleanLine.startsWith("data: ")) {
                        const dataStr = cleanLine.slice(6).trim();
                        if (dataStr === "[DONE]") break;
                        try {
                            const data = JSON.parse(dataStr);
                            const delta = data.choices?.[0]?.delta;
                            if (delta?.content) {
                                assistantContentForFallback += delta.content;
                                yield { type: "text", content: delta.content };
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
                                        if (tc.function?.arguments) existing.arguments += tc.function.arguments;
                                    }
                                }
                            }
                        } catch (e) { }
                    }
                }
            }

            if (pendingToolCalls.size === 0 && assistantContentForFallback.includes("{")) {
                const blockRegex = /```(?:json|tool_code|bash|python|typescript|javascript)?\s*([\s\S]*?)\s*```|(\{[^{}]*"name"[^{}]*"args"[^{}]*\})/g;
                let match;
                let fallbackIndex = 0;
                while ((match = blockRegex.exec(assistantContentForFallback)) !== null) {
                    try {
                        const raw = (match[1] || match[2]).trim();
                        let parsed;
                        try { parsed = JSON.parse(raw); } catch {
                            const jsonMatch = raw.match(/\{[\s\S]*\}/);
                            if (jsonMatch) { try { parsed = JSON.parse(jsonMatch[0]); } catch { } }
                        }
                        if (parsed && (parsed.name || parsed.function)) {
                            const name = parsed.name || (typeof parsed.function === 'string' ? parsed.function : parsed.function?.name);
                            const args = parsed.args || parsed.arguments || (parsed.function?.arguments ? (typeof parsed.function.arguments === 'string' ? JSON.parse(parsed.function.arguments) : parsed.function.arguments) : {});
                            if (name) {
                                pendingToolCalls.set(fallbackIndex++, {
                                    id: `call_parsed_${Math.random().toString(36).substring(7)}`,
                                    name: name.trim(),
                                    arguments: JSON.stringify(args),
                                });
                            }
                        }
                    } catch { }
                }
            }

            for (const [_, tc] of pendingToolCalls) {
                try {
                    const parsedArgs = JSON.parse(tc.arguments);
                    yield { type: "tool_call", toolCall: { id: tc.id, name: tc.name, args: parsedArgs } };
                } catch {
                    yield { type: "error", error: `Failed to parse tool call arguments for ${tc.name}` };
                }
            }
        } catch (error: any) {
            if (error.name === "AbortError") return;
            yield { type: "error", error: error.message };
        }
    }

    async listModels(): Promise<string[]> {
        return [this.modelId];
    }

    async healthCheck(): Promise<boolean> {
        return true;
    }
}
