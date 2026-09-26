"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import treeDataRaw from "@/data/tree.json";
import type { FamilyNode } from "@/lib/constants";

const tree = treeDataRaw as unknown as FamilyNode;

interface PersonObj {
  id: number;
  name: string;
  father: string | null;
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
  const [person1, setPerson1] = useState<PersonObj | null>(null);
  const [person2, setPerson2] = useState<PersonObj | null>(null);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  
  const [result, setResult] = useState<{
    lcaName: string;
    relationText: string;
    path1: string[];
    path2: string[];
  } | null>(null);

  // دالة البحث الذكية المتطورة للشخص الأول
  const results1 = useMemo(() => {
    if (!search1 || person1) return [];
    const keys = normalizeArabic(search1).split(" ").filter(w => w.length > 0);
    if (keys.length === 0) return [];

    return people.filter(p => {
      const cleanName = normalizeArabic(p.name).replace(/\b(ابن|بن)\b/g, "");
      const fatherObj = p.father ? people.find(item => item.name === p.father) : null;
      const fatherName = fatherObj ? normalizeArabic(fatherObj.name) : (p.father ? normalizeArabic(p.father) : "");
      const fullContext = `${cleanName} ${fatherName}`;
      
      const firstWordMatch = cleanName.includes(keys[0]);
      return firstWordMatch && keys.every(k => fullContext.includes(k));
    }).slice(0, 15);
  }, [search1, people, person1]);

  // دالة البحث الذكية المتطورة للشخص الثاني
  const results2 = useMemo(() => {
    if (!search2 || person2) return [];
    const keys = normalizeArabic(search2).split(" ").filter(w => w.length > 0);
    if (keys.length === 0) return [];

    return people.filter(p => {
      const cleanName = normalizeArabic(p.name).replace(/\b(ابن|بن)\b/g, "");
      const fatherObj = p.father ? people.find(item => item.name === p.father) : null;
      const fatherName = fatherObj ? normalizeArabic(fatherObj.name) : (p.father ? normalizeArabic(p.father) : "");
      const fullContext = `${cleanName} ${fatherName}`;
      
      const firstWordMatch = cleanName.includes(keys[0]);
      return firstWordMatch && keys.every(k => fullContext.includes(k));
    }).slice(0, 15);
  }, [search2, people, person2]);

  const calculateKinship = () => {
    if (!person1 || !person2) return;

    const p1Path = getPathToRoot(tree, person1.id);
    const p2Path = getPathToRoot(tree, person2.id);

    if (!p1Path || !p2Path) return;

    const reversedP1 = [...p1Path].reverse();
    const reversedP2 = [...p2Path].reverse();

    let lcaNode: FamilyNode | null = null;
    let d1 = -1, d2 = -1;

    for (let i = 0; i < reversedP1.length; i++) {
      const foundIdx = reversedP2.findIndex(n => n.id === reversedP1[i].id);
      if (foundIdx !== -1) {
        lcaNode = reversedP1[i];
        d1 = i;
        d2 = foundIdx;
        break;
      }
    }

    if (!lcaNode) return;

    let relationText = "أقارب (من جهة الأب)";
    if (d1 === 0 && d2 === 0) relationText = "نفس الشخص!";
    else if ((d1 === 1 && d2 === 0) || (d1 === 0 && d2 === 1)) relationText = "أب وابنه";
    else if (d1 === 1 && d2 === 1) relationText = "أشقاء (إخوان)";
    else if ((d1 === 2 && d2 === 0) || (d1 === 0 && d2 === 2)) relationText = "جد وحفيده";
    else if ((d1 === 2 && d2 === 1) || (d1 === 1 && d2 === 2)) relationText = "عم وابن أخيه";
    else if (d1 === 2 && d2 === 2) relationText = "أبناء عمومة";
    else if (d1 === 3 && d2 === 3) relationText = "أبناء عمومة (درجة ثانية)";

    setResult({
      lcaName: lcaNode.name.replace('فخذ ', ''),
      relationText,
      path1: reversedP1.slice(0, d1 + 1).map(n => n.name.replace('فخذ ', '')),
      path2: reversedP2.slice(0, d2 + 1).map(n => n.name.replace('فخذ ', ''))
    });
  };

