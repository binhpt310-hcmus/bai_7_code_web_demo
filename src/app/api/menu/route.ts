import { NextResponse } from "next/server";
import { getCategories, getMenuItems } from "@/lib/repo";

export async function GET() {
  return NextResponse.json({
    categories: await getCategories(),
    items: await getMenuItems(),
  });
}
