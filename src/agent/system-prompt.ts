import { type ToolRegistry } from "../tools/tool-registry.ts";
import { type SkillRegistry } from "../skills/skill-registry.ts";
import path from "node:path";
import fs from "node:fs";

export function buildSystemPrompt(toolRegistry: ToolRegistry, skillRegistry: SkillRegistry, mode: string = "build"): string {
    const os = process.platform;
    const cwd = process.cwd();

    let prompt = "# QWERTI (" + mode.toUpperCase() + " MODE)\n";
    prompt += "OS: " + os + " | CWD: " + cwd + "\n\n";
    prompt += "## Guidelines:\n";
    prompt += "1. Use tools to get facts. NEVER guess.\n";
    prompt += "2. Format tool calls as JSON blocks: ```json\n{ \"name\": \"...\", \"args\": {} }\n```\n";
    prompt += "3. For file counts, use 'list_dir' and TRUST the SUMMARY if provided in the result.\n";
    prompt += "4. DO NOT give a final answer until you receive the tool output.\n";

    // Load workspace context from .qwerti/CONTEXT.md
    const contextPath = path.join(cwd, ".qwerti", "CONTEXT.md");
    if (fs.existsSync(contextPath)) {
        try {
            const contextContent = fs.readFileSync(contextPath, "utf-8");
            prompt += "\n## CONTEXT\n" + contextContent + "\n";
        } catch (err) {}
    }

    const toolDefinitions = toolRegistry.getToolDefinitions();
    if (toolDefinitions.length > 0) {
        prompt += "\n## Available Tools\n";
        for (const tool of toolDefinitions) {
            prompt += `- ${tool.function.name}: ${tool.function.description}\n`;
        }
    }

    return prompt;
}
