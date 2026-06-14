import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  createEmptyMealPlanWeek,
  type DayCookingStatus,
  type DayName,
  type HydratedMealPlanWeek,
  type MealPlanDay,
  type MealPlanWeek,
  mealPlanWeeks,
} from "./mealPlans";
import { type Recipe, type RecipeType } from "./recipes";

export const mealPlanStorageKey = "hotcook-meal-planner.meal-plans.v2";
export const legacyMealPlanStorageKey = "hotcook-meal-planner.meal-plans.v1";
export const mealPlanStorageEvent = "hotcook-meal-planner:meal-plans-updated";

const freezerKitDays = new Set<DayName>(["月", "火", "木", "金"]);

function getBrowserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function normalizeDay(day: Partial<MealPlanDay> & { day: DayName }, startsOn: string, index: number): MealPlanDay {
  const isLegacyNoMeal = day.recipeId === "no-meal";
  return {
    day: day.day,
    date: day.date ?? addDays(startsOn, index),
    status: isLegacyNoMeal ? "no-meal" : day.status ?? "unset",
    recipeId: isLegacyNoMeal ? undefined : day.recipeId,
    locked: Boolean(day.locked),
  };
}

function normalizeWeek(week: MealPlanWeek): MealPlanWeek {
  const empty = createEmptyMealPlanWeek(week.startsOn);
  return {
    ...empty,
    ...week,
    id: week.startsOn,
    label: empty.label,
    days: empty.days.map((emptyDay, index) => {
      const storedDay = week.days?.find((day) => day.day === emptyDay.day);
      return storedDay ? normalizeDay(storedDay, week.startsOn, index) : emptyDay;
    }),
  };
}

export function mergeMealPlans(basePlans: MealPlanWeek[], storedPlans: MealPlanWeek[]) {
  const byStart = new Map(basePlans.map((week) => [week.startsOn, normalizeWeek(week)]));
  storedPlans.forEach((week) => byStart.set(week.startsOn, normalizeWeek(week)));
  return Array.from(byStart.values()).sort((a, b) => a.startsOn.localeCompare(b.startsOn));
}

export function loadStoredMealPlans(basePlans: MealPlanWeek[] = mealPlanWeeks) {
  const storage = getBrowserStorage();
  if (!storage) return basePlans.map(normalizeWeek);
  try {
    const saved = storage.getItem(mealPlanStorageKey) ?? storage.getItem(legacyMealPlanStorageKey);
    if (!saved) return basePlans.map(normalizeWeek);
    const parsed = JSON.parse(saved) as MealPlanWeek[];
    const plans = Array.isArray(parsed) ? mergeMealPlans(basePlans, parsed) : basePlans.map(normalizeWeek);
    storage.setItem(mealPlanStorageKey, JSON.stringify(plans));
    return plans;
  } catch {
    return basePlans.map(normalizeWeek);
  }
}

export function saveMealPlansToStorage(plans: MealPlanWeek[]) {
  const normalized = plans.map(normalizeWeek);
  getBrowserStorage()?.setItem(mealPlanStorageKey, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(mealPlanStorageEvent, { detail: normalized }));
}

export function useStoredMealPlans(basePlans: MealPlanWeek[] = mealPlanWeeks) {
  const [plans, setPlans] = useState(basePlans);
  useEffect(() => {
    const refresh = () => setPlans(loadStoredMealPlans(basePlans));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(mealPlanStorageEvent, refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener(mealPlanStorageEvent, refresh); };
  }, [basePlans]);
  return useMemo(() => plans, [plans]);
}

export function getMealPlanByStart(plans: MealPlanWeek[], startsOn: string) {
  return plans.find((plan) => plan.startsOn === startsOn) ?? createEmptyMealPlanWeek(startsOn);
}

export function hydrateMealPlanWeek(week: MealPlanWeek, recipes: Recipe[]): HydratedMealPlanWeek {
  return { ...week, days: week.days.map((day) => ({ ...day, recipe: day.recipeId ? recipes.find((recipe) => recipe.id === day.recipeId) : undefined })) };
}

