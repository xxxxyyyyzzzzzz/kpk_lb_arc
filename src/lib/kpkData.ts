// КПК — повний набір даних та формул з kpk_integration_spec.md
// БАЛАНС НЕ ЗМІНЮВАТИ.

export const FACTIONS: Record<string, string> = {
  Скаєри: "#66ADFF",
  Авантюристи: "#A0A0A0",
  Військові: "#FF8282",
  Цикади: "#A9FFAF",
  Глодекс: "#F9FF9E",
  Розсвіт: "#7EF2FF",
};

export const MISSION_CLASSES = ["Атака", "Захист", "Лут", "Економіка"] as const;
export type MissionClass = (typeof MISSION_CLASSES)[number];

export const MISSION_CLASS_COLOR: Record<MissionClass, string> = {
  Атака: "var(--mission-attack)",
  Захист: "var(--mission-defense)",
  Лут: "var(--mission-loot)",
  Економіка: "var(--mission-economy)",
};

export const DEFAULT_ACTION_POINTS = { active: 7, attack: 5, build: 4 } as const;
export const TURN_DURATION_SECONDS = 420;
export const TOTAL_NEWS_ROUNDS = 4;
export const TURNS_PER_NEWS_ROUND = 4;
export const CURRENCY_COEFFICIENT = 0.33;
export const TIER_LIMITS: Record<1 | 2 | 3, number> = { 1: 4, 2: 3, 3: 2 };

export type Screen =
  | "login" | "main" | "missions" | "score" | "news" | "upgrades" | "timer";

// ───────── Формули (3.2) ─────────
const round1 = (n: number) => Math.round(n * 10) / 10;

export function calculateMissionLevel(points: number): 0 | 1 | 2 | 3 {
  if (points >= 1 && points <= 27) return 1;
  if (points >= 28 && points <= 60) return 2;
  if (points >= 61 && points <= 150) return 3;
  return 0;
}
function mapRange(v: number, a: number, b: number, x: number, y: number) {
  if (b === a) return x;
  return ((v - a) * (y - x)) / (b - a) + x;
}
export function calculateLevelRewardPoints(points: number, level: number): number {
  if (level === 1) return round1(mapRange(points, 1, 27, 0.3, 0.7));
  if (level === 2) return round1(mapRange(points, 28, 60, 0.6, 0.9));
  if (level === 3) return round1(mapRange(points, 61, 150, 1.0, 1.5));
  return 0;
}
export function calculateCurrencyReward(points: number): number {
  return Math.ceil(points * CURRENCY_COEFFICIENT);
}

// ───────── Mission Recipes (3.1) ─────────
type Recipe = {
  action: string;
  action_coeff: number;
  cls: MissionClass;
  objects: { object: string; object_coeff: number; quantity: string }[];
};

