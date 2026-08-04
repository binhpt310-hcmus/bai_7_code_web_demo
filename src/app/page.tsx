import { getCategories, getMenuItems } from "@/lib/repo";
import { ClientHome } from "@/components/client/ClientHome";

// Without this, Next.js prerenders "/" once at build time (no cookies/params
// force it dynamic otherwise) and would freeze the menu at whatever it was
// when the site was last built - a new item added in Admin would not show up
// for customers until the next deploy, breaking the PRD requirement that menu
// changes appear immediately.
export const dynamic = "force-dynamic";

export default async function Home() {
  const categories = await getCategories();
  const items = await getMenuItems();

  return <ClientHome categories={categories} items={items} />;
}
