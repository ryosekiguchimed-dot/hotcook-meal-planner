"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Ingredient,
  type IngredientCategory,
  type Recipe,
  type RecipeType,
  getRecipeTypeLabel,
} from "@/lib/recipes";

type RecipeManagerProps = {
  initialRecipes: Recipe[];
};

type RecipeFormState = {
  id: string;
  name: string;
  type: RecipeType;
  timeMinutes: string;
  hotcookSetting: string;
  ingredientsText: string;
  stepsText: string;
  hotcookOperationText: string;
};

const storageKey = "hotcook-meal-planner.recipes.v1";

const ingredientCategories: IngredientCategory[] = [
  "肉・魚",
  "野菜",
  "きのこ・豆",
  "卵・乳製品",
  "調味料",
  "乾物・その他",
];

function createBlankForm(): RecipeFormState {
  return {
    id: "",
    name: "",
    type: "freezer-kit",
    timeMinutes: "30",
    hotcookSetting: "手動 煮物を作る まぜる",
    ingredientsText: "鶏もも肉 / 600g / 肉・魚\n玉ねぎ / 1個 / 野菜",
    stepsText: "材料を切る。\n内鍋に入れる。\nホットクックで加熱する。",
    hotcookOperationText: "まぜ技ユニットを取り付ける。\n内鍋を本体にセットする。\n指定のメニューで加熱する。",
  };
}

function recipeToForm(recipe: Recipe): RecipeFormState {
  return {
    id: recipe.id,
    name: recipe.name,
    type: recipe.type,
    timeMinutes: String(recipe.timeMinutes),
    hotcookSetting: recipe.hotcookSetting,
    ingredientsText: recipe.ingredients
      .map((ingredient) => `${ingredient.name} / ${ingredient.amount} / ${ingredient.category}`)
      .join("\n"),
    stepsText: recipe.steps.join("\n"),
    hotcookOperationText: recipe.hotcookOperation.join("\n"),
  };
}

function createRecipeId(name: string) {
  const fallback = `recipe-${Date.now()}`;
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}

function parseIngredients(value: string): Ingredient[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", amount = "", category = "乾物・その他"] = line
        .split("/")
        .map((item) => item.trim());
      const safeCategory = ingredientCategories.includes(category as IngredientCategory)
        ? (category as IngredientCategory)
        : "乾物・その他";

      return {
        name,
        amount,
        category: safeCategory,
      };
    })
    .filter((ingredient) => ingredient.name && ingredient.amount);
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function formToRecipe(form: RecipeFormState, existingId?: string): Recipe {
  const name = form.name.trim();
  const id = existingId || form.id || createRecipeId(name);

  return {
    id,
    name,
    type: form.type,
    description:
      form.type === "freezer-kit"
        ? "ユーザー登録の冷凍ミールキット料理。"
        : "ユーザー登録の通常料理。",
    servings: 4,
    timeMinutes: Number(form.timeMinutes) || 30,
    hotcookSetting: form.hotcookSetting.trim(),
    hotcookOperation: parseLines(form.hotcookOperationText),
    ingredients: parseIngredients(form.ingredientsText),
    steps: parseLines(form.stepsText),
  };
}

