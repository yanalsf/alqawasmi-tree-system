import { NextRequest, NextResponse } from "next/server";

/**
 * Matches the original app's contract exactly: mutating requests (POST/PUT/DELETE)
 * must send the editor password in an `x-editor-password` header (the legacy
 * front-end script already does this — it reads it from sessionStorage). Reads
 * (GET /api/tree) stay open, same as the original server, since the whole tree
 * is meant to be publicly viewable and only edits are gated.
 */
export function requireEditorPassword(req: NextRequest): NextResponse | null {
  const provided = req.headers.get("x-editor-password") ?? "";
  const expected = process.env.EDITOR_PASSWORD ?? "";
  
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  }
  return null; // null = authorized, caller should proceed
}
