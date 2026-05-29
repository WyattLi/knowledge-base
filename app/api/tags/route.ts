import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listTags, createTag } from "@/lib/tags";

export async function GET() {
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
