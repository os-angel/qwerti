import { BaseCommand, type CommandResult } from "../base-command.ts";
import { type RuntimeContext } from "../runtime-context.ts";
import { DiscoveryService } from "../../agent/discovery-service.ts";

export class DiscoveryCommand extends BaseCommand {
    name = "discover";
    description = "Discover local LLM backends (Ollama, Llama.cpp) and their models.";

    async execute(_args: string, _ctx: RuntimeContext): Promise<CommandResult> {
        try {
            const backends = await DiscoveryService.discoverAll();
            if (backends.length === 0) {
                return { type: "message", content: "No local LLM backends found (Ollama or Llama.cpp)." };
            }

            const formatted = backends.map(b => {
                const modelList = b.models.length > 5
                    ? b.models.slice(0, 5).join(", ") + "..."
                    : b.models.join(", ");
                return `### ${b.type.toUpperCase()} at ${b.baseUrl}\n- **Models**: ${modelList}\n- **Status**: ${b.isHealthy ? "Healthy" : "Failed"}`;
            }).join("\n\n");

            return {
                type: "message",
                content: `Found ${backends.length} local backend(s):\n\n${formatted}\n\nUse '/add model' to register these permanently.`
            };
        } catch (err: any) {
            return { type: "message", content: `Discovery failed: ${err.message}` };
        }
    }
}
