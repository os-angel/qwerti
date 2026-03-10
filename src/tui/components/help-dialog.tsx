import React from "react";
import { Box, Text } from "ink";
import { DialogOverlay } from "./dialog-overlay.tsx";
import { type Theme } from "../theme.ts";
import { type Keybinding } from "../keybindings.ts";

interface HelpDialogProps {
    visible: boolean;
    theme: Theme;
    keybindings: Keybinding[];
    commands: any[];
    onClose: () => void;
}

export function HelpDialog({ visible, theme, keybindings, commands, onClose }: HelpDialogProps) {
    return (
        <DialogOverlay visible={visible} title="QWERTI HELP" theme={theme} onClose={onClose}>
            <Box flexDirection="column">
                <Text bold color={theme.accent}>Keyboard Shortcuts:</Text>
                {keybindings.map(kb => (
                    <Box key={kb.key}>
                        <Text color={theme.primary} bold>{kb.key.padEnd(12)}</Text>
                        <Text color={theme.text}>{kb.description}</Text>
                    </Box>
                ))}

                <Box marginTop={1} flexDirection="column">
                    <Text bold color={theme.accent}>Slash Commands:</Text>
                    {commands.map(cmd => (
                        <Box key={cmd.name}>
                            <Text color={theme.secondary} bold>{"/" + cmd.name.padEnd(15)}</Text>
                            <Text color={theme.text}>{cmd.description}</Text>
                        </Box>
                    ))}
                </Box>
            </Box>
        </DialogOverlay>
    );
}
