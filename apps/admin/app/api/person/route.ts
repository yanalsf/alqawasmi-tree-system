export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { pool, getBranchId, VIRTUAL_ROOT_ID } from "@/lib/db";
import { requireEditorPassword } from "@/lib/auth";
import { syncToPublicSite } from "@/lib/sync";

// POST /api/person — matches the legacy front end's payload:
// { parent_id, name_text, birth_date, death_date }
//
// branch_id isn't sent by the front end — every new person is added as a
// child of an existing person somewhere in the tree, so we look up that
// parent's branch_id and the new row inherits it automatically. The only
// case that can't be inferred is adding a brand-new top-level branch
// (parent_id === VIRTUAL_ROOT_ID / 941) — the legacy UI doesn't expose a way
// to do that, but if it's ever called that way, pass branch_id explicitly
// in the request body.
export async function POST(req: NextRequest) {
  const authError = requireEditorPassword(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { parent_id, name_text, birth_date, death_date, branch_id: branchIdOverride } = body;

    if (!name_text || !parent_id) {
      return NextResponse.json({ error: "الاسم والأب مطلوبان" }, { status: 400 });
    }

    let branchId: string | null;
    if (Number(parent_id) === VIRTUAL_ROOT_ID) {
      branchId = branchIdOverride ?? null;
      if (!branchId) {
        return NextResponse.json(
          { error: "لإضافة فرع جديد بالكامل يجب تحديد branch_id" },
          { status: 400 }
        );
      }
    } else {
      branchId = await getBranchId(Number(parent_id));
      if (!branchId) {
        return NextResponse.json({ error: "لم يتم العثور على الأب المحدد" }, { status: 404 });
      }
    }

    const [result] = await pool.query(
      "INSERT INTO person (name_text, birth_date, death_date, parent_id, branch_id) VALUES (?, ?, ?, ?, ?)",
      [name_text, birth_date || null, death_date || null, parent_id, branchId]
    );
    const insertId = (result as any).insertId;

    await syncToPublicSite();

    return NextResponse.json({ id: insertId, name: name_text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "تعذر الاتصال بقاعدة البيانات" }, { status: 500 });
  }
}
