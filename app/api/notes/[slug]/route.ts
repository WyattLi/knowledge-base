import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getNoteBySlug, updateNote, deleteNote } from "@/lib/notes";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  return NextResponse.json(note);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { slug } = await params;
  try {
    const body = await request.json();
    const note = await updateNote(slug, {
      title: body.title,
      content: body.content,
      categoryId: body.categoryId,
      status: body.status,
      tagIds: body.tagIds,
      summary: body.summary,
    });
    if (!note) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
    return NextResponse.json(note);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { slug } = await params;
  const ok = await deleteNote(slug);
  if (!ok) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  return NextResponse.json({ success: true });
}
