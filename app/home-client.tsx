"use client";

import Link from "next/link";
import { getCurrentWeekStart, getShoppingListForWeek, mealPlanWeeks } from "@/lib/mealPlans";
import { getMealPlanByStart, getRequiredRecipeType, hydrateMealPlanWeek, useStoredMealPlans } from "@/lib/mealPlanStorage";
import { recipes as initialRecipes } from "@/lib/recipes";
import { useStoredRecipes } from "@/lib/recipeStorage";

export default function HomeClient() {
  const recipes = useStoredRecipes(initialRecipes).filter((recipe) => recipe.id !== "no-meal");
  const mealPlans = useStoredMealPlans(mealPlanWeeks);
  const currentWeekStart = getCurrentWeekStart();
  const weekPlan = hydrateMealPlanWeek(getMealPlanByStart(mealPlans, currentWeekStart), recipes);
  const freezerKitDays = weekPlan.days.filter((day) => day.status !== "no-meal" && getRequiredRecipeType(day) === "freezer-kit");
  const cookingDays = weekPlan.days.filter((day) => day.status !== "no-meal" && getRequiredRecipeType(day) === "regular");
  const shoppingCount = getShoppingListForWeek(weekPlan).reduce((total, group) => total + group.items.length, 0);

  return (
    <main className="screen">
      <section className="hero">
        <p className="eyebrow">4人家族向け MVP</p>
        <h1>今週の夕飯をホットクック中心でまとめて準備</h1>
        <p className="lead">カレンダーから任意の週を選び、調理する日も献立不要の日もまとめて管理できます。</p>
        <div className="actions">
          <Link className="primaryButton" href="/menu">今週の献立を見る</Link>
          <Link className="secondaryButton" href="/shopping-list">買い物リスト</Link>
        </div>
        <div className="actions tertiary">
          <Link className="secondaryButton" href="/recipes">料理リスト</Link>
          <Link className="secondaryButton" href="/history">献立履歴</Link>
        </div>
        <div className="actions tertiary singleAction"><Link className="secondaryButton" href="/recipes/manage">料理を管理する</Link></div>
      </section>

      <section className="quickStats" aria-label="今週の概要">
        <div><strong>{weekPlan.days.filter((day) => day.status !== "no-meal").length}</strong><span>献立対象日</span></div>
        <div><strong>{freezerKitDays.length}</strong><span>冷凍キット</span></div>
        <div><strong>{cookingDays.length}</strong><span>通常調理</span></div>
        <div><strong>{recipes.length}</strong><span>登録料理</span></div>
      </section>
      <section className="quickStats compactStats" aria-label="買い物概要">
        <div><strong>{shoppingCount}</strong><span>買い物項目</span></div>
        <div><strong>4</strong><span>重複防止週</span></div>
        <div><strong>{mealPlans.length}</strong><span>保存済み週</span></div>
        <div><strong>{weekPlan.days.filter((day) => day.status === "no-meal").length}</strong><span>献立不要日</span></div>
      </section>

      <section className="section">
        <div className="sectionHeader"><p className="eyebrow">今週の予定</p><h2>週の流れ</h2></div>
        <div className="timeline">
          {weekPlan.days.map((day) => {
            const content = (
              <>
                <div><span className="dayBadge">{day.day}</span><span className={`modePill ${day.status === "no-meal" ? "neutral" : getRequiredRecipeType(day)}`}>{day.status === "no-meal" ? "献立不要" : getRequiredRecipeType(day) === "freezer-kit" ? "冷凍ミールキット" : "通常料理"}</span></div>
                <strong>{day.status === "no-meal" ? "献立不要" : day.recipe?.name ?? "料理未設定"}</strong>
                <small>{day.recipe ? `${day.recipe.timeMinutes}分 / ${day.recipe.hotcookSetting}` : "献立ページで設定できます"}</small>
              </>
            );
            return day.recipe && day.status !== "no-meal"
              ? <Link className="dayRow" href={`/recipes/${day.recipe.id}`} key={day.date}>{content}</Link>
              : <div className="dayRow" key={day.date}>{content}</div>;
          })}
        </div>
      </section>

      <nav className="bottomNav">
        <Link aria-current="page" href="/">トップ</Link><Link href="/menu">献立</Link><Link href="/shopping-list">買い物</Link><Link href="/recipes">料理一覧</Link><Link href="/recipes/manage">料理管理</Link>
      </nav>
    </main>
  );
}
