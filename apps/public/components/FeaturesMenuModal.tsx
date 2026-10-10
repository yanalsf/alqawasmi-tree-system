"use client";

import { motion, AnimatePresence } from "framer-motion";

interface FeaturesMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKinship?: () => void;
  onOpenStats?: () => void;
  onOpenEditRequest?: () => void;
  onOpenAddMember?: () => void;
  onOpenAbout?: () => void; 
  onOpenComplaints?: () => void;
  onOpenPoster?: () => void; // 🌟 الخاصية الجديدة لفتح نافذة البوستر
}

export default function FeaturesMenuModal({
  isOpen,
  onClose,
  onOpenKinship,
  onOpenStats,
  onOpenEditRequest,
  onOpenAddMember,
  onOpenAbout,
  onOpenComplaints,
  onOpenPoster,
}: FeaturesMenuModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#fdfbf7] border border-[#c9974f]/30 p-8 shadow-2xl text-center dark:bg-[#1c1915] dark:border-[#d6b877]/20"
          >
            <button 
              onClick={onClose} 
              className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border-none outline-none focus:outline-none focus:ring-0 dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            >
              ✕
            </button>

            <div className="mb-6">
              <span className="text-4xl mb-3 block opacity-90">🌳</span>
              <h2 className="text-2xl font-bold text-[#8a5f2e] font-ruqaa mb-1 dark:text-[#d6b877]">والمزيد من</h2>
              <h2 className="text-3xl font-bold text-[#8a5f2e] font-ruqaa dark:text-[#d6b877]">المزايا</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FeatureButton title="كاشف القرابة" onClick={onOpenKinship} />
              <FeatureButton title="الإحصائيات" onClick={onOpenStats} />
              <FeatureButton title="نبذة عن العائلة" onClick={onOpenAbout} />
              <FeatureButton title="طلب إضافة فرد" onClick={onOpenAddMember} />
              <FeatureButton title="طلبات التعديل" onClick={onOpenEditRequest} />
              <FeatureButton title="الشكاوى" onClick={onOpenComplaints} />

              {/* 🌟 زر طباعة بوستر الفخذ (يمتد على كامل العرض بلمسة مميزة) */}
              <div className="col-span-2 mt-1">
                <button
                  onClick={onOpenPoster}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#c9974f]/50 bg-[#c9974f]/10 text-[13.5px] font-extrabold text-[#8a5f2e] shadow-sm transition-all hover:bg-[#c9974f]/20 hover:border-[#c9974f]/80 active:scale-95 dark:border-[#d6b877]/40 dark:bg-[#d6b877]/10 dark:text-[#d6b877] dark:hover:bg-[#d6b877]/20"
                >
                  <span>🖨️</span>
                  <span>طباعة بوستر الفخذ (svg)</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function FeatureButton({ title, onClick }: { title: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center rounded-2xl border border-[#c9974f]/40 bg-[#c9974f]/5 text-[13px] font-bold text-[#8a5f2e] transition-all hover:bg-[#c9974f]/15 hover:border-[#c9974f]/60 active:scale-95 dark:border-[#d6b877]/30 dark:bg-[#d6b877]/5 dark:text-[#d6b877] dark:hover:bg-[#d6b877]/10"
    >
      {title}
    </button>
  );
}