import { normalizeSelectedDate } from "@/lib/mealPlans";
import ShoppingListClient from "./shopping-list-client";

type ShoppingListPageProps = {
  searchParams?: Promise<{ date?: string | string[] }>;
};

export default async function ShoppingListPage({ searchParams }: ShoppingListPageProps) {
  const params = await searchParams;
  return <ShoppingListClient selectedDate={normalizeSelectedDate(params?.date)} />;
}
