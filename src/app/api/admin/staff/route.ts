import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { createStaffUser, getUsers } from "@/lib/repo";
import type { UserAccount } from "@/lib/types";

function toSafeUser(user: UserAccount) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}

export async function GET() {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const users = (await getUsers()).map(toSafeUser);
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const { name, username, password } = (await req.json()) as {
    name?: string;
    username?: string;
    password?: string;
  };

  if (!name?.trim() || !username?.trim() || !password || password.length < 6) {
    return NextResponse.json(
      { message: "Nhập đủ họ tên, tài khoản và mật khẩu (tối thiểu 6 ký tự)." },
      { status: 400 }
    );
  }

  const result = await createStaffUser({ name: name.trim(), username: username.trim(), password });
  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }
  return NextResponse.json({ user: toSafeUser(result) }, { status: 201 });
}
