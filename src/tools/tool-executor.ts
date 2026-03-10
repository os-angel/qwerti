import { type ToolRegistry } from "./tool-registry.ts";
import { type ToolResult } from "./base-tool.ts";
import { type EventBus } from "../core/event-bus.ts";

export interface ToolExecutorOptions {
    defaultTimeout: number;
    maxOutputSize: number;
}

export class ToolExecutor {
    constructor(
        private registry: ToolRegistry,
        private bus: EventBus,
        private options: ToolExecutorOptions = {
            defaultTimeout: 120_000,
            maxOutputSize: 30_000,
        }
    ) { }

    async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
        this.bus.emit("tool:start", { name, args });
        const start = Date.now();

        try {
            const result = await this.registry.execute(name, args);
            const duration = Date.now() - start;

            // Truncate output if necessary
            if (result.result.length > this.options.maxOutputSize) {
                const half = Math.floor(this.options.maxOutputSize / 2);
                result.result = result.result.slice(0, half) +
                    "\n\n... [output truncated] ...\n\n" +
                    result.result.slice(-half);
            }

            this.bus.emit("tool:result", {
                name,
                result: result.result,
                isError: result.isError,
                duration
            });

            return result;
        } catch (error: any) {
            const duration = Date.now() - start;
            const errorResult = { result: `Tool execution failed: ${error.message}`, isError: true };

            this.bus.emit("tool:result", {
                name,
                result: errorResult.result,
                isError: true,
                duration
            });

            return errorResult;
        }
    }
}
