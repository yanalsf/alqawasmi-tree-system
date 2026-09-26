"use client";

import { motion, AnimatePresence } from "framer-motion";

interface FamilyAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FamilyAboutModal({ isOpen, onClose }: FamilyAboutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden rounded-3xl bg-[#fdfbf7] border border-[#c9974f]/30 shadow-2xl dark:bg-[#1c1915] dark:border-[#d6b877]/20"
          >
            {/* الجزء العلوي الثابت */}
            <div className="relative pt-6 pb-2 shrink-0 z-10 bg-[#fdfbf7] dark:bg-[#1c1915] rounded-t-3xl border-b border-[#c9974f]/10 dark:border-[#d6b877]/10 px-6">
              <button onClick={onClose} className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border-none outline-none focus:outline-none focus:ring-0 dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30">✕</button>
              
              <div className="text-center mb-2">
                <span className="text-3xl mb-1 block">📜</span>
                <h2 className="text-2xl font-bold text-[#8a5f2e] font-ruqaa dark:text-[#d6b877]">نبذة عن تاريخ العائلة</h2>
              </div>
            </div>

            {/* محتوى النبذة التاريخية (قابل للتمرير) */}
            <div className="p-6 overflow-y-auto sidebar-scroll space-y-4 text-right font-cairo">
              
              <div className="bg-gradient-to-l from-[#c9974f]/10 to-transparent p-4 rounded-2xl border-r-4 border-[#8a5f2e] dark:from-[#d6b877]/10 dark:border-[#d6b877]">
                <h3 className="text-[15px] font-extrabold text-[#5c4a38] dark:text-[#f3ede1] mb-1">الجذور والأصل الشريف</h3>
                <p className="text-[13.5px] text-gray-600 dark:text-gray-300 leading-relaxed m-0">
                  تنتسب عائلة القواسمي في جذورها التاريخية العريقة إلى الجد الأكبر <span className="font-bold text-[#8a5f2e] dark:text-[#d6b877]">أبي القاسم الجنيدي البغدادي</span> (نسبة إلى الإمام الصوفي الشهير الجنيد البغدادي)، وتُصنف العائلة ضمن السادة الأشراف الحسينيين الهاشميين.
                </p>
              </div>

              <div className="bg-white dark:bg-[#24201a] p-4 rounded-2xl border border-[#c9974f]/20 dark:border-[#d6b877]/20 shadow-sm">
                <h3 className="text-[14px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-2">الامتداد الجغرافي والاجتماعي</h3>
                <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed m-0">
                  استقر أساس العائلة التاريخي الكبير في محافظة الخليل بفلسطين (وتحديداً امتدت فروعها إلى مناطق وقرى مجاورة مثل بركوسيا)، ومنها انشرق أبناؤها وتوزعوا عبر التاريخ في دول عربية عديدة كالأردن وسوريا والعراق ولبنان، لتبقَى روابط الدم والنسب تجمعهم. وعرفت العائلة عبر تاريخها بأنها عشيرة علم ودين وتصوف واشتمال على القيم الرفيعة.
                </p>
              </div>

              <div className="bg-white dark:bg-[#24201a] p-4 rounded-2xl border border-[#c9974f]/20 dark:border-[#d6b877]/20 shadow-sm">
                <h3 className="text-[14px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-2">المسيرة الوطنية والجهادية</h3>
                <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed m-0">
                  سطّر أبناء العائلة تاريخاً ناصعاً في مقاومة الاحتلال والدفاع عن الأرض، وقدمت العائلة عبر محطات النضال المختلفة عشرات الشهداء والقادة والأسرى، مما جعلها رمزاً للصمود والتضحية.
                </p>
              </div>

              <div className="bg-white dark:bg-[#24201a] p-4 rounded-2xl border border-[#c9974f]/20 dark:border-[#d6b877]/20 shadow-sm">
                <h3 className="text-[14px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-2">هدف الشجرة الرقمية</h3>
                <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed m-0">
                  تم تصميم هذه المنصة الرقمية لتوثيق فروع عائلة القواسمي وأبنائها، لتكون مرجعاً دقيقاً وسهلاً للأجيال القادمة، وصلة وصل دائم بين أبناء العائلة في كل مكان.
                </p>
              </div>

              <div className="text-center pt-2">
                <p className="text-[12px] text-gray-400 dark:text-gray-500 font-semibold m-0">
                  « يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَاكُمْ شُعُوباً وَقَبَائِلَ لِتَعَارَفُوا »
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}