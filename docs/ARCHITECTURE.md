# КПК — Архітектура (Етап 1)

> Документ описує структуру даних, синхронізацію та технічний стек тактичного
> КПК-додатку для настільної гри. Узгоджено з планом `boardgame_app_plan_v2`.

## 1. Технічний стек

| Шар | Технологія |
|---|---|
| Frontend | React 19 + TanStack Start (Vite 7) |
| Стилі | Tailwind v4 + дизайн-токени в `src/styles.css` |
| Стейт UI | React Context (`KpkProvider`) |
| Бекенд / реалтайм | **Lovable Cloud** (Supabase: Postgres + Realtime) — замість Firebase з плану |
| Аудіо | WebAudio (`src/lib/sounds.ts`) — без зовнішніх ассетів |
| Хостинг preview/prod | Lovable (Cloudflare Workers edge) |
| Десктопний запускач (Етап 6) | Tauri з вбудованим `serve dist` → відкриває `localhost:3000` (НЕ `file://`) |

> Чому не Firebase: користувач явно попросив Lovable. Supabase Realtime
> підписки (`channel.on('postgres_changes', …)`) еквівалентні `onValue()` з
> плану — той самий «миттєвий пуш» зміни таблиці всім клієнтам.

## 2. Схеми даних

Канонічні TS-типи: `src/lib/schemas.ts`. Контент-файли: `src/data/*.json`.

### 2.1. Session
```
sessions
  id           uuid PK
  code         text UNIQUE     -- 4 символи, напр. "A7F2"
  status       enum(waiting|active|finished)
  host_id      uuid → players.id
  round        int
  turn         int
  news_index   int
  created_at   timestamptz
  updated_at   timestamptz
```

### 2.2. Player
```
players
  id                 uuid PK
  session_id         uuid → sessions.id
  nickname           text
  faction            text          -- ключ FACTIONS
  color              text          -- дубль hex для UI
  score              int default 0
  level1, level2, level3  int default 0
  currency           int default 0
  upgrade_points     int default 0
  connection         enum(online|offline|away)
  joined_at          timestamptz
```

### 2.3. Player ↔ Upgrades / Missions (join)
```
player_upgrades          (player_id, upgrade_id, purchased_at)
player_mission_states    (player_id, mission_id, progress, active, completed_at)
```

### 2.4. Content (read-only JSON)
- `src/data/missions.json` — `MissionDef[]`, 19 місій (7 / 6 / 6 за рівнями).
- `src/data/upgrades.json` — `UpgradeDef[]`, 16 прокачок із залежностями `requires[]`.

### 2.5. Events (журнал)
```
session_events
  id        uuid
  session   uuid
  kind      enum(mission_assigned|mission_completed|upgrade_purchased|
                 score_adjusted|player_joined|player_left|turn_advanced)
  player    uuid?  payload jsonb  at timestamptz
```
Використовується для toast-сповіщень і екрану «Історія балів».

## 3. Архітектура синхронізації

```
       ┌───────────┐  postgres_changes   ┌───────────┐
       │  Player A │ ◄─────────────────► │  Supabase │
       └───────────┘                     │  Realtime │
                                         └─────┬─────┘
       ┌───────────┐  postgres_changes        │
       │  Player B │ ◄────────────────────────┘
       └───────────┘
```

- Кожен клієнт виконує `supabase.channel('session:<code>')` і слухає зміни
  трьох таблиць: `players`, `player_mission_states`, `session_events`.
- Запис будь-якого гравця → INSERT/UPDATE → всі бачать через ≤200 мс.
- Атомарні дії (`completeMission`, `purchaseUpgrade`) реалізуються
  Postgres-функціями (`rpc`) — гарантує цілісність балів.

## 4. Узгодження UI ↔ дані

| UI-екран | Джерело |
|---|---|
| `LoginScreen` | створює/приєднує сесію + insert у `players` |
| `MainMenu` | селект `players` поточної сесії |
| `MissionsScreen` | `player_mission_states` + `missions.json` |
| `ScoreScreen` | агрегат `players.score` + останні `session_events` |
| `NewsScreen` | `sessions.news_index` + контент новин |
| `UpgradesScreen` | `player_upgrades` + `upgrades.json` |
| `TimerScreen` | `sessions.turn`, `turn_started_at`; локальний обратний відлік |

## 5. Що зроблено в Етапі 1

- [x] TS-типи: `Session`, `Player`, `MissionDef`, `UpgradeDef`,
      `MissionState`, `SessionEvent` → `src/lib/schemas.ts`.
- [x] Контент: `src/data/missions.json` (19), `src/data/upgrades.json` (16).
- [x] Архітектурний документ (цей файл).
- [x] Рішення про бекенд: Lovable Cloud / Supabase Realtime.

## 6. Що далі (Етап 2)

1. Увімкнути Lovable Cloud.
2. Міграція з таблицями `sessions`, `players`, `player_upgrades`,
   `player_mission_states`, `session_events` + GRANT + RLS.
3. Сід контенту з JSON у статичні `missions` / `upgrades` таблиці
   (або залишити як read-only JSON у бандлі — дешевше).
4. Хук `useSession(code)` поверх Supabase Realtime.
