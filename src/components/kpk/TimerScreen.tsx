import { useState } from "react";
import { ScreenShell } from "./ScreenShell";
import { useKpk, useSessionSeconds, fmtClock, fmtSession } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";

const BOTS = [
  { name: "Мутанти", info: "Сова сидить. Лисиця їсть предмети. Ведмідь — до найближчої будівлі. Темна гонча — до пораненого. Лісовик/Болотник — на солдатів у траві. Криси — стадом до будівель. Демон руйнує будівлі. Псевдогігант атакує техніку. Король павуків — у центр." },
  { name: "Зомбі", info: null },
  { name: "Воля", info: "Збирає предмети, об'єднується з угрупуванням, разом ідуть на Обов'язок. Атакує — інші підтримують." },
  { name: "Обов'язок", info: "Збирає предмети, об'єднується з угрупуванням, разом ідуть на Волю." },
  { name: "Нанокс", info: "Збирає шматки мутантів. Йдуть до Псі-випромінювача. Троє в одному секторі починають будувати випромінювач." },
  { name: "Транспорт Нанокс", info: "Йде до найближчого Нанокса. Без нього — за 2 раунди спавнить бійця." },
];

export function TimerScreen() {
  const { user, round, turn, sessionSeconds, turnSeconds, turnRunning, toggleTurn, nextPlayer, ap, setAP } = useKpk();
  const [openBot, setOpenBot] = useState<string | null>(null);
  const ending = turnSeconds <= 30;

  return (
    <ScreenShell title="Таймер">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center hud-mono text-xs text-[color:var(--muted-foreground)]">
          Новина {round} / Хід {turn} з 4
        </div>

        <div className="hud-panel-corners-4 relative flex items-center justify-between border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] px-4 py-3">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <span className="hud-label">Загальний час сесії</span>
          <span className="hud-mono text-lg tabular-nums text-[color:var(--hud-cyan)]">{fmtSession(sessionSeconds)}</span>
        </div>

        <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/30 bg-[color:var(--surface-2)] p-6 text-center">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <h3 className="hud-title text-base text-[color:var(--muted-foreground)] mb-2">Хід гравця / <span className="text-[color:var(--hud-amber-glow)]">{user?.nickname}</span></h3>
          <div className={`hud-mono text-7xl sm:text-8xl tabular-nums tracking-wider my-4 ${ending ? "text-[color:var(--hud-red)] hud-pulse-red" : "text-[color:var(--hud-amber-glow)]"}`}>
            {fmtClock(turnSeconds)}
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            <button className="hud-btn min-w-[140px]" onClick={() => { sfx.click(); toggleTurn(); }}>
              {turnRunning ? "❚❚ Пауза" : "▸ Старт"}
            </button>
            <button className="hud-btn hud-btn-ghost min-w-[180px]" onClick={nextPlayer}>↦ Наступний гравець</button>
          </div>
        </div>

        {/* Action points */}
        <div className="space-y-3">
          <ApRow label="Активні дії" color="var(--action-active)" cur={ap.active} max={ap.activeMax}
            onMinus={() => setAP("active", ap.active - 1)} onPlus={() => setAP("active", ap.active + 1)} />
          <ApRow label="Атакуючі дії" color="var(--action-attack)" cur={ap.attack} max={ap.attackMax}
            onMinus={() => setAP("attack", ap.attack - 1)} onPlus={() => setAP("attack", ap.attack + 1)} />
          <ApRow label="Будівельні дії" color="var(--action-build)" cur={ap.build} max={ap.buildMax}
            onMinus={() => setAP("build", ap.build - 1)} onPlus={() => setAP("build", ap.build + 1)} />
        </div>

        {/* Bot turn details */}
        <div>
          <div className="hud-label mb-2">// Хід ботів</div>
          <div className="space-y-2">
            {BOTS.map((b) => (
              <div key={b.name} className="border border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-2)]">
                {b.info ? (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[color:var(--surface-3)] text-left"
                      onClick={() => { sfx.click(); setOpenBot(openBot === b.name ? null : b.name); }}
                    >
                      <span className={`hud-mono text-[color:var(--hud-amber)] transition-transform inline-block ${openBot === b.name ? "rotate-90" : ""}`}>▸</span>
                      <span className="hud-title text-sm">{b.name}</span>
                    </button>
                    {openBot === b.name && (
                      <div className="px-4 py-3 hud-mono text-xs leading-relaxed text-[color:var(--muted-foreground)] border-t border-[color:var(--hud-amber)]/15 bg-black/30">
                        {b.info}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-2 hud-title text-sm text-[color:var(--muted-foreground)]">{b.name}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

function ApRow({ label, color, cur, max, onMinus, onPlus }: { label: string; color: string; cur: number; max: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="hud-title text-sm" style={{ color }}>{label}</span>
        <span className="hud-mono text-sm tabular-nums">{cur} / {max}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 p-2 border" style={{ borderColor: `${color}55` }}>
        {Array.from({ length: max }).map((_, i) => (
          <button
            key={i}
            onClick={() => { sfx.click(); i < cur ? onMinus() : onPlus(); }}
            className="h-6 w-6 border transition-all"
            style={{
              borderColor: i < cur ? color : `${color}55`,
              background: i < cur ? color : "transparent",
              boxShadow: i < cur ? `0 0 6px ${color}` : "none",
            }}
            data-hud-sound="hover"
          />
        ))}
      </div>
    </div>
  );
}
