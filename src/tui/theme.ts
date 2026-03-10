export interface Theme {
    name: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textDim: string;
    background: string;
    error: string;
    warning: string;
    success: string;
    userMessage: string;
    assistantMessage: string;
    toolCall: string;
}

export const themes: Record<string, Theme> = {
    qwerti: {
        name: "qwerti",
        primary: "#00FF00",
        secondary: "#00CC00",
        accent: "#00FFAA",
        text: "#FFFFFF",
        textDim: "#888888",
        background: "",
        error: "#FF4444",
        warning: "#FFAA00",
        success: "#00FF00",
        userMessage: "#00FF00",
        assistantMessage: "#FFFFFF",
        toolCall: "#00CCCC",
    },
    ocean: {
        name: "ocean",
        primary: "#00BFFF",
        secondary: "#1E90FF",
        accent: "#7FFFD4",
        text: "#F0F8FF",
        textDim: "#708090",
        background: "",
        error: "#FF6347",
        warning: "#FFD700",
        success: "#00FA9A",
        userMessage: "#00BFFF",
        assistantMessage: "#F0F8FF",
        toolCall: "#20B2AA",
    },
    sunset: {
        name: "sunset",
        primary: "#FF4500",
        secondary: "#FF8C00",
        accent: "#FFD700",
        text: "#FFF5EE",
        textDim: "#BC8F8F",
        background: "",
        error: "#DC143C",
        warning: "#FFA500",
        success: "#32CD32",
        userMessage: "#FF4500",
        assistantMessage: "#FFF5EE",
        toolCall: "#DA70D6",
    },
    minimal: {
        name: "minimal",
        primary: "#AE81FF", // Anthropic Purple
        secondary: "#66D9EF",
        accent: "#A6E22E",
        text: "#F8F8F2",
        textDim: "#75715E",
        background: "",
        error: "#F92672",
        warning: "#FD971F",
        success: "#A6E22E",
        userMessage: "#A6E22E",
        assistantMessage: "#F8F8F2",
        toolCall: "#66D9EF",
    }
};

export class ThemeManager {
    private currentTheme: Theme;

    constructor(themeName: string = "qwerti") {
        this.currentTheme = themes[themeName] ?? themes.qwerti;
    }

    get(): Theme { return this.currentTheme; }

    set(name: string): void {
        if (themes[name]) {
            this.currentTheme = themes[name];
        }
    }

    cycle(): void {
        const keys = Object.keys(themes);
        const index = keys.indexOf(this.currentTheme.name);
        const next = keys[(index + 1) % keys.length];
        this.currentTheme = themes[next];
    }

    list(): string[] { return Object.keys(themes); }
}
