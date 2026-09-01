"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const editOptions = [
  "تصحيح خطأ في الاسم",
  "إضافة تاريخ ولادة أو وفاة",
  "تعديل صلة قرابة (نقل لفرع آخر)",
  "أخرى"
];

export default function EditRequestModal({ isOpen, onClose }: EditRequestModalProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [infoText, setInfoText] = useState("");
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEditType, setSelectedEditType] = useState("");

  const handleNoEnglishInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/[a-zA-Z]/.test(value)) {
      e.target.value = value.replace(/[a-zA-Z]/g, '');
      setErrorMsg("عذراً، ممنوع استخدام الحروف الإنجليزية!");
    } else {
      setErrorMsg("");
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    // منع الحروف الإنجليزية
    if (/[a-zA-Z]/.test(value)) {
      value = value.replace(/[a-zA-Z]/g, '');
      setErrorMsg("عذراً، ممنوع استخدام الحروف الإنجليزية!");
    } else {
      setErrorMsg("");
    }
    
    // تحديث النص (المتصفح سيمنع التجاوز تلقائياً بسبب maxLength)
    setInfoText(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedEditType) {
      setErrorMsg("الرجاء اختيار نوع التعديل من القائمة.");
      return;
    }

    // حماية إضافية قبل الإرسال
    if (infoText.length > 100) {
      setErrorMsg("لا يمكن إرسال الطلب لأن المعلومة تجاوزت 100 حرف.");
      return;
    }

    setStatus("submitting");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = new URLSearchParams(formData as any).toString();

    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data,
      });
      setStatus("success");
      form.reset();
      setInfoText(""); 
      setSelectedEditType(""); 
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMsg("حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#fdfbf7] border border-[#c9974f]/30 shadow-2xl dark:bg-[#1c1915] dark:border-[#d6b877]/20 flex flex-col max-h-[90vh]"
          >
            {/* الهيدر */}
            <div className="relative pt-6 pb-2 shrink-0 z-10 bg-[#fdfbf7] dark:bg-[#1c1915] rounded-t-3xl px-6 border-b border-[#c9974f]/10 dark:border-[#d6b877]/10">
              <button onClick={onClose} className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30">✕</button>
              <div className="text-center mb-2">
                <span className="text-3xl mb-1 block">📝</span>
                <h2 className="text-2xl font-bold text-[#8a5f2e] font-ruqaa dark:text-[#d6b877]">طلب تعديل بيانات</h2>
              </div>
            </div>

            {/* محتوى الفورم */}
            <div className="p-6 overflow-y-auto sidebar-scroll font-cairo">
              {status === "success" ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-green-200 dark:bg-green-900/30 dark:border-green-800">✓</div>
                  <h3 className="text-lg font-bold text-[#5c4a38] dark:text-[#f3ede1] mb-2">تم استلام طلبك بنجاح!</h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">سيتم مراجعة التعديل من قبل إدارة الشجرة وتحديث البيانات قريباً.</p>
                  <button onClick={() => { setStatus("idle"); onClose(); }} className="mt-6 bg-[#c9974f]/10 text-[#8a5f2e] font-bold py-2 px-6 rounded-xl hover:bg-[#c9974f]/20 transition-colors dark:bg-[#d6b877]/10 dark:text-[#d6b877]">إغلاق</button>
                </motion.div>
              ) : (
                <form 
                  name="edit-requests-form" 
                  method="POST" 
                  data-netlify="true" 
                  netlify-honeypot="bot-field" 
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <input type="hidden" name="form-name" value="edit-requests-form" />
                  <p className="hidden"><input name="bot-field" /></p>

                  <div>
                    <label className="block text-[13px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-2">اسم الفرد المراد تعديل بياناته *</label>
                    <input 
                      type="text" 
                      name="target_person" 
                      required
                      onChange={handleNoEnglishInput}
                      placeholder="الاسم الرباعي أو الثلاثي..." 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold focus:border-[#c9974f] focus:ring-2 focus:ring-[#c9974f]/20 outline-none transition-all dark:bg-[#24201a] dark:border-gray-700 dark:text-white dark:focus:ring-[#d6b877]/20" 
                    />
                  </div>

                  {/* القائمة المنسدلة الفخمة */}
                  <div className="relative">
                    <label className="block text-[13px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-2">نوع التعديل *</label>
                    <input type="hidden" name="edit_type" value={selectedEditType} />
                    
                    <div 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-[14px] font-bold outline-none transition-all cursor-pointer flex justify-between items-center select-none dark:bg-[#24201a] dark:text-white
                        ${isDropdownOpen ? 'border-[#c9974f] ring-2 ring-[#c9974f]/20 dark:border-gray-700 dark:ring-[#d6b877]/20' : 'border-gray-200 hover:border-[#c9974f]/50 dark:border-gray-700'}`}
                    >
                      <span className={selectedEditType ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                        {selectedEditType || "-- اختر نوع التعديل --"}
                      </span>
                      <svg 
                        className={`w-4 h-4 transition-transform duration-300 text-[#8a5f2e] dark:text-[#d6b877] ${isDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-20 w-full mt-2 bg-white border border-[#c9974f]/30 rounded-xl shadow-xl overflow-hidden dark:bg-[#1c1915] dark:border-[#d6b877]/30"
                        >
                          {editOptions.map((option) => (
                            <div 
                              key={option}
                              onClick={() => {
                                setSelectedEditType(option);
                                setIsDropdownOpen(false);
                                setErrorMsg("");
                              }}
                              className={`px-4 py-3 text-[13px] font-bold cursor-pointer transition-colors hover:bg-[#c9974f]/10 dark:hover:bg-[#d6b877]/10 
                                ${selectedEditType === option ? 'bg-[#c9974f]/15 text-[#8a5f2e] border-r-4 border-[#8a5f2e] dark:bg-[#d6b877]/15 dark:text-[#d6b877] dark:border-[#d6b877]' : 'text-gray-700 border-r-4 border-transparent dark:text-gray-300'}`}
                            >
                              {option}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-2">المعلومة الصحيحة المُراد إضافتها *</label>
                    <textarea 
                      name="correct_info" 
                      required 
                      rows={3}
                      value={infoText}
                      maxLength={100} // تم تحديد السقف هنا، المتصفح لن يقبل أحرف إضافية
                      onChange={handleTextareaChange}
                      placeholder="اكتب المعلومة الصحيحة هنا (بحد أقصى 100 حرف)..." 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold focus:border-[#c9974f] focus:ring-2 focus:ring-[#c9974f]/20 outline-none transition-all resize-none dark:bg-[#24201a] dark:border-gray-700 dark:text-white dark:focus:ring-[#d6b877]/20" 
                    />
                    {/* عداد الأحرف */}
                    <div className={`mt-1 text-left text-[11px] font-bold ${infoText.length === 100 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {infoText.length} / 100 حرف
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#c9974f]/10 dark:border-[#d6b877]/10">
                    <label className="block text-[13px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-2">اسم مقدم الطلب *</label>
                    <input 
                      type="text" 
                      name="submitter_name" 
                      required 
                      onChange={handleNoEnglishInput}
                      placeholder="الاسم لتأكيد التعديل..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold focus:border-[#c9974f] focus:ring-2 focus:ring-[#c9974f]/20 outline-none transition-all dark:bg-[#24201a] dark:border-gray-700 dark:text-white" 
                    />
                  </div>

                  {errorMsg && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-3 text-center">
                      <p className="text-red-600 dark:text-red-400 text-[12px] font-bold">{errorMsg}</p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={status === "submitting"}
                    className="w-full mt-2 bg-gradient-to-l from-[#8a5f2e] to-[#c9974f] text-white font-bold py-3.5 text-[15px] rounded-xl disabled:opacity-50 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] dark:from-[#1f3d1f] dark:to-[#2d4a25] dark:text-[#d6b877]"
                  >
                    {status === "submitting" ? "جاري الإرسال..." : "إرسال الطلب 🚀"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}