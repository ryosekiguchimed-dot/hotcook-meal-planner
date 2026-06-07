"use client";

import Link from "next/link";
import { getShoppingListForWeek, mealPlanWeeks, type WeekKey } from "@/lib/mealPlans";
import { getHydratedMealPlanByKey, useStoredMealPlans } from "@/lib/mealPlanStorage";
import { withNoMealRecipe } from "@/lib/noMealRecipe";
import { recipes as initialRecipes } from "@/lib/recipes";
import { useStoredRecipes } from "@/lib/recipeStorage";

type ShoppingListClientProps = { weekKey: WeekKey };

export default function ShoppingListClient({ weekKey }: ShoppingListClientProps) {
  const recipes = withNoMealRecipe(useStoredRecipes(initialRecipes));
  const mealPlans = useStoredMealPlans(mealPlanWeeks);
  const weekPlan = getHydratedMealPlanByKey(mealPlans, weekKey, recipes);
  const groups = getShoppingListForWeek(weekPlan);
  const freezerKitRecipes = weekPlan.days.filter((day) => day.recipe.type === "freezer-kit");

  return (
    <main className="screen withBottomNav">
      <header className="pageHeader">
        <Link className="backLink" href="/">← トップ</Link>
        <p className="eyebrow">{weekPlan.label}の材料を自動集計</p>
        <h1>今週の買い物リスト</h1>
        <p className="lead compact">選択された1週間分の献立から材料をカテゴリ別に集計します。</p>
        <div className="segmentedLinks" aria-label="週の切り替え">
          <Link aria-current={weekKey === "last" ? "page" : undefined} href="/shopping-list?week=last">先週</Link>
          <Link aria-current={weekKey === "current" ? "page" : undefined} href="/shopping-list">今週</Link>
          <Link aria-current={weekKey === "next" ? "page" : undefined} href="/shopping-list?week=next">来週</Link>
        </div>
      </header>
      <section className="prepBox"><h2>冷凍ミールキット準備日</h2><p>月火木金の4袋をまとめて作成</p><div className="prepTags">{freezerKitRecipes.map((day) => <span key={day.day}>{day.day}: {day.recipe.name}</span>)}</div></section>
      <section className="shoppingList categorized" aria-label="買い物リスト">
        {groups.map((group) => <article className="categoryGroup" key={group.category}><h2>{group.category}</h2><div className="categoryItems">{group.items.map((item) => <label className="shoppingItem" key={item.name}><input type="checkbox" /><span><strong>{item.name}</strong><small>{item.amounts.join(" / ")}</small></span></label>)}</div></article>)}
      </section>
      <nav className="bottomNav"><Link href="/">トップ</Link><Link href={`/menu?week=${weekKey}`}>献立</Link><Link aria-current="page" href="/shopping-list">買い物</Link><Link href="/recipes">料理一覧</Link><Link href="/recipes/manage">料理管理</Link></nav>
    </main>
  );
}
