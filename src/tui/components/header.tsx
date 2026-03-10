import React from "react";
import { Box, Text } from "ink";
import { type AgentMode } from "../../core/types.ts";

interface HeaderProps {
    model: string | null;
    mode: AgentMode;
}

export function Header({ model, mode }: HeaderProps) {
    return (
        <Box
            borderStyle="round"
            borderColor="green"
            paddingX={1}
            justifyContent="space-between"
            width="100%"
        >
            <Text color="green" bold>qwerti</Text>
            <Text>{model || "sin modelo"}</Text>
            <Text color="cyan">{mode}</Text>
        </Box>
    );
}
