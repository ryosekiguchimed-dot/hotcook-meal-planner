import { type Recipe } from "./recipes";

export const noMealRecipe: Recipe = {
  id: "no-meal",
  name: "料理なし",
  type: "regular",
  mealRole: "main",
  dishCategory: "vegetable",
  description: "外食や予定があるため、夕食を作らない日。",
  servings: 4,
  timeMinutes: 0,
  hotcookSetting: "調理なし",
  hotcookOperation: [],
  ingredients: [],
  steps: [],
};

export function withNoMealRecipe(sourceRecipes: Recipe[]) {
  return sourceRecipes.some((recipe) => recipe.id === noMealRecipe.id)
    ? sourceRecipes
    : [...sourceRecipes, noMealRecipe];
}
