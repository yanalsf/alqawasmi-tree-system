// Header.tsx
"use client";

import { useEffect, useRef, useState } from "react";

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
      {/* العنوان وزر الإعدادات في أعلى اليسار */}
     <div ref={wrapRef} className="fixed top-[18px] left-[18px] z-[12] flex items-center gap-2">
        <span
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
          onClick={() => setDropdownOpen((v) => !v)}
          className="inline-block cursor-pointer select-none rounded-[20px] border border-gold-deep/30 bg-[rgba(255,253,248,0.85)] px-[18px] py-2 font-ruqaa text-[22px] font-bold text-gold-deep shadow-card transition hover:bg-[rgba(255,253,248,0.98)] hover:shadow-[0_10px_24px_rgba(138,95,46,0.25)] dark:bg-panel-dark/85 dark:text-gold-dark dark:shadow-card-dark max-[900px]:text-base max-[900px]:px-3.5 max-[900px]:py-1.5"
        >
          {title}
        </span>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-full border border-gold-deep/30 bg-[rgba(255,253,248,0.85)] text-lg shadow-card transition hover:bg-[rgba(255,253,248,0.98)] active:rotate-[25deg] dark:bg-panel-dark/85"
          title="الإعدادات"
        >
          ⚙️
        </button>

        {/* القائمة المنسدلة الفخمة (تم تعديلها بالكامل لحذف المربعات والحدود) */}
        <div className={`absolute left-0 top-[calc(100%+12px)] z-20 flex min-w-[250px] flex-col rounded-2xl !border !border-gold-deep/20 !bg-[#fdfbf7] py-3 shadow-[0_15px_40px_rgba(58,44,30,0.12)] backdrop-blur-md transition-all duration-300 dark:!bg-panel-dark/95 dark:!border-gold-dark/20 ${isDropdownOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"}`}>
          
          <div className="px-2 mb-1">
            <button 
              type="button" 
              onClick={() => { onNavigateHome(); setDropdownOpen(false); }} 
              className="group flex w-full items-center justify-between rounded-xl !border-none !bg-gold-deep/10 px-4 py-3 text-right font-cairo text-[14px] font-extrabold text-gold-deep transition-all duration-300 hover:!bg-gold-deep/20 dark:!bg-gold-dark/15 dark:text-gold-dark dark:hover:!bg-gold-dark/25 !shadow-none !outline-none"
            >
              <span>العودة للأفخاذ الرئيسية</span>
              <span className="text-xl transition-transform group-hover:-translate-x-1.5">⌂</span>
            </button>
          </div>
          
          <div className="mx-5 my-2 h-[1px] bg-gradient-to-r from-transparent via-gold-deep/30 to-transparent" />
          
          <div className="flex flex-col max-h-[60vh] overflow-y-auto sidebar-scroll px-2 gap-0.5">
            {branches.map((branch) => (
              <button 
                key={branch.id} 
                type="button" 
                onClick={() => { onSelectBranch(branch.id); setDropdownOpen(false); }} 
                className="group relative flex w-full items-center justify-between rounded-xl !border-none !bg-transparent px-4 py-3 text-right font-cairo text-[14.5px] font-bold text-[#5c4a38] transition-all duration-300 hover:!bg-[#f4efe6] hover:text-gold-deep dark:text-ink-dark dark:hover:!bg-white/5 dark:hover:text-gold-dark !shadow-none !outline-none"
              >
                <span className="relative z-10 transition-transform duration-300 group-hover:-translate-x-1.5">
                  {branch.label}
                </span>
                <span className="text-[14px] opacity-0 transition-all duration-300 group-hover:opacity-100 text-gold-deep">
                  ✦
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* زر الفهرس يظهر فقط عندما يكون الفهرس مغلقاً */}
      {!isSidebarOpen && (
        <button 
          type="button" 
          onClick={onToggleSidebar} 
          className="fixed top-[14px] right-[14px] z-50 rounded-[22px] bg-gold-deep px-4 py-2.5 text-[13px] font-bold text-[#fff8ec] shadow-card min-[901px]:hidden"
        >
          ☰ الفهرس
        </button>
      )}

      {/* خلفية معتمة عند فتح الإعدادات */}
      <div onClick={() => setSettingsOpen(false)} className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${isSettingsOpen ? "block opacity-100" : "hidden opacity-0"}`} />
      
      {/* قائمة الإعدادات الجانبية تفتح من اليسار بالشكل الصحيح والمنسق */}
      <aside className={`flex h-screen w-[300px] max-w-[85vw] bg-panel p-5 shadow-2xl transition-transform duration-300 dark:bg-panel-dark fixed top-0 left-0 z-50 flex-col ${isSettingsOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-center justify-between border-b border-gold/10 pb-3">
          <h3 className="text-base font-extrabold text-gold-deep dark:text-gold-dark m-0">⚙️ الإعدادات</h3>
          <button 
            type="button" 
            onClick={() => setSettingsOpen(false)} 
            className="w-8 h-8 rounded-full bg-paper border border-gold-deep/30 text-ink-soft flex items-center justify-center text-sm font-bold shadow-sm transition-all hover:bg-maroon hover:text-white hover:border-maroon hover:rotate-90"
          >
            ✕
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-ink dark:text-ink-dark font-bold">
            <span>{isDarkMode ? "🌙" : "☀️"}</span>
            <span>الوضع الليلي</span>
          </span>
          <label className="relative inline-block h-6 w-[46px] cursor-pointer">
            <input type="checkbox" checked={isDarkMode} onChange={onToggleDarkMode} className="peer absolute h-0 w-0 opacity-0" />
            <span className="absolute inset-0 rounded-full bg-ink-soft/30 transition-colors peer-checked:bg-gold-deep" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-[22px]" />
          </label>
        </div>
      </aside>
    </>
  );
}