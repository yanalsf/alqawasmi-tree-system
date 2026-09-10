// apps/public/components/SequenceModal.tsx
"use client";
 
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
 
interface SequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBranch: (branchId: string) => void;
}
 
interface TreeNode {
  name: string;
  children?: TreeNode[];
  branch?: string;
  color?: string;
}
 
// =====================================================================
// 🕌 إطار الوثيقة الملكي الفخم (للطباعة) - مبني بالكامل بـ CSS لضمان دقة الطباعة
// =====================================================================
function IslamicPrintFrame() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* الإطار الخارجي الخشبي/الداكن العريض */}
      <div className="absolute inset-0 border-[28px] border-[#1f150d] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
 
      {/* خط ذهبي لامع عريض */}
      <div className="absolute inset-[28px] border-[6px] border-[#d4af37]" />
 
      {/* شريط داخلي بني محمر يعطي طابع كلاسيكي للوثائق */}
      <div className="absolute inset-[34px] border-[14px] border-[#382415]" />
 
      {/* خط ذهبي داخلي رفيع */}
      <div className="absolute inset-[48px] border-[2px] border-[#d4af37]" />
 
      {/* إطار مزدوج داخلي يحيط بمحتوى الشهادة */}
      <div className="absolute inset-[70px] border-[8px] border-double border-[#b68d40] opacity-80" />
 
      {/* زخارف الزوايا الهندسية (المربعات المائلة) */}
      <div className="absolute top-[30px] left-[30px] w-[22px] h-[22px] bg-[#1f150d] border-[3px] border-[#d4af37] rotate-45 shadow-sm" />
      <div className="absolute top-[30px] right-[30px] w-[22px] h-[22px] bg-[#1f150d] border-[3px] border-[#d4af37] rotate-45 shadow-sm" />
      <div className="absolute bottom-[30px] left-[30px] w-[22px] h-[22px] bg-[#1f150d] border-[3px] border-[#d4af37] rotate-45 shadow-sm" />
      <div className="absolute bottom-[30px] right-[30px] w-[22px] h-[22px] bg-[#1f150d] border-[3px] border-[#d4af37] rotate-45 shadow-sm" />
 
      {/* لمسات تزيينية إضافية في منتصف الأضلاع */}
      <div className="absolute top-[34px] left-1/2 -translate-x-1/2 w-[70px] h-[14px] border-x-[3px] border-[#d4af37] bg-[#1f150d]" />
      <div className="absolute bottom-[34px] left-1/2 -translate-x-1/2 w-[70px] h-[14px] border-x-[3px] border-[#d4af37] bg-[#1f150d]" />
      <div className="absolute left-[34px] top-1/2 -translate-y-1/2 w-[14px] h-[70px] border-y-[3px] border-[#d4af37] bg-[#1f150d]" />
      <div className="absolute right-[34px] top-1/2 -translate-y-1/2 w-[14px] h-[70px] border-y-[3px] border-[#d4af37] bg-[#1f150d]" />
    </div>
  );
}
 
