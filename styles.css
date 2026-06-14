// ─────────────────────────────────────────────────────────────────────────────
// Етап 1 · Схеми даних КПК-сесії
// Єдине джерело правди для типів сесії, гравця, місій та прокачок.
// Назви полів узгоджені з Lovable Cloud (Supabase Realtime) для майбутньої
// синхронізації. Зберігаємо також у JSON-сумісному вигляді — щоб ті ж самі
// структури можна було тримати в /data/*.json і в БД.
// ─────────────────────────────────────────────────────────────────────────────

import type { MissionClass, UpgradeCategory } from "./kpkData";

// ── Сесія ───────────────────────────────────────────────────────────────────
export type SessionStatus = "waiting" | "active" | "finished";

export type Session = {
  id: string;                    // uuid
  code: string;                  // 4-значний код кімнати (напр. "A7F2")
  status: SessionStatus;
  hostId: string;                // playerId хоста
  players: Record<string, Player>; // до 4 (або до 6 за фракціями)
  round: number;                 // поточний раунд
  turn: number;                  // номер ходу в раунді
  missionStack: number[];        // id невиданих місій
  activeMissionsByPlayer: Record<string, number[]>; // playerId → [missionId]
  newsIndex: number;             // індекс поточної новини
  createdAt: number;             // epoch ms
  updatedAt: number;
};

// ── Гравець ─────────────────────────────────────────────────────────────────
export type PlayerConnection = "online" | "offline" | "away";

export type Player = {
  id: string;
  nickname: string;
  faction: string;               // ключ із FACTIONS
  color: string;                 // hex, дублюється з фракції для зручності
  score: number;                 // загальні бали (ЄБали)
  level1: number;
  level2: number;
  level3: number;
  currency: number;
  upgradePoints: number;
  upgrades: string[];            // id придбаних прокачок
  completedMissions: number[];   // id виконаних
  connection: PlayerConnection;
  joinedAt: number;
};

// ── Місії (контент) ─────────────────────────────────────────────────────────
export type MissionDef = {
  id: number;
  name: string;
  description?: string;
  cls: MissionClass;
  tier: 1 | 2 | 3;
  target: number;                // скільки разів виконати
  estimatedSeconds?: number;     // орієнтовний час
  reward: { points: number; currency?: number };
};

// Стан місії в межах сесії гравця
export type MissionState = {
  missionId: number;
  playerId: string;
  progress: number;
  active: boolean;
  completedAt?: number;
};

// ── Прокачки (контент) ──────────────────────────────────────────────────────
export type UpgradeDef = {
  id: string;
  name: string;
  description?: string;
  category: UpgradeCategory;
  tier: 1 | 2 | 3;
  cost: number;                  // очки прокачки
  requires?: string[];           // id попередніх прокачок
  effect?: string;               // машинно-читаний код ефекту (опц.)
};

// ── Журнал подій (для toast/історії) ────────────────────────────────────────
export type EventKind =
  | "mission_assigned"
  | "mission_completed"
  | "upgrade_purchased"
  | "score_adjusted"
  | "player_joined"
  | "player_left"
  | "turn_advanced";

export type SessionEvent = {
  id: string;
  kind: EventKind;
  playerId?: string;
  payload?: Record<string, unknown>;
  at: number;
};
