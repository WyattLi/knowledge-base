import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { blobPut } from "@/lib/blob";
import { v4 as uuid } from "uuid";

export async function POST(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    // Only allow image types
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "仅支持图片文件" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "png";
    const key = `images/${uuid()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await blobPut(key, buffer.toString("base64"));

    // EdgeOne Pages Blob URL pattern
    const url = `/api/blob/${key}`;

    return NextResponse.json({ url, key }, { status: 201 });
  } catch (e: any) {
    console.error("[upload/image] error:", e.message);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
