"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useT } from "../lib/i18n";
export default function IosInstallPrompt() {
  const { t } = useT();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. فحص إذا كان الجهاز آيفون أو آيباد
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    
    // 2. فحص إذا كان التطبيق مثبت مسبقاً (Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone);
    
    // 3. فحص إذا كان المستخدم قد أغلق الرسالة سابقاً
    const isDismissed = localStorage.getItem('ios_prompt_dismissed');

    if (isIos && !isStandalone && !isDismissed) {
      // تأخير بسيط لمدة ثانيتين ونص عشان ما تزعجه أول ما يفتح الموقع
      setTimeout(() => setShowPrompt(true), 2500);
    }
  }, []);

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem('ios_prompt_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] flex flex-col gap-3 rounded-3xl border-[1.5px] border-[#c9974f]/30 bg-[#fdfbf7] p-5 shadow-[0_15px_40px_rgba(138,95,46,0.2)] dark:border-[#d6b877]/30 dark:bg-[#1c1915] dark:shadow-[0_15px_40px_rgba(0,0,0,0.5)] font-cairo"
        >
          <button
            onClick={handleClose}
            className="cursor-pointer absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-gray-200/60 text-gray-500 hover:bg-gray-300 dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30 transition-colors"
          >
            ✕
          </button>
          
          <h3 className="text-[18px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-1 font-ruqaa">
            
            {t("ثبّت التطبيق على جهازك")}
          </h3>
          
          <p className="text-[13px] font-bold text-[#5c4a38] dark:text-[#f3ede1] leading-relaxed">
            
            {t("للوصول السريع لشجرة العائلة في أي وقت، قم بتثبيت التطبيق على شاشة الآيفون:")}
          </p>
          
          <ol className="flex flex-col gap-2.5 mt-2 text-[13px] font-semibold text-[#5c4a38] dark:text-gray-300">
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              </span>
              <span>{t("1. اضغط على زر")} <strong>{t("المشاركة")}</strong>  {t("في أسفل شاشة المتصفح.")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-[#2b261f] text-gray-700 dark:text-gray-200 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
              </span>
              <span>{t("2. اختر")} <strong>{t("إضافة إلى الشاشة الرئيسية")}</strong> (Add to Home Screen).</span>
            </li>
          </ol>
        </motion.div>
      )}
    </AnimatePresence>
  );
}