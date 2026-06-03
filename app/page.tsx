import Link from "next/link";
import { weekPlan, getShoppingList } from "@/lib/mealPlan";

export default function Home() {
  const freezerKitDays = weekPlan.filter((day) => day.mode === "freezer-kit");
  const cookingDays = weekPlan.filter((day) => day.mode === "regular");
  const shoppingCount = getShoppingList().length;

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
      </section>

      <section className="quickStats" aria-label="今週の概要">
        <div>
          <strong>{weekPlan.length}</strong>
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
          <strong>{shoppingCount}</strong>
          <span>買い物項目</span>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeader">
          <p className="eyebrow">今夜から使える</p>
          <h2>週の流れ</h2>
        </div>
        <div className="timeline">
          {weekPlan.map((day) => (
            <Link className="dayRow" href="/menu" key={day.day}>
              <div>
                <span className="dayBadge">{day.day}</span>
                <span className={`modePill ${day.mode}`}>
                  {day.mode === "freezer-kit" ? "冷凍ミールキット" : "通常調理"}
                </span>
              </div>
              <strong>{day.recipe.name}</strong>
              <small>{day.recipe.timeMinutes}分 / {day.recipe.hotcookMode}</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
