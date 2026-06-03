import Link from "next/link";
import RecipeManager from "./recipe-manager";
import { recipes } from "@/lib/recipes";

export default function RecipeManagePage() {
  return (
    <main className="screen withBottomNav">
      <header className="pageHeader">
        <Link className="backLink" href="/recipes">
          ← 料理リスト
        </Link>
        <p className="eyebrow">ブラウザ保存のMVP</p>
        <h1>料理マスター管理</h1>
        <p className="lead compact">
          料理の追加・編集・削除を行えます。まずはDBなしで、登録内容をこの端末に保存します。
        </p>
      </header>

      <RecipeManager initialRecipes={recipes} />

      <nav className="bottomNav">
        <Link href="/">トップ</Link>
        <Link href="/menu">献立</Link>
        <Link href="/shopping-list">買い物</Link>
        <Link href="/recipes">料理一覧</Link>
        <Link aria-current="page" href="/recipes/manage">料理管理</Link>
      </nav>
    </main>
  );
}