const sequenceData: TreeNode = {
  name: 'قاسم',
  children: [
    {
      name: 'محمود',
      children: [
        {
          name: 'يوسف',
          children: [
            {
              name: 'حجازي',
              children: [
                {
                  name: 'بدر',
                  children: [
                    {
                      name: 'قاسم',
                      children: [
                        {
                          name: 'محمود',
                          children: [
                            { name: 'عيسى', children: [{ name: 'سليمان (ابو بيض)', branch: 'abu_baid', color: '#8a2b2b' }] },
                            { name: 'محمد', children: [{ name: 'احمد الخضير', branch: 'al_khudair', color: '#277a45' }, { name: 'محمد علي', branch: 'mohammed_ali', color: '#3b5187' }] }
                          ]
                        },
                        {
                          name: 'محمد',
                          children: [
                            { name: 'عبدالمحسن', children: [{ name: 'بدوي', branch: 'al_badawi', color: '#5e8527' }] },
                            { name: 'محمد', children: [{ name: 'عبدالمحسن (يونس)', branch: 'younes', color: '#8a3556' }] }
                          ]
                        },
                        {
                          name: 'عبدالله',
                          children: [
                            { name: 'قاسم', children: [{ name: 'ابو نواره', branch: 'abu_nawara', color: '#316982' }, { name: 'عبد القادر (الصوص)', branch: 'al_sous', color: '#8a4b33' }] },
                            {
                              name: 'صالح',
                              children: [
                                { name: 'سلمان', children: [{ name: 'عبدالله', branch: 'abdullah', color: '#67398a' }] },
                                {
                                  name: 'سليمان',
                                  children: [
                                    { name: 'مصطفى (الجدع)', branch: 'al_jadaa', color: '#7baaca' },
                                    { name: 'محمد سليمان', branch: 'mohammed_sulaiman', color: '#ccae1a' },
                                    { name: 'داوود', branch: 'dawoud', color: '#397639' }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'يوسف',
                  children: [
                    { name: 'حجازي', children: [{ name: 'عبد المعطي', children: [{ name: "عبد الحق", branch: "abdulhaq", color: "#703b82" }] }] }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
 
export default function SequenceModal({ isOpen, onClose, onSelectBranch }: SequenceModalProps) {
  const [viewMode, setViewMode] = useState<'diagram' | 'list'>('diagram');
  const [isExporting, setIsExporting] = useState(false);
 
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const treeContentRef = useRef<HTMLUListElement>(null);
 
  const MIN_SCALE = 0.3;
  const MAX_SCALE = 1.6;
  const [scale, setScale] = useState(1);
 
  const computeFit = useCallback(() => {
    const container = scrollContainerRef.current;
    const content = treeContentRef.current;
    if (!container || !content) return;
 
    const prevTransform = content.style.transform;
    content.style.transform = 'none';
    const naturalWidth = content.scrollWidth;
    const naturalHeight = content.scrollHeight;
    content.style.transform = prevTransform;
 
    if (!naturalWidth || !naturalHeight) return;
 
    const RESERVED_SPACE = 80;
    const availableWidth = container.clientWidth - RESERVED_SPACE;
    const availableHeight = container.clientHeight - RESERVED_SPACE;
 
    const fitScale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1);
    if (Number.isFinite(fitScale) && fitScale > 0) {
      setScale(Math.max(Math.min(fitScale, MAX_SCALE), MIN_SCALE));
    }
 
    const centerPosition = (naturalWidth * fitScale - container.clientWidth) / 2;
    container.scrollTo({
      left: document.dir === 'rtl' ? -centerPosition : centerPosition,
      behavior: 'smooth'
    });
  }, []);
 
  useEffect(() => {
    if (!isOpen || viewMode !== 'diagram') return;
    setScale(1);
    let cleanupRaf2: number | undefined;
    const raf1 = requestAnimationFrame(() => {
      cleanupRaf2 = requestAnimationFrame(computeFit);
    });
    const timer = setTimeout(computeFit, 200);
    window.addEventListener('resize', computeFit);
    return () => {
      cancelAnimationFrame(raf1);
      if (cleanupRaf2) cancelAnimationFrame(cleanupRaf2);
      clearTimeout(timer);
      window.removeEventListener('resize', computeFit);
    };
  }, [isOpen, viewMode, computeFit]);
 
  // إغلاق بزر Escape ومنع تمرير الخلفية أثناء فتح النافذة
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);
 
  const zoomIn = () => setScale((s) => Math.min(s * 1.15, MAX_SCALE));
  const zoomOut = () => setScale((s) => Math.max(s / 1.15, MIN_SCALE));
 
  const handleExportPDF = async () => {
    setIsExporting(true);
 
    setTimeout(async () => {
      const element = document.getElementById('sequence-export-area');
      if (!element) {
        setIsExporting(false);
        return;
      }
 
      const originalParent = element.parentElement;
      const originalNextSibling = element.nextSibling;
      const originalInlineStyle = element.getAttribute('style');
 
      try {
        await document.fonts.ready;
 
        // 🌟 السبب الحقيقي للخلل: عنصر الوثيقة يعيش داخل نافذة منبثقة
        // position:fixed تتمركز عبر flex، وداخل حاويات overflow:hidden/auto.
        // كانت النسخة القديمة تُكبّر حجم "نافذة" الالتقاط الافتراضية في
        // html2canvas (windowWidth/windowHeight) للسماح بظهور الشجرة الكاملة
        // دون قص، لكن هذا يجبر html2canvas على إعادة تخطيط الصفحة المستنسخة
        // بأكملها على حجم نافذة مختلف، فتنزاح النافذة المنبثقة المُتمركزة عن
        // موضعها الأصلي — وهذا بالضبط ما ينتج عنه ظهور نصف الصورة بخلفية
        // الطبقة الخلفية الداكنة والنصف الآخر بخلفية الوثيقة الفاتحة.
        //
        // الحل الموثوق: نقل عنصر الوثيقة مؤقتاً إلى مستوى body مباشرة (خارج
        // كل هذه الطبقات) قبل الالتقاط، مع تثبيته خارج حدود الشاشة المرئية
        // حتى لا يظهر أي وميض للمستخدم، ثم إعادته فوراً إلى مكانه الأصلي.
        document.body.appendChild(element);
        element.style.position = 'fixed';
        element.style.top = '0';
        element.style.left = '-100000px';
        element.style.margin = '0';
        element.style.zIndex = '-1';
 
        // إطاران إضافيان لضمان استقرار التخطيط الجديد قبل الالتقاط
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
 
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');
 
        const isDark = document.documentElement.classList.contains('dark');
        const bgColor = isDark ? '#161411' : '#fffdf8';
 
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: bgColor,
          logging: false,
        });
 
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
 
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
 
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
 
        const fileName = viewMode === 'diagram' ? 'وثيقة_تسلسل_الأفخاذ.pdf' : 'قائمة_تسلسل_الأفخاذ.pdf';
        pdf.save(fileName);
 
      } catch (err) {
        console.error("Error exporting PDF:", err);
        alert("حدث خطأ أثناء تصدير ملف الـ PDF. يرجى المحاولة مرة أخرى.");
      } finally {
        // إعادة عنصر الوثيقة إلى مكانه الأصلي داخل النافذة المنبثقة
        if (originalInlineStyle === null) {
          element.removeAttribute('style');
        } else {
          element.setAttribute('style', originalInlineStyle);
        }
        if (originalParent) {
          if (originalNextSibling) {
            originalParent.insertBefore(element, originalNextSibling);
          } else {
            originalParent.appendChild(element);
          }
        }
        setIsExporting(false);
      }
    }, 400);
  };
 
  // ==========================================
  // 1. بناء المخطط الشجري (بتصميم فخم جداً)
  // ==========================================
  const renderDiagramNode = (node: TreeNode, keyPrefix: string = 'root') => {
    const nodeKey = `${keyPrefix}-${node.branch ?? node.name}`;
    return (
      <li key={nodeKey}>
        {node.branch ? (
          <button
            type="button"
            onClick={() => onSelectBranch(node.branch as string)}
            style={{
              background: `linear-gradient(135deg, ${node.color}f2, ${node.color})`,
              boxShadow: `0 8px 25px ${node.color}60, inset 0 2px 5px rgba(255,255,255,0.3), inset 0 -4px 6px rgba(0,0,0,0.2)`
            }}
            className="relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-xl sm:rounded-[1.25rem] border-2 sm:border-[2.5px] border-white/60 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 font-cairo text-sm sm:text-base md:text-[20px] font-extrabold text-white ring-[3px] sm:ring-[5px] ring-gold-deep/30 outline-offset-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(0,0,0,0.4)] focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 dark:border-white/30 dark:ring-[#d6b877]/30"
          >
            {node.name}
          </button>
        ) : (
          <div className="relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-xl sm:rounded-[1.25rem] border-2 sm:border-[3px] border-gold-deep/60 bg-gradient-to-br from-[#fffdf8] via-[#fdf6e3] to-[#f4ead5] px-5 sm:px-7 md:px-9 py-2.5 sm:py-3 md:py-4 font-cairo text-sm sm:text-base md:text-[21px] font-extrabold text-[#4a3a2a] shadow-[0_8px_20px_rgba(138,95,46,0.15),inset_0_3px_6px_rgba(255,255,255,0.9)] ring-[3px] sm:ring-[5px] ring-gold-deep/15 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(138,95,46,0.25)] dark:border-[#d6b877]/50 dark:from-[#2a2620] dark:via-[#1c1915] dark:to-[#12100e] dark:text-[#f3ede1] dark:shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.05)] dark:ring-[#d6b877]/15">
            {node.name}
          </div>
        )}
 
        {node.children && node.children.length > 0 && (
          <ul>
            {node.children.map((child, idx) => renderDiagramNode(child, `${nodeKey}-${idx}`))}
          </ul>
        )}
      </li>
    );
  };
 
  // ==========================================
  // 2. بناء القائمة العمودية
  // ==========================================
  const renderListNode = (node: TreeNode, depth: number = 0, keyPrefix: string = 'root') => {
    const nodeKey = `${keyPrefix}-${node.branch ?? node.name}`;
 
    if (node.branch) {
      return (
        <div key={nodeKey} className="relative flex items-center py-2">
          {depth > 0 && (
            <span className="absolute right-[-1.5rem] top-1/2 h-[2px] sm:h-[3px] w-4 sm:w-6 -translate-y-1/2 bg-[#b68d40] dark:bg-[#d6b877]/60" />
          )}
          <button
            type="button"
            onClick={() => onSelectBranch(node.branch as string)}
            style={{ background: `linear-gradient(135deg, ${node.color}f2, ${node.color})`, boxShadow: `0 5px 15px ${node.color}50, inset 0 2px 3px rgba(255,255,255,0.2)` }}
            className="relative z-10 inline-flex items-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl border sm:border-[1.5px] border-white/40 px-4 sm:px-6 py-2 sm:py-3 font-cairo text-sm sm:text-[16px] font-extrabold text-white ring-2 sm:ring-[3px] ring-gold-deep/20 transition-all duration-300 hover:-translate-x-2 hover:shadow-xl focus:outline-none focus-visible:ring-4 dark:ring-[#d6b877]/20"
          >
            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white/90 shadow-sm" />
            {node.name}
          </button>
        </div>
      );
    }
 
    return (
      <div key={nodeKey} className="relative">
        <div className="relative flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5">
          {depth > 0 && (
            <span className="absolute right-[-1.5rem] top-1/2 h-[2px] sm:h-[3px] w-4 sm:w-6 -translate-y-1/2 bg-[#b68d40] dark:bg-[#d6b877]/60" />
          )}
          <span className="relative z-10 flex h-3 w-3 sm:h-4 sm:w-4 shrink-0 rounded-full border-2 sm:border-[3px] border-gold-deep bg-[#fbfaf8] shadow-md dark:border-[#d6b877] dark:bg-[#1c1915]" />
          <span className="font-cairo text-sm sm:text-[18px] font-extrabold text-[#3a2818] drop-shadow-sm dark:text-[#f3ede1]">
            {node.name}
          </span>
        </div>
 
        {node.children && node.children.length > 0 && (
          <div className="mr-[7px] border-r-2 sm:border-r-[3px] border-[#b68d40]/60 pr-4 sm:pr-6 dark:border-[#d6b877]/40">
            <div className="flex flex-col gap-1 py-1.5">
              {node.children.map((child, idx) => renderListNode(child, depth + 1, `${nodeKey}-${idx}`))}
            </div>
          </div>
        )}
      </div>
    );
  };
 
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-0 sm:p-4 md:p-8 backdrop-blur-md"
          onClick={onClose}
        >
          {/* 🌟 إطار النافذة المزدوج والفخم */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sequence-modal-title"
            className="relative flex h-[100dvh] w-full max-w-[1200px] flex-col overflow-hidden rounded-none sm:rounded-[2rem] border-0 sm:border-[6px] border-double border-gold-deep/40 bg-[#fbfaf8] shadow-[0_25px_60px_-15px_rgba(138,95,46,0.4)] ring-1 ring-black/5 dark:border-[#d6b877]/30 dark:bg-[#12100e] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)] sm:h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* الترويسة العلوية الفخمة */}
            <div className="flex shrink-0 flex-col gap-3 border-b-[2px] border-gold-deep/20 bg-gradient-to-r from-[#fdfbf7] via-white to-[#fdfbf7] px-4 py-4 shadow-sm dark:border-white/10 dark:from-[#161411] dark:via-[#1c1915] dark:to-[#161411] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-8 sm:py-5">
              <h3 id="sequence-modal-title" className="font-ruqaa text-lg sm:text-xl md:text-[24px] m-0 font-bold text-[#7a5226] dark:text-[#d6b877] flex items-center gap-2 drop-shadow-sm">
                <span className="text-xl sm:text-2xl md:text-[26px]">🌳</span> تسلسل الأفخاذ الكامل
              </h3>
 
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-3 md:gap-5">
 
                {/* زر طباعة PDF */}
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="group relative flex items-center gap-2 rounded-full border-2 border-[#4c7a3f]/40 bg-gradient-to-b from-[#fbfaf8] to-[#f4ead5] px-4 sm:px-6 py-2 sm:py-2.5 font-cairo text-xs sm:text-[15px] font-extrabold text-[#3a5c30] shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-[#4c7a3f]/80 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 dark:border-[#d6b877]/30 dark:from-[#1c1915] dark:to-[#171411] dark:text-[#a0c288] dark:hover:border-[#d6b877]/60"
                >
                  {isExporting ? (
                    '⏳ جاري التجهيز...'
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform duration-300 group-hover:scale-110 sm:h-[18px] sm:w-[18px]">
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                      </svg>
                      طباعة الوثيقة
                    </>
                  )}
                </button>
 
                <div className="h-8 w-[2px] rounded-full bg-gold-deep/30 dark:bg-white/10 hidden sm:block"></div>
 
                {/* أزرار التبديل */}
                <div className="flex items-center rounded-full border-[2px] border-gold-deep/20 bg-gray-50/80 p-1 shadow-inner dark:border-white/10 dark:bg-black/40">
                  <button
                    type="button"
                    onClick={() => setViewMode('diagram')}
                    aria-pressed={viewMode === 'diagram'}
                    className={`rounded-full px-4 sm:px-7 py-1.5 sm:py-2 font-cairo text-xs sm:text-[14px] font-extrabold transition-all duration-300 ${
                      viewMode === 'diagram'
                        ? 'bg-gold-deep text-white shadow-md dark:bg-[#d6b877] dark:text-[#161411]'
                        : 'text-[#8a7250] hover:text-gold-deep dark:text-gray-400 dark:hover:text-[#d6b877]'
                    }`}
                  >
                    مخطط شجري
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-pressed={viewMode === 'list'}
                    className={`rounded-full px-4 sm:px-7 py-1.5 sm:py-2 font-cairo text-xs sm:text-[14px] font-extrabold transition-all duration-300 ${
                      viewMode === 'list'
                        ? 'bg-gold-deep text-white shadow-md dark:bg-[#d6b877] dark:text-[#161411]'
                        : 'text-[#8a7250] hover:text-gold-deep dark:text-gray-400 dark:hover:text-[#d6b877]'
                    }`}
                  >
                    قائمة عمودية
                  </button>
                </div>
 
                <div className="h-8 w-[2px] rounded-full bg-gold-deep/30 dark:bg-white/10 hidden sm:block ml-1"></div>
 
                {/* زر الإغلاق */}
                <button
                  type="button"
                  onClick={onClose}
                  className="group flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 border-gold-deep/30 bg-white text-[#7c6c53] shadow-md transition-all duration-300 hover:border-red-400 hover:bg-red-50 hover:text-red-600 hover:shadow-lg dark:border-white/20 dark:bg-[#1c1915] dark:text-gray-300 dark:hover:border-red-500/50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  aria-label="إغلاق"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:rotate-90 sm:h-[18px] sm:w-[18px]">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
 
            <div className="shrink-0 bg-gold-deep/10 py-2 sm:py-2.5 px-2 text-center border-b border-gold-deep/10 dark:bg-[#d6b877]/10 dark:border-transparent">
              <p className="text-xs sm:text-[14px] font-bold leading-snug text-[#7c6c53] dark:text-[#d6b877]/90">
                اضغط على اسم أي فخذ (الأسماء الملوّنة) للانتقال مباشرة إلى بياناته
              </p>
            </div>
 
            {/* المحتوى الفعلي وحاوية التصدير */}
            <div className="relative flex-1 overflow-auto p-3 sm:p-5 md:p-8" dir="rtl" ref={scrollContainerRef}>
 
              <div
                id="sequence-export-area"
                className={`relative mx-auto transition-all duration-300 ${
                  isExporting
                    ? 'w-max min-w-full overflow-visible bg-[#fffdf8] p-[100px] dark:bg-[#161411]'
                    : viewMode === 'diagram'
                    ? 'flex w-full justify-center py-2 sm:py-4'
                    : 'w-full max-w-2xl pb-10 px-2 sm:px-4'
                }`}
              >
                {/* الإطار والعناوين الخاصة بالطباعة */}
                {isExporting && (
                  <>
                    <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--tw-colors-gold-deep, #8a5f2e) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
 
                    {/* 🕌 الإطار الإسلامي الفخم (للطباعة فقط) */}
                    <IslamicPrintFrame />
 
                    <div className="relative z-10 mb-20 mt-6 text-center border-b-[4px] border-double border-[#b68d40]/50 pb-12 px-20 mx-auto w-max">
                      <h1 className="font-ruqaa text-7xl text-[#6b4c2a] dark:text-[#d6b877] mb-6 drop-shadow-md">تسلسل الأفخاذ الكامل</h1>
                      <h2 className="font-cairo text-[32px] text-[#b68d40] dark:text-gray-400 font-extrabold tracking-wide">عائلة القواسمي</h2>
                    </div>
                  </>
                )}
 
                {/* 🌟 خطوط الشجرة الفخمة */}
                {viewMode === 'diagram' ? (
                  <style>{`
                    .gen-org-tree, .gen-org-tree ul { list-style:none; margin:0; padding:0; display:flex; justify-content:center; }
                    .gen-org-tree { width:max-content; --tree-line: #b68d40; }
                    .dark .gen-org-tree { --tree-line: #d6b877; }
                    .gen-org-tree li {
                      position:relative; display:flex; flex-direction:column; align-items:center;
                      padding: clamp(24px, 4vw, 40px) clamp(8px, 2vw, 20px) 0;
                      text-align:center;
                    }
                    .gen-org-tree > li { padding-top:0; }
                    .gen-org-tree li::before, .gen-org-tree li::after {
                      content:''; position:absolute; top:0; width:50%; height: clamp(20px, 3vw, 34px);
                      border-top: 4px solid var(--tree-line);
                    }
                    .gen-org-tree li::before { inset-inline-end:50%; border-inline-end: 4px solid var(--tree-line); border-top-right-radius: 16px; }
                    .gen-org-tree li::after { inset-inline-start:50%; border-inline-start: 4px solid var(--tree-line); border-top-left-radius: 16px;}
                    .gen-org-tree > li::before, .gen-org-tree > li::after { display:none; }
                    .gen-org-tree li:only-child::before, .gen-org-tree li:only-child::after { display:none; }
                    .gen-org-tree li:first-child::before { border-color:transparent; }
                    .gen-org-tree li:last-child::after { border-color:transparent; }
                    .gen-org-tree li > ul { position:relative; padding-top: clamp(20px, 3vw, 34px); }
                    .gen-org-tree li > ul::before {
                      content:''; position:absolute; top:0; inset-inline-start:50%; width:0; height: clamp(20px, 3vw, 34px);
                      border-inline-start: 4px solid var(--tree-line);
                    }
                  `}</style>
                ) : null}
 
                {viewMode === 'diagram' ? (
                  <ul
                    ref={treeContentRef}
                    style={{
                      transform: isExporting ? 'scale(1)' : `scale(${scale})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.25s ease'
                    }}
                    className="gen-org-tree relative z-10"
                  >
                    {renderDiagramNode(sequenceData)}
                  </ul>
                ) : (
                  <div className={`relative z-10 w-fit mx-auto ${isExporting ? 'scale-125 origin-top mt-10 mb-20' : 'rounded-2xl sm:rounded-3xl border-2 sm:border-[3px] border-gold-deep/20 bg-white/80 p-4 sm:p-6 md:p-10 shadow-xl dark:border-[#d6b877]/20 dark:bg-black/30'}`}>
                    {renderListNode(sequenceData)}
                  </div>
                )}
 
                {/* تذييل الشهادة */}
                {isExporting && (
                  <div className="relative z-10 mt-28 pt-10 border-t-[4px] border-double border-[#b68d40]/50 text-center w-full mx-auto max-w-xl">
                    <p className="font-cairo text-[28px] text-[#6b4c2a] dark:text-[#d6b877] font-extrabold mb-4">
                      وثيقة إثبات تسلسل نسب
                    </p>
                    <p className="font-cairo text-[20px] text-[#8a7250] dark:text-gray-400 font-bold">
                      تاريخ الإصدار: {new Date().toLocaleDateString('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
 
            </div>
 
            {/* أدوات التكبير/التصغير */}
            {viewMode === 'diagram' && !isExporting && (
              <div className="pointer-events-none absolute inset-x-0 bottom-4 sm:bottom-6 flex justify-center px-3 pb-[env(safe-area-inset-bottom)]">
                <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 rounded-full border-2 sm:border-[3px] border-gold-deep/20 bg-white/95 px-3 sm:px-4 py-2 sm:py-2.5 shadow-[0_10px_30px_rgba(138,95,46,0.2)] backdrop-blur dark:border-[#d6b877]/30 dark:bg-[#1c1915]/95">
                  <button
                    type="button"
                    onClick={zoomOut}
                    aria-label="تصغير"
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xl sm:text-2xl font-extrabold text-gold-deep transition-colors hover:bg-gold-deep/15 dark:text-[#d6b877] dark:hover:bg-white/10"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={computeFit}
                    className="rounded-full px-3 sm:px-5 py-1.5 sm:py-2 font-cairo text-xs sm:text-[14px] font-extrabold text-[#7a5226] transition-colors hover:bg-gold-deep/15 dark:text-[#d6b877] dark:hover:bg-white/10 whitespace-nowrap"
                  >
                    ⤢ ملاءمة الشاشة
                  </button>
                  <button
                    type="button"
                    onClick={zoomIn}
                    aria-label="تكبير"
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xl sm:text-2xl font-extrabold text-gold-deep transition-colors hover:bg-gold-deep/15 dark:text-[#d6b877] dark:hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
 
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}