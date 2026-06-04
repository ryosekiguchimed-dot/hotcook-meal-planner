import { useEffect, useMemo, useState } from "react";
import { recipes as initialRecipes, type Recipe } from "./recipes";

export const recipeStorageKey = "hotcook-meal-planner.recipes.v1";
export const recipeStorageEvent = "hotcook-meal-planner:recipes-updated";

export function normalizeStoredRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    mealRole: recipe.mealRole ?? "main",
    dishCategory: recipe.dishCategory ?? "meat",
    hotcookMenuNumber: recipe.hotcookMenuNumber || undefined,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    hotcookOperation: Array.isArray(recipe.hotcookOperation) ? recipe.hotcookOperation : [],
  };
}

export function mergeRecipes(baseRecipes: Recipe[], storedRecipes: Recipe[]) {
  const merged = baseRecipes.map(normalizeStoredRecipe);

  for (const storedRecipe of storedRecipes.map(normalizeStoredRecipe)) {
    const idIndex = merged.findIndex((recipe) => recipe.id === storedRecipe.id);
    if (idIndex !== -1) {
      merged[idIndex] = storedRecipe;
      continue;
    }

    const nameIndex = merged.findIndex((recipe) => recipe.name === storedRecipe.name);
    if (nameIndex !== -1) {
      merged[nameIndex] = { ...storedRecipe, id: merged[nameIndex].id };
      continue;
    }

    merged.push(storedRecipe);
  }

  return merged;
}

function getBrowserStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

export function loadStoredRecipes(baseRecipes: Recipe[] = initialRecipes) {
  const storage = getBrowserStorage();
  if (!storage) {
    return baseRecipes;
  }

  try {
    const saved = storage.getItem(recipeStorageKey);
    if (!saved) {
      return baseRecipes;
    }

    const parsed = JSON.parse(saved) as Recipe[];
    return Array.isArray(parsed) ? mergeRecipes(baseRecipes, parsed) : baseRecipes;
  } catch {
    return baseRecipes;
  }
}

export function saveRecipesToStorage(recipes: Recipe[]) {
  const storage = getBrowserStorage();
  if (storage) {
    storage.setItem(recipeStorageKey, JSON.stringify(recipes));
  }

  window.dispatchEvent(new CustomEvent(recipeStorageEvent, { detail: recipes }));
}

export function clearStoredRecipes() {
  const storage = getBrowserStorage();
  if (storage) {
    storage.removeItem(recipeStorageKey);
  }

  window.dispatchEvent(new CustomEvent(recipeStorageEvent, { detail: initialRecipes }));
}

export function useStoredRecipes(baseRecipes: Recipe[] = initialRecipes) {
  const [recipes, setRecipes] = useState(baseRecipes);

  useEffect(() => {
    function refreshRecipes() {
      setRecipes(loadStoredRecipes(baseRecipes));
    }

    refreshRecipes();
    window.addEventListener("storage", refreshRecipes);
    window.addEventListener(recipeStorageEvent, refreshRecipes);

    return () => {
      window.removeEventListener("storage", refreshRecipes);
      window.removeEventListener(recipeStorageEvent, refreshRecipes);
    };
  }, [baseRecipes]);

  return useMemo(() => recipes, [recipes]);
}
