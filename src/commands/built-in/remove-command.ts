import { BaseCommand, type CommandResult } from "../base-command.ts";
import { type RuntimeContext } from "../runtime-context.ts";

export class RemoveCommand extends BaseCommand {
    name = "remove";
    description = "Remove MCP server or Skill. Usage: /remove mcp <name> or /remove skill <name>";

    async execute(args: string, ctx: RuntimeContext): Promise<CommandResult> {
        const [sub, name] = args.trim().split(/\s+/);

        if (!sub || !name) {
            return { type: "message", content: "Usage: /remove <mcp|skill> <name>" };
        }

        if (sub === "mcp") {
            await ctx.mcpManager.removeServer(name);
            return { type: "message", content: `Removed MCP server: ${name}` };
        }

        if (sub === "skill") {
            ctx.skillRegistry.deactivate(name);
            return { type: "message", content: `Deactivated skill: ${name}` };
        }

        return { type: "message", content: "Unknown subcommand. Use /remove mcp or /remove skill." };
    }
}
