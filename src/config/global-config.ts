import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { type ProviderConfig } from "../core/types.ts";

export interface GlobalConfigData {
    activeProvider: string | null;
    providers: ProviderConfig[];
    theme: string;
    logLevel: "debug" | "info" | "warn" | "error";
    plugins: string[];
}

const DEFAULT_CONFIG: GlobalConfigData = {
    activeProvider: null,
    providers: [],
    theme: "qwerti",
    logLevel: "info",
    plugins: [],
};

export class GlobalConfig {
    private configPath: string;
    private data: GlobalConfigData = DEFAULT_CONFIG;

    constructor() {
        this.configPath = path.join(os.homedir(), ".qwerti", "config.json");
    }

    static async init(): Promise<GlobalConfig> {
        const config = new GlobalConfig();
        const dir = path.dirname(config.configPath);

        try {
            await fs.mkdir(dir, { recursive: true });
            const content = await fs.readFile(config.configPath, "utf-8");
            const loadedData = JSON.parse(content);

            // Handle legacy qwerti config or missing fields
            config.data = {
                ...DEFAULT_CONFIG,
                ...loadedData,
                // Ensure providers is always an array
                providers: Array.isArray(loadedData.providers) ? loadedData.providers : [],
            };

            // If it was a legacy config, maybe we should save the new format
            await config.save();
        } catch (err) {
            // If file doesn't exist or is invalid, save default
            await config.save();
        }

        return config;
    }

    get(): GlobalConfigData {
        return this.data;
    }

    async set(partial: Partial<GlobalConfigData>): Promise<void> {
        this.data = { ...this.data, ...partial };
        await this.save();
    }

    async save(): Promise<void> {
        await fs.writeFile(this.configPath, JSON.stringify(this.data, null, 2));
    }

    async addProvider(provider: ProviderConfig): Promise<void> {
        const exists = this.data.providers.findIndex(p => p.name === provider.name);
        if (exists !== -1) {
            this.data.providers[exists] = provider;
        } else {
            this.data.providers.push(provider);
        }
        await this.save();
    }

    async removeProvider(name: string): Promise<void> {
        this.data.providers = this.data.providers.filter(p => p.name !== name);
        if (this.data.activeProvider === name) {
            this.data.activeProvider = null;
        }
        await this.save();
    }

    getActiveProvider(): ProviderConfig | null {
        if (!this.data.activeProvider) return null;
        return this.data.providers.find(p => p.name === this.data.activeProvider) || null;
    }

    async setActiveProvider(name: string): Promise<void> {
        this.data.activeProvider = name;
        await this.save();
    }
}
