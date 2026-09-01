"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import treeDataRaw from "@/data/tree.json";
import type { FamilyNode } from "@/lib/constants";

const tree = treeDataRaw as unknown as FamilyNode;
const VIRTUAL_ROOT_ID = 941; 

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatisticsModal({ isOpen, onClose }: StatisticsModalProps) {
  const stats = useMemo(() => {
    let total = 0;
    let dead = 0;
    const generations: Record<number, number> = {};
    const nameCounts: Record<string, number> = {};

    function walk(node: FamilyNode, depth: number) {
      if (node.id !== VIRTUAL_ROOT_ID) {
        total++;
        if (node.death_date) dead++; 

        generations[depth] = (generations[depth] || 0) + 1;

        const cleanName = node.name.replace('فخذ ', '').trim();
        const firstName = cleanName.split(' ')[0];
        if (firstName && firstName.length > 2) {
          nameCounts[firstName] = (nameCounts[firstName] || 0) + 1;
        }
      }
      
      const nextDepth = node.id !== VIRTUAL_ROOT_ID ? depth + 1 : depth;
      if (node.children) {
        node.children.forEach(child => walk(child, nextDepth));
      }
    }

    walk(tree, 1); 

    const alive = total - dead;

    const genArray = Object.entries(generations).map(([depth, count]) => ({
      depth: parseInt(depth),
      count
    })).sort((a, b) => a.depth - b.depth);

    const maxGenCount = Math.max(...genArray.map(g => g.count), 1);

    const topNames = Object.entries(nameCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4); 

    return { total, dead, alive, generations: genArray, maxGenCount, topNames };
  }, []);

  const getGenName = (num: number) => {
    const names = ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر", "الحادي عشر", "الثاني عشر"];
    return names[num] || num.toString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden rounded-3xl bg-[#fdfbf7] border border-[#c9974f]/30 shadow-2xl dark:bg-[#1c1915] dark:border-[#d6b877]/20"
          >
            {/* الجزء العلوي الثابت */}
            <div className="relative pt-6 pb-2 shrink-0 z-10 bg-[#fdfbf7] dark:bg-[#1c1915] rounded-t-3xl">
              <button onClick={onClose} className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30">✕</button>
              
              <div className="text-center">
                <span className="text-3xl mb-2 block">📊</span>
                <h2 className="text-2xl font-bold text-[#8a5f2e] font-ruqaa dark:text-[#d6b877]">الإحصائيات</h2>
              </div>
            </div>

            {/* محتوى الإحصائيات (قابل للتمرير) */}
            <div className="p-6 pt-2 overflow-y-auto sidebar-scroll space-y-5">
              
              {/* قسم الأرقام */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-b from-[#c9974f]/10 to-[#c9974f]/5 dark:from-[#d6b877]/10 dark:to-transparent p-3 rounded-2xl text-center border border-[#c9974f]/30 dark:border-[#d6b877]/20 shadow-sm">
                  <div className="text-[22px] font-extrabold text-[#5c4a38] dark:text-[#f3ede1]">{stats.total}</div>
                  <div className="text-[11px] font-bold text-[#8a5f2e] dark:text-[#d6b877]/80 mt-1">عدد الأفراد</div>
                </div>
                <div className="bg-gradient-to-b from-green-50 to-white dark:from-green-900/20 dark:to-[#1c1915] p-3 rounded-2xl text-center border border-green-200 dark:border-green-900/30 shadow-sm">
                  <div className="text-[22px] font-extrabold text-green-700 dark:text-green-400">{stats.alive}</div>
                  <div className="text-[11px] font-bold text-green-600 dark:text-green-500/80 mt-1">عدد الأحياء</div>
                </div>
                <div className="bg-gradient-to-b from-gray-100 to-white dark:from-gray-800/40 dark:to-[#1c1915] p-3 rounded-2xl text-center border border-gray-200 dark:border-gray-700/50 shadow-sm">
                  <div className="text-[22px] font-extrabold text-gray-600 dark:text-gray-300">{stats.dead}</div>
                  <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-1">عدد الأموات</div>
                </div>
              </div>

              {/* ⚠️ ملاحظة دقة البيانات الجديدة ⚠️ */}
              <div className="mt-2 flex items-start gap-2 bg-orange-50/80 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-900/30 rounded-xl px-4 py-3">
                <span className="text-orange-500 text-[14px]">⚠️</span>
                <p className="text-[11px] font-bold text-orange-700/80 dark:text-orange-400/80 m-0 leading-relaxed text-right">
                  <span className="font-extrabold">ملاحظة:</span> أرقام الأحياء والأموات تقريبية، حيث أن تواريخ الوفاة لبعض الأفراد (خاصة من الأجيال القديمة) قد لا تكون متوفرة أو موثقة بالكامل في النظام.
                </p>
              </div>

              <div className="bg-white dark:bg-[#24201a] p-4 rounded-2xl border border-[#c9974f]/20 dark:border-[#d6b877]/20 shadow-sm">
                <h3 className="text-[13px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-5 text-center">عدد الأفراد لكل جيل</h3>
                <div className="flex items-end justify-center gap-1.5 h-32 mt-2 px-1">
                  {stats.generations.map((gen) => {
                    const heightPercent = (gen.count / stats.maxGenCount) * 100;
                    return (
                      <div key={gen.depth} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                        <span className="absolute -top-7 text-[11px] font-bold text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md z-10">{gen.count}</span>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                          className="w-full max-w-[28px] min-w-[12px] bg-gradient-to-t from-[#c9974f] to-[#e4c08a] dark:from-[#2d4a25] dark:to-[#4c7a3f] rounded-t-lg opacity-85 group-hover:opacity-100 transition-opacity shadow-sm"
                        />
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-[#5c4a38] dark:text-[#9a8c78] mt-2 block whitespace-nowrap">{getGenName(gen.depth)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-[#24201a] p-4 rounded-2xl border border-[#c9974f]/20 dark:border-[#d6b877]/20 shadow-sm">
                <h3 className="text-[13px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-3 text-center">أكثر الأسماء تكراراً</h3>
                <div className="flex flex-col gap-2">
                  {stats.topNames.map(([name, count], index) => (
                    <div key={name} className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#c9974f]/20 dark:bg-[#d6b877]/20 text-[#8a5f2e] dark:text-[#d6b877] text-[10px] font-bold">{index + 1}</span>
                        <span className="text-[13px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">{name}</span>
                      </div>
                      <span className="text-[12px] font-bold text-[#8a5f2e] dark:text-[#d6b877] bg-[#c9974f]/10 dark:bg-[#d6b877]/10 px-2.5 py-0.5 rounded-md">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}