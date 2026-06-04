"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type DishCategory,
  type Ingredient,
  type IngredientCategory,
  type MealRole,
  type Recipe,
  type RecipeType,
  getDishCategoryLabel,
  getMealRoleLabel,
  getRecipeTypeLabel,
} from "@/lib/recipes";
import {
  clearStoredRecipes,
  createUniqueRecipeId,
  loadStoredRecipes,
  saveRecipesToStorage,
} from "@/lib/recipeStorage";

type RecipeManagerProps = {
  initialRecipes: Recipe[];
};

type RecipeFormState = {
  id: string;
  name: string;
  type: RecipeType;
  mealRole: MealRole;
  dishCategory: DishCategory;
  timeMinutes: string;
  hotcookSetting: string;
  hotcookMenuNumber: string;
  ingredientsText: string;
  stepsText: string;
  hotcookOperationText: string;
};

const importTimeMinutes = 30;
const requiredCsvColumns = [
  "name",
  "course",
  "category",
  "isHotcook",
  "hotcookMenuNo",
  "ingredients",
  "instructions",
];

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
    mealRole: "main",
    dishCategory: "meat",
    timeMinutes: "30",
    hotcookSetting: "手動 煮物を作る まぜる",
    hotcookMenuNumber: "",
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
    mealRole: recipe.mealRole,
    dishCategory: recipe.dishCategory,
    timeMinutes: String(recipe.timeMinutes),
    hotcookSetting: recipe.hotcookSetting,
    hotcookMenuNumber: recipe.hotcookMenuNumber ?? "",
    ingredientsText: recipe.ingredients
      .map((ingredient) => `${ingredient.name} / ${ingredient.amount} / ${ingredient.category}`)
      .join("\n"),
    stepsText: recipe.steps.join("\n"),
    hotcookOperationText: recipe.hotcookOperation.join("\n"),
  };
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

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === "\"") {
      if (insideQuotes && nextCharacter === "\"") {
        value += "\"";
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(value);
      if (row.some((cell) => cell.trim())) {
        rows.push(row);
      }
      row = [];
      value = "";
      continue;
    }

    value += character;
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) {
    rows.push(row);
  }

  return rows;
}

function normalizeCsvText(text: string) {
  return text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizeHeader(value: string) {
  return value.trim().replace(/^\uFEFF/, "");
}

function parseCourse(value: string): MealRole {
  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue === "副菜" || normalizedValue === "side" ? "side" : "main";
}

function parseDishCategory(value: string): DishCategory {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "魚料理" || normalizedValue === "魚" || normalizedValue === "fish") {
    return "fish";
  }

  if (normalizedValue === "野菜料理" || normalizedValue === "野菜" || normalizedValue === "vegetable") {
    return "vegetable";
  }

  return "meat";
}

function parseBoolean(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  return ["1", "true", "yes", "y", "はい", "あり", "○", "有"].includes(normalizedValue);
}

function csvRowsToRecipes(rows: string[]) {
  return rows
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", amount = "適量", category = "乾物・その他"] = line
        .split("/")
        .map((item) => item.trim());
      const safeCategory = ingredientCategories.includes(category as IngredientCategory)
        ? (category as IngredientCategory)
        : "乾物・その他";

      return {
        name,
        amount: amount || "適量",
        category: safeCategory,
      };
    })
    .filter((ingredient) => ingredient.name);
}

function createImportedRecipe(record: Record<string, string>, usedIds: Set<string>): Recipe | null {
  const name = record.name?.trim();
  if (!name) return null;

  const isHotcook = parseBoolean(record.isHotcook ?? "");
  const hotcookMenuNumber = record.hotcookMenuNo?.trim();
  const instructionLines = parseLines(record.instructions ?? "");
  const ingredientLines = parseLines(record.ingredients ?? "");

  return {
    id: createUniqueRecipeId(name, usedIds),
    name,
    type: "regular",
    mealRole: parseCourse(record.course ?? ""),
    dishCategory: parseDishCategory(record.category ?? ""),
    description: "CSVインポートで登録した料理。",
    servings: 4,
    timeMinutes: importTimeMinutes,
    hotcookSetting: isHotcook ? "ホットクック調理" : "通常調理",
    hotcookMenuNumber: hotcookMenuNumber || undefined,
    hotcookOperation: isHotcook
      ? ["CSVの作り方に沿って準備する。", "ホットクックで加熱する。"]
      : ["CSVの作り方に沿って調理する。"],
    ingredients: csvRowsToRecipes(ingredientLines),
    steps: instructionLines.length > 0 ? instructionLines : ["CSVの作り方を確認する。"],
  };
}

