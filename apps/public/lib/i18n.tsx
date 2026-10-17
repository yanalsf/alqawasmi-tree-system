// apps/public/lib/i18n.tsx
//
// نظام اللغة (عربي / English).
//
// طريقة الاستخدام داخل أي مكوّن:
//     const { t, nm, lang, isRtl } = useT();
//     t("الإعدادات")                       // نص ثابت — يرجع الإنجليزي لو اللغة English
//     t("{count} فرد", { count: 12 })       // نص فيه متغيرات
//     nm(person.name)                       // اسم شخص — يُحوَّل حرفياً للإنجليزية
//
// المفتاح هو النص العربي نفسه؛ ترجماته الإنجليزية في lib/en.ts.
// أي نص ما له ترجمة يبقى بالعربي (ولا ينكسر شي).

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EN } from "./en";
import { transliterateName } from "./translit";

export type Lang = "ar" | "en";

interface LangContextValue {
  lang: Lang;
  isRtl: boolean;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  t: (ar: string, vars?: Record<string, string | number>) => string;
  nm: (name: string | null | undefined) => string;
}

function format(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

const DEFAULT_VALUE: LangContextValue = {
  lang: "ar",
  isRtl: true,
  dir: "rtl",
  setLang: () => {},
  t: (ar, vars) => format(ar, vars),
  nm: (name) => name ?? "",
};

const LangContext = createContext<LangContextValue>(DEFAULT_VALUE);

const STORAGE_KEY = "lang";

export function LangProvider({ children }: { children: ReactNode }) {
  // نبدأ دائماً بالعربية (نفس ما يرسمه السيرفر) ثم نقرأ اختيار الزائر بعد التحميل
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    let initial: Lang = "ar";
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      const saved = localStorage.getItem(STORAGE_KEY);
      if (fromUrl === "en" || fromUrl === "ar") initial = fromUrl;
      else if (saved === "en" || saved === "ar") initial = saved;
    } catch {
      /* التخزين غير متاح — نكمل بالعربية */
    }
    setLangState(initial);
  }, []);

  // اتجاه الصفحة + لغتها + عنوان التبويب + حفظ الاختيار + تحديث الرابط (?lang=en)
  useEffect(() => {
    const isRtl = lang === "ar";
    const html = document.documentElement;
    html.lang = lang;
    html.dir = isRtl ? "rtl" : "ltr";
    document.title = isRtl ? "شجرة العائلة" : "Family Tree";
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    try {
      const url = new URL(window.location.href);
      if (lang === "en") url.searchParams.set("lang", "en");
      else url.searchParams.delete("lang");
      if (url.toString() !== window.location.href) {
        window.history.replaceState(window.history.state, "", url.toString());
      }
    } catch {
      /* ignore */
    }
  }, [lang]);

  // تبديل ناعم: تخفت الصفحة، تتغير اللغة، ثم تظهر من جديد
  const langRef = useRef<Lang>(lang);
  langRef.current = lang;
  const busy = useRef(false);
  const setLang = useCallback((l: Lang) => {
    if (l === langRef.current || busy.current) return;
    const html = document.documentElement;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setLangState(l);
      return;
    }
    busy.current = true;
    html.classList.add("lang-fade");
    window.setTimeout(() => {
      setLangState(l);
      window.setTimeout(() => {
        html.classList.remove("lang-fade");
        busy.current = false;
      }, 80);
    }, 220);
  }, []);

  const value = useMemo<LangContextValue>(() => {
    const isEn = lang === "en";
    return {
      lang,
      isRtl: !isEn,
      dir: isEn ? "ltr" : "rtl",
      setLang,
      t: (ar, vars) => {
        if (!isEn) return format(ar, vars);
        let out = EN[ar];
        // أي "فخذ فلان" ما له ترجمة جاهزة يُحوَّل تلقائياً إلى "Fulan Branch"
        if (out === undefined && ar.startsWith("فخذ ")) out = transliterateName(ar.slice(4)) + " Branch";
        const res = format(out ?? ar, vars);
        // مفرد بالإنجليزية: "1 children" → "1 child"
        return out === undefined ? res : res.replace(/(^|\s)1 children\b/g, "$11 child").replace(/(^|\s)1 members\b/g, "$11 member");
      },
      nm: (name) => (name ? (isEn ? transliterateName(name) : name) : ""),
    };
  }, [lang, setLang]);

  return (
    <LangContext.Provider value={value}>
      <style>{`body{transition:opacity .22s ease}html.lang-fade body{opacity:0}`}</style>
      {children}
    </LangContext.Provider>
  );
}

export function useT(): LangContextValue {
  return useContext(LangContext);
}
