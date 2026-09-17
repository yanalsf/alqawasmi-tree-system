// components/HiddenNetlifyForms.tsx
//
// Netlify فقط بيكتشف الفورمات إذا شاف وسم <form data-netlify="true"> فعليًا
// بملف الـ HTML الناتج عن الـ build. فورمات المشروع كلها جوا modals ما بترندر
// إلا لما isOpen=true، يعني بالحالة الافتراضية (مقفولة) الفورم مش موجود
// بالـ HTML النهائي أبداً، و Netlify ما بيقدر يسجله.
//
// الحل الرسمي: نحط نسخة "شبح" من كل فورم هون — نفس الاسم ونفس أسماء
// الحقول بالظبط — بس مخفية بصريًا (display:none) وموجودة دايمًا بالصفحة.
// هيك Netlify بيكتشفها وقت الـ build، وبعدين أي submission حقيقي جاي
// من الـ modal (عبر fetch + form-name المطابق) بينحفظ تحت نفس الفورم.
//
// هذا الملف component عادي (server component)، ما يحتاج "use client"
// لأنه بس HTML ثابت بدون أي تفاعل.

export default function HiddenNetlifyForms() {
  return (
    <div style={{ display: "none" }} aria-hidden="true">
      {/* 1. فورم طلب تعديل بيانات — لازم يطابق EditRequestModal.tsx بالظبط */}
      <form name="edit-requests-form" data-netlify="true" netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="edit-requests-form" />
        <input name="bot-field" />
        <input name="name" />
        <input name="target_person" />
        <input name="edit_type" />
        <textarea name="correct_info" />
        <input name="submitter_name" />
        <input name="edit_phone" />
      </form>

      {/* 2. فورم الشكاوى والاقتراحات — لازم يطابق ComplaintsModal.tsx بالظبط */}
      <form name="complaints-form" data-netlify="true" netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="complaints-form" />
        <input name="bot-field" />
        <input name="name" />
        <input name="message_type" />
        <textarea name="message_text" />
        <input name="sender_name" />
        <input name="complaint_phone" />
      </form>

      {/* 3. فورم إضافة فرد جديد — لازم يطابق AddMemberModal.tsx بالظبط */}
      <form name="add-member-form" data-netlify="true" netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="add-member-form" />
        <input name="bot-field" />
        <input name="name" />
        <input name="parent_name" />
        <input name="member_phone" />
        <input name="branch" />
        <input name="location" />
        <input name="birth_year" />
        <input name="death_year" />
        <textarea name="children_data" />
      </form>
    </div>
  );
}