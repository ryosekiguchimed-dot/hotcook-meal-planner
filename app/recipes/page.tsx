import Link from "next/link";
import {
  getDishCategoryLabel,
  getMealRoleLabel,
  getRecipeTypeLabel,
  recipes,
} from "@/lib/recipes";

export default function RecipesPage() {
  const freezerRecipes = recipes.filter((recipe) => recipe.type === "freezer-kit");
  const regularRecipes = recipes.filter((recipe) => recipe.type === "regular");

  return (
    <main className="screen withBottomNav">
      <header className="pageHeader">
        <Link className="backLink" href="/">
          ← トップ
        </Link>
        <p className="eyebrow">登録料理 {recipes.length}品</p>
        <h1>料理リスト</h1>
        <div className="actions tertiary">
          <Link className="primaryButton" href="/recipes/manage">
            料理マスター管理
          </Link>
          <Link className="secondaryButton" href="/history">
            献立履歴
          </Link>
        </div>
      </header>

      <section className="recipeListSection">
        <div className="sectionHeader">
          <p className="eyebrow">平日用</p>
          <h2>冷凍ミールキット</h2>
        </div>
        <div className="timeline">
          {freezerRecipes.map((recipe) => (
            <Link className="dayRow" href={`/recipes/${recipe.id}`} key={recipe.id}>
              <div className="pillRow">
                <span className={`modePill ${recipe.type}`}>{getRecipeTypeLabel(recipe.type)}</span>
                <span className="modePill neutral">{getMealRoleLabel(recipe.mealRole)}</span>
                <span className="modePill neutral">{getDishCategoryLabel(recipe.dishCategory)}</span>
              </div>
              <strong>{recipe.name}</strong>
              <small>
                {recipe.timeMinutes}分 / {recipe.hotcookSetting}
                {recipe.hotcookMenuNumber ? ` / メニュー番号 ${recipe.hotcookMenuNumber}` : ""}
              </small>
            </Link>
          ))}
        </div>
      </section>

      <section className="recipeListSection">
        <div className="sectionHeader">
          <p className="eyebrow">水土日用</p>
          <h2>通常料理</h2>
        </div>
        <div className="timeline">
          {regularRecipes.map((recipe) => (
            <Link className="dayRow" href={`/recipes/${recipe.id}`} key={recipe.id}>
              <div className="pillRow">
                <span className={`modePill ${recipe.type}`}>{getRecipeTypeLabel(recipe.type)}</span>
                <span className="modePill neutral">{getMealRoleLabel(recipe.mealRole)}</span>
                <span className="modePill neutral">{getDishCategoryLabel(recipe.dishCategory)}</span>
              </div>
              <strong>{recipe.name}</strong>
              <small>
                {recipe.timeMinutes}分 / {recipe.hotcookSetting}
                {recipe.hotcookMenuNumber ? ` / メニュー番号 ${recipe.hotcookMenuNumber}` : ""}
              </small>
            </Link>
          ))}
        </div>
      </section>

      <nav className="bottomNav">
        <Link href="/">トップ</Link>
        <Link href="/menu">献立</Link>
        <Link href="/shopping-list">買い物</Link>
        <Link aria-current="page" href="/recipes">料理一覧</Link>
        <Link href="/recipes/manage">料理管理</Link>
      </nav>
    </main>
  );
}