export const MISSION_RECIPES: Recipe[] = [
  { action: "Побудувати", action_coeff: 2, cls: "Захист", objects: [
    { object: "Окоп", object_coeff: 2, quantity: "1-4" },
    { object: "Барикаду", object_coeff: 3, quantity: "1" },
    { object: "Мега барикаду", object_coeff: 4, quantity: "1-2" },
    { object: "Колючий дріт", object_coeff: 3, quantity: "1-2" },
    { object: "Вежу", object_coeff: 4, quantity: "1-2" },
    { object: "Турель", object_coeff: 5, quantity: "1-2" },
  ]},
  { action: "Знищити на підконтрольному секторі", action_coeff: 3, cls: "Захист", objects: [
    { object: "ворога", object_coeff: 5, quantity: "1-5" },
    { object: "мутантів", object_coeff: 3, quantity: "1-5" },
  ]},
  { action: "Придбати", action_coeff: 2, cls: "Захист", objects: [{ object: "броню", object_coeff: 3, quantity: "1-4" }]},
  { action: "Захопити", action_coeff: 2, cls: "Захист", objects: [{ object: "сектори", object_coeff: 1.5, quantity: "3-6" }]},
  { action: "Відремонтувати", action_coeff: 3, cls: "Захист", objects: [
    { object: "броню персонажа", object_coeff: 3, quantity: "1-4" },
    { object: "броню", object_coeff: 3, quantity: "1-4" },
  ]},
  { action: "Полікувати", action_coeff: 3, cls: "Захист", objects: [{ object: "персонажа", object_coeff: 4, quantity: "1-3" }]},
  { action: "Нанести шкоду з турелі", action_coeff: 2.5, cls: "Захист", objects: [
    { object: "ворогу", object_coeff: 5, quantity: "1-5" },
    { object: "мутантам", object_coeff: 3, quantity: "1-5" },
  ]},

  { action: "Вбити", action_coeff: 3, cls: "Атака", objects: [
    { object: "NPC", object_coeff: 4, quantity: "1-4" },
    { object: "Ігрових персонажів", object_coeff: 5, quantity: "1-5" },
  ]},
  { action: "Знищити", action_coeff: 3, cls: "Атака", objects: [
    { object: "Будівлі", object_coeff: 6, quantity: "1-4" },
    { object: "Транспорт", object_coeff: 6, quantity: "1-3" },
    { object: "Турель", object_coeff: 7, quantity: "1-2" },
    { object: "Техніку", object_coeff: 5, quantity: "1-4" },
    { object: "Захисні споруди", object_coeff: 4, quantity: "1-4" },
  ]},
  { action: "Побудувати", action_coeff: 2, cls: "Атака", objects: [{ object: "Радіовежу", object_coeff: 6, quantity: "1" }]},
  { action: "Застосувати", action_coeff: 1.5, cls: "Атака", objects: [
    { object: "Артилерію", object_coeff: 7, quantity: "1-3" },
    { object: "Гранати", object_coeff: 5, quantity: "1-4" },
  ]},
  { action: "Стати ворожим до", action_coeff: 3, cls: "Атака", objects: [{ object: "NPC", object_coeff: 4, quantity: "1-4" }]},
  { action: "Нанести шкоду з", action_coeff: 2, cls: "Атака", objects: [
    { object: "Артилерії", object_coeff: 7, quantity: "1-2" },
    { object: "Гранати", object_coeff: 5, quantity: "1-4" },
    { object: "Транспорту", object_coeff: 6, quantity: "1-3" },
  ]},
  { action: "Перехопити", action_coeff: 5, cls: "Атака", objects: [{ object: "Точку", object_coeff: 15, quantity: "1" }]},

  { action: "Купити", action_coeff: 2, cls: "Економіка", objects: [
    { object: "Предмет магазину", object_coeff: 2, quantity: "1-9" },
    { object: "Найманців", object_coeff: 4, quantity: "1-3" },
    { object: "Транпорт з магазину", object_coeff: 4, quantity: "1-3" },
  ]},
  { action: "Налагодити стосунки з", action_coeff: 4, cls: "Економіка", objects: [{ object: "NPC", object_coeff: 8, quantity: "1-2" }]},
  { action: "Побудувати", action_coeff: 2, cls: "Економіка", objects: [
    { object: "Ринок", object_coeff: 3, quantity: "1" },
    { object: "Покращення точки", object_coeff: 3, quantity: "1-3" },
  ]},
  { action: "Накопити", action_coeff: 1, cls: "Економіка", objects: [
    { object: "Валюту", object_coeff: 0.5, quantity: "10,15,20,30" },
    { object: "Залізо", object_coeff: 2, quantity: "4,6,8,10,12" },
  ]},
  { action: "Подружитись", action_coeff: 4, cls: "Економіка", objects: [{ object: "NPC", object_coeff: 8, quantity: "1-2" }]},
  { action: "Торгувати з", action_coeff: 2, cls: "Економіка", objects: [
    { object: "Гравцем", object_coeff: 5, quantity: "1-2" },
    { object: "NPC", object_coeff: 8, quantity: "1-2" },
  ]},
  { action: "Нанести шкоду", action_coeff: 3, cls: "Економіка", objects: [
    { object: "Найманцями", object_coeff: 4, quantity: "1-3" },
    { object: "Транспортом", object_coeff: 6, quantity: "1-3" },
  ]},
  { action: "Витратити", action_coeff: 1, cls: "Економіка", objects: [
    { object: "Валюту", object_coeff: 0.5, quantity: "10,15,20,30" },
    { object: "Залізо", object_coeff: 2, quantity: "4,6,8,10,12" },
  ]},

  { action: "Здобути", action_coeff: 2, cls: "Лут", objects: [
    { object: "Артефакт", object_coeff: 12, quantity: "1-3" },
    { object: "Шматки мутантів", object_coeff: 2, quantity: "1-8" },
    { object: "мисливський ніж", object_coeff: 3, quantity: "1-3" },
  ]},
  { action: "Вбити", action_coeff: 2, cls: "Лут", objects: [
    { object: "Мутантів 1 рів.", object_coeff: 2, quantity: "1-8" },
    { object: "Мутантів 2 рів.", object_coeff: 5, quantity: "1-5" },
    { object: "Мутантів 3 рів.", object_coeff: 7, quantity: "1-4" },
  ]},
  { action: "дійти до", action_coeff: 3, cls: "Лут", objects: [{ object: "центрального сектора", object_coeff: 5, quantity: "1" }]},
  { action: "Використати", action_coeff: 3, cls: "Лут", objects: [{ object: "мисливський ніж", object_coeff: 3, quantity: "1-3" }]},
  { action: "Обікрасти", action_coeff: 4, cls: "Лут", objects: [
    { object: "склад", object_coeff: 6, quantity: "1" },
    { object: "лут дроном", object_coeff: 1, quantity: "1-4" },
  ]},
  { action: "Побудувати", action_coeff: 1, cls: "Лут", objects: [{ object: "склад", object_coeff: 6, quantity: "1" }]},
  { action: "Обмінятись з", action_coeff: 2, cls: "Лут", objects: [{ object: "NPC", object_coeff: 8, quantity: "1-3" }]},
  { action: "Дослідити", action_coeff: 4, cls: "Лут", objects: [
    { object: "Аномалії 1 рів.", object_coeff: 5, quantity: "1-2" },
    { object: "Аномалії 2 рів.", object_coeff: 5, quantity: "1-2" },
    { object: "Аномалії 3 рів.", object_coeff: 5, quantity: "1-2" },
  ]},
];

