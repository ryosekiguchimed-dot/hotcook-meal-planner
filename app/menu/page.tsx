import Link from "next/link";
import { weekPlan } from "@/lib/mealPlan";

export default function MenuPage() {
  return (
    <main className="screen">
      <header className="pageHeader">
        <Link className="backLink" href="/">
          ← トップ
        </Link>
        <p className="eyebrow">1週間の夕食献立</p>
        <h1>ホットクック週間プラン</h1>
      </header>

      <div className="mealCards">
        {weekPlan.map((day) => (
          <article className="mealCard" key={day.day}>
            <div className="mealTop">
              <div>
                <span className="dayBadge large">{day.day}</span>
                <h2>{day.recipe.name}</h2>
              </div>
              <span className={`modePill ${day.mode}`}>
                {day.mode === "freezer-kit" ? "冷凍キット" : "通常調理"}
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
                <strong>{day.recipe.hotcookMode}</strong>
              </div>
            </div>

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
        <Link href="/shopping-list">買い物</Link>
      </nav>
    </main>
  );
}
