"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useT } from "../lib/i18n";
interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// قيم ثابتة بالعربي (تُقارَن وتُرسَل مع النموذج)؛ نترجم فقط ما يظهر للزائر
const editOptions = [
  "تصحيح خطأ في الاسم",
  "إضافة تاريخ ولادة أو وفاة",
  "تعديل صلة قرابة (نقل لفرع آخر)",
  "أخرى"
];

export default function EditRequestModal({ isOpen, onClose }: EditRequestModalProps) {
  const { t } = useT();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [infoText, setInfoText] = useState("");
  
  // 🌟 حالات رقم الهاتف
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+962");
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEditType, setSelectedEditType] = useState("");

  const handleNoEnglishInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/[a-zA-Z]/.test(value)) {
      e.target.value = value.replace(/[a-zA-Z]/g, '');
      setErrorMsg(t("عذراً، ممنوع استخدام الحروف الإنجليزية!"));
    } else {
      setErrorMsg("");
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (/[a-zA-Z]/.test(value)) {
      value = value.replace(/[a-zA-Z]/g, '');
      setErrorMsg(t("عذراً، ممنوع استخدام الحروف الإنجليزية!"));
    } else {
      setErrorMsg("");
    }
    setInfoText(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!selectedEditType) {
      setErrorMsg(t("الرجاء اختيار نوع التعديل من القائمة."));
      return;
    }

    const targetPerson = formData.get("target_person") as string;
    const submitterName = formData.get("submitter_name") as string;
    const correctInfo = formData.get("correct_info") as string;

    if (targetPerson.trim().split(/\s+/).length < 5) {
      setErrorMsg(t("اسم الفرد المراد تعديل بياناته يجب أن يكون خماسياً كحد أدنى."));
      return;
    }

    if (selectedEditType === "تصحيح خطأ في الاسم" && correctInfo.trim().split(/\s+/).length < 5) {
      setErrorMsg(t("الاسم الصحيح المُراد إضافته يجب أن يكون خماسياً كحد أدنى."));
      return;
    }

    if (submitterName.trim().split(/\s+/).length < 5) {
      setErrorMsg(t("اسم مقدم الطلب يجب أن يكون خماسياً كحد أدنى."));
      return;
    }

    // 🌟 التحقق من إدخال رقم الهاتف
    if (!phone.trim()) {
      setErrorMsg(t("رقم الهاتف مطلوب للتواصل وتدقيق الطلب!"));
      return;
    }
    if (!/^[0-9]{9}$/.test(phone.trim())) {
      setErrorMsg(t("رقم الهاتف يجب أن يتكون من 9 أرقام بالضبط (بدون الصفر الأول أو رمز الدولة)."));
      return;
    }

    if (infoText.length > 100 && (selectedEditType === "تعديل صلة قرابة (نقل لفرع آخر)" || selectedEditType === "أخرى")) {
      setErrorMsg(t("لا يمكن إرسال الطلب لأن المعلومة تجاوزت 100 حرف."));
      return;
    }

    setStatus("submitting");

    // 🌟 عنوان موحّد وواضح للطلب بلوحة Netlify
    formData.set("name", `✏️ تعديل بيانات | ${targetPerson}`);

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
      setPhone(""); // تصفير الهاتف
      setCountryCode("+962");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMsg(t("حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً."));
    }
  };

  const renderDynamicInput = () => {
    if (selectedEditType === "تصحيح خطأ في الاسم") {
      return (
        <input 
          type="text" 
          name="correct_info" 
          required
          onChange={handleNoEnglishInput}
          placeholder={t("الاسم الخماسي الصحيح كحد أدنى...")} 
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold focus:border-[rgb(var(--b-mid-rgb)/1)] focus:ring-2 focus:ring-[rgb(var(--b-mid-rgb)/0.2)] outline-none transition-all dark:bg-[#24201a] dark:border-gray-700 dark:text-white dark:focus:ring-[rgb(var(--b-lite-rgb)/0.2)]" 
        />
      );
    } 
    
    if (selectedEditType === "إضافة تاريخ ولادة أو وفاة") {
      return (
        <input 
          type="Number" 
          name="correct_info" 
          placeholder={t("مثال: 1990")}
          required
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold focus:border-[rgb(var(--b-mid-rgb)/1)] focus:ring-2 focus:ring-[rgb(var(--b-mid-rgb)/0.2)] outline-none transition-all dark:bg-[#24201a] dark:border-gray-700 dark:text-white dark:focus:ring-[rgb(var(--b-lite-rgb)/0.2)]" 
        />
      );
    }

    return (
      <>
        <textarea 
          name="correct_info" 
          required 
          rows={3}
          value={infoText}
          maxLength={100}
          onChange={handleTextareaChange}
          placeholder={t("اكتب المعلومة الصحيحة هنا (بحد أقصى 100 حرف)...")} 
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold focus:border-[rgb(var(--b-mid-rgb)/1)] focus:ring-2 focus:ring-[rgb(var(--b-mid-rgb)/0.2)] outline-none transition-all resize-none dark:bg-[#24201a] dark:border-gray-700 dark:text-white dark:focus:ring-[rgb(var(--b-lite-rgb)/0.2)]" 
        />
        <div className={`mt-1 text-left text-[11px] font-bold ${infoText.length === 100 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
          {infoText.length}  {t("/ 100 حرف")}
        </div>
      </>
    );
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
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#fdfbf7] border border-[rgb(var(--b-mid-rgb)/0.3)] shadow-2xl dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.2)] flex flex-col max-h-[90vh]"
          >
            <div className="relative pt-6 pb-2 shrink-0 z-10 bg-[#fdfbf7] dark:bg-[#1c1915] rounded-t-3xl px-6 border-b border-[rgb(var(--b-mid-rgb)/0.1)] dark:border-[rgb(var(--b-lite-rgb)/0.1)]">
              <button onClick={onClose} className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border-none outline-none focus:outline-none focus:ring-0 dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30">✕</button>
              <div className="text-center mb-2">
                <span className="text-3xl mb-1 block">📝</span>
                <h2 className="text-2xl font-bold text-[rgb(var(--b-deep-rgb)/1)] font-ruqaa dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("طلب تعديل بيانات")}</h2>
              </div>
            </div>

            <div className="p-6 overflow-y-auto sidebar-scroll font-cairo">
              {status === "success" ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-green-200 dark:bg-green-900/30 dark:border-green-800">✓</div>
                  <h3 className="text-lg font-bold text-[#5c4a38] dark:text-[#f3ede1] mb-2">{t("تم استلام طلبك بنجاح!")}</h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">{t("سيتم مراجعة التعديل من قبل إدارة الشجرة وتحديث البيانات قريباً.")}</p>
                  <button onClick={() => { setStatus("idle"); onClose(); }} className="mt-6 bg-[rgb(var(--b-mid-rgb)/0.1)] text-[rgb(var(--b-deep-rgb)/1)] font-bold py-2 px-6 rounded-xl hover:bg-[rgb(var(--b-mid-rgb)/0.2)] transition-colors dark:bg-[rgb(var(--b-lite-rgb)/0.1)] dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("إغلاق")}</button>
                </motion.div>
              ) : (
                <form name="edit-requests-form" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleSubmit} className="space-y-4">
                  <input type="hidden" name="form-name" value="edit-requests-form" />
                  {/* 🌟 اسم موحّد لعنوان الطلب بلوحة Netlify */}
                  <input type="hidden" name="name" value={`طلب تعديل - ${selectedEditType || t("غير محدد")}`} />
                  {/* 🌟 دمج وإرسال رقم الهاتف */}
                  <input type="hidden" name="edit_phone" value={`${countryCode} ${phone}`} />
                  <p className="hidden"><input name="bot-field" /></p>

                  <div>
                    <label className="block text-[13px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] mb-2">{t("اسم الفرد المراد تعديل بياناته *")}</label>
                    <input 
                      type="text" 
                      name="target_person" 
                      required
                      onChange={handleNoEnglishInput}
                      placeholder={t("الاسم الخماسي كحد أدنى...")} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold focus:border-[rgb(var(--b-mid-rgb)/1)] focus:ring-2 focus:ring-[rgb(var(--b-mid-rgb)/0.2)] outline-none transition-all dark:bg-[#24201a] dark:border-gray-700 dark:text-white dark:focus:ring-[rgb(var(--b-lite-rgb)/0.2)]" 
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[13px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] mb-2">{t("نوع التعديل *")}</label>
                    <input type="hidden" name="edit_type" value={selectedEditType} />
                    
                    <div 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-[14px] font-bold outline-none transition-all cursor-pointer flex justify-between items-center select-none dark:bg-[#24201a] dark:text-white
                        ${isDropdownOpen ? 'border-[rgb(var(--b-mid-rgb)/1)] ring-2 ring-[rgb(var(--b-mid-rgb)/0.2)] dark:border-gray-700 dark:ring-[rgb(var(--b-lite-rgb)/0.2)]' : 'border-gray-200 hover:border-[rgb(var(--b-mid-rgb)/0.5)] dark:border-gray-700'}`}
                    >
                      <span className={selectedEditType ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                        {selectedEditType ? t(selectedEditType) : t("-- اختر نوع التعديل --")}
                      </span>
                      <svg 
                        className={`w-4 h-4 transition-transform duration-300 text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] ${isDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                          className="absolute z-20 w-full mt-2 bg-white border border-[rgb(var(--b-mid-rgb)/0.3)] rounded-xl shadow-xl overflow-hidden dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.3)]"
                        >
                          {editOptions.map((option) => (
                            <div 
                              key={option}
                              onClick={() => { setSelectedEditType(option); setIsDropdownOpen(false); setErrorMsg(""); }}
                              className={`px-4 py-3 text-[13px] font-bold cursor-pointer transition-colors hover:bg-[rgb(var(--b-mid-rgb)/0.1)] dark:hover:bg-[rgb(var(--b-lite-rgb)/0.1)] 
                                ${selectedEditType === option ? 'bg-[rgb(var(--b-mid-rgb)/0.15)] text-[rgb(var(--b-deep-rgb)/1)] border-r-4 border-[rgb(var(--b-deep-rgb)/1)] dark:bg-[rgb(var(--b-lite-rgb)/0.15)] dark:text-[rgb(var(--b-lite-rgb)/1)] dark:border-[rgb(var(--b-lite-rgb)/1)]' : 'text-gray-700 border-r-4 border-transparent dark:text-gray-300'}`}
                            >
                              {t(option)}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {selectedEditType && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    >
                      <label className="block text-[13px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] mb-2">{t("المعلومة الصحيحة المُراد إضافتها *")}</label>
                      {renderDynamicInput()}
                    </motion.div>
                  )}

                  <div className="pt-2 border-t border-[rgb(var(--b-mid-rgb)/0.1)] dark:border-[rgb(var(--b-lite-rgb)/0.1)]">
                    <label className="block text-[13px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] mb-2">{t("اسم مقدم الطلب *")}</label>
                    <input 
                      type="text" 
                      name="submitter_name" 
                      required 
                      onChange={handleNoEnglishInput}
                      placeholder={t("الاسم الخماسي كحد أدنى...")}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold focus:border-[rgb(var(--b-mid-rgb)/1)] focus:ring-2 focus:ring-[rgb(var(--b-mid-rgb)/0.2)] outline-none transition-all dark:bg-[#24201a] dark:border-gray-700 dark:text-white" 
                    />
                  </div>

                  {/* 🌟 خانة الهاتف الجديدة */}
                  <div className="pt-2">
                    <label className="block text-[13px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] mb-2">{t("رقم الهاتف (للتواصل) *")}</label>
                    <div className="flex gap-2 w-full" dir="ltr">
                      <div className="relative w-[110px] shrink-0">
                        <div 
                          onClick={() => setIsCountryOpen(!isCountryOpen)} 
                          className="w-full h-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[14px] font-bold flex justify-between items-center cursor-pointer transition-all hover:border-[rgb(var(--b-mid-rgb)/0.5)] dark:bg-[#24201a] dark:border-gray-700 dark:text-white"
                        >
                          <span className="flex-1 text-center leading-none mt-1" dir="ltr">
                            {countryCode === '+962' ? '🇯🇴 +962' : '🇵🇸 +970'}
                          </span>
                          <svg className={`w-4 h-4 transition-transform duration-300 text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] ${isCountryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        <AnimatePresence>
                          {isCountryOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                              className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden dark:bg-[#1c1915] dark:border-gray-700"
                            >
                              <div onClick={() => { setCountryCode("+962"); setIsCountryOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[rgb(var(--b-mid-rgb)/0.1)] text-gray-700 dark:text-gray-300 font-bold text-[13px] border-b border-gray-100 dark:border-gray-800 transition-colors">🇯🇴 +962</div>
                              <div onClick={() => { setCountryCode("+970"); setIsCountryOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[rgb(var(--b-mid-rgb)/0.1)] text-gray-700 dark:text-gray-300 font-bold text-[13px] transition-colors">🇵🇸 +970</div>
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
  className="w-full flex-1 p-3 rounded-xl border border-[rgb(var(--b-lite-rgb)/0.6)]..." /* بقية الكلاسات اللي عندك */
  dir="ltr"
/>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-3 text-center">
                      <p className="text-red-600 dark:text-red-400 text-[12px] font-bold">{errorMsg}</p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={status === "submitting"}
                    className="w-full mt-2 bg-gradient-to-l from-[rgb(var(--b-deep-rgb)/1)] to-[rgb(var(--b-mid-rgb)/1)] text-white font-bold py-3.5 text-[15px] rounded-xl disabled:opacity-50 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] dark:from-[rgb(var(--b-ink-rgb)/1)] dark:to-[rgb(var(--b-ink-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)]"
                  >
                    {status === "submitting" ? t("جاري الإرسال...") : t("إرسال الطلب ")}
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