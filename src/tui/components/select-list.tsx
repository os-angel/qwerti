import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

export interface SelectItem<T = string> {
    label: string;
    value: T;
    hint?: string;
}

interface SelectListProps<T = string> {
    title?: string;
    items: SelectItem<T>[];
    onSelect: (value: T) => void;
    onCancel: () => void;
}

export function SelectList<T>({ title, items, onSelect, onCancel }: SelectListProps<T>) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useInput((input, key) => {
        const isEscape = key.escape || input === "\u001B" || input === "\x1B" || input === "^]";
        if (isEscape) {
            onCancel();
            return;
        }

        if (key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
        if (key.downArrow) setSelectedIndex(i => Math.min(items.length - 1, i + 1));
        if (key.return) onSelect(items[selectedIndex].value);
    });

    return (
        <Box flexDirection="column">
            {title && <Box marginBottom={1}><Text bold color="cyan">{title}</Text></Box>}
            {items.map((item, i) => (
                <Box key={i}>
                    <Text
                        color={i === selectedIndex ? "green" : "white"}
                        bold={i === selectedIndex}
                    >
                        {i === selectedIndex ? "> " : "  "}{item.label}
                    </Text>
                    {i === selectedIndex && item.hint && (
                        <Text color="gray"> ({item.hint})</Text>
                    )}
                </Box>
            ))}
        </Box>
    );
}