export type Mission = {
  id: number;
  name: string;
  description: string;
  cls: MissionClass;
  level: 1 | 2 | 3;
  target: number;
  mainReward: number;
  levelReward: number;
  currencyReward: number;
};

function expandQuantity(q: string): number[] {
  if (q.includes(",")) return q.split(",").map((s) => parseInt(s.trim(), 10));
  if (q.includes("-")) {
    const [a, b] = q.split("-").map((s) => parseInt(s.trim(), 10));
    const r: number[] = [];
    for (let i = a; i <= b; i++) r.push(i);
    return r;
  }
  return [parseInt(q, 10)];
}

let _missionsCache: Mission[] | null = null;
export function generateAllMissions(): Mission[] {
  if (_missionsCache) return _missionsCache;
  const out: Mission[] = [];
  let id = 1;
  for (const r of MISSION_RECIPES) {
    for (const o of r.objects) {
      for (const q of expandQuantity(o.quantity)) {
        const points = Math.floor(r.action_coeff * o.object_coeff * q);
        if (points <= 0) continue;
        const level = calculateMissionLevel(points);
        if (level === 0) continue;
        out.push({
          id: id++,
          name: `${r.action} ${o.object}`,
          description: `Потрібно: ${r.action} ${q} од. '${o.object}'`,
          cls: r.cls,
          level: level as 1 | 2 | 3,
          target: q,
          mainReward: points,
          levelReward: calculateLevelRewardPoints(points, level),
          currencyReward: calculateCurrencyReward(points),
        });
      }
    }
  }
  _missionsCache = out;
  return out;
}

// ───────── UPGRADES (4) ─────────
export const UPGRADE_CATEGORIES = ["Захист", "Атака", "Лут", "Економіка", "Командування"] as const;
export type UpgradeCategory = (typeof UPGRADE_CATEGORIES)[number];

export type UpgradeDef = {
  id: string;
  name: string;
  category: UpgradeCategory;
  tier: 1 | 2 | 3;
  cost: number;
};

