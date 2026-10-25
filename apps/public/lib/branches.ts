// apps/public/lib/branches.ts
//
// ملف الإعدادات المركزي للأفخاذ — هو المكان الوحيد الذي تعدّله لإضافة فخذ جديد
// أو لتغيير لون فخذ. لكل فخذ:
//   id      : مفتاح إنجليزي (يظهر في الرابط:  ?branch=dawoud)
//   label   : الاسم الظاهر في القوائم
//   rootId  : person_id للجد الأعلى للفخذ في قاعدة البيانات (الابن المباشر للجذر 941)
//   founder : (اختياري) اسم الجد المؤسس الحقيقي إذا كان اسم الفخذ مختلفاً عن اسم جدّه
//             (مثلاً فخذ بدوي جدّه "مصطفى (بدوي)" بنفس صيغة باقي الأفخاذ مثل "مصطفى (الجدع)").
//             يظهر في كل الموقع بدل اسم الفخذ، ويُستعمل فقط إذا كان الاسم في قاعدة البيانات
//             ما زال اسم الفخذ نفسه؛ فإذا صحّحت الاسم في قاعدة البيانات يُهمل هذا الإعداد تلقائياً.
//   color   : اللون الأساسي للفخذ. باقي الدرجات (الداكن/الفاتح/الخلفية/الوضع الليلي)
//             تُحسب منه تلقائياً.
//
// قاعدة اختيار الألوان: لا بنفسجي ولا زهري ولا رمادي (الرمادي محجوز للمتوفين).

export interface BranchDef {
  id: string;
  label: string;
  rootId: number;
  color: string;
  founder?: string;
}

export const BRANCHES: BranchDef[] = [
  { id: "dawoud",            label: "فخذ داوود",       rootId: 1,   color: "#4a9650" }, // أخضر
  { id: "abu_nawara",        label: "فخذ ابو نواره",   rootId: 942, color: "#ca6a16" }, // برتقالي
  { id: "al_sous",           label: "فخذ الصوص",       rootId: 943, color: "#239595" }, // تركوازي
  { id: "abdullah",          label: "فخذ عبدالله",     rootId: 944, color: "#d34f45" }, // أحمر
  { id: "al_jadaa",          label: "فخذ الجدع",       rootId: 945, color: "#3187dd" }, // أزرق سماوي
  { id: "mohammed_sulaiman", label: "فخذ محمد سليمان", rootId: 946, color: "#4d6fcb" }, // أزرق
  { id: "younes",            label: "فخذ يونس",        rootId: 947, color: "#aa7f09" }, // عنبري
  { id: "al_badawi",         label: "فخذ بدوي",        rootId: 948, color: "#269768", founder: "مصطفى (بدوي)" }, // زمردي
  { id: "mohammed_ali",      label: "فخذ محمد علي",    rootId: 949, color: "#2f4fa8" }, // كحلي
  { id: "abu_baid",          label: "فخذ ابو بيض",     rootId: 950, color: "#d6643d" }, // قرميدي
  { id: "al_khudair",        label: "فخذ خضير",        rootId: 951, color: "#6f8f24" , founder: "مصطفى (بدوي)" }, // أخضر زيتي
  { id: "abdulhaq",          label: "فخذ عبد الحق",    rootId: 952, color: "#188fbf" }, // سيان
];

/**
 * يبدّل اسم رأس كل فخذ له `founder` باسم الجد الحقيقي (يُطبَّق على نسخة الشجرة، لا يغيّر tree.json).
 * الجذر الوهمي (941) أبناؤه هم رؤوس الأفخاذ.
 */
export function withFounderNames<T extends { id: number; name: string; children?: T[] }>(root: T): T {
  if (!root.children) return root;
  const norm = (x: string) => x.replace(/^فخذ\s+/, "").replace(/^ال/, "").trim();
  const byRoot = new Map(BRANCHES.filter((b) => b.founder).map((b) => [b.rootId, b]));
  if (byRoot.size === 0) return root;
  return {
    ...root,
    children: root.children.map((c) => {
      const b = byRoot.get(c.id);
      // نبدّل الاسم فقط إذا كان ما زال اسم الفخذ نفسه (أي لم يُصحَّح في قاعدة البيانات)
      return b && norm(c.name) === norm(b.label) ? { ...c, name: b.founder as string } : c;
    }),
  };
}

export function getBranchById(id: string | null | undefined): BranchDef | undefined {
  return BRANCHES.find((b) => b.id === id);
}

export function getBranchByRootId(rootId: number | null | undefined): BranchDef | undefined {
  return BRANCHES.find((b) => b.rootId === rootId);
}

// ───────────────────────── حساب الألوان ─────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

