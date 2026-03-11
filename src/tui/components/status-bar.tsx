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
            paddingX={1}
            width="100%"
            justifyContent="space-between"
            borderStyle="single"
            borderTop={true}
            borderBottom={false}
            borderLeft={false}
            borderRight={false}
            borderColor={theme.textDim}
        >
            <Box>
                <Text color={theme.textDim}> 📁 {shortPath}  </Text>
                <Text color={theme.textDim} dimColor> | </Text>
                {model && (
                    <Box>
                        <Text color={theme.textDim}> 🤖 {model} </Text>
                        <Text color={theme.textDim} dimColor> | </Text>
                    </Box>
                )}
                <Text color={mode === "build" ? theme.accent : theme.warning} bold> {mode.toUpperCase()} </Text>
            </Box>
            <Box>
                {error ? (
                    <Text color={theme.error}> ⚠️ {error} </Text>
                ) : (
                    <Text color={theme.success} dimColor> ● Connected </Text>
                )}
            </Box>
        </Box>
    );
}
