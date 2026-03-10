import React from "react";
import { DialogOverlay } from "./dialog-overlay.tsx";
import { SelectList } from "./select-list.tsx";
import { type Theme } from "../theme.ts";
import { ProviderConfig } from "../../core/types.ts";

interface ModelSelectorProps {
    visible: boolean;
    providers: Array<{ name: string; type: string }>;
    activeProviderName?: string;
    theme: Theme;
    onSelect: (providerName: string) => void;
    onClose: () => void;
}

export function ModelSelector({ visible, providers, activeProviderName, theme, onSelect, onClose }: ModelSelectorProps) {
    if (!visible) return null;

    const items = providers.map((p) => ({
        label: p.name === activeProviderName ? `${p.name} (Activo)` : p.name,
        value: p.name,
        hint: p.type,
    }));

    return (
        <DialogOverlay visible={visible} title="Seleccionar Modelo" theme={theme} onClose={onClose}>
            <SelectList
                items={items}
                onSelect={onSelect}
                onCancel={onClose}
            />
        </DialogOverlay>
    );
}
