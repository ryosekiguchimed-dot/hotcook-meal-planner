export type MealMode = "freezer-kit" | "regular";

export type Ingredient = {
  name: string;
  amount: string;
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  servings: number;
  timeMinutes: number;
  hotcookMode: string;
  ingredients: Ingredient[];
  steps: string[];
};

export type DayPlan = {
  day: "月" | "火" | "水" | "木" | "金" | "土" | "日";
  mode: MealMode;
  recipe: Recipe;
};

const recipes: Record<string, Recipe> = {
  chickenTomato: {
    id: "chickenTomato",
    name: "鶏ももトマト煮",
    description: "鶏肉と野菜を冷凍袋に入れておき、帰宅後は内鍋へ移すだけ。",
    servings: 4,
    timeMinutes: 35,
    hotcookMode: "手動 煮物を作る まぜる",
    ingredients: [
      { name: "鶏もも肉", amount: "600g" },
      { name: "玉ねぎ", amount: "1個" },
      { name: "しめじ", amount: "1袋" },
      { name: "カットトマト缶", amount: "1缶" },
      { name: "コンソメ", amount: "小さじ2" },
    ],
    steps: [
      "鶏肉、薄切り玉ねぎ、しめじ、調味料を冷凍袋に入れる。",
      "調理日は半解凍して内鍋に移し、トマト缶を加える。",
      "まぜ技ユニットを付け、手動の煮物モードで加熱する。",
    ],
  },
  porkGinger: {
    id: "porkGinger",
    name: "豚こま生姜みそ煮",
    description: "甘めのみそ味で子どもも食べやすい冷凍ミールキット。",
    servings: 4,
    timeMinutes: 25,
    hotcookMode: "手動 煮物を作る まぜる",
    ingredients: [
      { name: "豚こま肉", amount: "500g" },
      { name: "玉ねぎ", amount: "1個" },
      { name: "にんじん", amount: "1本" },
      { name: "みそ", amount: "大さじ3" },
      { name: "しょうが", amount: "1かけ" },
    ],
    steps: [
      "豚肉、野菜、みそ、すりおろししょうがを冷凍袋でなじませる。",
      "調理日は内鍋に入れ、水100mlを加える。",
      "まぜ技ユニットを付け、煮物モードで加熱する。",
    ],
  },
  salmonCream: {
    id: "salmonCream",
    name: "鮭と野菜のクリーム煮",
    description: "水曜は通常調理。牛乳は仕上げに入れてやさしい味に。",
    servings: 4,
    timeMinutes: 30,
    hotcookMode: "手動 煮物を作る まぜない",
    ingredients: [
      { name: "生鮭", amount: "4切れ" },
      { name: "じゃがいも", amount: "3個" },
      { name: "ブロッコリー", amount: "1株" },
      { name: "牛乳", amount: "300ml" },
      { name: "バター", amount: "20g" },
    ],
    steps: [
      "内鍋に鮭、じゃがいも、ブロッコリー、バターを入れる。",
      "水100mlを加え、まぜない煮物モードで加熱する。",
      "加熱後に牛乳を入れ、追加加熱で温める。",
    ],
  },
  dryCurry: {
    id: "dryCurry",
    name: "ひき肉ドライカレー",
    description: "冷凍しても味が落ちにくく、ご飯にのせるだけで完成。",
    servings: 4,
    timeMinutes: 30,
    hotcookMode: "手動 炒める",
    ingredients: [
      { name: "合いびき肉", amount: "500g" },
      { name: "玉ねぎ", amount: "1個" },
      { name: "ピーマン", amount: "3個" },
      { name: "カレールウ", amount: "3かけ" },
      { name: "トマトケチャップ", amount: "大さじ2" },
    ],
    steps: [
      "ひき肉、みじん切り野菜、調味料を冷凍袋で平らに冷凍する。",
      "調理日は内鍋に入れ、水80mlを加える。",
      "まぜ技ユニットを付け、炒めるモードで加熱する。",
    ],
  },
  nikujaga: {
    id: "nikujaga",
    name: "牛肉じゃが",
    description: "金曜は定番味の冷凍キット。週末前でも手早く出せます。",
    servings: 4,
    timeMinutes: 35,
    hotcookMode: "メニュー 肉じゃが",
    ingredients: [
      { name: "牛こま肉", amount: "400g" },
      { name: "じゃがいも", amount: "4個" },
      { name: "玉ねぎ", amount: "1個" },
      { name: "にんじん", amount: "1本" },
      { name: "しらたき", amount: "1袋" },
    ],
    steps: [
      "牛肉、野菜、しらたき、しょうゆ、みりんを冷凍袋に入れる。",
      "調理日は内鍋に移し、水50mlを加える。",
      "まぜ技ユニットを付け、肉じゃがメニューで加熱する。",
    ],
  },
  minestrone: {
    id: "minestrone",
    name: "具だくさんミネストローネ",
    description: "土曜は野菜多めの通常調理。余りは翌朝にも使えます。",
    servings: 4,
    timeMinutes: 40,
    hotcookMode: "手動 スープを作る まぜる",
    ingredients: [
      { name: "ベーコン", amount: "120g" },
      { name: "キャベツ", amount: "1/4玉" },
      { name: "玉ねぎ", amount: "1個" },
      { name: "にんじん", amount: "1本" },
      { name: "カットトマト缶", amount: "1缶" },
    ],
    steps: [
      "材料を1cm角に切り、内鍋に入れる。",
      "水500mlとコンソメを加える。",
      "まぜ技ユニットを付け、スープモードで加熱する。",
    ],
  },
  oyakodon: {
    id: "oyakodon",
    name: "親子丼の具",
    description: "日曜は短時間調理。炊いたご飯にのせてすぐ食卓へ。",
    servings: 4,
    timeMinutes: 20,
    hotcookMode: "手動 煮物を作る まぜない",
    ingredients: [
      { name: "鶏もも肉", amount: "400g" },
      { name: "玉ねぎ", amount: "2個" },
      { name: "卵", amount: "4個" },
      { name: "めんつゆ", amount: "120ml" },
      { name: "三つ葉", amount: "1束" },
    ],
    steps: [
      "鶏肉、玉ねぎ、めんつゆ、水120mlを内鍋に入れる。",
      "まぜない煮物モードで加熱する。",
      "溶き卵を回し入れ、追加加熱で半熟に仕上げる。",
    ],
  },
};

export const weekPlan: DayPlan[] = [
  { day: "月", mode: "freezer-kit", recipe: recipes.chickenTomato },
  { day: "火", mode: "freezer-kit", recipe: recipes.porkGinger },
  { day: "水", mode: "regular", recipe: recipes.salmonCream },
  { day: "木", mode: "freezer-kit", recipe: recipes.dryCurry },
  { day: "金", mode: "freezer-kit", recipe: recipes.nikujaga },
  { day: "土", mode: "regular", recipe: recipes.minestrone },
  { day: "日", mode: "regular", recipe: recipes.oyakodon },
];

export function getShoppingList() {
  const grouped = new Map<string, string[]>();

  for (const day of weekPlan) {
    for (const ingredient of day.recipe.ingredients) {
      const current = grouped.get(ingredient.name) ?? [];
      current.push(`${day.day}: ${ingredient.amount}`);
      grouped.set(ingredient.name, current);
    }
  }

  return Array.from(grouped.entries())
    .map(([name, amounts]) => ({ name, amounts }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}
