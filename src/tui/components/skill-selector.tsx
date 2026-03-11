import React from "react";
import { DialogOverlay } from "./dialog-overlay.tsx";
import { SelectList } from "./select-list.tsx";
import { type Theme } from "../theme.ts";
import { Box, Text } from "ink";

export interface SkillStateInfo {
    name: string;
    description: string;
    isActive: boolean;
}

interface SkillSelectorProps {
    visible: boolean;
    skills: SkillStateInfo[];
    theme: Theme;
    onSelect: (skillName: string) => void;
    onClose: () => void;
}

export function SkillSelector({ visible, skills, theme, onSelect, onClose }: SkillSelectorProps) {
    if (!visible) return null;

    if (skills.length === 0) {
        return (
            <DialogOverlay visible={visible} title="Gestor de Skills" theme={theme} onClose={onClose}>
                <Box padding={1}>
                    <Text color={theme.colors.error}>No hay Skills disponibles en ~/.qwerti/skills</Text>
                </Box>
            </DialogOverlay>
        );
    }

    const items = skills.map((s) => ({
        label: `${s.isActive ? "✨" : "  "} ${s.name}`,
        value: s.name,
        hint: s.description,
    }));

    return (
        <DialogOverlay visible={visible} title="Gestor de Skills (Enter para alternar ON/OFF)" theme={theme} onClose={onClose}>
            <SelectList
                items={items}
                onSelect={onSelect}
                onCancel={onClose}
            />
        </DialogOverlay>
    );
}
