import React, { useEffect, useState, useRef, useCallback } from "react";
import { Box, useInput } from "ink";
import { Header } from "./components/header.tsx";
import { MessageList } from "./components/message-list.tsx";
import { StatusBar } from "./components/status-bar.tsx";
import { InputBox } from "./components/input-box.tsx";
import { useAppState } from "./hooks/use-app-state.ts";
import { type Message, type AgentMode } from "../core/types.ts";
import { ModelRegistry } from "../providers/model-registry.ts";
import { CommandRegistry } from "../commands/command-registry.ts";
import { ModelsCommand } from "../commands/built-in/models-command.ts";
import { GlobalConfig } from "../config/global-config.ts";
import { WorkspaceConfig } from "../config/workspace-config.ts";
import { bus } from "../core/event-bus.ts";
import { type RuntimeContext } from "../commands/runtime-context.ts";

import { MCPManager } from "../mcp/mcp-manager.ts";
import { SkillLoader } from "../skills/skill-loader.ts";
import { SkillRegistry } from "../skills/skill-registry.ts";
import { MCPCommand } from "../commands/built-in/mcp-command.ts";
import { AddCommand } from "../commands/built-in/add-command.ts";
import { RemoveCommand } from "../commands/built-in/remove-command.ts";
import { SkillsCommand } from "../commands/built-in/skills-command.ts";

import { Sidebar } from "./components/sidebar.tsx";
import { HelpDialog } from "./components/help-dialog.tsx";
import { AddWizard, type AddWizardResult } from "./components/add-wizard.tsx";
import { ModelSelector } from "./components/model-selector.tsx";

import { SessionStore } from "../agent/session-store.ts";
import { HookSystem } from "../plugins/hook-system.ts";
import { PluginLoader } from "../plugins/plugin-loader.ts";
import { PluginRegistry } from "../plugins/plugin-registry.ts";
import { SessionCommand } from "../commands/built-in/session-command.ts";
import { ResumeCommand } from "../commands/built-in/resume-command.ts";
import { ThemeCommand } from "../commands/built-in/theme-command.ts";
import { DiscoveryCommand } from "../commands/built-in/discovery-command.ts";
import { ThemeManager, themes } from "./theme.ts";
import { KeybindingManager } from "./keybindings.ts";

import { AgentLoop } from "../agent/agent-loop.ts";
import { ToolRegistry } from "../tools/tool-registry.ts";
import { ToolExecutor } from "../tools/tool-executor.ts";
import { ContextManager } from "../agent/context-manager.ts";
import { BashTool } from "../tools/built-in/bash-tool.ts";
import { ReadFileTool } from "../tools/built-in/read-file-tool.ts";
import { WriteFileTool } from "../tools/built-in/write-file-tool.ts";
import { ListDirTool } from "../tools/built-in/list-dir-tool.ts";
import { EditFileTool } from "../tools/built-in/edit-file-tool.ts";
import { GlobTool } from "../tools/built-in/glob-tool.ts";
import { GrepTool } from "../tools/built-in/grep-tool.ts";
import { HFDownloadTool } from "../tools/built-in/hf-download-tool.ts";
import { HFSearchTool } from "../tools/built-in/hf-search-tool.ts";


