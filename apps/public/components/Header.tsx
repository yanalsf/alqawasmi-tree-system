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
  // أضفنا الدالة الخاصة بفتح قائمة المزايا هنا
  onOpenFeatures: () => void; 
}

export default function Header({
  title = "عائلة القواسمي",
  branches,
  onNavigateHome,
  onSelectBranch,
  onToggleSidebar,
  isSidebarOpen = false,
  isDarkMode,
  onToggleDarkMode,
  onOpenFeatures, // استلمنا الدالة هنا
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

  return (
    <>
      {/* العنوان وزر الإعدادات وزر المزايا في أعلى اليسار */}
     <div ref={wrapRef} className="fixed top-[18px] left-[18px] z-[12] flex items-center gap-2">
        <motion.span
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
          onClick={() => setDropdownOpen((v) => !v)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-block cursor-pointer select-none rounded-[20px] border border-gold-deep/30 bg-[rgba(255,253,248,0.85)] px-[18px] py-2 font-ruqaa text-[22px] font-bold text-gold-deep shadow-card transition-colors hover:bg-[rgba(255,253,248,0.98)] hover:shadow-[0_10px_24px_rgba(138,95,46,0.25)] max-[900px]:text-base max-[900px]:px-3.5 max-[900px]:py-1.5 dark:bg-[#1c1915]/90 dark:text-[#d6b877] dark:shadow-card-dark dark:border-[#d6b877]/30"
        >
          {title}
        </motion.span>

        <motion.button
          type="button"
          onClick={() => setSettingsOpen(true)}
          whileHover={{ scale: 1.08, rotate: 20 }}
          whileTap={{ scale: 0.9 }}
          className="grid h-9 w-9 place-items-center rounded-full border border-gold-deep/30 bg-[rgba(255,253,248,0.85)] text-lg shadow-card dark:bg-[#1c1915]/90 dark:border-[#d6b877]/30"
          title="الإعدادات"
        >
          ⚙️
        </motion.button>

        {/* زر "المزيد" الجديد الذي يفتح قائمة المزايا */}
        <motion.button
          type="button"
          onClick={onOpenFeatures}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-9 items-center gap-1.5 rounded-full border border-gold-deep/30 bg-[rgba(255,253,248,0.85)] px-3 text-[13px] font-bold text-gold-deep shadow-card transition-colors hover:bg-gold-deep/10 dark:bg-[#1c1915]/90 dark:border-[#d6b877]/30 dark:text-[#d6b877] dark:hover:bg-[#d6b877]/10"
        >
          ✨ المزيد
        </motion.button>

        {/* القائمة المنسدلة الفخمة */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: "spring", damping: 24, stiffness: 320 }}
              className="absolute left-0 top-[calc(100%+12px)] z-20 flex min-w-[250px] flex-col rounded-2xl !border !border-gold-deep/20 !bg-[#fdfbf7] py-3 shadow-[0_15px_40px_rgba(58,44,30,0.12)] backdrop-blur-md origin-top-left dark:!bg-[#1c1915] dark:!border-[#d6b877]/20"
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

      {/* زر الفهرس يظهر فقط عندما يكون الفهرس مغلقاً */}
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
            className="fixed top-[14px] right-[14px] z-50 rounded-[22px] bg-gold-deep px-4 py-2.5 text-[13px] font-bold text-[#fff8ec] shadow-card min-[901px]:hidden"
          >
            ☰ الفهرس
          </motion.button>
        )}
      </AnimatePresence>

      {/* خلفية معتمة عند فتح الإعدادات */}
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

      {/* قائمة الإعدادات الجانبية تفتح من اليسار بالشكل الصحيح والمنسق */}
      <motion.aside
        initial={false}
        animate={{ x: isSettingsOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="flex h-screen w-[300px] max-w-[85vw] flex-col overflow-hidden rounded-r-[28px] bg-panel p-5 shadow-2xl fixed top-0 left-0 z-50 dark:bg-[#1c1915] dark:border-r dark:border-[#d6b877]/20 transition-colors duration-300"
      >
        <div className="mb-6 flex items-center justify-between border-b border-gold/10 pb-3 dark:border-[#d6b877]/10">
          <h3 className="text-base font-extrabold text-gold-deep m-0 dark:text-[#d6b877]">⚙️ الإعدادات</h3>
          <motion.button
            type="button"
            onClick={() => setSettingsOpen(false)}
            whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "#7a2e2e" }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-paper border border-gold-deep/30 text-ink-soft flex items-center justify-center text-sm font-bold shadow-sm hover:text-white hover:border-maroon transition-colors dark:bg-[#2b261f] dark:border-[#d6b877]/30 dark:text-[#f3ede1] dark:hover:text-white"
          >
            ✕
          </motion.button>
        </div>
        
        {/*
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-ink font-bold dark:text-[#f3ede1]">
            <motion.span
              key={isDarkMode ? "moon" : "sun"}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="inline-block"
            >
              {isDarkMode ? "🌙" : "☀️"}
            </motion.span>
            <span>الوضع الليلي</span>
          </span>
          <label className="relative inline-block h-6 w-[46px] cursor-pointer">
            <input type="checkbox" checked={isDarkMode} onChange={onToggleDarkMode} className="peer absolute h-0 w-0 opacity-0" />
            <span className="absolute inset-0 rounded-full bg-ink-soft/30 transition-colors peer-checked:bg-gold-deep dark:bg-[#3a352d] dark:peer-checked:bg-[#8a5f2e]" />
            <motion.span
              layout
              animate={{ x: isDarkMode ? 22 : 2 }}
              transition={{ type: "spring", damping: 20, stiffness: 400 }}
              className="absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm dark:bg-[#f3ede1]"
            />
          </label>
        </div>*/}
      </motion.aside>
    </>
  );
}