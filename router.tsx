// Game constants — must match KPK_Server (app.py) 1:1. Do not tune.
export const CURRENCY_COEFFICIENT = 0.33;
export const TURN_DURATION_SECONDS = 420;
export const TOTAL_NEWS_ROUNDS = 4;
export const TURNS_PER_NEWS_ROUND = 4;

export const DEFAULT_ACTION_POINTS = { active: 7, attack: 5, build: 4 } as const;

export const UPGRADE_TIER_LIMITS: Record<1 | 2 | 3, number> = { 1: 4, 2: 3, 3: 2 };

export const MISSION_SLOT_COUNT = 6;
// mission_level = (slot_index % 3) + 1
export const slotLevel = (slotIndex: number): 1 | 2 | 3 =>
  ((slotIndex % 3) + 1) as 1 | 2 | 3;

export const MISSION_CLASSES = ["Атака", "Захист", "Лут", "Економіка"] as const;
export type MissionClass = (typeof MISSION_CLASSES)[number];

export const UPGRADE_CATEGORIES = ["Захист", "Атака", "Лут", "Економіка", "Командування"] as const;
export type UpgradeCategory = (typeof UPGRADE_CATEGORIES)[number];
