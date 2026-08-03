import { getSession } from "@/lib/auth";
import { getCategories, getMenuItems } from "@/lib/repo";
import { MenuManagementClient } from "@/components/admin/MenuManagementClient";

export default async function AdminMenuPage() {
  const session = await getSession();
  const categories = await getCategories();
  const items = await getMenuItems();

  return (
    <MenuManagementClient
      role={session?.role ?? "staff"}
      initialCategories={categories}
      initialItems={items}
    />
  );
}
