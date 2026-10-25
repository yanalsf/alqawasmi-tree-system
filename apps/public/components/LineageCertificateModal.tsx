// LineageCertificateModal.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FamilyNode } from "../lib/constants";

import { useT } from "../lib/i18n";
import { canvasToPdfBlob, deliverBlob, escapeXml, getEmbeddedFontCss, readPalette, svgToCanvas, tint } from "../lib/exportUtils";
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
  const [busy, setBusy] = useState(false);

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
  // طباعة / حفظ PDF — ورقة A4 ثابتة المقاس (نفس الشكل على كل الأجهزة)
  // =================================================================
  const handlePrint = async () => {
    if (!person || busy) return;
    setBusy(true);
    try {
      const names = reversedPath.map((n) => n.name.replace("فخذ ", ""));
      const fontCss = await getEmbeddedFontCss();
      const svg = buildCertificateSvg({
        names,
        personName: person.name,
        total: totalCount,
        date: dateAr,
        fontCss,
        labels: {
          title: t("شجرة عائلة القواسمي"),
          subtitle: t("وثيقة إثبات تسلسل نسب:"),
          bin: t("بـن"),
          count: t("عدد أفراد الفخذ:"),
          member: t("فرد"),
          printed: t("تاريخ الطباعة:"),
        },
      });
      const canvas = await svgToCanvas(svg, A4_W, A4_H, { targetWidthPx: A4_W * 2 });
      const pdf = await canvasToPdfBlob(canvas, 210, 297);
      const safe = person.name.replace(/[\\/:*?"<>|\s]+/g, "_");
      await deliverBlob(pdf, lang === "en" ? `Lineage_${safe}.pdf` : `وثيقة_نسب_${safe}.pdf`, t("وثيقة إثبات نسب"));
    } catch (err) {
      console.error(err);
      alert(t("حدث خطأ أثناء التصدير."));
    } finally {
      setBusy(false);
    }
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
                onClick={handlePrint} disabled={busy}
                className="flex-1 rounded-2xl bg-gradient-to-b from-[rgb(var(--b-strong-rgb)/1)] to-[rgb(var(--b-ink-rgb)/1)] px-4 py-3.5 font-bold text-white shadow-[0_6px_15px_rgba(76,122,63,0.3)] border border-[rgb(var(--b-ink-rgb)/1)] flex items-center justify-center gap-2"
              >
                <span className="text-[18px]">🖨️</span>  {busy ? t("⏳ جاري التجهيز...") : t("طباعة / حفظ PDF")}
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

  return <>{screenModal}</>;
}

// ───────────────────────── رسم وثيقة النسب كـ SVG بمقاس A4 ─────────────────────────
const A4_W = 794; // 210mm عند 96dpi
const A4_H = 1123; // 297mm

function cornerPath(x: number, y: number, w: number, h: number, r: number, flip: boolean): string {
  // زاويتان مستديرتان متقابلتان (بنفس شكل البطاقات القديمة)
  const [tl, tr, br, bl] = flip ? [0, r, 0, r] : [r, 0, r, 0];
  return `M${x + tl},${y} H${x + w - tr} ${tr ? `A${tr},${tr} 0 0 1 ${x + w},${y + tr}` : ""} V${y + h - br} ${br ? `A${br},${br} 0 0 1 ${x + w - br},${y + h}` : ""} H${x + bl} ${bl ? `A${bl},${bl} 0 0 1 ${x},${y + h - bl}` : ""} V${y + tl} ${tl ? `A${tl},${tl} 0 0 1 ${x + tl},${y}` : ""} Z`;
}

function buildCertificateSvg(o: {
  names: string[];
  personName: string;
  total: number;
  date: string;
  fontCss: string;
  labels: { title: string; subtitle: string; bin: string; count: string; member: string; printed: string };
}): string {
  const pal = readPalette();
  const cx = A4_W / 2;
  const top = 215;
  const bottom = 1015;
  const n = o.names.length;
  const slot = (bottom - top) / n;
  const boxH = Math.min(66, slot * 0.64);
  const gap = slot - boxH;
  const boxW = n > 11 ? 230 : n > 7 ? 270 : 310;
  const font = Math.max(11, Math.min(26, boxH * 0.5));
  const d = Math.max(14, Math.min(30, gap * 0.85));
  const r = Math.min(24, boxH / 2);

  let boxes = "";
  o.names.forEach((name, i) => {
    const y = top + i * slot;
    const x = cx - boxW / 2;
    const focus = i === 0;
    const root = i === n - 1;
    const fill = focus ? "url(#focus)" : root ? tint(pal.soft, 0.55) : tint(pal.mid, 0.88);
    const stroke = focus ? pal.deep : pal.ink;
    const color = focus ? "#ffffff" : pal.ink;
    boxes += `<path d="${cornerPath(x, y, boxW, boxH, r, i % 2 === 1)}" fill="${fill}" stroke="${stroke}" stroke-width="${n > 11 ? 1.4 : 2.2}"/>`;
    boxes += `<text x="${cx}" y="${y + boxH / 2}" dy="0.35em" text-anchor="middle" font-family="Cairo, sans-serif" font-weight="900" font-size="${font}" fill="${color}">${escapeXml(name)}</text>`;
    if (i < n - 1) {
      const cy = y + boxH + gap / 2;
      boxes += `<circle cx="${cx}" cy="${cy}" r="${d / 2}" fill="#fff" stroke="${pal.strong}" stroke-width="2"/>`;
      boxes += `<text x="${cx}" y="${cy}" dy="0.35em" text-anchor="middle" font-family="Cairo, sans-serif" font-weight="900" font-size="${Math.max(8, d * 0.42)}" fill="${pal.strong}">${escapeXml(o.labels.bin)}</text>`;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${A4_W} ${A4_H}" width="${A4_W}" height="${A4_H}">
  <defs>
    <style>${o.fontCss}</style>
    <linearGradient id="focus" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal.soft}"/><stop offset="1" stop-color="${pal.deep}"/></linearGradient>
  </defs>
  <rect width="${A4_W}" height="${A4_H}" fill="#ffffff"/>
  <rect x="26" y="26" width="${A4_W - 52}" height="${A4_H - 52}" fill="none" stroke="${pal.mid}" stroke-width="2"/>
  <rect x="34" y="34" width="${A4_W - 68}" height="${A4_H - 68}" fill="none" stroke="${tint(pal.mid, 0.5)}" stroke-width="1"/>

  <text x="${cx}" y="110" text-anchor="middle" font-family="'Aref Ruqaa', serif" font-weight="700" font-size="46" fill="${pal.deep}">${escapeXml(o.labels.title)}</text>
  <text x="${cx}" y="152" text-anchor="middle" font-family="Cairo, sans-serif" font-weight="700" font-size="19" fill="#7c6c53">${escapeXml(o.labels.subtitle)} ${escapeXml(o.personName)}</text>
  <line x1="110" y1="180" x2="${A4_W - 110}" y2="180" stroke="${pal.mid}" stroke-width="2.5"/>

  <line x1="${cx}" y1="${top + boxH / 2}" x2="${cx}" y2="${top + (n - 1) * slot + boxH / 2}" stroke="${pal.strong}" stroke-width="3"/>
  ${boxes}

  <line x1="110" y1="1048" x2="${A4_W - 110}" y2="1048" stroke="${pal.mid}" stroke-width="2" stroke-dasharray="7 6"/>
  <text x="${cx}" y="1080" text-anchor="middle" font-family="Cairo, sans-serif" font-weight="700" font-size="15" fill="#7c6c53">${escapeXml(`${o.labels.count} ${o.total} ${o.labels.member}   |   ${o.labels.printed} ${o.date}`)}</text>
</svg>`;
}
