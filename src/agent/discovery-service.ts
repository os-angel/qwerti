export interface DetectedBackend {
    type: "ollama" | "llama-cpp";
    baseUrl: string;
    models: string[];
    isHealthy: boolean;
}

export class DiscoveryService {
    static async detectOllama(): Promise<DetectedBackend | null> {
        try {
            const res = await fetch("http://localhost:11434/api/tags");
            if (!res.ok) return null;
            const data = await res.json() as { models: any[] };
            return {
                type: "ollama",
                baseUrl: "http://localhost:11434",
                models: data.models.map(m => m.name),
                isHealthy: true
            };
        } catch {
            return null;
        }
    }

    static async detectLlamaCpp(port = 8080): Promise<DetectedBackend | null> {
        try {
            const baseUrl = `http://localhost:${port}`;
            const res = await fetch(`${baseUrl}/v1/models`);
            if (!res.ok) return null;
            const data = await res.json() as { data: any[] };
            return {
                type: "llama-cpp",
                baseUrl,
                models: data.data.map(m => m.id),
                isHealthy: true
            };
        } catch {
            return null;
        }
    }

    static async discoverAll(): Promise<DetectedBackend[]> {
        const results = await Promise.all([
            this.detectOllama(),
            this.detectLlamaCpp(8080),
            this.detectLlamaCpp(8081), // common alternative
        ]);
        return results.filter((r): r is DetectedBackend => r !== null);
    }
}