function parseRecipesFromCsv(text: string, usedRecipeIds: Iterable<string> = []) {
  const rows = parseCsv(normalizeCsvText(text));
  const [headerRow, ...bodyRows] = rows;
  const usedIds = new Set(usedRecipeIds);

  if (!headerRow) {
    throw new Error("CSVにヘッダー行がありません。");
  }

  const headers = headerRow.map(normalizeHeader);
  const missingColumns = requiredCsvColumns.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    throw new Error(`CSV列が不足しています: ${missingColumns.join(", ")}`);
  }

  return bodyRows
    .map((row) => {
      const record = Object.fromEntries(
        headers.map((header, index) => [header, row[index]?.trim() ?? ""]),
      );
      const recipe = createImportedRecipe(record, usedIds);
      if (recipe) {
        usedIds.add(recipe.id);
      }
      return recipe;
    })
    .filter((recipe): recipe is Recipe => recipe !== null);
}

function formToRecipe(form: RecipeFormState, existingId?: string, usedRecipeIds: Iterable<string> = []): Recipe {
  const name = form.name.trim();
  const id = existingId || form.id || createUniqueRecipeId(name, usedRecipeIds);

  return {
    id,
    name,
    type: form.type,
    mealRole: form.mealRole,
    dishCategory: form.dishCategory,
    description:
      form.type === "freezer-kit"
        ? "ユーザー登録の冷凍ミールキット料理。"
        : "ユーザー登録の通常料理。",
    servings: 4,
    timeMinutes: Number(form.timeMinutes) || 30,
    hotcookSetting: form.hotcookSetting.trim(),
    hotcookMenuNumber: form.hotcookMenuNumber.trim() || undefined,
    hotcookOperation: parseLines(form.hotcookOperationText),
    ingredients: parseIngredients(form.ingredientsText),
    steps: parseLines(form.stepsText),
  };
}

