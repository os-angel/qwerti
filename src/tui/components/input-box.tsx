import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { CommandSuggestions } from "./command-suggestions.tsx";
import { type Theme } from "../theme.ts";

interface InputBoxProps {
    onSubmit: (text: string) => void;
    disabled: boolean;
    placeholder?: string;
    suggestions?: Array<{ name: string; description: string }>;
    onSuggestionsRequest?: (partial: string) => void;
    onSuggestionSelect?: (name: string) => void;
    onSuggestionsVisibilityChange?: (visible: boolean) => void;
    onEscape?: () => void;
    closeSuggestionsRef?: React.MutableRefObject<(() => void) | null>;
    theme: Theme;
}

export function InputBox({
    onSubmit,
    disabled,
    placeholder,
    suggestions = [],
    onSuggestionsRequest,
    onSuggestionSelect,
    onSuggestionsVisibilityChange,
    onEscape,
    closeSuggestionsRef,
    theme
}: InputBoxProps) {
    const [input, setInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Notifications handled externally

    // Notify App.tsx about suggestion visibility
    useEffect(() => {
        onSuggestionsVisibilityChange?.(showSuggestions);
        if (closeSuggestionsRef) {
            closeSuggestionsRef.current = () => setShowSuggestions(false);
        }
    }, [showSuggestions, onSuggestionsVisibilityChange, closeSuggestionsRef]);

    useInput((inputStr, key) => {
        if (disabled) return;

        // Navigation in suggestions
        if (showSuggestions && suggestions.length > 0) {
            if (key.upArrow) {
                setSelectedIndex(prev => Math.max(0, prev - 1));
                return;
            }
            if (key.downArrow) {
                setSelectedIndex(prev => Math.min(suggestions.length - 1, prev + 1));
                return;
            }
            const isEscape = key.escape || inputStr === "\u001B" || inputStr === "\x1B" || inputStr === "^]";
            if (isEscape) {
                setShowSuggestions(false);
                return;
            }
            if (key.return) {
                const selected = suggestions[selectedIndex];
                const newValue = "/" + selected.name + " ";
                setInput(newValue);
                setShowSuggestions(false);
                if (onSuggestionSelect) onSuggestionSelect(selected.name);
                return;
            }
        }

        if (key.return || inputStr === '\r' || inputStr === '\n') {
            if (input.trim()) {
                onSubmit(input);
                setInput("");
                setShowSuggestions(false);
            }
            return;
        }

        if (key.backspace || key.delete) {
            const nextInput = input.slice(0, -1);
            setInput(nextInput);

            if (nextInput.startsWith("/")) {
                setShowSuggestions(true);
                if (onSuggestionsRequest) onSuggestionsRequest(nextInput);
                setSelectedIndex(0);
            } else {
                setShowSuggestions(false);
            }
            return;
        }

        const isEscape = key.escape || inputStr === "\u001B" || inputStr === "\x1B" || inputStr === "^]";
        if (isEscape) {
            onEscape?.();
            return;
        }

        // Only allow printable characters
        if (inputStr && !key.ctrl && !key.meta && !isEscape) {
            const nextInput = input + inputStr;
            setInput(nextInput);

            if (nextInput.startsWith("/")) {
                setShowSuggestions(true);
                if (onSuggestionsRequest) onSuggestionsRequest(nextInput);
                setSelectedIndex(0);
            } else {
                setShowSuggestions(false);
            }
        }
    });

    return (
        <Box flexDirection="column">
            {showSuggestions && suggestions.length > 0 && (
                <CommandSuggestions
                    suggestions={suggestions}
                    selectedIndex={selectedIndex}
                    theme={theme}
                />
            )}
            <Box paddingX={2} marginBottom={1}>
                <Text color={disabled ? "gray" : theme.primary} bold>❯ </Text>
                <Text color={disabled ? "gray" : "white"}>{input}</Text>
                {!input && placeholder && <Text color="gray">{placeholder}</Text>}
                {!disabled && <Text backgroundColor={theme.primary} color="black"> </Text>}
            </Box>
        </Box>
    );
}
