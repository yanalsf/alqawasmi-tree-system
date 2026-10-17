"use client";
import React, { useState } from "react";

// إضافة parent_id كخاصية ممررة للمكون لمعرفة مكان إضافة الشخص في الشجرة
interface AddMemberModalProps {
  onClose: () => void;
  parentId: number; 
}

export default function AddMemberModal({ onClose, parentId }: AddMemberModalProps) {
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");

 const handleSubmit = async () => {
  try {
    // جلب كلمة المرور من sessionStorage (تأكد من اسم المفتاح الصحيح المستخدم في مشروعك)
    const editorPassword = sessionStorage.getItem("editor_password") || ""; 

    const response = await fetch("/api/person", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // إضافة ترويسة المصادقة التي يطلبها الخادم
        "x-editor-password": editorPassword 
      },
      body: JSON.stringify({
        parent_id: parentId, // تأكد من تمرير parentId
        name_text: name,
        birth_date: birthYear || null,
        death_date: deathYear || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "فشلت الإضافة - تأكد من صلاحياتك");
    }

    const data = await response.json();
    alert("تمت الإضافة بنجاح!");
    onClose(); 
  } catch (error) {
    alert(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
  }
};

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-4" onClick={onClose} dir="rtl">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-[#fffdf8] rounded-2xl shadow-2xl flex flex-col p-6 gap-5">
        
        {/* حقل الاسم */}
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="الاسم الخماسي" 
          className="w-full p-2.5 border rounded-lg" 
        />

        {/* حقل سنة الولادة */}
        <input 
          type="number" 
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          placeholder="سنة الولادة" 
          className="w-full p-2.5 border rounded-lg" 
        />

        {/* حقل سنة الوفاة */}
        <input 
          type="number" 
          value={deathYear}
          onChange={(e) => setDeathYear(e.target.value)}
          placeholder="سنة الوفاة" 
          className="w-full p-2.5 border rounded-lg" 
        />

        {/* ربط دالة الإرسال بالزر */}
        <button onClick={handleSubmit} className="bg-[#4c7a3f] text-white py-2.5 px-6 rounded-xl mt-4">
          إرسال الطلب
        </button>
      </div>
    </div>
  );
}