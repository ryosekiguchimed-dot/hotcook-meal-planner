"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  getDishCategoryLabel,
  getMealRoleLabel,
  getRecipeTypeLabel,
  recipes as initialRecipes,
} from "@/lib/recipes";
import { useStoredRecipes } from "@/lib/recipeStorage";

export default function RecipesListClient() {
  const recipes = useStoredRecipes(initialRecipes);
  const [query, setQuery] = useState("");
  const filteredRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return recipes;

    return recipes.filter((recipe) =>
      [
        recipe.name,
        recipe.hotcookSetting,
        recipe.hotcookMenuNumber ?? "",
        ...recipe.ingredients.map((ingredient) => ingredient.name),
      ].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, recipes]);
  const freezerRecipes = filteredRecipes.filter((recipe) => recipe.type === "freezer-kit");
  const regularRecipes = filteredRecipes.filter((recipe) => recipe.type === "regular");

  return (
    <main className="screen withBottomNav">
      <header className="pageHeader">
        <Link className="backLink" href="/">
          ← トップ
        </Link>
        <p className="eyebrow">登録料理 {recipes.length}品</p>
        <h1>料理リスト</h1>
        <div className="actions tertiary">
          <Link className="primaryButton" href="/recipes/manage">
            料理マスター管理
          </Link>
          <Link className="secondaryButton" href="/history">
            献立履歴
          </Link>
        </div>
      </header>

      <section className="managerPanel recipeSearchPanel">
        <label>
          <span>料理を検索</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="料理名・材料・ホットクック設定"
          />
        </label>
        <p className="formStatus">{filteredRecipes.length}品を表示中</p>
      </section>

      <section className="recipeListSection">
        <div className="sectionHeader">
          <p className="eyebrow">平日用</p>
          <h2>冷凍ミールキット</h2>
        </div>
        <div className="timeline">
          {freezerRecipes.map((recipe) => (
            <Link className="dayRow" href={`/recipes/${recipe.id}`} key={recipe.id}>
              <div className="pillRow">
                <span className={`modePill ${recipe.type}`}>{getRecipeTypeLabel(recipe.type)}</span>
                <span className="modePill neutral">{getMealRoleLabel(recipe.mealRole)}</span>
                <span className="modePill neutral">{getDishCategoryLabel(recipe.dishCategory)}</span>
              </div>
              <strong>{recipe.name}</strong>
              <small>
                {recipe.timeMinutes}分 / {recipe.hotcookSetting}
                {recipe.hotcookMenuNumber ? ` / メニュー番号 ${recipe.hotcookMenuNumber}` : ""}
              </small>
            </Link>
          ))}
          {freezerRecipes.length === 0 ? <p className="emptyMessage">該当する冷凍ミールキットはありません。</p> : null}
        </div>
      </section>

      <section className="recipeListSection">
        <div className="sectionHeader">
          <p className="eyebrow">水土日用</p>
          <h2>通常料理</h2>
        </div>
        <div className="timeline">
          {regularRecipes.map((recipe) => (
            <Link className="dayRow" href={`/recipes/${recipe.id}`} key={recipe.id}>
              <div className="pillRow">
                <span className={`modePill ${recipe.type}`}>{getRecipeTypeLabel(recipe.type)}</span>
                <span className="modePill neutral">{getMealRoleLabel(recipe.mealRole)}</span>
                <span className="modePill neutral">{getDishCategoryLabel(recipe.dishCategory)}</span>
              </div>
              <strong>{recipe.name}</strong>
              <small>
                {recipe.timeMinutes}分 / {recipe.hotcookSetting}
                {recipe.hotcookMenuNumber ? ` / メニュー番号 ${recipe.hotcookMenuNumber}` : ""}
              </small>
            </Link>
          ))}
          {regularRecipes.length === 0 ? <p className="emptyMessage">該当する通常料理はありません。</p> : null}
        </div>
      </section>

      <nav className="bottomNav">
        <Link href="/">トップ</Link>
        <Link href="/menu">献立</Link>
        <Link href="/shopping-list">買い物</Link>
        <Link aria-current="page" href="/recipes">料理一覧</Link>
        <Link href="/recipes/manage">料理管理</Link>
      </nav>
    </main>
  );
}
