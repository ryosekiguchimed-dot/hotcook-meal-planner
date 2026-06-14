"use client";

import Link from "next/link";
import { addDays, getShoppingListForWeek, getWeekLabel, getWeekStart, mealPlanWeeks } from "@/lib/mealPlans";
import { getMealPlanByStart, getRequiredRecipeType, hydrateMealPlanWeek, useStoredMealPlans } from "@/lib/mealPlanStorage";
import { recipes as initialRecipes } from "@/lib/recipes";
import { useStoredRecipes } from "@/lib/recipeStorage";

type ShoppingListClientProps = {
  selectedDate: string;
};

export default function ShoppingListClient({ selectedDate }: ShoppingListClientProps) {
  const recipes = useStoredRecipes(initialRecipes).filter((recipe) => recipe.id !== "no-meal");
  const mealPlans = useStoredMealPlans(mealPlanWeeks);
  const selectedWeekStart = getWeekStart(selectedDate);
  const weekPlan = hydrateMealPlanWeek(getMealPlanByStart(mealPlans, selectedWeekStart), recipes);
  const groups = getShoppingListForWeek(weekPlan);
  const freezerKitRecipes = weekPlan.days.filter((day) => day.recipe && getRequiredRecipeType(day) === "freezer-kit");

  return (
    <main className="screen withBottomNav">
      <header className="pageHeader">
        <Link className="backLink" href="/">← トップ</Link>
        <p className="eyebrow">{getWeekLabel(selectedWeekStart)}の材料を自動集計</p>
        <h1>買い物リスト</h1>
        <p className="lead compact">選択中の週の献立から材料をカテゴリ別に集計します。献立不要の日は含みません。</p>
        <div className="weekNavigation">
          <Link href={`/shopping-list?date=${addDays(selectedWeekStart, -7)}`}>前の週</Link>
          <Link href="/shopping-list">今週へ戻る</Link>
          <Link href={`/shopping-list?date=${addDays(selectedWeekStart, 7)}`}>次の週</Link>
        </div>
      </header>

      <section className="prepBox">
        <h2>冷凍ミールキット準備</h2>
        <p>選択中の週で必要な分をまとめて準備</p>
        <div className="prepTags">
          {freezerKitRecipes.length ? freezerKitRecipes.map((day) => <span key={day.day}>{day.day}: {day.recipe?.name}</span>) : <span>対象の料理はありません</span>}
        </div>
      </section>

      <section className="shoppingList categorized" aria-label="買い物リスト">
        {groups.length ? groups.map((group) => (
          <article className="categoryGroup" key={group.category}>
            <h2>{group.category}</h2>
            <div className="categoryItems">
              {group.items.map((item) => (
                <label className="shoppingItem" key={item.name}>
                  <input type="checkbox" />
                  <span><strong>{item.name}</strong><small>{item.amounts.join(" / ")}</small></span>
                </label>
              ))}
            </div>
          </article>
        )) : <p className="emptyMessage">この週には買い物が必要な献立がありません。</p>}
      </section>

      <nav className="bottomNav">
        <Link href="/">トップ</Link>
        <Link href={`/menu?date=${selectedWeekStart}`}>献立</Link>
        <Link aria-current="page" href={`/shopping-list?date=${selectedWeekStart}`}>買い物</Link>
        <Link href="/recipes">料理一覧</Link>
        <Link href="/recipes/manage">料理管理</Link>
      </nav>
    </main>
  );
}