export default function RecipeManager({ initialRecipes }: RecipeManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("管理画面を開くにはパスワードを入力してください。");
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [form, setForm] = useState<RecipeFormState>(createBlankForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | RecipeType>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | MealRole>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | DishCategory>("all");
  const [status, setStatus] = useState("初期データを読み込みました。");

  useEffect(() => {
    const nextRecipes = loadStoredRecipes(initialRecipes);
    if (nextRecipes === initialRecipes) {
      return;
    }

    setRecipes(nextRecipes);
    setStatus("保存済みの料理マスターを読み込みました。");
  }, []);

  function persist(nextRecipes: Recipe[], message: string) {
    setRecipes(nextRecipes);
    saveRecipesToStorage(nextRecipes);
    setStatus(message);
  }

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesType = typeFilter === "all" || recipe.type === typeFilter;
      const matchesRole = roleFilter === "all" || recipe.mealRole === roleFilter;
      const matchesCategory = categoryFilter === "all" || recipe.dishCategory === categoryFilter;
      const matchesQuery =
        !normalizedQuery ||
        recipe.name.toLowerCase().includes(normalizedQuery) ||
        recipe.hotcookSetting.toLowerCase().includes(normalizedQuery) ||
        (recipe.hotcookMenuNumber ?? "").toLowerCase().includes(normalizedQuery);

      return matchesType && matchesRole && matchesCategory && matchesQuery;
    });
  }, [categoryFilter, query, recipes, roleFilter, typeFilter]);

  const freezerCount = recipes.filter((recipe) => recipe.type === "freezer-kit").length;
  const regularCount = recipes.filter((recipe) => recipe.type === "regular").length;
  const isEditing = editingId !== null;

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { ok?: boolean };

      if (result.ok) {
        setAuthenticated(true);
        setAuthMessage("認証しました。");
        return;
      }

      setAuthMessage("パスワードが違います。");
    } catch {
      setAuthMessage("認証に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setAuthLoading(false);
    }
  }

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

    const usedRecipeIds = recipes
      .filter((current) => current.id !== editingId)
      .map((current) => current.id);
    const recipe = formToRecipe(form, editingId ?? undefined, usedRecipeIds);

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

    clearStoredRecipes();
    setRecipes(initialRecipes);
    setEditingId(null);
    setForm(createBlankForm());
    setStatus("初期データに戻しました。");
  }

  async function handleCsvImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const text = await file.text();
      const importedRecipes = parseRecipesFromCsv(text, recipes.map((recipe) => recipe.id));

      if (importedRecipes.length === 0) {
        setStatus("取り込める料理がありませんでした。");
        return;
      }

      const existingNames = new Set(recipes.map((recipe) => recipe.name));
      const duplicateNames = importedRecipes
        .filter((recipe) => existingNames.has(recipe.name))
        .map((recipe) => recipe.name);

      if (duplicateNames.length > 0) {
        const ok = window.confirm(
          `同名の料理が ${duplicateNames.length} 件あります。上書きしますか？\n${duplicateNames.join("\n")}`,
        );
        if (!ok) {
          setStatus("CSV取り込みをキャンセルしました。");
          return;
        }
      }

      const importedByName = new Map(importedRecipes.map((recipe) => [recipe.name, recipe]));
      const nextRecipes = [
        ...recipes.map((recipe) => {
          const importedRecipe = importedByName.get(recipe.name);
          if (!importedRecipe) return recipe;
          importedByName.delete(recipe.name);
          return { ...importedRecipe, id: recipe.id };
        }),
        ...Array.from(importedByName.values()),
      ];

      persist(nextRecipes, `${importedRecipes.length}件の料理をCSVから取り込みました。`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "CSVを読み込めませんでした。");
    }
  }

  if (!authenticated) {
    return (
      <form className="authPanel" onSubmit={handleAuthSubmit}>
        <div>
          <p className="eyebrow">管理者認証</p>
          <h2>パスワード入力</h2>
          <p>{authMessage}</p>
        </div>
        <label>
          <span>パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button type="submit" disabled={authLoading}>
          {authLoading ? "確認中" : "管理画面を開く"}
        </button>
      </form>
    );
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
          <label>
            <span>主菜/副菜</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as "all" | MealRole)}
            >
              <option value="all">すべて</option>
              <option value="main">主菜</option>
              <option value="side">副菜</option>
            </select>
          </label>
          <label>
            <span>料理カテゴリ</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as "all" | DishCategory)}
            >
              <option value="all">すべて</option>
              <option value="meat">肉料理</option>
              <option value="fish">魚料理</option>
              <option value="vegetable">野菜料理</option>
            </select>
          </label>
        </div>

        <div className="managerActions">
          <button type="button" onClick={handleNew}>
            新規追加
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            CSV取込
          </button>
          <button type="button" className="ghostButton" onClick={handleReset}>
            初期化
          </button>
        </div>
        <input
          ref={fileInputRef}
          className="hiddenFileInput"
          type="file"
          accept=".csv,text/csv"
          onChange={handleCsvImport}
        />
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
            <span>主菜/副菜</span>
            <select
              value={form.mealRole}
              onChange={(event) => updateForm("mealRole", event.target.value as MealRole)}
            >
              <option value="main">主菜</option>
              <option value="side">副菜</option>
            </select>
          </label>
          <label>
            <span>料理カテゴリ</span>
            <select
              value={form.dishCategory}
              onChange={(event) => updateForm("dishCategory", event.target.value as DishCategory)}
            >
              <option value="meat">肉料理</option>
              <option value="fish">魚料理</option>
              <option value="vegetable">野菜料理</option>
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
          <span>ホットクックメニュー番号</span>
          <input
            value={form.hotcookMenuNumber}
            onChange={(event) => updateForm("hotcookMenuNumber", event.target.value)}
            placeholder="任意入力"
          />
          <small>番号がない料理は空欄のまま登録できます。</small>
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
              <div className="pillRow">
                <span className={`modePill ${recipe.type}`}>{getRecipeTypeLabel(recipe.type)}</span>
                <span className="modePill neutral">{getMealRoleLabel(recipe.mealRole)}</span>
                <span className="modePill neutral">{getDishCategoryLabel(recipe.dishCategory)}</span>
              </div>
              <h2>{recipe.name}</h2>
              <small>
                {recipe.timeMinutes}分 / {recipe.hotcookSetting}
                {recipe.hotcookMenuNumber ? ` / メニュー番号 ${recipe.hotcookMenuNumber}` : ""}
              </small>
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
