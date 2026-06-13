# Специфікація переносу логіки та даних КПК у новий веб-додаток

Цей файл — технічний бриф для ШІ-асистента (Cursor/Bolt/etc), що описує, які дані, формули та правила гри з проєкту `KPK_Server` мають бути перенесені у новий застосунок, і як адаптувати їх під архітектуру Firebase + React (4 гравці, синхронізація в реальному часі).

**Не трогати / не змінювати ці дані — вони визначають баланс гри:**
- Таблиця коефіцієнтів генерації місій (`CSV_DATA` в `missions_database.py`)
- Формули рівнів місій, нагород і валюти (`calculate_mission_level`, `calculate_level_reward_points`, `calculate_currency_reward`, `CURRENCY_COEFFICIENT`)
- Дерево прокачок `UPGRADES` (назви, категорії, тіри, вартості, ефекти)
- Правила генерації новин `NEWS_RULES` (координати, зони, шанси, кількості сутностей)
- Угрупування `FACTIONS` та їх кольори

Все інше (структура БД на SQLite, флоу ходів/таймерів, сесії на Flask) можна і варто переробити під новий стек — нижче подано рекомендовану адаптацію.

---

## 1. Дані гравця (`users` → `/sessions/{code}/players/{playerId}`)

Перенести зі збереженням значень за замовчуванням:

```json
{
  "nickname": "string",
  "faction": "string (одне з FACTIONS)",
  "score": 0,
  "level1_score": 0.0,
  "level2_score": 0.0,
  "level3_score": 0.0,
  "currency": 0,
  "currency_earned_this_turn": 0,
  "action_points": {
    "active": 7,
    "attack": 5,
    "build": 4,
    "spent_active": 0,
    "spent_attack": 0,
    "spent_build": 0
  },
  "mission_replacements_by_level": { "1": 1, "2": 1, "3": 1 },
  "class_progress": { "Атака": 1, "Захист": 1, "Лут": 1, "Економіка": 1 },
  "upgrades": [],
  "mission_slots": [
    { "slot_index": 0, "mission_id": null, "current_progress": 0 },
    { "slot_index": 1, "mission_id": null, "current_progress": 0 },
    { "slot_index": 2, "mission_id": null, "current_progress": 0 },
    { "slot_index": 3, "mission_id": null, "current_progress": 0 },
    { "slot_index": 4, "mission_id": null, "current_progress": 0 },
    { "slot_index": 5, "mission_id": null, "current_progress": 0 }
  ],
  "completed_mission_ids": []
}
```

**DEFAULT_ACTION_POINTS** (константи з app.py, зберегти):
```json
{ "active": 7, "attack": 5, "build": 4 }
```

**Прив'язка слотів місій до рівнів**: `mission_level = (slot_index % 3) + 1`
Тобто слоти 0,3 → рівень 1; слоти 1,4 → рівень 2; слоти 2,5 → рівень 3. Ця логіка має бути збережена.

---

## 2. Угрупування (FACTIONS) — перенести без змін

```json
{
  "Скаєри": "#66ADFF",
  "Авантюристи": "#A0A0A0",
  "Військові": "#FF8282",
  "Цикади": "#A9FFAF",
  "Глодекс": "#F9FF9E",
  "Розсвіт": "#7EF2FF"
}
```

Зберегти у `/data/factions.json`. Логіка вибору при вході в лобі: гравець обирає вільне угрупування або "випадкове" — перевіряти зайнятість у `/sessions/{code}/players`.

---

## 3. Генерація місій — формули та таблиця коефіцієнтів (КРИТИЧНО, не змінювати)

### 3.1 Вхідна таблиця (з `missions_database.py`, `CSV_DATA`)

Це повна таблиця дій/об'єктів/коефіцієнтів, яку слід перенести **як є** у `/data/mission_recipes.json` (формат: масив об'єктів замість CSV для зручності парсингу в JS):

