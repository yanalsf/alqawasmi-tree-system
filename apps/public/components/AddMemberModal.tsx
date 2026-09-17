"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AddMemberModalProps {
  onClose: () => void;
}

export default function AddMemberModal({ onClose }: AddMemberModalProps) {
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
  const [childrenList, setChildrenList] = useState<{ name: string; birthYear: string; deathYear: string }[]>([]);

  const branchList = [
    "فخذ داوود", "فخذ ابو نواره", "فخذ الصوص", "فخذ عبدالله", 
    "فخذ الجدع", "فخذ محمد سليمان", "فخذ يونس", "فخذ البدوي", 
    "فخذ محمد علي", "فخذ ابو بيض", "فخذ الخضير", "فخذ عبد الحق"
  ];

  const handleNoEnglishInput = (value: string, setter: (val: string) => void) => {
    if (/[a-zA-Z]/.test(value)) {
      setter(value.replace(/[a-zA-Z]/g, ''));
      setErrorMsg("عذراً، ممنوع استخدام الحروف الإنجليزية!");
    } else {
      setErrorMsg("");
      setter(value);
    }
  };

  const validatePersonData = (personName: string, bYear: string, dYear: string) => {
    if (!personName) return "الاسم مطلوب (ممنوع تركه فارغاً).";
    if (!bYear) return "سنة الولادة مطلوبة (ممنوع تركها فارغة).";
    
    const arabicRegex = /^[\u0600-\u06FF\s]+$/;
    if (!arabicRegex.test(personName)) {
      return "الاسم يجب أن يكون باللغة العربية فقط وممنوع الإنجليزي أو الرموز.";
    }

    const wordCount = personName.trim().split(/\s+/).length;
    if (wordCount < 5) {
      return "يجب إدخال الاسم الخماسي (5 مقاطع على الأقل).";
    }

    if (bYear && dYear) {
      if (parseInt(dYear) < parseInt(bYear)) {
        return "منطقياً، سنة الوفاة لا يمكن أن تكون قبل سنة الولادة!";
      }
    }
    return null; 
  };

  const updateChild = (index: number, field: string, value: string) => {
    const updated = [...childrenList];
    
    if (field === "name" && /[a-zA-Z]/.test(value)) {
      updated[index] = { ...updated[index], [field]: value.replace(/[a-zA-Z]/g, '') };
      setErrorMsg("عذراً، ممنوع استخدام الحروف الإنجليزية!");
    } else {
      setErrorMsg("");
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setChildrenList(updated);
  };

  const handleSubmit = async () => {
    const parentError = validatePersonData(parentName, birthYear, deathYear);
    if (parentError) {
      setErrorMsg("خطأ في بيانات الأب: " + parentError);
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("رقم الهاتف مطلوب للتواصل وتدقيق الطلب!");
      return;
    }
    if (!branch) {
      setErrorMsg("يجب اختيار الفخذ!");
      return;
    }
    if (!location) {
      setErrorMsg("يجب اختيار مكان الإقامة!");
      return;
    }

    for (let i = 0; i < childrenList.length; i++) {
      const child = childrenList[i];
      const childError = validatePersonData(child.name, child.birthYear, child.deathYear);
      if (childError) {
        setErrorMsg(`خطأ في بيانات الابن رقم ${i + 1}: ` + childError);
        return;
      }
    }

    setStatus("submitting");
    setErrorMsg("");

    const payload = new URLSearchParams({
      "form-name": "add-member-form",
      name: `طلب إضافة فرد - ${parentName}`,
      parent_name: parentName,
      member_phone: `${countryCode} ${phone}`,
      branch,
      location,
      birth_year: birthYear,
      death_year: deathYear,
      children_data: JSON.stringify(childrenList),
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
      setErrorMsg("حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً.");
    }
  };

  const inputStyles = "w-full p-3 rounded-xl border border-[#d6b877]/60 bg-white focus:outline-none focus:ring-2 focus:ring-[#8a5f2e]/20 focus:border-[#8a5f2e] text-sm transition-all shadow-sm dark:bg-[#24201a] dark:border-[#d6b877]/20 dark:text-[#f3ede1]";

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
        className="w-full max-w-lg bg-[#fffdf8] rounded-2xl shadow-2xl overflow-hidden border border-[#d6b877] flex flex-col max-h-[90vh] dark:bg-[#161411] dark:border-[#d6b877]/20"
      >
        <div className="p-4 bg-gradient-to-b from-[#f3ede1] to-[#fffdf8] border-b border-[#d6b877]/50 flex items-center justify-between dark:from-[#1c1915] dark:to-[#161411] dark:border-[#d6b877]/20">
           <h3 className="text-xl font-bold text-[#8a5f2e] flex items-center gap-2 dark:text-[#d6b877]">
             <span className="text-2xl">📝</span> طلب إضافة فرد جديد
           </h3>
         <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 p-2 rounded-xl border border-[#d6b877]/30 hover:border-red-200 transition-colors shadow-sm flex items-center justify-center dark:bg-[#24201a] dark:text-gray-500 dark:border-[#d6b877]/20 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
              <h3 className="text-2xl font-bold text-[#5c4a38] mb-3 dark:text-[#f3ede1]">تم إرسال البيانات بنجاح!</h3>
              <p className="text-gray-500 font-bold dark:text-gray-400">سيتم مراجعتها من قبل إدارة الشجرة وإضافتها قريباً.</p>
              <button onClick={onClose} className="mt-8 bg-[#d6b877]/20 text-[#8a5f2e] font-bold py-3 px-8 rounded-xl hover:bg-[#d6b877]/40 transition-colors dark:text-[#d6b877]">إغلاق النافذة</button>
            </motion.div>
          ) : (
            <>
              <div className="bg-gradient-to-b from-[#fdfbf7] to-white border border-[#d6b877]/40 p-5 rounded-2xl shadow-sm flex flex-col gap-5 dark:from-[#1c1915] dark:to-[#171411] dark:border-[#d6b877]/20">
                <div className="flex flex-col">
                  <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1.5 mb-1.5 dark:text-gray-400">الاسم الخماسي: </label>
                  <input 
                    type="text" 
                    value={parentName}
                    onChange={(e) => handleNoEnglishInput(e.target.value, setParentName)}
                    placeholder="مثال: ينال سفيان ربحي عبدالعفو القواسمي" 
                    className={inputStyles} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col relative">
                    <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5 dark:text-gray-400">الفخذ: </label>
                    <div onClick={() => setIsBranchOpen(!isBranchOpen)} className={`${inputStyles} text-gray-700 text-center font-bold cursor-pointer flex justify-between items-center dark:text-gray-300`}>
                      <span className="flex-1 truncate">{branch || "-- اختر الفخذ --"}</span>
                      <motion.svg animate={{ rotate: isBranchOpen ? 180 : 0 }} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></motion.svg>
                    </div>
                    <AnimatePresence>
                      {isBranchOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-[#d6b877] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto dark:bg-[#1c1915] dark:border-[#d6b877]/30">
                          <div onClick={() => { setBranch(""); setIsBranchOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] text-gray-500 text-sm border-b dark:hover:bg-white/5 dark:border-[#d6b877]/10">-- اختر الفخذ --</div>
                          {branchList.map((item) => (
                            <div key={item} onClick={() => { setBranch(item); setIsBranchOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] hover:text-[#8a5f2e] text-gray-800 font-bold text-sm border-b last:border-none dark:hover:bg-white/5 dark:hover:text-[#d6b877] dark:text-gray-200 dark:border-[#d6b877]/10">{item}</div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-col relative">
                    <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5 dark:text-gray-400">الإقامة: </label>
                    <div onClick={() => setIsLocationOpen(!isLocationOpen)} className={`${inputStyles} text-gray-700 text-center font-bold cursor-pointer flex justify-between items-center dark:text-gray-300`}>
                      <span className="flex-1 truncate">{location || "-- اختر الإقامة --"}</span>
                      <motion.svg animate={{ rotate: isLocationOpen ? 180 : 0 }} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></motion.svg>
                    </div>
                    <AnimatePresence>
                      {isLocationOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-[#d6b877] rounded-xl shadow-lg z-50 dark:bg-[#1c1915] dark:border-[#d6b877]/30">
                          <div onClick={() => { setLocation(""); setIsLocationOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] text-gray-500 text-sm border-b dark:hover:bg-white/5 dark:border-[#d6b877]/10">-- اختر الإقامة --</div>
                          {["الأردن", "فلسطين", "غير ذلك"].map((loc) => (
                            <div key={loc} onClick={() => { setLocation(loc); setIsLocationOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] hover:text-[#8a5f2e] text-gray-800 font-bold text-sm border-b last:border-none dark:hover:bg-white/5 dark:hover:text-[#d6b877] dark:text-gray-200 dark:border-[#d6b877]/10">{loc}</div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5 dark:text-gray-400">سنة الولادة:</label>
                    <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="مثال: 1990" className={inputStyles} />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5 dark:text-gray-400">سنة الوفاة: </label>
                    <input type="number" value={deathYear} onChange={(e) => setDeathYear(e.target.value)} placeholder="اتركها فارغة للأحياء" className={inputStyles} />
                  </div>
                </div>

                {/* 🌟 تم تمديد خانة الهاتف للخارج لتاخذ العرض كامل */}
                <div className="flex flex-col w-full">
                  <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5 dark:text-gray-400">
                    رقم الهاتف (للتواصل وتدقيق الطلب): <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3 w-full" dir="ltr">
                    
                    {/* القائمة المنسدلة الفخمة لمفتاح الدولة */}
                    <div className="relative w-[130px] shrink-0">
                      <div 
                        onClick={() => setIsCountryOpen(!isCountryOpen)} 
                        className="w-full h-full p-3 rounded-xl border border-[#d6b877]/60 bg-gradient-to-b from-[#fffdf8] to-white focus:outline-none focus:ring-2 focus:ring-[#8a5f2e]/20 text-sm shadow-sm cursor-pointer flex justify-between items-center font-bold text-[#8a5f2e] transition-all hover:border-[#8a5f2e] dark:from-[#1c1915] dark:to-[#171411] dark:text-[#d6b877] dark:border-[#d6b877]/20"
                      >
                        <span className="flex-1 text-center leading-none mt-1" dir="ltr">
                          {countryCode === '+962' ? '🇯🇴 +962' : '🇵🇸 +970'}
                        </span>
                        <motion.svg animate={{ rotate: isCountryOpen ? 180 : 0 }} className="w-4 h-4 text-[#d6b877]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></motion.svg>
                      </div>
                      
                      <AnimatePresence>
                        {isCountryOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }} 
                            className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-[#d6b877]/60 rounded-xl shadow-xl z-50 overflow-hidden dark:bg-[#1c1915] dark:border-[#d6b877]/30"
                          >
                            <div onClick={() => { setCountryCode("+962"); setIsCountryOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] hover:text-[#8a5f2e] text-[#5c4a38] font-bold text-sm border-b border-[#d6b877]/20 transition-colors dark:hover:bg-white/5 dark:hover:text-[#d6b877] dark:text-[#f3ede1] dark:border-[#d6b877]/10">🇯🇴 +962</div>
                            <div onClick={() => { setCountryCode("+970"); setIsCountryOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] hover:text-[#8a5f2e] text-[#5c4a38] font-bold text-sm transition-colors dark:hover:bg-white/5 dark:hover:text-[#d6b877] dark:text-[#f3ede1]">🇵🇸 +970</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* خانة إدخال الرقم */}
<input
  type="tel"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  placeholder="790 000 000"
  className="w-full flex-1 p-3 rounded-xl border border-[#d6b877]/60..." /* بقية الكلاسات اللي عندك */
  dir="ltr"
/>
                  </div>
                </div>

              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-[#8a5f2e] text-lg flex items-center gap-2 dark:text-[#d6b877]">
                    <span className="bg-[#d6b877]/20 p-2 rounded-lg text-lg"></span> بيانات الأبناء
                  </h4>
                  <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setChildrenList([...childrenList, { name: "", birthYear: "", deathYear: "" }])} className="flex items-center gap-1 text-sm bg-gradient-to-r from-[#fffdf8] to-[#f3ede1] border border-[#d6b877] text-[#8a5f2e] px-4 py-2 rounded-xl shadow-sm font-bold">
                    <span>+</span> إضافة ابن
                  </motion.button>
                </div>

                <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {childrenList.map((child, index) => (
                      <motion.div key={index} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -50, scale: 0.9 }} transition={{ duration: 0.2 }} className="relative bg-gradient-to-b from-[#fdfbf7] to-white border border-[#d6b877]/50 p-5 rounded-2xl shadow-sm dark:from-[#1c1915] dark:to-[#171411] dark:border-[#d6b877]/20">
                        <div className="flex justify-between items-center mb-4 border-b border-[#d6b877]/20 pb-3 dark:border-[#d6b877]/10">
                          <span className="font-bold text-[#7c6c53] text-sm bg-[#f3ede1] px-3 py-1 rounded-md dark:bg-[#d6b877]/10">الابن رقم {index + 1}</span>
                          <button type="button" onClick={() => setChildrenList(childrenList.filter((_, i) => i !== index))} className="text-red-500 hover:text-white hover:bg-red-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 transition-colors dark:border-red-900/30 dark:hover:bg-red-600">حذف</button>
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col">
                            <label className="font-bold text-[#7c6c53] text-xs mb-1.5 dark:text-gray-400">الاسم الخماسي للابن:</label>
                            <input type="text" value={child.name} onChange={(e) => updateChild(index, "name", e.target.value)} placeholder="مثال: ينال سفيان ربحي عبدالعفو القواسمي" className={inputStyles} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <label className="font-bold text-[#7c6c53] text-xs mb-1.5 dark:text-gray-400">سنة الولادة:</label>
                              <input type="number" value={child.birthYear} onChange={(e) => updateChild(index, "birthYear", e.target.value)} placeholder="2010" className={inputStyles} />
                            </div>
                            <div className="flex flex-col">
                              <label className="font-bold text-[#7c6c53] text-xs mb-1.5 dark:text-gray-400">سنة الوفاة:</label>
                              <input type="number" value={child.deathYear} onChange={(e) => updateChild(index, "deathYear", e.target.value)} placeholder="اختياري" className={inputStyles} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </div>

        {status !== "success" && (
          <div className="p-4 border-t border-[#d6b877]/50 bg-[#fdfbf7] flex flex-col gap-3 dark:bg-[#1c1915] dark:border-[#d6b877]/20">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center dark:bg-red-900/10 dark:border-red-900/30">
                <p className="text-red-600 text-[13px] font-bold dark:text-red-400">{errorMsg}</p>
              </div>
            )}
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit} disabled={status === "submitting"}
              className="bg-gradient-to-r from-[#4c7a3f] to-[#3a5c30] text-white font-bold py-3 px-8 rounded-xl text-sm w-full shadow-lg border border-[#2d4a25] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "submitting" ? "جاري الإرسال..." : "إرسال البيانات للتدقيق"}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}