import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KpkProvider, useKpk } from "@/lib/kpkStore";
import { installGlobalSfx, sfx } from "@/lib/sounds";
import { LoginScreen } from "@/components/kpk/LoginScreen";
import { MainMenu } from "@/components/kpk/MainMenu";
import { MissionsScreen } from "@/components/kpk/MissionsScreen";
import { ScoreScreen } from "@/components/kpk/ScoreScreen";
import { NewsScreen } from "@/components/kpk/NewsScreen";
import { UpgradesScreen } from "@/components/kpk/UpgradesScreen";
import { TimerScreen } from "@/components/kpk/TimerScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "КПК — Тактичний термінал" },
      { name: "description", content: "Тактичний HUD для настільної ігрової сесії: місії, прокачки, новини зони, таймер ходу." },
      { property: "og:title", content: "КПК — Тактичний термінал" },
      { property: "og:description", content: "Тактичний HUD для настільної ігрової сесії." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" },
    ],
  }),
  component: () => (
    <KpkProvider>
      <KpkApp />
    </KpkProvider>
  ),
});

function KpkApp() {
  const { screen } = useKpk();
  const [muted, setMuted] = useState(false);

  useEffect(() => { installGlobalSfx(); }, []);

  return (
    <div className="hud-grid-bg hud-scanlines hud-vignette relative h-screen w-screen overflow-hidden">
      <div className="hud-scanbar" />

      {/* Status strip */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-50 flex justify-between px-3 py-1 hud-mono text-[0.6rem] uppercase text-[color:var(--hud-amber)]/60 tracking-widest">
        <span>● REC · ZONE-7</span>
        <span className="hud-blink">SIGNAL OK</span>
        <span>v1.0 · 2026.06.10</span>
      </div>

      <button
        onClick={() => { const m = !muted; setMuted(m); sfx.setMuted(m); if (!m) sfx.click(); }}
        className="hud-btn hud-btn-ghost pointer-events-auto absolute bottom-3 right-3 z-50 !py-1.5 !px-3 !text-[0.65rem]"
        title="Mute / Unmute"
      >
        {muted ? "🔇 SFX" : "🔊 SFX"}
      </button>

      {/* Screen router */}
      <div className="relative z-10 h-full w-full">
        {screen === "login" && <LoginScreen />}
        {screen === "main" && <MainMenu />}
        {screen === "missions" && <MissionsScreen />}
        {screen === "score" && <ScoreScreen />}
        {screen === "news" && <NewsScreen />}
        {screen === "upgrades" && <UpgradesScreen />}
        {screen === "timer" && <TimerScreen />}
      </div>
    </div>
  );
}
