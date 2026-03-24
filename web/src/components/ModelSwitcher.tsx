import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../store.js";
import { sendToSession } from "../ws.js";
import { getModelsForBackend } from "../utils/backends.js";
import type { ModelOption } from "../utils/backends.js";
import { api } from "../api.js";
import { useNavigate } from "react-router";

interface ModelSwitcherProps {
  sessionId: string;
}

export function ModelSwitcher({ sessionId }: ModelSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [pendingModel, setPendingModel] = useState<string | null>(null);
  const [forking, setForking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const sdkSession = useStore((s) =>
    s.sdkSessions.find((sdk) => sdk.sessionId === sessionId) || null,
  );
  // Runtime session state from WebSocket (has model from CLI init message)
  const runtimeSession = useStore((s) => s.sessions.get(sessionId));
  const cliConnected = useStore((s) => s.cliConnected.get(sessionId) ?? false);

  const backendType = sdkSession?.backendType ?? runtimeSession?.backend_type ?? "claude";
  // Prefer runtime model (from CLI init) over sdkSession model (from launch config)
  const currentModel = runtimeSession?.model ?? sdkSession?.model;
  const models = getModelsForBackend(backendType as "claude" | "codex" | "openrouter");

  const currentOption = models.find((m) => m.value === currentModel) ?? null;
  // Fallback: derive label from model string if not in catalog
  const currentLabel = currentOption?.label ?? currentModel ?? "Unknown";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPendingModel(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setPendingModel(null);
    }
  }, []);

  const handleSelect = useCallback(
    (modelValue: string) => {
      if (modelValue === currentModel) {
        setOpen(false);
        setPendingModel(null);
        return;
      }

      // For OpenRouter, we need to fork the session with a new model
      if (backendType === "openrouter") {
        setPendingModel(modelValue);
        setOpen(false);
        return;
      }

      // For Claude/Codex, use set_model command
      if (cliConnected) {
        sendToSession(sessionId, { type: "set_model", model: modelValue });
      }
      setOpen(false);
      setPendingModel(null);
    },
    [currentModel, backendType, cliConnected, sessionId],
  );

  const handleForkWithModel = useCallback(async () => {
    if (!pendingModel) return;
    setForking(true);

    try {
      const result = await api.createSession({
        model: pendingModel,
        backend: backendType as "claude" | "codex" | "openrouter",
        envSlug: sdkSession?.envSlug,
        resumeSessionAt: sessionId,
        forkSession: true,
      });

      if (result.sessionId) {
        navigate(`/session/${result.sessionId}`);
      }
    } catch (error) {
      console.error("Failed to fork session with new model:", error);
    } finally {
      setForking(false);
      setPendingModel(null);
    }
  }, [pendingModel, backendType, sdkSession?.envSlug, sessionId, navigate]);

  // For OpenRouter, show fork confirmation instead of direct switch
  if (backendType === "openrouter" && pendingModel) {
    const pendingOption = models.find((m) => m.value === pendingModel);
    return (
      <div className="relative shrink-0">
        <div className="flex items-center gap-2 h-8 px-2 rounded-md bg-cc-active text-[12px]">
          <span className="text-cc-muted">Switch to:</span>
          <span className="font-medium text-cc-fg">{pendingOption?.label ?? pendingModel}</span>
          <button
            onClick={() => {
              setPendingModel(null);
              setOpen(true);
            }}
            className="text-cc-muted hover:text-cc-fg px-1"
            title="Cancel"
          >
            ✕
          </button>
        </div>
        <button
          onClick={handleForkWithModel}
          disabled={forking}
          className="ml-2 h-8 px-3 rounded-md bg-cc-success text-cc-fg text-[12px] font-medium hover:bg-cc-success/80 transition-colors disabled:opacity-50"
        >
          {forking ? "Forking..." : "Fork Session"}
        </button>
      </div>
    );
  }

  // Hide for Codex (set_model not supported) or when CLI disconnected and not OpenRouter
  if (backendType === "codex" || (!cliConnected && backendType !== "openrouter") || !currentOption) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1 h-8 px-2 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
          open
            ? "text-cc-fg bg-cc-active"
            : "text-cc-muted hover:text-cc-fg hover:bg-cc-hover"
        }`}
        title={`Current model: ${currentLabel}`}
        aria-label="Switch model"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {currentOption.icon && <span className="text-[13px] leading-none">{currentOption.icon}</span>}
        <span>{currentLabel}</span>
        <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5 opacity-50">
          <path d="M6 8L1.5 3.5h9L6 8z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 bottom-full mb-1 z-50 min-w-[160px] rounded-lg border border-cc-separator bg-cc-bg shadow-lg overflow-hidden"
          role="listbox"
          aria-label="Select model"
        >
          {models.map((model) => (
            <button
              key={model.value}
              onClick={() => handleSelect(model.value)}
              className={`w-full flex items-center gap-2 px-3 min-h-[44px] text-[13px] transition-colors cursor-pointer ${
                model.value === currentModel
                  ? "text-cc-primary bg-cc-primary/10"
                  : "text-cc-fg hover:bg-cc-hover"
              }`}
              role="option"
              aria-selected={model.value === currentModel}
            >
              {model.icon && <span className="text-[13px] leading-none">{model.icon}</span>}
              <span className="flex-1 text-left">{model.label}</span>
              {model.value === currentModel && (
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-cc-primary">
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
