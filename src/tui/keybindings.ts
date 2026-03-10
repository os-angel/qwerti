export interface Keybinding {
    key: string;
    action: string;
    description: string;
}

export const defaultKeybindings: Keybinding[] = [
    { key: "ctrl+k", action: "openCommandPalette", description: "Open command palette" },
    { key: "ctrl+l", action: "clearScreen", description: "Clear messages" },
    { key: "ctrl+m", action: "openModelSelector", description: "Select model" },
    { key: "ctrl+s", action: "openSessionList", description: "Browse sessions" },
    { key: "ctrl+h", action: "openHelp", description: "Show help" },
    { key: "ctrl+t", action: "cycleTheme", description: "Cycle theme" },
    { key: "escape", action: "navigateBack", description: "Go back or exit" },
    { key: "tab", action: "toggleMode", description: "Switch build/plan mode" },
];

export class KeybindingManager {
    private bindings: Keybinding[];

    constructor(custom?: Keybinding[]) {
        this.bindings = custom ?? [...defaultKeybindings];
    }

    getAction(key: string): string | null {
        const binding = this.bindings.find(b => b.key === key);
        return binding?.action ?? null;
    }

    list(): Keybinding[] { return this.bindings; }
}
