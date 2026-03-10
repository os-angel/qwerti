import { BaseCommand, type CommandResult } from "../base-command.ts";
import { type RuntimeContext } from "../runtime-context.ts";

export class AddCommand extends BaseCommand {
    name = "add";
    description = "Add resource (model, mcp, skill, plugin). Usage: /add [type] or just /add for wizard.";

    async execute(args: string, ctx: RuntimeContext): Promise<CommandResult> {
        const parts = args.trim().split(/\s+/);
        const sub = parts[0];

        // Sin argumentos o subcomando genérico: abrir wizard interactivo
        if (!sub || sub === "" || sub === "model" || sub === "plugin") {
            return {
                type: "component",
                componentName: "add-wizard",
                initialStep: sub === "model" ? "select-model-type" : "select-resource"
            };
        }

        if (sub === "mcp") {
            const name = parts[1];
            const command = parts[2];
            const cmdArgs = parts.slice(3);

            if (!name || !command) {
                return { type: "message", content: "Usage: /add mcp <name> <command> [args...]" };
            }

            try {
                await ctx.mcpManager.addServer({ name, command, args: cmdArgs });
                return { type: "message", content: `Successfully added MCP server: ${name}` };
            } catch (err: any) {
                return { type: "message", content: `Failed to add MCP server: ${err.message}` };
            }
        }

        if (sub === "skill") {
            const name = parts[1];
            if (!name) return { type: "message", content: "Usage: /add skill <name>" };

            try {
                await ctx.skillRegistry.activate(name);
                return { type: "message", content: `Skill activated: ${name}` };
            } catch (err: any) {
                return { type: "message", content: `Failed to activate skill: ${err.message}` };
            }
        }

        return { type: "message", content: "Unknown subcommand. Use /add mcp or /add skill." };
    }
}
