import React from "react";
import { Box, Text, useInput } from "ink";
import { type Theme } from "../theme.ts";

interface DialogOverlayProps {
    visible: boolean;
    title: string;
    theme: Theme;
    onClose: () => void;
    children: React.ReactNode;
}

export function DialogOverlay({ visible, title, theme, onClose, children }: DialogOverlayProps) {
    if (!visible) return null;

    useInput((input, key) => {
        const isEscape = key.escape || input === "\u001B" || input === "\x1B" || input === "^]";
        if (isEscape) {
            onClose();
        }
    });

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={theme.primary}
            paddingX={1}
            position="absolute"
            width="80%"
            marginLeft={10}
            marginTop={2}
        >
            <Box justifyContent="space-between">
                <Text bold color={theme.primary}>{title}</Text>
                <Text dimColor>[Esc] Close</Text>
            </Box>
            <Box flexDirection="column" marginTop={1}>
                {children}
            </Box>
        </Box>
    );
}
