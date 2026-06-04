"use client";

import Link from "next/link";
import { getShoppingListForWeek, mealPlanWeeks } from "@/lib/mealPlans";
import { getHydratedMealPlanByKey, useStoredMealPlans } from "@/lib/mealPlanStorage";
import { recipes as initialRecipes } from "@/lib/recipes";
import { useStoredRecipes } from "@/lib/recipeStorage";

export default function HomeClient() {
  const recipes = useStoredRecipes(initialRecipes);
  const mealPlans = useStoredMealPlans(mealPlanWeeks);
  const weekPlan = getHydratedMealPlanByKey(mealPlans, "current", recipes);
  const freezerKitDays = weekPlan.days.filter((day) => day.recipe.type === "freezer-kit");
  const cookingDays = weekPlan.days.filter((day) => day.recipe.type === "regular");
  const shoppingCount = getShoppingListForWeek(weekPlan).reduce(
    (total, group) => total + group.items.length,
    0,
  );

  return (
    <main className="screen">
      <section className="hero">
        <p className="eyebrow">4人家族向け MVP</p>
        <h1>今週の夕飯をホットクック中心でまとめて準備</h1>
        <p className="lead">
          平日は冷凍ミールキットで迷わず調理。水土日は通常調理で、買い物も一括リスト化します。
        </p>
        <div className="actions">
          <Link className="primaryButton" href="/menu">
            今週の献立を見る
          </Link>
          <Link className="secondaryButton" href="/shopping-list">
            買い物リスト
          </Link>
        </div>
        <div className="actions tertiary">
          <Link className="secondaryButton" href="/recipes">
            料理リスト
          </Link>
          <Link className="secondaryButton" href="/history">
            献立履歴
          </Link>
        </div>
        <div className="actions tertiary singleAction">
          <Link className="secondaryButton" href="/recipes/manage">
            料理を管理する
          </Link>
        </div>
      </section>

      <section className="quickStats" aria-label="今週の概要">
        <div>
          <strong>{weekPlan.days.length}</strong>
          <span>日分の夕食</span>
        </div>
        <div>
          <strong>{freezerKitDays.length}</strong>
          <span>冷凍キット</span>
        </div>
        <div>
          <strong>{cookingDays.length}</strong>
          <span>通常調理</span>
        </div>
        <div>
          <strong>{recipes.length}</strong>
          <span>登録料理</span>
        </div>
        <div>
          <strong>{mealPlanWeeks.length}</strong>
          <span>履歴週</span>
        </div>
      </section>

      <section className="quickStats compactStats" aria-label="買い物概要">
        <div>
          <strong>{shoppingCount}</strong>
          <span>買い物項目</span>
        </div>
        <div>
          <strong>4</strong>
          <span>重複防止週</span>
        </div>
        <div>
          <strong>{recipes.length}</strong>
          <span>参照レシピ数</span>
        </div>
        <div>
          <strong>3</strong>
          <span>表示できる週</span>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <p className="eyebrow">今夜から使える</p>
          <h2>週の流れ</h2>
        </div>
        <div className="timeline">
          {weekPlan.days.map((day) => (
            <Link className="dayRow" href={`/recipes/${day.recipe.id}`} key={day.day}>
              <div>
                <span className="dayBadge">{day.day}</span>
                <span className={`modePill ${day.recipe.type}`}>
                  {day.recipe.type === "freezer-kit" ? "冷凍ミールキット" : "通常料理"}
                </span>
              </div>
              <strong>{day.recipe.name}</strong>
              <small>
                {day.recipe.timeMinutes}分 / {day.recipe.hotcookSetting}
                {day.recipe.hotcookMenuNumber ? ` / メニュー番号 ${day.recipe.hotcookMenuNumber}` : ""}
              </small>
            </Link>
          ))}
        </div>
      </section>

      <nav className="bottomNav">
        <Link aria-current="page" href="/">トップ</Link>
        <Link href="/menu">献立</Link>
        <Link href="/shopping-list">買い物</Link>
        <Link href="/recipes">料理一覧</Link>
        <Link href="/recipes/manage">料理管理</Link>
      </nav>
    </main>
  );
}
