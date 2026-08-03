import { getSession } from "@/lib/auth";
import { OrderQueueClient } from "@/components/admin/OrderQueueClient";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const session = await getSession();
  const { denied } = await searchParams;
  return <OrderQueueClient role={session?.role ?? "staff"} denied={denied === "1"} />;
}
