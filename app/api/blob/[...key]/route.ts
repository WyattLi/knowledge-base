import { NextResponse } from "next/server";
import { blobGet } from "@/lib/blob";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const fullKey = key.join("/");

  const content = await blobGet(fullKey);
  if (content === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Detect content type from extension
  const ext = fullKey.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  const contentType = mimeTypes[ext || ""] || "application/octet-stream";

  const buffer = Buffer.from(content, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