  const reset = () => {
    setPerson1(null); setPerson2(null);
    setSearch1(""); setSearch2("");
    setResult(null);
  };

  const renderSearchResult = (p: PersonObj, onSelect: () => void) => {
    const isRoot = !p.father || p.father === "System_Root";
    const fatherDisplay = isRoot ? "الجد الأعلى" : `ابن ${p.father?.replace('فخذ ', '')}`;
    const nameDisplay = p.name.replace('فخذ ', '');

    return (
      <button 
        key={p.id} 
        onClick={onSelect} 
        className="group w-full flex items-center justify-between text-right px-4 py-3 hover:bg-gradient-to-l hover:from-[#c9974f]/10 hover:to-transparent border-b last:border-0 border-[#c9974f]/10 dark:border-white/5 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#c9974f]/10 dark:bg-[#d6b877]/10 text-[#8a5f2e] dark:text-[#d6b877] text-[16px] group-hover:scale-110 group-hover:bg-[#c9974f]/20 transition-all shadow-sm">
            🌿
          </span>
          <div className="flex flex-col">
            <span className="text-[14.5px] font-extrabold text-[#5c4a38] dark:text-[#f3ede1] transition-colors group-hover:text-[#8a5f2e] dark:group-hover:text-[#d6b877]">
              {nameDisplay}
            </span>
            <span className="text-[12px] font-bold text-gray-500/90 dark:text-[#9a8c78]/80 mt-0.5">
              {fatherDisplay}
            </span>
          </div>
        </div>
        <span className="opacity-0 group-hover:opacity-100 text-[#c9974f] transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-lg">
          👈
        </span>
      </button>
    );
  };

 return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-md" />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            // 🌟 التعديل هنا: تحديد أقصى ارتفاع (max-h-[90vh]) وجعل النافذة مقسمة لترويسة ومحتوى
            className="relative w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden rounded-3xl bg-[#fdfbf7] border border-[#c9974f]/30 shadow-2xl dark:bg-[#1c1915] dark:border-[#d6b877]/20"
          >
            {/* 🌟 الترويسة العلوية (ثابتة لا تتحرك مع السحب) */}
            <div className="relative pt-5 pb-3 shrink-0 z-20 bg-[#fdfbf7] dark:bg-[#1c1915] px-6 border-b border-[#c9974f]/10 dark:border-[#d6b877]/10 flex flex-col items-center">
              <button onClick={onClose} className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border-none outline-none focus:outline-none focus:ring-0 dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30">✕</button>
              <span className="text-3xl mb-1 block">🧬</span>
              <h2 className="text-2xl font-bold text-[#8a5f2e] font-ruqaa dark:text-[#d6b877]">كاشف القرابة</h2>
            </div>

            {/* 🌟 المحتوى الداخلي (قابل للسحب عند الحاجة) */}
            <div className="p-6 overflow-y-auto sidebar-scroll flex-1">
              
              <div className="text-center mb-6">
                <div className="inline-block bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/40 rounded-xl px-4 py-2">
                  <p className="text-[11.5px] font-bold text-orange-700 dark:text-orange-400 m-0 leading-relaxed">
                    ⚠️ ملاحظة: يقوم النظام باحتساب صلة القرابة بناءً على شجرة العائلة <span className="underline underline-offset-4">من جهة الأب فقط</span>.
                  </p>
                </div>
              </div>

