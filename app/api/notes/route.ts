import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listNotes, createNote } from "@/lib/notes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const notes = await listNotes({
    status: searchParams.get("status") || undefined,
    categoryId: searchParams.get("categoryId") || undefined,
    limit: Number(searchParams.get("limit")) || 50,
    offset: Number(searchParams.get("offset")) || 0,
  });
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!body.title || !body.content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
    }
    const note = await createNote({
      title: body.title,
      content: body.content,
      categoryId: body.categoryId,
      status: body.status,
      tagIds: body.tagIds,
    });
    return NextResponse.json(note, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
