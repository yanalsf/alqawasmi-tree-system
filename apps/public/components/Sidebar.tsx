// Sidebar.tsx
"use client";

import { useState, useMemo } from "react";

interface PersonObj {
  id: number;
  name: string;
  depth: number;
  father: string | null;
}

interface SidebarProps {
  people: PersonObj[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPerson: (id: number) => void;
}

export default function Sidebar({ people, isOpen, onClose, onSelectPerson }: SidebarProps) {
  const [search, setSearch] = useState("");

  // فلترة الأسماء بناءً على البحث
  const filtered = useMemo(() => {
    if (!search.trim()) return people;
    const q = search.trim().toLowerCase();
    return people.filter(p => p.name.toLowerCase().includes(q));
  }, [people, search]);

  return (
    <>
      {/* خلفية معتمة عند فتح الفهرس على الشاشات الصغيرة */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 min-[901px]:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      {/* قائمة الفهرس الجانبية */}
      <aside 
        className={`fixed top-0 right-0 z-[70] flex h-screen w-[320px] max-w-[85vw] flex-col bg-[#fbfaf8] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] transition-transform duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] dark:bg-panel-dark dark:border-l dark:border-gold/10
        ${isOpen ? "translate-x-0" : "translate-x-full min-[901px]:translate-x-0"}`}
      >
        
        {/* ستايل مخصص لشريط التمرير (Scrollbar) */}
        <style>{`
          .sidebar-scroll::-webkit-scrollbar { width: 5px; }
          .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
          .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(201, 151, 79, 0.5); border-radius: 10px; }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(138, 95, 46, 0.8); }
        `}</style>

        {/* الترويسة (Header) */}
        <div className="flex-none px-6 pt-8 pb-4 border-b border-gold-deep/10 bg-gradient-to-b from-white to-transparent">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[22px] font-extrabold text-[#8a5f2e] font-ruqaa m-0">فهرس الأسماء</h2>
            <button 
              onClick={onClose}
              className="min-[901px]:hidden grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* شريط البحث الاحترافي */}
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="ابحث عن اسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-white py-2.5 pr-10 pl-4 text-sm font-semibold text-ink outline-none transition-all placeholder:text-gray-400 focus:border-[#8a5f2e] focus:ring-2 focus:ring-[#8a5f2e]/20 shadow-sm"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="mt-3 text-left text-[12px] font-bold text-ink-soft/70">
            {filtered.length} اسماً
          </div>
        </div>

        {/* قائمة الأسماء (List) - تم تعديل الهوامش والمسافات هنا */}
        <div className="sidebar-scroll flex-1 overflow-y-auto px-6 py-4 space-y-3.5 pb-10">
          {filtered.length > 0 ? (
            filtered.map((person) => {
              // معالجة اسم الأب ليكون أنيقاً (استبدال System_Root بالجد)
              const isRoot = person.father === "System_Root" || !person.father;
              const fatherName = isRoot ? "الجد" : `ابن ${person.father?.replace('فخذ ', '')}`;

              return (
                <button
                  key={person.id}
                  onClick={() => {
                    onSelectPerson(person.id);
                    if (window.innerWidth <= 900) onClose(); // إغلاق الفهرس على الموبايل عند الاختيار
                  }}
                  className="group relative flex w-full flex-col items-start overflow-hidden rounded-xl bg-white p-4 shadow-sm border border-gold/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(138,95,46,0.12)] hover:border-gold-deep/30 text-right"
                >
                  {/* خط ديكور صغير على اليمين يظهر عند الـ Hover */}
                  <div className="absolute right-0 top-0 h-full w-1 bg-gold-deep/20 transition-all group-hover:bg-[#8a5f2e]" />
                  
                  <div className="flex w-full items-center justify-between">
                    <span className="font-bold text-[#1f3d1f] text-[15px] transition-colors group-hover:text-[#8a5f2e]">
                      {person.name.replace('فخذ ', '')}
                    </span>
                    {/* أيقونة شجرة صغيرة تعطي طابع أصيل */}
                    <span className="text-[11px] opacity-40 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0">🌿</span>
                  </div>
                  
                  <span className={`mt-1.5 text-[12px] font-semibold ${isRoot ? 'text-[#c9974f]' : 'text-gray-400'}`}>
                    {fatherName}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center opacity-60">
              <span className="text-3xl mb-2">🤷‍♂️</span>
              <p className="text-sm font-bold text-ink-soft">لم نجد اسماً يطابق بحثك</p>
            </div>
          )}
        </div>
        
      </aside>
    </>
  );
}