import { z } from "zod";

/**
 * A very simple JSON Schema to Zod converter for MCP tools.
 * MCP tools generally use a flat object structure for parameters.
 */
export function jsonSchemaToZod(schema: any): z.ZodObject<any> {
    const shape: Record<string, z.ZodTypeAny> = {};

    if (schema.type !== 'object' || !schema.properties) {
        return z.object({});
    }

    for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
        let validator: z.ZodTypeAny;

        switch (prop.type) {
            case 'string':
                validator = z.string();
                break;
            case 'number':
            case 'integer':
                validator = z.number();
                break;
            case 'boolean':
                validator = z.boolean();
                break;
            case 'array':
                validator = z.array(z.any());
                break;
            case 'object':
                validator = z.record(z.any());
                break;
            default:
                validator = z.any();
        }

        if (prop.description) {
            validator = (validator as any).describe(prop.description);
        }

        const isRequired = Array.isArray(schema.required) && schema.required.includes(key);
        shape[key] = isRequired ? validator : validator.optional();
    }

    return z.object(shape);
}
