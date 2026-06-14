import { ScreenShell } from "./ScreenShell";
import { FACTIONS } from "@/lib/kpkData";
import { useKpk } from "@/lib/kpkStore";

export function ScoreScreen() {
  const { user, totalScore, level1, level2, level3, currency, history } = useKpk();
  const me = {
    nickname: user?.nickname ?? "—",
    faction: user?.faction ?? "",
    total: totalScore,
    l1: level1, l2: level2, l3: level3,
  };
  const top = [me];
  return (
    <ScreenShell title="ЄБали">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="hud-title text-2xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 inline-block px-3 py-1">ЄБАЛИ</h2>
          <div className="hud-mono text-xs text-[color:var(--muted-foreground)]">
            Валюта: <span className="text-[color:var(--hud-amber)]">{currency}</span> ⛁
          </div>
        </div>

        <section>
          <h3 className="hud-label mb-2">// Поточний оперативник</h3>
          <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-3">
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <div className="divide-y divide-[color:var(--hud-amber)]/15">
              {top.map((p, i) => {
                const fc = FACTIONS[p.faction] ?? "#fff";
                return (
                  <div key={p.nickname} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5">
                    <span className="hud-mono w-6 text-[color:var(--hud-amber)] text-sm">{String(i+1).padStart(2,"0")}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="hud-title text-sm truncate text-[color:var(--hud-green)]">{p.nickname}</span>
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: fc, boxShadow: `0 0 6px ${fc}` }} />
                        <span className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)] truncate">{p.faction}</span>
                      </div>
                      <div className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)] tabular-nums">
                        I {p.l1} · II {p.l2} · III {p.l3}
                      </div>
                    </div>
                    <span className="hud-title text-xl tabular-nums text-[color:var(--hud-amber)]">{p.total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <h3 className="hud-label mb-2">// Історія балів</h3>
          <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-3">
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            {history.length === 0 && (
              <div className="hud-mono text-xs text-[color:var(--muted-foreground)]">// Поки що пусто. Виконуй місії.</div>
            )}
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between border-b border-[color:var(--hud-amber)]/10 py-2 last:border-0">
                <div className="min-w-0">
                  <div className="hud-mono text-xs text-[color:var(--foreground)] truncate">{h.nickname}</div>
                  <div className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)] truncate">{h.reason}</div>
                </div>
                <span className="hud-mono text-sm tabular-nums text-[color:var(--hud-green)]">+{h.reward}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ScreenShell>
  );
}
