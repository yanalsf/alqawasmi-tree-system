// apps/admin/components/ConfirmDeleteModal.tsx
"use client";

import { useState } from "react";

export interface DeleteTarget {
  id: number;
  name: string;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  /** The person pending deletion, or null while the modal is closed. */
  target: DeleteTarget | null;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

export default function ConfirmDeleteModal({ isOpen, target, onClose, onDeleted }: ConfirmDeleteModalProps) {
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!target) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/person/${target.id}`, {
        method: "DELETE",
        headers: { "x-editor-password": sessionStorage.getItem("editorPassword") || "" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        // Matches the legacy fallback message when the API gives no specific reason
        // (e.g. the person still has children — blocked by the DB's foreign key).
        setError(
          body?.error || "فشل الحذف. تأكد أن هذا الشخص ليس لديه أبناء (يجب حذف أبنائه أولاً)."
        );
        return;
      }

      onDeleted(target.id);
      onClose();
    } catch {
      setError("تعذر الاتصال بقاعدة البيانات");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen || !target) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 font-cairo"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-80 rounded-2xl bg-white p-6 text-center shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
      >
        <h3 className="mb-3 mt-0 font-extrabold text-maroon">تأكيد الحذف</h3>
        <p className="mb-5 text-sm text-ink">
          هل أنت متأكد من حذف <span className="font-bold">"{target.name}"</span> نهائياً من قاعدة
          البيانات؟
        </p>

        {error && <p className="mb-3 text-sm font-semibold text-maroon">{error}</p>}

        <div className="flex justify-center gap-2.5">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-maroon px-4 py-2.5 font-bold text-white disabled:opacity-60"
          >
            {isSubmitting ? "جارٍ الحذف..." : "حذف نهائياً"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-gray-400 px-4 py-2.5 font-bold text-white disabled:opacity-60"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}