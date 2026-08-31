export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireEditorPassword } from "@/lib/auth";
import { syncToPublicSite } from "@/lib/sync";

// PUT /api/person/:id — matches legacy payload: { name_text, birth_date, death_date }
// branch_id is left untouched on update — editing someone's name/dates never
// moves them to a different branch.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireEditorPassword(req);
  if (authError) return authError;

  const personId = Number(params.id);
  if (!Number.isInteger(personId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { name_text, birth_date, death_date } = body;

    if (!name_text || !String(name_text).trim()) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    }

    const [result] = await pool.query(
      "UPDATE person SET name_text = ?, birth_date = ?, death_date = ? WHERE person_id = ?",
      [name_text, birth_date || null, death_date || null, personId]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "لم يتم العثور على هذا الشخص" }, { status: 404 });
    }

    await syncToPublicSite();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "تعذر الاتصال بقاعدة البيانات" }, { status: 500 });
  }
}

// DELETE /api/person/:id — refuses deletion if the person still has children,
// matching the original app's message: "يجب حذف أبنائه أولاً".
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireEditorPassword(req);
  if (authError) return authError;

  const personId = Number(params.id);
  if (!Number.isInteger(personId)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  try {
    const [childRows] = await pool.query(
      "SELECT COUNT(*) as cnt FROM person WHERE parent_id = ?",
      [personId]
    );
    const hasChildren = (childRows as any[])[0].cnt > 0;

    if (hasChildren) {
      return NextResponse.json(
        { error: "فشل الحذف. تأكد أن هذا الشخص ليس لديه أبناء (يجب حذف أبنائه أولاً)." },
        { status: 400 }
      );
    }

    const [result] = await pool.query("DELETE FROM person WHERE person_id = ?", [personId]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "لم يتم العثور على هذا الشخص" }, { status: 404 });
    }

    await syncToPublicSite();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "تعذر الاتصال بقاعدة البيانات" }, { status: 500 });
  }
}