```json
[
  {"action": "Побудувати", "action_coeff": 2, "permissions": ["Окоп","Барикаду","Мега барикаду","Колючий дріт","Вежу","Турель"], "class": "Захист",
   "objects": [
     {"object": "Окоп", "object_coeff": 2, "quantity": "1-4"},
     {"object": "Барикаду", "object_coeff": 3, "quantity": "1"},
     {"object": "Мега барикаду", "object_coeff": 4, "quantity": "1-2"},
     {"object": "Колючий дріт", "object_coeff": 3, "quantity": "1-2"},
     {"object": "Вежу", "object_coeff": 4, "quantity": "1-2"},
     {"object": "Турель", "object_coeff": 5, "quantity": "1-2"}
   ]},
  {"action": "Знищити на підконтрольному секторі", "action_coeff": 3, "permissions": ["ворога","мутантів"], "class": "Захист",
   "objects": [
     {"object": "ворога", "object_coeff": 5, "quantity": "1-5"},
     {"object": "мутантів", "object_coeff": 3, "quantity": "1-5"}
   ]},
  {"action": "Придбати", "action_coeff": 2, "permissions": ["броню"], "class": "Захист",
   "objects": [{"object": "броню", "object_coeff": 3, "quantity": "1-4"}]},
  {"action": "Захопити", "action_coeff": 2, "permissions": ["сектори"], "class": "Захист",
   "objects": [{"object": "сектори", "object_coeff": 1.5, "quantity": "3-6"}]},
  {"action": "Відремонтувати", "action_coeff": 3, "permissions": ["броню персонажа","броню"], "class": "Захист",
   "objects": [
     {"object": "броню персонажа", "object_coeff": 3, "quantity": "1-4"},
     {"object": "броню", "object_coeff": 3, "quantity": "1-4"}
   ]},
  {"action": "Полікувати", "action_coeff": 3, "permissions": ["персонажа"], "class": "Захист",
   "objects": [{"object": "персонажа", "object_coeff": 4, "quantity": "1-3"}]},
  {"action": "Нанести шкоду з турелі", "action_coeff": 2.5, "permissions": ["ворогу","мутантам"], "class": "Захист",
   "objects": [
     {"object": "ворогу", "object_coeff": 5, "quantity": "1-5"},
     {"object": "мутантам", "object_coeff": 3, "quantity": "1-5"}
   ]},

  {"action": "Вбити", "action_coeff": 3, "permissions": ["NPC","Ігрових персонажів"], "class": "Атака",
   "objects": [
     {"object": "NPC", "object_coeff": 4, "quantity": "1-4"},
     {"object": "Ігрових персонажів", "object_coeff": 5, "quantity": "1-5"}
   ]},
  {"action": "Знищити", "action_coeff": 3, "permissions": ["Будівлі","Транспорт","Турель","Техніку","Захисні споруди"], "class": "Атака",
   "objects": [
     {"object": "Будівлі", "object_coeff": 6, "quantity": "1-4"},
     {"object": "Транспорт", "object_coeff": 6, "quantity": "1-3"},
     {"object": "Турель", "object_coeff": 7, "quantity": "1-2"},
     {"object": "Техніку", "object_coeff": 5, "quantity": "1-4"},
     {"object": "Захисні споруди", "object_coeff": 4, "quantity": "1-4"}
   ]},
  {"action": "Побудувати", "action_coeff": 2, "permissions": ["Радіовежу"], "class": "Атака",
   "objects": [{"object": "Радіовежу", "object_coeff": 6, "quantity": "1"}]},
  {"action": "Застосувати", "action_coeff": 1.5, "permissions": ["Артилерію","Гранати"], "class": "Атака",
   "objects": [
     {"object": "Артилерію", "object_coeff": 7, "quantity": "1-3"},
     {"object": "Гранати", "object_coeff": 5, "quantity": "1-4"}
   ]},
  {"action": "Стати ворожим до", "action_coeff": 3, "permissions": ["NPC"], "class": "Атака",
   "objects": [{"object": "NPC", "object_coeff": 4, "quantity": "1-4"}]},
  {"action": "Нанести шкоду з", "action_coeff": 2, "permissions": ["Артилерії","Гранати","Транспорту"], "class": "Атака",
   "objects": [
     {"object": "Артилерії", "object_coeff": 7, "quantity": "1-2"},
     {"object": "Гранати", "object_coeff": 5, "quantity": "1-4"},
     {"object": "Транспорту", "object_coeff": 6, "quantity": "1-3"}
   ]},
  {"action": "Перехопити", "action_coeff": 5, "permissions": ["Точку"], "class": "Атака",
   "objects": [{"object": "Точку", "object_coeff": 15, "quantity": "1"}]},

  {"action": "Купити", "action_coeff": 2, "permissions": ["Предмет магазину","Найманців","Транпорт з магазину"], "class": "Економіка",
   "objects": [
     {"object": "Предмет магазину", "object_coeff": 2, "quantity": "1-9"},
     {"object": "Найманців", "object_coeff": 4, "quantity": "1-3"},
     {"object": "Транпорт з магазину", "object_coeff": 4, "quantity": "1-3"}
   ]},
  {"action": "Налагодити стосунки з", "action_coeff": 4, "permissions": ["NPC"], "class": "Економіка",
   "objects": [{"object": "NPC", "object_coeff": 8, "quantity": "1-2"}]},
  {"action": "Побудувати", "action_coeff": 2, "permissions": ["Ринок","Покращення точки"], "class": "Економіка",
   "objects": [
     {"object": "Ринок", "object_coeff": 3, "quantity": "1"},
     {"object": "Покращення точки", "object_coeff": 3, "quantity": "1-3"}
   ]},
  {"action": "Накопити", "action_coeff": 1, "permissions": ["Валюту","Залізо"], "class": "Економіка",
   "objects": [
     {"object": "Валюту", "object_coeff": 0.5, "quantity": "10,15,20,30"},
     {"object": "Залізо", "object_coeff": 2, "quantity": "4,6,8,10,12"}
   ]},
  {"action": "Подружитись", "action_coeff": 4, "permissions": ["NPC"], "class": "Економіка",
   "objects": [{"object": "NPC", "object_coeff": 8, "quantity": "1-2"}]},
  {"action": "Торгувати з", "action_coeff": 2, "permissions": ["Гравцем","NPC"], "class": "Економіка",
   "objects": [
     {"object": "Гравцем", "object_coeff": 5, "quantity": "1-2"},
     {"object": "NPC", "object_coeff": 8, "quantity": "1-2"}
   ]},
  {"action": "Нанести шкоду", "action_coeff": 3, "permissions": ["Найманцями","Транспортом"], "class": "Економіка",
   "objects": [
     {"object": "Найманцями", "object_coeff": 4, "quantity": "1-3"},
     {"object": "Транспортом", "object_coeff": 6, "quantity": "1-3"}
   ]},
  {"action": "Витратити", "action_coeff": 1, "permissions": ["Валюту","Залізо"], "class": "Економіка",
   "objects": [
     {"object": "Валюту", "object_coeff": 0.5, "quantity": "10,15,20,30"},
     {"object": "Залізо", "object_coeff": 2, "quantity": "4,6,8,10,12"}
   ]},

  {"action": "Здобути", "action_coeff": 2, "permissions": ["Артефакт","Шматки мутантів","мисливський ніж"], "class": "Лут",
   "objects": [
     {"object": "Артефакт", "object_coeff": 12, "quantity": "1-3"},
     {"object": "Шматки мутантів", "object_coeff": 2, "quantity": "1-8"},
     {"object": "мисливський ніж", "object_coeff": 3, "quantity": "1-3"}
   ]},
  {"action": "Вбити", "action_coeff": 2, "permissions": ["Мутантів 1 рів.","Мутантів 2 рів.","Мутантів 3 рів."], "class": "Лут",
   "objects": [
     {"object": "Мутантів 1 рів.", "object_coeff": 2, "quantity": "1-8"},
     {"object": "Мутантів 2 рів.", "object_coeff": 5, "quantity": "1-5"},
     {"object": "Мутантів 3 рів.", "object_coeff": 7, "quantity": "1-4"}
   ]},
  {"action": "дійти до", "action_coeff": 3, "permissions": ["центрального сектора"], "class": "Лут",
   "objects": [{"object": "центрального сектора", "object_coeff": 5, "quantity": "1"}]},
  {"action": "Використати", "action_coeff": 3, "permissions": ["мисливський ніж"], "class": "Лут",
   "objects": [{"object": "мисливський ніж", "object_coeff": 3, "quantity": "1-3"}]},
  {"action": "Обікрасти", "action_coeff": 4, "permissions": ["склад","лут дроном"], "class": "Лут",
   "objects": [
     {"object": "склад", "object_coeff": 6, "quantity": "1"},
     {"object": "лут дроном", "object_coeff": 1, "quantity": "1-4"}
   ]},
  {"action": "Побудувати", "action_coeff": 1, "permissions": ["склад"], "class": "Лут",
   "objects": [{"object": "склад", "object_coeff": 6, "quantity": "1"}]},
  {"action": "Обмінятись з", "action_coeff": 2, "permissions": ["NPC"], "class": "Лут",
   "objects": [{"object": "NPC", "object_coeff": 8, "quantity": "1-3"}]},
  {"action": "Дослідити", "action_coeff": 4, "permissions": ["Аномалії 1 рів.","Аномалії 2 рів.","Аномалії 3 рів."], "class": "Лут",
   "objects": [
     {"object": "Аномалії 1 рів.", "object_coeff": 5, "quantity": "1-2"},
     {"object": "Аномалії 2 рів.", "object_coeff": 5, "quantity": "1-2"},
     {"object": "Аномалії 3 рів.", "object_coeff": 5, "quantity": "1-2"}
   ]}
]
```

