import { z } from "zod";
import { BaseTool, type ToolResult } from "../base-tool.ts";
import { logger } from "../../core/logger.ts";

export class BashTool extends BaseTool {
    name = "bash";
    description = "Execute a shell command in the user's terminal. Use this for file operations, running code, and system interaction.";

    parameters = z.object({
        command: z.string().describe("The shell command to execute"),
        timeout: z.number().optional().describe("Timeout in milliseconds (default: 120000)"),
        cwd: z.string().optional().describe("Working directory for the command"),
    });

    permissionLevel: "execute" = "execute";

    async execute(args: { command: string; timeout?: number; cwd?: string }): Promise<ToolResult> {
        const timeout = args.timeout ?? 120_000;
        const cwd = args.cwd ?? process.cwd();

        logger.debug({ command: args.command, cwd }, "Executing bash command");

        try {
            // Cross-platform handling
            const shell = process.platform === "win32" ? "powershell.exe" : (process.env.SHELL ?? "/bin/bash");
            const spawnArgs = process.platform === "win32"
                ? ["-NoProfile", "-NonInteractive", "-Command", args.command]
                : ["-c", args.command];

            const proc = Bun.spawn([shell, ...spawnArgs], {
                cwd,
                stdout: "pipe",
                stderr: "pipe",
                env: { ...process.env },
            });

            // Set timeout manually since Bun.spawn doesn't have a direct timeout option that kills the process easily in all versions
            const timer = setTimeout(() => {
                proc.kill();
            }, timeout);

            const [stdout, stderr] = await Promise.all([
                new Response(proc.stdout).text(),
                new Response(proc.stderr).text(),
            ]);

            clearTimeout(timer);
            const exitCode = await proc.exited;

            if (exitCode !== 0) {
                return {
                    result: `Command failed (exit code ${exitCode}):\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`,
                    isError: true,
                };
            }

            return {
                result: stdout || stderr || "(command completed with no output)",
                isError: false,
            };
        } catch (error: any) {
            return {
                result: `Failed to execute command: ${error.message}`,
                isError: true,
            };
        }
    }
}
