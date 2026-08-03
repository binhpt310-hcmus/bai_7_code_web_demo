import { NextResponse } from "next/server";
import { getCategories, getMenuItems } from "@/lib/repo";

export async function GET() {
  return NextResponse.json({
    categories: getCategories(),
    items: getMenuItems(),
  });
}
