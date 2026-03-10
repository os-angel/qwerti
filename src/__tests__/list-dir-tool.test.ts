import { expect, test, describe, beforeAll } from "bun:test";
import { ListDirTool } from "../tools/built-in/list-dir-tool.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

describe("ListDirTool", () => {
    let tool: ListDirTool;
    let tempDir: string;

    beforeAll(async () => {
        tool = new ListDirTool();
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "qwerti-test-"));
        await fs.writeFile(path.join(tempDir, "file1.txt"), "hello");
        await fs.mkdir(path.join(tempDir, "subdir"));
    });

    test("should list directory contents", async () => {
        const result = await tool.execute({ path: tempDir });
        expect(result.isError).toBe(false);
        expect(result.result).toContain("file1.txt");
        expect(result.result).toContain("subdir");
        expect(result.result).toContain("[FILE]");
        expect(result.result).toContain("[DIRECTORY]");
    });

    test("should return error for non-existent directory", async () => {
        const result = await tool.execute({ path: "/non/existent/path/qwerti/test" });
        expect(result.isError).toBe(true);
        expect(result.result).toContain("Error listing directory");
    });
});
