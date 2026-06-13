// Run: bun scripts/generate-missions.ts
// Reads src/data/mission_recipes.json → writes src/data/generated_missions.json
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateMissions, type Recipe } from "../src/lib/game/generateMissions";

const recipes = JSON.parse(readFileSync(resolve("src/data/mission_recipes.json"), "utf8")) as Recipe[];
const missions = generateMissions(recipes);
writeFileSync(resolve("src/data/generated_missions.json"), JSON.stringify(missions, null, 2) + "\n");
console.log(`Generated ${missions.length} missions → src/data/generated_missions.json`);
