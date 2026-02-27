import { NextResponse } from "next/server";
import { getActiveCategories } from "@/lib/db/word-cards";

export async function GET() {
  const categories = await getActiveCategories();
  return NextResponse.json({ categories });
}
