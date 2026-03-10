import { type BaseCommand } from "./base-command.ts";

export class CommandRegistry {
    private commands: Map<string, BaseCommand> = new Map();

    register(command: BaseCommand): void {
        this.commands.set(command.name, command);
        command.aliases?.forEach(alias => this.commands.set(alias, command));
    }

    parse(input: string): { command: BaseCommand; args: string } | null {
        if (!input.startsWith("/")) return null;

        const [cmdPart, ...argParts] = input.slice(1).split(" ");
        const command = this.commands.get(cmdPart);

        if (!command) return null;

        return {
            command,
            args: argParts.join(" "),
        };
    }

    getAll(): BaseCommand[] {
        return Array.from(new Set(this.commands.values()));
    }

    getSuggestions(partial: string): BaseCommand[] {
        const query = partial.startsWith("/") ? partial.slice(1) : partial;
        return this.getAll().filter(cmd =>
            cmd.name.startsWith(query) ||
            cmd.aliases?.some(a => a.startsWith(query))
        );
    }
}
