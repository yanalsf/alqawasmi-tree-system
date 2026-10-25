// apps/public/lib/supervisors.ts
//
// قائمة مشرفي الموقع (الذين يدقّقون البيانات). هذا هو الملف الوحيد الذي تعدّله
// لإضافة مشرف أو حذفه أو تغيير رقمه. كل مشرف:
//
//   name     : الاسم بالعربي (يُحوَّل تلقائياً للإنجليزية في النسخة الإنجليزية)
//   phone    : رقم الواتساب — اكتبه بأي صيغة: "0791234567" أو "+962791234567" أو "962791234567"
//   role     : (اختياري) الصفة، مثل "مشرف عام" أو "مدقّق بيانات"
//   roleEn   : (اختياري) الصفة بالإنجليزي
//   branch   : (اختياري) id الفخذ الذي يشرف عليه، من lib/branches.ts (مثل "dawoud") — يظهر كشارة بلون الفخذ
//
// مثال (احذف علامتي // وعدّل البيانات):
//
//   { name: "محمد أحمد القواسمي", phone: "0791234567", role: "مشرف عام", roleEn: "General supervisor" },
//   { name: "خالد يوسف القواسمي", phone: "0781234567", role: "مدقّق فخذ داوود", roleEn: "Dawoud branch reviewer", branch: "dawoud" },

export interface Supervisor {
  name: string;
  phone: string;
  role?: string;
  roleEn?: string;
  branch?: string;
}

// بيانات مبدئية — عدّلها حسب الحاجة (الفخوذ التي بلا مشرف أو بلا رقم لم تُضف بعد)
export const SUPERVISORS: Supervisor[] = [
  { name: "مهدي سيف الدين", phone: "0788379323", role: "مشرف", roleEn: "Supervisor", branch: "dawoud" },
  { name: "حمدي عبدالفتاح", phone: "0796935383", role: "مشرف", roleEn: "Supervisor", branch: "dawoud" },
  { name: "مؤمن فلاح", phone: "0795779522", role: "مشرف", roleEn: "Supervisor", branch: "dawoud" },
  { name: "محمد ابراهيم", phone: "0796461620", role: "مشرف", roleEn: "Supervisor", branch: "mohammed_ali" },
  { name: "شاكر محمد شاكر", phone: "0787232320", role: "مشرف", roleEn: "Supervisor", branch: "al_khudair" },
  { name: "جواد", phone: "0795048058", role: "مشرف", roleEn: "Supervisor", branch: "mohammed_sulaiman" },
  { name: "جمال", phone: "0790574441", role: "مشرف", roleEn: "Supervisor", branch: "mohammed_sulaiman" },
  { name: "عاطف", phone: "0796680734", role: "مشرف", roleEn: "Supervisor", branch: "al_sous" },
  { name: "محمد توفيق", phone: "0795575768", role: "مشرف", roleEn: "Supervisor", branch: "al_jadaa" },
  { name: "غالب عبدالرحيم", phone: "0798531315", role: "مشرف", roleEn: "Supervisor", branch: "al_jadaa" },
  { name: "نبيل عبدالمنعم الني", phone: "0795864132", role: "مشرف", roleEn: "Supervisor", branch: "abdulhaq" },
  { name: "منير", phone: "0795939895", role: "مشرف", roleEn: "Supervisor", branch: "abu_baid" },
  { name: "د. بسام", phone: "0795998988", role: "مشرف", roleEn: "Supervisor", branch: "abu_baid" },
  { name: "محمد هاشم", phone: "0785619371", role: "مشرف", roleEn: "Supervisor", branch: "abu_nawara" },
];

/** كود الدولة الافتراضي للأرقام المحلية التي تبدأ بصفر (الأردن). */
const DEFAULT_COUNTRY_CODE = "962";

/** يحوّل أي صيغة رقم إلى صيغة دولية بدون + (المطلوبة لرابط واتساب). */
export function toWhatsappNumber(raw: string): string {
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d.slice(1).replace(/\D/g, "");
  d = d.replace(/\D/g, "");
  if (d.startsWith("00")) return d.slice(2);
  if (d.startsWith("0")) return DEFAULT_COUNTRY_CODE + d.slice(1);
  if (d.length <= 9) return DEFAULT_COUNTRY_CODE + d; // 791234567
  return d;
}

/** عرض الرقم بشكل مقروء: +962 79 123 4567 */
export function formatPhone(raw: string): string {
  const n = toWhatsappNumber(raw);
  if (n.startsWith("962") && n.length === 12) return `+962 ${n.slice(3, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
  return "+" + n;
}
