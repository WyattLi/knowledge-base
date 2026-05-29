import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listCategories, createCategory } from "@/lib/categories";

export async function GET() {
  const cats = await listCategories();
  return NextResponse.json(cats);
}

export async function POST(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "分类名不能为空" }, { status: 400 });
    }
    const cat = await createCategory(body);
    return NextResponse.json(cat, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
