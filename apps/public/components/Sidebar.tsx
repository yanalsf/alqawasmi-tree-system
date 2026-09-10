// apps/public/components/Sidebar.tsx
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

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

// 1. إعدادات حركة الحاوية (عشان تخلي الأبناء يظهروا ورا بعض)
const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // التوقيت بين كل اسم واسم (كل ما زاد بصير أبطأ)
    },
  },
};

// 2. إعدادات حركة الاسم الواحد (دخول ناعم من اليمين)
const itemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.4, ease: "easeOut" } 
  },
};

export default function Sidebar({ people, isOpen, onClose, onSelectPerson }: SidebarProps) {
  const [search, setSearch] = useState("");

  // دالة تنظيف النصوص لتجاهل الهمزات والتشكيل
  const normalizeArabic = (text: string) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[\u064b-\u065f]/g, "")
      .replace(/[إأآا]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/\s+/g, " ")
      .trim();
  };

  const { displayed, totalCount } = useMemo(() => {
    let result = people;
    if (search.trim()) {
      // 1. نقسم البحث لكلمات منفصلة
      const searchKeywords = normalizeArabic(search).split(" ").filter(word => word.length > 0);
      
      result = people.filter(p => {
        const cleanName = normalizeArabic(p.name);
        
        // 2. الشرط الأساسي: الكلمة الأولى من البحث يجب أن تكون في بداية اسم الشخص نفسه
        if (!cleanName.startsWith(searchKeywords[0])) {
          return false;
        }

        // 3. إذا كان البحث كلمة واحدة فقط ونجح بالشرط، نعرضه
        if (searchKeywords.length === 1) {
          return true;
        }

        // 4. دمج اسم الشخص مع اسم أبوه
        const fatherObj = p.father ? people.find(item => item.name === p.father) : null;
        const fatherName = fatherObj ? normalizeArabic(fatherObj.name) : (p.father ? normalizeArabic(p.father) : "");
        
        // السر الجديد هون: نقسم الاسم الكامل (الابن + الأب) إلى كلمات منفصلة
        const contextWords = `${cleanName} ${fatherName}`.split(" ").filter(w => w.length > 0);

        // نتأكد إن *كل* كلمة كتبها المستخدم في البحث، يوجد ما يطابق "بدايتها" في كلمات الاسم أو الأب
        return searchKeywords.every(keyword => 
          contextWords.some(word => word.startsWith(keyword))
        );
      });
    }
    return {
      displayed: result.slice(0, 50), // نحدد العرض بـ 50 نتيجة للحفاظ على الأداء
      totalCount: result.length
    };
  }, [people, search]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm min-[901px]:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 z-[70] flex h-screen w-[320px] max-w-[85vw] flex-col overflow-hidden rounded-l-[28px] bg-[#fbfaf8] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] dark:bg-[#1c1915] dark:border-l dark:border-[#d6b877]/20 min-[901px]:!translate-x-0 transition-colors duration-300"
      >
        
        <style>{`
          .sidebar-scroll::-webkit-scrollbar { width: 5px; }
          .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
          .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(201, 151, 79, 0.5); border-radius: 10px; }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(138, 95, 46, 0.8); }
        `}</style>

        <div className="flex-none px-6 pt-8 pb-4 border-b border-gold-deep/10 bg-gradient-to-b from-white to-transparent dark:from-[#1c1915] dark:border-[#d6b877]/10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[22px] font-extrabold text-[#8a5f2e] dark:text-[#d6b877] font-ruqaa m-0">فهرس الأسماء</h2>
            <button 
              onClick={onClose}
              className="min-[901px]:hidden grid h-8 w-8 place-items-center rounded-full bg-gray-100 dark:bg-[#2b261f] text-gray-500 dark:text-[#d6b877] hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 dark:text-gray-500"><svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  strokeWidth="2.5" 
  strokeLinecap="round" 
  strokeLinejoin="round" 
  className="text-gray-400 dark:text-gray-500"
>
  <circle cx="11" cy="11" r="8"></circle>
  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
</svg></span>
            <input
              type="text"
              placeholder="ابحث عن اسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-white py-2.5 pr-10 pl-4 text-sm font-semibold text-ink outline-none transition-all placeholder:text-gray-400 focus:border-[#8a5f2e] focus:ring-2 focus:ring-[#8a5f2e]/20 shadow-sm dark:border-[#d6b877]/20 dark:bg-[#2b261f] dark:text-[#f3ede1] dark:placeholder:text-gray-500 dark:focus:border-[#d6b877] dark:focus:ring-[#d6b877]/20"
            />
           {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-[#2b261f] dark:hover:bg-[#383129] text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs font-bold transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="mt-3 text-left text-[12px] font-bold text-ink-soft/70 dark:text-gray-400 transition-all duration-300">
            {totalCount} اسماً {totalCount > 50 ? "(يتم عرض أول 50)" : ""}
          </div>
        </div>

        <div className="sidebar-scroll flex-1 overflow-y-auto px-6 py-4 pb-10">
          {displayed.length > 0 ? (
            /* الحاوية السحرية اللي بتشغل تتابع الأسماء عند كل عملية بحث */
            <motion.div
              key={search} 
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3.5"
            >
              {displayed.map((person) => {
                const isRoot = person.father === "System_Root" || !person.father;
                const fatherName = isRoot ? "الجد" : `ابن ${person.father?.replace('فخذ ', '')}`;

                return (
                  <motion.button
                    key={person.id}
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      onSelectPerson(person.id);
                      if (window.innerWidth <= 900) onClose();
                    }}
                    className="group relative flex w-full flex-col items-start overflow-hidden rounded-xl bg-white dark:bg-[#24201a] p-4 shadow-sm border border-gold/10 hover:shadow-[0_6px_15px_rgba(138,95,46,0.12)] hover:border-gold-deep/30 dark:border-[#d6b877]/10 dark:hover:shadow-[0_6px_15px_rgba(0,0,0,0.3)] dark:hover:border-[#d6b877]/40 text-right transition-colors"
                  >
                    <div className="absolute right-0 top-0 h-full w-1 bg-gold-deep/20 transition-all group-hover:bg-[#8a5f2e] dark:bg-[#d6b877]/10 dark:group-hover:bg-[#d6b877]" />

                    <div className="flex w-full items-center justify-between">
                      <span className="font-bold text-[#1f3d1f] text-[15px] transition-colors group-hover:text-[#8a5f2e] dark:text-[#f3ede1] dark:group-hover:text-[#d6b877]">
                        {person.name.replace('فخذ ', '')}
                      </span>
                      <span className="text-[11px] opacity-40 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0">🌿</span>
                    </div>

                    <span className={`mt-1.5 text-[12px] font-semibold ${isRoot ? 'text-[#c9974f] dark:text-[#d6b877]' : 'text-gray-400 dark:text-[#9a8c78]'}`}>
                      {fatherName}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-40 text-center opacity-60"
            >
              <motion.span animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }} className="text-3xl mb-2 inline-block">🤷‍♂️</motion.span>
              <p className="text-sm font-bold text-ink-soft dark:text-gray-400">لم نجد اسماً يطابق بحثك</p>
            </motion.div>
          )}
        </div>       
      </motion.aside>
    </>
  );
}