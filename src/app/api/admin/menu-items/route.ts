import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { createMenuItem, getMenuItems } from "@/lib/repo";
import type { MenuItemInput } from "@/lib/repo";

const FALLBACK_IMAGE = "/menu-images/hero-cafe.jpg";

export async function GET() {
  const guard = await requireSession(["owner", "staff"]);
  if ("error" in guard) return guard.error;
  return NextResponse.json({ items: await getMenuItems() });
}

function validate(body: Partial<MenuItemInput>): string | null {
  if (!body.name?.trim()) return "Tên món không được để trống.";
  if (!body.categoryId) return "Vui lòng chọn danh mục.";
  if (typeof body.price !== "number" || body.price <= 0) return "Giá món phải lớn hơn 0.";
  return null;
}

export async function POST(req: NextRequest) {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const body = (await req.json()) as Partial<MenuItemInput>;
  const error = validate(body);
  if (error) return NextResponse.json({ message: error }, { status: 400 });

  const item = await createMenuItem({
    name: body.name!.trim(),
    categoryId: body.categoryId!,
    description: body.description?.trim() ?? "",
    price: body.price!,
    image: body.image?.trim() || FALLBACK_IMAGE,
    available: body.available ?? true,
  });
  return NextResponse.json({ item }, { status: 201 });
}
