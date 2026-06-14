// Канонічна схема даних сесії згідно kpk_integration_spec.md (Section 1).
// Зберігається під /sessions/{roomCode} у Firebase Realtime DB.
import {
  DEFAULT_ACTION_POINTS,
  TURN_DURATION_SECONDS,
  generateAllMissions,
  type Mission,
  type NewsEntry,
} from "./kpkData";

export type PlayerState = {
  nickname: string;
  faction: string;
  joined_at: number;
  // Бали / валюта
  score: number;
  level1_score: number;
  level2_score: number;
  level3_score: number;
  currency: number;
  currency_earned_this_turn: number;
  // Дії
  action_points: {
    active: number; active_max: number;
    attack: number; attack_max: number;
    build: number; build_max: number;
  };
  replacements: { "1": number; "2": number; "3": number };
  // Прокачки
  upgrades: Record<string, true>;
  // Слоти місій (індекс 0..5; рівень = (idx % 3) + 1)
  slots: Array<{ slot_index: number; mission_id: number | null; current_progress: number }>;
  completed_ids: number[];
};

export type EventEntry = {
  ts: number;
  player_id: string;
  nickname: string;
  type: "mission_complete" | "upgrade" | "turn_end" | "news_round";
  payload: Record<string, unknown>;
};

export type SessionState = {
  code: string;
  status: "waiting" | "active" | "finished";
  host_id: string;
  created_at: number;
  round: 1 | 2 | 3 | 4;
  turn: number; // 1..N (індекс активного гравця у поточному ході)
  turn_seconds: number;
  turn_running: boolean;
  active_player_id: string | null;
  player_order: string[];
  players: Record<string, PlayerState>;
  news: NewsEntry[];
  events: Record<string, EventEntry>;
};

export function initialPlayerSlots(): PlayerState["slots"] {
  const missions = generateAllMissions();
  const byLevel: Record<1 | 2 | 3, Mission[]> = { 1: [], 2: [], 3: [] };
  for (const m of missions) byLevel[m.level].push(m);
  const used = new Set<number>();
  return Array.from({ length: 6 }).map((_, i) => {
    const lvl = ((i % 3) + 1) as 1 | 2 | 3;
    const pool = byLevel[lvl].filter((m) => !used.has(m.id));
    const m = pool[Math.floor(Math.random() * pool.length)];
    if (m) used.add(m.id);
    return { slot_index: i, mission_id: m?.id ?? null, current_progress: 0 };
  });
}

export function makePlayer(nickname: string, faction: string): PlayerState {
  const ap = DEFAULT_ACTION_POINTS;
  return {
    nickname,
    faction,
    joined_at: Date.now(),
    score: 0,
    level1_score: 0,
    level2_score: 0,
    level3_score: 0,
    currency: 0,
    currency_earned_this_turn: 0,
    action_points: {
      active: ap.active, active_max: ap.active,
      attack: ap.attack, attack_max: ap.attack,
      build: ap.build, build_max: ap.build,
    },
    replacements: { "1": 1, "2": 1, "3": 1 },
    upgrades: {},
    slots: initialPlayerSlots(),
    completed_ids: [],
  };
}

export function makeSession(code: string, hostId: string): SessionState {
  return {
    code,
    status: "waiting",
    host_id: hostId,
    created_at: Date.now(),
    round: 1,
    turn: 1,
    turn_seconds: TURN_DURATION_SECONDS,
    turn_running: false,
    active_player_id: null,
    player_order: [],
    players: {},
    news: [],
    events: {},
  };
}