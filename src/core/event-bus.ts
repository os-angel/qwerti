type EventMap = {
    "message:user": { content: string };
    "message:assistant": { content: string; done: boolean };
    "model:changed": { provider: string; model: string };
    "tool:start": { name: string; args: Record<string, unknown> };
    "tool:result": { name: string; result: string; isError: boolean; duration?: number };
    "session:created": { id: string };
    "session:loaded": { id: string };
    "error": { message: string; stack?: string };
};

type Handler<T> = (data: T) => void;

export class EventBus {
    private handlers: { [K in keyof EventMap]?: Handler<EventMap[K]>[] } = {};

    on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event]!.push(handler);
    }

    off<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
        if (!this.handlers[event]) return;
        this.handlers[event] = (this.handlers[event] as any)!.filter((h: any) => h !== handler);
    }

    emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
        if (!this.handlers[event]) return;
        this.handlers[event]!.forEach((handler) => handler(data));
    }

    once<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
        const onceHandler = (data: EventMap[K]) => {
            handler(data);
            this.off(event, onceHandler);
        };
        this.on(event, onceHandler);
    }
}

export const bus = new EventBus();
