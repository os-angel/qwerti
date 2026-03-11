import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface ToolResult {
    result: string;
    isError: boolean;
}

export interface ToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}

export abstract class BaseTool {
    abstract name: string;
    abstract description: string;
    abstract parameters: z.ZodObject<any>;

    permissionLevel: "read" | "write" | "execute" = "read";

    abstract execute(args: any): Promise<ToolResult>;

    toDefinition(): ToolDefinition {
        const schema = zodToJsonSchema(this.parameters) as any;
        // Clean up schema for OpenAI/Ollama compatibility
        if (schema.$schema) delete schema.$schema;

        return {
            type: "function",
            function: {
                name: this.name,
                description: this.description,
                parameters: schema,
            },
        };
    }
}
