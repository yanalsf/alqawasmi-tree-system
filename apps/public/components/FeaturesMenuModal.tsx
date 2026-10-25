// components/FeaturesMenuModal.tsx
"use client";

import { useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import { useT } from "../lib/i18n";
interface FeaturesMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKinship?: () => void;
  onOpenStats?: () => void;
  onOpenEditRequest?: () => void;
  onOpenAddMember?: () => void;
  onOpenAbout?: () => void;
  onOpenComplaints?: () => void;
  onOpenPoster?: () => void;
  onOpenSupervisors?: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", damping: 22, stiffness: 300 },
  },
};

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
  onOpenSupervisors,
}: FeaturesMenuModalProps) {
  const { t } = useT();
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const features = [
    {
      title: t("كاشف القرابة"),
      subtitle: t("اعرف صلة النسب بين شخصين"),
      icon: "🧬",
      onClick: onOpenKinship,
      accent: "from-amber-500/15 to-transparent",
    },
    {
      title: t("الإحصائيات"),
      subtitle: t("أرقام وأجيال الشجرة"),
      icon: "📊",
      onClick: onOpenStats,
      accent: "from-emerald-500/15 to-transparent",
    },
    {
      title: t("نبذة عن العائلة"),
      subtitle: t("تاريخ وجذور القواسمي"),
      icon: "📜",
      onClick: onOpenAbout,
      accent: "from-yellow-600/15 to-transparent",
    },
    {
      title: t("طلب إضافة فرد"),
      subtitle: t("تسجيل مولود أو فرع جديد"),
      icon: "👤",
      onClick: onOpenAddMember,
      accent: "from-teal-500/15 to-transparent",
    },
    {
      title: t("طلبات التعديل"),
      subtitle: t("تصحيح اسم أو تاريخ"),
      icon: "✏️",
      onClick: onOpenEditRequest,
      accent: "from-blue-500/15 to-transparent",
    },
    {
      title: t("الشكاوى والمقترحات"),
      subtitle: t("تواصل مع إدارة الشجرة"),
      icon: "💬",
      onClick: onOpenComplaints,
      accent: "from-rose-500/15 to-transparent",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-cairo">
          {/* خلفية زجاجية معتمة */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="cursor-pointer absolute inset-0 bg-black/50 backdrop-blur-md"
          />

          {/* البطاقة الرئيسية */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-[rgb(var(--b-mid-rgb)/0.35)] bg-[#fdfbf7] p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.25)] text-center dark:bg-[#191612] dark:border-[rgb(var(--b-lite-rgb)/0.25)] max-h-[92vh] overflow-y-auto sidebar-scroll"
          >
            {/* هالة إضاءة علوية */}
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-64 rounded-full bg-[rgb(var(--b-mid-rgb)/0.2)] blur-3xl dark:bg-[rgb(var(--b-lite-rgb)/0.1)]" />

            {/* زر الإغلاق */}
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="cursor-pointer absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--b-mid-rgb)/0.25)] bg-white text-gray-500 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-colors outline-none dark:bg-[#25211b] dark:border-[rgb(var(--b-lite-rgb)/0.2)] dark:text-gray-400 dark:hover:text-red-400"
              aria-label={t("إغلاق")}
            >
              ✕
            </motion.button>

            {/* الترويسة */}
            <div className="relative z-10 mb-6 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.5, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.05 }}
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgb(var(--b-mid-rgb)/0.3)] bg-gradient-to-br from-white via-[#fdfbf7] to-[#f3e6ce] text-3xl shadow-[0_8px_20px_rgba(138,95,46,0.12)] dark:border-[rgb(var(--b-lite-rgb)/0.25)] dark:from-[#2b261f] dark:to-[#1a1713]"
              >
                🌳
              </motion.div>

              <span className="text-[11px] font-extrabold tracking-widest text-[rgb(var(--b-mid-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/0.8)] uppercase">
                
                {t("الخدمات الإلكترونية")}
              </span>
              <h2 className="mt-0.5 text-3xl font-bold text-[rgb(var(--b-deep-rgb)/1)] font-ruqaa dark:text-[rgb(var(--b-lite-rgb)/1)]">
                
                {t("مزايا وخدمات الشجرة")}
              </h2>
            </div>

            {/* شبكة الأزرار التفاعلية */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="relative z-10 grid grid-cols-2 gap-3"
            >
              {features.map((item) => (
                <motion.button
                  key={item.title}
                  type="button"
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={item.onClick}
                  className="cursor-pointer group relative flex flex-col items-start justify-between overflow-hidden rounded-2xl border border-[rgb(var(--b-mid-rgb)/0.25)] bg-white p-3.5 text-right shadow-[0_4px_14px_rgba(138,95,46,0.05)] transition-all hover:border-[rgb(var(--b-deep-rgb)/0.6)] hover:shadow-[0_12px_24px_rgba(138,95,46,0.14)] dark:border-[rgb(var(--b-lite-rgb)/0.15)] dark:bg-[#231f1a] dark:hover:border-[rgb(var(--b-lite-rgb)/0.55)]"
                >
                  {/* تدرج لوني خفيف بالخلفية عند التمرير */}
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />

                  <div className="relative z-10 flex w-full items-center justify-between mb-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fdf8ef] border border-[rgb(var(--b-mid-rgb)/0.2)] text-xl shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 dark:bg-[#191612] dark:border-[rgb(var(--b-lite-rgb)/0.15)]">
                      {item.icon}
                    </span>
                    <span className="text-xs font-bold text-[rgb(var(--b-mid-rgb)/1)] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 dark:text-[rgb(var(--b-lite-rgb)/1)]">
                      ⟵
                    </span>
                  </div>

                  <div className="relative z-10">
                    <div className="text-[13.5px] font-extrabold text-[#5c4a38] group-hover:text-[rgb(var(--b-deep-rgb)/1)] transition-colors dark:text-[#f3ede1] dark:group-hover:text-[rgb(var(--b-lite-rgb)/1)]">
                      {item.title}
                    </div>
                    <div className="mt-0.5 text-[10.5px] font-semibold text-gray-400 dark:text-[#9a8c78] line-clamp-1">
                      {item.subtitle}
                    </div>
                  </div>
                </motion.button>
              ))}

              {/* بطاقة مشرفي الموقع */}
              <motion.div variants={itemVariants} className="col-span-2">
                <motion.button
                  type="button"
                  onClick={onOpenSupervisors}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-[rgb(var(--b-mid-rgb)/0.3)] bg-white p-3.5 text-start shadow-[0_4px_14px_rgba(138,95,46,0.05)] transition-all duration-300 hover:border-[rgb(var(--b-mid-rgb)/0.7)] dark:border-[rgb(var(--b-lite-rgb)/0.2)] dark:bg-[#24201a]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative z-10 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--b-mid-rgb)/0.2)] bg-[#fdf8ef] text-xl shadow-inner dark:bg-[#1c1915]">🛡️</span>
                    <div>
                      <div className="text-[13.5px] font-extrabold text-[#5c4a38] transition-colors group-hover:text-[rgb(var(--b-deep-rgb)/1)] dark:text-[#f3ede1]">{t("مشرفو الموقع")}</div>
                      <div className="mt-0.5 text-[10.5px] font-semibold text-gray-400 dark:text-[#9a8c78]">{t("فريق تدقيق البيانات وأرقام التواصل")}</div>
                    </div>
                  </div>
                  <span className="relative z-10 text-xs font-bold text-[rgb(var(--b-mid-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)]">⟵</span>
                </motion.button>
              </motion.div>

              {/* زر طباعة بوستر الفخذ المميز */}
              <motion.div variants={itemVariants} className="col-span-2 mt-1">
                <motion.button
                  type="button"
                  onClick={onOpenPoster}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-[rgb(var(--b-deep-rgb)/0.4)] bg-gradient-to-l from-[rgb(var(--b-deep-rgb)/1)] via-[#a6763b] to-[rgb(var(--b-mid-rgb)/1)] p-4 text-right text-white shadow-[0_10px_25px_rgba(138,95,46,0.28)] transition-all hover:shadow-[0_15px_32px_rgba(138,95,46,0.4)] dark:border-[rgb(var(--b-lite-rgb)/0.4)] dark:from-[#243d21] dark:via-[rgb(var(--b-ink-rgb)/1)] dark:to-[#1f351c]"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                      🖨️
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-extrabold text-white dark:text-[#f3ede1]">
                        
                        {t("طباعة بوستر الفخذ")}
                      </span>
                      <span className="text-[11px] font-semibold text-white/85 dark:text-[rgb(var(--b-lite-rgb)/0.9)]">
                        
                        {t("تصميم جداري قابل للطباعة والتحميل (PDF / PNG / SVG)")}
                      </span>
                    </div>
                  </div>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white transition-transform duration-300 group-hover:-translate-x-1">
                    ⟵
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}