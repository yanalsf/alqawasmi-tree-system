// LineageCertificateModal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { FamilyNode } from "@/lib/constants";

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // نحتفظ بآخر مسار صحيح حتى تكتمل حركة الإغلاق (حتى لو تحول ancestorPath إلى null فوراً)
  const [cachedPath, setCachedPath] = useState<FamilyNode[] | null>(null);
  useEffect(() => {
    if (ancestorPath && ancestorPath.length > 0) setCachedPath(ancestorPath);
  }, [ancestorPath]);

  const pathToRender = ancestorPath && ancestorPath.length > 0 ? ancestorPath : cachedPath;

  const person = pathToRender ? pathToRender[pathToRender.length - 1] : null;
  const reversedPath = pathToRender ? [...pathToRender].reverse() : [];

  const dateAr = new Date().toLocaleDateString("ar-JO", {
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
            className="flex flex-col w-[420px] max-w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden text-center border border-gold/20"
          >
            {/* الترويسة */}
            <div className="p-6 pb-5 bg-gradient-to-b from-panel to-white border-b border-gold/10">
              <h3 className="m-0 mb-2 text-[24px] font-extrabold text-gold-deep font-ruqaa drop-shadow-sm">
                وثيقة إثبات نسب
              </h3>
              <p className="m-0 text-[13px] text-ink-soft leading-relaxed">
                سيتم طباعة سلسلة نسب <span className="font-bold text-gold-deep">"{person.name}"</span><br/> وصولاً إلى الجد <span className="font-bold text-ink">"{reversedPath[reversedPath.length - 1].name.replace('فخذ ', '')}"</span>.
              </p>
            </div>

            {/* قائمة الأسماء (سلسلة فخمة مع خط متصل) */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#fbfaf8] flex flex-col items-center justify-start max-h-[45vh] custom-scrollbar relative">

              {/* الخط العمودي الخفيف في الخلفية لربط الأسماء */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ transformOrigin: "top" }}
                className="absolute top-8 bottom-8 left-1/2 w-[2px] bg-[#6b8e5c]/25 -translate-x-1/2 z-0"
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
                      {/* بطاقة الاسم (بارزة وواضحة) */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`px-8 py-3 rounded-2xl font-bold min-w-[200px] text-center relative z-10 ${
                          isFocus
                            ? 'bg-gradient-to-r from-[#d3a765] to-[#8a5f2e] text-white border-2 border-[#8a5f2e] shadow-[0_6px_15px_rgba(138,95,46,0.3)] text-[18px]'
                            : 'bg-white text-[#1f3d1f] border-2 border-[#7ba869]/60 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-[16px]'
                        }`}
                      >
                        {node.name.replace('فخذ ', '')}
                      </motion.div>

                      {/* رابط "بن" بين الأسماء */}
                      {i < reversedPath.length - 1 && (
                        <div className="w-[30px] h-[30px] flex items-center justify-center rounded-full bg-white border-2 border-[#7ba869] text-[#4c7a3f] text-[12px] font-black my-1.5 relative z-10 shadow-sm">
                          بـن
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* الأزرار الفخمة */}
            <div className="p-5 bg-white border-t border-gold/10 flex gap-4 relative z-20">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.print()}
                className="flex-1 rounded-2xl bg-gradient-to-b from-[#4c7a3f] to-[#3a5c30] px-4 py-3.5 font-bold text-white shadow-[0_6px_15px_rgba(76,122,63,0.3)] border border-[#2d4a25] flex items-center justify-center gap-2"
              >
                <span className="text-[18px]">🖨️</span> طباعة / حفظ PDF
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="flex-1 rounded-2xl bg-[#f8f9fa] px-4 py-3.5 font-bold text-[#7c6c53] shadow-sm border border-[#c9974f]/30 hover:bg-gray-100 hover:text-[#8a5f2e]"
              >
                إغلاق
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // =================================================================
  // 2. حاوية الطباعة الفخمة A4 (تظهر في الـ PDF فقط)
  // =================================================================
  const printArea = (
    <div className="print-exact-container hidden print:flex flex-col w-full h-screen max-h-screen overflow-hidden bg-white">
      <style>{`
        /* تنسيق شريط التمرير للنافذة المنبثقة */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(201, 151, 79, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(138, 95, 46, 0.8); }

        /* تنسيقات الطباعة الإجبارية */
        @media print {
          body > *:not(.print-exact-container) { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
          @page { size: A4 portrait; margin: 0 !important; }
          .print-exact-container {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            background: white !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* الترويسة للطباعة */}
      <div className="flex-none text-center relative z-10 bg-white pt-10 pb-4">
        <h1 className="font-ruqaa text-[42px] text-[#8a5f2e] font-extrabold mb-2 m-0">شجرة عائلة القواسمي</h1>
        <h2 className="text-[#7c6c53] text-[18px] font-bold m-0">وثيقة إثبات تسلسل نسب: {person?.name}</h2>
        <div className="w-[85%] h-[2.5px] bg-[#c9974f] mx-auto mt-5"></div>
      </div>

      {/* الخط الأخضر المتصل والبطاقات للطباعة */}
      <div className="flex-1 relative flex flex-col justify-center items-center w-full overflow-hidden">
        <div className="absolute top-0 bottom-0 left-1/2 w-[3px] bg-[#6b8e5c] -translate-x-1/2 z-0"></div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full py-2 w-full">
          {reversedPath.map((node, i) => {
            const isFocus = i === 0;
            const isRoot = i === reversedPath.length - 1;
            const borderRadius = i % 2 === 0 ? '26px 0 26px 0' : '0 26px 0 26px';
            let bg = '#e6f2e6'; let color = '#1f3d1f'; let border = '2px solid #3a5c30';

            if (isFocus) { bg = 'linear-gradient(160deg, #d3a765, #8a5f2e)'; color = '#fff'; border = '2px solid #8a5f2e'; } 
            else if (isRoot) { bg = '#c5e0c5'; border = '2px solid #2d4a25'; }

            return (
              <div key={node.id} className="flex flex-col items-center shrink-1" style={{ pageBreakInside: 'avoid' }}>
                <div className="px-10 py-2.5 font-extrabold text-[22px] min-w-[220px] text-center shadow-[0_4px_10px_rgba(0,0,0,0.08)] font-cairo" style={{ background: bg, color, border, borderRadius }}>
                  {node.name.replace('فخذ ', '')}
                </div>
                
                {i < reversedPath.length - 1 && (
                  <div className="w-[28px] h-[28px] rounded-full border-[2px] border-[#6b8e5c] bg-white text-[#6b8e5c] flex items-center justify-center text-[12px] font-black my-1.5 z-10 font-cairo relative">
                    بـن
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* التذييل للطباعة */}
      <div className="flex-none w-[85%] mx-auto border-t-[2px] border-b-0 border-x-0 border-dashed border-[#c9974f] pt-5 pb-8 text-center relative z-10 bg-white">
        <span className="text-[14.5px] font-bold text-[#7c6c53]">
          عدد الأفراد داخل الشجرة: <span className="text-[#8a5f2e]">{totalCount} فرد</span>
          <span className="mx-4 text-[#c9974f]">|</span>
          <span className="text-[13.5px] font-normal opacity-90">تاريخ الطباعة: {dateAr}</span>
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