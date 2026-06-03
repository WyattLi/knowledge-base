import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { generateSummary } from "@/lib/ai";

export async function POST(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { title, content } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: "请提供标题和内容" }, { status: 400 });
    }

    const summary = await generateSummary(title, content);
    return NextResponse.json({ summary });
  } catch (e: any) {
    console.error("[ai/summarize] error:", e.message);
    return NextResponse.json({ error: e.message || "摘要生成失败" }, { status: 500 });
  }
}
