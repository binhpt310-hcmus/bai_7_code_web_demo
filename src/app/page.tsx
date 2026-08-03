import { getCategories, getMenuItems } from "@/lib/repo";
import { ClientHome } from "@/components/client/ClientHome";

export default function Home() {
  const categories = getCategories();
  const items = getMenuItems();

  return <ClientHome categories={categories} items={items} />;
}
