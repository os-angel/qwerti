import { type PluginLoader } from "./plugin-loader.ts";
import { type HookSystem } from "./hook-system.ts";
import { type PluginManifest, type PluginInput } from "./plugin-types.ts";

export class PluginRegistry {
    private loadedPlugins: Map<string, PluginManifest> = new Map();

    constructor(
        private loader: PluginLoader,
        private hookSystem: HookSystem
    ) { }

    async init(pluginNames: string[], input: PluginInput): Promise<void> {
        for (const name of pluginNames) {
            try {
                await this.activate(name, input);
            } catch (e: any) {
                console.warn(`Failed to activate plugin "${name}": ${e.message}`);
            }
        }
    }

    async activate(name: string, input: PluginInput): Promise<void> {
        const { manifest, hooks } = await this.loader.load(name, input);
        this.hookSystem.register(name, hooks);
        this.loadedPlugins.set(name, manifest);

        if (hooks.onInit) await hooks.onInit();

        if (hooks.registerTools) {
            const tools = hooks.registerTools();
            for (const tool of tools) {
                input.toolRegistry.register(tool);
            }
        }

        // Note: registerCommands should be handled by the app/command registry
    }

    async deactivate(name: string): Promise<void> {
        this.hookSystem.unregister(name);
        this.loadedPlugins.delete(name);
    }

    list(): PluginManifest[] {
        return Array.from(this.loadedPlugins.values());
    }
}
