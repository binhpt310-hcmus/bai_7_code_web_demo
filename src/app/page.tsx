import { getCategories, getMenuItems } from "@/lib/repo";
import { ClientHome } from "@/components/client/ClientHome";

export default async function Home() {
  const categories = await getCategories();
  const items = await getMenuItems();

  return <ClientHome categories={categories} items={items} />;
}
