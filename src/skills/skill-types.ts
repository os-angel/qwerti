import { type BaseTool } from "../tools/base-tool.ts";

export interface SkillManifest {
    name: string;
    version: string;
    description: string;
    author?: string;
    prompt?: string;          // Path to prompt.md relative to skill root
    tools?: string[];         // Paths to tool files relative to skill root
}

export interface Skill {
    manifest: SkillManifest;
    prompt?: string;
    tools: BaseTool[];
}
