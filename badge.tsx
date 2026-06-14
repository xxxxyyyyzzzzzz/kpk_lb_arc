import { ScreenShell } from "./ScreenShell";
import { UPGRADES, UPGRADE_CATEGORIES, type UpgradeCategory, type UpgradeDef } from "@/lib/kpkData";
import { useKpk } from "@/lib/kpkStore";

export function UpgradesScreen() {
  const { upgradePoints, upgrades, level1, level2, level3, currency } = useKpk();
  const purchased = upgrades.length;
  return (
    <ScreenShell title="Прокачки">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="hud-title text-xl text-[color:var(--hud-amber)] border border-[color:var(--hud-amber)]/40 inline-block px-3 py-1">ДЕРЕВО ПРОКАЧОК</h2>
            <div className="mt-2 hud-mono text-xs text-[color:var(--muted-foreground)]">
              Куплено: <span className="text-[color:var(--hud-amber)]">{purchased}</span>
              <span className="mx-2">·</span>L1: <span className="text-[color:var(--mission-defense)]">{level1}</span>
              <span className="mx-2">·</span>L2: <span className="text-[color:var(--mission-loot)]">{level2}</span>
              <span className="mx-2">·</span>L3: <span className="text-[color:var(--mission-economy)]">{level3}</span>
              <span className="mx-2">·</span>⛁ <span className="text-[color:var(--hud-amber)]">{currency}</span>
            </div>
          </div>
          <div className="hud-panel-corners-4 relative border border-[color:var(--hud-cyan)]/40 px-4 py-2">
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <div className="hud-label text-[0.6rem] text-[color:var(--hud-cyan)]">// Сума балів</div>
            <div className="hud-title text-2xl text-[color:var(--hud-cyan)]">{upgradePoints}</div>
          </div>
        </div>

        <div className="space-y-5">
          {UPGRADE_CATEGORIES.map((cat) => (
            <Branch key={cat} cat={cat} />
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

function Branch({ cat }: { cat: UpgradeCategory }) {
  const tiers = [1, 2, 3] as const;
  const all = Object.values(UPGRADES);
  return (
    <div className="hud-panel-corners-4 relative border border-[color:var(--hud-amber)]/25 bg-[color:var(--surface-2)] p-3">
      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
      <div className="grid grid-cols-[100px_1fr] items-start gap-4 sm:grid-cols-[120px_1fr]">
        <div className="hud-title text-sm text-[color:var(--hud-amber)] border-r border-[color:var(--hud-amber)]/20 pr-3 py-2">{cat.toUpperCase()}</div>
        <div className="flex items-stretch gap-3 overflow-x-auto hud-scroll pb-2">
          {tiers.map((tier, i) => {
            const nodes = all.filter((u) => u.category === cat && u.tier === tier);
            return (
              <div key={tier} className="flex items-center gap-3">
                <div className="flex flex-col gap-2">
                  {nodes.map((n) => <UpgradeNode key={n.id} u={n} />)}
                </div>
                {i < tiers.length - 1 && <div className="h-px w-6 shrink-0 bg-[color:var(--hud-amber)]/40" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UpgradeNode({ u }: { u: UpgradeDef }) {
  const { upgrades, canPurchase, purchaseUpgrade } = useKpk();
  const isPurchased = upgrades.includes(u.id);
  const check = isPurchased ? { ok: false, reason: "Куплено" } : canPurchase(u.id);
  const state: "purchased" | "available" | "locked" =
    isPurchased ? "purchased" : check.ok ? "available" : "locked";
  const styles =
    state === "purchased" ? "border-[color:var(--hud-green)] bg-[color:var(--hud-green)]/10 text-[color:var(--foreground)]" :
    state === "available" ? "border-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/5 text-[color:var(--foreground)] cursor-pointer hover:shadow-[0_0_12px_rgba(245,184,64,0.4)] hover:-translate-y-0.5" :
    "border-[color:var(--muted-foreground)]/30 bg-black/20 text-[color:var(--muted-foreground)]";
  return (
    <div
      className={`relative w-[180px] border p-2 transition-all ${styles}`}
      title={state === "locked" ? check.reason : state === "purchased" ? "Куплено" : "Купити"}
      onClick={() => { if (state === "available") purchaseUpgrade(u.id); }}
    >
      {state === "purchased" && (
        <span className="absolute -top-2 -right-2 hud-mono text-[0.6rem] bg-[color:var(--hud-green)] text-black px-1.5 py-0.5">✓</span>
      )}
      <p className="text-[0.75rem] leading-tight mb-2">{u.name}</p>
      <div className="flex justify-between items-end">
        <span className="hud-mono text-[0.6rem] text-[color:var(--hud-amber)]">T{u.tier}</span>
        <span className={`hud-mono text-[0.65rem] ${state === "purchased" ? "line-through opacity-60" : ""}`}>◆ {u.cost}</span>
      </div>
      {state === "locked" && check.reason && (
        <div className="mt-1 hud-mono text-[0.55rem] text-[color:var(--hud-red)]/80 leading-tight">{check.reason}</div>
      )}
    </div>
  );
}
