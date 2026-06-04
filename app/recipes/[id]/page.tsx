import RecipeDetailClient from "./recipe-detail-client";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  return <RecipeDetailClient id={id} />;
}
