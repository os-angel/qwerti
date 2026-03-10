import { type PluginHooks } from "./plugin-types.ts";

export class HookSystem {
    private plugins: Array<{ name: string; hooks: PluginHooks }> = [];

    register(name: string, hooks: PluginHooks): void {
        this.plugins.push({ name, hooks });
    }

    unregister(name: string): void {
        this.plugins = this.plugins.filter(p => p.name !== name);
    }

    async runHook<K extends keyof PluginHooks>(
        hookName: K,
        ...args: Parameters<NonNullable<PluginHooks[K]>>
    ): Promise<any> {
        let result = args[0];

        for (const plugin of this.plugins) {
            const hook = plugin.hooks[hookName];
            if (hook) {
                try {
                    // Pipeline style execution
                    result = await (hook as any)(...(Array.isArray(result) ? [result] : [result]));
                } catch (error: any) {
                    console.warn(`Plugin "${plugin.name}" hook "${hookName}" failed: ${error.message}`);
                }
            }
        }

        return result;
    }

    async fireHook<K extends keyof PluginHooks>(
        hookName: K,
        ...args: any[]
    ): Promise<void> {
        for (const plugin of this.plugins) {
            const hook = plugin.hooks[hookName];
            if (hook) {
                try {
                    await (hook as any)(...args);
                } catch (error: any) {
                    console.warn(`Plugin "${plugin.name}" hook "${hookName}" failed: ${error.message}`);
                }
            }
        }
    }
}
