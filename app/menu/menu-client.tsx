"use client";

import { useState } from "react";
import Link from "next/link";
import { type DayName, mealPlanWeeks, type WeekKey } from "@/lib/mealPlans";
import { noMealRecipe, withNoMealRecipe } from "@/lib/noMealRecipe";
import { recipes as initialRecipes } from "@/lib/recipes";
import { generateMealPlanWeek, getCandidateRecipesForDay, getHydratedMealPlanByKey, getMealPlanByKey, getRequiredRecipeType, replaceMealPlanDay, rerollMealPlanDay, saveMealPlansToStorage, setMealPlanDayLocked, upsertMealPlan, useStoredMealPlans } from "@/lib/mealPlanStorage";
import { useStoredRecipes } from "@/lib/recipeStorage";

type MenuClientProps = { weekKey: WeekKey };

export default function MenuClient({ weekKey }: MenuClientProps) {
  const recipes = withNoMealRecipe(useStoredRecipes(initialRecipes));
  const mealPlans = useStoredMealPlans(mealPlanWeeks);
  const [targetWeekKey, setTargetWeekKey] = useState<"current" | "next">(weekKey === "next" ? "next" : "current");
  const [editingDay, setEditingDay] = useState<DayName | null>(null);
  const [status, setStatus] = useState("生成・変更した献立はこの端末に保存されます。");
  const weekPlan = getHydratedMealPlanByKey(mealPlans, weekKey, recipes);
  const rawWeekPlan = getMealPlanByKey(mealPlans, weekKey);
  const isEditableWeek = weekKey === "current" || weekKey === "next";

  function saveWeek(nextWeek: typeof rawWeekPlan, message: string) { saveMealPlansToStorage(upsertMealPlan(mealPlans, nextWeek)); setStatus(message); }
  function handleGenerate() { const targetWeek = getMealPlanByKey(mealPlans, targetWeekKey); if (targetWeek.days.length > 0 && !window.confirm(`${targetWeek.label}の献立を再生成して上書きしますか？固定した曜日は変更しません。`)) { setStatus("献立生成をキャンセルしました。"); return; } const nextWeek = generateMealPlanWeek(mealPlans, targetWeekKey, recipes); saveWeek(nextWeek, `${nextWeek.label}の献立を生成しました。`); setEditingDay(null); }
  function handleReplaceDay(dayName: DayName, recipeId: string) { saveWeek(replaceMealPlanDay(rawWeekPlan, dayName, recipeId), `${rawWeekPlan.label} ${dayName}曜日の料理を変更しました。`); setEditingDay(null); }
  function handleRerollDay(dayName: DayName) { saveWeek(rerollMealPlanDay(mealPlans, weekKey, dayName, recipes), `${rawWeekPlan.label} ${dayName}曜日を再抽選しました。`); setEditingDay(null); }
  function handleLockedChange(dayName: DayName, locked: boolean) { saveWeek(setMealPlanDayLocked(rawWeekPlan, dayName, locked), `${rawWeekPlan.label} ${dayName}曜日を${locked ? "固定" : "固定解除"}しました。`); }

  return <main className="screen">
    <header className="pageHeader"><Link className="backLink" href="/">← トップ</Link><p className="eyebrow">{weekPlan.label}の夕食献立</p><h1>ホットクック週間プラン</h1><div className="segmentedLinks" aria-label="週の切り替え"><Link aria-current={weekKey === "last" ? "page" : undefined} href="/menu?week=last">先週</Link><Link aria-current={weekKey === "current" ? "page" : undefined} href="/menu">今週</Link><Link aria-current={weekKey === "next" ? "page" : undefined} href="/menu?week=next">来週</Link></div></header>
    <section className="generatorPanel" aria-label="献立生成"><div><p className="eyebrow">献立生成</p><h2>今週・来週を自動作成</h2></div><div className="generatorControls"><label><span>生成対象週</span><select value={targetWeekKey} onChange={(event) => setTargetWeekKey(event.target.value as "current" | "next")}><option value="current">今週</option><option value="next">来週</option></select></label><button type="button" onClick={handleGenerate}>献立生成</button></div><p className="formStatus" aria-live="polite">{status}</p></section>
    <div className="mealCards">{weekPlan.days.map((day) => <article className="mealCard" key={day.day}>
      <div className="mealTop"><div><span className="dayBadge large">{day.day}</span><h2>{day.recipe.name}</h2></div><span className={`modePill ${day.recipe.type}`}>{day.recipe.id === noMealRecipe.id ? "予定あり" : day.recipe.type === "freezer-kit" ? "冷凍キット" : "通常料理"}</span></div>
      <p className="description">{day.recipe.description}</p>
      {day.recipe.id !== noMealRecipe.id ? <><div className="infoGrid"><div><span>人数</span><strong>{day.recipe.servings}人分</strong></div><div><span>目安</span><strong>{day.recipe.timeMinutes}分</strong></div><div><span>設定</span><strong>{day.recipe.hotcookSetting}</strong></div>{day.recipe.hotcookMenuNumber ? <div><span>番号</span><strong>{day.recipe.hotcookMenuNumber}</strong></div> : null}</div><Link className="inlineButton" href={`/recipes/${day.recipe.id}`}>詳細を見る</Link></> : null}
      <div className="dayEditControls"><button type="button" disabled={!isEditableWeek} onClick={() => setEditingDay(editingDay === day.day ? null : day.day)}>変更</button><button type="button" disabled={!isEditableWeek || day.locked} onClick={() => handleRerollDay(day.day)}>この曜日だけ再抽選</button><label><input type="checkbox" checked={Boolean(day.locked)} disabled={!isEditableWeek} onChange={(event) => handleLockedChange(day.day, event.target.checked)} /><span>固定</span></label></div>
      {editingDay === day.day ? <section className="candidatePanel"><div className="sectionHeader"><p className="eyebrow">{getRequiredRecipeType(day.day) === "freezer-kit" ? "冷凍ミールキット候補" : "通常料理候補"}</p><h3>{day.day}曜日に入れる料理</h3></div><div className="candidateList"><button type="button" className="noMealCandidate" onClick={() => handleReplaceDay(day.day, noMealRecipe.id)}><strong>料理なし</strong><small>外食・予定ありなど</small></button>{getCandidateRecipesForDay(day.day, recipes).map((candidate) => <button type="button" key={candidate.id} onClick={() => handleReplaceDay(day.day, candidate.id)}><strong>{candidate.name}</strong><small>{candidate.timeMinutes}分 / {candidate.hotcookSetting}</small></button>)}</div></section> : null}
      {day.recipe.id !== noMealRecipe.id ? <><section className="miniSection"><h3>材料</h3><ul className="chipList">{day.recipe.ingredients.map((item) => <li key={item.name}>{item.name} {item.amount}</li>)}</ul></section><section className="miniSection"><h3>ホットクック手順</h3><ol className="steps">{day.recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol></section></> : null}
    </article>)}</div>
    <nav className="bottomNav"><Link href="/">トップ</Link><Link aria-current="page" href="/menu">献立</Link><Link href={`/shopping-list?week=${weekKey}`}>買い物</Link><Link href="/recipes">料理一覧</Link><Link href="/recipes/manage">料理管理</Link></nav>
  </main>;
}
