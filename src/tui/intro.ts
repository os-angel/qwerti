import chalk from "chalk";

const ESC = "\x1b";
const clear = () => process.stdout.write(`${ESC}[2J${ESC}[H`);
const moveTo = (r: number, c: number) => process.stdout.write(`${ESC}[${r};${c}H`);
const hide = () => process.stdout.write(`${ESC}[?25l`);
const show = () => process.stdout.write(`${ESC}[?25h`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ACCENT = "#00FF00"; // Qwerti Green
const DIM = "#333333";
const MUTED = "#666666";

const L_Q = [
    " ████████ ",
    "██      ██",
    "██      ██",
    "██      ██",
    "██  ██  ██",
    " ████████ ",
    "       ██ ",
];

const L_W = [
    "██      ██",
    "██      ██",
    "██  ██  ██",
    "██  ██  ██",
    "██ ████ ██",
    " ████████ ",
    "  ██  ██  ",
];

const L_E = [
    "████████",
    "██      ",
    "██      ",
    "██████  ",
    "██      ",
    "██      ",
    "████████",
];

const L_R = [
    "███████ ",
    "██    ██",
    "██    ██",
    "███████ ",
    "██  ██  ",
    "██   ██ ",
    "██    ██",
];

const L_T = [
    "██████",
    "  ██  ",
    "  ██  ",
    "  ██  ",
    "  ██  ",
    "  ██  ",
    "  ██  ",
];

const L_I = [
    "████",
    " ██ ",
    " ██ ",
    " ██ ",
    " ██ ",
    " ██ ",
    "████",
];

const GAP = "  ";
const LETTERS = [L_Q, L_W, L_E, L_R, L_T, L_I];
const LOGO = Array.from({ length: 7 }, (_, r) =>
    LETTERS.map((l) => l[r]).join(GAP)
);

const I_COL = LOGO[0].length - L_I[0].length;
const ROWS = LOGO.length;

export interface IntroOptions {
    provider?: string;
    model?: string;
}

export const runIntro = async (opts?: IntroOptions): Promise<void> => {
    const cols = process.stdout.columns || 80;
    const termRows = process.stdout.rows || 24;
    const logoW = LOGO[0].length;
    const cx = Math.max(1, Math.floor((cols - logoW) / 2));
    const cy = Math.max(2, Math.floor((termRows - 11) / 2));

    hide();
    clear();

    // Phase 1: Column sweep
    const step = 2;
    for (let col = 0; col < logoW; col += step) {
        const end = Math.min(col + step, logoW);
        for (let r = 0; r < ROWS; r++) {
            moveTo(cy + r, cx + col);
            process.stdout.write(chalk.hex(ACCENT)(LOGO[r].substring(col, end)));
        }
        await sleep(8);
    }

    await sleep(80);

    // Settle
    for (let r = 0; r < ROWS; r++) {
        moveTo(cy + r, cx);
        process.stdout.write(
            chalk.white.bold(LOGO[r].substring(0, I_COL)) +
            chalk.hex(ACCENT).bold(LOGO[r].substring(I_COL))
        );
    }

    await sleep(60);

    // Frame + version
    const ver = "v0.1.0";
    const pad = logoW - ver.length - 1;

    moveTo(cy - 1, cx);
    process.stdout.write(
        chalk.hex(DIM)("─".repeat(pad) + " ") + chalk.hex(MUTED)(ver)
    );

    moveTo(cy + ROWS, cx);
    process.stdout.write(chalk.hex(DIM)("─".repeat(logoW)));

    // Subtitle
    const subtitle = "open-source ai dev agent";
    const subCx = Math.max(1, Math.floor((cols - subtitle.length) / 2));
    moveTo(cy + ROWS + 2, subCx);
    process.stdout.write(chalk.hex(MUTED)(subtitle));

    await sleep(120);

    // Status line
    const provider = opts?.provider ?? "ollama";
    const model = opts?.model ?? "";
    const dot = chalk.hex(DIM)(" · ");
    const parts = [
        chalk.hex(MUTED)(provider),
        ...(model ? [chalk.hex(MUTED)(model)] : []),
        chalk.hex(ACCENT).bold("ready"),
    ];
    const status = parts.join(dot);
    const plain = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
    const sCx = Math.max(1, Math.floor((cols - plain(status).length) / 2));

    moveTo(cy + ROWS + 4, sCx);
    process.stdout.write(status);

    await sleep(1500);
    show();
    clear();
};
