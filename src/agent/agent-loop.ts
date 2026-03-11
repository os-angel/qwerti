import { type BaseProvider, type StreamChunk } from "../providers/base-provider.ts";
import { type ToolExecutor } from "../tools/tool-executor.ts";
import { type ToolRegistry } from "../tools/tool-registry.ts";
import { type SkillRegistry } from "../skills/skill-registry.ts";
import { type ContextManager } from "./context-manager.ts";
import { buildSystemPrompt } from "./system-prompt.ts";
import { type ToolCall, type ToolResult, type AgentMode } from "../core/types.ts";
import { logger } from "../core/logger.ts";

export type AgentEvent =
    | { type: "text"; content: string }
    | { type: "tool_start"; name: string; args: any }
    | { type: "tool_result"; name: string; result: string; isError: boolean }
    | { type: "error"; message: string }
    | { type: "done" };

export class AgentLoop {
    private abortController: AbortController | null = null;

    constructor(
        private provider: BaseProvider,
        private toolRegistry: ToolRegistry,
        private toolExecutor: ToolExecutor,
        private context: ContextManager,
        private skillRegistry: SkillRegistry,
        private mode: AgentMode = "build"
    ) { }

    async *run(userMessage: string): AsyncGenerator<AgentEvent> {
        this.abortController = new AbortController();

        // Add user message to context
        this.context.addMessage({
            id: Math.random().toString(36).substring(7),
            role: "user",
            content: userMessage,
            timestamp: Date.now(),
        });

        let continueLoop = true;
        let iteration = 0;
        const maxIterations = 10;

        while (continueLoop && iteration < maxIterations) {
            iteration++;
            continueLoop = false;

            const systemPrompt = buildSystemPrompt(this.toolRegistry, this.skillRegistry, this.mode);
            let tools = this.toolRegistry.getToolDefinitions();

            // Filter tools in Plan mode
            if (this.mode === "plan") {
                const safeTools = ["read_file", "list_dir", "grep_search", "find_by_name"];
                tools = tools.filter(t => safeTools.includes(t.function.name));
            }

            let assistantContent = "";
            const currentToolCalls: ToolCall[] = [];

            try {
                for await (const chunk of this.provider.chat({
                    messages: this.context.getMessages(),
                    systemPrompt,
                    tools,
                    signal: this.abortController.signal,
                })) {
                    if (chunk.type === "text" && chunk.content) {
                        assistantContent += chunk.content;
                        yield { type: "text", content: chunk.content };
                    } else if (chunk.type === "tool_call" && chunk.toolCall) {
                        currentToolCalls.push(chunk.toolCall);
                    } else if (chunk.type === "error") {
                        yield { type: "error", message: chunk.error || "Unknown provider error" };
                        return;
                    }
                }

                // FALLBACK: Parse tool calls from text
                if (currentToolCalls.length === 0) {
                    const blockRegex = /```(?:json|tool_code|bash|python|typescript|javascript)?\s*([\s\S]*?)\s*```|(\{[^{}]*"name"[^{}]*"args"[^{}]*\})/g;
                    let match;
                    while ((match = blockRegex.exec(assistantContent)) !== null) {
                        try {
                            const raw = (match[1] || match[2]).trim();
                            let parsed;
                            
                            // Try JSON
                            try {
                                parsed = JSON.parse(raw);
                            } catch {
                                // Try Extracting JSON
                                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                                if (jsonMatch) {
                                    try {
                                        parsed = JSON.parse(jsonMatch[0]);
                                    } catch {}
                                }
                            }

                            if (parsed && (parsed.name || parsed.function)) {
                                const toolName = parsed.name || (typeof parsed.function === 'string' ? parsed.function : parsed.function?.name);
                                const toolArgs = parsed.args || parsed.arguments || (parsed.function?.arguments ? (typeof parsed.function.arguments === 'string' ? JSON.parse(parsed.function.arguments) : parsed.function.arguments) : {});
                                
                                if (toolName) {
                                    const tName = toolName.trim();
                                    console.log(`[AgentLoop] Parsed tool call from block:`, tName);
                                    currentToolCalls.push({
                                        id: `call_parsed_${Math.random().toString(36).substring(7)}`,
                                        name: tName,
                                        args: toolArgs,
                                    });
                                }
                            } else if (raw.toLowerCase().includes("list_dir")) {
                                // Heuristic for models that just output tool names
                                console.log(`[AgentLoop] Heuristic parsed list_dir from block`);
                                currentToolCalls.push({
                                    id: `call_parsed_h_${Math.random().toString(36).substring(7)}`,
                                    name: "list_dir",
                                    args: {},
                                });
                            }
                        } catch (e) {
                            // Ignore
                        }
                    }
                }

                // Check for tool calls
                if (currentToolCalls.length > 0) {
                    // Save assistant message to context
                    this.context.addMessage({
                        id: Math.random().toString(36).substring(7),
                        role: "assistant",
                        content: assistantContent,
                        timestamp: Date.now(),
                        toolCalls: currentToolCalls,
                    });

                    // Execute tool calls
                    const toolResults: ToolResult[] = [];
                    for (const tc of currentToolCalls) {
                        console.log(`[AgentLoop] Executing Tool: ${tc.name} with args:`, tc.args);
                        const result = await this.toolExecutor.execute(tc.name, tc.args);

                        const toolResult: ToolResult = {
                            callId: tc.id,
                            name: tc.name,
                            result: result.result,
                            isError: result.isError,
                        };
                        toolResults.push(toolResult);

                        console.log(`[AgentLoop] Tool Result (${tc.name}):`, toolResult.result.substring(0, 100) + "...");
                        yield {
                            type: "tool_result",
                            name: tc.name,
                            result: toolResult.result,
                            isError: toolResult.isError
                        };
                    }

                    // Add combined tool results to context
                    this.context.addMessage({
                        id: Math.random().toString(36).substring(7),
                        role: "tool",
                        content: toolResults.map(tr => {
                            let res = tr.result;
                            // Add extra counting info if it's a list_dir result
                            if (tr.name === "list_dir") {
                                // Match markers like "[DIRECTORY] .git" or "[FILE] package.json"
                                const lines = res.split("\n");
                                const itemCount = lines.filter(line => line.trim().startsWith("[DIRECTORY]") || line.trim().startsWith("[FILE]")).length;
                                if (itemCount > 0) {
                                    res = `[SUMMARY: FOUND ${itemCount} ITEMS TOTAL]\n\n${res}`;
                                }
                            }
                            return `[RESULT FOR ${tr.name}]:\n${res}`;
                        }).join("\n\n---\n\n") + "\n\nPlease provide your final answer based on the results above.",
                        timestamp: Date.now(),
                        toolResults: toolResults,
                    });

                    // Loop back to let the assistant see the tool results
                    continueLoop = true;
                } else {
                    // Final response (only if not empty)
                    if (assistantContent.trim()) {
                        this.context.addMessage({
                            id: Math.random().toString(36).substring(7),
                            role: "assistant",
                            content: assistantContent,
                            timestamp: Date.now(),
                        });
                    }
                    yield { type: "done" };
                }
            } catch (error: any) {
                if (error.name === "AbortError") {
                    yield { type: "error", message: "Request aborted" };
                } else {
                    yield { type: "error", message: error.message };
                }
                return;
            }
        }

        if (iteration >= maxIterations) {
            yield { type: "error", message: "Maximum iteration limit reached" };
        }
    }

    abort() {
        this.abortController?.abort();
    }
}
