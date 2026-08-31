"use client";

import React from "react";

interface AddMemberModalProps {
  onClose: () => void;
}

export default function AddMemberModal({ onClose }: AddMemberModalProps) {
  return (
    <div 
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 font-cairo p-4 backdrop-blur-sm" 
      onClick={onClose}
      dir="rtl"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#fffdf8] rounded-2xl shadow-2xl overflow-hidden border border-[#d6b877] flex flex-col max-h-[90vh]"
      >
        {/* الترويسة (Header) */}
        <div className="p-4 bg-gradient-to-b from-[#f3ede1] to-[#fffdf8] border-b border-[#d6b877]/50 flex items-center justify-between">
           <h3 className="text-xl font-bold text-[#8a5f2e] flex items-center gap-2">
             إضافة فرد جديد 📝
           </h3>
           <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
           </button>
        </div>

        {/* الحقول (Body) */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          
          {/* الاسم الخماسي */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[#7c6c53] text-sm">الاسم الخماسي:</label>
            <input 
              type="text" 
              placeholder="مثال: ينال سفيان ربي عبد الله القواسمي" 
              className="w-full p-2.5 rounded-lg border border-[#d6b877]/60 bg-[#fdfbf7] focus:outline-none focus:border-[#8a5f2e] text-sm" 
            />
          </div>

          {/* الفخذ */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[#7c6c53] text-sm">الفخذ:</label>
            <select className="w-full p-2.5 rounded-lg border border-[#d6b877]/60 bg-[#fdfbf7] focus:outline-none focus:border-[#8a5f2e] text-sm text-gray-600">
              <option value="">-- اختر الفخذ --</option>
              <option value="عبدالعفو">عبدالعفو</option>
              <option value="عبدالرزاق">عبدالرزاق</option>
              {/* بتقدر تضيف باقي الفخوذ هون */}
            </select>
          </div>

          {/* سنة الولادة */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[#7c6c53] text-sm">سنة الولادة:</label>
            <input 
              type="number" 
              placeholder="مثال: 1990" 
              className="w-full p-2.5 rounded-lg border border-[#d6b877]/60 bg-[#fdfbf7] focus:outline-none focus:border-[#8a5f2e] text-sm" 
            />
          </div>

          {/* سنة الوفاة */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[#7c6c53] text-sm">سنة الوفاة (إن وجد):</label>
            <input 
              type="number" 
              placeholder="مثال: 2020 (اتركها فارغة إن كان على قيد الحياة)" 
              className="w-full p-2.5 rounded-lg border border-[#d6b877]/60 bg-[#fdfbf7] focus:outline-none focus:border-[#8a5f2e] text-sm" 
            />
          </div>

          {/* مكان الإقامة */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[#7c6c53] text-sm">مكان الإقامة:</label>
            <select className="w-full p-2.5 rounded-lg border border-[#d6b877]/60 bg-[#fdfbf7] focus:outline-none focus:border-[#8a5f2e] text-sm text-gray-600">
              <option value="">-- اختر مكان الإقامة --</option>
              <option value="عمان">عمان</option>
              <option value="الخليل">الخليل</option>
              {/* بتقدر تضيف باقي المدن هون */}
            </select>
          </div>

        </div>

        {/* زر الإرسال */}
        <div className="p-4 border-t border-[#d6b877]/50 bg-[#fdfbf7] flex justify-end">
          <button className="bg-gradient-to-b from-[#4c7a3f] to-[#3a5c30] hover:scale-105 text-white font-bold py-2.5 px-6 rounded-xl transition-transform text-sm w-full shadow-md border border-[#2d4a25]">
            إرسال الطلب
          </button>
        </div>
      </div>
    </div>
  );
}