export function getRequiredRecipeType(day: Pick<MealPlanDay, "day" | "status">): RecipeType | null {
  if (day.status === "no-meal") return null;
  if (day.status === "freezer-kit" || day.status === "regular") return day.status;
  return freezerKitDays.has(day.day) ? "freezer-kit" : "regular";
}

export function getCandidateRecipesForDay(day: Pick<MealPlanDay, "day" | "status">, recipes: Recipe[]) {
  const type = getRequiredRecipeType(day);
  return type ? recipes.filter((recipe) => recipe.id !== "no-meal" && recipe.type === type) : [];
}

function getPreviousRecipeIds(plans: MealPlanWeek[], target: MealPlanWeek, windowWeeks = 4) {
  const oldestStart = addDays(target.startsOn, windowWeeks * -7);
  return new Set(plans.filter((plan) => plan.startsOn < target.startsOn && plan.startsOn >= oldestStart).flatMap((plan) => plan.days.filter((day) => day.status !== "no-meal").map((day) => day.recipeId).filter((id): id is string => Boolean(id))));
}

function pickRecipe(candidates: Recipe[], excluded: Set<string>) {
  const preferred = candidates.filter((recipe) => !excluded.has(recipe.id));
  const pool = preferred.length ? preferred : candidates;
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

export function generateMealPlanWeek(plans: MealPlanWeek[], startsOn: string, recipes: Recipe[]) {
  const target = getMealPlanByStart(plans, startsOn);
  const used = getPreviousRecipeIds(plans, target);
  return {
    ...target,
    days: target.days.map((day) => {
      if (day.status === "no-meal") return { ...day, recipeId: undefined };
      if (day.locked && day.recipeId) { used.add(day.recipeId); return day; }
      const recipe = pickRecipe(getCandidateRecipesForDay(day, recipes), used);
      if (!recipe) return { ...day, recipeId: undefined };
      used.add(recipe.id);
      return { ...day, recipeId: recipe.id };
    }),
  };
}

export function rerollMealPlanDay(plans: MealPlanWeek[], startsOn: string, dayName: DayName, recipes: Recipe[]) {
  const target = getMealPlanByStart(plans, startsOn);
  const day = target.days.find((item) => item.day === dayName);
  if (!day || day.status === "no-meal") return target;
  const excluded = getPreviousRecipeIds(plans, target);
  target.days.filter((item) => item.day !== dayName && item.status !== "no-meal" && item.recipeId).forEach((item) => excluded.add(item.recipeId as string));
  const recipe = pickRecipe(getCandidateRecipesForDay(day, recipes), excluded);
  return recipe ? replaceMealPlanDay(target, dayName, recipe.id) : target;
}

export function replaceMealPlanDay(week: MealPlanWeek, dayName: DayName, recipeId: string) {
  return { ...week, days: week.days.map((day) => day.day === dayName ? { ...day, recipeId, status: day.status === "no-meal" ? "unset" as const : day.status } : day) };
}

export function setMealPlanDayLocked(week: MealPlanWeek, dayName: DayName, locked: boolean) {
  return { ...week, days: week.days.map((day) => day.day === dayName ? { ...day, locked } : day) };
}

export function setMealPlanDayStatus(week: MealPlanWeek, dayName: DayName, status: DayCookingStatus) {
  return {
    ...week,
    days: week.days.map((day) => day.day === dayName
      ? {
          ...day,
          status,
          recipeId: day.status === status ? day.recipeId : undefined,
          locked: day.status === status ? day.locked : false,
        }
      : day),
  };
}

export function upsertMealPlan(plans: MealPlanWeek[], nextWeek: MealPlanWeek) {
  const exists = plans.some((week) => week.startsOn === nextWeek.startsOn);
  return (exists ? plans.map((week) => week.startsOn === nextWeek.startsOn ? nextWeek : week) : [...plans, nextWeek]).sort((a, b) => a.startsOn.localeCompare(b.startsOn));
}