Примітка: значення `quantity` як рядок описує діапазон (`"1-4"`) або список через кому (`"10,15,20,30"`) — генератор має розгорнути кожне число у власну окрему місію.

### 3.2 Формули генерації (перенести як чисті JS-функції)

```js
const CURRENCY_COEFFICIENT = 0.33;

function calculateMissionLevel(points) {
  if (points >= 1 && points <= 27) return 1;
  if (points >= 28 && points <= 60) return 2;
  if (points >= 61 && points <= 150) return 3;
  return 0;
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  return ((value - inMin) * (outMax - outMin) / (inMax - inMin)) + outMin;
}

function calculateLevelRewardPoints(points, level) {
  if (level === 1) return round1(mapRange(points, 1, 27, 0.3, 0.7));
  if (level === 2) return round1(mapRange(points, 28, 60, 0.6, 0.9));
  if (level === 3) return round1(mapRange(points, 61, 150, 1.0, 1.5));
  return 0.0;
}

function calculateCurrencyReward(points) {
  return Math.ceil(points * CURRENCY_COEFFICIENT);
}

// points = action_coeff * object_coeff * quantity (округлити вниз до int)
```

### 3.3 Алгоритм генерації місій (one-time, генерується одноразово при сетапі гри і кешується)

Для кожного рядка таблиці: для кожного об'єкта в `objects`, для кожного значення `quantity` (розгорнути діапазон/список) → обчислити:
```
points = floor(action_coeff * object_coeff * quantity)
if points <= 0 → skip
level = calculateMissionLevel(points)
level_reward = calculateLevelRewardPoints(points, level)
currency_reward = calculateCurrencyReward(points)
name = `${action} ${object}`
description = `Потрібно: ${action} ${quantity} од. '${object}'`
```
Результат — масив об'єктів місій, що зберігається у `/data/generated_missions.json` (генерується скриптом один раз при розробці, потім просто завантажується в Firebase як статичні дані гри — не генерувати "на льоту" в кожній сесії, бо набір місій фіксований і це частина балансу).

