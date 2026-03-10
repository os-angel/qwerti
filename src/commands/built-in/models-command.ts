import { BaseCommand, type CommandResult } from "../base-command.ts";
import { type RuntimeContext } from "../runtime-context.ts";

export class ModelsCommand extends BaseCommand {
    name = "models";
    description = "Lista y selecciona modelos";

    async execute(args: string, ctx: RuntimeContext): Promise<CommandResult> {
        const registry = ctx.modelRegistry;
        const providers = registry.list();

        if (!args) {
            if (providers.length === 0) {
                return {
                    type: "message",
                    content: "No hay providers configurados. Edita ~/.qwerti/config.json para agregar uno.",
                };
            }

            return {
                type: "component",
                componentName: "model-selector",
            };
        }

        const name = args.trim();
        const found = providers.find(p => p.name === name);

        if (found) {
            registry.setActive(name);
            await ctx.config.setActiveProvider(name);
            return {
                type: "message",
                content: `Modelo activo cambiado a: ${name}`,
            };
        }

        return {
            type: "message",
            content: `Provider "${name}" no encontrado.`,
        };
    }
}
