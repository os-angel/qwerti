import React from "react";
import { Box, Text } from "ink";
import { type Theme } from "../theme.ts";
import { type AgentMode } from "../../core/types.ts";

interface StatusBarProps {
    error: string | null;
    cwd: string;
    theme: Theme;
    model: string | null;
    provider: string | null;
    mode: AgentMode;
}

export function StatusBar({ error, cwd, theme, model, provider, mode }: StatusBarProps) {
    const shortPath = cwd.split('/').pop();

    return (
        <Box
            paddingX={2}
            width="100%"
            justifyContent="space-between"
            marginBottom={0}
        >
            <Box>
                <Text color={theme.textDim}>{shortPath} | </Text>
                {model && <Text color={theme.textDim}>{model} @ {provider} | </Text>}
                <Text color={mode === "build" ? theme.success : theme.warning}>{mode}</Text>
            </Box>
            <Text color={error ? theme.error : theme.success}>
                {error || "Ready"}
            </Text>
        </Box>
    );
}