export function App() {
    const { state, addMessage, updateMessage, setProcessing, setError, setModel, setMode, setSessionName } = useAppState();

    // Managers
    const [themeManager] = useState(() => new ThemeManager("minimal"));
    const [keybindingManager] = useState(() => new KeybindingManager());
    const [sessionStore] = useState(() => new SessionStore());
    const [hookSystem] = useState(() => new HookSystem());
    const [pluginLoader] = useState(() => new PluginLoader());
    const [pluginRegistry] = useState(() => new PluginRegistry(pluginLoader, hookSystem));

    // Registries and Managers
    const [modelRegistry] = useState(() => new ModelRegistry());
    const [toolRegistry] = useState(() => {
        const tr = new ToolRegistry();
        tr.register(new BashTool());
        tr.register(new ReadFileTool());
        tr.register(new WriteFileTool());
        tr.register(new ListDirTool());
        tr.register(new EditFileTool());
        tr.register(new GlobTool());
        tr.register(new GrepTool());
        tr.register(new HFDownloadTool());
        tr.register(new HFSearchTool());
        return tr;
    });
    const [toolExecutor] = useState(() => new ToolExecutor(toolRegistry, bus));
    const [mcpManager] = useState(() => new MCPManager(bus, toolRegistry));
    const [skillLoader] = useState(() => new SkillLoader());
    const [skillRegistry] = useState(() => new SkillRegistry(skillLoader, toolRegistry));

    const [contextManager] = useState(() => new ContextManager());
    const [commandRegistry] = useState(() => {
        const registry = new CommandRegistry();
        registry.register(new ModelsCommand());
        registry.register(new MCPCommand());
        registry.register(new AddCommand());
        registry.register(new RemoveCommand());
        registry.register(new SkillsCommand());
        registry.register(new SessionCommand());
        registry.register(new ResumeCommand());
        registry.register(new ThemeCommand());
        registry.register(new DiscoveryCommand());
        return registry;
    });

    const configRef = useRef<{ global: GlobalConfig | null; workspace: WorkspaceConfig | null }>({
        global: null,
        workspace: null,
    });

    const agentLoopRef = useRef<AgentLoop | null>(null);
    const [currentTheme, setCurrentTheme] = useState(themeManager.get());

    // Navigation and UX state
    const [escPending, setEscPending] = useState(false);
    const escTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [dialogStack, setDialogStack] = useState<string[]>([]);
    const [activeDialog, setActiveDialog] = useState<string | null>(null);

    // Communicate with InputBox for suggestions
    const suggestionsOpenRef = useRef(false);
    const closeSuggestionsRef = useRef<(() => void) | null>(null);

    const openDialog = useCallback((name: string) => {
        setDialogStack(prev => [...prev, name]);
        setActiveDialog(name);
    }, []);

    const closeDialog = useCallback(() => {
        setDialogStack(prev => {
            const next = prev.slice(0, -1);
            setActiveDialog(next.length > 0 ? next[next.length - 1] : null);
            return next;
        });
    }, []);

    // Initialization
    useEffect(() => {
        async function init() {
            const globalConfig = await GlobalConfig.init();
            const workspaceConfig = await WorkspaceConfig.load(process.cwd());
            configRef.current = { global: globalConfig, workspace: workspaceConfig };

            await skillLoader.init();
            await sessionStore.init();
            await pluginLoader.init();
            await modelRegistry.init(globalConfig);

            // Initialize plugins
            const input = { config: globalConfig, workspaceConfig, bus, toolRegistry, cwd: process.cwd() };
            await pluginRegistry.init(globalConfig.get().plugins || [], input);

            const active = modelRegistry.getActive();
            if (active) {
                setModel(active.name);
                agentLoopRef.current = new AgentLoop(active, toolRegistry, toolExecutor, contextManager, skillRegistry, state.mode);
                addMessage({
                    id: "welcome",
                    role: "assistant",
                    content: `Hello! I'm ready to help using model \`${active.name}\`. How can I assist you today?`,
                    timestamp: Date.now()
                });
            } else {
                openDialog("add-wizard");
                addMessage({
                    id: "welcome-onboarding",
                    role: "assistant",
                    content: "Welcome to **Qwerti**! Since I couldn't find an active model configuration, I've opened the setup wizard for you.",
                    timestamp: Date.now()
                });
            }
        }
        init();
    }, []);

    const handleSubmit = async (text: string) => {
        if (!configRef.current.global) return;

        const runtimeContext: RuntimeContext = {
            config: configRef.current.global,
            workspaceConfig: configRef.current.workspace,
            modelRegistry,
            bus,
            cwd: process.cwd(),
            addMessage,
            updateMessage,
            setProcessing,
            toolRegistry,
            contextManager,
            mcpManager,
            skillLoader,
            skillRegistry,
            sessionStore,
            pluginRegistry,
        };

        // 1. Check for slash commands
        const cmd = commandRegistry.parse(text);
        if (cmd) {
            const result = await cmd.command.execute(cmd.args, runtimeContext);
            if (result.type === "message" && result.content) {
                addMessage({
                    id: Math.random().toString(36).substring(7),
                    role: "assistant",
                    content: result.content,
                    timestamp: Date.now(),
                });
            }

            // NEW: handle interactive components
            if (result.type === "component" && result.componentName) {
                openDialog(result.componentName);
                return;
            }

            // Update model display
            const active = modelRegistry.getActive();
            if (active) {
                setModel(active.name);
                agentLoopRef.current = new AgentLoop(active, toolRegistry, toolExecutor, contextManager, skillRegistry, state.mode);
            }
            return;
        }

        // 2. Chat with AgentLoop
        const provider = modelRegistry.getActive();
        if (!provider || !agentLoopRef.current) {
            addMessage({
                id: Math.random().toString(36).substring(7),
                role: "assistant",
                content: "No active model. Use /models to activate one.",
                timestamp: Date.now(),
            });
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const userMsg: Message = {
                id: Math.random().toString(36).substring(7),
                role: "user",
                content: text,
                timestamp: Date.now(),
            };
            addMessage(userMsg);

            let assistantId = "";
            let fullContent = "";
            let initialThinkingId = Math.random().toString(36).substring(7);

            // Show initial "Thinking..." message
            addMessage({
                id: initialThinkingId,
                role: "assistant",
                content: "Thinking...",
                timestamp: Date.now(),
            });

            for await (const event of agentLoopRef.current.run(text)) {
                // Remove initial thinking on first event
                if (initialThinkingId) {
                    // We'll replace it with the actual content/tool call
                    updateMessage(initialThinkingId, "");
                    // Using empty string to mark it for replacement later
                    // Or we could have a way to 'delete' but let's just reuse the ID
                    assistantId = initialThinkingId;
                    initialThinkingId = "";
                }

                switch (event.type) {
                    case "text":
                        if (!assistantId) {
                            assistantId = Math.random().toString(36).substring(7);
                            addMessage({
                                id: assistantId,
                                role: "assistant",
                                content: "",
                                timestamp: Date.now(),
                            });
                        }
                        fullContent += event.content;
                        updateMessage(assistantId, fullContent);
                        break;

                    case "tool_start":
                        const toolCallId = Math.random().toString(36).substring(7);
                        addMessage({
                            id: toolCallId,
                            role: "assistant",
                            content: `🔧 Executing ${event.name}...`,
                            timestamp: Date.now(),
                            toolCalls: [{ id: toolCallId, name: event.name, args: event.args }]
                        });
                        assistantId = "";
                        fullContent = "";
                        break;

                    case "error":
                        setError(event.message);
                        break;

                    case "done":
                        break;
                }
            }

            // Save Session
            const messages = contextManager.getMessages();
            const now = Date.now();
            const title = state.sessionName || messages[0]?.content.slice(0, 30) || "New Session";
            await sessionStore.save({
                meta: {
                    id: state.sessionId || Math.random().toString(36).substring(7),
                    title,
                    model: provider.name,
                    provider: provider.type,
                    updatedAt: now,
                    createdAt: now,
                    messageCount: messages.length,
                },
                messages,
            });

            if (!state.sessionName) {
                setSessionName(title);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        const handleTheme = (e: any) => {
            if (e.message && e.message.startsWith("Theme changed to: ")) {
                const themeName = e.message.split(": ")[1];
                themeManager.set(themeName);
                setCurrentTheme(themeManager.get());
            }
        };
        bus.on("error", handleTheme);
        return () => { bus.off("error", handleTheme); };
    }, []);

    useInput((input: string, key: any) => {
        // Fix for terminals where Ink doesn't set key.escape but input is the escape character
        const isEscape = key.escape || input === "\u001B" || input === "\x1B" || input === "^]";

        let keyStr = "";
        if (key.ctrl) keyStr += "ctrl+";
        if (key.meta) keyStr += "meta+";
        keyStr += (isEscape ? "escape" : (key.tab ? "tab" : input));

        const action = keybindingManager.getAction(keyStr);
        if (!action) return;

        // Guard: Most actions are disabled while a dialog is open
        if (activeDialog && action !== "navigateBack") {
            return;
        }

        switch (action) {
            case "cycleTheme":
                themeManager.cycle();
                setCurrentTheme(themeManager.get());
                break;
            case "toggleMode":
                const newMode = state.mode === "build" ? "plan" : "build";
                setMode(newMode);
                const active = modelRegistry.getActive();
                if (active) {
                    agentLoopRef.current = new AgentLoop(active, toolRegistry, toolExecutor, contextManager, skillRegistry, newMode);
                }
                break;
            case "openHelp":
                openDialog("help");
                break;
            case "navigateBack":
                // 1. Close suggestions if open
                if (suggestionsOpenRef.current) {
                    closeSuggestionsRef.current?.();
                    return;
                }

                // 2. Clear error/confirm exit state if it was just confirming
                if (escPending) {
                    if (escTimerRef.current) clearTimeout(escTimerRef.current);
                    process.exit(0);
                    return;
                }

                // 3. Close active dialog
                if (activeDialog) {
                    closeDialog();
                    return;
                }

                // 4. Fallback: prompt exit
                setEscPending(true);
                setError("Press Esc again to exit");
                if (escTimerRef.current) clearTimeout(escTimerRef.current);
                escTimerRef.current = setTimeout(() => {
                    setEscPending(false);
                    setError(null);
                    escTimerRef.current = null;
                }, 2000);
                break;
        }
    });

    const handleEscape = useCallback(() => {
        // 1. Close suggestions if open
        if (suggestionsOpenRef.current) {
            closeSuggestionsRef.current?.();
            return;
        }

        // 2. Clear error/confirm exit state if it was just confirming
        if (escPending) {
            if (escTimerRef.current) clearTimeout(escTimerRef.current);
            process.exit(0);
            return;
        }

        // 3. Close active dialog
        if (activeDialog) {
            closeDialog();
            return;
        }

        // 4. Fallback: prompt exit
        setEscPending(true);
        setError("Press Esc again to exit");
        if (escTimerRef.current) clearTimeout(escTimerRef.current);
        escTimerRef.current = setTimeout(() => {
            setEscPending(false);
            setError(null);
            escTimerRef.current = null;
        }, 2000);
    }, [activeDialog, escPending, closeDialog, setError]);


    const activeProvider = modelRegistry.getActive();

    // Autocomplete state
    const [filteredSuggestions, setFilteredSuggestions] = useState<Array<{ name: string; description: string }>>([]);

    const handleSuggestionsRequest = useCallback((partial: string) => {
        const cmds = commandRegistry.getSuggestions(partial);
        setFilteredSuggestions(cmds.map(c => ({ name: c.name, description: c.description })));
    }, [commandRegistry]);

    return (
        <Box flexDirection="column" height="100%">
            <Box flexDirection="row" flexGrow={1}>
                <Box flexDirection="column" flexGrow={1}>
                    <MessageList messages={state.messages} isProcessing={state.isProcessing} theme={currentTheme} />
                </Box>
            </Box>
            <Box flexDirection="column">
                <StatusBar
                    error={state.error}
                    cwd={process.cwd()}
                    theme={currentTheme}
                    model={state.currentModel}
                    provider={activeProvider?.type || "none"}
                    mode={state.mode}
                />
                <InputBox
                    onSubmit={handleSubmit}
                    disabled={state.isProcessing || !!activeDialog}
                    placeholder="Ask a question or type '/' for commands..."
                    suggestions={filteredSuggestions}
                    onSuggestionsRequest={handleSuggestionsRequest}
                    onSuggestionsVisibilityChange={(visible) => { suggestionsOpenRef.current = visible; }}
                    closeSuggestionsRef={closeSuggestionsRef}
                    onEscape={handleEscape}
                    theme={currentTheme}
                />
            </Box>

            {activeDialog === "help" && (
                <HelpDialog
                    visible={true}
                    theme={currentTheme}
                    keybindings={keybindingManager.list()}
                    commands={commandRegistry.getAll()}
                    onClose={closeDialog}
                />
            )}

            {activeDialog === "add-wizard" && (
                <AddWizard
                    theme={currentTheme}
                    onComplete={async (result) => {
                        closeDialog();
                        // Process result
                        if (result.type === "model" && result.providerConfig) {
                            configRef.current.global?.addProvider(result.providerConfig);
                            await configRef.current.global?.save();
                            await modelRegistry.init(configRef.current.global!);
                            const active = modelRegistry.getActive();
                            if (active) {
                                setModel(active.name);
                                agentLoopRef.current = new AgentLoop(active, toolRegistry, toolExecutor, contextManager, skillRegistry, state.mode);
                            }
                            addMessage({
                                id: Math.random().toString(36).substring(7),
                                role: "assistant",
                                content: `Model "${result.providerConfig.name}" registered and active.`,
                                timestamp: Date.now(),
                            });
                        }
                    }}
                    onCancel={closeDialog}
                />
            )}

            {activeDialog === "model-selector" && (
                <ModelSelector
                    visible={true}
                    providers={modelRegistry.list()}
                    activeProviderName={activeProvider?.name}
                    theme={currentTheme}
                    onSelect={async (providerName) => {
                        closeDialog();
                        modelRegistry.setActive(providerName);
                        await configRef.current.global?.setActiveProvider(providerName);

                        const active = modelRegistry.getActive();
                        if (active) {
                            setModel(active.name);
                            agentLoopRef.current = new AgentLoop(active, toolRegistry, toolExecutor, contextManager, skillRegistry, state.mode);
                        }

                        addMessage({
                            id: Math.random().toString(36).substring(7),
                            role: "assistant",
                            content: `Modelo activo cambiado a: ${providerName}`,
                            timestamp: Date.now(),
                        });
                    }}
                    onClose={closeDialog}
                />
            )}

        </Box>
    );
}