Структура запису місії:
```json
{
  "id": 1,
  "name": "Побудувати Окоп",
  "description": "Потрібно: Побудувати 1 од. 'Окоп'",
  "m_class": "Захист",
  "level": 1,
  "target_progress": 1,
  "main_reward": 4,
  "level_reward_points": 0.36,
  "currency_reward": 2
}
```

**Адаптація для зручності**: замість окремої SQLite `missions.db`, зберегти весь масив згенерованих місій у Firebase під `/gameData/missions` (read-only, спільний для всіх сесій) або як статичний `missions.json`, що завантажується клієнтом при старті.

---

## 4. Дерево прокачок (UPGRADES) — перенести без змін

```json
{
  "zakhyst_1_1": {"name": "-1 крок, -1 дальність атаки на підконтрольних секторах", "category": "Захист", "tier": 1, "cost": 1},
  "zakhyst_1_2": {"name": "+1 шкода на підконтрольних секторах всім типам атак", "category": "Захист", "tier": 1, "cost": 1},
  "zakhyst_2_1": {"name": "Будівництво турелей на підконтрольних секторах", "category": "Захист", "tier": 2, "cost": 1},
  "zakhyst_2_2": {"name": "+2 броні всьому (техніка лише угрупування)", "category": "Захист", "tier": 2, "cost": 1},
  "zakhyst_3_1": {"name": "Захист від 'кровинок'", "category": "Захист", "tier": 3, "cost": 1},
  "zakhyst_3_2": {"name": "Овервотч всім стрільцям", "category": "Захист", "tier": 3, "cost": 1},

  "ataka_1_1": {"name": "+2 шкоди тільки для персонажів", "category": "Атака", "tier": 1, "cost": 1},
  "ataka_1_2": {"name": "+1 дальність тільки для персонажів", "category": "Атака", "tier": 1, "cost": 1},
  "ataka_2_1": {"name": "+2 ліміт техніки", "category": "Атака", "tier": 2, "cost": 1},
  "ataka_2_2": {"name": "'Кровинка' всім", "category": "Атака", "tier": 2, "cost": 1},
  "ataka_3_1": {"name": "Додаткова атака для персонажів (1 раз за раунд)", "category": "Атака", "tier": 3, "cost": 1},
  "ataka_3_2": {"name": "Бронелом для стрільців", "category": "Атака", "tier": 3, "cost": 1},

  "lut_1_1": {"name": "+3 шкоди по мутантах", "category": "Лут", "tier": 1, "cost": 1},
  "lut_1_2": {"name": "На підконтрольних секторах +1 крок", "category": "Лут", "tier": 1, "cost": 1},
  "lut_2_1": {"name": "Збільшений крок та карман", "category": "Лут", "tier": 2, "cost": 1},
  "lut_2_2": {"name": "Маскування 3", "category": "Лут", "tier": 2, "cost": 1},
  "lut_3_1": {"name": "Лут не згорає та одразу з підконтрольних секторів ТП на склад", "category": "Лут", "tier": 3, "cost": 1},
  "lut_3_2": {"name": "+1 лут з усього", "category": "Лут", "tier": 3, "cost": 1},

  "ekonomika_1_1": {"name": "Нескінченна конвертація заліза", "category": "Економіка", "tier": 1, "cost": 1},
  "ekonomika_1_2": {"name": "Збільшені ліміти: 40 валюти, 15 металу", "category": "Економіка", "tier": 1, "cost": 1},
  "ekonomika_2_1": {"name": "+1 монета за підконтрольний сектор", "category": "Економіка", "tier": 2, "cost": 1},
  "ekonomika_2_2": {"name": "Оплата 3 монети за 1 рівень Мутанта та за персонажа", "category": "Економіка", "tier": 2, "cost": 1},
  "ekonomika_3_1": {"name": "Конвертація грошей в бали 1:1", "category": "Економіка", "tier": 3, "cost": 1},
  "ekonomika_3_2": {"name": "Покупка поінтів на місії", "category": "Економіка", "tier": 3, "cost": 1},

  "komanduvannya_1_1": {"name": "2 рероли колоди (заміни місій)", "category": "Командування", "tier": 1, "cost": 0},
  "komanduvannya_1_2": {"name": "Без оплати найманців", "category": "Командування", "tier": 1, "cost": 0},
  "komanduvannya_2_1": {"name": "Додаткова атакуюча дія", "category": "Командування", "tier": 2, "cost": 0},
  "komanduvannya_2_2": {"name": "Додатковий командний поінт", "category": "Командування", "tier": 2, "cost": 0},
  "komanduvannya_2_3": {"name": "Додатковий бал дій", "category": "Командування", "tier": 3, "cost": 0},
  "komanduvannya_3_1": {"name": "Артилерійський обстріл за раунд", "category": "Командування", "tier": 3, "cost": 0},
  "komanduvannya_3_2": {"name": "3 атаки (всім окрім 1-го та 2-го ходу)", "category": "Командування", "tier": 3, "cost": 0}
}
```

