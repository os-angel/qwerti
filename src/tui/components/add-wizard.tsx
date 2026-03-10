import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { SelectList, type SelectItem } from "./select-list.tsx";
import { TextPrompt } from "./text-prompt.tsx";
import { type Theme } from "../theme.ts";
import { type ProviderConfig } from "../../core/types.ts";
import { ProviderFactory } from "../../providers/provider-factory.ts";

export type AddWizardStep =
    | "select-resource"
    | "select-model-type"
    | "select-local-source"
    | "select-cloud-provider"
    | "configure-fields"
    | "configure-mcp"
    | "configure-skill"
    | "configure-plugin"
    | "hf-select-model"
    | "hf-custom-url"
    | "hf-download-path"
    | "hf-downloading"
    | "verifying"
    | "ollama-select-model"
    | "done";

export interface AddWizardResult {
    type: "mcp" | "skill" | "plugin" | "model";
    mcpName?: string;
    mcpCommand?: string;
    mcpArgs?: string[];
    resourcePath?: string;
    providerConfig?: ProviderConfig;
}

interface AddWizardProps {
    onComplete: (result: AddWizardResult) => void;
    onCancel: () => void;
    theme: Theme;
    initialStep?: string;
}

interface FieldDef {
    key: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
}

const RESOURCE_TYPES: SelectItem[] = [
    { label: "Model", value: "model", hint: "Registrar un modelo LLM local o cloud" },
    { label: "MCP Server", value: "mcp", hint: "Conectar servidor de herramientas MCP" },
    { label: "Skill", value: "skill", hint: "Activar un skill instalado" },
    { label: "Plugin", value: "plugin", hint: "Cargar un plugin de extension" },
];

const MODEL_TYPES: SelectItem[] = [
    { label: "Local (GGUF, Ollama, llama-server)", value: "local", hint: "Modelos corriendo en tu maquina" },
    { label: "Cloud Provider", value: "cloud", hint: "Azure AI Foundry, Vertex AI, Bedrock, Databricks" },
];

const LOCAL_SOURCES: SelectItem[] = [
    { label: "Registrar modelo GGUF (llama-server)", value: "gguf", hint: "Modelo .gguf corriendo en llama-server" },
    { label: "Registrar modelo de Ollama", value: "ollama", hint: "Modelo ya instalado en Ollama" },
    { label: "Descargar desde HuggingFace", value: "huggingface", hint: "Descarga GGUF via Ollama pull" },
];

const CLOUD_PROVIDERS: SelectItem[] = [
    { label: "Azure AI Foundry", value: "azure", hint: "Azure OpenAI Service" },
    { label: "Google Vertex AI", value: "vertex", hint: "GCP Vertex AI" },
    { label: "AWS Bedrock", value: "bedrock", hint: "Amazon Bedrock" },
    { label: "Databricks", value: "databricks", hint: "Foundation Model APIs" },
];

const PROVIDER_FIELDS: Record<string, FieldDef[]> = {
    gguf: [
        { key: "baseUrl", label: "Base URL de llama-server", defaultValue: "http://localhost:8080" },
        { key: "model", label: "Nombre del modelo", placeholder: "qwen2.5-coder-7b" },
    ],
    ollama: [
        { key: "baseUrl", label: "Base URL de Ollama", defaultValue: "http://localhost:11434" },
        { key: "model", label: "Nombre del modelo", placeholder: "deepseek-r1:8b" },
    ],
    azure: [
        { key: "endpoint", label: "Endpoint", placeholder: "https://mi-recurso.openai.azure.com" },
        { key: "apiKey", label: "API Key (o env var)", placeholder: "AZURE_OPENAI_API_KEY" },
        { key: "deploymentName", label: "Deployment name", placeholder: "gpt-4o" },
        { key: "model", label: "Modelo", placeholder: "gpt-4o" },
    ],
    vertex: [
        { key: "projectId", label: "Project ID de GCP", placeholder: "my-gcp-project" },
        { key: "region", label: "Region", defaultValue: "us-central1" },
        { key: "model", label: "Modelo", placeholder: "gemini-2.0-flash" },
    ],
    bedrock: [
        { key: "region", label: "Region de AWS", defaultValue: "us-east-1" },
        { key: "apiKey", label: "AWS Access Key ID (o env var)", placeholder: "AWS_ACCESS_KEY_ID" },
        { key: "model", label: "Model ID", placeholder: "anthropic.claude-3-5-sonnet-20241022-v2:0" },
    ],
    databricks: [
        { key: "endpoint", label: "Workspace URL", placeholder: "https://workspace.cloud.databricks.com" },
        { key: "apiKey", label: "Token (o env var)", placeholder: "DATABRICKS_TOKEN" },
        { key: "model", label: "Serving endpoint name", placeholder: "databricks-meta-llama" },
    ],
};

