"use client";

import Link from "next/link";
import { getMealPlanWeek, type WeekKey } from "@/lib/mealPlans";
import { recipes as initialRecipes } from "@/lib/recipes";
import { useStoredRecipes } from "@/lib/recipeStorage";

type MenuClientProps = {
  weekKey: WeekKey;
};

export default function MenuClient({ weekKey }: MenuClientProps) {
  const recipes = useStoredRecipes(initialRecipes);
  const weekPlan = getMealPlanWeek(weekKey, recipes);

  return (
    <main className="screen">
      <header className="pageHeader">
        <Link className="backLink" href="/">
          ← トップ
        </Link>
        <p className="eyebrow">{weekPlan.label}の夕食献立</p>
        <h1>ホットクック週間プラン</h1>
        <div className="segmentedLinks" aria-label="週の切り替え">
          <Link aria-current={weekKey === "last" ? "page" : undefined} href="/menu?week=last">
            先週
          </Link>
          <Link aria-current={weekKey === "current" ? "page" : undefined} href="/menu">
            今週
          </Link>
          <Link aria-current={weekKey === "next" ? "page" : undefined} href="/menu?week=next">
            来週
          </Link>
        </div>
      </header>

      <div className="mealCards">
        {weekPlan.days.map((day) => (
          <article className="mealCard" key={day.day}>
            <div className="mealTop">
              <div>
                <span className="dayBadge large">{day.day}</span>
                <h2>{day.recipe.name}</h2>
              </div>
              <span className={`modePill ${day.recipe.type}`}>
                {day.recipe.type === "freezer-kit" ? "冷凍キット" : "通常料理"}
              </span>
            </div>

            <p className="description">{day.recipe.description}</p>

            <div className="infoGrid">
              <div>
                <span>人数</span>
                <strong>{day.recipe.servings}人分</strong>
              </div>
              <div>
                <span>目安</span>
                <strong>{day.recipe.timeMinutes}分</strong>
              </div>
              <div>
                <span>設定</span>
                <strong>{day.recipe.hotcookSetting}</strong>
              </div>
              {day.recipe.hotcookMenuNumber ? (
                <div>
                  <span>番号</span>
                  <strong>{day.recipe.hotcookMenuNumber}</strong>
                </div>
              ) : null}
            </div>

            <Link className="inlineButton" href={`/recipes/${day.recipe.id}`}>
              詳細を見る
            </Link>

            <section className="miniSection">
              <h3>材料</h3>
              <ul className="chipList">
                {day.recipe.ingredients.map((item) => (
                  <li key={item.name}>
                    {item.name} {item.amount}
                  </li>
                ))}
              </ul>
            </section>

            <section className="miniSection">
              <h3>ホットクック手順</h3>
              <ol className="steps">
                {day.recipe.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          </article>
        ))}
      </div>

      <nav className="bottomNav">
        <Link href="/">トップ</Link>
        <Link aria-current="page" href="/menu">献立</Link>
        <Link href={`/shopping-list?week=${weekKey}`}>買い物</Link>
        <Link href="/recipes">料理一覧</Link>
        <Link href="/recipes/manage">料理管理</Link>
      </nav>
    </main>
  );
}
