import { type ProviderConfig } from "../core/types.ts";
import { type BaseProvider } from "./base-provider.ts";
import { LlamaCppProvider } from "./implementations/llama-cpp-provider.ts";
import { ProviderError } from "../core/errors.ts";

export class ProviderFactory {
    static create(config: ProviderConfig): BaseProvider {
        switch (config.type) {
            case "llama-cpp":
                return new LlamaCppProvider({
                    name: config.name,
                    baseUrl: config.baseUrl ?? "http://localhost:8080",
                    model: config.model,
                });
            case "ollama":
                return new LlamaCppProvider({
                    name: config.name,
                    baseUrl: config.baseUrl ?? "http://localhost:11434",
                    model: config.model,
                });
            case "azure":
            case "vertex":
            case "bedrock":
            case "databricks":
            case "custom":
                // Basic mapping for providers that are OpenAI-compatible in their endpoints
                // Full implementations will come in future phases
                return new LlamaCppProvider({
                    name: config.name,
                    baseUrl: config.baseUrl || config.endpoint || "http://localhost:8080",
                    model: config.model,
                    apiKey: config.apiKey
                });
            default:
                throw new ProviderError(`Provider type ${config.type} not yet implemented.`);
        }
    }
}
