import { type GlobalConfig } from "../config/global-config.ts";
import { type BaseProvider } from "./base-provider.ts";
import { ProviderFactory } from "./provider-factory.ts";

export class ModelRegistry {
    private providers: Map<string, BaseProvider> = new Map();
    private activeProviderName: string | null = null;

    async init(globalConfig: GlobalConfig): Promise<void> {
        const config = globalConfig.get();

        for (const pConfig of config.providers) {
            try {
                const provider = ProviderFactory.create(pConfig);
                this.providers.set(pConfig.name, provider);
            } catch (err) {
                console.error(`Failed to load provider ${pConfig.name}:`, err);
            }
        }

        this.activeProviderName = config.activeProvider;
    }

    getActive(): BaseProvider | null {
        if (!this.activeProviderName) return null;
        return this.providers.get(this.activeProviderName) || null;
    }

    setActive(name: string): void {
        if (this.providers.has(name)) {
            this.activeProviderName = name;
        }
    }

    list() {
        return Array.from(this.providers.values()).map(p => ({
            name: p.name,
            type: p.type,
            // We'll add health status later
        }));
    }
}