export default function RecipeManager({ initialRecipes }: RecipeManagerProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [form, setForm] = useState<RecipeFormState>(createBlankForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | RecipeType>("all");
  const [status, setStatus] = useState("初期データを読み込みました。");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Recipe[];
      if (Array.isArray(parsed)) {
        setRecipes(parsed);
        setStatus("保存済みの料理マスターを読み込みました。");
      }
    } catch {
      setStatus("保存済みデータを読み込めませんでした。初期データを表示しています。");
    }
  }, []);

  function persist(nextRecipes: Recipe[], message: string) {
    setRecipes(nextRecipes);
    window.localStorage.setItem(storageKey, JSON.stringify(nextRecipes));
    setStatus(message);
  }

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesType = typeFilter === "all" || recipe.type === typeFilter;
      const matchesQuery =
        !normalizedQuery ||
        recipe.name.toLowerCase().includes(normalizedQuery) ||
        recipe.hotcookSetting.toLowerCase().includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [query, recipes, typeFilter]);

  const freezerCount = recipes.filter((recipe) => recipe.type === "freezer-kit").length;
  const regularCount = recipes.filter((recipe) => recipe.type === "regular").length;
  const isEditing = editingId !== null;

  function updateForm<K extends keyof RecipeFormState>(key: K, value: RecipeFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleEdit(recipe: Recipe) {
    setEditingId(recipe.id);
    setForm(recipeToForm(recipe));
    setStatus(`${recipe.name} を編集中です。`);
  }

  function handleNew() {
    setEditingId(null);
    setForm(createBlankForm());
    setStatus("新規料理を入力できます。");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setStatus("料理名を入力してください。");
      return;
    }

    const recipe = formToRecipe(form, editingId ?? undefined);

    if (recipe.ingredients.length === 0) {
      setStatus("材料を1つ以上入力してください。");
      return;
    }

    const nextRecipes = editingId
      ? recipes.map((current) => (current.id === editingId ? recipe : current))
      : [...recipes, recipe];

    persist(nextRecipes, editingId ? `${recipe.name} を更新しました。` : `${recipe.name} を追加しました。`);
    setEditingId(recipe.id);
    setForm(recipeToForm(recipe));
  }

  function handleDelete(recipe: Recipe) {
    const ok = window.confirm(`${recipe.name} を削除しますか？`);
    if (!ok) return;

    const nextRecipes = recipes.filter((current) => current.id !== recipe.id);
    persist(nextRecipes, `${recipe.name} を削除しました。`);

    if (editingId === recipe.id) {
      handleNew();
    }
  }

  function handleReset() {
    const ok = window.confirm("この端末に保存した変更を消して、初期データに戻しますか？");
    if (!ok) return;

    window.localStorage.removeItem(storageKey);
    setRecipes(initialRecipes);
    setEditingId(null);
    setForm(createBlankForm());
    setStatus("初期データに戻しました。");
  }

  return (
    <div className="managerShell">
      <section className="quickStats managerStats" aria-label="料理マスター件数">
        <div>
          <strong>{recipes.length}</strong>
          <span>登録料理</span>
        </div>
        <div>
          <strong>{freezerCount}</strong>
          <span>冷凍キット</span>
        </div>
        <div>
          <strong>{regularCount}</strong>
          <span>通常料理</span>
        </div>
        <div>
          <strong>{filteredRecipes.length}</strong>
          <span>表示中</span>
        </div>
      </section>

      <section className="managerPanel">
        <div className="managerToolbar">
          <label>
            <span>検索</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="料理名・設定"
            />
          </label>
          <label>
            <span>種別</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "all" | RecipeType)}
            >
              <option value="all">すべて</option>
              <option value="freezer-kit">冷凍ミールキット</option>
              <option value="regular">通常料理</option>
            </select>
          </label>
        </div>

        <div className="managerActions">
          <button type="button" onClick={handleNew}>
            新規追加
          </button>
          <button type="button" className="ghostButton" onClick={handleReset}>
            初期化
          </button>
        </div>
      </section>

      <form className="recipeForm" onSubmit={handleSubmit}>
        <div className="formHeader">
          <div>
            <p className="eyebrow">{isEditing ? "編集" : "追加"}</p>
            <h2>{isEditing ? form.name || "料理を編集中" : "新しい料理"}</h2>
          </div>
          <button type="submit">{isEditing ? "更新" : "追加"}</button>
        </div>

        <label>
          <span>料理名</span>
          <input
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="例: 鶏ももトマト煮"
          />
        </label>

        <div className="formGrid">
          <label>
            <span>種別</span>
            <select
              value={form.type}
              onChange={(event) => updateForm("type", event.target.value as RecipeType)}
            >
              <option value="freezer-kit">冷凍ミールキット</option>
              <option value="regular">通常料理</option>
            </select>
          </label>
          <label>
            <span>調理時間</span>
            <input
              inputMode="numeric"
              value={form.timeMinutes}
              onChange={(event) => updateForm("timeMinutes", event.target.value)}
              placeholder="30"
            />
          </label>
        </div>

        <label>
          <span>ホットクック設定</span>
          <input
            value={form.hotcookSetting}
            onChange={(event) => updateForm("hotcookSetting", event.target.value)}
            placeholder="手動 煮物を作る まぜる"
          />
        </label>

        <label>
          <span>材料</span>
          <textarea
            value={form.ingredientsText}
            onChange={(event) => updateForm("ingredientsText", event.target.value)}
            rows={5}
          />
          <small>1行に「材料名 / 分量 / カテゴリ」。カテゴリ: {ingredientCategories.join("、")}</small>
        </label>

        <label>
          <span>作り方</span>
          <textarea
            value={form.stepsText}
            onChange={(event) => updateForm("stepsText", event.target.value)}
            rows={4}
          />
          <small>1行ずつ手順を入力します。</small>
        </label>

        <label>
          <span>ホットクック操作</span>
          <textarea
            value={form.hotcookOperationText}
            onChange={(event) => updateForm("hotcookOperationText", event.target.value)}
            rows={4}
          />
          <small>操作手順を1行ずつ入力します。</small>
        </label>

        <p className="formStatus" aria-live="polite">{status}</p>
      </form>

      <section className="managerList" aria-label="料理一覧">
        {filteredRecipes.map((recipe) => (
          <article className="managerRecipeRow" key={recipe.id}>
            <div>
              <span className={`modePill ${recipe.type}`}>{getRecipeTypeLabel(recipe.type)}</span>
              <h2>{recipe.name}</h2>
              <small>{recipe.timeMinutes}分 / {recipe.hotcookSetting}</small>
            </div>
            <div className="rowActions">
              <button type="button" onClick={() => handleEdit(recipe)}>
                編集
              </button>
              <button type="button" className="dangerButton" onClick={() => handleDelete(recipe)}>
                削除
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