### 4.1 Правила купівлі прокачок (логіка з `/api/purchase_upgrade`, перенести без змін правил)

1. Прокачку можна купити лише один раз (перевірка `purchased`).
2. Ліміти по тірах: `{1: 4, 2: 3, 3: 2}` — максимум прокачок 1-го/2-го/3-го рівня загалом.
3. **Гілка зайнята**: в межах однієї `category` + `tier` можна взяти лише одну прокачку (тобто з пари `_1`/`_2` обираєш одну).
4. **Передумова (prerequisite)**: щоб купити tier 2+ у категорії, потрібно мати куплену прокачку tier-1 у тій же категорії.
5. **Категорія "Командування"** — особлива:
   - доступна лише з раунду новин ≥ `tier` (тобто tier 1 → з раунду 1, tier 2 → з раунду 2, tier 3 → з раунду 3);
   - вимагає мати вже куплену будь-яку прокачку того ж tier з іншої категорії;
   - `cost = 0` (не списує бали рівня, дається "безкоштовно" як винагорода за прогрес).
6. Для не-"Командування": списується `cost` з `level{tier}_score` гравця (`level1_score`, `level2_score`, `level3_score`).
7. Спецефекти при покупці:
   - `komanduvannya_2_3` → +1 до `action_points.active` (і базового значення при ресеті ходу)
   - `komanduvannya_2_1` → +1 до `action_points.attack` (і базового значення при ресеті ходу)

