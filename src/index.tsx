#!/usr/bin/env bun
import React from "react";
import { render } from "ink";
import { Command } from "commander";
import { App } from "./tui/app.tsx";
import { GlobalConfig } from "./config/global-config.ts";
import { WorkspaceConfig } from "./config/workspace-config.ts";
import { logger } from "./core/logger.ts";
import * as dotenv from "dotenv";

import { runIntro } from "./tui/intro.ts";
import { MCP_CONFIGS } from "./config/mcp-configs.ts";
import { MCPManager } from "./mcp/mcp-manager.ts";
import { EventBus } from "./core/event-bus.ts";
import { ToolRegistry } from "./tools/tool-registry.ts";

dotenv.config();

const program = new Command();

program
    .name("qwerti")
    .description("AI-powered CLI agent")
    .version("0.1.0")
    .option("--no-intro", "Skip intro animation")
    .option("--eval <prompt>", "Execute a single prompt and exit (non-interactive mode)");

program
    .action(async (options) => {
        // Initialize configs
        const globalConfig = await GlobalConfig.init();
        const workspaceConfig = await WorkspaceConfig.load(process.cwd());

        // Initialize core systems
        const eventBus = new EventBus();
        const toolRegistry = new ToolRegistry();
        const mcpManager = new MCPManager(eventBus, toolRegistry);

        const activeProvider = globalConfig.getActiveProvider();

        if (options.intro !== false) {
            await runIntro({
                provider: activeProvider?.type ?? "ollama",
                model: activeProvider?.model ?? "default",
            });
        }

        // Initialize MCP servers (after intro to avoid log noise during animation)
        for (const config of MCP_CONFIGS) {
            try {
                await mcpManager.addServer(config);
                logger.info({ name: config.name }, "MCP server connected");
            } catch (error: any) {
                logger.error({ name: config.name, error: error.message }, "Failed to connect MCP server");
            }
        }

        if (options.eval) {
            // Headless batch mode
            logger.info({ prompt: options.eval }, "Running in eval mode");

            if (!activeProvider) {
                console.error("No active provider configured. Please run interactive mode first to set one up.");
                process.exit(1);
            }

            const { ModelRegistry } = await import("./providers/model-registry.ts");
            const { ToolExecutor } = await import("./tools/tool-executor.ts");

            // Initialize model registry and executor with MCP tools
            const modelRegistry = new ModelRegistry();
            await modelRegistry.init(globalConfig);
            const toolExecutor = new ToolExecutor(toolRegistry, eventBus);

            // Your eval mode implementation here...
            logger.info("Eval mode implementation needed");
        } else {
            // Interactive TUI mode
            render(<App />);
        }
    });

program.parse(process.argv);