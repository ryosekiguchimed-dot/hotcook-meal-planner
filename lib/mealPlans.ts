import { type IngredientCategory, type Recipe } from "./recipes";

export type WeekKey = "last" | "current" | "next";
export type DayName = "月" | "火" | "水" | "木" | "金" | "土" | "日";
export type DayCookingStatus = "unset" | "freezer-kit" | "regular" | "no-meal";

export type MealPlanDay = {
  day: DayName;
  date: string;
  status: DayCookingStatus;
  recipeId?: string;
  locked?: boolean;
};

export type MealPlanWeek = {
  id: string;
  key?: WeekKey;
  label: string;
  startsOn: string;
  days: MealPlanDay[];
};

export type HydratedMealPlanDay = MealPlanDay & { recipe?: Recipe };
export type HydratedMealPlanWeek = Omit<MealPlanWeek, "days"> & { days: HydratedMealPlanDay[] };

export const dayNames: DayName[] = ["月", "火", "水", "木", "金", "土", "日"];

function toLocalIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(value: string, amount: number) {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + amount);
  return toLocalIso(date);
}

export function getWeekStart(value = toLocalIso(new Date())) {
  const date = parseIsoDate(value);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return toLocalIso(date);
}

export function getCurrentWeekStart() {
  return getWeekStart();
}

export function getWeekLabel(startsOn: string) {
  const end = addDays(startsOn, 6);
  const startDate = parseIsoDate(startsOn);
  const endDate = parseIsoDate(end);
  return `${startDate.getFullYear()}年${startDate.getMonth() + 1}月${startDate.getDate()}日 - ${endDate.getMonth() + 1}月${endDate.getDate()}日`;
}

export function createEmptyMealPlanWeek(startsOn: string): MealPlanWeek {
  return {
    id: startsOn,
    label: getWeekLabel(startsOn),
    startsOn,
    days: dayNames.map((day, index) => ({
      day,
      date: addDays(startsOn, index),
      status: "unset",
      locked: false,
    })),
  };
}

function legacyWeek(startsOn: string, key: WeekKey, recipeIds: string[]): MealPlanWeek {
  return {
    ...createEmptyMealPlanWeek(startsOn),
    key,
    label: key === "last" ? "先週" : key === "current" ? "今週" : "来週",
    days: createEmptyMealPlanWeek(startsOn).days.map((day, index) => ({ ...day, recipeId: recipeIds[index] })),
  };
}

export const mealPlanWeeks: MealPlanWeek[] = [
  legacyWeek("2026-05-25", "last", ["pork-cabbage-miso", "beef-hayashi", "clam-chowder", "salmon-miso-butter", "chicken-curry", "chikuzenni", "white-fish-aqua"]),
  legacyWeek("2026-06-01", "current", ["chicken-tomato", "pork-ginger-miso", "salmon-cream", "dry-curry", "nikujaga-kit", "minestrone", "oyakodon"]),
  legacyWeek("2026-06-08", "next", ["chicken-salt-koji", "pork-daikon", "vegetable-pot-au-feu", "keema-beans", "beef-bulgogi", "hamburg-stew", "tofu-chicken-soup"]),
];

export function normalizeSelectedDate(value?: string | string[]) {
  const selected = Array.isArray(value) ? value[0] : value;
  return /^\d{4}-\d{2}-\d{2}$/.test(selected ?? "") ? selected as string : toLocalIso(new Date());
}

export function normalizeWeekKey(value?: string | string[]): WeekKey {
  const key = Array.isArray(value) ? value[0] : value;
  return key === "last" || key === "next" ? key : "current";
}

export function getShoppingListForWeek(week: HydratedMealPlanWeek) {
  const grouped = new Map<IngredientCategory, Map<string, { name: string; amounts: string[]; days: DayName[] }>>();
  for (const day of week.days) {
    if (day.status === "no-meal" || !day.recipe) continue;
    for (const ingredient of day.recipe.ingredients) {
      const categoryGroup = grouped.get(ingredient.category) ?? new Map();
      const item = categoryGroup.get(ingredient.name) ?? { name: ingredient.name, amounts: [], days: [] };
      item.amounts.push(`${day.day}: ${ingredient.amount}`);
      item.days.push(day.day);
      categoryGroup.set(ingredient.name, item);
      grouped.set(ingredient.category, categoryGroup);
    }
  }
  const order: IngredientCategory[] = ["肉・魚", "野菜", "きのこ・豆", "卵・乳製品", "調味料", "乾物・その他"];
  return order.map((category) => ({ category, items: Array.from(grouped.get(category)?.values() ?? []).sort((a, b) => a.name.localeCompare(b.name, "ja")) })).filter((group) => group.items.length > 0);
}
