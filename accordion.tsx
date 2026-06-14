import { ScreenShell } from "./ScreenShell";
import { MISSION_CLASS_COLOR } from "@/lib/kpkData";
import { useKpk } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";

export function MissionsScreen() {
  const { user, totalScore, slots, getMission, updateSlotProgress, completeSlot, replaceSlot, replacements } = useKpk();
  return (
    <ScreenShell title="Місії">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="hud-title text-xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 px-3 py-1">МІСІЇ</h2>
          </div>
          <div className="hud-mono text-xs text-[color:var(--muted-foreground)]">
            /<span className="text-[color:var(--hud-amber-glow)]">{user?.nickname}</span> · Бали: <span className="text-[color:var(--hud-amber)]">{totalScore}</span>
          </div>
        </div>

        {([1, 2, 3] as const).map((tier) => (
          <div key={tier} className="mb-6">
            <div className="mb-2 flex items-center gap-3 border-b border-[color:var(--hud-amber)]/20 pb-1">
              <span className="hud-label text-[color:var(--hud-amber)]">Рівень {tier === 1 ? "I" : tier === 2 ? "II" : "III"}</span>
              <span className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">[заміни: {replacements[tier]}]</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {slots.filter((s) => (s.slot_index % 3) + 1 === tier).map((s) => {
                const m = getMission(s.mission_id);
                return (
                  <MissionCard
                    key={s.slot_index}
                    slotIndex={s.slot_index}
                    progress={s.current_progress}
                    mission={m}
                    canReplace={replacements[tier] > 0}
                    onMinus={() => { sfx.click(); updateSlotProgress(s.slot_index, -1); }}
                    onPlus={() => { sfx.click(); updateSlotProgress(s.slot_index, +1); }}
                    onComplete={() => completeSlot(s.slot_index)}
                    onReplace={() => replaceSlot(s.slot_index)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

type MissionCardProps = {
  slotIndex: number;
  progress: number;
  mission: ReturnType<ReturnType<typeof useKpk>["getMission"]>;
  canReplace: boolean;
  onMinus: () => void;
  onPlus: () => void;
  onComplete: () => void;
  onReplace: () => void;
};

function MissionCard({ mission: m, progress, canReplace, onMinus, onPlus, onComplete, onReplace }: MissionCardProps) {
  if (!m) {
    return (
      <div className="hud-panel-corners-4 relative border border-dashed border-[color:var(--hud-amber)]/20 bg-[color:var(--surface-2)]/30 p-3 text-center hud-mono text-xs text-[color:var(--muted-foreground)]">
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
        — порожній слот —
      </div>
    );
  }
  const color = MISSION_CLASS_COLOR[m.cls];
  const pct = Math.min(100, (progress / m.target) * 100);
  const done = progress >= m.target;
  return (
    <div className={`hud-panel-corners-4 relative flex flex-col gap-2 border bg-[color:var(--surface-2)] p-3 transition-all ${done ? "mission-active-glow" : "border-[color:var(--hud-amber)]/25"}`}>
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight">{m.name}</span>
        <button
          disabled={!canReplace}
          onClick={onReplace}
          title={canReplace ? "Замінити місію" : "Немає замін"}
          className="grid h-6 w-6 shrink-0 place-items-center border border-[color:var(--hud-amber)]/40 text-[color:var(--hud-amber)] hover:bg-[color:var(--hud-amber)]/10 disabled:opacity-30"
        >⟲</button>
      </div>
      <div className="hud-mono text-[0.65rem] text-[color:var(--muted-foreground)] leading-snug">{m.description}</div>
      <div className="flex items-center justify-between">
        <span className="hud-mono text-[0.65rem] uppercase tracking-widest" style={{ color }}>{m.cls}</span>
        <span className="hud-mono text-xs tabular-nums">{progress}/{m.target}</span>
      </div>
      <div className="h-1 w-full bg-[color:var(--surface-3)]">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <div className="flex gap-2 pt-1">
        <button className="hud-btn hud-btn-ghost flex-1 !py-1 !text-[0.65rem]" onClick={onMinus}>−</button>
        <button className="hud-btn hud-btn-ghost flex-1 !py-1 !text-[0.65rem]" onClick={onPlus}>+</button>
        <button className="hud-btn flex-1 !py-1 !text-[0.65rem]" disabled={!done} onClick={onComplete}>✓ Виплатити</button>
      </div>
      <div className="border-t border-dashed border-[color:var(--hud-amber)]/20 pt-1 hud-mono text-[0.65rem] text-[color:var(--muted-foreground)]">
        Нагорода: +{m.mainReward} балів · +{m.levelReward} L{m.level} · +{m.currencyReward} ⛁
      </div>
    </div>
  );
}
