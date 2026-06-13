import { type ReactNode } from "react";
import { useKpk, fmtClock } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";
import type { Screen } from "@/lib/kpkData";

export function HudHeader({
  title,
  backTo = "main",
  showTimer = true,
}: { title: string; backTo?: Screen; showTimer?: boolean }) {
  const { go, turnSeconds } = useKpk();
  return (
    <header className="flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)]/80 px-3 py-2 sm:px-5 sm:py-3 backdrop-blur-sm">
      <button
        onClick={() => { sfx.back(); go(backTo); }}
        className="hud-btn hud-btn-ghost !py-1.5 !px-3 text-[0.7rem]"
      >
        ◂ {backTo === "main" ? "Головна" : "Назад"}
      </button>
      <div className="hud-title text-[color:var(--hud-amber)] text-xs sm:text-sm tracking-[0.3em] truncate">
        {title}
      </div>
      {showTimer ? (
        <button onClick={() => { sfx.click(); go("timer"); }} className="hud-mono text-base sm:text-xl tabular-nums text-[color:var(--hud-amber-glow)] hud-flicker">
          {fmtClock(turnSeconds)}
        </button>
      ) : <span className="w-16" />}
    </header>
  );
}

export function ScreenShell({ children, title, backTo }: { children: ReactNode; title: string; backTo?: Screen }) {
  return (
    <div className="hud-screen-enter flex h-full w-full flex-col">
      <HudHeader title={title} backTo={backTo} />
      <div className="hud-scroll flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
        {children}
      </div>
    </div>
  );
}

export function StatChip({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-3)]/70 px-3 py-1.5 hud-mono text-xs">
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <span className="hud-label mr-2 text-[0.6rem]" style={{ color }}>{label}</span>
      <span className="tabular-nums" style={{ color: color ?? "var(--foreground)" }}>{value}</span>
    </div>
  );
}
