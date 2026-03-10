import { describe, expect, it } from "bun:test";
import { ProviderFactory } from "../providers/provider-factory";
import { LlamaCppProvider } from "../providers/implementations/llama-cpp-provider";

describe("LlamaCppProvider", () => {
    it("should instantiate with correct properties", () => {
        const config = {
            name: "test-model",
            type: "llama-cpp" as const,
            model: "model-name",
            baseUrl: "http://localhost:8080"
        };
        const provider = ProviderFactory.create(config) as LlamaCppProvider;

        expect(provider.name).toBe("test-model");
    });
});
