"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useT } from "../lib/i18n";
import { BRANCHES, getBranchById, buildBranchTheme } from "../lib/branches";
import { SUPERVISORS, formatPhone, toWhatsappNumber } from "../lib/supervisors";

interface SupervisorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.84 9.84 0 0 0 19.07 4.9 9.83 9.83 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.25 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.23-.16-.48-.29Z" />
  </svg>
);

export default function SupervisorsModal({ isOpen, onClose }: SupervisorsModalProps) {
  const { t, nm, lang } = useT();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 font-cairo">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-[32px] border border-[rgb(var(--b-mid-rgb)/0.35)] bg-[#fdfbf7] shadow-[0_25px_70px_rgba(0,0,0,0.25)] dark:border-[rgb(var(--b-lite-rgb)/0.25)] dark:bg-[#191612]"
          >
            <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full bg-[rgb(var(--b-mid-rgb)/0.2)] blur-3xl dark:bg-[rgb(var(--b-lite-rgb)/0.1)]" />

            <button
              type="button"
              onClick={onClose}
              aria-label={t("إغلاق")}
              className="absolute end-4 top-4 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[rgb(var(--b-mid-rgb)/0.25)] bg-white text-gray-500 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:bg-[#24201a] dark:text-gray-400"
            >
              ✕
            </button>

            {/* الترويسة */}
            <div className="relative z-10 flex shrink-0 flex-col items-center px-6 pb-4 pt-7 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgb(var(--b-mid-rgb)/0.3)] bg-gradient-to-br from-white via-[#fdfbf7] to-[rgb(var(--b-pale-rgb)/1)] text-3xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:from-[#24201a] dark:to-[#191612]">
                🛡️
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[rgb(var(--b-mid-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/0.8)]">
                {t("فريق تدقيق البيانات")}
              </span>
              <h2 className="mt-0.5 font-ruqaa text-3xl font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)]">
                {t("مشرفو الموقع")}
              </h2>
              <p className="mx-auto mt-2 max-w-[300px] text-[12.5px] font-semibold leading-relaxed text-[#7c6c53] dark:text-[#9a8c78]">
                {t("تُدقَّق بيانات الشجرة عن طريق هؤلاء المشرفين. تواصل معهم مباشرة عبر واتساب.")}
              </p>
            </div>

            {/* القائمة */}
            <div className="sidebar-scroll relative z-10 flex-1 space-y-3 overflow-y-auto px-5 pb-6 pt-1">
              {SUPERVISORS.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[rgb(var(--b-mid-rgb)/0.4)] bg-white/60 px-4 py-8 text-center text-[13px] font-bold text-[#7c6c53] dark:bg-white/5 dark:text-[#9a8c78]">
                  {t("قائمة المشرفين قيد الإعداد.")}
                </div>
              )}

              {SUPERVISORS.map((s, i) => {
                const branch = getBranchById(s.branch);
                const color = (branch ?? BRANCHES[0]).color;
                const th = buildBranchTheme(color, false);
                const display = nm(s.name);
                const role = lang === "en" ? s.roleEn ?? s.role : s.role;
                const num = toWhatsappNumber(s.phone);
                const msg = t("السلام عليكم، تواصلت معك من موقع شجرة عائلة القواسمي.");
                return (
                  <motion.div
                    key={s.name + s.phone}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, type: "spring", damping: 24, stiffness: 300 }}
                    className="relative overflow-hidden rounded-2xl border border-[rgb(var(--b-mid-rgb)/0.25)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-[#24201a]"
                  >
                    <div className="absolute inset-y-0 start-0 w-1.5" style={{ background: th["--b-mid"] }} />
                    <div className="flex items-center gap-3 ps-2">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-extrabold text-white shadow-md"
                        style={{ background: `linear-gradient(145deg, ${th["--b-soft"]}, ${th["--b-ink"]})` }}
                      >
                        {display.trim().charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-extrabold text-[#4a3b2b] dark:text-[#f3ede1]">{display}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {role && <span className="text-[11.5px] font-bold text-[#7c6c53] dark:text-[#9a8c78]">{role}</span>}
                          {branch && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10.5px] font-extrabold text-white"
                              style={{ background: th["--b-deep"] }}
                            >
                              {t(branch.label)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/${num}?text=${encodeURIComponent(msg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-gradient-to-l from-[#1faa59] to-[#25c466] px-3.5 py-2.5 text-white shadow-[0_6px_14px_rgba(31,170,89,0.3)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      <span className="flex items-center gap-2 text-[13px] font-extrabold">
                        <WhatsappIcon />
                        {t("تواصل عبر واتساب")}
                      </span>
                      <span dir="ltr" className="text-[13px] font-bold tracking-wide opacity-95">
                        {formatPhone(s.phone)}
                      </span>
                    </a>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
