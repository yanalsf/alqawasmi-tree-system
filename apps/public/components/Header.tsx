// Header.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Branch {
  id: string;
  label: string;
}

interface HeaderProps {
  title?: string;
  branches: Branch[];
  onNavigateHome: () => void;
  onSelectBranch: (branchId: string) => void;
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean; 
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenFeatures: () => void;
  showDates?: boolean;
  setShowDates?: (val: boolean) => void;
  reduceAnimations?: boolean;
  setReduceAnimations?: (val: boolean) => void;
}

const CustomToggle = ({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) => (
  <div 
    onClick={onToggle}
    className={`relative flex h-7 w-[50px] cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${isOn ? 'bg-gradient-to-r from-[#8a5f2e] to-[#c9974f] dark:from-[#d6b877] dark:to-[#b68d40]' : 'bg-gray-300 dark:bg-gray-700'}`}
    style={{ justifyContent: isOn ? 'flex-end' : 'flex-start' }}
  >
    <motion.div layout className="h-5 w-5 rounded-full bg-white shadow-sm" />
  </div>
);

export default function Header({
  title = "عائلة القواسمي",
  branches = [],
  onNavigateHome = () => {},
  onSelectBranch = () => {},
  onToggleSidebar = () => {},
  isSidebarOpen = false,
  isDarkMode = false,
  onToggleDarkMode = () => {},
  onOpenFeatures = () => {},
  showDates = true,
  setShowDates,
  reduceAnimations = false,
  setReduceAnimations
}: HeaderProps) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🌟 تم تصغير الارتفاع قليلاً على الشاشات الصغيرة (h-[38px]) وجعله (h-[42px]) على الشاشات الأكبر
  const glassBtn = "cursor-pointer relative flex h-[38px] sm:h-[42px] items-center justify-center rounded-full border-[1.5px] border-gold-deep/30 bg-gradient-to-b from-[#fffdf8] to-[#fcf8f2] shadow-[0_4px_12px_rgba(138,95,46,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-deep/60 hover:shadow-[0_8px_20px_rgba(138,95,46,0.15)] dark:border-[#d6b877]/30 dark:from-[#1c1915] dark:to-[#14120f] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] dark:hover:border-[#d6b877]/60";

  return (
    <>
     {/* 🌟 تم ضبط المحاذاة (top-[14px]) وتقليل الفراغات (gap-1.5) للشاشات الصغيرة */}
     <div ref={wrapRef} className="fixed top-[14px] left-[8px] sm:left-[18px] z-[12] flex items-center gap-1.5 sm:gap-2.5">
        <motion.span
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
          onClick={() => setDropdownOpen((v) => !v)}
          whileTap={{ scale: 0.96 }}
          className={`${glassBtn} cursor-pointer select-none px-3 sm:px-5 font-ruqaa text-[17px] sm:text-[21px] font-bold text-gold-deep dark:text-[#d6b877] leading-none pt-1`}
        >
          {title}
        </motion.span>

        <motion.button
          type="button"
          onClick={onOpenFeatures}
          whileTap={{ scale: 0.96 }}
          className={`${glassBtn} px-3 sm:px-5 gap-1 sm:gap-1.5 font-cairo text-[12.5px] sm:text-[14px] font-extrabold text-gold-deep dark:text-[#d6b877]`}
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          </svg>
          المزيد
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setSettingsOpen(true)}
          whileHover={{ rotate: 30 }}
          whileTap={{ scale: 0.9 }}
          className={`${glassBtn} w-[38px] sm:w-[42px] !px-0 text-gold-deep dark:text-[#d6b877]`}
          title="الإعدادات"
        >
          <svg className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </motion.button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: "spring", damping: 24, stiffness: 320 }}
              className="absolute left-0 top-[calc(100%+12px)] z-20 flex min-w-[250px] flex-col rounded-2xl !border-[1.5px] !border-gold-deep/20 !bg-[#fdfbf7] py-3 shadow-[0_15px_40px_rgba(58,44,30,0.12)] backdrop-blur-md origin-top-left dark:!bg-[#1c1915] dark:!border-[#d6b877]/20"
            >
              <div className="px-2 mb-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => { onNavigateHome(); setDropdownOpen(false); }}
                  className="group flex w-full items-center justify-between rounded-xl !border-none !bg-gold-deep/10 px-4 py-3 text-right font-cairo text-[14px] font-extrabold text-gold-deep transition-colors hover:!bg-gold-deep/20 !shadow-none !outline-none dark:!bg-[#d6b877]/10 dark:text-[#d6b877] dark:hover:!bg-[#d6b877]/20"
                >
                  <span>العودة للأفخاذ الرئيسية</span>
                  <span className="text-xl transition-transform group-hover:-translate-x-1.5">⌂</span>
                </motion.button>
              </div>

              <div className="mx-5 my-2 h-[1px] bg-gradient-to-r from-transparent via-gold-deep/30 to-transparent dark:via-[#d6b877]/30" />

              <div className="flex flex-col max-h-[60vh] overflow-y-auto sidebar-scroll px-2 gap-0.5">
                {branches.map((branch, index) => (
                  <motion.button
                    key={branch.id}
                    type="button"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.25), duration: 0.2 }}
                    onClick={() => { onSelectBranch(branch.id); setDropdownOpen(false); }}
                    className="group relative flex w-full items-center justify-between rounded-xl !border-none !bg-transparent px-4 py-3 text-right font-cairo text-[14.5px] font-bold text-[#5c4a38] transition-colors hover:!bg-[#f4efe6] hover:text-gold-deep !shadow-none !outline-none dark:text-[#f3ede1] dark:hover:!bg-white/5 dark:hover:text-[#d6b877]"
                  >
                    <span className="relative z-10 transition-transform duration-300 group-hover:-translate-x-1.5">
                      {branch.label}
                    </span>
                    <span className="text-[14px] opacity-0 transition-all duration-300 group-hover:opacity-100 text-gold-deep dark:text-[#d6b877]">
                      ✦
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.button
            type="button"
            onClick={onToggleSidebar}
            initial={{ opacity: 0, scale: 0.8, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            // 🌟 تم تصغير الحواف وتوحيد المحاذاة (top-[14px]) ليصبح بموازاة الأزرار اليسرى تماماً
            className="fixed top-[14px] right-[8px] sm:right-[14px] z-50 rounded-[22px] bg-gold-deep px-3 sm:px-4 py-[9px] sm:py-2.5 text-[12.5px] sm:text-[13px] font-bold text-[#fff8ec] shadow-card min-[901px]:hidden"
          >
            ☰ الفهرس
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSettingsOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isSettingsOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="flex h-screen w-[320px] max-w-[85vw] flex-col overflow-hidden rounded-r-[32px] bg-[#fdfbf7]/95 p-6 shadow-[20px_0_40px_rgba(0,0,0,0.15)] backdrop-blur-2xl fixed top-0 left-0 z-50 dark:bg-[#161411]/95 dark:border-r dark:border-[#d6b877]/20 transition-colors duration-300 font-cairo"
      >
        <div className="mb-8 flex items-center justify-between border-b border-[#c9974f]/20 pb-4 dark:border-[#d6b877]/20">
          <h3 className="text-[20px] font-extrabold text-[#8a5f2e] m-0 dark:text-[#d6b877] flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            الإعدادات
          </h3>
          <motion.button
            type="button"
            onClick={() => setSettingsOpen(false)}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-white border border-[#c9974f]/30 text-gray-500 flex items-center justify-center text-sm font-bold shadow-sm hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-colors dark:bg-[#2b261f] dark:border-[#d6b877]/30 dark:text-gray-400 dark:hover:text-red-400"
          >
            ✕
          </motion.button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto sidebar-scroll pb-10 px-1">
          
          <div className="flex flex-col gap-3">
            <span className="text-[12px] font-bold text-[#c9974f] dark:text-[#d6b877]/70 uppercase tracking-widest px-1">المظهر والتصميم</span>
            
            <div className="flex items-center justify-between bg-white dark:bg-[#24201a] border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm transition-all hover:border-[#c9974f]/30">
              <span className="flex items-center gap-3 text-[14px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#c9974f]/10 text-[#8a5f2e] dark:bg-[#d6b877]/10 dark:text-[#d6b877]">
                  {isDarkMode ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>
                  )}
                </span>
                الوضع الليلي
              </span>
              <CustomToggle isOn={isDarkMode} onToggle={() => onToggleDarkMode?.()} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[12px] font-bold text-[#c9974f] dark:text-[#d6b877]/70 uppercase tracking-widest px-1">العرض والتفضيلات</span>
            
            <div className="flex items-center justify-between bg-white dark:bg-[#24201a] border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm transition-all hover:border-[#c9974f]/30">
              <span className="flex items-center gap-3 text-[14px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#c9974f]/10 text-[#8a5f2e] dark:bg-[#d6b877]/10 dark:text-[#d6b877]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </span>
                إظهار تواريخ الميلاد
              </span>
              <CustomToggle isOn={!!showDates} onToggle={() => setShowDates?.(!showDates)} />
            </div>

            <div className="flex items-center justify-between bg-white dark:bg-[#24201a] border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm transition-all hover:border-[#c9974f]/30">
              <span className="flex items-center gap-3 text-[14px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#c9974f]/10 text-[#8a5f2e] dark:bg-[#d6b877]/10 dark:text-[#d6b877]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </span>
                تقليل الحركات
              </span>
              <CustomToggle isOn={!!reduceAnimations} onToggle={() => setReduceAnimations?.(!reduceAnimations)} />
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-[#c9974f]/20 dark:border-[#d6b877]/20 text-center">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
            الإصدار 1.2.0 • شجرة عائلة القواسمي
          </p>
        </div>
      </motion.aside>
    </>
  );
}