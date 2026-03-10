import { type Message } from "../core/types.ts";

export interface ContextOptions {
    maxTokensEstimate: number;
}

export class ContextManager {
    private messages: Message[] = [];
    private options: ContextOptions;

    constructor(options: ContextOptions = { maxTokensEstimate: 32_000 }) {
        this.options = options;
    }

    addMessage(msg: Message): void {
        this.messages.push(msg);
        this.maybeCompact();
    }

    getMessages(): Message[] {
        return [...this.messages];
    }

    clear(): void {
        this.messages = [];
    }

    private maybeCompact(): void {
        // Simple heuristic: 4 chars per token
        const totalChars = this.messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
        const estimatedTokens = totalChars / 4;

        if (estimatedTokens > this.options.maxTokensEstimate * 0.9) {
            // Keep system (if first), last message, and some context
            if (this.messages.length > 10) {
                const systemMsg = this.messages[0].role === "system" ? [this.messages[0]] : [];
                const lastMessages = this.messages.slice(-8);
                this.messages = [...systemMsg, ...lastMessages];
            }
        }
    }
}
