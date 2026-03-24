import type { BackendType } from "../types.js";
import type { BackendModelInfo } from "../api.js";

export interface ModelOption {
  value: string;
  label: string;
  icon: string;
}

export interface ModeOption {
  value: string;
  label: string;
}

// ─── Icon assignment for dynamically fetched models ──────────────────────────

const MODEL_ICONS: Record<string, string> = {
  "codex": "\u2733",    // ✳ for codex-optimized models
  "max": "\u25A0",      // ■ for max/flagship
  "mini": "\u26A1",     // ⚡ for mini/fast
};

function pickIcon(slug: string, index: number): string {
  for (const [key, icon] of Object.entries(MODEL_ICONS)) {
    if (slug.includes(key)) return icon;
  }
  const fallback = ["\u25C6", "\u25CF", "\u25D5", "\u2726"]; // ◆ ● ◕ ✦
  return fallback[index % fallback.length];
}

/** Convert server model info to frontend ModelOption with icons. */
export function toModelOptions(models: BackendModelInfo[]): ModelOption[] {
  return models.map((m, i) => ({
    value: m.value,
    label: m.label || m.value,
    icon: pickIcon(m.value, i),
  }));
}

// ─── Static fallbacks ────────────────────────────────────────────────────────

export const CLAUDE_MODELS: ModelOption[] = [
  { value: "claude-opus-4-6", label: "Opus 4.6", icon: "" },
  { value: "claude-sonnet-4-6", label: "Sonnet 4.6", icon: "" },
  { value: "claude-haiku-4-5-20251001", label: "Haiku 4.5", icon: "" },
];

export const CODEX_MODELS: ModelOption[] = [
  { value: "gpt-5.3-codex", label: "GPT-5.3 Codex", icon: "\u2733" },
  { value: "gpt-5.2-codex", label: "GPT-5.2 Codex", icon: "\u25C6" },
  { value: "gpt-5.1-codex-max", label: "GPT-5.1 Max", icon: "\u25A0" },
  { value: "gpt-5.2", label: "GPT-5.2", icon: "\u25CF" },
  { value: "gpt-5.1-codex-mini", label: "GPT-5.1 Mini", icon: "\u26A1" },
];

export const OPENROUTER_MODELS: ModelOption[] = [
  // Claude via OpenRouter
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet (OpenRouter)", icon: "\u25CB" },
  { value: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku (OpenRouter)", icon: "\u25CB" },
  // Google Gemini
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (OpenRouter)", icon: "\u25CB" },
  { value: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash (OpenRouter)", icon: "\u25CB" },
  { value: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (OpenRouter)", icon: "\u25CB" },
  // DeepSeek
  { value: "deepseek/deepseek-chat-v3", label: "DeepSeek V3 (OpenRouter)", icon: "\u25CB" },
  { value: "deepseek/deepseek-r1", label: "DeepSeek R1 (OpenRouter)", icon: "\u25CB" },
  // Meta Llama
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B (OpenRouter)", icon: "\u25CB" },
  // Mistral
  { value: "mistralai/mistral-large", label: "Mistral Large (OpenRouter)", icon: "\u25CB" },
  // xAI Grok
  { value: "x-ai/grok-2", label: "Grok 2 (OpenRouter)", icon: "\u25CB" },
  // MiniMax
  { value: "minimax/minimax-m2.7", label: "MiniMax M2.7 (OpenRouter)", icon: "\u25CB" },
  { value: "minimax/minimax-m2.5", label: "MiniMax M2.5 (OpenRouter)", icon: "\u25CB" },
  { value: "minimax/minimax-m2.5:free", label: "MiniMax M2.5 Free (OpenRouter)", icon: "\u2600" },
  // NVIDIA Nemotron
  { value: "nvidia/nemotron-3-super-120b-a12b", label: "Nemotron 3 Super 120B (OpenRouter)", icon: "\u25CB" },
  { value: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron 3 Super 120B Free (OpenRouter)", icon: "\u2600" },
  { value: "nvidia/nemotron-3-nano-30b-a3b", label: "Nemotron 3 Nano 30B (OpenRouter)", icon: "\u25CB" },
  { value: "nvidia/nemotron-3-nano-30b-a3b:free", label: "Nemotron 3 Nano 30B Free (OpenRouter)", icon: "\u2600" },
];

export const CLAUDE_MODES: ModeOption[] = [
  { value: "bypassPermissions", label: "Agent" },
  { value: "plan", label: "Plan" },
];

export const CODEX_MODES: ModeOption[] = [
  { value: "bypassPermissions", label: "Auto" },
  { value: "plan", label: "Plan" },
];

// Agent-specific modes: "plan" is excluded because agents are autonomous
// and cannot wait for human plan approval.
export const CLAUDE_AGENT_MODES: ModeOption[] = [
  { value: "bypassPermissions", label: "Full Auto" },
  { value: "acceptEdits", label: "Auto-Edit" },
  { value: "default", label: "Supervised" },
];

export const CODEX_AGENT_MODES: ModeOption[] = [
  { value: "bypassPermissions", label: "Full Auto" },
  { value: "default", label: "Supervised" },
];

// ─── Getters ─────────────────────────────────────────────────────────────────

export function getModelsForBackend(backend: BackendType): ModelOption[] {
  if (backend === "codex") return CODEX_MODELS;
  if (backend === "openrouter") return OPENROUTER_MODELS;
  return CLAUDE_MODELS;
}

export function getModesForBackend(backend: BackendType): ModeOption[] {
  return backend === "codex" ? CODEX_MODES : CLAUDE_MODES;
}

export function getAgentModesForBackend(backend: BackendType): ModeOption[] {
  if (backend === "codex") return CODEX_AGENT_MODES;
  return CLAUDE_AGENT_MODES;
}

export function getDefaultModel(backend: BackendType): string {
  return backend === "codex" ? CODEX_MODELS[0].value : CLAUDE_MODELS[0].value;
}

export function getDefaultMode(backend: BackendType): string {
  return backend === "codex" ? CODEX_MODES[0].value : CLAUDE_MODES[0].value;
}

export function getDefaultAgentMode(backend: BackendType): string {
  return backend === "codex" ? CODEX_AGENT_MODES[0].value : CLAUDE_AGENT_MODES[0].value;
}
