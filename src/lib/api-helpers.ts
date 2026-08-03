import { NextResponse } from "next/server";
import { getSession } from "./auth";
import type { Role, SessionPayload } from "./types";

export async function requireSession(
  roles?: Role[]
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 }) };
  }
  if (roles && !roles.includes(session.role)) {
    return {
      error: NextResponse.json(
        { message: "Bạn không có quyền thực hiện thao tác này." },
        { status: 403 }
      ),
    };
  }
  return { session };
}
