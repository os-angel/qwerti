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

                // Check for tool calls
                if (currentToolCalls.length > 0) {
                    // Add assistant message with tool calls to context
                    const assistantMsgId = Math.random().toString(36).substring(7);
                    this.context.addMessage({
                        id: assistantMsgId,
                        role: "assistant",
                        content: assistantContent,
                        timestamp: Date.now(),
                        toolCalls: currentToolCalls,
                    });

                    // Execute tool calls
                    const toolResults: ToolResult[] = [];
                    for (const tc of currentToolCalls) {
                        yield { type: "tool_start", name: tc.name, args: tc.args };

                        const result = await this.toolExecutor.execute(tc.name, tc.args);

                        const toolResult: ToolResult = {
                            callId: tc.id,
                            name: tc.name,
                            result: result.result,
                            isError: result.isError,
                        };
                        toolResults.push(toolResult);

                        yield {
                            type: "tool_result",
                            name: tc.name,
                            result: toolResult.result,
                            isError: toolResult.isError
                        };
                    }

                    // Add tool results to context
                    this.context.addMessage({
                        id: Math.random().toString(36).substring(7),
                        role: "tool",
                        content: toolResults.map(r => r.result).join("\n---\n"), // Standard content for simple providers
                        timestamp: Date.now(),
                        toolResults: toolResults,
                    });

                    // Loop back to let the assistant see the tool results
                    continueLoop = true;
                } else {
                    // Final response
                    this.context.addMessage({
                        id: Math.random().toString(36).substring(7),
                        role: "assistant",
                        content: assistantContent,
                        timestamp: Date.now(),
                    });
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
