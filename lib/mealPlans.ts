import {
  type IngredientCategory,
  type Recipe,
  type RecipeFilters,
  filterRecipes,
  getRecipeById,
} from "./recipes";

export type WeekKey = "last" | "current" | "next";
export type DayName = "月" | "火" | "水" | "木" | "金" | "土" | "日";

export type MealPlanDay = {
  day: DayName;
  recipeId: string;
};

export type MealPlanWeek = {
  id: string;
  key: WeekKey;
  label: string;
  startsOn: string;
  days: MealPlanDay[];
};

export type HydratedMealPlanDay = MealPlanDay & {
  recipe: Recipe;
};

export type HydratedMealPlanWeek = Omit<MealPlanWeek, "days"> & {
  days: HydratedMealPlanDay[];
};

export const mealPlanWeeks: MealPlanWeek[] = [
  {
    id: "2026-05-25",
    key: "last",
    label: "先週",
    startsOn: "2026-05-25",
    days: [
      { day: "月", recipeId: "pork-cabbage-miso" },
      { day: "火", recipeId: "beef-hayashi" },
      { day: "水", recipeId: "clam-chowder" },
      { day: "木", recipeId: "salmon-miso-butter" },
      { day: "金", recipeId: "chicken-curry" },
      { day: "土", recipeId: "chikuzenni" },
      { day: "日", recipeId: "white-fish-aqua" },
    ],
  },
  {
    id: "2026-06-01",
    key: "current",
    label: "今週",
    startsOn: "2026-06-01",
    days: [
      { day: "月", recipeId: "chicken-tomato" },
      { day: "火", recipeId: "pork-ginger-miso" },
      { day: "水", recipeId: "salmon-cream" },
      { day: "木", recipeId: "dry-curry" },
      { day: "金", recipeId: "nikujaga-kit" },
      { day: "土", recipeId: "minestrone" },
      { day: "日", recipeId: "oyakodon" },
    ],
  },
  {
    id: "2026-06-08",
    key: "next",
    label: "来週",
    startsOn: "2026-06-08",
    days: [
      { day: "月", recipeId: "chicken-salt-koji" },
      { day: "火", recipeId: "pork-daikon" },
      { day: "水", recipeId: "vegetable-pot-au-feu" },
      { day: "木", recipeId: "keema-beans" },
      { day: "金", recipeId: "beef-bulgogi" },
      { day: "土", recipeId: "hamburg-stew" },
      { day: "日", recipeId: "tofu-chicken-soup" },
    ],
  },
];

export function normalizeWeekKey(value?: string | string[]): WeekKey {
  const key = Array.isArray(value) ? value[0] : value;
  return key === "last" || key === "next" ? key : "current";
}

export function getMealPlanWeek(key: WeekKey = "current"): HydratedMealPlanWeek {
  const week = mealPlanWeeks.find((plan) => plan.key === key) ?? mealPlanWeeks[1];

  return {
    ...week,
    days: week.days.map((day) => {
      const recipe = getRecipeById(day.recipeId);

      if (!recipe) {
        throw new Error(`Recipe not found: ${day.recipeId}`);
      }

      return { ...day, recipe };
    }),
  };
}

export function getRecentRecipeIds(targetWeekId: string, windowWeeks = 4) {
  const targetIndex = mealPlanWeeks.findIndex((week) => week.id === targetWeekId);
  const end = targetIndex === -1 ? mealPlanWeeks.length : targetIndex;
  const start = Math.max(0, end - windowWeeks);

  return new Set(
    mealPlanWeeks
      .slice(start, end)
      .flatMap((week) => week.days.map((day) => day.recipeId)),
  );
}

export function getAvailableRecipesForWeek(targetWeekId: string) {
  const recentRecipeIds = getRecentRecipeIds(targetWeekId);
  return filterRecipes({ excludeIds: recentRecipeIds });
}

export function getAvailableRecipesForWeekByFilter(
  targetWeekId: string,
  filters: Omit<RecipeFilters, "excludeIds"> = {},
) {
  const recentRecipeIds = getRecentRecipeIds(targetWeekId);
  return filterRecipes({ ...filters, excludeIds: recentRecipeIds });
}

export function isRecipeAllowedForWeek(recipeId: string, targetWeekId: string) {
  return !getRecentRecipeIds(targetWeekId).has(recipeId);
}

export function getShoppingListForWeek(week: HydratedMealPlanWeek) {
  const grouped = new Map<
    IngredientCategory,
    Map<string, { name: string; amounts: string[]; days: DayName[] }>
  >();

  for (const day of week.days) {
    for (const ingredient of day.recipe.ingredients) {
      const categoryGroup = grouped.get(ingredient.category) ?? new Map();
      const item = categoryGroup.get(ingredient.name) ?? {
        name: ingredient.name,
        amounts: [],
        days: [],
      };

      item.amounts.push(`${day.day}: ${ingredient.amount}`);
      item.days.push(day.day);
      categoryGroup.set(ingredient.name, item);
      grouped.set(ingredient.category, categoryGroup);
    }
  }

  const categoryOrder: IngredientCategory[] = [
    "肉・魚",
    "野菜",
    "きのこ・豆",
    "卵・乳製品",
    "調味料",
    "乾物・その他",
  ];

  return categoryOrder
    .map((category) => ({
      category,
      items: Array.from(grouped.get(category)?.values() ?? []).sort((a, b) =>
        a.name.localeCompare(b.name, "ja"),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
