import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { getOrders } from "@/lib/repo";

export async function GET() {
  const guard = await requireSession(["owner", "staff"]);
  if ("error" in guard) return guard.error;

  const orders = getOrders(guard.session.role === "owner" ? "all" : "recent");
  return NextResponse.json({ orders });
}
