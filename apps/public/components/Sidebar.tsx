// components/Sidebar.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface PersonObj {
  id: number;
  name: string;
  depth: number;
  father: string | null;
}

interface SidebarProps {
  people: PersonObj[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPerson: (id: number) => void;
}

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 18 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export default function Sidebar({ people, isOpen, onClose, onSelectPerson }: SidebarProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // اختصار لوحة المفاتيح للبحث السريع (Ctrl+K أو /)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // دالة تنظيف النصوص لتجاهل الهمزات والتشكيل
  const normalizeArabic = (text: string) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[\u064b-\u065f]/g, "")
      .replace(/[إأآا]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/\s+/g, " ")
      .trim();
  };

  const { displayed, totalCount } = useMemo(() => {
    let result = people;
    if (search.trim()) {
      const searchKeywords = normalizeArabic(search)
        .split(" ")
        .filter((word) => word.length > 0);

      result = people.filter((p) => {
        const cleanName = normalizeArabic(p.name);

        if (!cleanName.startsWith(searchKeywords[0])) {
          return false;
        }

        if (searchKeywords.length === 1) {
          return true;
        }

        const fatherObj = p.father ? people.find((item) => item.name === p.father) : null;
        const fatherName = fatherObj
          ? normalizeArabic(fatherObj.name)
          : p.father
          ? normalizeArabic(p.father)
          : "";

        const contextWords = `${cleanName} ${fatherName}`
          .split(" ")
          .filter((w) => w.length > 0);

        return searchKeywords.every((keyword) =>
          contextWords.some((word) => word.startsWith(keyword))
        );
      });
    }
    return {
      displayed: result.slice(0, 50),
      totalCount: result.length,
    };
  }, [people, search]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm min-[901px]:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 z-[70] flex h-screen w-[320px] max-w-[86vw] flex-col overflow-hidden rounded-l-[30px] border-l border-[#c9974f]/20 bg-[#fbfaf8]/98 shadow-[-12px_0_35px_rgba(58,44,30,0.08)] backdrop-blur-xl dark:bg-[#191612]/98 dark:border-[#d6b877]/20 dark:shadow-[-12px_0_35px_rgba(0,0,0,0.5)] min-[901px]:!translate-x-0 transition-colors duration-300"
      >
        <style>{`
          .sidebar-scroll::-webkit-scrollbar { width: 5px; }
          .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
          .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(201, 151, 79, 0.45); border-radius: 10px; }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(138, 95, 46, 0.8); }
        `}</style>

        {/* الجزء العلوي الثابت: العنوان وحقل البحث */}
        <div className="flex-none px-5 pt-7 pb-4 border-b border-[#c9974f]/15 bg-gradient-to-b from-white via-[#fdfbf7] to-transparent dark:from-[#1f1b16] dark:via-[#191612] dark:border-[#d6b877]/15">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8a5f2e] to-[#c9974f] text-white shadow-sm dark:from-[#d6b877] dark:to-[#a37c35] dark:text-[#1c1915]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-[21px] font-extrabold text-[#8a5f2e] dark:text-[#d6b877] font-ruqaa m-0 leading-tight">
                  فهرس الأسماء
                </h2>
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 m-0 font-cairo">
                  بحث سريع بالاسم أو اسم الأب
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="min-[901px]:hidden grid h-8 w-8 place-items-center rounded-full bg-gray-100 dark:bg-[#2b261f] text-gray-500 dark:text-[#d6b877] hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
              aria-label="إغلاق الفهرس"
            >
              ✕
            </button>
          </div>

          {/* مربع البحث الاحترافي */}
          <div className="relative group">
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#8a5f2e] dark:text-gray-500 dark:group-focus-within:text-[#d6b877]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="ابحث عن اسم (مثال: محمد أحمد)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearch("");
              }}
              className="w-full rounded-2xl border border-[#c9974f]/30 bg-white py-2.5 pr-10 pl-9 font-cairo text-[13.5px] font-bold text-[#4a3b2c] outline-none transition-all placeholder:font-semibold placeholder:text-gray-400 focus:border-[#8a5f2e] focus:ring-4 focus:ring-[#8a5f2e]/10 shadow-sm dark:border-[#d6b877]/20 dark:bg-[#25211b] dark:text-[#f3ede1] dark:placeholder:text-gray-500 dark:focus:border-[#d6b877] dark:focus:ring-[#d6b877]/15"
            />
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  inputRef.current?.focus();
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 hover:bg-red-50 dark:bg-[#332d24] dark:hover:bg-red-900/40 text-gray-500 hover:text-red-500 dark:text-gray-300 text-xs font-bold transition-colors"
                title="مسح البحث"
              >
                ✕
              </button>
            ) : (
              <span className="pointer-events-none hidden sm:inline-flex absolute left-2.5 top-1/2 -translate-y-1/2 items-center rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 dark:border-gray-700 dark:bg-[#1c1915] dark:text-gray-500">
                /
              </span>
            )}
          </div>

          {/* شريط عدد النتائج */}
          <div className="mt-3 flex items-center justify-between px-1 font-cairo text-[11.5px] font-bold text-[#7a6855] dark:text-gray-400">
            <span>نتائج الفهرس:</span>
            <span className="rounded-full bg-[#c9974f]/10 px-2.5 py-0.5 text-[#8a5f2e] dark:bg-[#d6b877]/10 dark:text-[#d6b877]">
              {totalCount} اسماً {totalCount > 50 ? "• يُعرض أول 50" : ""}
            </span>
          </div>
        </div>

        {/* قائمة الأسماء */}
        <div className="sidebar-scroll flex-1 overflow-y-auto px-5 py-4 pb-10 font-cairo">
          {displayed.length > 0 ? (
            <motion.div
              key={search}
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-2.5"
            >
              {displayed.map((person) => {
                const isRoot = person.father === "System_Root" || !person.father;
                const fatherName = isRoot
                  ? "الجد المؤسس / الفخذ"
                  : `ابن ${person.father?.replace("فخذ ", "")}`;

                return (
                  <motion.button
                    key={person.id}
                    variants={itemVariants}
                    whileHover={{ y: -2, x: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectPerson(person.id);
                      if (window.innerWidth <= 900) onClose();
                    }}
                    className="group relative flex w-full flex-col items-start overflow-hidden rounded-2xl bg-white dark:bg-[#231f1a] p-3.5 shadow-[0_2px_8px_rgba(138,95,46,0.05)] border border-[#c9974f]/15 hover:shadow-[0_8px_20px_rgba(138,95,46,0.14)] hover:border-[#8a5f2e]/40 dark:border-[#d6b877]/10 dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] dark:hover:border-[#d6b877]/45 text-right transition-all"
                  >
                    {/* الشريط الجانبي التفاعلي للبطاقة */}
                    <div className="absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-[#c9974f]/30 to-[#8a5f2e]/30 transition-all duration-300 group-hover:w-2 group-hover:from-[#8a5f2e] group-hover:to-[#c9974f] dark:from-[#d6b877]/20 dark:to-transparent dark:group-hover:from-[#d6b877] dark:group-hover:to-[#b68d40]" />

                    <div className="flex w-full items-center justify-between pr-1.5">
                      <span className="font-extrabold text-[#1f3d1f] text-[14.5px] transition-colors group-hover:text-[#8a5f2e] dark:text-[#f3ede1] dark:group-hover:text-[#d6b877]">
                        {person.name.replace("فخذ ", "")}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {person.depth > 1 && (
                          <span className="rounded-md bg-[#f4efe6] px-1.5 py-0.5 text-[10px] font-bold text-[#8a5f2e] dark:bg-[#2e2922] dark:text-[#d6b877]/80">
                            الجيل {person.depth - 1}
                          </span>
                        )}
                        <span className="text-[12px] opacity-35 grayscale transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0">
                          🌿
                        </span>
                      </div>
                    </div>

                    <div className="mt-1 flex w-full items-center justify-between pr-1.5">
                      <span
                        className={`text-[11.5px] font-bold ${
                          isRoot
                            ? "text-[#c9974f] dark:text-[#d6b877]"
                            : "text-gray-400 dark:text-[#9a8c78]"
                        }`}
                      >
                        {fatherName}
                      </span>
                      <span className="text-[11px] font-bold text-[#8a5f2e] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-[#d6b877]">
                        عرض الفرع ⟵
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#c9974f]/30 bg-white/50 p-8 text-center dark:border-[#d6b877]/20 dark:bg-[#231f1a]/40 mt-4"
            >
              <span className="text-3xl mb-2 inline-block">🔍</span>
              <p className="text-sm font-extrabold text-[#5c4a38] dark:text-[#f3ede1] mb-1">
                لا توجد نتائج مطابقة
              </p>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3">
                تأكد من كتابة الاسم الأول بشكل صحيح
              </p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-xl bg-[#8a5f2e]/10 px-3 py-1.5 text-xs font-bold text-[#8a5f2e] hover:bg-[#8a5f2e]/20 dark:bg-[#d6b877]/15 dark:text-[#d6b877]"
              >
                إعادة ضبط البحث
              </button>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </>
  );
}