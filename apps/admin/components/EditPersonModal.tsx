// apps/admin/components/EditPersonModal.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";

export interface EditedPerson {
  id: number;
  name: string;
  birth_date: string | null;
  death_date: string | null;
}

interface EditPersonModalProps {
  isOpen: boolean;
  /** The person being edited, or null while the modal is closed. */
  person: EditedPerson | null;
  onClose: () => void;
  onSaved: (person: EditedPerson) => void;
}

export default function EditPersonModal({ isOpen, person, onClose, onSaved }: EditPersonModalProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-fill the form whenever a new person is opened for editing.
  useEffect(() => {
    if (person) {
      setName(person.name);
      setBirthDate(person.birth_date ?? "");
      setDeathDate(person.death_date ?? "");
      setError(null);
    }
  }, [person]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!person) return;
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("يجب إدخال الاسم على الأقل!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/person/${person.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-editor-password": sessionStorage.getItem("editorPassword") || "",
        },
        body: JSON.stringify({
          name_text: trimmedName,
          birth_date: birthDate || null,
          death_date: deathDate || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || "فشل التعديل");
        return;
      }

      onSaved({
        id: person.id,
        name: trimmedName,
        birth_date: birthDate || null,
        death_date: deathDate || null,
      });
      onClose();
    } catch {
      setError("تعذر الاتصال بقاعدة البيانات");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen || !person) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 font-cairo"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-80 rounded-2xl bg-white p-6 text-center shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
      >
        <h3 className="mb-5 mt-0 font-extrabold text-gold-deep">تعديل بيانات: {person.name}</h3>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="الاسم (مطلوب)"
            className="mb-3 w-full rounded-lg border border-gold px-2.5 py-2.5 text-right outline-none"
            autoFocus
          />
          <input
            type="number"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mb-3 w-full rounded-lg border border-gray-300 px-2.5 py-2.5 text-right outline-none"
          />
          <input
            type="number"
            value={deathDate}
            onChange={(e) => setDeathDate(e.target.value)}
            className="mb-5 w-full rounded-lg border border-gray-300 px-2.5 py-2.5 text-right outline-none"
          />

          {error && <p className="mb-3 text-sm font-semibold text-maroon">{error}</p>}

          <div className="flex justify-center gap-2.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-green-2 px-4 py-2.5 font-bold text-white disabled:opacity-60"
            >
              {isSubmitting ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
            <button
              type="button"
              onClick={onClose}
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