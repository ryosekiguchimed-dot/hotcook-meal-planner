import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDishCategoryLabel,
  getMealRoleLabel,
  getRecipeById,
  getRecipeTypeLabel,
  recipes,
} from "@/lib/recipes";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return recipes.map((recipe) => ({ id: recipe.id }));
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  const recipe = getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="screen withBottomNav">
      <header className="pageHeader">
        <Link className="backLink" href="/recipes">
          ← 料理リスト
        </Link>
        <p className="eyebrow">{getRecipeTypeLabel(recipe.type)}</p>
        <h1>{recipe.name}</h1>
        <p className="lead compact">{recipe.description}</p>
      </header>

      <article className="mealCard">
        <div className="infoGrid">
          <div>
            <span>人数</span>
            <strong>{recipe.servings}人分</strong>
          </div>
          <div>
            <span>調理時間</span>
            <strong>{recipe.timeMinutes}分</strong>
          </div>
          <div>
            <span>種別</span>
            <strong>{getRecipeTypeLabel(recipe.type)}</strong>
          </div>
          <div>
            <span>役割</span>
            <strong>{getMealRoleLabel(recipe.mealRole)}</strong>
          </div>
          <div>
            <span>分類</span>
            <strong>{getDishCategoryLabel(recipe.dishCategory)}</strong>
          </div>
        </div>

        <section className="miniSection">
          <h2>材料</h2>
          <ul className="ingredientList">
            {recipe.ingredients.map((ingredient) => (
              <li key={`${ingredient.name}-${ingredient.amount}`}>
                <span>{ingredient.category}</span>
                <strong>{ingredient.name}</strong>
                <small>{ingredient.amount}</small>
              </li>
            ))}
          </ul>
        </section>

        <section className="miniSection">
          <h2>作り方</h2>
          <ol className="steps">
            {recipe.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="miniSection">
          <h2>ホットクック操作</h2>
          <p className="settingText">{recipe.hotcookSetting}</p>
          {recipe.hotcookMenuNumber ? (
            <p className="settingText">メニュー番号 {recipe.hotcookMenuNumber}</p>
          ) : null}
          <ol className="steps">
            {recipe.hotcookOperation.map((operation) => (
              <li key={operation}>{operation}</li>
            ))}
          </ol>
        </section>
      </article>

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
