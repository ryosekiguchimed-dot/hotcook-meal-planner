import { useEffect, useMemo, useState } from "react";
import {
  recipes as initialRecipes,
  type Ingredient,
  type IngredientCategory,
  type Recipe,
} from "./recipes";

export const recipeStorageKey = "hotcook-meal-planner.recipes.v1";
export const recipeStorageEvent = "hotcook-meal-planner:recipes-updated";

type StoredRecipe = Omit<Recipe, "id"> & { id?: string };
type StoredIngredient = Partial<Ingredient> & { name?: string; amount?: string; category?: string };

const ingredientCategoryAliases: Record<string, IngredientCategory> = {
  肉: "肉・魚",
  魚: "肉・魚",
  "肉・魚": "肉・魚",
  肉魚: "肉・魚",
  野菜: "野菜",
  きのこ: "きのこ・豆",
  キノコ: "きのこ・豆",
  豆: "きのこ・豆",
  "きのこ・豆": "きのこ・豆",
  きのこ豆: "きのこ・豆",
  卵: "卵・乳製品",
  乳製品: "卵・乳製品",
  "卵・乳製品": "卵・乳製品",
  調味料: "調味料",
  乾物: "乾物・その他",
  その他: "乾物・その他",
  "乾物・その他": "乾物・その他",
};

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

function normalizeIngredientCategory(value: string | undefined) {
  const normalizedValue = value?.trim();
  if (!normalizedValue) return undefined;

  return ingredientCategoryAliases[normalizedValue];
}

function inferIngredientCategory(name: string): IngredientCategory {
  const normalizedName = name.trim();
  const aliasCategory = normalizeIngredientCategory(normalizedName);

  if (aliasCategory) return aliasCategory;
  if (/(肉|牛|豚|鶏|魚|鮭|さば|鯖|ぶり|あさり|シーフード)/.test(normalizedName)) return "肉・魚";
  if (/(玉ねぎ|玉葱|にんじん|人参|大根|白菜|キャベツ|ねぎ|長ねぎ|ピーマン|なす|ブロッコリー|トマト|じゃがいも|かぼちゃ|れんこん|野菜)/.test(normalizedName)) return "野菜";
  if (/(きのこ|しめじ|えのき|まいたけ|しいたけ|豆|豆腐|ミックスビーンズ)/.test(normalizedName)) return "きのこ・豆";
  if (/(卵|牛乳|バター|チーズ|乳)/.test(normalizedName)) return "卵・乳製品";
  if (/(しょうゆ|醤油|みそ|味噌|塩|砂糖|酒|みりん|酢|油|ごま油|コンソメ|だし|ルウ|ケチャップ|ソース|カレー粉|調味料)/.test(normalizedName)) return "調味料";

  return "乾物・その他";
}

function normalizeIngredient(ingredient: StoredIngredient): Ingredient | null {
  const name = ingredient.name?.trim();
  if (!name) return null;

  return {
    name,
    amount: ingredient.amount?.trim() || "適量",
    category: normalizeIngredientCategory(ingredient.category) ?? inferIngredientCategory(name),
  };
}

export function normalizeStoredRecipe(recipe: StoredRecipe): Recipe {
  return {
    ...recipe,
    id: recipe.id ?? createUniqueRecipeId(recipe.name),
    mealRole: recipe.mealRole ?? "main",
    dishCategory: recipe.dishCategory ?? "meat",
    hotcookMenuNumber: recipe.hotcookMenuNumber || undefined,
    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients
          .map((ingredient) => normalizeIngredient(ingredient as StoredIngredient))
          .filter((ingredient): ingredient is Ingredient => ingredient !== null)
      : [],
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
    if (Array.isArray(parsed)) {
      const normalizedStoredRecipes = ensureRecipeIds(parsed, baseRecipes).map(normalizeStoredRecipe);
      const normalizedSaved = JSON.stringify(normalizedStoredRecipes);
      if (hasMissingRecipeIds(parsed) || normalizedSaved !== saved) {
        storage.setItem(recipeStorageKey, normalizedSaved);
      }

      return mergeRecipes(baseRecipes, normalizedStoredRecipes);
    }

    return baseRecipes;
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
