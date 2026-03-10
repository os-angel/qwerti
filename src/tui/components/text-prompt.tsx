import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface TextPromptProps {
    label: string;
    placeholder?: string;
    defaultValue?: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
}

export function TextPrompt({ label, placeholder, defaultValue, onSubmit, onCancel }: TextPromptProps) {
    const [value, setValue] = useState(defaultValue ?? "");

    useInput((input, key) => {
        const isEscape = key.escape || input === "\u001B" || input === "\x1B" || input === "^]";
        if (isEscape) {
            onCancel();
            return;
        }

        if (key.return) {
            onSubmit(value || defaultValue || "");
            return;
        }
        if (key.backspace || key.delete) {
            setValue(v => v.slice(0, -1));
            return;
        }
        if (input && !key.ctrl && !key.meta) {
            setValue(v => v + input);
        }
    });

    return (
        <Box>
            <Text bold>{label}: </Text>
            <Text color="cyan">{value || (placeholder ? <Text color="gray">{placeholder}</Text> : "")}</Text>
            <Text backgroundColor="white" color="black"> </Text>
        </Box>
    );
}
