import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DEFAULT_ACTION_POINTS,
  TURN_DURATION_SECONDS,
  TOTAL_NEWS_ROUNDS,
  TURNS_PER_NEWS_ROUND,
  TIER_LIMITS,
  UPGRADES,
  generateAllMissions,
  generateNews,
  type Mission,
  type Screen,
  type UpgradeCategory,
  type NewsEntry,
} from "./kpkData";
import { sfx } from "./sounds";
import { generatePlayerId, generateRoomCode } from "./firebase";
import { makePlayer, makeSession, type PlayerState } from "./sessionSchema";
import { readSession, txSession, useSession, writeSession } from "@/hooks/useSession";

type User = { nickname: string; faction: string };

type Slot = { slot_index: number; mission_id: number | null; current_progress: number };

type ActionPoints = {
  active: number; activeMax: number;
  attack: number; attackMax: number;
  build: number; buildMax: number;
};

type HistoryEntry = { nickname: string; reason: string; reward: number };

type PurchaseResult = { ok: boolean; reason?: string };

export type RoomResult = { ok: boolean; reason?: string; code?: string };

type KpkState = {
  // navigation
  screen: Screen;
  prevScreen: Screen | null;

  // player
  user: User | null;
  totalScore: number;
  level1: number; level2: number; level3: number;
  currency: number;
  currencyEarnedThisTurn: number;

  // rounds
  round: 1 | 2 | 3 | 4;
  turn: number; // 1..TURNS_PER_NEWS_ROUND
  sessionSeconds: number;
  turnSeconds: number;
  turnRunning: boolean;

  // ap / replacements
  ap: ActionPoints;
  replacements: Record<1 | 2 | 3, number>;

  // missions
  slots: Slot[];
  completedIds: number[];
  missionsByLevel: Record<1 | 2 | 3, Mission[]>;
  allMissions: Mission[];
  getMission: (id: number | null) => Mission | null;

  // upgrades
  upgrades: string[];
  upgradePoints: number;
  canPurchase: (id: string) => PurchaseResult;
  purchaseUpgrade: (id: string) => PurchaseResult;

  // news
  news: NewsEntry[];
  history: HistoryEntry[];

  // actions
  login: (u: User) => void;
  createGame: (u: User) => Promise<RoomResult>;
  joinGame: (code: string, u: User) => Promise<RoomResult>;
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  players: { id: string; nickname: string; faction: string }[];
  takenFactions: (code: string) => Promise<string[]>;
  logout: () => void;
  go: (s: Screen) => void;
  setAP: (k: keyof ActionPoints, v: number) => void;
  toggleTurn: () => void;
  nextPlayer: () => void;
  updateSlotProgress: (slotIndex: number, delta: number) => void;
  completeSlot: (slotIndex: number) => void;
  replaceSlot: (slotIndex: number) => void;
};

const KpkContext = createContext<KpkState | null>(null);

const slotLevel = (i: number) => ((i % 3) + 1) as 1 | 2 | 3;

function buildInitialSlots(byLevel: Record<1 | 2 | 3, Mission[]>): Slot[] {
  const used = new Set<number>();
  return Array.from({ length: 6 }).map((_, i) => {
    const lvl = slotLevel(i);
    const pool = byLevel[lvl].filter((m) => !used.has(m.id));
    const m = pool[Math.floor(Math.random() * pool.length)];
    if (m) used.add(m.id);
    return { slot_index: i, mission_id: m?.id ?? null, current_progress: 0 };
  });
}

function bonusActiveAP(upgrades: string[]) {
  return upgrades.includes("komanduvannya_2_3") ? 1 : 0;
}
function bonusAttackAP(upgrades: string[]) {
  return upgrades.includes("komanduvannya_2_1") ? 1 : 0;
}
function baseAP(upgrades: string[]): ActionPoints {
  const active = DEFAULT_ACTION_POINTS.active + bonusActiveAP(upgrades);
  const attack = DEFAULT_ACTION_POINTS.attack + bonusAttackAP(upgrades);
  const build = DEFAULT_ACTION_POINTS.build;
  return { active, activeMax: active, attack, attackMax: attack, build, buildMax: build };
}

