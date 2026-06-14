"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  getCurrentWeekStart,
  getWeekLabel,
  getWeekStart,
  mealPlanWeeks,
  parseIsoDate,
  type DayCookingStatus,
  type DayName,
} from "@/lib/mealPlans";
import {
  generateMealPlanWeek,
  getCandidateRecipesForDay,
  getMealPlanByStart,
  getRequiredRecipeType,
  hydrateMealPlanWeek,
  replaceMealPlanDay,
  rerollMealPlanDay,
  saveMealPlansToStorage,
  setMealPlanDayLocked,
  setMealPlanDayStatus,
  upsertMealPlan,
  useStoredMealPlans,
} from "@/lib/mealPlanStorage";
import { recipes as initialRecipes } from "@/lib/recipes";
import { useStoredRecipes } from "@/lib/recipeStorage";

type MenuClientProps = {
  selectedDate: string;
};

const statusOptions: { value: DayCookingStatus; label: string }[] = [
  { value: "unset", label: "未設定（曜日ルール）" },
  { value: "freezer-kit", label: "冷凍ミールキット" },
  { value: "regular", label: "通常調理" },
  { value: "no-meal", label: "献立不要" },
];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDays(month: string) {
  const first = parseIsoDate(`${month}-01`);
  const calendarStart = new Date(first);
  calendarStart.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return toIsoDate(date);
  });
}

function shiftMonth(month: string, amount: number) {
  const date = parseIsoDate(`${month}-01`);
  date.setMonth(date.getMonth() + amount);
  return toIsoDate(date).slice(0, 7);
}

function statusLabel(status: DayCookingStatus, day: DayName) {
  if (status === "no-meal") return "献立不要";
  const type = getRequiredRecipeType({ status, day });
  return type === "freezer-kit" ? "冷凍ミールキット" : "通常調理";
}

