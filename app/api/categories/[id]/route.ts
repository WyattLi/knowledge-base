import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { updateCategory, deleteCategory } from "@/lib/categories";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const cat = await updateCategory(id, body);
    if (!cat) return NextResponse.json({ error: "分类不存在" }, { status: 404 });
    return NextResponse.json(cat);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteCategory(id);
  if (!ok) return NextResponse.json({ error: "分类不存在" }, { status: 404 });
  return NextResponse.json({ success: true });
}
