import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { EditFileTool } from "../tools/built-in/edit-file-tool.ts";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

describe("EditFileTool", () => {
    let tool: EditFileTool;
    let tempFile: string;

    beforeAll(async () => {
        tool = new EditFileTool();
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "qwerti-test-edit-"));
        tempFile = path.join(tempDir, "test.txt");
        await fs.writeFile(tempFile, "hello\nunique_string\nworld\nduplicate\nduplicate");
    });

    test("should replace a unique string", async () => {
        const result = await tool.execute({ path: tempFile, old_string: "unique_string", new_string: "replacement" });
        expect(result.isError).toBe(false);
        const content = await fs.readFile(tempFile, "utf-8");
        expect(content).toContain("replacement");
        expect(content).not.toContain("unique_string");
    });

    test("should fail if string is not found", async () => {
        const result = await tool.execute({ path: tempFile, old_string: "not_there", new_string: "replacement" });
        expect(result.isError).toBe(true);
        expect(result.result).toContain("not found");
    });

    test("should fail if string is not unique", async () => {
        const result = await tool.execute({ path: tempFile, old_string: "duplicate", new_string: "replacement" });
        expect(result.isError).toBe(true);
        expect(result.result).toContain("is not unique");
    });
});
