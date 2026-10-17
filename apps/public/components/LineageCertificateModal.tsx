// LineageCertificateModal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { FamilyNode } from "../lib/constants";

import { useT } from "../lib/i18n";
interface LineageCertificateModalProps {
  isOpen: boolean;
  ancestorPath: FamilyNode[] | null;
  totalCount: number;
  onClose: () => void;
}

export default function LineageCertificateModal({
  isOpen,
  ancestorPath,
  totalCount,
  onClose,
}: LineageCertificateModalProps) {
  const { t, lang } = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [cachedPath, setCachedPath] = useState<FamilyNode[] | null>(null);
  useEffect(() => {
    if (ancestorPath && ancestorPath.length > 0) setCachedPath(ancestorPath);
  }, [ancestorPath]);

  const pathToRender = ancestorPath && ancestorPath.length > 0 ? ancestorPath : cachedPath;
  const person = pathToRender ? pathToRender[pathToRender.length - 1] : null;
  const reversedPath = pathToRender ? [...pathToRender].reverse() : [];

  const dateAr = new Date().toLocaleDateString(lang === "en" ? "en-GB" : "ar-JO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.92 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  // 🌟 متغيرات الحجم الذكي (Dynamic Scaling) لضمان عدم خروج الأجداد من الصفحة
  const pathCount = reversedPath.length;
  const isVeryLong = pathCount > 11;
  const isLong = pathCount > 7 && pathCount <= 11;

  const boxPadding = isVeryLong ? "px-4 py-1.5" : isLong ? "px-6 py-2" : "px-10 py-2.5";
  const boxTextSize = isVeryLong ? "text-[15px]" : isLong ? "text-[18px]" : "text-[22px]";
  const minWidth = isVeryLong ? "min-w-[150px]" : isLong ? "min-w-[180px]" : "min-w-[220px]";
  const connectorSize = isVeryLong ? "w-[20px] h-[20px] text-[9px] my-0.5 border-[1.5px]" : isLong ? "w-[24px] h-[24px] text-[10px] my-1 border-[2px]" : "w-[28px] h-[28px] text-[12px] my-1.5 border-[2px]";

  // =================================================================
  // 1. النافذة المنبثقة البسيطة والفخمة على الشاشة (للمعاينة)
  // =================================================================
  const screenModal = (
    <AnimatePresence>
      {isOpen && person && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 font-cairo p-4 print:hidden backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col w-[420px] max-w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden text-center border border-[rgb(var(--b-mid-rgb)/0.2)] dark:bg-[#161411] dark:border-white/10"
          >
            <div className="p-6 pb-5 bg-gradient-to-b from-panel to-white border-b border-[rgb(var(--b-mid-rgb)/0.1)] dark:from-[#1c1915] dark:to-[#161411] dark:border-white/10">
              <h3 className="m-0 mb-2 text-[24px] font-extrabold text-[rgb(var(--b-deep-rgb)/1)] font-ruqaa drop-shadow-sm dark:text-[rgb(var(--b-lite-rgb)/1)]">
                
                {t("وثيقة إثبات نسب")}
              </h3>
              <p className="m-0 text-[13px] text-ink-soft leading-relaxed dark:text-gray-400">
                
                {t("سيتم طباعة سلسلة نسب")} <span className="font-bold text-[rgb(var(--b-deep-rgb)/1)]">"{person.name}"</span><br/>  {t("وصولاً إلى الجد")} <span className="font-bold text-ink">"{reversedPath[reversedPath.length - 1].name.replace('فخذ ', '')}"</span>.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#fbfaf8] flex flex-col items-center justify-start max-h-[45vh] custom-scrollbar relative dark:bg-[#161411]">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ transformOrigin: "top" }}
                className="absolute top-8 bottom-8 left-1/2 w-[2px] bg-[rgb(var(--b-leaf-rgb)/0.25)] -translate-x-1/2 z-0"
              />

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 flex flex-col items-center w-full"
              >
                {reversedPath.map((node, i) => {
                  const isFocus = i === 0;
                  return (
                    <motion.div key={node.id} variants={cardVariants} className="flex flex-col items-center w-full">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`px-8 py-3 rounded-2xl font-bold min-w-[200px] text-center relative z-10 ${
                          isFocus
                            ? 'bg-gradient-to-r from-[rgb(var(--b-soft-rgb)/1)] to-[rgb(var(--b-deep-rgb)/1)] text-white border-2 border-[rgb(var(--b-deep-rgb)/1)] shadow-[0_6px_15px_rgba(138,95,46,0.3)] text-[18px]'
                            : 'bg-white text-[rgb(var(--b-ink-rgb)/1)] border-2 border-[rgb(var(--b-leaf-rgb)/0.6)] shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-[16px] dark:bg-[#1c1915] dark:text-[rgb(var(--b-lite-rgb)/1)] dark:border-[rgb(var(--b-leaf-rgb)/0.4)]'
                        }`}
                      >
                        {node.name.replace('فخذ ', '')}
                      </motion.div>

                      {i < reversedPath.length - 1 && (
                        <div className="w-[30px] h-[30px] flex items-center justify-center rounded-full bg-white border-2 border-[rgb(var(--b-leaf-rgb)/1)] text-[rgb(var(--b-strong-rgb)/1)] text-[12px] font-black my-1.5 relative z-10 shadow-sm dark:bg-[#1c1915] dark:text-[rgb(var(--b-lite-rgb)/1)]">
                          
                          {t("بـن")}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            <div className="p-5 bg-white border-t border-[rgb(var(--b-mid-rgb)/0.1)] flex gap-4 relative z-20 dark:bg-[#161411] dark:border-white/10">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.print()}
                className="flex-1 rounded-2xl bg-gradient-to-b from-[rgb(var(--b-strong-rgb)/1)] to-[rgb(var(--b-ink-rgb)/1)] px-4 py-3.5 font-bold text-white shadow-[0_6px_15px_rgba(76,122,63,0.3)] border border-[rgb(var(--b-ink-rgb)/1)] flex items-center justify-center gap-2"
              >
                <span className="text-[18px]">🖨️</span>  {t("طباعة / حفظ PDF")}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="flex-1 rounded-2xl bg-[#f8f9fa] px-4 py-3.5 font-bold text-[#7c6c53] shadow-sm border border-[rgb(var(--b-mid-rgb)/0.3)] hover:bg-gray-100 hover:text-[rgb(var(--b-deep-rgb)/1)] dark:bg-[#24201a] dark:text-gray-400 dark:border-[rgb(var(--b-lite-rgb)/0.2)] dark:hover:bg-white/5 dark:hover:text-[rgb(var(--b-lite-rgb)/1)]"
              >
                
                {t("إغلاق")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // =================================================================
  // 2. حاوية الطباعة الفخمة A4 (تظهر في الـ PDF فقط ومحمية من التقسيم)
  // =================================================================
  const printArea = (
    <div className="print-exact-container hidden print:flex flex-col w-full h-full bg-white">
      <style>{t("\n        .custom-scrollbar::-webkit-scrollbar { width: 6px; }\n        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }\n        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(201, 151, 79, 0.5); border-radius: 10px; }\n        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(138, 95, 46, 0.8); }\n\n        /* 🌟 الكود السري لحماية الطباعة على الموبايل من التقسيم */\n        @media print {\n          html, body {\n            width: 100% !important;\n            height: 100% !important;\n            margin: 0 !important;\n            padding: 0 !important;\n            overflow: hidden !important;\n            background: white !important;\n          }\n          body > *:not(.print-exact-container) { display: none !important; }\n          @page { size: A4 portrait; margin: 0 !important; }\n          .print-exact-container {\n            display: flex !important;\n            flex-direction: column !important;\n            position: fixed !important;\n            top: 0 !important;\n            left: 0 !important;\n            right: 0 !important;\n            bottom: 0 !important;\n            width: 100vw !important;\n            height: 100vh !important;\n            background: white !important;\n            box-sizing: border-box !important;\n            overflow: hidden !important;\n            page-break-after: avoid !important;\n            page-break-before: avoid !important;\n            page-break-inside: avoid !important;\n          }\n          * {\n            -webkit-print-color-adjust: exact !important;\n            print-color-adjust: exact !important;\n          }\n        }\n      ")}</style>

      {/* الترويسة للطباعة */}
      <div className={`flex-none text-center relative z-10 bg-white ${isVeryLong ? 'pt-4 pb-2' : isLong ? 'pt-6 pb-3' : 'pt-10 pb-4'}`}>
        <h1 className={`font-ruqaa ${isVeryLong ? 'text-[32px]' : isLong ? 'text-[36px]' : 'text-[42px]'} text-[rgb(var(--b-deep-rgb)/1)] font-extrabold mb-1 m-0`}>{t("شجرة عائلة القواسمي")}</h1>
        <h2 className={`text-[#7c6c53] ${isVeryLong ? 'text-[15px]' : isLong ? 'text-[16px]' : 'text-[18px]'} font-bold m-0`}>{t("وثيقة إثبات تسلسل نسب:")} {person?.name}</h2>
        <div className={`w-[85%] h-[2.5px] bg-[rgb(var(--b-mid-rgb)/1)] mx-auto ${isVeryLong ? 'mt-2' : 'mt-5'}`}></div>
      </div>

      {/* الخط الأخضر المتصل والبطاقات للطباعة */}
      <div className="flex-1 relative flex flex-col justify-center items-center w-full overflow-hidden min-h-0">
        <div className="absolute top-0 bottom-0 left-1/2 w-[3px] bg-[rgb(var(--b-leaf-rgb)/1)] -translate-x-1/2 z-0"></div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full py-1 w-full min-h-0">
          {reversedPath.map((node, i) => {
            const isFocus = i === 0;
            const isRoot = i === reversedPath.length - 1;
            const borderRadius = i % 2 === 0 ? '26px 0 26px 0' : '0 26px 0 26px';
            let bg = 'rgb(var(--b-pale-rgb))'; let color = 'rgb(var(--b-ink-rgb))'; let border = isVeryLong ? '1px solid rgb(var(--b-ink-rgb))' : '2px solid rgb(var(--b-ink-rgb))';

            if (isFocus) { bg = 'linear-gradient(160deg, var(--focus-1, #d3a765), var(--focus-2, #8a5f2e))'; color = '#fff'; border = isVeryLong ? '1px solid var(--focus-2, #8a5f2e)' : '2px solid var(--focus-2, #8a5f2e)'; } 
            else if (isRoot) { bg = 'rgb(var(--b-soft-rgb) / 0.45)'; border = isVeryLong ? '1px solid rgb(var(--b-ink-rgb))' : '2px solid rgb(var(--b-ink-rgb))'; }

            return (
              <div key={node.id} className="flex flex-col items-center shrink min-h-0" style={{ pageBreakInside: 'avoid' }}>
                <div className={`${boxPadding} font-extrabold ${boxTextSize} ${minWidth} text-center shadow-[0_4px_10px_rgba(0,0,0,0.08)] font-cairo`} style={{ background: bg, color, border, borderRadius }}>
                  {node.name.replace('فخذ ', '')}
                </div>
                
                {i < reversedPath.length - 1 && (
                  <div className={`${connectorSize} rounded-full border-[rgb(var(--b-leaf-rgb)/1)] bg-white text-[rgb(var(--b-leaf-rgb)/1)] flex items-center justify-center font-black z-10 font-cairo relative`}>
                    
                    {t("بـن")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* التذييل للطباعة */}
      <div className={`flex-none w-[85%] mx-auto border-t-[2px] border-b-0 border-x-0 border-dashed border-[rgb(var(--b-mid-rgb)/1)] ${isVeryLong ? 'pt-3 pb-4' : 'pt-5 pb-8'} text-center relative z-10 bg-white`}>
        <span className={`${isVeryLong ? 'text-[12px]' : 'text-[14.5px]'} font-bold text-[#7c6c53]`}>
          
          {t("عدد أفراد الفخذ:")} <span className="text-[rgb(var(--b-deep-rgb)/1)]">{totalCount}  {t("فرد")}</span>
          <span className="mx-4 text-[rgb(var(--b-mid-rgb)/1)]">|</span>
          <span className={`${isVeryLong ? 'text-[11px]' : 'text-[13.5px]'} font-normal opacity-90`}>{t("تاريخ الطباعة:")} {dateAr}</span>
        </span>
      </div>
    </div>
  );

  return (
    <>
      {screenModal}
      {mounted && person && typeof document !== 'undefined' ? createPortal(printArea, document.body) : null}
    </>
  );
}