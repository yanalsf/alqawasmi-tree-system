// apps/admin/components/AddPersonModal.tsx
"use client";

import { useState, FormEvent } from "react";
import { VIRTUAL_ROOT_ID } from "@/lib/constants";
import { BRANCHES } from "@/lib/branches";

export interface CreatedPerson {
  id: number;
  name: string;
  birth_date: string | null;
  death_date: string | null;
}

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The person this new node will be a child of. Pass VIRTUAL_ROOT_ID (941) to add a brand-new top-level branch. */
  parentId: number;
  onCreated: (person: CreatedPerson) => void;
}

export default function AddPersonModal({ isOpen, onClose, parentId, onCreated }: AddPersonModalProps) {
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNewBranchRoot = parentId === VIRTUAL_ROOT_ID;

  function resetAndClose() {
    setName("");
    setBranchId("");
    setBirthDate("");
    setDeathDate("");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("يجب إدخال الاسم على الأقل!");
      return;
    }
    if (isNewBranchRoot && !branchId) {
      setError("يجب تحديد الفخذ عند إضافة فرع جديد بالكامل");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/person", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-editor-password": sessionStorage.getItem("editorPassword") || "",
        },
        body: JSON.stringify({
          parent_id: parentId,
          name_text: trimmedName,
          birth_date: birthDate || null,
          death_date: deathDate || null,
          ...(isNewBranchRoot ? { branch_id: branchId } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || "فشلت الإضافة - تأكد من صلاحياتك");
        return;
      }

      const created = await res.json(); // { id, name }
      onCreated({
        id: created.id,
        name: created.name,
        birth_date: birthDate || null,
        death_date: deathDate || null,
      });
      resetAndClose();
    } catch {
      setError("تعذر الاتصال بقاعدة البيانات");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      onClick={resetAndClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 font-cairo"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-80 rounded-2xl bg-white p-6 text-center shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
      >
        <h3 className="mb-5 mt-0 font-extrabold text-gold-deep">
          {isNewBranchRoot ? "إضافة فرع جديد" : "إضافة ابن جديد"}
        </h3>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="الاسم (مطلوب)"
            className="mb-3 w-full rounded-lg border border-gold px-2.5 py-2.5 text-right outline-none"
            autoFocus
          />

          {isNewBranchRoot && (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="mb-3 w-full rounded-lg border border-gray-300 px-2.5 py-2.5 text-right outline-none"
            >
              <option value="">اختر الفخذ...</option>
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            placeholder="سنة الولادة (مثال: 1990)"
            className="mb-3 w-full rounded-lg border border-gray-300 px-2.5 py-2.5 text-right outline-none"
          />
          <input
            type="date"
            value={deathDate}
            onChange={(e) => setDeathDate(e.target.value)}
            placeholder="سنة الوفاة (للمتوفين فقط)"
            className="mb-5 w-full rounded-lg border border-gray-300 px-2.5 py-2.5 text-right outline-none"
          />

          {error && <p className="mb-3 text-sm font-semibold text-maroon">{error}</p>}

          <div className="flex justify-center gap-2.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-green-2 px-4 py-2.5 font-bold text-white disabled:opacity-60"
            >
              {isSubmitting ? "جارٍ الحفظ..." : "حفظ البيانات"}
            </button>
            <button
              type="button"
              onClick={resetAndClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-maroon px-4 py-2.5 font-bold text-white disabled:opacity-60"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}