"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/icons/Icon";
import { latClass } from "@/lib/format";

const BADGE_MAP: Record<string, [string, string]> = {
  executed: ["badge-ok", "Executed"],
  pending: ["badge-warn", "Pending"],
  skipped: ["badge-muted", "Skipped"],
  failed: ["badge-err", "Failed"],
  Connected: ["badge-ok", "Connected"],
  Disconnected: ["badge-muted", "Disconnected"],
  "Auth Failed": ["badge-err", "Auth Failed"],
  "Terminal Unavailable": ["badge-warn", "Terminal Unavailable"],
  "Broker Unavailable": ["badge-warn", "Broker Unavailable"],
  Locked: ["badge-err", "Locked"],
  active: ["badge-ok", "Active"],
  paused: ["badge-muted", "Paused"],
  Active: ["badge-accent", "Active Guard"],
};

export function StatusBadge({
  status,
  dot = true,
  label,
}: {
  status: string;
  dot?: boolean;
  label?: string;
}) {
  const [cls, txt] = BADGE_MAP[status] ?? ["badge-muted", status];
  return (
    <span className={`badge ${cls}`}>
      {dot && <span className="bdot" />}
      {label ?? txt}
    </span>
  );
}

export function LatencyCell({ ms, bar = false }: { ms: number; bar?: boolean }) {
  const c = latClass(ms);
  const color =
    c === "g" ? "var(--success)" : c === "a" ? "var(--warning)" : "var(--error)";
  const pct = Math.min(100, (ms / 3000) * 100);
  return (
    <span className={`lat ${c}`}>
      <span className="ld" />
      {ms.toFixed(0)} ms
      {bar && (
        <span className="lat-bar">
          <i style={{ width: `${pct}%`, background: color }} />
        </span>
      )}
    </span>
  );
}

export function TimingCell({
  e2eMs,
  orderMs,
  switchMs,
  compact = false,
}: {
  e2eMs?: number | null;
  orderMs?: number | null;
  switchMs?: number | null;
  compact?: boolean;
}) {
  const total = e2eMs ?? orderMs ?? switchMs;
  if (total == null || total <= 0) return <span className="faint">—</span>;

  const tip =
    orderMs != null || switchMs != null
      ? `Total ${e2eMs ?? total} ms · Broker ${orderMs ?? "—"} ms · Switch ${switchMs ?? "—"} ms`
      : undefined;

  return (
    <span className="timing-cell" title={tip}>
      <LatencyCell ms={total} bar={!compact} />
      {compact && (orderMs != null || switchMs != null) && (
        <span className="timing-sub mono faint">
          {orderMs != null ? `brk ${orderMs}` : ""}
          {switchMs != null ? `${orderMs != null ? " · " : ""}sw ${switchMs}` : ""}
        </span>
      )}
    </span>
  );
}

export function Toggle({
  on,
  onChange,
  lime = false,
  disabled = false,
}: {
  on: boolean;
  onChange?: (v: boolean) => void;
  lime?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`tog${on ? " on" : ""}${lime ? " lime" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange?.(!on);
      }}
      disabled={disabled}
      aria-pressed={on}
    />
  );
}

export function Seg({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          className={`tab${value === t.value ? " active" : ""}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export type CtxItem =
  | { sep: true; label?: never; icon?: never; danger?: never; onClick?: never }
  | { sep?: false; label: string; icon?: IconName; danger?: boolean; onClick?: () => void };

function ContextMenu({
  items,
  onClose,
  anchorStyle,
  closing = false,
}: {
  items: CtxItem[];
  onClose: () => void;
  anchorStyle?: CSSProperties;
  closing?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", h), 0);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [onClose]);

  return (
    <div
      className={`ctx${entered && !closing ? " is-open" : ""}${closing ? " is-closing" : ""}`}
      ref={ref}
      style={anchorStyle}
      role="menu"
    >
      {items.map((it, i) =>
        it.sep ? (
          <div key={i} className="ctx-sep" />
        ) : (
          <button
            key={i}
            type="button"
            className={it.danger ? "danger" : ""}
            onClick={() => {
              onClose();
              it.onClick?.();
            }}
          >
            {it.icon && <Icon name={it.icon} size={15} />}
            {it.label}
          </button>
        ),
      )}
    </div>
  );
}

export function Kebab({ items }: { items: CtxItem[] }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePos = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estimatedHeight = Math.min(320, items.length * 36 + 16);
    const below = r.bottom + 6;
    const fitsBelow = below + estimatedHeight <= window.innerHeight - 8;
    const top = fitsBelow ? below : Math.max(8, r.top - estimatedHeight - 6);
    setMenuPos({ top, left: r.right });
  }, [items.length]);

  const closeMenu = useCallback(() => {
    if (!open || closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
      setMenuPos(null);
    }, 150);
  }, [open, closing]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onLayout = () => updatePos();
    window.addEventListener("scroll", onLayout, true);
    window.addEventListener("resize", onLayout);
    return () => {
      window.removeEventListener("scroll", onLayout, true);
      window.removeEventListener("resize", onLayout);
    };
  }, [open, updatePos]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="icon-btn"
        style={{ width: 30, height: 30, position: "relative", zIndex: open ? 2 : undefined }}
        onClick={(e) => {
          e.stopPropagation();
          if (open) {
            closeMenu();
            return;
          }
          if (closeTimer.current) clearTimeout(closeTimer.current);
          setClosing(false);
          updatePos();
          setOpen(true);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon name="dots" size={16} />
      </button>
      {open && menuPos && typeof document !== "undefined"
        ? createPortal(
            <ContextMenu
              items={items}
              onClose={closeMenu}
              closing={closing}
              anchorStyle={{
                position: "fixed",
                top: menuPos.top,
                right: window.innerWidth - menuPos.left,
                zIndex: 10000,
              }}
            />,
            document.body,
          )
        : null}
    </>
  );
}

export function Tip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="tip">
      {children}
      <span className="tip-body">{text}</span>
    </span>
  );
}