### 4.2 Rollback (відкат прокачки)

Дозволити відкат прокачки лише якщо видалення не порушує залежності інших куплених прокачок (тобто не можна видалити tier 1, якщо куплено залежний tier 2+ в тій же категорії — спочатку відкатати їх). Повертає витрачені бали назад на `level{tier}_score`.

**Рекомендація для нового додатку**: цю функцію можна спростити — наприклад, дозволити відкат лише поки активний раунд новин не змінився, або взагалі прибрати rollback як рідкісну адмін-дію хоста.

---

## 5. Генерація новин (NEWS_RULES + CoordinateGenerator) — перенести без змін правил

### 5.1 Поле та зони (25x25, координати у форматі A1-Y25)

```json
{
  "grid_size": 25,
  "excluded_zones": ["A1:E5", "U1:Y5", "A21:E25", "U21:Y25"],
  "zones_5x5": ["F1:T5", "U6:Y20", "F21:T25", "A6:E20"],
  "zones_3x3": ["F6:O10", "P6:T15", "K16:T20", "F11:J20"],
  "zones_1x1": ["K11:O15"]
}
```

### 5.2 Правила появи сутностей за раундом новин (1-4)

```json
{
  "1": {
    "Мутанти 1": {"quantity": "8-16", "zone": "5x5", "chance": 100},
    "Мутанти 2": {"quantity": "4-8", "zone": "3x3", "chance": 100},
    "Мутанти 3": {"quantity": "1-2", "zone": "1x1", "chance": 66},
    "Нанокс": {"quantity": "2-4", "zone": "any", "chance": 25},
    "Воля": {"quantity": "3-5", "zone": "any", "chance": 50},
    "Обовʼязок": {"quantity": "3-5", "zone": "any", "chance": 50},
    "Псі-випромінювач": {"quantity": "1", "zone": "3x3", "chance": 33},
    "Аномалії": {"quantity": "1-3", "zone": "any", "chance": 100},
    "Викид": {"chance": 50},
    "Транспорт нанокс": {"quantity": "0", "zone": "any", "chance": 0}
  },
  "2": {
    "Мутанти 1": {"quantity": "4-12", "zone": "5x5", "chance": 100},
    "Мутанти 2": {"quantity": "8-12", "zone": "5x5", "chance": 100},
    "Мутанти 3": {"quantity": "1-4", "zone": "3x3", "chance": 100},
    "Нанокс": {"quantity": "2-8", "zone": "any", "chance": 50},
    "Воля": {"quantity": "3-5", "zone": "any", "chance": 75},
    "Обовʼязок": {"quantity": "3-5", "zone": "any", "chance": 75},
    "Псі-випромінювач": {"quantity": "1", "zone": "3x3", "chance": 50},
    "Аномалії": {"quantity": "2-4", "zone": "any", "chance": 100},
    "Викид": {"chance": 50},
    "Транспорт нанокс": {"quantity": "1-3", "zone": "any", "chance": 33}
  },
  "3": {
    "Мутанти 1": {"quantity": "4-12", "zone": "5x5", "chance": 100},
    "Мутанти 2": {"quantity": "8-12", "zone": "5x5", "chance": 100},
    "Мутанти 3": {"quantity": "1-4", "zone": "3x3", "chance": 100},
    "Нанокс": {"quantity": "2-8", "zone": "any", "chance": 50},
    "Воля": {"quantity": "3-5", "zone": "any", "chance": 75},
    "Обовʼязок": {"quantity": "3-5", "zone": "any", "chance": 75},
    "Псі-випромінювач": {"quantity": "2", "zone": "3x3", "chance": 50},
    "Аномалії": {"quantity": "2-4", "zone": "any", "chance": 100},
    "Викид": {"chance": 50},
    "Транспорт нанокс": {"quantity": "1-3", "zone": "any", "chance": 33}
  },
  "4": {
    "Мутанти 1": {"quantity": "0", "zone": "5x5", "chance": 0},
    "Мутанти 2": {"quantity": "8-16", "zone": "5x5", "chance": 100},
    "Мутанти 3": {"quantity": "4-8", "zone": "3x3", "chance": 100},
    "Нанокс": {"quantity": "4-6", "zone": "any", "chance": 100},
    "Воля": {"quantity": "2-5", "zone": "any", "chance": 40},
    "Обовʼязок": {"quantity": "2-4", "zone": "any", "chance": 40},
    "Псі-випромінювач": {"quantity": "1", "zone": "3x3", "chance": 50},
    "Аномалії": {"quantity": "3-6", "zone": "any", "chance": 100},
    "Викид": {"chance": 50},
    "Транспорт нанокс": {"quantity": "1-3", "zone": "any", "chance": 66}
  }
}
```

