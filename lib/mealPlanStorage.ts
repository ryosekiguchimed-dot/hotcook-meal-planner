import { useEffect, useMemo, useState } from "react";
import {
  type DayName,
  type HydratedMealPlanWeek,
  type MealPlanWeek,
  type WeekKey,
  mealPlanWeeks,
} from "./mealPlans";
import { noMealRecipe } from "./noMealRecipe";
import { type Recipe } from "./recipes";

export const mealPlanStorageKey = "hotcook-meal-planner.meal-plans.v1";
export const mealPlanStorageEvent = "hotcook-meal-planner:meal-plans-updated";

const weekLabels: Record<WeekKey, string> = {
  last: "先週",
  current: "今週",
  next: "来週",
};

const editableWeekKeys: WeekKey[] = ["current", "next"];
const freezerKitDays = new Set<DayName>(["月", "火", "木", "金"]);

function getBrowserStorage() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage;
}

function normalizeStoredWeek(week: MealPlanWeek): MealPlanWeek {
  return { ...week, days: week.days.map((day) => ({ day: day.day, recipeId: day.recipeId, locked: Boolean(day.locked) })) };
}

export function mergeMealPlans(basePlans: MealPlanWeek[], storedPlans: MealPlanWeek[]) {
  const merged = basePlans.map(normalizeStoredWeek);
  for (const storedPlan of storedPlans.map(normalizeStoredWeek)) {
    const idIndex = merged.findIndex((week) => week.id === storedPlan.id);
    if (idIndex !== -1) { merged[idIndex] = storedPlan; continue; }
    const keyIndex = merged.findIndex((week) => week.key === storedPlan.key);
    if (keyIndex !== -1 && editableWeekKeys.includes(storedPlan.key)) { merged[keyIndex] = storedPlan; continue; }
    merged.push(storedPlan);
  }
  return merged.sort((a, b) => a.startsOn.localeCompare(b.startsOn));
}

export function loadStoredMealPlans(basePlans: MealPlanWeek[] = mealPlanWeeks) {
  const storage = getBrowserStorage();
  if (!storage) return basePlans;
  try {
    const saved = storage.getItem(mealPlanStorageKey);
    if (!saved) return basePlans;
    const parsed = JSON.parse(saved) as MealPlanWeek[];
    return Array.isArray(parsed) ? mergeMealPlans(basePlans, parsed) : basePlans;
  } catch { return basePlans; }
}

export function saveMealPlansToStorage(plans: MealPlanWeek[]) {
  const storage = getBrowserStorage();
  if (storage) storage.setItem(mealPlanStorageKey, JSON.stringify(plans));
  window.dispatchEvent(new CustomEvent(mealPlanStorageEvent, { detail: plans }));
}

export function useStoredMealPlans(basePlans: MealPlanWeek[] = mealPlanWeeks) {
  const [plans, setPlans] = useState(basePlans);
  useEffect(() => {
    function refreshPlans() { setPlans(loadStoredMealPlans(basePlans)); }
    refreshPlans();
    window.addEventListener("storage", refreshPlans);
    window.addEventListener(mealPlanStorageEvent, refreshPlans);
    return () => { window.removeEventListener("storage", refreshPlans); window.removeEventListener(mealPlanStorageEvent, refreshPlans); };
  }, [basePlans]);
  return useMemo(() => plans, [plans]);
}

export function getMealPlanByKey(plans: MealPlanWeek[], key: WeekKey) {
  return plans.find((plan) => plan.key === key) ?? mealPlanWeeks.find((plan) => plan.key === key) ?? mealPlanWeeks[1];
}

export function hydrateMealPlanWeek(week: MealPlanWeek, recipes: Recipe[]): HydratedMealPlanWeek {
  return { ...week, days: week.days.map((day) => { const recipe = recipes.find((candidate) => candidate.id === day.recipeId); return recipe ? { ...day, recipe } : null; }).filter((day): day is HydratedMealPlanWeek["days"][number] => day !== null) };
}

export function getHydratedMealPlanByKey(plans: MealPlanWeek[], key: WeekKey, recipes: Recipe[]) {
  return hydrateMealPlanWeek(getMealPlanByKey(plans, key), recipes);
}

export function getRequiredRecipeType(day: DayName) { return freezerKitDays.has(day) ? "freezer-kit" : "regular"; }
export function getCandidateRecipesForDay(day: DayName, recipes: Recipe[]) { const type = getRequiredRecipeType(day); return recipes.filter((recipe) => recipe.id !== noMealRecipe.id && recipe.type === type); }
function getPreviousRecipeIds(plans: MealPlanWeek[], targetWeek: MealPlanWeek, windowWeeks = 4) { return new Set(plans.filter((plan) => plan.startsOn < targetWeek.startsOn).sort((a, b) => b.startsOn.localeCompare(a.startsOn)).slice(0, windowWeeks).flatMap((plan) => plan.days.map((day) => day.recipeId))); }
function pickRecipe(candidates: Recipe[], excludedIds: Set<string>) { const preferred = candidates.filter((recipe) => !excludedIds.has(recipe.id)); const pool = preferred.length > 0 ? preferred : candidates; if (pool.length === 0) return null; return pool[Math.floor(Math.random() * pool.length)]; }

export function generateMealPlanWeek(plans: MealPlanWeek[], targetKey: Extract<WeekKey, "current" | "next">, recipes: Recipe[]) {
  const targetWeek = getMealPlanByKey(plans, targetKey); const recentRecipeIds = getPreviousRecipeIds(plans, targetWeek); const usedRecipeIds = new Set(recentRecipeIds);
  return { ...targetWeek, label: weekLabels[targetKey], days: targetWeek.days.map((day) => { if (day.locked) { usedRecipeIds.add(day.recipeId); return day; } const candidates = getCandidateRecipesForDay(day.day, recipes); const recipe = pickRecipe(candidates, usedRecipeIds); if (!recipe) return day; usedRecipeIds.add(recipe.id); return { ...day, recipeId: recipe.id }; }) };
}

export function rerollMealPlanDay(plans: MealPlanWeek[], targetKey: WeekKey, dayName: DayName, recipes: Recipe[]) {
  const targetWeek = getMealPlanByKey(plans, targetKey); const recentRecipeIds = getPreviousRecipeIds(plans, targetWeek); const currentWeekRecipeIds = new Set(targetWeek.days.filter((day) => day.day !== dayName).map((day) => day.recipeId)); const excludedIds = new Set([...recentRecipeIds, ...currentWeekRecipeIds]); const candidates = getCandidateRecipesForDay(dayName, recipes); const recipe = pickRecipe(candidates, excludedIds); if (!recipe) return targetWeek; return replaceMealPlanDay(targetWeek, dayName, recipe.id);
}
export function replaceMealPlanDay(week: MealPlanWeek, dayName: DayName, recipeId: string) { return { ...week, days: week.days.map((day) => (day.day === dayName ? { ...day, recipeId } : day)) }; }
export function setMealPlanDayLocked(week: MealPlanWeek, dayName: DayName, locked: boolean) { return { ...week, days: week.days.map((day) => (day.day === dayName ? { ...day, locked } : day)) }; }
export function upsertMealPlan(plans: MealPlanWeek[], nextWeek: MealPlanWeek) { const existingIndex = plans.findIndex((week) => week.id === nextWeek.id || week.key === nextWeek.key); if (existingIndex === -1) return mergeMealPlans(plans, [nextWeek]); return plans.map((week, index) => (index === existingIndex ? nextWeek : week)); }
