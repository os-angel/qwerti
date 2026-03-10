import { BaseCommand, type CommandResult } from "../base-command.ts";
import { type RuntimeContext } from "../runtime-context.ts";

export class SessionCommand extends BaseCommand {
    name = "sessions";
    description = "List all saved conversation sessions";

    async execute(_args: string, ctx: RuntimeContext): Promise<CommandResult> {
        const sessions = await ctx.sessionStore.list();

        if (sessions.length === 0) {
            return {
                type: "message",
                content: "No saved sessions found."
            };
        }

        const lines = sessions.map(s => {
            const date = new Date(s.updatedAt).toLocaleDateString();
            return `[${s.id.slice(0, 8)}] ${s.title || "Untitled"} (${s.model}) - ${s.messageCount} msgs - ${date}`;
        });

        return {
            type: "message",
            content: `Saved Sessions:\n${lines.join("\n")}\n\nUse /resume <id> to continue a session.`
        };
    }
}
