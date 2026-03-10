import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { type PluginManifest, type PluginHooks, type PluginInput, type PluginFactory } from "./plugin-types.ts";
import { logger } from "../core/logger.ts";

export class PluginLoader {
    private pluginsDir: string;

    constructor() {
        this.pluginsDir = path.join(os.homedir(), ".qwerti", "plugins");
    }

    async init(): Promise<void> {
        await fs.mkdir(this.pluginsDir, { recursive: true });
    }

    async load(name: string, input: PluginInput): Promise<{ manifest: PluginManifest; hooks: PluginHooks }> {
        const pluginDir = path.join(this.pluginsDir, name);
        const manifestPath = path.join(pluginDir, "manifest.json");

        try {
            const manifestContent = await fs.readFile(manifestPath, "utf-8");
            const manifest: PluginManifest = JSON.parse(manifestContent);

            const mainPath = path.join(pluginDir, manifest.main);
            // In a real env, we'd dynamic import. For now, we'll log it.
            // Using a try-catch for the import to avoid crashing if the file isn't there in this dev stage
            let hooks: PluginHooks = {};
            try {
                const mod = await import(mainPath);
                const factory: PluginFactory = mod.default ?? mod.plugin;
                if (factory) {
                    hooks = await factory(input);
                }
            } catch (e: any) {
                logger.warn({ plugin: name, error: e.message }, "Could not import plugin main file. Using empty hooks.");
            }

            return { manifest, hooks };
        } catch (error: any) {
            logger.error({ plugin: name, error: error.message }, "Failed to load plugin manifest");
            throw error;
        }
    }

    async list(): Promise<PluginManifest[]> {
        const manifests: PluginManifest[] = [];
        try {
            const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    try {
                        const mPath = path.join(this.pluginsDir, entry.name, "manifest.json");
                        const content = await fs.readFile(mPath, "utf-8");
                        manifests.push(JSON.parse(content));
                    } catch { /* skip */ }
                }
            }
        } catch { /* dir might not exist */ }
        return manifests;
    }
}
