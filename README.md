// Mission scoring formulas — ported 1:1 from missions_database.py / app.py.
// Do not tweak: these define game balance.
import { CURRENCY_COEFFICIENT } from "./constants";

const round1 = (n: number) => Math.round(n * 10) / 10;

export function calculateMissionLevel(points: number): 0 | 1 | 2 | 3 {
  if (points >= 1 && points <= 27) return 1;
  if (points >= 28 && points <= 60) return 2;
  if (points >= 61 && points <= 150) return 3;
  return 0;
}

export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (inMax === inMin) return outMin;
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function calculateLevelRewardPoints(points: number, level: 1 | 2 | 3 | 0): number {
  if (level === 1) return round1(mapRange(points, 1, 27, 0.3, 0.7));
  if (level === 2) return round1(mapRange(points, 28, 60, 0.6, 0.9));
  if (level === 3) return round1(mapRange(points, 61, 150, 1.0, 1.5));
  return 0;
}

export function calculateCurrencyReward(points: number): number {
  return Math.ceil(points * CURRENCY_COEFFICIENT);
}

export function calculateMissionPoints(actionCoeff: number, objectCoeff: number, quantity: number): number {
  return Math.floor(actionCoeff * objectCoeff * quantity);
}
