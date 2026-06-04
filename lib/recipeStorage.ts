import { useEffect, useMemo, useState } from "react";
import { recipes as initialRecipes, type Recipe } from "./recipes";

export const recipeStorageKey = "hotcook-meal-planner.recipes.v1";
export const recipeStorageEvent = "hotcook-meal-planner:recipes-updated";

type StoredRecipe = Omit<Recipe, "id"> & { id?: string };

export function createRecipeSlug(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "recipe"
  );
}

export function createUniqueRecipeId(name: string, usedIds: Iterable<string> = []) {
  const baseSlug = createRecipeSlug(name);
  const usedIdSet = new Set(usedIds);
  let nextId = baseSlug;
  let suffix = 2;

  while (usedIdSet.has(nextId)) {
    nextId = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return nextId;
}

export function ensureRecipeIds(storedRecipes: StoredRecipe[], baseRecipes: Recipe[] = []) {
  const baseIds = new Set(baseRecipes.map((recipe) => recipe.id));
  const usedIds = new Set<string>();

  return storedRecipes.map((recipe) => {
    const candidateId = recipe.id?.trim();
    const missingIdUsedIds = new Set([...baseIds, ...usedIds]);
    const id = candidateId && !usedIds.has(candidateId)
      ? candidateId
      : createUniqueRecipeId(recipe.name, missingIdUsedIds);

    usedIds.add(id);
    return { ...recipe, id };
  });
}

export function normalizeStoredRecipe(recipe: StoredRecipe): Recipe {
  return {
    ...recipe,
    id: recipe.id ?? createUniqueRecipeId(recipe.name),
    mealRole: recipe.mealRole ?? "main",
    dishCategory: recipe.dishCategory ?? "meat",
    hotcookMenuNumber: recipe.hotcookMenuNumber || undefined,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    hotcookOperation: Array.isArray(recipe.hotcookOperation) ? recipe.hotcookOperation : [],
  };
}

export function mergeRecipes(baseRecipes: Recipe[], storedRecipes: StoredRecipe[]) {
  const merged = baseRecipes.map(normalizeStoredRecipe);
  const normalizedStoredRecipes = ensureRecipeIds(storedRecipes, baseRecipes).map(normalizeStoredRecipe);

  for (const storedRecipe of normalizedStoredRecipes) {
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

function hasMissingRecipeIds(recipes: StoredRecipe[]) {
  return recipes.some((recipe) => !recipe.id?.trim());
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

    const parsed = JSON.parse(saved) as StoredRecipe[];
    if (Array.isArray(parsed) && hasMissingRecipeIds(parsed)) {
      const normalizedStoredRecipes = ensureRecipeIds(parsed, baseRecipes).map(normalizeStoredRecipe);
      storage.setItem(recipeStorageKey, JSON.stringify(normalizedStoredRecipes));
      return mergeRecipes(baseRecipes, normalizedStoredRecipes);
    }

    return Array.isArray(parsed) ? mergeRecipes(baseRecipes, parsed) : baseRecipes;
  } catch {
    return baseRecipes;
  }
}

export function saveRecipesToStorage(recipes: Recipe[]) {
  const recipesWithIds = ensureRecipeIds(recipes).map(normalizeStoredRecipe);
  const storage = getBrowserStorage();
  if (storage) {
    storage.setItem(recipeStorageKey, JSON.stringify(recipesWithIds));
  }

  window.dispatchEvent(new CustomEvent(recipeStorageEvent, { detail: recipesWithIds }));
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
