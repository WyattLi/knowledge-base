import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { updateTag, deleteTag } from "@/lib/tags";

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
    const tag = await updateTag(id, body);
    if (!tag) return NextResponse.json({ error: "标签不存在" }, { status: 404 });
    return NextResponse.json(tag);
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
  const ok = await deleteTag(id);
  if (!ok) return NextResponse.json({ error: "标签不存在" }, { status: 404 });
  return NextResponse.json({ success: true });
}
