import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { GlobTool } from "../tools/built-in/glob-tool.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

describe("GlobTool", () => {
    let tool: GlobTool;
    let tempDir: string;

    beforeAll(async () => {
        tool = new GlobTool();
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "qwerti-test-glob-"));
        await fs.writeFile(path.join(tempDir, "file.ts"), "");
        await fs.writeFile(path.join(tempDir, "file.js"), "");
        await fs.mkdir(path.join(tempDir, "subdir"));
        await fs.writeFile(path.join(tempDir, "subdir", "sub.ts"), "");
    });

    test("should find files matching pattern", async () => {
        const result = await tool.execute({ pattern: "**/*.ts", cwd: tempDir });
        expect(result.isError).toBe(false);
        expect(result.result).toContain("file.ts");
        expect(result.result).toContain("subdir/sub.ts");
        expect(result.result).not.toContain("file.js");
    });

    test("should handle no matches", async () => {
        const result = await tool.execute({ pattern: "*.css", cwd: tempDir });
        expect(result.isError).toBe(false);
        expect(result.result).toContain("No files found");
    });
});
