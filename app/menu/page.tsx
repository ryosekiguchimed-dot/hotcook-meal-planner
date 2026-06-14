import { normalizeSelectedDate } from "@/lib/mealPlans";
import MenuClient from "./menu-client";

type MenuPageProps = {
  searchParams?: Promise<{ date?: string | string[] }>;
};

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const params = await searchParams;
  return <MenuClient selectedDate={normalizeSelectedDate(params?.date)} />;
}
