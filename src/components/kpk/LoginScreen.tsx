import { useEffect, useState } from "react";
import factionsJson from "@/data/factions.json";
import { useKpk } from "@/lib/kpkStore";
import { sfx } from "@/lib/sounds";

const FACTIONS: Record<string, string> = factionsJson as Record<string, string>;

type Mode = "menu" | "create" | "join";

export function LoginScreen() {
  const { createGame, joinGame, takenFactions } = useKpk();
  const [mode, setMode] = useState<Mode>("menu");
  const [code, setCode] = useState("");
  const [nickname, setNick] = useState("");
  const [faction, setFaction] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [taken, setTaken] = useState<string[]>([]);

  // refresh taken factions when user types a 4-char code in join mode
  useEffect(() => {
    if (mode !== "join") { setTaken([]); return; }
    const c = code.trim().toUpperCase();
    if (c.length !== 4) { setTaken([]); return; }
    let cancelled = false;
    takenFactions(c).then((t) => { if (!cancelled) setTaken(t); });
    return () => { cancelled = true; };
  }, [mode, code, takenFactions]);

  async function submit() {
    if (!nickname.trim()) { setErr("◂ Введіть нікнейм"); sfx.deny(); return; }
    if (!faction) { setErr("◂ Оберіть угрупування"); sfx.deny(); return; }
    if (mode === "join") {
      const c = code.trim().toUpperCase();
      if (c.length !== 4) { setErr("◂ Код кімнати — 4 символи"); sfx.deny(); return; }
      if (taken.includes(faction)) { setErr("◂ Угрупування вже зайняте у цій кімнаті"); sfx.deny(); return; }
    }
    setErr(""); setBusy(true);
    const u = { nickname: nickname.trim().toUpperCase(), faction };
    const r = mode === "create" ? await createGame(u) : await joinGame(code, u);
    setBusy(false);
    if (!r.ok) setErr("◂ " + (r.reason ?? "Помилка"));
  }

  return (
    <div className="hud-screen-enter flex h-full w-full items-center justify-center px-4">
      <div className="hud-panel-corners-4 relative w-full max-w-md border border-[color:var(--hud-amber)]/40 bg-[color:var(--surface-2)]/80 p-6 sm:p-8 backdrop-blur-sm">
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />

        <div className="mb-6 flex items-center justify-between border-b border-[color:var(--hud-amber)]/30 pb-3">
          <div>
            <div className="hud-label">// СИСТЕМА КПК v1.0</div>
            <div className="hud-title text-2xl text-[color:var(--hud-amber)] hud-flicker">
              {mode === "menu" ? "АВТОРИЗАЦІЯ" : mode === "create" ? "СТВОРИТИ КІМНАТУ" : "ПРИЄДНАТИСЯ"}
            </div>
          </div>
          <div className="hud-mono text-xs text-[color:var(--hud-cyan)] hud-blink">● ONLINE</div>
        </div>

        {mode === "menu" && (
          <div className="space-y-3">
            <button onClick={() => { sfx.click(); setMode("create"); setErr(""); }} className="hud-btn w-full !py-3 text-base">
              ⊕ СТВОРИТИ ГРУ
            </button>
            <button onClick={() => { sfx.click(); setMode("join"); setErr(""); }} className="hud-btn hud-btn-ghost w-full !py-3 text-base">
              ⇆ ПРИЄДНАТИСЯ ДО ГРИ
            </button>
            <p className="hud-mono text-center text-[0.65rem] text-[color:var(--muted-foreground)] pt-2">
              До 4 гравців у кімнаті · унікальне угрупування
            </p>
          </div>
        )}

        {mode !== "menu" && (
        <div className="space-y-4">
          {mode === "join" && (
            <div>
              <label className="hud-label mb-1.5 block">Код кімнати (4 символи)</label>
              <input
                className="hud-input tracking-[0.5em] text-center uppercase"
                placeholder="A1B2"
                value={code}
                maxLength={4}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
          )}
          <div>
            <label className="hud-label mb-1.5 block">Оперативник</label>
            <input
              className="hud-input"
              placeholder="введіть нікнейм..."
              value={nickname}
              onChange={(e) => setNick(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <div>
            <label className="hud-label mb-1.5 block">Угрупування</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FACTIONS).map(([name, color]) => {
                const isTaken = taken.includes(name);
                return (
                  <button
                    key={name}
                    disabled={isTaken}
                    onClick={() => { if (isTaken) return; sfx.click(); setFaction(name); }}
                    className={`hud-mono relative border px-3 py-2.5 text-left text-sm transition-all ${
                      isTaken
                        ? "border-[color:var(--muted-foreground)]/20 bg-black/30 opacity-40 cursor-not-allowed line-through"
                        : faction === name
                          ? "border-[color:var(--hud-amber)] bg-[color:var(--hud-amber)]/10 shadow-[0_0_12px_rgba(245,184,64,0.25)]"
                          : "border-[color:var(--hud-amber)]/25 hover:border-[color:var(--hud-amber)]/60"
                    }`}
                    data-hud-sound="hover"
                  >
                    <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                    {name}{isTaken ? " · зайнято" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { sfx.back(); setMode("menu"); setErr(""); }} className="hud-btn hud-btn-ghost !py-3 px-4">↶</button>
            <button onClick={submit} disabled={busy} className="hud-btn flex-1 !py-3 text-base">
              {busy ? "..." : mode === "create" ? "⊕ СТВОРИТИ" : "⌬ УВІЙТИ"}
            </button>
          </div>
          {err && <p className="hud-mono text-center text-sm text-[color:var(--hud-red)]">{err}</p>}
        </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-[color:var(--hud-amber)]/20 pt-3 text-[0.65rem] hud-mono text-[color:var(--muted-foreground)]">
          <span>NET: ZONE-7</span>
          <span>SIG: <span className="text-[color:var(--hud-green)]">▮▮▮▮</span></span>
          <span>2026.06.10</span>
        </div>
      </div>
    </div>
  );
}
