import React from "react";
import { Box, Text } from "ink";
import { type Theme } from "../theme.ts";

interface CommandSuggestionsProps {
    suggestions: Array<{ name: string; description: string }>;
    selectedIndex: number;
    theme: Theme;
}

export function CommandSuggestions({ suggestions, selectedIndex, theme }: CommandSuggestionsProps) {
    if (suggestions.length === 0) return null;

    return (
        <Box
            flexDirection="column"
            paddingX={2}
            marginBottom={1}
            borderStyle="single"
            borderTop={false}
            borderBottom={false}
            borderRight={false}
            borderLeftColor={theme.primary}
        >
            {suggestions.map((cmd, i) => (
                <Box key={cmd.name}>
                    <Text
                        color={i === selectedIndex ? theme.primary : theme.text}
                        bold={i === selectedIndex}
                        inverse={i === selectedIndex}
                    >
                        {" /"}{cmd.name.padEnd(12)}
                    </Text>
                    <Text color={theme.textDim}> {cmd.description}</Text>
                </Box>
            ))}
        </Box>
    );
}
