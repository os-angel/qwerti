import React from "react";
import { Box, Text } from "ink";
import { type Theme } from "../theme.ts";

interface MarkdownRendererProps {
    content: string;
    theme: Theme;
}

export function MarkdownRenderer({ content, theme }: MarkdownRendererProps) {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        // Code block
        if (line.trim().startsWith("```")) {
            const lang = line.trim().slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(<CodeBlock key={i} language={lang} lines={codeLines} theme={theme} />);
            i++; // skip closing
            continue;
        }

        // Blockquote
        if (line.startsWith("> ")) {
            elements.push(
                <Box key={i} borderLeft borderLeftColor={theme.textDim} paddingLeft={1} marginBottom={1}>
                    <Text italic color={theme.textDim}>{line.slice(2)}</Text>
                </Box>
            );
            i++;
            continue;
        }

        // Headers
        if (line.startsWith("# ")) {
            elements.push(<Box key={i} marginBottom={1}><Text bold color={theme.primary}>{line.slice(2)}</Text></Box>);
            i++; continue;
        }
        if (line.startsWith("## ")) {
            elements.push(<Box key={i} marginBottom={1}><Text bold color={theme.secondary}>{line.slice(3)}</Text></Box>);
            i++; continue;
        }

        // Horizontal rule
        if (line.startsWith("---")) {
            elements.push(<Text key={i} color={theme.textDim}>{"─".repeat(40)}</Text>);
            i++; continue;
        }

        // List items
        const listMatch = line.match(/^(\d+)\.\s(.*)/);
        if (listMatch) {
            elements.push(
                <Box key={i} marginLeft={2}>
                    <Text color={theme.primary}>{listMatch[1]}. </Text>
                    <Text>{renderInline(listMatch[2], theme)}</Text>
                </Box>
            );
            i++; continue;
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
            elements.push(
                <Box key={i} marginLeft={2}>
                    <Text color={theme.primary}>• </Text>
                    <Text>{renderInline(line.slice(2), theme)}</Text>
                </Box>
            );
            i++; continue;
        }

        // Normal line
        if (line.trim() !== "") {
            elements.push(<Text key={i}>{renderInline(line, theme)}</Text>);
        } else {
            elements.push(<Text key={i}> </Text>);
        }
        i++;
    }

    return <Box flexDirection="column">{elements}</Box>;
}

function CodeBlock({ language, lines, theme }: { language: string, lines: string[], theme: Theme }) {
    return (
        <Box flexDirection="column" marginY={1}>
            <Box>
                <Text color={theme.primary}>┃ </Text>
                <Text dimColor italic>{language || "code"}</Text>
            </Box>
            {lines.map((line, idx) => (
                <Box key={idx}>
                    <Text color={theme.primary}>┃ </Text>
                    <Text color={theme.accent}>{line}</Text>
                </Box>
            ))}
        </Box>
    );
}

function renderInline(text: string, theme: Theme): React.ReactNode[] {
    const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return tokens.map((token, i) => {
        if (token.startsWith("`") && token.endsWith("`")) {
            return <Text key={i} backgroundColor="#333333" color={theme.accent}> {token.slice(1, -1)} </Text>;
        }
        if (token.startsWith("**") && token.endsWith("**")) {
            return <Text key={i} bold>{token.slice(2, -2)}</Text>;
        }
        if (token.startsWith("*") && token.endsWith("*")) {
            return <Text key={i} italic>{token.slice(1, -1)}</Text>;
        }
        return <Text key={i}>{token}</Text>;
    });
}
