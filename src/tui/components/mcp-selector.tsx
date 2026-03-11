import React from "react";
import { DialogOverlay } from "./dialog-overlay.tsx";
import { SelectList } from "./select-list.tsx";
import { type Theme } from "../theme.ts";
import { Box, Text } from "ink";

export interface MCPStateInfo {
    name: string;
    connected: boolean;
    toolCount: number;
    tools: string[];
}

interface MCPSelectorProps {
    visible: boolean;
    servers: MCPStateInfo[];
    theme: Theme;
    onSelect: (serverName: string) => void;
    onClose: () => void;
}

export function MCPSelector({ visible, servers, theme, onSelect, onClose }: MCPSelectorProps) {
    if (!visible) return null;

    if (servers.length === 0) {
        return (
            <DialogOverlay visible={visible} title="Gestor de MCP" theme={theme} onClose={onClose}>
                <Box padding={1}>
                    <Text color={theme.colors.error}>No hay servidores MCP configurados. Usa /add mcp para conectar uno.</Text>
                </Box>
            </DialogOverlay>
        );
    }

    const items = servers.map((s) => ({
        label: `${s.connected ? "✅" : "❌"} ${s.name}`,
        value: s.name,
        hint: `${s.toolCount} tools`,
    }));

    return (
        <DialogOverlay visible={visible} title="Gestor de MCP (Enter para opciones)" theme={theme} onClose={onClose}>
            <SelectList
                items={items}
                onSelect={onSelect}
                onCancel={onClose}
            />
        </DialogOverlay>
    );
}
