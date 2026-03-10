import fs from "node:fs/promises";
import path from "node:path";

export interface MCPServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
}

export interface WorkspaceConfigData {
    activeProvider?: string;
    mcpServers: Record<string, MCPServerConfig>;
    skills: string[];
    plugins: string[];
    systemPromptExtra?: string;
}

const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfigData = {
    mcpServers: {},
    skills: [],
    plugins: [],
};

export class WorkspaceConfig {
    private configPath: string;
    private data: WorkspaceConfigData = DEFAULT_WORKSPACE_CONFIG;

    constructor(dir: string) {
        this.configPath = path.join(dir, ".qwerti", "config.json");
    }

    static async load(cwd: string): Promise<WorkspaceConfig | null> {
        const config = new WorkspaceConfig(cwd);
        try {
            const content = await fs.readFile(config.configPath, "utf-8");
            config.data = JSON.parse(content);
            return config;
        } catch (err) {
            return null;
        }
    }

    get(): WorkspaceConfigData {
        return this.data;
    }

    async set(partial: Partial<WorkspaceConfigData>): Promise<void> {
        this.data = { ...this.data, ...partial };
        await this.save();
    }

    async save(): Promise<void> {
        const dir = path.dirname(this.configPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(this.data, null, 2));
    }
}
