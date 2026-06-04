import { normalizeWeekKey } from "@/lib/mealPlans";
import MenuClient from "./menu-client";

type MenuPageProps = {
  searchParams?: Promise<{ week?: string | string[] }>;
};

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const params = await searchParams;
  const weekKey = normalizeWeekKey(params?.week);

  return <MenuClient weekKey={weekKey} />;
}
