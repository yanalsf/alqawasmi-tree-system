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
    updated[index] = { ...updated[index], [field]: value };
    setChildrenList(updated);
  };

  const handleSubmit = async () => {
    const parentError = validatePersonData(parentName, birthYear, deathYear);
    if (parentError) {
      alert("خطأ في بيانات الأب: " + parentError);
      return;
    }
    if (!branch) {
      alert("يجب اختيار الفخذ!");
      return;
    }
    if (!location) {
      alert("يجب اختيار مكان الإقامة!");
      return;
    }

    for (let i = 0; i < childrenList.length; i++) {
      const child = childrenList[i];
      const childError = validatePersonData(child.name, child.birthYear, child.deathYear);
      if (childError) {
        alert(`خطأ في بيانات الابن رقم ${i + 1}: ` + childError);
        return;
      }
    }

    setStatus("submitting");
    setErrorMsg("");

    const payload = new URLSearchParams({
      "form-name": "add-member-form",
      parent_name: parentName,
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
      alert("تم إرسال البيانات بنجاح! سيتم مراجعتها من قبل إدارة الشجرة.");
      onClose();
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMsg("حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً.");
      alert("حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً.");
    }
  };

  const inputStyles = "w-full p-3 rounded-xl border border-[#d6b877]/60 bg-white focus:outline-none focus:ring-2 focus:ring-[#8a5f2e]/20 focus:border-[#8a5f2e] text-sm transition-all shadow-sm";

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
        className="w-full max-w-lg bg-[#fffdf8] rounded-2xl shadow-2xl overflow-hidden border border-[#d6b877] flex flex-col max-h-[90vh]"
        
      >
        {/* الترويسة */}
        <div className="p-4 bg-gradient-to-b from-[#f3ede1] to-[#fffdf8] border-b border-[#d6b877]/50 flex items-center justify-between">
           <h3 className="text-xl font-bold text-[#8a5f2e] flex items-center gap-2">
             <span className="text-2xl">📝</span> طلب إضافة فرد جديد
           </h3>
         <motion.button 
  whileHover={{ scale: 1.1, rotate: 90 }}
  whileTap={{ scale: 0.9 }}
  onClick={onClose} 
  className="text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 p-2 rounded-xl border border-[#d6b877]/30 hover:border-red-200 transition-colors shadow-sm flex items-center justify-center"
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
</motion.button>
        </div>

        {/* الحقول */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          
          <div className="bg-gradient-to-b from-[#fdfbf7] to-white border border-[#d6b877]/40 p-5 rounded-2xl shadow-sm flex flex-col gap-5">
            <div className="flex flex-col">
              <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1.5 mb-1.5">الاسم الخماسي: <span>👤</span></label>
              <input 
                type="text" 
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="مثال: ينال سفيان ربحي عبدالعفو القواسمي" 
                className={inputStyles} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* قائمة الفخذ المخصصة مع الترانزيشن */}
              <div className="flex flex-col relative">
                <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5">الفخذ: <span className="text-sm">🌿</span></label>
                <div 
                  onClick={() => setIsBranchOpen(!isBranchOpen)}
                  className={`${inputStyles} text-gray-700 text-center font-bold cursor-pointer flex justify-between items-center`}
                >
                  <span className="flex-1 truncate">{branch || "-- اختر الفخذ --"}</span>
                  <motion.svg animate={{ rotate: isBranchOpen ? 180 : 0 }} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></motion.svg>
                </div>

                <AnimatePresence>
                  {isBranchOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-[#d6b877] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
                    >
                      <div onClick={() => { setBranch(""); setIsBranchOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] text-gray-500 text-sm border-b">-- اختر الفخذ --</div>
                      {branchList.map((item) => (
                        <div key={item} onClick={() => { setBranch(item); setIsBranchOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] hover:text-[#8a5f2e] text-gray-800 font-bold text-sm border-b last:border-none">
                          {item}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* قائمة الإقامة المخصصة مع الترانزيشن */}
              <div className="flex flex-col relative">
                <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5">الإقامة: <span className="text-sm">📍</span></label>
                <div 
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                  className={`${inputStyles} text-gray-700 text-center font-bold cursor-pointer flex justify-between items-center`}
                >
                  <span className="flex-1 truncate">{location || "-- اختر الإقامة --"}</span>
                  <motion.svg animate={{ rotate: isLocationOpen ? 180 : 0 }} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></motion.svg>
                </div>

                <AnimatePresence>
                  {isLocationOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-[#d6b877] rounded-xl shadow-lg z-50"
                    >
                      <div onClick={() => { setLocation(""); setIsLocationOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] text-gray-500 text-sm border-b">-- اختر الإقامة --</div>
                      {["الأردن", "فلسطين", "غير ذلك"].map((loc) => (
                        <div key={loc} onClick={() => { setLocation(loc); setIsLocationOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#f3ede1] hover:text-[#8a5f2e] text-gray-800 font-bold text-sm border-b last:border-none">
                          {loc}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5">سنة الولادة: <span>📅</span></label>
                <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="مثال: 1990" className={inputStyles} />
              </div>
              <div className="flex flex-col">
                <label className="font-bold text-[#7c6c53] text-xs flex items-center gap-1 mb-1.5">سنة الوفاة: <span>⚰️</span></label>
                <input type="number" value={deathYear} onChange={(e) => setDeathYear(e.target.value)} placeholder="اتركها فارغة للأحياء" className={inputStyles} />
              </div>
            </div>
          </div>

          {/* قسم الأبناء مع حركات الظهور */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-[#8a5f2e] text-lg flex items-center gap-2">
                <span className="bg-[#d6b877]/20 p-2 rounded-lg text-lg">👤</span> بيانات الأبناء
              </h4>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setChildrenList([...childrenList, { name: "", birthYear: "", deathYear: "" }])}
                className="flex items-center gap-1 text-sm bg-gradient-to-r from-[#fffdf8] to-[#f3ede1] border border-[#d6b877] text-[#8a5f2e] px-4 py-2 rounded-xl shadow-sm font-bold"
              >
                <span>+</span> إضافة ابن
              </motion.button>
            </div>

            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {childrenList.map((child, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="relative bg-gradient-to-b from-[#fdfbf7] to-white border border-[#d6b877]/50 p-5 rounded-2xl shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-4 border-b border-[#d6b877]/20 pb-3">
                      <span className="font-bold text-[#7c6c53] text-sm bg-[#f3ede1] px-3 py-1 rounded-md">الابن رقم {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = childrenList.filter((_, i) => i !== index);
                          setChildrenList(updated);
                        }}
                        className="text-red-500 hover:text-white hover:bg-red-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                      >
                        حذف
                      </button>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col">
                        <label className="font-bold text-[#7c6c53] text-xs mb-1.5">الاسم الخماسي للابن:</label>
                        <input type="text" value={child.name} onChange={(e) => updateChild(index, "name", e.target.value)} placeholder="مثال: ينال سفيان ربحي عبدالعفو القواسمي" className={inputStyles} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <label className="font-bold text-[#7c6c53] text-xs mb-1.5">سنة الولادة:</label>
                          <input type="number" value={child.birthYear} onChange={(e) => updateChild(index, "birthYear", e.target.value)} placeholder="2010" className={inputStyles} />
                        </div>
                        <div className="flex flex-col">
                          <label className="font-bold text-[#7c6c53] text-xs mb-1.5">سنة الوفاة:</label>
                          <input type="number" value={child.deathYear} onChange={(e) => updateChild(index, "deathYear", e.target.value)} placeholder="اختياري" className={inputStyles} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* زر الإرسال */}
        <div className="p-4 border-t border-[#d6b877]/50 bg-[#fdfbf7] flex justify-end">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={status === "submitting"}
            className="bg-gradient-to-r from-[#4c7a3f] to-[#3a5c30] text-white font-bold py-3 px-8 rounded-xl text-sm w-full shadow-lg border border-[#2d4a25] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>🚀</span> {status === "submitting" ? "جاري الإرسال..." : "إرسال البيانات للتدقيق"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}