function hexToHsl(hex: string): [number, number, number] {
  const [r8, g8, b8] = hexToRgb(hex);
  const r = r8 / 255, g = g8 / 255, b = b8 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const channels = (hex: string) => hexToRgb(hex).join(" "); // "74 150 80" — يُستخدم داخل rgb(var(--x)/0.3)

/** درجة بنفس اللون، تُغمَّق/تُفتَّح حتى تحقق نسبة تباين معيّنة مع لون الخلفية. */
function shadeForContrast(h: number, s: number, startL: number, bg: string, min: number, darken: boolean): string {
  let l = startL;
  let out = hslToHex(h, s, l);
  while (contrast(out, bg) < min && l > 0.08 && l < 0.95) {
    l += darken ? -0.01 : 0.01;
    out = hslToHex(h, s, l);
  }
  return out;
}

export type BranchThemeVars = Record<string, string>;

/**
 * يبني كل متغيرات CSS للفخذ من لونه الأساسي.
 * تُطبَّق على <body> (انظر PublicTreeView) فتصل لكل شيء، حتى النوافذ المنبثقة (portals).
 *
 * الدرجات:
 *   mid    = اللون الأساسي (بطاقة "بدون أبناء")
 *   strong = أغمق قليلاً (بطاقة "لها أبناء")
 *   deep   = للنصوص والعناوين على الخلفية الفاتحة (تباين ≥ 6)
 *   ink    = أغمق درجة (أوراق الشجرة الرقمية)
 *   soft   = أفتح (تدرجات)
 *   lite   = لنصوص الوضع الليلي (تباين ≥ 7 مع الخلفية الداكنة)
 */
export function buildBranchTheme(baseHex: string, isDark: boolean): BranchThemeVars {
  const [h, s, l] = hexToHsl(baseHex);

  const mid = baseHex;
  const strong = hslToHex(h, s, clamp(l - 0.1, 0.12, 0.9));
  const deep = shadeForContrast(h, s, clamp(l - 0.14, 0.12, 0.9), "#fffdf8", 6, true);
  const ink = hslToHex(h, s, clamp(l - 0.26, 0.1, 0.9));
  const soft = hslToHex(h, clamp(s * 0.95, 0, 1), clamp(l + 0.14, 0.1, 0.9));
  const lite = shadeForContrast(h, clamp(s * 0.85, 0, 1), 0.66, "#1c1915", 7, false);
  const liteDk = hslToHex(h, clamp(s * 0.85, 0, 1), 0.5);
  const pale = hslToHex(h, clamp(s * 0.6, 0, 1), 0.93);
  const leaf = hslToHex(h, clamp(s * 0.9, 0, 1), clamp(l + 0.04, 0.1, 0.9));

  const hasDark = hslToHex(h, clamp(s * 0.8, 0, 1), 0.22);
  const noDark = hslToHex(h, clamp(s * 0.8, 0, 1), 0.32);

  const paperLight = hslToHex(h, 0.4, 0.955); // تلوين خفيف جداً لخلفية الصفحة
  const paper = isDark ? "#161411" : paperLight;

  return {
    // — متغيرات legacy.css الموجودة أصلاً —
    "--paper": paper,
    "--gold": isDark ? lite : mid,
    "--gold-deep": isDark ? liteDk : deep,
    "--green-1": soft,
    "--green-2": strong,
    "--green-deep": ink,
    "--theme-has-kids": strong,
    "--theme-no-kids": mid,
    "--theme-has-kids-dark": hasDark,
    "--theme-no-kids-dark": noDark,
    // — بطاقة الفخذ الأعلى (focus-card) —
    "--focus-1": strong,
    "--focus-2": ink,
    // — درجات للـ Tailwind (قنوات RGB حتى يعمل /opacity) —
    "--b-mid-rgb": channels(mid),
    "--b-strong-rgb": channels(strong),
    "--b-deep-rgb": channels(deep),
    "--b-ink-rgb": channels(ink),
    "--b-soft-rgb": channels(soft),
    "--b-lite-rgb": channels(lite),
    "--b-lite-dk-rgb": channels(liteDk),
    "--b-pale-rgb": channels(pale),
    "--b-leaf-rgb": channels(leaf),
    // — نفس الدرجات كـ hex (تقرأها الشجرة الرقمية d3 عند الرسم/التصدير) —
    "--b-mid": mid,
    "--b-strong": strong,
    "--b-deep": deep,
    "--b-ink": ink,
    "--b-soft": soft,
  };
}

/** يطبّق الثيم على <body> ويُرجِع دالة تزيله (تُستخدم داخل useEffect). */
export function applyBranchTheme(branch: BranchDef, isDark: boolean): () => void {
  const body = document.body;
  const vars = buildBranchTheme(branch.color, isDark);
  Object.entries(vars).forEach(([k, v]) => body.style.setProperty(k, v));
  body.dataset.branch = branch.id;
  return () => {
    Object.keys(vars).forEach((k) => body.style.removeProperty(k));
    delete body.dataset.branch;
  };
}

/** ألوان بطاقة الفخذ في شاشة "اختر الفخذ" (تلوّن الحدود والنص عند التمرير لكل بطاقة بلونها). */
export function branchCardVars(branch: BranchDef): Record<string, string> {
  const t = buildBranchTheme(branch.color, false);
  return {
    "--b-mid-rgb": t["--b-mid-rgb"],
    "--b-deep-rgb": t["--b-deep-rgb"],
    "--b-lite-rgb": t["--b-lite-rgb"],
  };
}