const HF_POPULAR_MODELS: SelectItem[] = [
    { label: "DeepSeek-R1 8B (razonamiento)", value: "bartowski/DeepSeek-R1-Qwen-8B-GGUF", hint: "~5GB" },
    { label: "Qwen2.5 Coder 7B (codigo)", value: "bartowski/Qwen2.5-Coder-7B-Instruct-GGUF", hint: "~5GB" },
    { label: "Llama 3.2 3B (rapido)", value: "bartowski/Llama-3.2-3B-Instruct-GGUF", hint: "~2GB" },
    { label: "[ Repo personalizado ]", value: "__custom__", hint: "Escribir user/repo" },
];

export function AddWizard({ onComplete, onCancel, theme, initialStep }: AddWizardProps) {
    const [step, setStep] = useState<AddWizardStep>((initialStep as AddWizardStep) || "select-resource");
    const [selection, setSelection] = useState<any>({});
    const [configData, setConfigData] = useState<Record<string, string>>({});
    const [currentFieldIdx, setCurrentFieldIdx] = useState(0);
    const [verifyStatus, setVerifyStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
    const [verifyError, setVerifyError] = useState<string | null>(null);

    const handleSelectResource = (value: string) => {
        if (value === "model") setStep("select-model-type");
        else if (value === "mcp") setStep("configure-mcp");
        else if (value === "skill") setStep("configure-skill");
        else if (value === "plugin") setStep("configure-plugin");
        setSelection({ ...selection, resource: value });
    };

    const handleSelectModelType = (value: string) => {
        if (value === "local") setStep("select-local-source");
        else if (value === "cloud") setStep("select-cloud-provider");
        setSelection({ ...selection, modelType: value });
    };
    const handleSelectLocalSource = (value: string) => {
        if (value === "gguf") {
            setStep("configure-fields");
            setSelection({ ...selection, subType: value });
        } else if (value === "huggingface") {
            setStep("hf-select-model");
        } else if (value === "ollama") {
            setStep("verifying");
            detectOllamaModels();
        }
    };

    const detectOllamaModels = async () => {
        setVerifyStatus("verifying");
        try {
            const res = await fetch("http://localhost:11434/api/tags");
            if (!res.ok) throw new Error("Ollama not reachable");
            const data = await res.json() as { models: any[] };
            const items: SelectItem[] = data.models.map(m => ({
                label: m.name,
                value: m.name,
                hint: `${(m.size / 1024 / 1024 / 1024).toFixed(2)} GB`
            }));
            const updatedSelection = { ...selection, subType: "ollama", ollamaModels: items };
            setSelection(updatedSelection);
            setStep("ollama-select-model" as any);
        } catch (err: any) {
            setVerifyStatus("error");
            setVerifyError("Ollama failed: " + err.message + ". Make sure it's running.");
        }
    };

    const handleSelectCloudProvider = (value: string) => {
        setStep("configure-fields");
        setSelection({ ...selection, subType: value });
    };

    const handleFieldSubmit = (value: string) => {
        const fields = PROVIDER_FIELDS[selection.subType] || [];
        const currentField = fields[currentFieldIdx];
        const nextData = { ...configData, [currentField.key]: value };
        setConfigData(nextData);

        if (currentFieldIdx < fields.length - 1) {
            setCurrentFieldIdx(currentFieldIdx + 1);
        } else {
            verifyAndComplete(nextData);
        }
    };

    const verifyAndComplete = async (data: Record<string, string>) => {
        setStep("verifying");
        setVerifyStatus("verifying");

        const config: ProviderConfig = {
            name: `${selection.subType}-${data.model || data.deploymentName || "custom"}`,
            type: selection.subType === "gguf" ? "llama-cpp" : (selection.subType as any),
            model: data.deploymentName || data.model || "unknown",
            ...data
        };

        try {
            const provider = ProviderFactory.create(config);
            const isHealthy = await provider.healthCheck();

            if (isHealthy) {
                setVerifyStatus("success");
                setTimeout(() => {
                    onComplete({ type: "model", providerConfig: config });
                }, 1000);
            } else {
                setVerifyStatus("error");
                setVerifyError("Server reachable but healthcheck failed. Check your configuration.");
            }
        } catch (err: any) {
            setVerifyStatus("error");
            setVerifyError(err.message);
        }
    };

    const renderStep = () => {
        switch (step) {
            case "select-resource":
                return <SelectList title="Que quieres agregar?" items={RESOURCE_TYPES} onSelect={handleSelectResource} onCancel={onCancel} />;
            case "select-model-type":
                return <SelectList title="Tipo de modelo?" items={MODEL_TYPES} onSelect={handleSelectModelType} onCancel={onCancel} />;
            case "select-local-source":
                return <SelectList title="Fuente del modelo local?" items={LOCAL_SOURCES} onSelect={handleSelectLocalSource} onCancel={onCancel} />;
            case "select-cloud-provider":
                return <SelectList title="Selecciona provider:" items={CLOUD_PROVIDERS} onSelect={handleSelectCloudProvider} onCancel={onCancel} />;
            case "configure-fields":
                const fields = PROVIDER_FIELDS[selection.subType] || [];
                if (fields.length === 0) return null;
                const field = fields[currentFieldIdx];
                return <TextPrompt label={field.label} defaultValue={field.defaultValue} placeholder={field.placeholder} onSubmit={handleFieldSubmit} onCancel={onCancel} />;
            case "verifying":
                return (
                    <Box flexDirection="column">
                        <Text>Verificando conexion con {selection.subType}...</Text>
                        {verifyStatus === "verifying" && <Text color="yellow">Consultando endpoint...</Text>}
                        {verifyStatus === "success" && <Text color="green">OK! Registrando modelo...</Text>}
                        {verifyStatus === "error" && (
                            <Box flexDirection="column">
                                <Text color="red">FAILED: {verifyError}</Text>
                                <Text dimColor>Presiona Esc para volver e intentar de nuevo.</Text>
                            </Box>
                        )}
                    </Box>
                );
            case "ollama-select-model":
                return (
                    <SelectList
                        title="Selecciona modelo de Ollama decubierto:"
                        items={selection.ollamaModels || []}
                        onSelect={(v: string) => {
                            verifyAndComplete({ model: v, baseUrl: "http://localhost:11434" });
                        }}
                        onCancel={() => setStep("select-local-source")}
                    />
                );
            case "hf-select-model":
                return <SelectList title="Selecciona modelo de HuggingFace:" items={HF_POPULAR_MODELS} onSelect={(v) => {
                    if (v === "__custom__") {
                        setStep("hf-custom-url");
                    } else {
                        setSelection({ ...selection, hfModel: v });
                        setStep("hf-download-path");
                    }
                }} onCancel={onCancel} />;
            case "hf-custom-url":
                return <TextPrompt label="HuggingFace Repo" placeholder="usuario/modelo-gguf" onSubmit={(v) => {
                    setSelection({ ...selection, hfModel: v });
                    setStep("hf-download-path");
                }} onCancel={onCancel} />;
            case "hf-download-path":
                return <TextPrompt
                    label="Carpeta de descarga"
                    placeholder="~/models"
                    defaultValue="~/models"
                    onSubmit={(path) => {
                        setSelection({ ...selection, downloadPath: path });
                        setStep("hf-downloading");
                    }}
                    onCancel={onCancel}
                />;
            case "hf-downloading":
                return <HFDownloadProgress
                    modelRef={selection.hfModel}
                    downloadPath={selection.downloadPath}
                    onDone={(localPath) => {
                        const modelName = selection.hfModel.split("/").pop()?.toLowerCase() || "hf-model";
                        onComplete({
                            type: "model",
                            providerConfig: {
                                name: `hf-${modelName}`,
                                type: "llama-cpp",
                                model: modelName,
                                baseUrl: "http://localhost:8080",
                                downloadPath: localPath,
                            } as any, // bypassing strict types for dynamically stored path
                        });
                    }}
                    onError={(err) => {
                        setVerifyStatus("error");
                        setVerifyError(err);
                        setStep("verifying");
                    }}
                />;
            default:
                return <Text>Not implemented yet</Text>;
        }
    };

    return (
        <Box flexDirection="column" padding={1} borderStyle="single" borderColor={theme.primary}>
            {renderStep()}
        </Box>
    );
}

function HFDownloadProgress({ modelRef, downloadPath, onDone, onError }: {
    modelRef: string;
    downloadPath: string;
    onDone: (localPath: string) => void;
    onError: (err: string) => void;
}) {
    const [lines, setLines] = useState<string[]>(["Iniciando descarga con 'hf download'..."]);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        const expandedPath = downloadPath.replace(/^~/, process.env.HOME || "~");

        const proc = Bun.spawn(["hf", "download", modelRef, "--local-dir", expandedPath], {
            stdout: "pipe",
            stderr: "pipe",
        });

        const readStream = async (stream: ReadableStream<Uint8Array>) => {
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = decoder.decode(value).trim();
                if (text) {
                    const newLines = text.split("\n").filter(l => l.trim());
                    setLines(prev => [...prev.slice(-8), ...newLines]);
                }
            }
        };

        readStream(proc.stdout);
        readStream(proc.stderr);

        proc.exited.then(code => {
            setFinished(true);
            if (code === 0) {
                setLines(prev => [...prev, "Descarga completada."]);
                onDone(expandedPath);
            } else {
                const errMsg = `hf download falló (exit code ${code}). Verifica que tengas 'huggingface-hub' instalado: pip install huggingface-hub`;
                setLines(prev => [...prev, errMsg]);
                onError(errMsg);
            }
        });

        return () => {
            try { proc.kill(); } catch { }
        };
    }, []);

    return (
        <Box flexDirection="column">
            <Text bold color="yellow">Descargando: {modelRef}</Text>
            <Text color="gray">Destino: {downloadPath}</Text>
            <Box flexDirection="column" marginTop={1}>
                {lines.map((l, i) => <Text key={i} color="gray">{l}</Text>)}
            </Box>
            {!finished && <Text color="yellow">Descargando... (puede tomar varios minutos)</Text>}
        </Box>
    );
}
