// components/KinshipModal.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import treeDataRaw from "@/data/tree.json";
import type { FamilyNode } from "../lib/constants";

import { useT } from "../lib/i18n";
const tree = treeDataRaw as unknown as FamilyNode;

interface PersonObj {
  id: number;
  name: string;
  father: string | null;
  nameAr?: string;
  fatherAr?: string | null;
}

interface KinshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: PersonObj[];
}

function getPathToRoot(root: FamilyNode, id: number): FamilyNode[] | null {
  if (root.id === id) return [root];
  for (const child of root.children ?? []) {
    const path = getPathToRoot(child, id);
    if (path) return [root, ...path];
  }
  return null;
}

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

export default function KinshipModal({ isOpen, onClose, people }: KinshipModalProps) {
  const { t, nm } = useT();
  const [person1, setPerson1] = useState<PersonObj | null>(null);
  const [person2, setPerson2] = useState<PersonObj | null>(null);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");

  const [result, setResult] = useState<{
    lcaName: string;
    relationText: string;
    path1: string[];
    path2: string[];
    d1: number;
    d2: number;
  } | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filterPeople = (query: string, selected: PersonObj | null) => {
    if (!query || selected) return [];
    const keys = normalizeArabic(query)
      .split(" ")
      .filter((w) => w.length > 0);
    if (keys.length === 0) return [];

    return people
      .filter((p) => {
        const cleanName = normalizeArabic(p.name).replace(/\b(ابن|بن)\b/g, "");
        const cleanAr = p.nameAr ? normalizeArabic(p.nameAr).replace(/\b(ابن|بن)\b/g, "") : "";
        const fatherAr = p.fatherAr ? normalizeArabic(p.fatherAr) : "";
        const fatherObj = p.father ? people.find((item) => item.name === p.father) : null;
        const fatherName = fatherObj
          ? normalizeArabic(fatherObj.name)
          : p.father
          ? normalizeArabic(p.father)
          : "";
        const fullContext = `${cleanName} ${fatherName} ${cleanAr} ${fatherAr}`;

        const firstWordMatch = cleanName.includes(keys[0]) || cleanAr.includes(keys[0]);
        return firstWordMatch && keys.every((k) => fullContext.includes(k));
      })
      .slice(0, 15);
  };

  const results1 = useMemo(() => filterPeople(search1, person1), [search1, people, person1]);
  const results2 = useMemo(() => filterPeople(search2, person2), [search2, people, person2]);

  const handleSwapPeople = () => {
    const tempP = person1;
    const tempS = search1;
    setPerson1(person2);
    setSearch1(search2);
    setPerson2(tempP);
    setSearch2(tempS);
  };

  const calculateKinship = () => {
    if (!person1 || !person2) return;

    const p1Path = getPathToRoot(tree, person1.id);
    const p2Path = getPathToRoot(tree, person2.id);

    if (!p1Path || !p2Path) return;

    const reversedP1 = [...p1Path].reverse();
    const reversedP2 = [...p2Path].reverse();

    let lcaNode: FamilyNode | null = null;
    let d1 = -1,
      d2 = -1;

    for (let i = 0; i < reversedP1.length; i++) {
      const foundIdx = reversedP2.findIndex((n) => n.id === reversedP1[i].id);
      if (foundIdx !== -1) {
        lcaNode = reversedP1[i];
        d1 = i;
        d2 = foundIdx;
        break;
      }
    }

    if (!lcaNode) return;

    let relationText = t("أقارب (من جهة الأب)");
    if (d1 === 0 && d2 === 0) relationText = t("نفس الشخص!");
    else if ((d1 === 1 && d2 === 0) || (d1 === 0 && d2 === 1)) relationText = t("أب وابنه");
    else if (d1 === 1 && d2 === 1) relationText = t("أشقاء (إخوان)");
    else if ((d1 === 2 && d2 === 0) || (d1 === 0 && d2 === 2)) relationText = t("جد وحفيده");
    else if ((d1 === 2 && d2 === 1) || (d1 === 1 && d2 === 2)) relationText = t("عم وابن أخيه");
    else if (d1 === 2 && d2 === 2) relationText = t("أبناء عمومة");
    else if (d1 === 3 && d2 === 3) relationText = t("أبناء عمومة (درجة ثانية)");

    setResult({
      lcaName: nm(lcaNode.name.replace("فخذ ", "")),
      relationText,
      path1: reversedP1.slice(0, d1 + 1).map((x) => nm(x.name.replace("فخذ ", ""))),
      path2: reversedP2.slice(0, d2 + 1).map((x) => nm(x.name.replace("فخذ ", ""))),
      d1,
      d2,
    });
  };

  const reset = () => {
    setPerson1(null);
    setPerson2(null);
    setSearch1("");
    setSearch2("");
    setResult(null);
  };

  const renderSearchResult = (p: PersonObj, onSelect: () => void) => {
    const isRoot = !p.father || p.father === "System_Root";
    const fatherDisplay = isRoot ? t("الجد الأعلى") : t("ابن {name}", { name: p.father?.replace("فخذ ", "") ?? "" });
    const nameDisplay = p.name.replace("فخذ ", "");

    return (
      <button
        type="button"
        key={p.id}
        onClick={onSelect}
        className="cursor-pointer group w-full flex items-center justify-between text-right px-4 py-3 hover:bg-gradient-to-l hover:from-[rgb(var(--b-mid-rgb)/0.15)] hover:to-transparent border-b last:border-0 border-[rgb(var(--b-mid-rgb)/0.1)] dark:border-white/5 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgb(var(--b-mid-rgb)/0.1)] dark:bg-[rgb(var(--b-lite-rgb)/0.1)] text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] text-[15px] group-hover:scale-110 group-hover:bg-[rgb(var(--b-mid-rgb)/0.25)] transition-all shadow-sm">
            🌿
          </span>
          <div className="flex flex-col">
            <span className="text-[14px] font-extrabold text-[#5c4a38] dark:text-[#f3ede1] transition-colors group-hover:text-[rgb(var(--b-deep-rgb)/1)] dark:group-hover:text-[rgb(var(--b-lite-rgb)/1)]">
              {nameDisplay}
            </span>
            <span className="text-[11.5px] font-bold text-gray-400 dark:text-[#9a8c78] mt-0.5">
              {fatherDisplay}
            </span>
          </div>
        </div>
        <span className="rounded-lg bg-[rgb(var(--b-deep-rgb)/0.1)] px-2.5 py-1 text-[11px] font-bold text-[rgb(var(--b-deep-rgb)/1)] opacity-0 group-hover:opacity-100 transition-all dark:bg-[rgb(var(--b-lite-rgb)/0.15)] dark:text-[rgb(var(--b-lite-rgb)/1)]">
          
          {t("اختيار ⟵")}
        </span>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 font-cairo">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="cursor-pointer absolute inset-0 bg-black/55 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden rounded-[32px] bg-[#fdfbf7] border border-[rgb(var(--b-mid-rgb)/0.35)] shadow-[0_25px_70px_rgba(0,0,0,0.3)] dark:bg-[#191612] dark:border-[rgb(var(--b-lite-rgb)/0.25)]"
          >
            {/* الترويسة العلوية الثابتة */}
            <div className="relative pt-5 pb-4 shrink-0 z-20 bg-gradient-to-b from-white via-[#fdfbf7] to-[#fdfbf7] dark:from-[#221e18] dark:to-[#191612] px-6 border-b border-[rgb(var(--b-mid-rgb)/0.15)] dark:border-[rgb(var(--b-lite-rgb)/0.15)] flex flex-col items-center">
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="cursor-pointer absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--b-mid-rgb)/0.25)] bg-white text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-300 transition-colors dark:bg-[#2b261f] dark:border-[rgb(var(--b-lite-rgb)/0.2)] dark:text-gray-400"
              >
                ✕
              </motion.button>

              <div className="mb-1.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--b-mid-rgb)/0.12)] text-2xl shadow-inner dark:bg-[rgb(var(--b-lite-rgb)/0.1)]">
                🧬
              </div>
              <h2 className="text-2xl font-bold text-[rgb(var(--b-deep-rgb)/1)] font-ruqaa dark:text-[rgb(var(--b-lite-rgb)/1)]">
                
                {t("كاشف صلة القرابة")}
              </h2>
              <p className="mt-0.5 text-[11.5px] font-bold text-gray-400 dark:text-gray-500">
                
                {t("استكشف الجد الجامع ومسار النسب بين أي فردين في الشجرة")}
              </p>
            </div>

            {/* المحتوى الداخلي */}
            <div className="p-6 overflow-y-auto sidebar-scroll flex-1">
              {/* تنبيه احتساب النسب */}
              <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl border border-amber-300/60 bg-amber-50/80 px-4 py-2.5 text-center dark:border-amber-800/40 dark:bg-amber-950/25">
                <span className="text-base">💡</span>
                <p className="text-[11.5px] font-bold text-amber-800 dark:text-amber-300/90 m-0 leading-relaxed">
                  
                  {t("يتم احتساب صلة القرابة والجد المشترك بناءً على تسلسل الآباء في الشجرة.")}
                </p>
              </div>

              {!result ? (
                <div className="space-y-3">
                  {/* حقل الشخص الأول */}
                  <div className="relative">
                    <label className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-[rgb(var(--b-deep-rgb)/1)] mb-1.5 pr-1 dark:text-[rgb(var(--b-lite-rgb)/1)]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--b-deep-rgb)/1)] text-[10px] text-white dark:bg-[rgb(var(--b-lite-rgb)/1)] dark:text-[#1c1915]">
                        1
                      </span>
                      <span>{t("الطرف الأول:")}</span>
                    </label>

                    {person1 ? (
                      <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center justify-between bg-gradient-to-l from-[rgb(var(--b-mid-rgb)/0.15)] via-white to-white p-3.5 rounded-2xl border-2 border-[rgb(var(--b-mid-rgb)/0.5)] dark:from-[rgb(var(--b-lite-rgb)/0.15)] dark:via-[#231f1a] dark:to-[#231f1a] dark:border-[rgb(var(--b-lite-rgb)/0.45)] shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[rgb(var(--b-deep-rgb)/1)] text-white dark:bg-[rgb(var(--b-lite-rgb)/1)] dark:text-[#1c1915] shadow-sm text-lg font-bold">
                            ✓
                          </span>
                          <div className="flex flex-col text-right">
                            <span className="font-extrabold text-[#5c4a38] dark:text-[#f3ede1] text-[15px]">
                              {person1.name.replace("فخذ ", "")}
                            </span>
                            <span className="text-[11.5px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/0.85)]">
                              {!person1.father || person1.father === "System_Root"
                                ? t("الجد الأعلى")
                                : t("ابن {name}", { name: person1.father.replace("فخذ ", "") ?? "" })}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPerson1(null);
                            setSearch1("");
                          }}
                          className="cursor-pointer text-[12px] text-red-500 hover:text-white hover:bg-red-500 font-bold bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 transition-all"
                        >
                          
                          {t("تغيير")}
                        </button>
                      </motion.div>
                    ) : (
                      <>
                        <div className="relative z-20">
                          <input
                            type="text"
                            value={search1}
                            onChange={(e) => setSearch1(e.target.value)}
                            placeholder={t("ابحث عن اسم الشخص الأول (مثال: أحمد محمد)...")}
                            className="w-full bg-white border border-[rgb(var(--b-mid-rgb)/0.35)] rounded-2xl pr-10 pl-4 py-3.5 text-[13.5px] font-bold focus:border-[rgb(var(--b-deep-rgb)/1)] focus:ring-4 focus:ring-[rgb(var(--b-mid-rgb)/0.15)] outline-none transition-all shadow-sm dark:bg-[#231f1a] dark:border-[rgb(var(--b-lite-rgb)/0.25)] dark:text-white dark:focus:ring-[rgb(var(--b-lite-rgb)/0.15)] placeholder:text-gray-400"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
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
                        </div>
                        <AnimatePresence>
                          {results1.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="relative mt-2 w-full bg-white border border-[rgb(var(--b-mid-rgb)/0.35)] rounded-2xl z-10 max-h-52 overflow-y-auto sidebar-scroll dark:bg-[#231f1a] dark:border-[rgb(var(--b-lite-rgb)/0.3)] shadow-lg"
                            >
                              {results1.map((p) =>
                                renderSearchResult(p, () => {
                                  setPerson1(p);
                                  setSearch1(p.name.replace("فخذ ", ""));
                                })
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>

                  {/* فاصل مع زر التبديل السريع */}
                  <div className="relative flex items-center justify-center py-1">
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[rgb(var(--b-mid-rgb)/0.3)] to-transparent dark:via-[rgb(var(--b-lite-rgb)/0.2)]" />
                    <motion.button
                      type="button"
                      onClick={handleSwapPeople}
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      title={t("تبديل الطرفين")}
                      className="cursor-pointer absolute flex h-8 w-8 items-center justify-center rounded-full border border-[rgb(var(--b-mid-rgb)/0.35)] bg-white text-xs text-[rgb(var(--b-deep-rgb)/1)] shadow-sm hover:border-[rgb(var(--b-deep-rgb)/1)] dark:border-[rgb(var(--b-lite-rgb)/0.3)] dark:bg-[#25211b] dark:text-[rgb(var(--b-lite-rgb)/1)]"
                    >
                      ⇅
                    </motion.button>
                  </div>

                  {/* حقل الشخص الثاني */}
                  <div className="relative">
                    <label className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-[rgb(var(--b-deep-rgb)/1)] mb-1.5 pr-1 dark:text-[rgb(var(--b-lite-rgb)/1)]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--b-deep-rgb)/1)] text-[10px] text-white dark:bg-[rgb(var(--b-lite-rgb)/1)] dark:text-[#1c1915]">
                        2
                      </span>
                      <span>{t("الطرف الثاني:")}</span>
                    </label>

                    {person2 ? (
                      <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center justify-between bg-gradient-to-l from-[rgb(var(--b-mid-rgb)/0.15)] via-white to-white p-3.5 rounded-2xl border-2 border-[rgb(var(--b-mid-rgb)/0.5)] dark:from-[rgb(var(--b-lite-rgb)/0.15)] dark:via-[#231f1a] dark:to-[#231f1a] dark:border-[rgb(var(--b-lite-rgb)/0.45)] shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[rgb(var(--b-deep-rgb)/1)] text-white dark:bg-[rgb(var(--b-lite-rgb)/1)] dark:text-[#1c1915] shadow-sm text-lg font-bold">
                            ✓
                          </span>
                          <div className="flex flex-col text-right">
                            <span className="font-extrabold text-[#5c4a38] dark:text-[#f3ede1] text-[15px]">
                              {person2.name.replace("فخذ ", "")}
                            </span>
                            <span className="text-[11.5px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/0.85)]">
                              {!person2.father || person2.father === "System_Root"
                                ? t("الجد الأعلى")
                                : t("ابن {name}", { name: person2.father.replace("فخذ ", "") ?? "" })}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPerson2(null);
                            setSearch2("");
                          }}
                          className="cursor-pointer text-[12px] text-red-500 hover:text-white hover:bg-red-500 font-bold bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 transition-all"
                        >
                          
                          {t("تغيير")}
                        </button>
                      </motion.div>
                    ) : (
                      <>
                        <div className="relative z-20">
                          <input
                            type="text"
                            value={search2}
                            onChange={(e) => setSearch2(e.target.value)}
                            placeholder={t("ابحث عن اسم الشخص الثاني...")}
                            className="w-full bg-white border border-[rgb(var(--b-mid-rgb)/0.35)] rounded-2xl pr-10 pl-4 py-3.5 text-[13.5px] font-bold focus:border-[rgb(var(--b-deep-rgb)/1)] focus:ring-4 focus:ring-[rgb(var(--b-mid-rgb)/0.15)] outline-none transition-all shadow-sm dark:bg-[#231f1a] dark:border-[rgb(var(--b-lite-rgb)/0.25)] dark:text-white dark:focus:ring-[rgb(var(--b-lite-rgb)/0.15)] placeholder:text-gray-400"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
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
                        </div>
                        <AnimatePresence>
                          {results2.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="relative mt-2 w-full bg-white border border-[rgb(var(--b-mid-rgb)/0.35)] rounded-2xl z-10 max-h-52 overflow-y-auto sidebar-scroll dark:bg-[#231f1a] dark:border-[rgb(var(--b-lite-rgb)/0.3)] shadow-lg"
                            >
                              {results2.map((p) =>
                                renderSearchResult(p, () => {
                                  setPerson2(p);
                                  setSearch2(p.name.replace("فخذ ", ""));
                                })
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>

                  {/* زر الحساب */}
                  <motion.button
                    type="button"
                    disabled={!person1 || !person2}
                    onClick={calculateKinship}
                    whileHover={!person1 || !person2 ? undefined : { scale: 1.01, y: -2 }}
                    whileTap={!person1 || !person2 ? undefined : { scale: 0.98 }}
                    className="cursor-pointer w-full mt-5 bg-gradient-to-l from-[rgb(var(--b-deep-rgb)/1)] via-[#a8793d] to-[rgb(var(--b-mid-rgb)/1)] text-white font-extrabold py-4 text-[15px] rounded-2xl disabled:opacity-45 disabled:cursor-not-allowed transition-all shadow-[0_10px_25px_rgba(138,95,46,0.25)] hover:shadow-[0_15px_30px_rgba(138,95,46,0.35)] dark:from-[#243d21] dark:to-[#35592b] dark:text-[rgb(var(--b-lite-rgb)/1)] dark:border dark:border-[rgb(var(--b-lite-rgb)/0.25)]"
                  >
                    
                    {t("🔍 اكشف صلة القرابة الآن")}
                  </motion.button>
                </div>
              ) : (
                /* شاشة عرض النتيجة التفاعلية */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-5 w-full"
                >
                  <div className="relative bg-gradient-to-b from-[rgb(var(--b-mid-rgb)/0.15)] via-[#fdfbf7] to-white p-5 sm:p-6 rounded-3xl border border-[rgb(var(--b-mid-rgb)/0.4)] dark:from-[rgb(var(--b-lite-rgb)/0.12)] dark:via-[#1f1b16] dark:to-[#191612] dark:border-[rgb(var(--b-lite-rgb)/0.25)] shadow-inner overflow-hidden">
                    <span className="inline-block rounded-full bg-[rgb(var(--b-deep-rgb)/0.1)] px-3 py-0.5 text-[11px] font-extrabold text-[rgb(var(--b-deep-rgb)/1)] dark:bg-[rgb(var(--b-lite-rgb)/0.15)] dark:text-[rgb(var(--b-lite-rgb)/1)]">
                      
                      {t("نتيجة صلة النسب")}
                    </span>
                    <h3 className="mt-1 text-[24px] font-extrabold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)]">
                      {result.relationText}
                    </h3>

                    {result.relationText !== "نفس الشخص!" && (
                      <div className="mt-2 flex items-center justify-center gap-2 text-[11.5px] font-bold text-gray-500 dark:text-gray-400">
                        <span>{t("بعد الطرف الأول:")} {result.d1}  {t("أجيال")}</span>
                        <span>•</span>
                        <span>{t("بعد الطرف الثاني:")} {result.d2}  {t("أجيال")}</span>
                      </div>
                    )}

                    {result.relationText === "نفس الشخص!" ? (
                      <p className="text-[14px] font-bold text-gray-600 dark:text-gray-400 mt-4">
                        
                        {t("لقد قمت باختيار نفس الشخص في كلا الحقلين.")}
                      </p>
                    ) : (
                      <div className="relative mt-8 pt-2 w-full">
                        {/* الجد المشترك في القمة */}
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="relative z-20 mx-auto w-fit min-w-[155px] bg-gradient-to-b from-[rgb(var(--b-deep-rgb)/1)] to-[#b58242] text-white px-5 py-3 rounded-2xl font-bold shadow-[0_10px_25px_rgba(138,95,46,0.35)] border-2 border-[#fffdf8] dark:border-[#2b261f]"
                        >
                          <span className="block text-[10.5px] text-[#fff8ec]/90 mb-0.5 tracking-wider">
                             
                             {t("الجد المشترك (الجامع)")}
                          </span>
                          <span className="block text-[16.5px] font-extrabold">
                            {result.lcaName}
                          </span>
                        </motion.div>

                        {/* خط التفرع الأفقي تحت الجد المشترك */}
                        <div className="mx-auto h-4 w-[2px] bg-[rgb(var(--b-mid-rgb)/1)] dark:bg-[rgb(var(--b-lite-rgb)/1)]" />
                        <div className="mx-auto w-[54%] h-[2px] bg-[rgb(var(--b-mid-rgb)/1)] dark:bg-[rgb(var(--b-lite-rgb)/1)] shadow-sm" />

                        <div className="flex justify-between items-start text-center relative w-full gap-2">
                          {/* مسار الشخص الأول */}
                          <div className="flex flex-col items-center flex-1 z-10">
                            {result.path1
                              .slice(0, -1)
                              .reverse()
                              .map((name, i, arr) => {
                                const isTarget = i === arr.length - 1;
                                return (
                                  <motion.div
                                    key={`p1-${i}`}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.08 }}
                                    className="flex flex-col items-center w-full"
                                  >
                                    <div className="h-5 w-[2px] bg-[rgb(var(--b-mid-rgb)/1)] dark:bg-[rgb(var(--b-lite-rgb)/0.8)]" />
                                    <div
                                      className={`px-2.5 py-2 rounded-xl font-bold text-[12.5px] w-[95%] max-w-[145px] leading-tight transition-all relative ${
                                        isTarget
                                          ? "bg-gradient-to-b from-[rgb(var(--b-strong-rgb)/1)] to-[rgb(var(--b-ink-rgb)/1)] text-white border-2 border-[#fffdf8] dark:border-[#2b261f] shadow-md scale-105 z-10"
                                          : "bg-white dark:bg-[#25211b] border border-[rgb(var(--b-mid-rgb)/0.4)] dark:border-[rgb(var(--b-lite-rgb)/0.35)] text-[#5c4a38] dark:text-[#f3ede1] shadow-sm"
                                      }`}
                                    >
                                      {name}
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>

                          {/* مسار الشخص الثاني */}
                          <div className="flex flex-col items-center flex-1 z-10">
                            {result.path2
                              .slice(0, -1)
                              .reverse()
                              .map((name, i, arr) => {
                                const isTarget = i === arr.length - 1;
                                return (
                                  <motion.div
                                    key={`p2-${i}`}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.08 }}
                                    className="flex flex-col items-center w-full"
                                  >
                                    <div className="h-5 w-[2px] bg-[rgb(var(--b-mid-rgb)/1)] dark:bg-[rgb(var(--b-lite-rgb)/0.8)]" />
                                    <div
                                      className={`px-2.5 py-2 rounded-xl font-bold text-[12.5px] w-[95%] max-w-[145px] leading-tight transition-all relative ${
                                        isTarget
                                          ? "bg-gradient-to-b from-[rgb(var(--b-strong-rgb)/1)] to-[rgb(var(--b-ink-rgb)/1)] text-white border-2 border-[#fffdf8] dark:border-[#2b261f] shadow-md scale-105 z-10"
                                          : "bg-white dark:bg-[#25211b] border border-[rgb(var(--b-mid-rgb)/0.4)] dark:border-[rgb(var(--b-lite-rgb)/0.35)] text-[#5c4a38] dark:text-[#f3ede1] shadow-sm"
                                      }`}
                                    >
                                      {name}
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={reset}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 text-[14px] font-extrabold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] transition-all bg-[rgb(var(--b-mid-rgb)/0.12)] hover:bg-[rgb(var(--b-mid-rgb)/0.25)] dark:bg-[rgb(var(--b-lite-rgb)/0.1)] dark:hover:bg-[rgb(var(--b-lite-rgb)/0.2)] px-6 py-3 rounded-full shadow-sm border border-[rgb(var(--b-mid-rgb)/0.3)] mb-2"
                  >
                    <span>🔄</span>
                    <span>{t("إجراء مقارنة جديدة")}</span>
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}