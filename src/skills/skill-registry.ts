import { type Skill } from "./skill-types.ts";
import { type SkillLoader } from "./skill-loader.ts";
import { type ToolRegistry } from "../tools/tool-registry.ts";

export class SkillRegistry {
    private activeSkills: Map<string, Skill> = new Map();

    constructor(private loader: SkillLoader, private toolRegistry: ToolRegistry) { }

    async activate(name: string): Promise<void> {
        const skill = await this.loader.load(name);
        this.activeSkills.set(name, skill);

        // Register tools
        for (const tool of skill.tools) {
            this.toolRegistry.register(tool);
        }
    }

    deactivate(name: string): void {
        this.activeSkills.delete(name);
    }

    getPrompts(): string[] {
        return Array.from(this.activeSkills.values())
            .filter(s => s.prompt)
            .map(s => s.prompt!);
    }

    listActive() {
        return Array.from(this.activeSkills.values()).map(s => ({
            name: s.manifest.name,
            description: s.manifest.description,
            toolCount: s.tools.length,
        }));
    }
}
