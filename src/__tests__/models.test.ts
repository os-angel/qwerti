import { describe, expect, it, mock } from "bun:test";
import { ModelsCommand } from "../commands/built-in/models-command";

describe("ModelsCommand", () => {
    it("should return the correct command definition", () => {
        const cmd = new ModelsCommand();
        expect(cmd.name).toBe("models");
        expect(cmd.description).toContain("Lista y selecciona");
    });

    it("should return a component trigger when no args provided", async () => {
        const cmd = new ModelsCommand();

        const fakeProviders = [{
            name: "test-model-1",
            type: "ollama",
            model: "llama3",
            baseUrl: "http://localhost:11434"
        }];

        const mockContext: any = {
            modelRegistry: {
                list: () => fakeProviders
            }
        };

        const result = await cmd.execute("", mockContext);

        expect(result.type).toBe("component");
        expect(result.componentName).toBe("model-selector");
    });
});
