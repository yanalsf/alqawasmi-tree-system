"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useT } from "../lib/i18n";
import { BRANCHES } from "../lib/branches";
import { canvasToBlob, canvasToPdfBlob, deliverBlob, getEmbeddedFontCss } from "../lib/exportUtils";
interface BranchPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeData: any; 
}

export default function BranchPosterModal({ isOpen, onClose, treeData }: BranchPosterModalProps) {
  const { t, nm, lang, dir } = useT();
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [viewW, setViewW] = useState(0);
  const [exportKind, setExportKind] = useState<null | "pdf" | "png" | "svg">(null);

  const ALL_BRANCHES = BRANCHES.map((b) => ({ id: b.id, label: t(b.label), rootId: b.rootId }));
  
  const VISIBLE_BRANCH_IDS = ALL_BRANCHES.map(b => b.id);
  const branchesList = ALL_BRANCHES.filter(b => VISIBLE_BRANCH_IDS.includes(b.id));

  // نبحث عن الفخذ بالـ id الثابت (وليس بالاسم) حتى يعمل مع أي لغة
  const findNodeById = (node: any, id: number): any => {
    if (node.id === id) return node;
    for (const child of node.children ?? []) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
    return null;
  };

  const getTargetNode = () => {
    if (!selectedBranchId) return null;
    const branch = branchesList.find(b => b.id === selectedBranchId);
    if (!branch) return null;
    return findNodeById(treeData, branch.rootId);
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

  // قياس البوستر الحقيقي + عرض منطقة المعاينة، لتصغير المعاينة تلقائياً حتى تناسب الشاشة
  useEffect(() => {
    const poster = printAreaRef.current;
    const viewport = viewportRef.current;
    if (!poster || !viewport) return;
    const measure = () => {
      setNatural({ w: poster.offsetWidth, h: poster.offsetHeight });
      const cs = getComputedStyle(viewport);
      setViewW(viewport.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
    };
    measure();
    // نبدأ من منتصف البوستر (الجذر)، لا من طرفه
    requestAnimationFrame(() => {
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
    });
    const ro = new ResizeObserver(measure);
    ro.observe(poster);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [targetNode, selectedBranchId, isOpen, lang]);

  // دقة الصورة الممكنة: حتى 2x، وتنخفض للبوسترات الضخمة بسبب حدّ ذاكرة المتصفح/الجوال
  const MAX_PIXELS = 14_000_000;
  const exportRatio = natural.w && natural.h
    ? Math.max(0.05, Math.min(2, Math.sqrt(MAX_PIXELS / (natural.w * natural.h)), 16000 / natural.w, 16000 / natural.h))
    : 2;
  const isHuge = exportRatio < 0.6; // البوستر كبير جداً → الصورة/PDF ستكون منخفضة الدقة

  const previewScale = natural.w && viewW ? Math.min(1, Math.max(0.3, viewW / natural.w)) : 1;

  const runExport = async (kind: "pdf" | "png" | "svg") => {
    const element = printAreaRef.current;
    if (!element || !targetNode || exportKind) return;
    setExportKind(kind);
    try {
      const htmlToImage = await import("html-to-image");
      const fontEmbedCSS = await getEmbeddedFontCss();
      const w = element.offsetWidth;
      const h = element.offsetHeight;
      const branchLabel = branchesList.find((b) => b.id === selectedBranchId)?.label || t("الفخذ");
      const safe = branchLabel.replace(/\s+/g, "_");
      const base = lang === "en" ? `Al-Qawasmi_${safe}` : `شجرة_${safe}_القواسمي`;
      const common = {
        backgroundColor: "#fffdf8",
        width: w,
        height: h,
        fontEmbedCSS,
        style: { transform: "none", margin: "0" } as Partial<CSSStyleDeclaration>,
      };

      if (kind === "svg") {
        const dataUrl = await htmlToImage.toSvg(element, common);
        const blob = await (await fetch(dataUrl)).blob();
        await deliverBlob(blob, base + ".svg", t("تطبيق شجرة عائلة القواسمي"));
        return;
      }

      // دقة الصورة: حتى 2x، وتُخفَّض تلقائياً للبوسترات الكبيرة حتى لا تتجاوز حدّ ذاكرة الجوال
      const ratio = Math.max(0.05, Math.min(2, Math.sqrt(MAX_PIXELS / (w * h)), 16000 / w, 16000 / h));
      const canvas = await htmlToImage.toCanvas(element, { ...common, pixelRatio: ratio });

      if (kind === "png") {
        await deliverBlob(await canvasToBlob(canvas, "image/png"), base + ".png", t("تطبيق شجرة عائلة القواسمي"));
      } else {
        // أطول ضلع = 420mm (A3) والباقي بنفس النسبة؛ وللبوسترات العريضة جداً
        // نثبّت الضلع الأقصر على 170mm (حتى لا تصير الصفحة شريطاً رفيعاً)
        const aspect = Math.max(w, h) / Math.min(w, h);
        const shortMm = aspect > 2.5 ? 170 : Math.round(420 / aspect);
        const longMm = Math.min(5000, Math.round(shortMm * aspect));
        const wMm = w >= h ? longMm : shortMm;
        const hMm = w >= h ? shortMm : longMm;
        await deliverBlob(await canvasToPdfBlob(canvas, wMm, hMm), base + ".pdf", t("تطبيق شجرة عائلة القواسمي"));
      }
    } catch (err) {
      console.error("Error exporting poster:", err);
      alert(t("حدث خطأ أثناء تصدير البوستر. يرجى المحاولة مرة أخرى."));
    } finally {
      setExportKind(null);
    }
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
            className="relative w-full max-w-5xl min-h-[70vh] overflow-hidden rounded-3xl bg-[#fdfbf7] dark:bg-[#1c1915] border border-[#c9974f]/30 dark:border-[#d6b877]/20 shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* 🌟 إضافة كلاسات الوضع الليلي للترويسة */}
            <div className="relative shrink-0 z-20 bg-[#fdfbf7] dark:bg-[#1c1915] px-4 sm:px-6 pt-4 pb-4 border-b border-[#c9974f]/10 dark:border-[#d6b877]/10 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-2xl sm:text-3xl">🖨️</span>
                  <h2 className="truncate text-xl sm:text-2xl font-bold text-[#8a5f2e] dark:text-[#d6b877] font-ruqaa">{t("طباعة بوستر الفخذ")}</h2>
                </div>
                <button onClick={onClose} aria-label={t("إغلاق")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-[#2b261f] text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors border-none outline-none focus:ring-0">✕</button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="relative w-full sm:w-60 z-50">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 !bg-white dark:!bg-[#24201a] !border-2 !border-[#c9974f]/40 dark:!border-[#d6b877]/30 !text-[#8a5f2e] dark:!text-[#d6b877] font-bold px-4 py-2.5 rounded-xl outline-none shadow-sm transition-all hover:!border-[#c9974f]/70"
                  >
                    <span className="truncate text-[14.5px]">
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
                        className="absolute top-[calc(100%+8px)] left-0 right-0 max-h-[45vh] overflow-y-auto !bg-white dark:!bg-[#1c1915] !border-2 !border-[#c9974f]/40 dark:!border-[#d6b877]/30 rounded-2xl shadow-2xl z-[100]"
                      >
                        {branchesList.length > 0 ? (
                          branchesList.map(b => (
                            <button
                              key={b.id}
                              onClick={() => { setSelectedBranchId(b.id); setIsDropdownOpen(false); }}
                              className={`w-full text-start px-4 py-3 text-[14px] font-bold transition-all !border-none hover:!bg-[#c9974f]/10 dark:hover:!bg-white/5 ${
                                selectedBranchId === b.id
                                  ? '!bg-[#c9974f]/10 dark:!bg-white/5 !text-[#8a5f2e] dark:!text-[#d6b877]'
                                  : '!bg-transparent !text-[#5c4a38] dark:!text-[#f3ede1]'
                              }`}
                            >
                              {selectedBranchId === b.id ? "✓ " : ""}{t(b.label)}
                            </button>
                          ))
                        ) : (
                          <div className="!bg-transparent px-4 py-3 text-[13px] !text-gray-400 dark:!text-gray-500 font-bold text-center">{t("لا يوجد فخوذ متاحة")}</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <button
                    disabled={!selectedBranchId || !!exportKind}
                    onClick={() => runExport("pdf")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 whitespace-nowrap bg-gradient-to-l from-[#8a5f2e] to-[#c9974f] dark:from-[#4a3a1e] dark:to-[#8a6a2e] text-white dark:text-[#f3ede1] dark:border dark:border-[#d6b877]/30 font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 transition-all hover:shadow-lg"
                  >
                    {exportKind === "pdf" ? t("⏳ جاري التجهيز...") : t("🖨️ طباعة / حفظ PDF")}
                  </button>
                  <button
                    disabled={!selectedBranchId || !!exportKind}
                    onClick={() => runExport("png")}
                    className="flex-1 sm:flex-none !bg-white dark:!bg-[#24201a] !border-2 !border-[#c9974f]/40 dark:!border-[#d6b877]/30 !text-[#8a5f2e] dark:!text-[#d6b877] font-bold px-4 py-2.5 rounded-xl disabled:opacity-50"
                  >
                    {exportKind === "png" ? t("⏳ جاري التجهيز...") : t("صورة PNG")}
                  </button>
                  <button
                    disabled={!selectedBranchId || !!exportKind}
                    onClick={() => runExport("svg")}
                    className="flex-1 sm:flex-none !bg-white dark:!bg-[#24201a] !border-2 !border-[#c9974f]/40 dark:!border-[#d6b877]/30 !text-[#8a5f2e] dark:!text-[#d6b877] font-bold px-4 py-2.5 rounded-xl disabled:opacity-50"
                  >
                    {exportKind === "svg" ? t("⏳ جاري التجهيز...") : t("SVG (للمطبعة)")}
                  </button>
                </div>
              </div>
              {isHuge && (
                <p className="m-0 rounded-xl bg-amber-50 px-3 py-2 text-[12.5px] font-bold leading-relaxed text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  {t("هذا الفخذ كبير جداً، فالصورة وملف PDF سيكونان بدقة منخفضة. للحصول على أفضل جودة للطباعة استخدم SVG (للمطبعة).")}
                </p>
              )}
            </div>

            {/* 🌟 منطقة التمرير (الخلفية خلف البوستر) */}
            <div ref={viewportRef} className="p-3 sm:p-6 overflow-auto sidebar-scroll flex-1 min-h-[40vh] bg-gray-50/50 dark:bg-black/20" dir="ltr">
              {!targetNode ? (
                <div className="h-full flex flex-col items-center justify-center text-[#8a5f2e]/60 dark:text-[#d6b877]/60 font-bold opacity-70">
                  <span className="text-5xl mb-4">📜</span>
                  <p>{t("الرجاء اختيار الفخذ من القائمة بالأعلى لمعاينة البوستر")}</p>
                </div>
              ) : (
                <div style={{ width: natural.w * previewScale || undefined, height: natural.h * previewScale || undefined, margin: "0 auto" }}>
                <div style={{ width: natural.w || "max-content", transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
                <div 
                  id="poster-export-area"
                  ref={printAreaRef}
                  dir={dir}
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

                  <div className="relative z-10 flex justify-center">
                    <ul className="poster-tree font-cairo">
                      {renderTree(targetNode, true)}
                    </ul>
                  </div>

                  <div className="relative z-10 mt-20 pt-8 border-t-[2px] border-[#c9974f]/20 text-center w-full mx-auto max-w-lg">
                    <p className="font-cairo text-xl text-[#8a5f2e] font-bold">{t("تطبيق شجرة عائلة القواسمي")}</p>
                    <p className="font-cairo text-sm text-gray-500 mt-2">{t("تاريخ الإصدار:")} {new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-JO')}</p>
                  </div>
                </div>
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