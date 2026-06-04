import { normalizeWeekKey } from "@/lib/mealPlans";
import ShoppingListClient from "./shopping-list-client";

type ShoppingListPageProps = {
  searchParams?: Promise<{ week?: string | string[] }>;
};

export default async function ShoppingListPage({ searchParams }: ShoppingListPageProps) {
  const params = await searchParams;
  const weekKey = normalizeWeekKey(params?.week);

  return <ShoppingListClient weekKey={weekKey} />;
}
