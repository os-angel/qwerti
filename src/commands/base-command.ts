import { type RuntimeContext } from "./runtime-context.ts";

export interface CommandResult {
    type: "message" | "component" | "silent";
    content?: string;
    componentName?: string;
    componentProps?: Record<string, unknown>;
    initialStep?: string;
}

export abstract class BaseCommand {
    abstract name: string;
    abstract description: string;
    aliases?: string[];

    abstract execute(args: string, ctx: RuntimeContext): Promise<CommandResult>;
}
