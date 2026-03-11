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
                            <Box paddingX={1}>
                                <Text color={theme.userMessage} bold>❯ </Text>
                                <Text color={theme.text}>{msg.content}</Text>
                            </Box>
                        </Box>
                    ) : (
                        <Box flexDirection="column" marginBottom={1} paddingX={1}>
                            <MarkdownRenderer content={msg.content} theme={theme} />
                        </Box>
                    )}

                    {msg.toolCalls?.map((tc) => {
                        const tr = msg.toolResults?.find(r => r.callId === tc.id);
                        const isPending = !tr;
                        const isError = tr?.isError;

                        return (
                            <Box key={tc.id} marginLeft={2} marginBottom={0} flexDirection="column">
                                <Box>
                                    <Text color={isError ? theme.error : (isPending ? theme.warning : theme.success)}>
                                        {isError ? " ✘ " : (isPending ? <Spinner type="dots" /> : " ⚙ ")}
                                    </Text>
                                    <Text color={theme.primary} dimColor={!isPending}>{tc.name}</Text>
                                    <Text color={theme.textDim}> {Object.keys(tc.args).join(", ")}</Text>
                                </Box>
                                {tr && tr.result && !isPending && (
                                    <Box marginLeft={3} marginTop={0} marginBottom={1}>
                                        <Text color={theme.textDim} dimColor italic>
                                            {tr.result.length > 200 ? tr.result.slice(0, 200).replace(/\n/g, ' ') + "..." : tr.result.replace(/\n/g, ' ')}
                                        </Text>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            ))}
            {isProcessing && (
                <Box marginLeft={1} marginTop={0}>
                    <Text color={theme.accent}>
                        <Spinner type="dots" /> <Text italic dimColor> Generating response...</Text>
                    </Text>
                </Box>
            )}
        </Box>
    );
}
