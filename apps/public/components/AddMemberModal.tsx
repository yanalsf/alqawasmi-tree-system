"use client";
 
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
 
import { useT } from "../lib/i18n";
interface AddMemberModalProps {
  onClose: () => void;
}
 
export default function AddMemberModal({ onClose }: AddMemberModalProps) {
  const { t } = useT();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+962");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");
  const [branch, setBranch] = useState("");
  const [location, setLocation] = useState("");
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [childrenList, setChildrenList] = useState<{ id: number; name: string; birthYear: string; deathYear: string }[]>([]);
  // رقم ثابت لكل ابن حتى تشتغل حركة الحذف على البطاقة الصحيحة (مو على آخر بطاقة)
  const childIdRef = useRef(0);
  const addChild = () => {
    const id = ++childIdRef.current;
    setChildrenList((prev) => [...prev, { id, name: "", birthYear: "", deathYear: "" }]);
  };
  const removeChild = (id: number) => setChildrenList((prev) => prev.filter((c) => c.id !== id));
 
  // قيم ثابتة بالعربي (هي اللي تُرسل لـ Netlify)؛ الترجمة للعرض فقط حتى يضل التقسيم حسب الفخذ سليم
  const branchList = [
    "فخذ داوود", "فخذ ابو نواره", "فخذ الصوص", "فخذ عبدالله",
    "فخذ الجدع", "فخذ محمد سليمان", "فخذ يونس", "فخذ بدوي",
    "فخذ محمد علي", "فخذ ابو بيض", "فخذ خضير", "فخذ عبد الحق"
  ];
 
  // 🌟 إخفاء مؤقت لبعض الأفخاذ من القائمة (بدون حذفها من branchList).
  // لإعادة إظهار فخذ معيّن: ضيف اسمه بالضبط لهاي المصفوفة.
  // لإعادة إظهار الكل: خليها VISIBLE_BRANCH_NAMES = branchList
  const VISIBLE_BRANCH_NAMES = branchList;
  const visibleBranchList = branchList.filter((item) => VISIBLE_BRANCH_NAMES.includes(item));
 
  const handleNoEnglishInput = (value: string, setter: (val: string) => void) => {
    if (/[a-zA-Z]/.test(value)) {
      setter(value.replace(/[a-zA-Z]/g, ''));
      setErrorMsg(t("عذراً، ممنوع استخدام الحروف الإنجليزية!"));
    } else {
      setErrorMsg("");
      setter(value);
    }
  };
 
  const validatePersonData = (personName: string, bYear: string, dYear: string) => {
    if (!personName) return t("الاسم مطلوب (ممنوع تركه فارغاً).");
    if (!bYear) return t("سنة الولادة مطلوبة (ممنوع تركها فارغة).");
    
    const arabicRegex = /^[\u0600-\u06FF\s]+$/;
    if (!arabicRegex.test(personName)) {
      return t("الاسم يجب أن يكون باللغة العربية فقط وممنوع الإنجليزي أو الرموز.");
    }
 
    const wordCount = personName.trim().split(/\s+/).length;
    if (wordCount < 5) {
      return t("يجب إدخال الاسم الخماسي (5 مقاطع على الأقل).");
    }
 
    if (bYear && dYear) {
      if (parseInt(dYear) < parseInt(bYear)) {
        return t("منطقياً، سنة الوفاة لا يمكن أن تكون قبل سنة الولادة!");
      }
    }
    return null; 
  };
 
  const updateChild = (index: number, field: string, value: string) => {
    const updated = [...childrenList];
    
    if (field === "name" && /[a-zA-Z]/.test(value)) {
      updated[index] = { ...updated[index], [field]: value.replace(/[a-zA-Z]/g, '') };
      setErrorMsg(t("عذراً، ممنوع استخدام الحروف الإنجليزية!"));
    } else {
      setErrorMsg("");
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setChildrenList(updated);
  };
 
  const handleSubmit = async () => {
    const parentError = validatePersonData(parentName, birthYear, deathYear);
    if (parentError) {
      setErrorMsg(t("خطأ في بيانات الأب: ") + parentError);
      return;
    }
    if (!phone.trim()) {
      setErrorMsg(t("رقم الهاتف مطلوب للتواصل وتدقيق الطلب!"));
      return;
    }
    if (!/^[0-9]{9}$/.test(phone.trim())) {
      setErrorMsg(t("رقم الهاتف يجب أن يتكون من 9 أرقام بالضبط (بدون الصفر الأول أو رمز الدولة)."));
      return;
    }
    if (!branch) {
      setErrorMsg(t("يجب اختيار الفخذ!"));
      return;
    }
    if (!location) {
      setErrorMsg(t("يجب اختيار مكان الإقامة!"));
      return;
    }
 
    for (let i = 0; i < childrenList.length; i++) {
      const child = childrenList[i];
      const childError = validatePersonData(child.name, child.birthYear, child.deathYear);
      if (childError) {
        setErrorMsg(t("خطأ في بيانات الابن رقم {num}: ", { num: i + 1 }) + childError);
        return;
      }
    }
 
    setStatus("submitting");
    setErrorMsg("");
 
    const payload = new URLSearchParams({
      "form-name": "add-member-form",
      name: `🆕 إضافة فرد | ${parentName}`,
      parent_name: parentName,
      member_phone: `${countryCode} ${phone}`,
      branch,
      location,
      birth_year: birthYear,
      death_year: deathYear,
      // نص مقروء بدل JSON حتى يظهر بشكل مفهوم في Netlify وفي ملف CSV
      children_data: childrenList.length
        ? childrenList
            .map((c, i) => `${i + 1}) ${c.name.trim()} (ولادة ${c.birthYear}${c.deathYear ? ` - وفاة ${c.deathYear}` : ""})`)
            .join(" | ")
        : "لا يوجد أبناء",
    }).toString();
 
    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload,
      });
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMsg(t("حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً."));
    }
  };
 
  const inputStyles = "w-full p-3 rounded-xl border border-[rgb(var(--b-lite-rgb)/0.6)] bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--b-deep-rgb)/0.2)] focus:border-[rgb(var(--b-deep-rgb)/1)] text-sm transition-all shadow-sm dark:bg-[#24201a] dark:border-[rgb(var(--b-lite-rgb)/0.2)] dark:text-[#f3ede1]";
 
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 font-cairo p-4 backdrop-blur-sm" 
      onClick={onClose}
      dir="rtl"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#fffdf8] rounded-2xl shadow-2xl overflow-hidden border border-[rgb(var(--b-lite-rgb)/1)] flex flex-col max-h-[90vh] dark:bg-[#161411] dark:border-[rgb(var(--b-lite-rgb)/0.2)]"
      >
        <div className="p-4 bg-gradient-to-b from-[#f3ede1] to-[#fffdf8] border-b border-[rgb(var(--b-lite-rgb)/0.5)] flex items-center justify-between dark:from-[#1c1915] dark:to-[#161411] dark:border-[rgb(var(--b-lite-rgb)/0.2)]">
           <h3 className="text-xl font-bold text-[rgb(var(--b-deep-rgb)/1)] flex items-center gap-2 dark:text-[rgb(var(--b-lite-rgb)/1)]">
             <span className="text-2xl">📝</span>  {t("طلب إضافة فرد جديد")}
           </h3>
         <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 p-2 rounded-xl border border-[rgb(var(--b-lite-rgb)/0.3)] hover:border-red-200 transition-colors shadow-sm flex items-center justify-center dark:bg-[#24201a] dark:text-gray-500 dark:border-[rgb(var(--b-lite-rgb)/0.2)] dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </motion.button>
        </div>
 
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {status === "success" ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30">✓</div>
              <h3 className="text-2xl font-bold text-[#5c4a38] mb-3 dark:text-[#f3ede1]">{t("تم إرسال البيانات بنجاح!")}</h3>
              <p className="text-gray-500 font-bold dark:text-gray-400">{t("سيتم مراجعتها من قبل إدارة الشجرة وإضافتها قريباً.")}</p>
              <button onClick={onClose} className="mt-8 bg-[rgb(var(--b-lite-rgb)/0.2)] text-[rgb(var(--b-deep-rgb)/1)] font-bold py-3 px-8 rounded-xl hover:bg-[rgb(var(--b-lite-rgb)/0.4)] transition-colors dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("إغلاق النافذة")}</button>
            </motion.div>
          ) : (
            <>
              <div className="bg-gradient-to-b from-[#fdfbf7] to-white border border-[rgb(var(--b-lite-rgb)/0.4)] p-5 rounded-2xl shadow-sm flex flex-col gap-5 dark:from-[#1c1915] dark:to-[#171411] dark:border-[rgb(var(--b-lite-rgb)/0.2)]">
                <div className="flex flex-col">
                  <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1.5 mb-1.5 dark:text-gray-400">{t("الاسم الخماسي:")} </label>
                  <input 
                    type="text" 
                    value={parentName}
                    onChange={(e) => handleNoEnglishInput(e.target.value, setParentName)}
                    placeholder={t("مثال: ينال سفيان ربحي عبدالعفو القواسمي")} 
                    className={inputStyles} 
                  />
                </div>
 
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col relative">
                    <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5 dark:text-gray-400">{t("الفخذ:")} </label>
                    <div onClick={() => setIsBranchOpen(!isBranchOpen)} className={`${inputStyles} text-gray-700 text-center font-bold cursor-pointer flex justify-between items-center dark:text-gray-300`}>
                      <span className="flex-1 truncate">{branch ? t(branch) : t("-- اختر الفخذ --")}</span>
                      <motion.svg animate={{ rotate: isBranchOpen ? 180 : 0 }} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></motion.svg>
                    </div>
                    <AnimatePresence>
                      {isBranchOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-[rgb(var(--b-lite-rgb)/1)] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.3)]">
                          <div onClick={() => { setBranch(""); setIsBranchOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] text-gray-500 text-sm border-b dark:hover:bg-white/5 dark:border-[rgb(var(--b-lite-rgb)/0.1)]">{t("-- اختر الفخذ --")}</div>
                          {visibleBranchList.map((item) => (
                            <div key={item} onClick={() => { setBranch(item); setIsBranchOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] hover:text-[rgb(var(--b-deep-rgb)/1)] text-gray-800 font-bold text-sm border-b last:border-none dark:hover:bg-white/5 dark:hover:text-[rgb(var(--b-lite-rgb)/1)] dark:text-gray-200 dark:border-[rgb(var(--b-lite-rgb)/0.1)]">{t(item)}</div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
 
                  <div className="flex flex-col relative">
                    <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5 dark:text-gray-400">{t("الإقامة:")} </label>
                    <div onClick={() => setIsLocationOpen(!isLocationOpen)} className={`${inputStyles} text-gray-700 text-center font-bold cursor-pointer flex justify-between items-center dark:text-gray-300`}>
                      <span className="flex-1 truncate">{location ? t(location) : t("-- اختر الإقامة --")}</span>
                      <motion.svg animate={{ rotate: isLocationOpen ? 180 : 0 }} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></motion.svg>
                    </div>
                    <AnimatePresence>
                      {isLocationOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-[rgb(var(--b-lite-rgb)/1)] rounded-xl shadow-lg z-50 dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.3)]">
                          <div onClick={() => { setLocation(""); setIsLocationOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] text-gray-500 text-sm border-b dark:hover:bg-white/5 dark:border-[rgb(var(--b-lite-rgb)/0.1)]">{t("-- اختر الإقامة --")}</div>
                          {["الأردن", "فلسطين", "غير ذلك"].map((loc) => (
                            <div key={loc} onClick={() => { setLocation(loc); setIsLocationOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] hover:text-[rgb(var(--b-deep-rgb)/1)] text-gray-800 font-bold text-sm border-b last:border-none dark:hover:bg-white/5 dark:hover:text-[rgb(var(--b-lite-rgb)/1)] dark:text-gray-200 dark:border-[rgb(var(--b-lite-rgb)/0.1)]">{t(loc)}</div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
 
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5 dark:text-gray-400">{t("سنة الولادة:")}</label>
                    <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder={t("مثال: 1990")} className={inputStyles} />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5 dark:text-gray-400">{t("سنة الوفاة:")} </label>
                    <input type="number" value={deathYear} onChange={(e) => setDeathYear(e.target.value)} placeholder={t("اتركها فارغة للأحياء")} className={inputStyles} />
                  </div>
                </div>
 
                {/* 🌟 تم تمديد خانة الهاتف للخارج لتاخذ العرض كامل */}
                <div className="flex flex-col w-full">
                  <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5 dark:text-gray-400">
                    
                    {t("رقم الهاتف (للتواصل وتدقيق الطلب):")} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3 w-full" dir="ltr">
                    
                    {/* القائمة المنسدلة الفخمة لمفتاح الدولة */}
                    <div className="relative w-[130px] shrink-0">
                      <div 
                        onClick={() => setIsCountryOpen(!isCountryOpen)} 
                        className="w-full h-full p-3 rounded-xl border border-[rgb(var(--b-lite-rgb)/0.6)] bg-gradient-to-b from-[#fffdf8] to-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--b-deep-rgb)/0.2)] text-sm shadow-sm cursor-pointer flex justify-between items-center font-bold text-[rgb(var(--b-deep-rgb)/1)] transition-all hover:border-[rgb(var(--b-deep-rgb)/1)] dark:from-[#1c1915] dark:to-[#171411] dark:text-[rgb(var(--b-lite-rgb)/1)] dark:border-[rgb(var(--b-lite-rgb)/0.2)]"
                      >
                        <span className="flex-1 text-center leading-none mt-1" dir="ltr">
                          {countryCode === '+962' ? '🇯🇴 +962' : '🇵🇸 +970'}
                        </span>
                        <motion.svg animate={{ rotate: isCountryOpen ? 180 : 0 }} className="w-4 h-4 text-[rgb(var(--b-lite-rgb)/1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></motion.svg>
                      </div>
                      
                      <AnimatePresence>
                        {isCountryOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }} 
                            className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-[rgb(var(--b-lite-rgb)/0.6)] rounded-xl shadow-xl z-50 overflow-hidden dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.3)]"
                          >
                            <div onClick={() => { setCountryCode("+962"); setIsCountryOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] hover:text-[rgb(var(--b-deep-rgb)/1)] text-[#5c4a38] font-bold text-sm border-b border-[rgb(var(--b-lite-rgb)/0.2)] transition-colors dark:hover:bg-white/5 dark:hover:text-[rgb(var(--b-lite-rgb)/1)] dark:text-[#f3ede1] dark:border-[rgb(var(--b-lite-rgb)/0.1)]">🇯🇴 +962</div>
                            <div onClick={() => { setCountryCode("+970"); setIsCountryOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] hover:text-[rgb(var(--b-deep-rgb)/1)] text-[#5c4a38] font-bold text-sm transition-colors dark:hover:bg-white/5 dark:hover:text-[rgb(var(--b-lite-rgb)/1)] dark:text-[#f3ede1]">🇵🇸 +970</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
 
                    {/* خانة إدخال الرقم */}
<input
  type="tel"
  value={phone}
  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
  placeholder="791234567"
  maxLength={9}
  className={`${inputStyles} flex-1`}
  dir="ltr"
/>
                  </div>
                </div>
 
              </div>
 
              <div className="pt-2">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-[rgb(var(--b-deep-rgb)/1)] text-lg flex items-center gap-2 dark:text-[rgb(var(--b-lite-rgb)/1)]">
                    <span className="bg-[rgb(var(--b-lite-rgb)/0.2)] p-2 rounded-lg text-lg"></span>  {t("بيانات الأبناء")}
                  </h4>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={addChild}
                    className="group flex items-center gap-2 rounded-xl border border-[rgb(var(--b-deep-rgb)/0.35)] bg-gradient-to-b from-[#fffdf8] to-[#f3ede1] px-4 py-2 text-sm font-bold text-[rgb(var(--b-deep-rgb)/1)] shadow-sm transition-all hover:border-[rgb(var(--b-deep-rgb)/0.8)] hover:shadow-md dark:from-[#24201a] dark:to-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.3)] dark:text-[rgb(var(--b-lite-rgb)/1)]"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--b-deep-rgb)/1)] text-[15px] leading-none text-white transition-transform duration-300 group-hover:rotate-90 dark:bg-[rgb(var(--b-lite-rgb)/1)] dark:text-[#1c1915]">+</span>
                    {t("إضافة ابن")}
                  </motion.button>
                </div>
 
                <div className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {childrenList.map((child, index) => (
                      <motion.div
                        key={child.id}
                        layout
                        initial={{ opacity: 0, height: 0, y: -12 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, x: -60 }}
                        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="pb-4">
                          <div className="relative bg-gradient-to-b from-[#fdfbf7] to-white border border-[rgb(var(--b-lite-rgb)/0.5)] p-5 rounded-2xl shadow-sm dark:from-[#1c1915] dark:to-[#171411] dark:border-[rgb(var(--b-lite-rgb)/0.2)]">
                            <div className="flex justify-between items-center mb-4 border-b border-[rgb(var(--b-lite-rgb)/0.2)] pb-3 dark:border-[rgb(var(--b-lite-rgb)/0.1)]">
                              <span className="font-bold text-[#7c6c53] text-sm bg-[#f3ede1] px-3 py-1 rounded-md dark:bg-[rgb(var(--b-lite-rgb)/0.1)]">{t("الابن رقم")} {index + 1}</span>
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => removeChild(child.id)}
                                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/60 px-3 py-1.5 text-xs font-bold text-red-500 transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 5v6m4-6v6" /></svg>
                                {t("حذف")}
                              </motion.button>
                            </div>
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col">
                                <label className="font-bold text-[#7c6c53] text-xs mb-1.5 dark:text-gray-400">{t("الاسم الخماسي للابن:")}</label>
                                <input type="text" autoFocus value={child.name} onChange={(e) => updateChild(index, "name", e.target.value)} placeholder={t("مثال: ينال سفيان ربحي عبدالعفو القواسمي")} className={inputStyles} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                  <label className="font-bold text-[#7c6c53] text-xs mb-1.5 dark:text-gray-400">{t("سنة الولادة:")}</label>
                                  <input type="number" value={child.birthYear} onChange={(e) => updateChild(index, "birthYear", e.target.value)} placeholder="2010" className={inputStyles} />
                                </div>
                                <div className="flex flex-col">
                                  <label className="font-bold text-[#7c6c53] text-xs mb-1.5 dark:text-gray-400">{t("سنة الوفاة:")}</label>
                                  <input type="number" value={child.deathYear} onChange={(e) => updateChild(index, "deathYear", e.target.value)} placeholder={t("اختياري")} className={inputStyles} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
 
                {childrenList.length > 0 && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={addChild}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[rgb(var(--b-deep-rgb)/0.35)] py-3 text-sm font-bold text-[rgb(var(--b-deep-rgb)/1)] transition-colors hover:border-[rgb(var(--b-deep-rgb)/0.8)] hover:bg-[rgb(var(--b-deep-rgb)/0.05)] dark:border-[rgb(var(--b-lite-rgb)/0.3)] dark:text-[rgb(var(--b-lite-rgb)/1)] dark:hover:bg-[rgb(var(--b-lite-rgb)/0.06)]"
                  >
                    <span className="text-base leading-none">+</span> {t("إضافة ابن آخر")}
                  </motion.button>
                )}
              </div>
            </>
          )}
        </div>
 
        {status !== "success" && (
          <div className="p-4 border-t border-[rgb(var(--b-lite-rgb)/0.5)] bg-[#fdfbf7] flex flex-col gap-3 dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.2)]">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center dark:bg-red-900/10 dark:border-red-900/30">
                <p className="text-red-600 text-[13px] font-bold dark:text-red-400">{errorMsg}</p>
              </div>
            )}
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit} disabled={status === "submitting"}
              className="bg-gradient-to-r from-[rgb(var(--b-strong-rgb)/1)] to-[rgb(var(--b-ink-rgb)/1)] text-white font-bold py-3 px-8 rounded-xl text-sm w-full shadow-lg border border-[rgb(var(--b-ink-rgb)/1)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "submitting" ? t("جاري الإرسال...") : t("إرسال البيانات للتدقيق")}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}