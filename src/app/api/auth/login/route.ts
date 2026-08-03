import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, verifyPassword } from "@/lib/repo";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json()) as {
    username?: string;
    password?: string;
  };

  if (!username?.trim() || !password) {
    return NextResponse.json({ message: "Nhập đầy đủ tài khoản và mật khẩu." }, { status: 400 });
  }

  const user = await getUserByUsername(username.trim());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ message: "Tài khoản hoặc mật khẩu không đúng." }, { status: 401 });
  }
  if (user.status === "locked") {
    return NextResponse.json(
      { message: "Tài khoản này đã bị khóa. Liên hệ chủ quán để được hỗ trợ." },
      { status: 403 }
    );
  }

  await setSessionCookie({
    userId: user.id,
    role: user.role,
    name: user.name,
    username: user.username,
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role, username: user.username },
  });
}
