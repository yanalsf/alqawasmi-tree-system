export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchFullTree } from "@/lib/db";

// GET /api/tree — returns the full nested tree, same shape as the old data.js.
// Open read, matching the original app (no password required to view).
export async function GET() {
  try {
    const tree = await fetchFullTree();
    return NextResponse.json(tree);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "تعذر الاتصال بقاعدة البيانات" }, { status: 500 });
  }
}
