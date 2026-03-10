import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { type Skill, type SkillManifest } from "./skill-types.ts";
import { BaseTool } from "../tools/base-tool.ts";
import { logger } from "../core/logger.ts";

export class SkillLoader {
    private skillsDir: string;

    constructor() {
        this.skillsDir = path.join(os.homedir(), ".qwerti", "skills");
    }

    async init(): Promise<void> {
        await fs.mkdir(this.skillsDir, { recursive: true });
    }

    async load(name: string): Promise<Skill> {
        const skillDir = path.join(this.skillsDir, name);
        const manifestPath = path.join(skillDir, "manifest.json");

        try {
            const manifestContent = await fs.readFile(manifestPath, "utf-8");
            const manifest: SkillManifest = JSON.parse(manifestContent);

            let prompt: string | undefined;
            if (manifest.prompt) {
                const promptPath = path.join(skillDir, manifest.prompt);
                prompt = await fs.readFile(promptPath, "utf-8");
            }

            const tools: BaseTool[] = [];
            if (manifest.tools) {
                for (const toolPath of manifest.tools) {
                    const fullPath = path.join(skillDir, toolPath);
                    // In a real env, we'd dynamic import. For now, we'll log it as a placeholder.
                    logger.debug({ skill: name, tool: toolPath }, "Loading skill tool (dynamic import placeholder)");
                }
            }

            return { manifest, prompt, tools };
        } catch (error: any) {
            logger.error({ skill: name, error: error.message }, "Failed to load skill");
            throw error;
        }
    }

    async list(): Promise<SkillManifest[]> {
        const manifests: SkillManifest[] = [];
        try {
            const entries = await fs.readdir(this.skillsDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    try {
                        const mPath = path.join(this.skillsDir, entry.name, "manifest.json");
                        const content = await fs.readFile(mPath, "utf-8");
                        manifests.push(JSON.parse(content));
                    } catch { /* skip */ }
                }
            }
        } catch { /* dir might not exist yet */ }
        return manifests;
    }
}
