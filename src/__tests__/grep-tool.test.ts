import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { GrepTool } from "../tools/built-in/grep-tool.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

describe("GrepTool", () => {
    let tool: GrepTool;
    let tempDir: string;

    beforeAll(async () => {
        tool = new GrepTool();
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "qwerti-test-grep-"));
        await fs.writeFile(path.join(tempDir, "file1.txt"), "hello world\ntarget content\nfoo bar");
        await fs.writeFile(path.join(tempDir, "file2.txt"), "another match\nno target\nworld world");
    });

    test("should find content in files", async () => {
        const result = await tool.execute({ pattern: "world", cwd: tempDir });
        expect(result.isError).toBe(false);
        expect(result.result).toContain("file1.txt:1: hello world");
        expect(result.result).toContain("file2.txt:3: world world");
    });

    test("should filter by include pattern", async () => {
        const result = await tool.execute({ pattern: "world", includes: "file1.txt", cwd: tempDir });
        expect(result.isError).toBe(false);
        expect(result.result).toContain("file1.txt:1: hello world");
        expect(result.result).not.toContain("file2.txt:3: world world");
    });

    test("should handle no matches", async () => {
        const result = await tool.execute({ pattern: "missing", cwd: tempDir });
        expect(result.isError).toBe(false);
        expect(result.result).toContain("No matches found.");
    });
});
