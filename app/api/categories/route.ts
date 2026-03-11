import { NextResponse } from "next/server";
import { getActiveCategories } from "@/lib/db/word-cards";

export async function GET() {
  const categories = await getActiveCategories();
  return NextResponse.json(
    { categories },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