export const UPGRADES: Record<string, UpgradeDef> = {
  zakhyst_1_1: { id: "zakhyst_1_1", name: "-1 крок, -1 дальність атаки на підконтрольних секторах", category: "Захист", tier: 1, cost: 1 },
  zakhyst_1_2: { id: "zakhyst_1_2", name: "+1 шкода на підконтрольних секторах всім типам атак", category: "Захист", tier: 1, cost: 1 },
  zakhyst_2_1: { id: "zakhyst_2_1", name: "Будівництво турелей на підконтрольних секторах", category: "Захист", tier: 2, cost: 1 },
  zakhyst_2_2: { id: "zakhyst_2_2", name: "+2 броні всьому (техніка лише угрупування)", category: "Захист", tier: 2, cost: 1 },
  zakhyst_3_1: { id: "zakhyst_3_1", name: "Захист від 'кровинок'", category: "Захист", tier: 3, cost: 1 },
  zakhyst_3_2: { id: "zakhyst_3_2", name: "Овервотч всім стрільцям", category: "Захист", tier: 3, cost: 1 },

  ataka_1_1: { id: "ataka_1_1", name: "+2 шкоди тільки для персонажів", category: "Атака", tier: 1, cost: 1 },
  ataka_1_2: { id: "ataka_1_2", name: "+1 дальність тільки для персонажів", category: "Атака", tier: 1, cost: 1 },
  ataka_2_1: { id: "ataka_2_1", name: "+2 ліміт техніки", category: "Атака", tier: 2, cost: 1 },
  ataka_2_2: { id: "ataka_2_2", name: "'Кровинка' всім", category: "Атака", tier: 2, cost: 1 },
  ataka_3_1: { id: "ataka_3_1", name: "Додаткова атака для персонажів (1 раз за раунд)", category: "Атака", tier: 3, cost: 1 },
  ataka_3_2: { id: "ataka_3_2", name: "Бронелом для стрільців", category: "Атака", tier: 3, cost: 1 },

  lut_1_1: { id: "lut_1_1", name: "+3 шкоди по мутантах", category: "Лут", tier: 1, cost: 1 },
  lut_1_2: { id: "lut_1_2", name: "На підконтрольних секторах +1 крок", category: "Лут", tier: 1, cost: 1 },
  lut_2_1: { id: "lut_2_1", name: "Збільшений крок та карман", category: "Лут", tier: 2, cost: 1 },
  lut_2_2: { id: "lut_2_2", name: "Маскування 3", category: "Лут", tier: 2, cost: 1 },
  lut_3_1: { id: "lut_3_1", name: "Лут не згорає та ТП на склад", category: "Лут", tier: 3, cost: 1 },
  lut_3_2: { id: "lut_3_2", name: "+1 лут з усього", category: "Лут", tier: 3, cost: 1 },

  ekonomika_1_1: { id: "ekonomika_1_1", name: "Нескінченна конвертація заліза", category: "Економіка", tier: 1, cost: 1 },
  ekonomika_1_2: { id: "ekonomika_1_2", name: "Збільшені ліміти: 40 валюти, 15 металу", category: "Економіка", tier: 1, cost: 1 },
  ekonomika_2_1: { id: "ekonomika_2_1", name: "+1 монета за підконтрольний сектор", category: "Економіка", tier: 2, cost: 1 },
  ekonomika_2_2: { id: "ekonomika_2_2", name: "Оплата 3 монети за 1 рівень Мутанта", category: "Економіка", tier: 2, cost: 1 },
  ekonomika_3_1: { id: "ekonomika_3_1", name: "Конвертація грошей в бали 1:1", category: "Економіка", tier: 3, cost: 1 },
  ekonomika_3_2: { id: "ekonomika_3_2", name: "Покупка поінтів на місії", category: "Економіка", tier: 3, cost: 1 },

  komanduvannya_1_1: { id: "komanduvannya_1_1", name: "2 рероли колоди (заміни місій)", category: "Командування", tier: 1, cost: 0 },
  komanduvannya_1_2: { id: "komanduvannya_1_2", name: "Без оплати найманців", category: "Командування", tier: 1, cost: 0 },
  komanduvannya_2_1: { id: "komanduvannya_2_1", name: "Додаткова атакуюча дія", category: "Командування", tier: 2, cost: 0 },
  komanduvannya_2_2: { id: "komanduvannya_2_2", name: "Додатковий командний поінт", category: "Командування", tier: 2, cost: 0 },
  komanduvannya_2_3: { id: "komanduvannya_2_3", name: "Додатковий бал дій", category: "Командування", tier: 3, cost: 0 },
  komanduvannya_3_1: { id: "komanduvannya_3_1", name: "Артилерійський обстріл за раунд", category: "Командування", tier: 3, cost: 0 },
  komanduvannya_3_2: { id: "komanduvannya_3_2", name: "3 атаки (всім окрім 1-го та 2-го ходу)", category: "Командування", tier: 3, cost: 0 },
};

