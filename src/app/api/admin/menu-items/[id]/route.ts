import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { deleteMenuItem, setMenuItemAvailability, updateMenuItem } from "@/lib/repo";
import type { MenuItemInput } from "@/lib/repo";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const body = (await req.json()) as Partial<MenuItemInput>;
  if (body.name !== undefined && !body.name.trim()) {
    return NextResponse.json({ message: "Tên món không được để trống." }, { status: 400 });
  }
  if (body.price !== undefined && body.price <= 0) {
    return NextResponse.json({ message: "Giá món phải lớn hơn 0." }, { status: 400 });
  }
  const item = await updateMenuItem(id, body);
  if (!item) return NextResponse.json({ message: "Không tìm thấy món." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSession(["owner", "staff"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const { available } = (await req.json()) as { available: boolean };
  const item = await setMenuItemAvailability(id, available);
  if (!item) return NextResponse.json({ message: "Không tìm thấy món." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  await deleteMenuItem(id);
  return NextResponse.json({ ok: true });
}
