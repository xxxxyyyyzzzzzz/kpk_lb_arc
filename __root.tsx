// One-time mission generator. Expands mission_recipes.json into the canonical
// generated_missions.json. Run via `bun scripts/generate-missions.ts`.
import {
  calculateMissionLevel,
  calculateLevelRewardPoints,
  calculateCurrencyReward,
  calculateMissionPoints,
} from "./formulas";
import type { MissionClass } from "./constants";

export type Recipe = {
  action: string;
  action_coeff: number;
  class: MissionClass;
  objects: { object: string; object_coeff: number; quantity: string }[];
};

export type GeneratedMission = {
  id: number;
  name: string;
  description: string;
  m_class: MissionClass;
  level: 1 | 2 | 3;
  target_progress: number;
  main_reward: number;
  level_reward_points: number;
  currency_reward: number;
};

function expandQuantity(q: string): number[] {
  if (q.includes(",")) return q.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
  if (q.includes("-")) {
    const [a, b] = q.split("-").map((s) => parseInt(s.trim(), 10));
    const out: number[] = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  }
  const n = parseInt(q, 10);
  return Number.isNaN(n) ? [] : [n];
}

export function generateMissions(recipes: Recipe[]): GeneratedMission[] {
  const out: GeneratedMission[] = [];
  let id = 1;
  for (const r of recipes) {
    for (const obj of r.objects) {
      for (const qty of expandQuantity(obj.quantity)) {
        const points = calculateMissionPoints(r.action_coeff, obj.object_coeff, qty);
        if (points <= 0) continue;
        const level = calculateMissionLevel(points);
        if (level === 0) continue;
        out.push({
          id: id++,
          name: `${r.action} ${obj.object}`,
          description: `Потрібно: ${r.action} ${qty} од. '${obj.object}'`,
          m_class: r.class,
          level,
          target_progress: qty,
          main_reward: points,
          level_reward_points: calculateLevelRewardPoints(points, level),
          currency_reward: calculateCurrencyReward(points),
        });
      }
    }
  }
  return out;
}
