"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";

export type ViewMode = "cards" | "list";

export function useViewMode(storageKey: string, defaultMode: ViewMode = "cards") {
  const [mode, setModeState] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === "cards" || saved === "list") setModeState(saved);
  }, [storageKey]);

  const setMode = useCallback(
    (next: ViewMode) => {
      setModeState(next);
      localStorage.setItem(storageKey, next);
    },
    [storageKey],
  );

  return { mode, setMode };
}

/** Mac-style segmented toggle: grid (4 squares) ↔ list */
export function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="view-mode-toggle" role="group" aria-label="View mode">
      <button
        type="button"
        className={`view-mode-toggle-btn${mode === "cards" ? " is-active" : ""}`}
        onClick={() => onChange("cards")}
        aria-pressed={mode === "cards"}
        title="Grid view"
      >
        <Icon name="dashboard" size={15} />
      </button>
      <button
        type="button"
        className={`view-mode-toggle-btn${mode === "list" ? " is-active" : ""}`}
        onClick={() => onChange("list")}
        aria-pressed={mode === "list"}
        title="List view"
      >
        <Icon name="list" size={15} />
      </button>
    </div>
  );
}

export function AnimatedViewMode({
  mode,
  cards,
  list,
}: {
  mode: ViewMode;
  cards: ReactNode;
  list: ReactNode;
}) {
  return (
    <div className="view-mode-stage" key={mode}>
      <div className={`t-view-panel view-mode-${mode}`}>
        {mode === "cards" ? cards : list}
      </div>
    </div>
  );
}

export function StaggerItem({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <div className="t-view-item" style={{ ["--i" as string]: index }}>
      {children}
    </div>
  );
}
