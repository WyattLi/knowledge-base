import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listTags, listTagsAdmin, createTag } from "@/lib/tags";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  if (page) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20") || 20));
    const result = await listTagsAdmin({ page: pageNum, pageSize });
    return NextResponse.json(result);
  }
  const tags = await listTags();
  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "标签名不能为空" }, { status: 400 });
    }
    const tag = await createTag(body);
    return NextResponse.json(tag, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
