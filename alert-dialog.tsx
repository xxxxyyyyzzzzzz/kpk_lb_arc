import { ScreenShell } from "./ScreenShell";
import { useKpk } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";

export function NewsScreen() {
  const { round, news, nextPlayer } = useKpk();
  return (
    <ScreenShell title="Новини">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="hud-title text-xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 px-3 py-1">НОВИНИ ЗОНИ</h2>
          <span className="hud-mono text-sm text-[color:var(--hud-cyan)]">Раунд {round}</span>
        </div>

        <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-5 space-y-3 min-h-[200px]">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          {news.length === 0 && (
            <div className="hud-mono text-xs text-[color:var(--muted-foreground)]">// Тиша в ефірі...</div>
          )}
          {news.map((n, i) => (
            <div key={i} className="hud-screen-enter border-l-2 border-[color:var(--hud-amber)] bg-[color:var(--surface-3)]/50 p-3 hud-mono text-sm">
              <div className="hud-label mb-1 text-[0.6rem]">// СИГНАЛ #{i + 1}</div>
              <span className="text-[color:var(--hud-amber-glow)]">{n.entity}</span>
              {n.note ? <span className="ml-2">— {n.note}</span> : <span className="ml-2">×{n.count}{n.zone && n.zone !== "any" ? ` · ${n.zone}` : ""}</span>}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="hud-btn flex-1 min-w-[200px]"
            onClick={() => { sfx.notify(); nextPlayer(); }}
          >▸ Завершити хід / Наступний</button>
        </div>
      </div>
    </ScreenShell>
  );
}
