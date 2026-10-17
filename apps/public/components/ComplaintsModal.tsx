"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useT } from "../lib/i18n";
interface ComplaintsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ComplaintsModal({ isOpen, onClose }: ComplaintsModalProps) {
  const { t } = useT();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [messageText, setMessageText] = useState("");

  // 🌟 حالات رقم الهاتف
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+962");
  const [isCountryOpen, setIsCountryOpen] = useState(false);

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
    
    setMessageText(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const senderName = formData.get("sender_name") as string;
    const nameWords = senderName.trim().split(/\s+/).length;
    if (nameWords < 4) {
      setErrorMsg(t("يرجى إدخال الاسم الرباعي كحد أدنى في خانة اسم المرسل."));
      return;
    }

    // 🌟 التحقق من إدخال رقم الهاتف
    if (!phone.trim()) {
      setErrorMsg(t("رقم الهاتف مطلوب للتواصل!"));
      return;
    }
    if (!/^[0-9]{9}$/.test(phone.trim())) {
      setErrorMsg(t("رقم الهاتف يجب أن يتكون من 9 أرقام بالضبط (بدون الصفر الأول أو رمز الدولة)."));
      return;
    }

    if (messageText.length > 100) {
      setErrorMsg(t("لا يمكن إرسال الطلب لأن الرسالة تجاوزت 100 حرف."));
      return;
    }

    setStatus("submitting");

    // 🌟 عنوان موحّد وواضح للطلب بلوحة Netlify
    const messageType = (formData.get("message_type") as string) || t("رسالة");
    formData.set("name", `📩 ${messageType} | ${senderName}`);

    const data = new URLSearchParams(formData as any).toString();

    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data,
      });
      setStatus("success");
      form.reset();
      setMessageText("");
      setPhone(""); // تصفير الهاتف
      setCountryCode("+962");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMsg(t("حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً."));
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
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#fdfbf7] border border-[rgb(var(--b-mid-rgb)/0.3)] shadow-2xl dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.2)] flex flex-col max-h-[90vh]"
          >
            <div className="relative pt-6 pb-2 shrink-0 z-10 bg-[#fdfbf7] dark:bg-[#1c1915] rounded-t-3xl px-6 border-b border-[rgb(var(--b-mid-rgb)/0.1)] dark:border-[rgb(var(--b-lite-rgb)/0.1)]">
              <button onClick={onClose} className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border-none outline-none focus:outline-none focus:ring-0 dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30">✕</button>
              <div className="text-center mb-2">
                <span className="text-3xl mb-1 block">✉️</span>
                <h2 className="text-2xl font-bold text-[rgb(var(--b-deep-rgb)/1)] font-ruqaa dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("الشكاوى والاقتراحات")}</h2>
              </div>
            </div>

            <div className="p-6 overflow-y-auto sidebar-scroll font-cairo">
              {status === "success" ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-green-200 dark:bg-green-900/30 dark:border-green-800">✓</div>
                  <h3 className="text-lg font-bold text-[#5c4a38] dark:text-[#f3ede1] mb-2">{t("تم الإرسال بنجاح!")}</h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">{t("شكراً لك، تم استلام رسالتك وسنقوم بمراجعتها بأقرب وقت.")}</p>
                  <button onClick={() => { setStatus("idle"); onClose(); }} className="mt-6 bg-[rgb(var(--b-mid-rgb)/0.1)] text-[rgb(var(--b-deep-rgb)/1)] font-bold py-2 px-6 rounded-xl hover:bg-[rgb(var(--b-mid-rgb)/0.2)] transition-colors dark:bg-[rgb(var(--b-lite-rgb)/0.1)] dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("إغلاق")}</button>
                </motion.div>
              ) : (
                <form name="complaints-form" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleSubmit} className="space-y-4">
                  <input type="hidden" name="form-name" value="complaints-form" />
                  {/* 🌟 اسم موحّد لعنوان الطلب بلوحة Netlify */}
                  <input type="hidden" name="name" value={t("شكوى/رسالة جديدة")} />
                  {/* 🌟 دمج وإرسال رقم الهاتف */}
                  <input type="hidden" name="complaint_phone" value={`${countryCode} ${phone}`} />
                  <p className="hidden"><input name="bot-field" /></p>

                  <div>
                    <label className="block text-[13px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] mb-2">{t("نوع الرسالة *")}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-transparent has-[:checked]:border-[rgb(var(--b-mid-rgb)/0.5)] has-[:checked]:bg-[rgb(var(--b-mid-rgb)/0.05)] cursor-pointer transition-all">
                        <input type="radio" name="message_type" value={t("اقتراح")} required className="text-[rgb(var(--b-mid-rgb)/1)] focus:ring-[rgb(var(--b-mid-rgb)/1)]" />
                        <span className="text-[13px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">{t("💡 اقتراح تطوير")}</span>
                      </label>
                      <label className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-transparent has-[:checked]:border-red-400/50 has-[:checked]:bg-red-50 dark:has-[:checked]:bg-red-900/20 cursor-pointer transition-all">
                        <input type="radio" name="message_type" value={t("شكوى")} required className="text-red-500 focus:ring-red-500" />
                        <span className="text-[13px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">{t("⚠️ مشكلة / شكوى")}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] mb-2">{t("نص الرسالة *")}</label>
                    <textarea 
                      name="message_text" 
                      required 
                      rows={4}
                      value={messageText}
                      maxLength={100} 
                      onChange={handleTextareaChange}
                      placeholder={t("اكتب تفاصيل رسالتك أو مشكلتك هنا (بحد أقصى 100 حرف)...")} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold focus:border-[rgb(var(--b-mid-rgb)/1)] focus:ring-2 focus:ring-[rgb(var(--b-mid-rgb)/0.2)] outline-none transition-all resize-none dark:bg-[#24201a] dark:border-gray-700 dark:text-white dark:focus:ring-[rgb(var(--b-lite-rgb)/0.2)]" 
                    />
                    <div className={`mt-1 text-left text-[11px] font-bold ${messageText.length === 100 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {messageText.length}  {t("/ 100 حرف")}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[rgb(var(--b-mid-rgb)/0.1)] dark:border-[rgb(var(--b-lite-rgb)/0.1)]">
                    <label className="block text-[13px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] mb-2">{t("اسم المرسل *")}</label>
                    <input 
                      type="text" 
                      name="sender_name" 
                      required 
                      onChange={handleNoEnglishInput}
                      placeholder={t("الاسم الرباعي كحد أدنى...")} 
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
                    className="w-full mt-2 bg-gradient-to-l from-[rgb(var(--b-deep-rgb)/1)] to-[rgb(var(--b-mid-rgb)/1)] text-white font-bold py-3.5 text-[15px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] dark:from-[rgb(var(--b-ink-rgb)/1)] dark:to-[rgb(var(--b-ink-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)]"
                  >
                    {status === "submitting" ? t("جاري الإرسال...") : t("إرسال الرسالة ")}
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