export function KpkProvider({ children }: { children: ReactNode }) {
  const allMissions = useMemo(() => generateAllMissions(), []);
  const missionsByLevel = useMemo(() => {
    const m: Record<1 | 2 | 3, Mission[]> = { 1: [], 2: [], 3: [] };
    for (const x of allMissions) m[x.level].push(x);
    return m;
  }, [allMissions]);

  const [screen, setScreen] = useState<Screen>("login");
  const [prevScreen, setPrev] = useState<Screen | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [sessionSeconds, setSS] = useState(0);

  const session = useSession(roomCode);
  const me: PlayerState | null = session && playerId ? session.players?.[playerId] ?? null : null;

  const warnRef = useRef(false);

  // session timer — only tick while inside an active room to avoid
  // re-rendering the whole tree (and lagging inputs) on the login screen.
  useEffect(() => {
    if (!roomCode) return;
    const id = setInterval(() => setSS((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [roomCode]);

  // ── HOST ENGINE: drive turn timer & news rounds for everyone ──
  const isHost = !!session && !!playerId && session.host_id === playerId;

  useEffect(() => {
    if (!isHost || !session || !roomCode) return;
    if (!session.turn_running) return;
    const id = setInterval(() => {
      txSession(roomCode, (cur) => {
        if (!cur || !cur.turn_running) return undefined;
        const next = { ...cur, turn_seconds: Math.max(0, (cur.turn_seconds ?? 0) - 1) };
        if (next.turn_seconds === 0) next.turn_running = false;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isHost, session?.turn_running, roomCode]);

  // SFX for timer transitions (local)
  useEffect(() => {
    if (!session) return;
    if (session.turn_seconds === 30 && !warnRef.current) { warnRef.current = true; sfx.notify(); }
    if (session.turn_seconds === 0) { sfx.alarm(); warnRef.current = false; }
    if (session.turn_seconds > 0 && session.turn_seconds % 60 === 0) sfx.tick();
  }, [session?.turn_seconds]);

  const getMission = useCallback(
    (id: number | null) => (id == null ? null : allMissions.find((m) => m.id === id) ?? null),
    [allMissions],
  );

  // Derived view of "me" + session — memoized on `me` so context value stays
  // stable across unrelated re-renders (e.g. local input typing).
  const user: User | null = useMemo(
    () => (me ? { nickname: me.nickname, faction: me.faction } : null),
    [me?.nickname, me?.faction],
  );
  const totalScore = me?.score ?? 0;
  const level1 = me?.level1_score ?? 0;
  const level2 = me?.level2_score ?? 0;
  const level3 = me?.level3_score ?? 0;
  const currency = me?.currency ?? 0;
  const currencyEarnedThisTurn = me?.currency_earned_this_turn ?? 0;
  const round = (session?.round ?? 1) as 1 | 2 | 3 | 4;
  const turn = session?.turn ?? 1;
  const turnSeconds = session?.turn_seconds ?? TURN_DURATION_SECONDS;
  const turnRunning = session?.turn_running ?? false;
  const news = session?.news ?? [];
  const upgradesList = useMemo(() => Object.keys(me?.upgrades ?? {}), [me?.upgrades]);
  const slots: Slot[] = useMemo(() => me?.slots ?? [], [me?.slots]);
  const completedIds = useMemo(() => me?.completed_ids ?? [], [me?.completed_ids]);
  const ap: ActionPoints = useMemo(() => (me ? {
    active: me.action_points.active, activeMax: me.action_points.active_max,
    attack: me.action_points.attack, attackMax: me.action_points.attack_max,
    build: me.action_points.build, buildMax: me.action_points.build_max,
  } : baseAP([])), [me?.action_points]);
  const replacements: Record<1 | 2 | 3, number> = useMemo(() => (me
    ? { 1: me.replacements["1"], 2: me.replacements["2"], 3: me.replacements["3"] }
    : { 1: 1, 2: 1, 3: 1 }
  ), [me?.replacements]);
  const history: HistoryEntry[] = useMemo(() => {
    const ev = session?.events ?? {};
    return Object.values(ev)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 20)
      .map((e) => ({
        nickname: e.nickname,
        reason: String((e.payload as any).reason ?? e.type),
        reward: Number((e.payload as any).reward ?? 0),
      }));
  }, [session?.events]);

  const players = useMemo(() => {
    if (!session) return [];
    const order = session.player_order?.length ? session.player_order : Object.keys(session.players ?? {});
    return order.map((id) => ({
      id,
      nickname: session.players[id]?.nickname ?? "—",
      faction: session.players[id]?.faction ?? "",
    }));
  }, [session]);

  // ── Upgrades: pure validation helpers (used both for UI and inside tx) ──
  const upgradePoints = level1 + level2 + level3;

  function validateUpgrade(p: PlayerState, id: string, currentRound: number): PurchaseResult {
    const u = UPGRADES[id];
    if (!u) return { ok: false, reason: "Невідома прокачка" };
    if (p.upgrades?.[id]) return { ok: false, reason: "Вже куплено" };
    const owned = Object.keys(p.upgrades ?? {});
    const tierCount = (t: 1 | 2 | 3) => owned.filter((x) => UPGRADES[x]?.tier === t).length;
    const inCatTier = (cat: UpgradeCategory, t: 1 | 2 | 3) =>
      owned.some((x) => UPGRADES[x]?.category === cat && UPGRADES[x]?.tier === t);
    const otherCatTier = (cat: UpgradeCategory, t: 1 | 2 | 3) =>
      owned.some((x) => UPGRADES[x]?.tier === t && UPGRADES[x]?.category !== cat);
    if (tierCount(u.tier) >= TIER_LIMITS[u.tier]) return { ok: false, reason: `Ліміт тіру ${u.tier}` };
    if (inCatTier(u.category, u.tier)) return { ok: false, reason: "Гілка зайнята" };
    if (u.category === "Командування") {
      if (currentRound < u.tier) return { ok: false, reason: `Доступно з раунду ${u.tier}` };
      if (!otherCatTier(u.category, u.tier)) return { ok: false, reason: `Потрібна прокачка T${u.tier} в іншій категорії` };
      return { ok: true };
    }
    if (u.tier >= 2 && !inCatTier(u.category, 1)) return { ok: false, reason: "Потрібна tier-1 у цій категорії" };
    if (u.tier === 3 && !inCatTier(u.category, 2)) return { ok: false, reason: "Потрібна tier-2 у цій категорії" };
    const score = u.tier === 1 ? p.level1_score : u.tier === 2 ? p.level2_score : p.level3_score;
    if (score < u.cost) return { ok: false, reason: `Недостатньо балів рівня ${u.tier}` };
    return { ok: true };
  }

  const canPurchase = useCallback((id: string): PurchaseResult => {
    if (!me) return { ok: false, reason: "Немає сесії" };
    return validateUpgrade(me, id, round);
  }, [me, round]);

  const purchaseUpgrade = useCallback((id: string): PurchaseResult => {
    if (!roomCode || !playerId) { sfx.deny(); return { ok: false, reason: "Немає сесії" }; }
    // optimistic check
    const pre = canPurchase(id);
    if (!pre.ok) { sfx.deny(); return pre; }
    // fire-and-forget atomic tx
    txSession(roomCode, (cur) => {
      if (!cur) return undefined;
      const p = cur.players?.[playerId]; if (!p) return undefined;
      const v = validateUpgrade(p, id, cur.round);
      if (!v.ok) return undefined;
      const u = UPGRADES[id];
      const np: PlayerState = {
        ...p,
        upgrades: { ...(p.upgrades ?? {}), [id]: true as const },
        level1_score: p.level1_score - (u.tier === 1 ? u.cost : 0),
        level2_score: p.level2_score - (u.tier === 2 ? u.cost : 0),
        level3_score: p.level3_score - (u.tier === 3 ? u.cost : 0),
        action_points: {
          ...p.action_points,
          active_max: p.action_points.active_max + (id === "komanduvannya_2_3" ? 1 : 0),
          active: p.action_points.active + (id === "komanduvannya_2_3" ? 1 : 0),
          attack_max: p.action_points.attack_max + (id === "komanduvannya_2_1" ? 1 : 0),
          attack: p.action_points.attack + (id === "komanduvannya_2_1" ? 1 : 0),
        },
      };
      const ts = Date.now();
      return {
        ...cur,
        players: { ...cur.players, [playerId]: np },
        events: { ...cur.events, [`e_${ts}_${id}`]: {
          ts, player_id: playerId, nickname: p.nickname,
          type: "upgrade", payload: { reason: `Прокачка: ${UPGRADES[id].name}`, upgrade_id: id, reward: 0 },
        }},
      };
    }).then((r) => { if (r.ok) sfx.confirm(); else sfx.deny(); });
    return { ok: true };
  }, [roomCode, playerId, canPurchase]);

  // ── Missions ──
  const pickNewMissionId = useCallback((level: 1 | 2 | 3, excludeIds: Set<number>) => {
    const pool = missionsByLevel[level].filter((m) => !excludeIds.has(m.id));
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)].id;
  }, [missionsByLevel]);

  const updateSlotProgress = useCallback((slotIndex: number, delta: number) => {
    if (!roomCode || !playerId) return;
    txSession(roomCode, (cur) => {
      if (!cur) return undefined;
      const p = cur.players?.[playerId]; if (!p) return undefined;
      const slots = (p.slots ?? []).map((s) => {
        if (s.slot_index !== slotIndex) return s;
        const m = allMissions.find((mm) => mm.id === s.mission_id);
        const max = m?.target ?? 0;
        return { ...s, current_progress: Math.max(0, Math.min(max, s.current_progress + delta)) };
      });
      return { ...cur, players: { ...cur.players, [playerId]: { ...p, slots } } };
    });
  }, [roomCode, playerId, allMissions]);

  // completeMission(roomCode, playerId, missionId) — atomic Firebase transaction
  const completeMissionTx = useCallback(async (
    rc: string, pid: string, slotIndex: number,
  ): Promise<{ ok: boolean; reason?: string }> => {
    const result = await txSession(rc, (cur) => {
      if (!cur) return undefined;
      const p = cur.players?.[pid]; if (!p) return undefined;
      const slot = p.slots.find((s) => s.slot_index === slotIndex);
      const m = slot?.mission_id != null ? allMissions.find((mm) => mm.id === slot.mission_id) : null;
      if (!slot || !m || slot.current_progress < m.target) return undefined;

      const isMyTurn = cur.active_player_id === pid;
      const currencyBonus = isMyTurn ? 1 : 0; // бонус валюти, якщо твій хід

      const np: PlayerState = {
        ...p,
        score: p.score + m.mainReward,
        currency: p.currency + m.currencyReward + currencyBonus,
        currency_earned_this_turn: p.currency_earned_this_turn + m.currencyReward + currencyBonus,
        level1_score: p.level1_score + (m.level === 1 ? m.levelReward : 0),
        level2_score: p.level2_score + (m.level === 2 ? m.levelReward : 0),
        level3_score: p.level3_score + (m.level === 3 ? m.levelReward : 0),
        completed_ids: [...(p.completed_ids ?? []), m.id],
      };
      // assign next mission to that slot, excluding completed + currently held
      const taken = new Set<number>([...np.completed_ids, ...np.slots.map((s) => s.mission_id ?? -1)]);
      const lvl = ((slotIndex % 3) + 1) as 1 | 2 | 3;
      const pool = allMissions.filter((mm) => mm.level === lvl && !taken.has(mm.id));
      const nextId = pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
      np.slots = np.slots.map((s) =>
        s.slot_index === slotIndex ? { ...s, mission_id: nextId, current_progress: 0 } : s,
      );

      const ts = Date.now();
      return {
        ...cur,
        players: { ...cur.players, [pid]: np },
        events: { ...cur.events, [`e_${ts}_${slotIndex}`]: {
          ts, player_id: pid, nickname: p.nickname,
          type: "mission_complete",
          payload: { reason: `Виконано: ${m.name}`, reward: m.mainReward, mission_id: m.id, currency_bonus: currencyBonus },
        }},
      };
    });
    return { ok: result.ok };
  }, [allMissions]);

  const completeSlot = useCallback((slotIndex: number) => {
    if (!roomCode || !playerId) return;
    completeMissionTx(roomCode, playerId, slotIndex).then((r) => { if (r.ok) sfx.confirm(); else sfx.deny(); });
  }, [roomCode, playerId, completeMissionTx]);

  const replaceSlot = useCallback((slotIndex: number) => {
    if (!roomCode || !playerId) return;
    txSession(roomCode, (cur) => {
      if (!cur) return undefined;
      const p = cur.players?.[playerId]; if (!p) return undefined;
      const lvl = ((slotIndex % 3) + 1) as 1 | 2 | 3;
      if ((p.replacements[String(lvl) as "1" | "2" | "3"] ?? 0) <= 0) return undefined;
      const taken = new Set<number>([...(p.completed_ids ?? []), ...p.slots.map((s) => s.mission_id ?? -1)]);
      const pool = allMissions.filter((mm) => mm.level === lvl && !taken.has(mm.id));
      const nextId = pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
      return {
        ...cur,
        players: { ...cur.players, [playerId]: {
          ...p,
          slots: p.slots.map((s) => s.slot_index === slotIndex ? { ...s, mission_id: nextId, current_progress: 0 } : s),
          replacements: { ...p.replacements, [String(lvl)]: p.replacements[String(lvl) as "1" | "2" | "3"] - 1 },
        }},
      };
    }).then((r) => { if (r.ok) sfx.click(); else sfx.deny(); });
  }, [roomCode, playerId, allMissions]);

  // ── Turn rotation / News round (host engine triggers news on round boundary) ──
  const nextPlayer = useCallback(() => {
    if (!roomCode) return;
    warnRef.current = false;
    txSession(roomCode, (cur) => {
      if (!cur) return undefined;
      const order = cur.player_order?.length ? cur.player_order : Object.keys(cur.players ?? {});
      const playersCount = Math.max(1, order.length);
      const totalTurns = TURNS_PER_NEWS_ROUND * playersCount;
      const curIdx = cur.active_player_id ? order.indexOf(cur.active_player_id) : -1;
      const nextIdx = (curIdx + 1) % playersCount;
      const nextActive = order[nextIdx] ?? null;
      const nextTurnNumber = (cur.turn ?? 0) + 1;
      let nextRound = cur.round;
      let news = cur.news;
      let resetTurn = nextTurnNumber;
      if (nextTurnNumber > totalTurns) {
        nextRound = Math.min(TOTAL_NEWS_ROUNDS, cur.round + 1) as 1 | 2 | 3 | 4;
        resetTurn = 1;
        // News Round generation (host engine) — overwrite /sessions/{code}/news
        news = generateNews(nextRound);
      }
      // Reset AP, replacements, currency-earned-this-turn for ALL players
      const players = { ...cur.players };
      for (const pid of Object.keys(players)) {
        const p = players[pid];
        const ap = p.action_points;
        players[pid] = {
          ...p,
          action_points: {
            ...ap, active: ap.active_max, attack: ap.attack_max, build: ap.build_max,
          },
          replacements: { "1": 1, "2": 1, "3": 1 },
          currency_earned_this_turn: 0,
        };
      }
      const ts = Date.now();
      return {
        ...cur,
        round: nextRound,
        turn: resetTurn,
        active_player_id: nextActive,
        turn_seconds: TURN_DURATION_SECONDS,
        turn_running: false,
        news,
        players,
        events: { ...cur.events, [`e_${ts}_turn`]: {
          ts, player_id: cur.active_player_id ?? "", nickname: players[cur.active_player_id ?? ""]?.nickname ?? "—",
          type: nextTurnNumber > totalTurns ? "news_round" : "turn_end",
          payload: { reason: nextTurnNumber > totalTurns ? `Раунд ${nextRound}: новини зони` : "Кінець ходу", reward: 0 },
        }},
      };
    }).then(() => sfx.confirm());
  }, [roomCode]);

  // ── Lobby / Room management ──
  const takenFactions = useCallback(async (code: string) => {
    const s = await readSession(code);
    if (!s) return [];
    return Object.values(s.players ?? {}).map((p) => p.faction);
  }, []);

  const createGame = useCallback(async (u: User): Promise<RoomResult> => {
    let code = generateRoomCode();
    // ensure no collision
    for (let i = 0; i < 5; i++) {
      const existing = await readSession(code);
      if (!existing) break;
      code = generateRoomCode();
    }
    const pid = generatePlayerId();
    const sess = makeSession(code, pid);
    const player = makePlayer(u.nickname, u.faction);
    sess.players[pid] = player;
    sess.player_order = [pid];
    sess.active_player_id = pid;
    sess.status = "active";
    await writeSession(code, sess);
    setRoomCode(code);
    setPlayerId(pid);
    setScreen("main");
    sfx.confirm();
    return { ok: true, code };
  }, []);

  const joinGame = useCallback(async (code: string, u: User): Promise<RoomResult> => {
    const c = code.trim().toUpperCase();
    const s = await readSession(c);
    if (!s) return { ok: false, reason: "Кімнату не знайдено" };
    const taken = Object.values(s.players ?? {}).map((p) => p.faction);
    if (taken.includes(u.faction)) return { ok: false, reason: "Угрупування вже зайняте" };
    if (Object.keys(s.players ?? {}).length >= 4) return { ok: false, reason: "Кімната заповнена (4/4)" };
    const pid = generatePlayerId();
    const player = makePlayer(u.nickname, u.faction);
    await txSession(c, (cur) => {
      if (!cur) return undefined;
      const t = Object.values(cur.players ?? {}).map((p) => p.faction);
      if (t.includes(u.faction)) return undefined;
      return {
        ...cur,
        players: { ...cur.players, [pid]: player },
        player_order: [...(cur.player_order ?? []), pid],
      };
    });
    setRoomCode(c);
    setPlayerId(pid);
    setScreen("main");
    sfx.confirm();
    return { ok: true, code: c };
  }, []);

  const value: KpkState = useMemo(() => ({
    screen, prevScreen, user,
    totalScore, level1, level2, level3, currency, currencyEarnedThisTurn,
    round, turn, sessionSeconds, turnSeconds, turnRunning,
    ap, replacements,
    slots, completedIds, missionsByLevel, allMissions, getMission,
    upgrades: upgradesList, upgradePoints, canPurchase, purchaseUpgrade,
    news, history,
    login: (u) => { createGame(u); },
    createGame, joinGame, roomCode, playerId, isHost, players, takenFactions,
    logout: () => { setRoomCode(null); setPlayerId(null); setScreen("login"); sfx.back(); },
    go: (s) => { setPrev(screen); setScreen(s); },
    setAP: (k, v) => {
      if (!roomCode || !playerId) return;
      const map: Record<string, string> = { active: "active", attack: "attack", build: "build" };
      const field = map[k as string]; if (!field) return;
      txSession(roomCode, (cur) => {
        if (!cur) return undefined;
        const p = cur.players?.[playerId]; if (!p) return undefined;
        return { ...cur, players: { ...cur.players, [playerId]: {
          ...p, action_points: { ...p.action_points, [field]: Math.max(0, v) },
        }}};
      });
    },
    toggleTurn: () => {
      if (!roomCode) return;
      warnRef.current = false;
      txSession(roomCode, (cur) => cur ? ({ ...cur, turn_running: !cur.turn_running }) : undefined);
    },
    nextPlayer,
    updateSlotProgress,
    completeSlot,
    replaceSlot,
  }), [
    screen, prevScreen, user, totalScore, level1, level2, level3, currency, currencyEarnedThisTurn,
    round, turn, sessionSeconds, turnSeconds, turnRunning, ap, replacements,
    slots, completedIds, missionsByLevel, allMissions, getMission,
    upgradesList, upgradePoints, canPurchase, purchaseUpgrade, news, history,
    roomCode, playerId, isHost, players, takenFactions, createGame, joinGame,
    nextPlayer, updateSlotProgress, completeSlot, replaceSlot,
  ]);

  return <KpkContext.Provider value={value}>{children}</KpkContext.Provider>;
}

export function useKpk() {
  const v = useContext(KpkContext);
  if (!v) throw new Error("useKpk must be used inside KpkProvider");
  return v;
}

export function fmtClock(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
export function fmtSession(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
