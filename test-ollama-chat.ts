import { LlamaCppProvider } from "./src/providers/implementations/llama-cpp-provider.ts";

async function testOllama() {
    const provider = new LlamaCppProvider({
        name: "ollama-test",
        baseUrl: "http://localhost:11434",
        model: "qwen3.5:0.8b"
    });

    console.log("Checking health...");
    const ok = await provider.healthCheck();
    console.log("Health:", ok);

    if (!ok) return;

    console.log("Sending chat request...");
    try {
        const stream = provider.chat({
            messages: [{ role: "user", content: "Tell me a joke.", id: "1", timestamp: Date.now() }],
            temperature: 0.7,
        });

        for await (const chunk of stream) {
            if (chunk.type === "text") {
                process.stdout.write(chunk.content);
            } else if (chunk.type === "error") {
                console.error("\nError:", chunk.error);
            }
        }
    } catch (err) {
        console.error("Crash:", err);
    }
}

testOllama();
