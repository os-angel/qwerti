import { useState, useCallback } from "react";
import { type Message, type AgentMode } from "../../core/types.ts";

export interface AppState {
    messages: Message[];
    isProcessing: boolean;
    currentModel: string | null;
    mode: AgentMode;
    error: string | null;
    sessionId: string | null;
    sessionName: string | null;
    checkpoints: string[];
}

export function useAppState() {
    const [state, setState] = useState<AppState>({
        messages: [],
        isProcessing: false,
        currentModel: null,
        mode: "build",
        error: null,
        sessionId: null,
        sessionName: null,
        checkpoints: [],
    });

    const addMessage = useCallback((message: Message) => {
        setState((prev: AppState) => ({
            ...prev,
            messages: [...prev.messages, message],
        }));
    }, []);

    const updateMessage = useCallback((id: string, content: string) => {
        setState((prev: AppState) => ({
            ...prev,
            messages: prev.messages.map((m: Message) => m.id === id ? { ...m, content } : m),
        }));
    }, []);

    const setProcessing = (isProcessing: boolean) =>
        setState((prev: AppState) => ({ ...prev, isProcessing }));

    const setError = (error: string | null) =>
        setState((prev: AppState) => ({ ...prev, error }));

    const setModel = (currentModel: string | null) =>
        setState((prev: AppState) => ({ ...prev, currentModel }));

    const setMode = (mode: AgentMode) =>
        setState((prev: AppState) => ({ ...prev, mode }));

    const setSessionId = (sessionId: string | null) =>
        setState((prev: AppState) => ({ ...prev, sessionId }));

    const setSessionName = (sessionName: string | null) =>
        setState((prev: AppState) => ({ ...prev, sessionName }));

    const setCheckpoints = (checkpoints: string[]) =>
        setState((prev: AppState) => ({ ...prev, checkpoints }));

    return {
        state,
        addMessage,
        updateMessage,
        setProcessing,
        setError,
        setModel,
        setMode,
        setSessionId,
        setSessionName,
        setCheckpoints
    };
}