`TOTAL_NEWS_ROUNDS = 4`, `TURNS_PER_NEWS_ROUND = 4` — зберегти ці константи.

### 5.3 Алгоритм генерації координат (порт у JS)

1. Побудувати множину всіх клітинок 25x25, відняти `excluded_zones`.
2. Для кожної сутності з правил поточного раунду новин:
   - "Викид" — окремий випадок: просто кидок шансу (`Стався`/`Не стався`), без координат.
   - Інакше: розгорнути `quantity` (діапазон → випадкове ціле), перевірити `chance` (кидок 1-100 ≤ chance).
   - Якщо `quantity == 0` або шанс не випав → порожній список координат.
   - Обрати пул координат залежно від `zone` (`5x5`/`3x3`/`1x1`/`any`), відфільтрувати вже зайняті клітинки.
3. **Мутанти 1 і Мутанти 2** генеруються "дзеркально": обирається одна точка, і будуються 3 дзеркальні відносно центру (12,12) — горизонтально, вертикально, по діагоналі. Група з 4 точок приймається лише якщо всі 4 валідні і не надто близькі одна до одної (Чебишевська відстань > 2). Навколо кожної прийнятої точки виключається зона радіусом 2 з пулу (`_get_exclusion_zone`).
4. Інші сутності — звичайна ітеративна вибірка з виключенням радіуса 2 навколо кожної обраної точки.
5. Результат — мапа `{ "Мутанти 1": ["F3","F21","T3","T21"], ... }`, формат координат A1-Y25.

**Адаптація**: генерація запускається хостом раз на раунд новин (`determine_new_initiative`), результат зберігається у `/sessions/{code}/news` і моментально транслюється всім гравцям через onValue — для них це просто текстовий список новин для поточного раунду.

---

## 6. Структура ходів та раундів новин — рекомендована адаптація

