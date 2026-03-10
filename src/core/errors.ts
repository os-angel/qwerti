export class QwertiError extends Error {
    constructor(
        message: string,
        public code: string,
        public context?: Record<string, unknown>
    ) {
        super(message);
        this.name = "QwertiError";
    }
}

export class ProviderError extends QwertiError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, "PROVIDER_ERROR", context);
        this.name = "ProviderError";
    }
}

export class ToolError extends QwertiError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, "TOOL_ERROR", context);
        this.name = "ToolError";
    }
}

export class ConfigError extends QwertiError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, "CONFIG_ERROR", context);
        this.name = "ConfigError";
    }
}

export class MCPError extends QwertiError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, "MCP_ERROR", context);
        this.name = "MCPError";
    }
}
