import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { type Message, type SessionMeta } from "../core/types.ts";

export interface SessionData {
    meta: SessionMeta;
    messages: Message[];
}

export class SessionStore {
    private baseDir: string;

    constructor() {
        this.baseDir = path.join(os.homedir(), ".qwerti", "sessions");
    }

    async init(): Promise<void> {
        await fs.mkdir(this.baseDir, { recursive: true });
    }

    async save(session: SessionData): Promise<void> {
        const filePath = path.join(this.baseDir, `${session.meta.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(session, null, 2), "utf-8");
    }

    async load(id: string): Promise<SessionData | null> {
        const filePath = path.join(this.baseDir, `${id}.json`);
        try {
            const content = await fs.readFile(filePath, "utf-8");
            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    async list(): Promise<SessionMeta[]> {
        try {
            const files = await fs.readdir(this.baseDir);
            const sessions: SessionMeta[] = [];

            for (const file of files) {
                if (file.endsWith(".json")) {
                    const content = await fs.readFile(path.join(this.baseDir, file), "utf-8");
                    const data: SessionData = JSON.parse(content);
                    sessions.push(data.meta);
                }
            }

            return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
        } catch {
            return [];
        }
    }

    async delete(id: string): Promise<void> {
        const filePath = path.join(this.baseDir, `${id}.json`);
        try {
            await fs.unlink(filePath);
        } catch { /* ignore */ }
    }
}