export function Modal({
  children,
  onClose,
  width,
}: {
  children: ReactNode;
  onClose?: () => void;
  width?: number | string;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <div className="modal-wrap">
      <div className="scrim" onClick={onClose} />
      <div className="modal" style={width ? { width } : undefined}>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  title,
  body,
  confirmWord,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmWord: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = val.trim() === confirmWord;

  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={busy ? () => {} : onCancel}>
      <div className="modal-pad">
        <div className="row gap10" style={{ marginBottom: 4 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 3,
              background: "var(--error-tint)",
              color: "var(--error)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <Icon name="alert" size={18} />
          </div>
          <h3 style={{ margin: 0 }}>{title}</h3>
        </div>
        <p style={{ marginTop: 10 }}>{body}</p>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>
            Type{" "}
            <span className="mono" style={{ color: "var(--error)", fontWeight: 700 }}>
              {confirmWord}
            </span>{" "}
            to confirm
          </label>
          <input
            className="inp mono"
            value={val}
            autoFocus
            disabled={busy}
            onChange={(e) => setVal(e.target.value)}
            placeholder={confirmWord}
            onKeyDown={(e) => {
              if (e.key === "Enter" && ok) void submit();
            }}
          />
        </div>
      </div>
      <div className="modal-foot">
        <button
          type="button"
          className="link-action"
          style={{ color: "var(--text-secondary)" }}
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`btn ${danger ? "btn-danger" : "btn-dark"}`}
          disabled={!ok || busy}
          onClick={() => void submit()}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function KpiCard({
  icon,
  label,
  value,
  unit,
  sub,
  subIcon,
  edge,
  flash,
}: {
  icon?: IconName;
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: string;
  subIcon?: IconName;
  edge?: "accent" | "pulse";
  flash?: boolean;
}) {
  return (
    <div className={`kpi${edge ? ` ${edge}-edge` : ""}`}>
      <div className="k-top">
        {icon && (
          <div className="k-ico">
            <Icon name={icon} size={16} />
          </div>
        )}
        <div className="k-label">{label}</div>
      </div>
      <div className={`k-val${flash ? " flash" : ""}`}>
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {sub && (
        <div className="k-sub">
          {subIcon && <Icon name={subIcon} size={13} />}
          {sub}
        </div>
      )}
    </div>
  );
}

export function EmptyHint({
  icon,
  title,
  children,
}: {
  icon?: IconName;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-secondary)" }}>
      {icon && (
        <div className="empty-ico" style={{ display: "inline-flex", marginBottom: 12 }}>
          <Icon name={icon} size={34} stroke={1.5} />
        </div>
      )}
      <div style={{ fontWeight: 600, color: "var(--dark)", fontSize: 14, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 12.5 }}>{children}</div>
    </div>
  );
}

export function Meter({ pct, color }: { pct: number; color?: string }) {
  const c =
    color ??
    (pct > 80 ? "var(--error)" : pct > 55 ? "var(--warning)" : "var(--success)");
  return (
    <div className="meter">
      <i style={{ width: `${Math.min(100, pct)}%`, background: c }} />
    </div>
  );
}

export {
  AnimatedViewMode,
  StaggerItem,
  useViewMode,
  ViewModeToggle,
  type ViewMode,
} from "./ViewModeSwitch";