Збережена логіка (важлива для балансу):
- `TURN_DURATION_SECONDS = 420` (7 хв на хід) — константа, можна зробити налаштовуваною хостом.
- `TOTAL_NEWS_ROUNDS = 4`, `TURNS_PER_NEWS_ROUND = 4` — гра складається з 4 великих раундів новин, кожен містить 4 малих раунди (по одному ходу на кожного активного гравця).
- На початку кожного великого раунду новин: визначається нова "ініціатива" (порядок ходу) — випадковий гравець з базового списку (крім того, хто мав ініціативу минулого разу), генеруються нові новини для цього раунду.
- На початку кожного ходу гравця: `action_points` скидаються до базових + бонуси від прокачок `komanduvannya_2_1`/`komanduvannya_2_3`; `mission_replacements_by_level` скидається до `{1:1, 2:1, 3:1}`; `currency_earned_this_turn` скидається до 0.
- Гравець під час свого ходу не може обирати нові місії (`get_mission_choices` блокує це для поточного гравця ходу) — лише виконувати вже взяті.

**Спрощення для веб-додатку без серверної частини (Firebase only)**: оскільки немає бекенд-процесу, всю цю логіку (перехід ходу, ресет балів, генерація новин) виконує клієнт хоста через прямі записи у Firebase, обгорнуті в `runTransaction()` для атомарності. Кнопка "Завершити хід" доступна лише поточному гравцю; решта бачать стан через підписку.

---

## 7. Список API → еквіваленти Firebase-функцій

| Старий Flask endpoint | Призначення | Новий еквівалент |
|---|---|---|
| `/api/login` | реєстрація гравця, вибір угрупування | `joinSession()` — запис у `/sessions/{code}/players/{id}` |
| `/api/get_news` | поточні новини | підписка на `/sessions/{code}/news` |
| `/api/determine_new_initiative` | новий раунд новин + генерація | `startNewsRound()` (виконує хост) |
| `/api/next_turn` | передача ходу | `advanceTurn()` |
| `/api/spend_action_point` | витрата очок дій | `spendActionPoint(type, amount)` |
| `/api/get_upgrades_state`, `/api/purchase_upgrade`, `/api/rollback_upgrade` | прокачки | `purchaseUpgrade()`, `rollbackUpgrade()` — з усіма правилами з п.4.1 |
| `/api/get_user_missions`, `/api/get_mission_choices`, `/api/select_mission_choice`, `/api/update_mission_progress`, `/api/complete_mission` | система місій | `assignMission()`, `getMissionChoices()`, `selectMission()`, `updateProgress()`, `completeMission()` |
| `/api/get_score_history` | історія балів | `/sessions/{code}/scoreHistory` (масив подій) |
| `/api/reset_game` | новий раунд гри | `resetSession()` |

---

## 8. Підсумок: що збереглося 1:1, що адаптовано

**Збережено без змін (баланс гри):**
- Таблиця коефіцієнтів генерації місій (розділ 3.1)
- Формули рівнів/нагород/валюти (розділ 3.2)
- Дерево прокачок UPGRADES і всі правила покупки (розділ 4)
- Правила генерації новин NEWS_RULES + алгоритм координат (розділ 5)
- Угрупування FACTIONS і кольори (розділ 2)
- Константи: `TURN_DURATION_SECONDS=420`, `TOTAL_NEWS_ROUNDS=4`, `TURNS_PER_NEWS_ROUND=4`, `DEFAULT_ACTION_POINTS`, `CURRENCY_COEFFICIENT=0.33`
- Прив'язка слотів місій до рівнів: `(slot_index % 3) + 1`
- Логіка ресету балів дій/замін місій на початку ходу

**Адаптовано під Firebase + 4 гравці:**
- SQLite таблиці → JSON-структура в Realtime Database (розділ 1, 7)
- Серверна валідація ходу (`turn_required`) → клієнтські перевірки + транзакції Firebase
- Генерація місій "на льоту" → одноразово згенерований статичний `missions.json`, що завантажується при старті
- Сесії на Flask cookies → коди кімнат Firebase (з попереднього плану)
- Rollback прокачок — можна спростити до простішого правила або прибрати (опціонально)
