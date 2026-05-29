import { NextResponse } from "next/server";
import { blobPut, blobGet, blobDelete } from "@/lib/blob";

export async function GET() {
  const key = "test/hello.txt";
  const results: string[] = [];

  try {
    await blobPut(key, "Hello from EdgeOne Pages Blob! " + new Date().toISOString());
    results.push("PUT ok");
  } catch (e: any) {
    results.push("PUT failed: " + e.message);
  }

  try {
    const content = await blobGet(key);
    results.push("GET: " + (content ?? "(null)"));
  } catch (e: any) {
    results.push("GET failed: " + e.message);
  }

  try {
    await blobDelete(key);
    results.push("DELETE ok");
  } catch (e: any) {
    results.push("DELETE failed: " + e.message);
  }

  try {
    const after = await blobGet(key);
    results.push("GET after delete: " + (after === null ? "(null as expected)" : "UNEXPECTED: " + after));
  } catch (e: any) {
    results.push("GET after delete failed: " + e.message);
  }

  return NextResponse.json({ results });
}
