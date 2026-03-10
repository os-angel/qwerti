import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { type Message, type ToolCall, type ToolResult } from "../../core/types.ts";
import { MarkdownRenderer } from "./markdown-renderer.tsx";
import { type Theme } from "../theme.ts";

interface MessageListProps {
    messages: Message[];
    isProcessing: boolean;
    theme: Theme;
}

export function MessageList({ messages, isProcessing, theme }: MessageListProps) {
    return (
        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
            {messages.map((msg) => (
                <Box key={msg.id} flexDirection="column" marginBottom={1}>
                    {msg.role === "user" ? (
                        <Box marginBottom={1}>
                            <Box borderLeft borderLeftColor={theme.primary} paddingLeft={1}>
                                <Text color={theme.userMessage} bold>You </Text>
                                <Text color={theme.text}>{msg.content}</Text>
                            </Box>
                        </Box>
                    ) : (
                        <Box flexDirection="column" marginBottom={1}>
                            <MarkdownRenderer content={msg.content} theme={theme} />
                        </Box>
                    )}

                    {msg.toolCalls?.map((tc) => {
                        const tr = msg.toolResults?.find(r => r.callId === tc.id);
                        const isPending = !tr;
                        const isError = tr?.isError;

                        return (
                            <Box key={tc.id} marginLeft={2} marginBottom={1} flexDirection="column">
                                <Box>
                                    <Text color={isError ? theme.error : (isPending ? theme.accent : theme.success)}>
                                        {isError ? "✖ " : (isPending ? <Spinner type="dots" /> : "✔ ")}
                                    </Text>
                                    <Text color={theme.primary} bold>{tc.name}</Text>
                                    <Text color={theme.textDim}> {JSON.stringify(tc.args).slice(0, 50)}...</Text>
                                </Box>
                                {tr && tr.result && !isPending && (
                                    <Box marginLeft={3} borderLeft borderLeftColor={theme.textDim} paddingLeft={1}>
                                        <Text color={theme.textDim} italic>
                                            {tr.result.length > 150 ? tr.result.slice(0, 150) + "..." : tr.result}
                                        </Text>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            ))}
            {isProcessing && (
                <Box marginLeft={0} marginTop={1}>
                    <Text color={theme.accent}>
                        <Spinner type="dots" /> <Text italic>Thinking...</Text>
                    </Text>
                </Box>
            )}
        </Box>
    );
}
