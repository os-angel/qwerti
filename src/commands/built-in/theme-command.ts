import { BaseCommand, type CommandResult } from "../base-command.ts";
import { type RuntimeContext } from "../runtime-context.ts";

export class ThemeCommand extends BaseCommand {
    name = "theme";
    description = "Change the TUI theme. Usage: /theme <name> or /theme list";

    async execute(args: string, ctx: RuntimeContext): Promise<CommandResult> {
        const sub = args.trim().toLowerCase();

        if (sub === "list" || !sub) {
            // This is a bit tricky as the ThemeManager is in the App state
            // But we can report what's available
            return {
                type: "message",
                content: "Available themes: qwerti, ocean, sunset. Use /theme <name> to change."
            };
        }

        // The actual change happens in App.tsx by reacting to this command if we trigger an event
        ctx.bus.emit("error", { message: `Theme changed to: ${sub}` }); // Using error event as a shortcut for now

        return {
            type: "message",
            content: `Requested theme: ${sub}`
        };
    }
}