// ───────── NEWS (5) ─────────
type NewsRule = { quantity?: string; zone?: string; chance: number };
export const NEWS_RULES: Record<1 | 2 | 3 | 4, Record<string, NewsRule>> = {
  1: {
    "Мутанти 1": { quantity: "8-16", zone: "5x5", chance: 100 },
    "Мутанти 2": { quantity: "4-8", zone: "3x3", chance: 100 },
    "Мутанти 3": { quantity: "1-2", zone: "1x1", chance: 66 },
    "Нанокс": { quantity: "2-4", zone: "any", chance: 25 },
    "Воля": { quantity: "3-5", zone: "any", chance: 50 },
    "Обовʼязок": { quantity: "3-5", zone: "any", chance: 50 },
    "Псі-випромінювач": { quantity: "1", zone: "3x3", chance: 33 },
    "Аномалії": { quantity: "1-3", zone: "any", chance: 100 },
    "Викид": { chance: 50 },
    "Транспорт нанокс": { quantity: "0", zone: "any", chance: 0 },
  },
  2: {
    "Мутанти 1": { quantity: "4-12", zone: "5x5", chance: 100 },
    "Мутанти 2": { quantity: "8-12", zone: "5x5", chance: 100 },
    "Мутанти 3": { quantity: "1-4", zone: "3x3", chance: 100 },
    "Нанокс": { quantity: "2-8", zone: "any", chance: 50 },
    "Воля": { quantity: "3-5", zone: "any", chance: 75 },
    "Обовʼязок": { quantity: "3-5", zone: "any", chance: 75 },
    "Псі-випромінювач": { quantity: "1", zone: "3x3", chance: 50 },
    "Аномалії": { quantity: "2-4", zone: "any", chance: 100 },
    "Викид": { chance: 50 },
    "Транспорт нанокс": { quantity: "1-3", zone: "any", chance: 33 },
  },
  3: {
    "Мутанти 1": { quantity: "4-12", zone: "5x5", chance: 100 },
    "Мутанти 2": { quantity: "8-12", zone: "5x5", chance: 100 },
    "Мутанти 3": { quantity: "1-4", zone: "3x3", chance: 100 },
    "Нанокс": { quantity: "2-8", zone: "any", chance: 50 },
    "Воля": { quantity: "3-5", zone: "any", chance: 75 },
    "Обовʼязок": { quantity: "3-5", zone: "any", chance: 75 },
    "Псі-випромінювач": { quantity: "2", zone: "3x3", chance: 50 },
    "Аномалії": { quantity: "2-4", zone: "any", chance: 100 },
    "Викид": { chance: 50 },
    "Транспорт нанокс": { quantity: "1-3", zone: "any", chance: 33 },
  },
  4: {
    "Мутанти 1": { quantity: "0", zone: "5x5", chance: 0 },
    "Мутанти 2": { quantity: "8-16", zone: "5x5", chance: 100 },
    "Мутанти 3": { quantity: "4-8", zone: "3x3", chance: 100 },
    "Нанокс": { quantity: "4-6", zone: "any", chance: 100 },
    "Воля": { quantity: "2-5", zone: "any", chance: 40 },
    "Обовʼязок": { quantity: "2-4", zone: "any", chance: 40 },
    "Псі-випромінювач": { quantity: "1", zone: "3x3", chance: 50 },
    "Аномалії": { quantity: "3-6", zone: "any", chance: 100 },
    "Викид": { chance: 50 },
    "Транспорт нанокс": { quantity: "1-3", zone: "any", chance: 66 },
  },
};

export type NewsEntry = { entity: string; count: number; zone?: string; note?: string };

function rollQty(q: string): number {
  if (q.includes(",")) {
    const arr = q.split(",").map((s) => parseInt(s.trim(), 10));
    return arr[Math.floor(Math.random() * arr.length)];
  }
  if (q.includes("-")) {
    const [a, b] = q.split("-").map((s) => parseInt(s.trim(), 10));
    return a + Math.floor(Math.random() * (b - a + 1));
  }
  return parseInt(q, 10);
}

export function generateNews(round: 1 | 2 | 3 | 4): NewsEntry[] {
  const rules = NEWS_RULES[round];
  const out: NewsEntry[] = [];
  for (const [entity, rule] of Object.entries(rules)) {
    const hit = Math.random() * 100 < rule.chance;
    if (!hit) continue;
    if (entity === "Викид") { out.push({ entity, count: 0, note: "Стався" }); continue; }
    if (!rule.quantity) continue;
    const q = rollQty(rule.quantity);
    if (q <= 0) continue;
    out.push({ entity, count: q, zone: rule.zone });
  }
  return out;
}