export default function MenuClient({ selectedDate }: MenuClientProps) {
  const recipes = useStoredRecipes(initialRecipes).filter((recipe) => recipe.id !== "no-meal");
  const mealPlans = useStoredMealPlans(mealPlanWeeks);
  const selectedWeekStart = getWeekStart(selectedDate);
  const rawWeekPlan = getMealPlanByStart(mealPlans, selectedWeekStart);
  const weekPlan = hydrateMealPlanWeek(rawWeekPlan, recipes);
  const [editingDay, setEditingDay] = useState<DayName | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(selectedDate.slice(0, 7));
  const [message, setMessage] = useState("生成・変更した献立はこの端末に保存されます。");
  const monthDays = useMemo(() => getMonthDays(calendarMonth), [calendarMonth]);

  useEffect(() => {
    setCalendarMonth(selectedDate.slice(0, 7));
  }, [selectedDate]);

  function saveWeek(nextWeek: typeof rawWeekPlan, nextMessage: string) {
    saveMealPlansToStorage(upsertMealPlan(mealPlans, nextWeek));
    setMessage(nextMessage);
  }

  function handleGenerate() {
    const hasExistingPlan = rawWeekPlan.days.some((day) => day.recipeId || day.status === "no-meal");
    if (hasExistingPlan && !window.confirm("この週の献立を再生成して上書きしますか？固定した曜日は変更しません。")) return;
    saveWeek(generateMealPlanWeek(mealPlans, selectedWeekStart, recipes), "この週の献立を生成しました。");
    setEditingDay(null);
  }

  function handleStatus(dayName: DayName, status: DayCookingStatus) {
    saveWeek(setMealPlanDayStatus(rawWeekPlan, dayName, status), `${dayName}曜日の調理ステータスを変更しました。`);
    if (status === "no-meal") setEditingDay(null);
  }

  function handleReplace(dayName: DayName, recipeId: string) {
    saveWeek(replaceMealPlanDay(rawWeekPlan, dayName, recipeId), `${dayName}曜日の料理を変更しました。`);
    setEditingDay(null);
  }

  function handleReroll(dayName: DayName) {
    saveWeek(rerollMealPlanDay(mealPlans, selectedWeekStart, dayName, recipes), `${dayName}曜日を再抽選しました。`);
    setEditingDay(null);
  }

  return (
    <main className="screen withBottomNav">
      <header className="pageHeader">
        <Link className="backLink" href="/">← トップ</Link>
        <p className="eyebrow">{getWeekLabel(selectedWeekStart)}</p>
        <h1>週間献立</h1>
      </header>

      <section className="calendarPanel" aria-label="献立カレンダー">
        <div className="calendarHeader">
          <button type="button" aria-label="前の月" onClick={() => setCalendarMonth(shiftMonth(calendarMonth, -1))}>‹</button>
          <h2>{calendarMonth.replace("-", "年")}月</h2>
          <button type="button" aria-label="次の月" onClick={() => setCalendarMonth(shiftMonth(calendarMonth, 1))}>›</button>
        </div>
        <div className="calendarWeekdays" aria-hidden="true">
          {["日", "月", "火", "水", "木", "金", "土"].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendarGrid">
          {monthDays.map((date) => {
            const week = getMealPlanByStart(mealPlans, getWeekStart(date));
            const day = week.days.find((item) => item.date === date);
            const isSelectedWeek = getWeekStart(date) === selectedWeekStart;
            return (
              <Link
                className={`${date.slice(0, 7) !== calendarMonth ? "outsideMonth " : ""}${isSelectedWeek ? "selectedWeek " : ""}${date === selectedDate ? "selectedDate" : ""}`}
                href={`/menu?date=${date}`}
                key={date}
                aria-label={`${date}の週を表示`}
              >
                <span>{Number(date.slice(-2))}</span>
                {day?.status === "no-meal" ? <i className="calendarDot noMeal" /> : day?.recipeId ? <i className="calendarDot planned" /> : null}
              </Link>
            );
          })}
        </div>
      </section>

      <div className="weekNavigation">
        <Link href={`/menu?date=${addDays(selectedWeekStart, -7)}`}>前の週</Link>
        <Link href="/menu">今週へ戻る</Link>
        <Link href={`/menu?date=${addDays(selectedWeekStart, 7)}`}>次の週</Link>
      </div>

      <section className="generatorPanel">
        <div>
          <p className="eyebrow">選択中の週</p>
          <h2>{getWeekLabel(selectedWeekStart)}</h2>
        </div>
        <button className="generateWeekButton" type="button" onClick={handleGenerate}>この週の献立を生成</button>
        <p className="formStatus" aria-live="polite">{message}</p>
      </section>

      <div className="mealCards">
        {weekPlan.days.map((day) => {
          const requiredType = getRequiredRecipeType(day);
          const noMeal = day.status === "no-meal";
          return (
            <article className={`mealCard ${noMeal ? "noMealCard" : ""}`} key={day.date}>
              <div className="mealTop">
                <div>
                  <span className="dayBadge large">{day.day}</span>
                  <p className="mealDate">{parseIsoDate(day.date).getMonth() + 1}/{parseIsoDate(day.date).getDate()}</p>
                  <h2>{noMeal ? "献立不要" : day.recipe?.name ?? "料理未設定"}</h2>
                </div>
                <span className={`modePill ${noMeal ? "neutral" : requiredType}`}>{statusLabel(day.status, day.day)}</span>
              </div>

              <label className="dayStatusSelect">
                <span>この日の調理ステータス</span>
                <select value={day.status} onChange={(event) => handleStatus(day.day, event.target.value as DayCookingStatus)}>
                  {statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                </select>
              </label>

              {!noMeal && day.recipe ? (
                <>
                  <p className="description">{day.recipe.description}</p>
                  <div className="infoGrid">
                    <div><span>人数</span><strong>{day.recipe.servings}人分</strong></div>
                    <div><span>目安</span><strong>{day.recipe.timeMinutes}分</strong></div>
                    <div><span>設定</span><strong>{day.recipe.hotcookSetting}</strong></div>
                    {day.recipe.hotcookMenuNumber ? <div><span>番号</span><strong>{day.recipe.hotcookMenuNumber}</strong></div> : null}
                  </div>
                  <Link className="inlineButton" href={`/recipes/${day.recipe.id}`}>詳細を見る</Link>
                </>
              ) : null}

              {!noMeal ? (
                <div className="dayEditControls">
                  <button type="button" onClick={() => setEditingDay(editingDay === day.day ? null : day.day)}>変更</button>
                  <button type="button" disabled={day.locked} onClick={() => handleReroll(day.day)}>この曜日だけ再抽選</button>
                  <label>
                    <input type="checkbox" checked={Boolean(day.locked)} onChange={(event) => saveWeek(setMealPlanDayLocked(rawWeekPlan, day.day, event.target.checked), `${day.day}曜日の固定を変更しました。`)} />
                    <span>固定</span>
                  </label>
                </div>
              ) : null}

              {editingDay === day.day && !noMeal ? (
                <section className="candidatePanel">
                  <div className="sectionHeader">
                    <p className="eyebrow">{requiredType === "freezer-kit" ? "冷凍ミールキット候補" : "通常料理候補"}</p>
                    <h3>{day.day}曜日に入れる料理</h3>
                  </div>
                  <div className="candidateList">
                    {getCandidateRecipesForDay(day, recipes).map((candidate) => (
                      <button type="button" key={candidate.id} onClick={() => handleReplace(day.day, candidate.id)}>
                        <strong>{candidate.name}</strong>
                        <small>{candidate.timeMinutes}分 / {candidate.hotcookSetting}</small>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
            </article>
          );
        })}
      </div>

      <nav className="bottomNav">
        <Link href="/">トップ</Link>
        <Link aria-current="page" href={`/menu?date=${selectedDate}`}>献立</Link>
        <Link href={`/shopping-list?date=${selectedWeekStart}`}>買い物</Link>
        <Link href="/recipes">料理一覧</Link>
        <Link href="/recipes/manage">料理管理</Link>
      </nav>
    </main>
  );
}
