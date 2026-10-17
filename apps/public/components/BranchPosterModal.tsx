"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useT } from "../lib/i18n";
interface BranchPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeData: any; 
}

export default function BranchPosterModal({ isOpen, onClose, treeData }: BranchPosterModalProps) {
  const { t, nm } = useT();
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const ALL_BRANCHES = [
    { id: "dawoud", label: t("فخذ داوود") },
    { id: "abu_nawara", label: t("فخذ ابو نواره") },
    { id: "al_sous", label: t("فخذ الصوص") },
    { id: "abdullah", label: t("فخذ عبدالله") },
    { id: "al_jadaa", label: t("فخذ الجدع") },
    { id: "mohammed_sulaiman", label: t("فخذ محمد سليمان") },
    { id: "younes", label: t("فخذ يونس") },
    { id: "al_badawi", label: t("فخذ البدوي") },
    { id: "mohammed_ali", label: t("فخذ محمد علي") },
    { id: "abu_baid", label: t("فخذ ابو بيض") },
    { id: "al_khudair", label: t("فخذ الخضير") },
    { id: "abdulhaq", label: t("فخذ عبد الحق") },
  ];
  
  const VISIBLE_BRANCH_IDS = ALL_BRANCHES.map(b => b.id);
  const branchesList = ALL_BRANCHES.filter(b => VISIBLE_BRANCH_IDS.includes(b.id));

  const findBranchNode = (node: any, keyword: string): any => {
    if (node.name.includes(keyword) || node.name.replace('فخذ ', '').trim() === keyword) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = findBranchNode(child, keyword);
        if (found) return found;
      }
    }
    return null;
  };

  const getTargetNode = () => {
    if (!selectedBranchId) return null;
    const branch = branchesList.find(b => b.id === selectedBranchId);
    if (!branch) return null;
    const keyword = branch.label.replace('فخذ ', '').trim();
    return findBranchNode(treeData, keyword);
  };

  const targetNode = getTargetNode();

  const renderTree = (node: any, isRoot = false) => {
    return (
      <li key={node.id}>
        <div className={`relative z-10 inline-flex flex-col items-center justify-center whitespace-nowrap rounded-2xl border px-6 py-3 shadow-sm ${
          isRoot 
            ? "bg-gradient-to-b from-[#8a5f2e] to-[#c9974f] text-white border-white/20 scale-110 mb-2" 
            : "bg-white border-[#c9974f]/40 text-[#5c4a38]"
        }`}>
          <span className={`font-bold ${isRoot ? 'text-[20px]' : 'text-[16px]'}`}>{nm(node.name.replace('فخذ ', ''))}</span>
          {node.death_date && <span className="text-[12px] opacity-80 mt-1 font-ruqaa">{t("رحمه الله")}</span>}
        </div>
        {node.children && node.children.length > 0 && (
          <ul>
            {node.children.map((child: any) => renderTree(child))}
          </ul>
        )}
      </li>
    );
  };

  const handleExport = async () => {
    if (!printAreaRef.current || !targetNode) return;
    setIsExporting(true);

    setTimeout(async () => {
      try {
        const htmlToImage = await import('html-to-image');
        const element = printAreaRef.current;
        if (!element) return;

        const dataUrl = await htmlToImage.toSvg(element, {
          backgroundColor: '#fffdf8',
          width: element.scrollWidth,
          height: element.scrollHeight,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            margin: '0',
          }
        });

        const link = document.createElement('a');
        const branchName = branchesList.find(b => b.id === selectedBranchId)?.label || t("الفخذ");
        link.download = `شجرة_${branchName.replace(/\s+/g, '_')}_القواسمي.svg`;
        link.href = dataUrl;
        link.click();
        
      } catch (err) {
        console.error("Error exporting SVG:", err);
        alert(t("حدث خطأ أثناء تصدير البوستر. يرجى المحاولة مرة أخرى."));
      } finally {
        setIsExporting(false);
      }
    }, 500); 
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            // 🌟 إضافة كلاسات الوضع الليلي للحاوية الرئيسية
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-[#fdfbf7] dark:bg-[#1c1915] border border-[#c9974f]/30 dark:border-[#d6b877]/20 shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* 🌟 إضافة كلاسات الوضع الليلي للترويسة */}
            <div className="relative pt-6 pb-4 shrink-0 z-20 bg-[#fdfbf7] dark:bg-[#1c1915] px-6 border-b border-[#c9974f]/10 dark:border-[#d6b877]/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <button onClick={onClose} className="absolute left-4 top-4 md:static flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-[#2b261f] text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors border-none outline-none focus:ring-0">✕</button>
              
              <div className="flex items-center gap-2">
                <span className="text-3xl">🖨️</span>
                <h2 className="text-2xl font-bold text-[#8a5f2e] dark:text-[#d6b877] font-ruqaa">{t("طباعة بوستر الفخذ")}</h2>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto relative z-50">
                
                {/* 🌟 القائمة المنسدلة - دعم كامل للوضع الليلي */}
                <div className="relative w-full md:w-56 z-50">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between !bg-white dark:!bg-[#24201a] !border-2 !border-[#c9974f]/40 dark:!border-[#d6b877]/30 !text-[#8a5f2e] dark:!text-[#d6b877] font-bold px-4 py-2.5 rounded-xl outline-none shadow-sm transition-all hover:!border-[#c9974f]/70 dark:hover:!border-[#d6b877]/60 relative z-10"
                  >
                    <span className="text-[14.5px]">
                      {selectedBranchId ? t(branchesList.find(b => b.id === selectedBranchId)?.label ?? "") : t("-- اختر الفخذ --")}
                    </span>
                    <span className={`text-[12px] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-[calc(100%+8px)] left-0 right-0 !bg-white dark:!bg-[#1c1915] !border-2 !border-[#c9974f]/40 dark:!border-[#d6b877]/30 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                      >
                        {branchesList.length > 0 ? (
                          branchesList.map(b => (
                            <button
                              key={b.id}
                              onClick={() => { setSelectedBranchId(b.id); setIsDropdownOpen(false); }}
                              className={`w-full text-right px-4 py-3 text-[14px] font-bold transition-all !border-none hover:!bg-[#c9974f]/10 dark:hover:!bg-white/5 ${
                                selectedBranchId === b.id 
                                  ? '!bg-[#c9974f]/10 dark:!bg-white/5 !text-[#8a5f2e] dark:!text-[#d6b877] !border-r-4 !border-[#c9974f] dark:!border-[#d6b877]' 
                                  : '!bg-transparent !text-[#5c4a38] dark:!text-[#f3ede1]'
                              }`}
                            >
                              {t(b.label)}
                            </button>
                          ))
                        ) : (
                          <div className="!bg-transparent px-4 py-3 text-[13px] !text-gray-400 dark:!text-gray-500 font-bold text-center">{t("لا يوجد فخوذ متاحة")}</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  disabled={!selectedBranchId || isExporting}
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 bg-gradient-to-l from-[#8a5f2e] to-[#c9974f] dark:from-[#4a3a1e] dark:to-[#8a6a2e] text-white dark:text-[#f3ede1] dark:border dark:border-[#d6b877]/30 font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 transition-all hover:shadow-lg dark:hover:shadow-[0_10px_25px_rgba(214,184,119,0.15)] shrink-0 w-full md:w-56"
                >
                  {isExporting ? t("⏳ جاري التجهيز...") : t("تنزيل بوستر (SVG)")}
                </button>
              </div>
            </div>

            {/* 🌟 منطقة التمرير (الخلفية خلف البوستر) */}
            <div className="p-6 overflow-auto sidebar-scroll flex-1 bg-gray-50/50 dark:bg-black/20" dir="rtl">
              {!targetNode ? (
                <div className="h-full flex flex-col items-center justify-center text-[#8a5f2e]/60 dark:text-[#d6b877]/60 font-bold opacity-70">
                  <span className="text-5xl mb-4">📜</span>
                  <p>{t("الرجاء اختيار الفخذ من القائمة بالأعلى لمعاينة البوستر")}</p>
                </div>
              ) : (
                <div 
                  id="poster-export-area"
                  ref={printAreaRef}
                  // منطقة البوستر تبقى فاتحة لأنها ستمثل لون الورقة المطبوعة
                  className="relative w-max min-w-full mx-auto p-12 bg-[#fffdf8] rounded-2xl border border-[#c9974f]/10 dark:border-white/10 shadow-sm transition-none"
                >
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8a5f2e 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
                  <div className="absolute inset-4 border-[4px] border-[#c9974f]/30 pointer-events-none rounded-2xl"></div>

                  <div className="relative z-10 mb-16 text-center border-b-[3px] border-[#c9974f]/30 pb-8 px-16 mx-auto w-max">
                    <h1 className="font-ruqaa text-5xl text-[#8a5f2e] mb-4">{t("شجرة")} {t(branchesList.find(b => b.id === selectedBranchId)?.label ?? "")}</h1>
                    <h2 className="font-cairo text-2xl text-[#7c6c53] font-bold">{t("عائلة القواسمي")}</h2>
                  </div>

                  <style>{`
                    .poster-tree, .poster-tree ul { list-style:none; margin:0; padding:0; display:flex; justify-content:center; }
                    .poster-tree { width:max-content; --tree-line: #c9974f; }
                    .poster-tree li { position:relative; display:flex; flex-direction:column; align-items:center; padding:32px 12px 0; text-align:center; }
                    .poster-tree > li { padding-top:0; }
                    .poster-tree li::before, .poster-tree li::after { content:''; position:absolute; top:0; width:50%; height:26px; border-top:2.5px solid var(--tree-line); }
                    .poster-tree li::before { inset-inline-end:50%; border-inline-end:2.5px solid var(--tree-line); border-top-right-radius: 8px; }
                    .poster-tree li::after { inset-inline-start:50%; border-inline-start:2.5px solid var(--tree-line); border-top-left-radius: 8px;}
                    .poster-tree > li::before, .poster-tree > li::after { display:none; }
                    .poster-tree li:only-child::before, .poster-tree li:only-child::after { display:none; }
                    .poster-tree li:first-child::before { border-color:transparent; }
                    .poster-tree li:last-child::after { border-color:transparent; }
                    .poster-tree li > ul { position:relative; padding-top:26px; }
                    .poster-tree li > ul::before { content:''; position:absolute; top:0; inset-inline-start:50%; width:0; height:26px; border-inline-start:2.5px solid var(--tree-line); }
                  `}</style>

                  <ul className="poster-tree relative z-10 mx-auto font-cairo">
                    {renderTree(targetNode, true)}
                  </ul>

                  <div className="relative z-10 mt-20 pt-8 border-t-[2px] border-[#c9974f]/20 text-center w-full mx-auto max-w-lg">
                    <p className="font-cairo text-xl text-[#8a5f2e] font-bold">{t("تطبيق شجرة عائلة القواسمي")}</p>
                    <p className="font-cairo text-sm text-gray-500 mt-2">{t("تاريخ الإصدار:")} {new Date().toLocaleDateString('ar-JO')}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}