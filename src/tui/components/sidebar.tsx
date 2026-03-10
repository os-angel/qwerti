import React from "react";
import { Box, Text } from "ink";
import { type AgentMode } from "../../core/types.ts";
import { type Theme } from "../theme.ts";

interface SidebarProps {
    sessionName: string | null;
    model: string | null;
    provider: string | null;
    mode: AgentMode;
    cwd: string;
    checkpoints: string[];
    theme: Theme;
}

export function Sidebar({ sessionName, model, provider, mode, cwd, checkpoints, theme }: SidebarProps) {
    const shortPath = cwd.split('/').pop();

    return (
        <Box
            flexDirection="column"
            width={30}
            borderStyle="single"
            borderColor={theme.primary}
            paddingX={1}
        >
            <Box marginBottom={1}>
                <Text bold color={theme.accent}>QWERTI</Text>
                <Text color={theme.textDim}> v0.1.0</Text>
            </Box>

            <Box flexDirection="column" marginBottom={1}>
                <Text bold underline color={theme.primary}>Session</Text>
                <Text color={theme.text}>{sessionName || "untitled"}</Text>
            </Box>

            <Box flexDirection="column" marginBottom={1}>
                <Text bold underline color={theme.primary}>Model</Text>
                <Text color={theme.text}>{model || "none"}</Text>
                {provider && <Text color={theme.textDim} italic>@ {provider}</Text>}
            </Box>

            <Box flexDirection="column" marginBottom={1}>
                <Text bold underline color={theme.primary}>Mode</Text>
                <Box>
                    <Text color={mode === "build" ? theme.success : theme.textDim}>
                        {mode === "build" ? "[build]" : " build "}
                    </Text>
                    <Text color={theme.text}> | </Text>
                    <Text color={mode === "plan" ? theme.warning : theme.textDim}>
                        {mode === "plan" ? "[plan]" : " plan "}
                    </Text>
                </Box>
                <Text color={theme.textDim} dimColor>Tab to switch</Text>
            </Box>

            <Box flexDirection="column" marginBottom={1}>
                <Text bold underline color={theme.primary}>Memory</Text>
                {checkpoints.length === 0 ? (
                    <Text color={theme.textDim} italic>no checkpoints</Text>
                ) : (
                    checkpoints.slice(-5).map((cp, idx) => (
                        <Text key={idx} color={theme.textDim}>• {cp}</Text>
                    ))
                )}
            </Box>

            <Box flexGrow={1} />

            <Box flexDirection="column">
                <Text bold underline color={theme.primary}>Path</Text>
                <Text color={theme.textDim}>{shortPath}</Text>
            </Box>
        </Box>
    );
}
