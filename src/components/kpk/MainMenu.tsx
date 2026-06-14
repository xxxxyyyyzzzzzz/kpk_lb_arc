import { useKpk, useSessionSeconds, fmtSession } from "@/lib/kpkStore";
import { FACTIONS } from "@/lib/kpkData";
import { sfx } from "@/lib/sounds";

const MENU = [
  { id: "missions", label: "Місії", desc: "Завдання для оперативника", icon: "▤" },
  { id: "score", label: "ЄБали", desc: "Топ та історія балів", icon: "✦" },
  { id: "news", label: "Новини", desc: "Події зони · ініціатива", icon: "◈" },
  { id: "upgrades", label: "Прокачки", desc: "Дерево покращень", icon: "❖" },
  { id: "timer", label: "Таймер", desc: "Хід / сесія / бали дій", icon: "⏱" },
] as const;

export function MainMenu() {
  const { user, logout, go, totalScore, level1, level2, level3, round, turn,
    roomCode, players, isHost, playerId } = useKpk();
  const sessionSeconds = useSessionSeconds();
  const factionColor = user ? FACTIONS[user.faction] : "#fff";

  return (
    <div className="hud-screen-enter flex h-full w-full flex-col">
      {/* Status bar */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)]/80 px-3 py-2 sm:flex sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center border border-[color:var(--hud-amber)]/50 hud-mono text-[color:var(--hud-amber)]">КПК</div>
          <div className="min-w-0">
            <div className="hud-label text-[0.6rem]">Оперативник</div>
            <div className="truncate hud-title text-base sm:text-lg text-[color:var(--hud-amber-glow)]">{user?.nickname}</div>
          </div>
          <div className="ml-2 shrink-0 hud-mono text-xs" style={{ color: factionColor }}>
            ▮ {user?.faction}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 hud-mono text-xs">
          <span className="text-[color:var(--muted-foreground)]">SESSION</span>
          <span className="text-[color:var(--hud-cyan)] tabular-nums">{fmtSession(sessionSeconds)}</span>
          <span className="text-[color:var(--muted-foreground)]">| RND</span>
          <span className="text-[color:var(--hud-amber)] tabular-nums">{round}.{turn}</span>
        </div>
      </header>

      <div className="hud-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-5xl">
          {/* Room info */}
          {roomCode && (
            <div className="hud-panel-corners-4 relative mb-5 border border-[color:var(--hud-cyan)]/40 bg-[color:var(--surface-2)] p-3">
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="hud-label text-[0.6rem] text-[color:var(--hud-cyan)]">// КОД КІМНАТИ {isHost ? "· HOST" : ""}</div>
                  <div className="hud-title text-3xl tracking-[0.4em] text-[color:var(--hud-cyan)]">{roomCode}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <span key={p.id} className={`hud-mono text-[0.7rem] border px-2 py-1 ${p.id === playerId ? "border-[color:var(--hud-amber)] text-[color:var(--hud-amber)]" : "border-[color:var(--hud-amber)]/30 text-[color:var(--muted-foreground)]"}`}>
                      <span className="inline-block h-1.5 w-1.5 rounded-full mr-1.5" style={{ background: FACTIONS[p.faction] ?? "#fff" }} />
                      {p.nickname}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KPI row */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="Загальні бали" value={totalScore} accent="var(--hud-amber)" />
            <Kpi label="Рівень I" value={level1} accent="var(--mission-defense)" />
            <Kpi label="Рівень II" value={level2} accent="var(--mission-loot)" />
            <Kpi label="Рівень III" value={level3} accent="var(--mission-economy)" />
          </div>

          {/* Menu */}
          <div className="hud-label mb-3">// Модулі КПК</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MENU.map((m) => (
              <button
                key={m.id}
                onClick={() => { sfx.click(); go(m.id as never); }}
                className="hud-panel-corners-4 group relative overflow-hidden border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-5 text-left transition-all hover:border-[color:var(--hud-amber)] hover:shadow-[0_0_20px_rgba(245,184,64,0.25)]"
                data-hud-sound="hover"
              >
                <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
                <div className="flex items-start justify-between">
                  <span className="hud-title text-xl text-[color:var(--foreground)] group-hover:text-[color:var(--hud-amber)] transition-colors">{m.label}</span>
                  <span className="hud-mono text-2xl text-[color:var(--hud-amber)]/60 group-hover:text-[color:var(--hud-amber)] transition-all group-hover:translate-x-1">{m.icon}</span>
                </div>
                <div className="mt-1 hud-mono text-xs text-[color:var(--muted-foreground)]">{m.desc}</div>
                <div className="mt-3 h-px w-full bg-gradient-to-r from-[color:var(--hud-amber)]/40 via-transparent to-transparent" />
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--hud-amber)]/20 pt-4">
            <button onClick={logout} className="hud-btn hud-btn-ghost">↶ Вийти</button>
            <button
              onClick={() => { sfx.deny(); }}
              className="hud-btn hud-btn-danger"
            >⚠ Скинути гру</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/25 bg-[color:var(--surface-2)] px-3 py-3">
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <div className="hud-label text-[0.6rem]" style={{ color: accent }}>{label}</div>
      <div className="hud-title mt-1 text-2xl tabular-nums" style={{ color: accent }}>{value}</div>
    </div>
  );
}
