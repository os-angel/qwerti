import { BaseCommand, type CommandResult } from "../base-command.ts";
import { type RuntimeContext } from "../runtime-context.ts";

export class SkillsCommand extends BaseCommand {
    name = "skills";
    description = "List all available and active skills";

    async execute(args: string, ctx: RuntimeContext): Promise<CommandResult> {
        const available = await ctx.skillLoader.list();
        const active = ctx.skillRegistry.listActive();

        if (args.trim() === "list") {
            if (available.length === 0) {
                return { type: "message", content: "No skills found in ~/.qwerti/skills" };
            }
            const lines = available.map(s => {
                const isActive = active.some(a => a.name === s.name);
                return `${isActive ? "✨" : "  "} ${s.name}: ${s.description}`;
            });
            return {
                type: "message",
                content: `Skills Library:\n${lines.join("\n")}`
            };
        }

        // Default: interactive popup
        return {
            type: "component",
            componentName: "skill-selector",
        };
    }
}
