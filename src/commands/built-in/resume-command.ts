import { BaseCommand, type CommandResult } from "../base-command.ts";
import { type RuntimeContext } from "../runtime-context.ts";

export class ResumeCommand extends BaseCommand {
    name = "resume";
    description = "Resume a previous session by ID";

    async execute(args: string, ctx: RuntimeContext): Promise<CommandResult> {
        let sessionId = args.trim();

        if (!sessionId) {
            const sessions = await ctx.sessionStore.list();
            if (sessions.length === 0) return { type: "message", content: "No sessions to resume." };
            sessionId = sessions[0].id; // Default to last
        }

        const session = await ctx.sessionStore.load(sessionId);
        if (!session) {
            // Try prefix search
            const all = await ctx.sessionStore.list();
            const found = all.find(s => s.id.startsWith(sessionId));
            if (found) {
                const fullSession = await ctx.sessionStore.load(found.id);
                if (fullSession) return this.applySession(fullSession, ctx);
            }
            return { type: "message", content: `Session "${sessionId}" not found.` };
        }

        return this.applySession(session, ctx);
    }

    private async applySession(session: any, ctx: RuntimeContext): Promise<CommandResult> {
        ctx.contextManager.clear();
        for (const msg of session.messages) {
            ctx.contextManager.addMessage(msg);
            ctx.addMessage(msg); // Add to UI
        }

        return {
            type: "message",
            content: `Resumed session: ${session.meta.title || session.meta.id}`
        };
    }
}
