// apps/public/lib/exportUtils.ts
//
// أدوات تصدير/طباعة تعمل على كل الأجهزة (جوال، تابلت، كمبيوتر):
//   • خطوط عربية مضمّنة داخل الملف (لا تعتمد على الإنترنت ولا على خطوط الجهاز)
//   • تحويل SVG إلى صورة PNG / ملف PDF بمقاس ثابت
//   • تسليم الملف: نافذة المشاركة على الجوال (فيها "طباعة" و"حفظ")، أو تنزيل مباشر
//
// فكرة الطباعة: المتصفحات على الجوال لا تطبع صفحات الويب بشكل موثوق (تقسّم الصفحة
// وتتبع عرض الشاشة). لذلك نبني ورقة ثابتة المقاس ونحوّلها إلى PDF — والـPDF
// يُطبع أو يُحفظ بنفس الشكل تماماً على أي جهاز.

const FONTS_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@700&display=swap";

let fontCssPromise: Promise<string> | null = null;

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/** يجلب خطوط Cairo / Amiri / Aref Ruqaa ويحوّلها إلى base64 داخل @font-face (يُخزَّن بعد أول مرة). */
export function getEmbeddedFontCss(): Promise<string> {
  if (fontCssPromise) return fontCssPromise;
  fontCssPromise = (async () => {
    try {
      const css = await (await fetch(FONTS_CSS_URL)).text();
      // نبقي فقط الشرائح العربية واللاتينية (أصغر حجماً)
      const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)]
        .filter((m) => m[1] === "arabic" || m[1] === "latin")
        .map((m) => m[2]);
      const out: string[] = [];
      for (const block of blocks) {
        const urlMatch = block.match(/url\((https:[^)]+)\)/);
        if (!urlMatch) continue;
        const res = await fetch(urlMatch[1]);
        const b64 = arrayBufferToBase64(await res.arrayBuffer());
        out.push(block.replace(/url\([^)]+\)\s*format\([^)]+\)/, `url(data:font/woff2;base64,${b64}) format('woff2')`));
      }
      return out.join("\n");
    } catch {
      fontCssPromise = null; // نحاول من جديد في المرة القادمة
      return "";
    }
  })();
  return fontCssPromise;
}

/** ألوان الفخذ الحالي من متغيرات CSS على <body> (مع قيم احتياطية). */
export function readPalette() {
  const cs = getComputedStyle(document.body);
  const v = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  return {
    mid: v("--b-mid", "#c9974f"),
    strong: v("--b-strong", "#4c7a3f"),
    deep: v("--b-deep", "#8a5f2e"),
    ink: v("--b-ink", "#2b1d12"),
    soft: v("--b-soft", "#d3a765"),
  };
}

/** يخلط لوناً hex مع الأبيض (amount من 0 إلى 1). */
export function tint(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const ch = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return "#" + ch.map((c) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0")).join("");
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("تعذّر تحميل الصورة"));
    img.src = src;
  });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * يرسم SVG (نص) على canvas. الحجم يُصغَّر تلقائياً إذا تجاوز حدّ الذاكرة
 * (الجوالات لا تقبل canvas أكبر من ~16 مليون بكسل).
 * width/height = أبعاد الـSVG الأصلية (وحدات viewBox).
 */
export async function svgToCanvas(
  svg: string,
  width: number,
  height: number,
  opts: { targetWidthPx?: number; maxPixels?: number; maxSide?: number } = {}
): Promise<HTMLCanvasElement> {
  const maxPixels = opts.maxPixels ?? 14_000_000;
  const maxSide = opts.maxSide ?? 16000;
  let scale = (opts.targetWidthPx ?? width) / width;
  scale = Math.min(scale, Math.sqrt(maxPixels / (width * height)), maxSide / width, maxSide / height);
  const cw = Math.max(1, Math.floor(width * scale));
  const ch = Math.max(1, Math.floor(height * scale));

  // نثبّت width/height الفعلية في الجذر حتى يرسمها المتصفح بالحجم المطلوب
  const sized = svg.replace(/<svg([^>]*?)>/, (m, attrs) => {
    const clean = attrs.replace(/\s(width|height)="[^"]*"/g, "");
    return `<svg${clean} width="${cw}" height="${ch}">`;
  });

  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sized);
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas غير مدعوم");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cw, ch);
  // Safari أحياناً يرسم قبل اكتمال فك الخطوط المضمّنة، فنرسم مرتين بينهما مهلة قصيرة
  ctx.drawImage(img, 0, 0, cw, ch);
  await wait(150);
  ctx.drawImage(img, 0, 0, cw, ch);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("فشل إنشاء الصورة"))), type, quality);
  });
}

/** PDF بصفحة واحدة مقاسها (wMm × hMm) والصورة تملؤها. */
export async function canvasToPdfBlob(canvas: HTMLCanvasElement, wMm: number, hMm: number): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: wMm > hMm ? "landscape" : "portrait",
    unit: "mm",
    format: [wMm, hMm],
    compress: true,
  });
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.93), "JPEG", 0, 0, wMm, hMm, undefined, "FAST");
  return pdf.output("blob");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // iOS Safari القديم يتجاهل download → نفتح الملف في تبويب
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * يسلّم الملف للمستخدم:
 *  - جوال/تابلت: نافذة المشاركة (منها يطبع أو يحفظ أو يرسل)
 *  - غير ذلك أو عند الفشل: تنزيل مباشر
 */
export async function deliverBlob(blob: Blob, filename: string, title: string) {
  try {
    const file = new File([blob], filename, { type: blob.type });
    const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    if (coarse && nav.share && nav.canShare && nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], title });
      return;
    }
  } catch (e: any) {
    if (e && e.name === "AbortError") return; // المستخدم أغلق نافذة المشاركة
    // أي خطأ آخر → ننزّل الملف
  }
  downloadBlob(blob, filename);
}
