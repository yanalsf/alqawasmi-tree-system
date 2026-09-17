// apps/public/components/SequenceModal.tsx
"use client";
 
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
 
interface SequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBranch: (branchId: string) => void;
}
 
// البيانات الشجرية لتسلسل الأفخاذ
const sequenceData = {
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
 
  // ==========================================
  // منطق "ملاءمة الشاشة" والتوسيط التلقائي
  // ==========================================
  const MIN_SCALE = 0.3;
  const MAX_SCALE = 1.6;
  const [scale, setScale] = useState(1);
 
  const computeFit = () => {
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

    // التوسيط التلقائي
    const centerPosition = (naturalWidth * fitScale - container.clientWidth) / 2;
    container.scrollTo({
      left: document.dir === 'rtl' ? -centerPosition : centerPosition,
      behavior: 'smooth'
    });
  };
 
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
  }, [isOpen, viewMode]);
 
  const zoomIn = () => setScale((s) => Math.min(s * 1.15, MAX_SCALE));
  const zoomOut = () => setScale((s) => Math.max(s / 1.15, MIN_SCALE));

  // ==========================================
  // دالة استخراج وطباعة الـ PDF الاحترافية
  // ==========================================
  const handleExportPDF = async () => {
    setIsExporting(true);
    
    setTimeout(async () => {
      try {
        await document.fonts.ready; 
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const element = document.getElementById('sequence-export-area');
        if (!element) return;

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
        
        const fileName = viewMode === 'diagram' ? 'مخطط_تسلسل_الأفخاذ.pdf' : 'قائمة_تسلسل_الأفخاذ.pdf';
        pdf.save(fileName);
        
      } catch (err) {
        console.error("Error exporting PDF:", err);
        alert("حدث خطأ أثناء تصدير ملف الـ PDF. يرجى المحاولة مرة أخرى.");
      } finally {
        setIsExporting(false); 
      }
    }, 400); 
  };
 
  // ==========================================
  // 1. بناء المخطط الشجري
  // ==========================================
  const renderDiagramNode = (node: any) => {
    return (
      <li key={node.name || node.branch}>
        {node.branch ? (
          <button
            onClick={() => onSelectBranch(node.branch)}
            style={{
              background: `linear-gradient(145deg, ${node.color}e6, ${node.color})`,
              boxShadow: `0 4px 15px ${node.color}40`
            }}
            className="relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-white/20 px-7 py-3 font-cairo text-[18px] font-extrabold text-white transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none dark:border-white/10"
          >
            {node.name}
          </button>
        ) : (
          <div className="relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-gold-deep/30 bg-gradient-to-b from-[#fffdf8] to-[#f4ead5] px-7 py-2.5 font-cairo text-[18px] font-bold text-[#5c4a38] shadow-[0_3px_10px_rgba(138,95,46,0.08)] dark:border-[#d6b877]/20 dark:from-[#221f1a] dark:to-[#1a1713] dark:text-[#f3ede1]">
            {node.name}
          </div>
        )}
 
        {node.children && node.children.length > 0 && (
          <ul>
            {node.children.map((child: any) => renderDiagramNode(child))}
          </ul>
        )}
      </li>
    );
  };
 
  // ==========================================
  // 2. بناء القائمة العمودية
  // ==========================================
  const renderListNode = (node: any, depth: number = 0) => {
    if (node.branch) {
      return (
        <div key={node.branch} className="relative flex items-center py-1.5">
          {depth > 0 && (
            <span className="absolute right-[-1.5rem] top-1/2 h-[2px] w-6 -translate-y-1/2 bg-gold-deep/40 dark:bg-[#d6b877]/30" />
          )}
          <button
            onClick={() => onSelectBranch(node.branch)}
            style={{ background: `linear-gradient(145deg, ${node.color}e6, ${node.color})` }}
            className="relative z-10 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-cairo text-[14.5px] font-extrabold text-white shadow-md ring-1 ring-white/10 transition-all hover:-translate-x-1 hover:shadow-lg focus:outline-none"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
            {node.name}
          </button>
        </div>
      );
    }
 
    return (
      <div key={node.name} className="relative">
        <div className="relative flex items-center gap-2.5 py-2">
          {depth > 0 && (
            <span className="absolute right-[-1.5rem] top-1/2 h-[2px] w-6 -translate-y-1/2 bg-gold-deep/40 dark:bg-[#d6b877]/30" />
          )}
          <span className="relative z-10 flex h-3 w-3 shrink-0 rounded-full border-2 border-gold-deep/60 bg-[#fbfaf8] dark:border-[#d6b877]/60 dark:bg-[#1c1915]" />
          <span className="font-cairo text-[16px] font-bold text-[#4a3a2a] dark:text-[#f3ede1]">
            {node.name}
          </span>
        </div>
 
        {node.children && node.children.length > 0 && (
          <div className="mr-[5px] border-r-[2px] border-gold-deep/30 pr-6 dark:border-[#d6b877]/20">
            <div className="flex flex-col gap-0.5 py-0.5">
              {node.children.map((child: any) => renderListNode(child, depth + 1))}
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
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-gold-deep/30 bg-[#fbfaf8] dark:bg-[#161411] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* الترويسة العلوية الفخمة (نسخة متجاوبة للموبايل) */}
            <div className="flex shrink-0 flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-4 border-b border-gold-deep/15 bg-gradient-to-r from-[#fdfbf7] via-white to-[#fdfbf7] px-4 sm:px-6 py-4 shadow-[0_4px_20px_rgba(138,95,46,0.03)] dark:border-white/10 dark:from-[#161411] dark:via-[#1c1915] dark:to-[#161411]">
              
              {/* 🌟 العنوان وزر الإغلاق (يظهران في نفس السطر براحة تامة على الموبايل) */}
              <div className="flex w-full sm:w-auto items-center justify-between">
                <h3 className="font-ruqaa text-[20px] sm:text-[22px] m-0 font-bold text-gold-deep dark:text-[#d6b877] flex items-center gap-2 drop-shadow-sm">
                  <span className="text-[22px] sm:text-[24px]">🌳</span> تسلسل الأفخاذ الكامل
                </h3>

                {/* زر الإغلاق الدائري - يظهر هنا فقط في الموبايل */}
                <button 
                  onClick={onClose} 
                  className="sm:hidden cursor-pointer group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-deep/20 bg-white text-[#7c6c53] shadow-sm transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-500 hover:shadow-md dark:border-white/10 dark:bg-[#1c1915] dark:text-gray-400 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  aria-label="إغلاق"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:rotate-90">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
 
              {/* 🌟 أزرار الإجراءات (تنزل لسطر جديد في الموبايل) */}
              <div className="flex w-full sm:w-auto items-center justify-center sm:justify-end gap-2.5 sm:gap-5 flex-wrap sm:flex-nowrap">
                
                {/* زر طباعة PDF */}
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="cursor-pointer shrink-0 group relative flex items-center gap-2 rounded-full border border-[#4c7a3f]/30 bg-gradient-to-b from-[#fbfaf8] to-[#f4ead5] px-4 sm:px-5 py-2 font-cairo text-[13.5px] sm:text-[14px] font-bold text-[#3a5c30] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#4c7a3f]/60 disabled:opacity-70 disabled:hover:translate-y-0 dark:border-[#d6b877]/20 dark:from-[#1c1915] dark:to-[#171411] dark:text-[#90ad7a] dark:hover:border-[#d6b877]/50"
                >
                  {isExporting ? (
                    '⏳ جاري التجهيز...'
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110">
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                      </svg>
                      طباعة PDF
                    </>
                  )}
                </button>

                {/* فاصل عمودي */}
                <div className="h-7 w-[1.5px] rounded-full bg-gold-deep/20 dark:bg-white/10 hidden sm:block"></div>

                {/* أزرار التبديل (مخطط / قائمة) */}
                <div className="flex shrink-0 items-center rounded-full border border-gold-deep/15 bg-gray-50/80 p-1 shadow-inner dark:border-white/10 dark:bg-black/30">
                  <button
                    onClick={() => setViewMode('diagram')}
                    className={`cursor-pointer rounded-full px-5 sm:px-6 py-1.5 font-cairo text-[13px] sm:text-[13.5px] font-bold transition-all duration-300 ${
                      viewMode === 'diagram' 
                        ? 'bg-gold-deep text-white shadow-md dark:bg-[#d6b877] dark:text-[#161411]' 
                        : 'text-[#7c6c53] hover:text-gold-deep dark:text-gray-400 dark:hover:text-[#d6b877]'
                    }`}
                  >
                    مخطط
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`cursor-pointer rounded-full px-5 sm:px-6 py-1.5 font-cairo text-[13px] sm:text-[13.5px] font-bold transition-all duration-300 ${
                      viewMode === 'list' 
                        ? 'bg-gold-deep text-white shadow-md dark:bg-[#d6b877] dark:text-[#161411]' 
                        : 'text-[#7c6c53] hover:text-gold-deep dark:text-gray-400 dark:hover:text-[#d6b877]'
                    }`}
                  >
                    قائمة
                  </button>
                </div>
 
                {/* فاصل عمودي */}
                <div className="h-7 w-[1.5px] rounded-full bg-gold-deep/20 dark:bg-white/10 hidden sm:block ml-1"></div>

                {/* زر الإغلاق الدائري - يظهر هنا فقط في الشاشات الكبيرة */}
                <button 
                  onClick={onClose} 
                  className="hidden sm:flex cursor-pointer group h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-deep/20 bg-white text-[#7c6c53] shadow-sm transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-500 hover:shadow-md dark:border-white/10 dark:bg-[#1c1915] dark:text-gray-400 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  aria-label="إغلاق"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:rotate-90">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
 
            <div className="shrink-0 bg-gold-deep/5 py-2 text-center dark:bg-[#d6b877]/5">
              <p className="text-[13px] font-semibold text-[#7c6c53] dark:text-[#d6b877]/80">
                اضغط على اسم أي فخذ (الأسماء الملوّنة) للانتقال مباشرة إلى بياناته
              </p>
            </div>
 
            {/* المحتوى الفعلي وحاوية التصدير المخفية */}
            <div className="relative flex-1 overflow-auto p-8" dir="rtl" ref={scrollContainerRef}>
              
              <div 
                id="sequence-export-area"
                className={`relative transition-all duration-300 ${
                  isExporting
                    ? 'w-max min-w-full overflow-visible bg-[#fffdf8] p-24 dark:bg-[#161411]'
                    : viewMode === 'diagram'
                    // 🌟 التعديل هنا: يبدأ من اليمين للموبايل، ويتوسط في الشاشات الكبيرة
                    ? 'flex w-full justify-start md:justify-center py-8 px-4 sm:px-8'
                    : 'w-full max-w-2xl pb-10 px-4 mx-auto'
                }`}
              >
                {/* الإطار والعناوين الخاصة بالطباعة */}
                {isExporting && (
                  <>
                    <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--tw-colors-gold-deep, #8a5f2e) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
                    <div className="absolute inset-0 border-[16px] border-[#8a5f2e] dark:border-[#d6b877] pointer-events-none opacity-90"></div>
                    <div className="absolute inset-8 border-[3px] border-[#c9974f] dark:border-[#a38545] pointer-events-none"></div>

                    <div className="relative z-10 mb-20 text-center border-b-[3px] border-[#c9974f]/30 pb-10 px-16 mx-auto w-max">
                      <h1 className="font-ruqaa text-6xl text-[#8a5f2e] dark:text-[#d6b877] mb-6 drop-shadow-sm">تسلسل الأفخاذ الكامل</h1>
                      <h2 className="font-cairo text-3xl text-[#7c6c53] dark:text-gray-400 font-bold">عائلة القواسمي</h2>
                    </div>
                  </>
                )}

                {/* الشجرة */}
                {viewMode === 'diagram' ? (
                  <style>{`
                    .gen-org-tree, .gen-org-tree ul { list-style:none; margin:0; padding:0; display:flex; justify-content:center; }
                    .gen-org-tree { width:max-content; --tree-line: rgba(138,95,46,0.5); }
                    .dark .gen-org-tree { --tree-line: rgba(214,184,119,0.4); }
                    .gen-org-tree li {
                      position:relative; display:flex; flex-direction:column; align-items:center;
                      padding:32px 16px 0; text-align:center;
                    }
                    .gen-org-tree > li { padding-top:0; }
                    .gen-org-tree li::before, .gen-org-tree li::after {
                      content:''; position:absolute; top:0; width:50%; height:26px;
                      border-top:2.5px solid var(--tree-line);
                    }
                    .gen-org-tree li::before { inset-inline-end:50%; border-inline-end:2.5px solid var(--tree-line); border-top-right-radius: 12px; }
                    .gen-org-tree li::after { inset-inline-start:50%; border-inline-start:2.5px solid var(--tree-line); border-top-left-radius: 12px;}
                    .gen-org-tree > li::before, .gen-org-tree > li::after { display:none; }
                    .gen-org-tree li:only-child::before, .gen-org-tree li:only-child::after { display:none; }
                    .gen-org-tree li:first-child::before { border-color:transparent; }
                    .gen-org-tree li:last-child::after { border-color:transparent; }
                    .gen-org-tree li > ul { position:relative; padding-top:26px; }
                    .gen-org-tree li > ul::before {
                      content:''; position:absolute; top:0; inset-inline-start:50%; width:0; height:26px;
                      border-inline-start:2.5px solid var(--tree-line);
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
                    // 🌟 حذفنا mx-auto من هنا ليعود للوضع الطبيعي
                    className="gen-org-tree relative z-10"
                  >
                    {renderDiagramNode(sequenceData)}
                  </ul>
                ) : (
                  <div className={`relative z-10 w-fit mx-auto ${isExporting ? 'scale-125 origin-top mt-10 mb-20' : 'rounded-2xl border border-gold-deep/10 bg-white/60 p-6 shadow-sm dark:border-[#d6b877]/10 dark:bg-black/20'}`}>
                    {renderListNode(sequenceData)}
                  </div>
                )}

                {/* الشجرة */}
                {viewMode === 'diagram' ? (
                  <style>{`
                    .gen-org-tree, .gen-org-tree ul { list-style:none; margin:0; padding:0; display:flex; justify-content:center; }
                    .gen-org-tree { width:max-content; --tree-line: rgba(138,95,46,0.5); }
                    .dark .gen-org-tree { --tree-line: rgba(214,184,119,0.4); }
                    .gen-org-tree li {
                      position:relative; display:flex; flex-direction:column; align-items:center;
                      padding:32px 16px 0; text-align:center;
                    }
                    .gen-org-tree > li { padding-top:0; }
                    .gen-org-tree li::before, .gen-org-tree li::after {
                      content:''; position:absolute; top:0; width:50%; height:26px;
                      border-top:2.5px solid var(--tree-line);
                    }
                    .gen-org-tree li::before { inset-inline-end:50%; border-inline-end:2.5px solid var(--tree-line); border-top-right-radius: 12px; }
                    .gen-org-tree li::after { inset-inline-start:50%; border-inline-start:2.5px solid var(--tree-line); border-top-left-radius: 12px;}
                    .gen-org-tree > li::before, .gen-org-tree > li::after { display:none; }
                    .gen-org-tree li:only-child::before, .gen-org-tree li:only-child::after { display:none; }
                    .gen-org-tree li:first-child::before { border-color:transparent; }
                    .gen-org-tree li:last-child::after { border-color:transparent; }
                    .gen-org-tree li > ul { position:relative; padding-top:26px; }
                    .gen-org-tree li > ul::before {
                      content:''; position:absolute; top:0; inset-inline-start:50%; width:0; height:26px;
                      border-inline-start:2.5px solid var(--tree-line);
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
                  <div className={`relative z-10 w-fit mx-auto ${isExporting ? 'scale-125 origin-top mt-10 mb-20' : 'rounded-2xl border border-gold-deep/10 bg-white/60 p-6 shadow-sm dark:border-[#d6b877]/10 dark:bg-black/20'}`}>
                    {renderListNode(sequenceData)}
                  </div>
                )}

                {/* تذييل الشهادة */}
                {isExporting && (
                  <div className="relative z-10 mt-20 pt-8 border-t-[3px] border-[#c9974f]/30 text-center w-full mx-auto max-w-lg">
                    <p className="font-cairo text-2xl text-[#8a5f2e] dark:text-[#d6b877] font-bold">
                      وثيقة إثبات تسلسل نسب
                    </p>
                    <p className="font-cairo text-lg text-gray-500 dark:text-gray-400 mt-3 font-semibold">
                      تاريخ الإصدار: {new Date().toLocaleDateString('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>

            </div>
 
            {/* أدوات التكبير/التصغير */}
            {viewMode === 'diagram' && !isExporting && (
              <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
                <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-gold-deep/20 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur dark:border-[#d6b877]/20 dark:bg-[#1c1915]/95">
                  <button
                    onClick={zoomOut}
                    aria-label="تصغير"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-gold-deep transition-colors hover:bg-gold-deep/10 dark:text-[#d6b877] dark:hover:bg-white/10"
                  >
                    −
                  </button>
                  <button
                    onClick={computeFit}
                    className="rounded-full px-3 py-1.5 font-cairo text-[12px] font-bold text-gold-deep transition-colors hover:bg-gold-deep/10 dark:text-[#d6b877] dark:hover:bg-white/10"
                  >
                    ⤢ ملاءمة الشاشة
                  </button>
                  <button
                    onClick={zoomIn}
                    aria-label="تكبير"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-gold-deep transition-colors hover:bg-gold-deep/10 dark:text-[#d6b877] dark:hover:bg-white/10"
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