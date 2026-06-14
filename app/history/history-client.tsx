"use client";

import Link from "next/link";
import { mealPlanWeeks } from "@/lib/mealPlans";
import { hydrateMealPlanWeek, useStoredMealPlans } from "@/lib/mealPlanStorage";
import { recipes as initialRecipes } from "@/lib/recipes";
import { useStoredRecipes } from "@/lib/recipeStorage";

export default function HistoryClient() {
  const recipes = useStoredRecipes(initialRecipes).filter((recipe) => recipe.id !== "no-meal");
  const mealPlans = [...useStoredMealPlans(mealPlanWeeks)].sort((a, b) => b.startsOn.localeCompare(a.startsOn));

  return (
    <main className="screen withBottomNav">
      <header className="pageHeader">
        <Link className="backLink" href="/">← トップ</Link>
        <p className="eyebrow">過去も未来も端末に保存</p>
        <h1>献立履歴</h1>
        <p className="lead compact">カレンダーで作成・変更した週の献立を確認できます。</p>
      </header>

      <div className="mealCards">
        {mealPlans.map((week) => {
          const hydratedWeek = hydrateMealPlanWeek(week, recipes);
          return (
            <article className="mealCard" key={week.startsOn}>
              <div className="mealTop">
                <div><p className="eyebrow">{week.startsOn}開始</p><h2>{week.label}</h2></div>
                <Link className="inlineButton compact" href={`/menu?date=${week.startsOn}`}>献立を見る</Link>
              </div>
              <div className="historyDays">
                {hydratedWeek.days.map((day) => day.status === "no-meal" ? (
                  <div className="historyNoMeal" key={day.date}><span className="dayBadge">{day.day}</span><strong>献立不要</strong></div>
                ) : day.recipe ? (
                  <Link href={`/recipes/${day.recipe.id}`} key={day.date}><span className="dayBadge">{day.day}</span><strong>{day.recipe.name}</strong></Link>
                ) : (
                  <div className="historyNoMeal" key={day.date}><span className="dayBadge">{day.day}</span><strong>未設定</strong></div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <nav className="bottomNav">
        <Link href="/">トップ</Link><Link href="/menu">献立</Link><Link href="/shopping-list">買い物</Link><Link href="/recipes">料理一覧</Link><Link href="/recipes/manage">料理管理</Link>
      </nav>
    </main>
  );
}
