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
  isSidebarOpen?: boolean; // استقبال حالة الفهرس
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

        <div className={`absolute left-0 top-[calc(100%+8px)] z-20 flex min-w-[220px] flex-col gap-0.5 rounded-2xl border border-gold-deep/30 bg-panel p-2 shadow-[0_12px_28px_rgba(58,44,30,0.2)] transition-all duration-200 dark:bg-panel-dark ${isDropdownOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0"}`}>
          <button type="button" onClick={() => { onNavigateHome(); setDropdownOpen(false); }} className="w-full rounded-lg px-3 py-2 text-right font-cairo text-[13px] font-semibold text-ink hover:bg-green-1/20 dark:text-ink-dark">
            ⌂ العودة إلى صفحة الأفخاذ الرئيسية
          </button>
          <div className="my-1 h-px bg-gold-deep/20" />
          {branches.map((branch) => (
            <button key={branch.id} type="button" onClick={() => { onSelectBranch(branch.id); setDropdownOpen(false); }} className="w-full rounded-lg px-3 py-2 text-right font-cairo text-[13px] font-semibold text-ink hover:bg-green-1/20 dark:text-ink-dark">
              {branch.label}
            </button>
          ))}
        </div>
      </div>

      {/* زر الفهرس يختفي تماماً (hidden) فور فتح القائمة الجانبية */}
      {!isSidebarOpen && (
        <button type="button" onClick={onToggleSidebar} className="fixed top-[14px] right-[14px] z-50 rounded-[22px] bg-gold-deep px-4 py-2.5 text-[13px] font-bold text-[#fff8ec] shadow-card">
          ☰ الفهرس
        </button>
      )}

      <div onClick={() => setSettingsOpen(false)} className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${isSettingsOpen ? "block opacity-100" : "hidden opacity-0"}`} />
      
      <aside className={`fixed top-0 left-0 z-50 h-screen w-[300px] max-w-[85vw] bg-panel p-5 shadow-2xl transition-transform duration-300 dark:bg-panel-dark ${isSettingsOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-center justify-between border-b border-gold/10 pb-3">
          <h3 className="text-base font-extrabold text-gold-deep dark:text-gold-dark m-0">⚙️ الإعدادات</h3>
          <button type="button" onClick={() => setSettingsOpen(false)} className="w-8 h-8 rounded-full bg-paper border border-gold-deep/30 text-ink-soft flex items-center justify-center text-sm font-bold shadow-sm transition-all hover:bg-maroon hover:text-white">✕</button>
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