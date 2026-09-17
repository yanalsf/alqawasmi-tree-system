"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ComplaintsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ComplaintsModal({ isOpen, onClose }: ComplaintsModalProps) {
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
      setErrorMsg("عذراً، ممنوع استخدام الحروف الإنجليزية!");
    } else {
      setErrorMsg("");
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    if (/[a-zA-Z]/.test(value)) {
      value = value.replace(/[a-zA-Z]/g, '');
      setErrorMsg("عذراً، ممنوع استخدام الحروف الإنجليزية!");
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
      setErrorMsg("يرجى إدخال الاسم الرباعي كحد أدنى في خانة اسم المرسل.");
      return;
    }

    // 🌟 التحقق من إدخال رقم الهاتف
    if (!phone.trim()) {
      setErrorMsg("رقم الهاتف مطلوب للتواصل!");
      return;
    }

    if (messageText.length > 100) {
      setErrorMsg("لا يمكن إرسال الطلب لأن الرسالة تجاوزت 100 حرف.");
      return;
    }

    setStatus("submitting");
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
            <div className="relative pt-6 pb-2 shrink-0 z-10 bg-[#fdfbf7] dark:bg-[#1c1915] rounded-t-3xl px-6 border-b border-[#c9974f]/10 dark:border-[#d6b877]/10">
              <button onClick={onClose} className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30">✕</button>
              <div className="text-center mb-2">
                <span className="text-3xl mb-1 block">✉️</span>
                <h2 className="text-2xl font-bold text-[#8a5f2e] font-ruqaa dark:text-[#d6b877]">الشكاوى والاقتراحات</h2>
              </div>
            </div>

            <div className="p-6 overflow-y-auto sidebar-scroll font-cairo">
              {status === "success" ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-green-200 dark:bg-green-900/30 dark:border-green-800">✓</div>
                  <h3 className="text-lg font-bold text-[#5c4a38] dark:text-[#f3ede1] mb-2">تم الإرسال بنجاح!</h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">شكراً لك، تم استلام رسالتك وسنقوم بمراجعتها بأقرب وقت.</p>
                  <button onClick={() => { setStatus("idle"); onClose(); }} className="mt-6 bg-[#c9974f]/10 text-[#8a5f2e] font-bold py-2 px-6 rounded-xl hover:bg-[#c9974f]/20 transition-colors dark:bg-[#d6b877]/10 dark:text-[#d6b877]">إغلاق</button>
                </motion.div>
              ) : (
                <form name="complaints-form" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleSubmit} className="space-y-4">
                  <input type="hidden" name="form-name" value="complaints-form" />
                  {/* 🌟 دمج وإرسال رقم الهاتف */}
                  <input type="hidden" name="phone" value={`${countryCode} ${phone}`} />
                  <p className="hidden"><input name="bot-field" /></p>

                  <div>
                    <label className="block text-[13px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-2">نوع الرسالة *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-transparent has-[:checked]:border-[#c9974f]/50 has-[:checked]:bg-[#c9974f]/5 cursor-pointer transition-all">
                        <input type="radio" name="message_type" value="اقتراح" required className="text-[#c9974f] focus:ring-[#c9974f]" />
                        <span className="text-[13px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">💡 اقتراح تطوير</span>
                      </label>
                      <label className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-transparent has-[:checked]:border-red-400/50 has-[:checked]:bg-red-50 dark:has-[:checked]:bg-red-900/20 cursor-pointer transition-all">
                        <input type="radio" name="message_type" value="شكوى" required className="text-red-500 focus:ring-red-500" />
                        <span className="text-[13px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">⚠️ مشكلة / شكوى</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-2">نص الرسالة *</label>
                    <textarea 
                      name="message_text" 
                      required 
                      rows={4}
                      value={messageText}
                      maxLength={100} 
                      onChange={handleTextareaChange}
                      placeholder="اكتب تفاصيل رسالتك أو مشكلتك هنا (بحد أقصى 100 حرف)..." 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold focus:border-[#c9974f] focus:ring-2 focus:ring-[#c9974f]/20 outline-none transition-all resize-none dark:bg-[#24201a] dark:border-gray-700 dark:text-white dark:focus:ring-[#d6b877]/20" 
                    />
                    <div className={`mt-1 text-left text-[11px] font-bold ${messageText.length === 100 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {messageText.length} / 100 حرف
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#c9974f]/10 dark:border-[#d6b877]/10">
                    <label className="block text-[13px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-2">اسم المرسل *</label>
                    <input 
                      type="text" 
                      name="sender_name" 
                      required 
                      onChange={handleNoEnglishInput}
                      placeholder="الاسم الرباعي كحد أدنى..." 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold focus:border-[#c9974f] focus:ring-2 focus:ring-[#c9974f]/20 outline-none transition-all dark:bg-[#24201a] dark:border-gray-700 dark:text-white" 
                    />
                  </div>

                  {/* 🌟 خانة الهاتف الجديدة */}
                  <div className="pt-2">
                    <label className="block text-[13px] font-bold text-[#8a5f2e] dark:text-[#d6b877] mb-2">رقم الهاتف (للتواصل) *</label>
                    <div className="flex gap-2 w-full" dir="ltr">
                      <div className="relative w-[110px] shrink-0">
                        <div 
                          onClick={() => setIsCountryOpen(!isCountryOpen)} 
                          className="w-full h-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-[14px] font-bold flex justify-between items-center cursor-pointer transition-all hover:border-[#c9974f]/50 dark:bg-[#24201a] dark:border-gray-700 dark:text-white"
                        >
                          <span className="flex-1 text-center leading-none mt-1" dir="ltr">
                            {countryCode === '+962' ? '🇯🇴 +962' : '🇵🇸 +970'}
                          </span>
                          <svg className={`w-4 h-4 transition-transform duration-300 text-[#8a5f2e] dark:text-[#d6b877] ${isCountryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        <AnimatePresence>
                          {isCountryOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
                              className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden dark:bg-[#1c1915] dark:border-gray-700"
                            >
                              <div onClick={() => { setCountryCode("+962"); setIsCountryOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#c9974f]/10 text-gray-700 dark:text-gray-300 font-bold text-[13px] border-b border-gray-100 dark:border-gray-800 transition-colors">🇯🇴 +962</div>
                              <div onClick={() => { setCountryCode("+970"); setIsCountryOpen(false); }} className="p-3 text-center cursor-pointer hover:bg-[#c9974f]/10 text-gray-700 dark:text-gray-300 font-bold text-[13px] transition-colors">🇵🇸 +970</div>
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

                  {errorMsg && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-3 text-center">
                      <p className="text-red-600 dark:text-red-400 text-[12px] font-bold">{errorMsg}</p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={status === "submitting"}
                    className="w-full mt-2 bg-gradient-to-l from-[#8a5f2e] to-[#c9974f] text-white font-bold py-3.5 text-[15px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] dark:from-[#1f3d1f] dark:to-[#2d4a25] dark:text-[#d6b877]"
                  >
                    {status === "submitting" ? "جاري الإرسال..." : "إرسال الرسالة "}
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