// Sidebar.tsx
"use client";

import { useMemo, useState } from "react";

export interface FlatPerson {
  id: number;
  name: string;
  depth: number;
  father: string | null;
}

interface SidebarProps {
  people: FlatPerson[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPerson: (id: number) => void;
}

export default function Sidebar({ people, isOpen, onClose, onSelectPerson }: SidebarProps) {
  const [query, setQuery] = useState("");

  const visiblePeople = useMemo(() => {
    const q = query.trim();
    if (!q) return people;
    return people.filter((p) => p.name.includes(q));
  }, [people, query]);

  function handleSelect(id: number) {
    onSelectPerson(id);
    if (typeof window !== "undefined" && window.innerWidth <= 900) onClose();
  }

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-[rgba(58,44,30,0.35)] backdrop-blur-[2px] transition-opacity min-[901px]:hidden ${isOpen ? "block opacity-100" : "hidden opacity-0"}`} />
      
      <aside className={`flex h-screen w-[280px] flex-none flex-col overflow-hidden border-l border-gold-deep/25 bg-panel p-5 dark:bg-panel-dark dark:border-gold-deep-dark/25 max-[900px]:fixed max-[900px]:right-0 max-[900px]:top-0 max-[900px]:z-[60] max-[900px]:w-[80vw] max-[900px]:max-w-[320px] max-[900px]:shadow-[-10px_0_30px_rgba(0,0,0,0.2)] max-[900px]:transition-transform max-[900px]:duration-300 ${isOpen ? "max-[900px]:translate-x-0" : "max-[900px]:translate-x-full"}`}>
        
        <div className="mb-3.5 flex items-center justify-between border-b border-gold/10 pb-3">
          <h2 className="m-0 text-base font-extrabold text-gold-deep dark:text-gold-dark">فهرس الأسماء</h2>
          
          {/* زر الإغلاق الجديد (دائري، أنيق، ومتحرك) */}
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-paper border border-gold-deep/30 text-ink-soft flex items-center justify-center text-sm font-bold shadow-sm transition-all hover:bg-maroon hover:text-white hover:border-maroon hover:rotate-90"
            title="إغلاق الفهرس"
          >
            ✕
          </button>
        </div>

        <div className="relative mb-2.5">
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="ابحث عن اسم..." 
            className="w-full rounded-[22px] border-[1.5px] border-gold-deep/35 bg-paper py-2.5 pr-3.5 pl-9 text-[13.5px] text-ink outline-none focus:border-maroon dark:bg-paper-dark dark:text-ink-dark shadow-inner" 
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-soft">⌕</span>
        </div>

        <div className="mb-2 px-1 text-[11.5px] text-ink-soft font-semibold">{visiblePeople.length} اسمًا</div>
        
        <ul className="m-0 flex-1 list-none overflow-y-auto p-0 [scroll-behavior:smooth] custom-scrollbar">
          {visiblePeople.map((person) => (
            <li key={person.id} className="mb-0.5 overflow-hidden">
              <button 
                type="button" 
                onClick={() => handleSelect(person.id)} 
                style={{ paddingInlineStart: 10 + person.depth * 10 }} 
                className="flex w-full flex-col items-start gap-px rounded-[10px] px-2.5 py-[7px] text-right text-[13px] text-ink transition-colors hover:bg-green-1/15 dark:text-ink-dark"
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-[5px] w-[5px] flex-none rounded-full bg-green-2" style={{ opacity: Math.max(0.25, 1 - person.depth * 0.18) }} />
                  <span>{person.name}</span>
                </span>
                {person.father && <span className="mr-[17px] -mt-0.5 block text-[10px] opacity-65">ابن {person.father}</span>}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}