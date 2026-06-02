import { NextResponse } from "next/server";
import { getGraphData } from "@/lib/graph";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = await getGraphData({
    categoryId: searchParams.get("categoryId") || undefined,
    tagId: searchParams.get("tagId") || undefined,
  });
  return NextResponse.json(data);
}