              {!result ? (
                <div className="space-y-5">
                  <div className="relative">
                    <label className="block text-[13px] font-bold text-[#8a5f2e] mb-2 pr-2 dark:text-[#d6b877]">الشخص الأول:</label>
                    {person1 ? (
                      <div className="flex items-center justify-between bg-gradient-to-l from-[#c9974f]/10 to-transparent p-3.5 rounded-2xl border border-[#c9974f]/40 dark:from-[#d6b877]/10 dark:border-[#d6b877]/40 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#2b261f] text-[#8a5f2e] dark:text-[#d6b877] shadow-sm text-xl">👤</span>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-[#5c4a38] dark:text-[#f3ede1] text-[15px]">{person1.name.replace('فخذ ', '')}</span>
                            <span className="text-[12px] font-bold text-[#8a5f2e] dark:text-[#d6b877]/80">{!person1.father || person1.father === "System_Root" ? "الجد الأعلى" : `ابن ${person1.father.replace('فخذ ', '')}`}</span>
                          </div>
                        </div>
                        <button onClick={() => { setPerson1(null); setSearch1(""); }} className="text-[12px] text-red-500 hover:text-white hover:bg-red-500 font-bold bg-white dark:bg-[#2b261f] px-3 py-1.5 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 transition-all">تغيير</button>
                      </div>
                    ) : (
                      <>
                        <div className="relative z-20">
                          <input type="text" value={search1} onChange={(e) => setSearch1(e.target.value)} placeholder="اكتب اسم الشخص الأول..." className="w-full bg-white border border-[#c9974f]/30 rounded-2xl px-10 py-3.5 text-[14px] font-bold focus:border-[#c9974f] focus:ring-4 focus:ring-[#c9974f]/10 outline-none transition-all shadow-sm dark:bg-[#24201a] dark:border-[#d6b877]/30 dark:text-white dark:focus:ring-[#d6b877]/10 placeholder-gray-400" />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                          </span>
                        </div>
                        <AnimatePresence>
                          {results1.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="relative mt-2 w-full bg-[#fdfbf7] border border-[#c9974f]/30 rounded-2xl z-10 max-h-56 overflow-y-auto sidebar-scroll dark:bg-[#1c1915] dark:border-[#d6b877]/30 shadow-inner">
                              {results1.map(p => renderSearchResult(p, () => { setPerson1(p); setSearch1(p.name.replace('فخذ ', '')); }))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-[13px] font-bold text-[#8a5f2e] mb-2 pr-2 dark:text-[#d6b877]">الشخص الثاني:</label>
                    {person2 ? (
                      <div className="flex items-center justify-between bg-gradient-to-l from-[#c9974f]/10 to-transparent p-3.5 rounded-2xl border border-[#c9974f]/40 dark:from-[#d6b877]/10 dark:border-[#d6b877]/40 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#2b261f] text-[#8a5f2e] dark:text-[#d6b877] shadow-sm text-xl">👤</span>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-[#5c4a38] dark:text-[#f3ede1] text-[15px]">{person2.name.replace('فخذ ', '')}</span>
                            <span className="text-[12px] font-bold text-[#8a5f2e] dark:text-[#d6b877]/80">{!person2.father || person2.father === "System_Root" ? "الجد الأعلى" : `ابن ${person2.father.replace('فخذ ', '')}`}</span>
                          </div>
                        </div>
                        <button onClick={() => { setPerson2(null); setSearch2(""); }} className="text-[12px] text-red-500 hover:text-white hover:bg-red-500 font-bold bg-white dark:bg-[#2b261f] px-3 py-1.5 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 transition-all">تغيير</button>
                      </div>
                    ) : (
                      <>
                        <div className="relative z-20">
                          <input type="text" value={search2} onChange={(e) => setSearch2(e.target.value)} placeholder="اكتب اسم الشخص الثاني..." className="w-full bg-white border border-[#c9974f]/30 rounded-2xl px-10 py-3.5 text-[14px] font-bold focus:border-[#c9974f] focus:ring-4 focus:ring-[#c9974f]/10 outline-none transition-all shadow-sm dark:bg-[#24201a] dark:border-[#d6b877]/30 dark:text-white dark:focus:ring-[#d6b877]/10 placeholder-gray-400" />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                          </span>
                        </div>
                        <AnimatePresence>
                          {results2.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="relative mt-2 w-full bg-[#fdfbf7] border border-[#c9974f]/30 rounded-2xl z-10 max-h-56 overflow-y-auto sidebar-scroll dark:bg-[#1c1915] dark:border-[#d6b877]/30 shadow-inner">
                              {results2.map(p => renderSearchResult(p, () => { setPerson2(p); setSearch2(p.name.replace('فخذ ', '')); }))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>

                  <button
                    disabled={!person1 || !person2}
                    onClick={calculateKinship}
                    className="w-full mt-4 bg-gradient-to-l from-[#8a5f2e] to-[#c9974f] text-white font-bold py-4 text-[15px] rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_10px_25px_rgba(138,95,46,0.3)] hover:scale-[1.01] active:scale-[0.98] dark:from-[#1f3d1f] dark:to-[#2d4a25] dark:text-[#d6b877] dark:border dark:border-[#d6b877]/20"
                  >
                     اكشف صلة القرابة
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 w-full">
                  
                  <div className="bg-gradient-to-b from-[#c9974f]/10 to-[#c9974f]/5 p-6 rounded-3xl border border-[#c9974f]/30 dark:from-[#d6b877]/10 dark:to-transparent dark:border-[#d6b877]/20 shadow-inner overflow-hidden">
                    <h3 className="text-[22px] font-extrabold text-[#8a5f2e] dark:text-[#d6b877] mb-2">{result.relationText}</h3>
                    
                    {result.relationText === "نفس الشخص!" ? (
                      <p className="text-[14px] font-bold text-gray-600 dark:text-gray-400 mt-4">لقد قمت باختيار نفس الشخص مرتين.</p>
                    ) : (
                      <div className="relative mt-12 pt-2 w-full">
                        <div className="absolute top-[28px] left-[25%] right-[25%] h-[2px] bg-[#c9974f] dark:bg-[#d6b877]/80 shadow-[0_0_8px_rgba(201,151,79,0.3)]" />
                        
                        <div className="flex justify-between items-start text-center relative w-full">
                          
                          {/* مسار الشخص الأول */}
                          <div className="flex flex-col items-center flex-1 z-10">
                            {result.path1.slice(0, -1).reverse().map((name, i, arr) => {
                              const isTarget = i === arr.length - 1;
                              return (
                                <div key={`p1-${i}`} className="flex flex-col items-center w-full">
                                  <div className="h-7 w-[2px] bg-[#c9974f] dark:bg-[#d6b877]/80" />
                                  <div className={`px-2 py-2.5 rounded-xl font-bold text-[13px] w-[95%] max-w-[140px] leading-tight transition-all relative ${
                                    isTarget 
                                      ? "bg-gradient-to-b from-[#4c7a3f] to-[#2d4a25] text-white border-2 border-[#fffdf8] dark:border-[#1c1915] shadow-lg scale-105 z-10" 
                                      : "bg-white dark:bg-[#2b261f] border border-[#c9974f]/40 dark:border-[#d6b877]/40 text-[#5c4a38] dark:text-[#f3ede1] shadow-sm"
                                  }`}>
                                    {name}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* الجد المشترك بالوسط */}
                          <div className="relative z-20 -mt-5 bg-gradient-to-b from-[#8a5f2e] to-[#c9974f] text-white px-5 py-3 rounded-xl font-bold shadow-xl border-[3px] border-[#fdfbf7] dark:border-[#1c1915] shrink-0 max-w-[150px]">
                            <span className="block text-[10px] text-white/90 mb-1 tracking-wider">الجد المشترك</span>
                            <span className="block text-[16px]">{result.lcaName}</span>
                          </div>

                          {/* مسار الشخص الثاني */}
                          <div className="flex flex-col items-center flex-1 z-10">
                            {result.path2.slice(0, -1).reverse().map((name, i, arr) => {
                              const isTarget = i === arr.length - 1;
                              return (
                                <div key={`p2-${i}`} className="flex flex-col items-center w-full">
                                  <div className="h-7 w-[2px] bg-[#c9974f] dark:bg-[#d6b877]/80" />
                                  <div className={`px-2 py-2.5 rounded-xl font-bold text-[13px] w-[95%] max-w-[140px] leading-tight transition-all relative ${
                                    isTarget 
                                      ? "bg-gradient-to-b from-[#4c7a3f] to-[#2d4a25] text-white border-2 border-[#fffdf8] dark:border-[#1c1915] shadow-lg scale-105 z-10" 
                                      : "bg-white dark:bg-[#2b261f] border border-[#c9974f]/40 dark:border-[#d6b877]/40 text-[#5c4a38] dark:text-[#f3ede1] shadow-sm"
                                  }`}>
                                    {name}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={reset} className="inline-flex items-center justify-center gap-2 text-[14.5px] font-bold text-gray-500 hover:text-[#8a5f2e] dark:text-gray-400 dark:hover:text-[#d6b877] transition-all bg-gray-50 hover:bg-[#c9974f]/10 dark:bg-white/5 dark:hover:bg-[#d6b877]/10 px-6 py-2.5 rounded-full shadow-sm border border-transparent hover:border-[#c9974f]/20 mb-4">
                     إجراء بحث جديد
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}