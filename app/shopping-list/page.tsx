import Link from "next/link";
import { getShoppingList, weekPlan } from "@/lib/mealPlan";

export default function ShoppingListPage() {
  const items = getShoppingList();
  const freezerKitRecipes = weekPlan.filter((day) => day.mode === "freezer-kit");

  return (
    <main className="screen withBottomNav">
      <header className="pageHeader">
        <Link className="backLink" href="/">
          ← トップ
        </Link>
        <p className="eyebrow">自動生成</p>
        <h1>今週の買い物リスト</h1>
        <p className="lead compact">
          固定レシピ DB から材料を集計。冷凍ミールキット分はまとめて下準備できます。
        </p>
      </header>

      <section className="prepBox">
        <h2>冷凍ミールキット準備日</h2>
        <p>月火木金の4袋をまとめて作成</p>
        <div className="prepTags">
          {freezerKitRecipes.map((day) => (
            <span key={day.day}>{day.day}: {day.recipe.name}</span>
          ))}
        </div>
      </section>

      <section className="shoppingList" aria-label="買い物リスト">
        {items.map((item) => (
          <label className="shoppingItem" key={item.name}>
            <input type="checkbox" />
            <span>
              <strong>{item.name}</strong>
              <small>{item.amounts.join(" / ")}</small>
            </span>
          </label>
        ))}
      </section>

      <nav className="bottomNav">
        <Link href="/">トップ</Link>
        <Link href="/menu">献立</Link>
        <Link aria-current="page" href="/shopping-list">買い物</Link>
      </nav>
    </main>
  );
}
