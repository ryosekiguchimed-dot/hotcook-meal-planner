import Link from "next/link";
import { getMealPlanWeek, mealPlanWeeks } from "@/lib/mealPlans";

export default function HistoryPage() {
  return (
    <main className="screen withBottomNav">
      <header className="pageHeader">
        <Link className="backLink" href="/">
          ← トップ
        </Link>
        <p className="eyebrow">将来は全履歴を保存</p>
        <h1>献立履歴</h1>
        <p className="lead compact">
          まずは先週・今週・来週の固定データを表示します。週IDを持たせているので、保存対象を増やせます。
        </p>
      </header>

      <div className="mealCards">
        {mealPlanWeeks.map((week) => {
          const hydratedWeek = getMealPlanWeek(week.key);

          return (
            <article className="mealCard" key={week.id}>
              <div className="mealTop">
                <div>
                  <p className="eyebrow">{week.startsOn}開始</p>
                  <h2>{week.label}</h2>
                </div>
                <Link className="inlineButton compact" href={`/menu?week=${week.key}`}>
                  献立を見る
                </Link>
              </div>
              <div className="historyDays">
                {hydratedWeek.days.map((day) => (
                  <Link href={`/recipes/${day.recipe.id}`} key={day.day}>
                    <span className="dayBadge">{day.day}</span>
                    <strong>{day.recipe.name}</strong>
                  </Link>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <nav className="bottomNav">
        <Link href="/">トップ</Link>
        <Link href="/menu">献立</Link>
        <Link href="/shopping-list">買い物</Link>
        <Link href="/recipes">料理一覧</Link>
        <Link href="/recipes/manage">料理管理</Link>
      </nav>
    </main>
  );
}
