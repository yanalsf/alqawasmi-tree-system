// apps/admin/components/VisualTreeModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as d3 from "d3";
import type { FamilyNode } from "../lib/constants";

import { useT } from "../lib/i18n";
interface VisualTreeModalProps {
  isOpen: boolean;
  rootNode: FamilyNode | null;
  onClose: () => void;
}

// يقرأ لون الفخذ الحالي (المتغيرات التي يضعها applyBranchTheme على <body>)
function branchColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
}

const LEAF_PATH = "M0,20 C-25,10 -30,-20 0,-40 C30,-20 25,10 0,20 Z";

export default function VisualTreeModal({ isOpen, rootNode, onClose }: VisualTreeModalProps) {
  const { t, nm, lang } = useT();
  const hostRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const syncMiniMapRef = useRef<((transform: d3.ZoomTransform) => void) | null>(null);

  const [mounted, setMounted] = useState(false);
  const [cachedRootNode, setCachedRootNode] = useState<FamilyNode | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (rootNode) setCachedRootNode(rootNode);
  }, [rootNode]);

  useEffect(() => {
    if (!isOpen || !rootNode || !hostRef.current) return;

    const host = hostRef.current;
    host.innerHTML = "";
    if (miniMapRef.current) miniMapRef.current.innerHTML = "";

    const { root, childScale, fontChild, rootScale, fontRoot, maxNameLen, x0, x1, y0, y1 } = buildRadialLayout(rootNode, {
      minRadius: 5000,
      minChildScale: 15,
      maxChildScale: 25,
      minFontChild: 200,
      maxFontChild: 250,
      fontToChildRatio: 8.75,
      rootToChildRatio: 1.375,
    });
    
    const padding = safeContentPadding(childScale, fontChild, maxNameLen, 150);
    const width = x1 - x0 + padding * 2;
    const height = y1 - y0 + padding * 2;

    const svg = d3
      .select(host)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background", "transparent")
      .style("cursor", "grab");
    svgRef.current = svg;

    const g = svg.append("g");

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.01, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        syncMiniMapRef.current?.(event.transform);
      });
    zoomRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    drawTreeInto(g, root, { rootScale, childScale, fontRoot, fontChild });

    const host2ClientW = host.clientWidth || 900;
    const host2ClientH = host.clientHeight || 600;
    const initialScale = Math.min(host2ClientW / width, host2ClientH / height, 1) * 0.95;
    
    const initialX = host2ClientW / 2 - ((x0 + x1) / 2) * initialScale;
    const initialY = host2ClientH / 2 - ((y0 + y1) / 2) * initialScale; 
    svg.call(zoomBehavior.transform as any, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

    if (miniMapRef.current) {
      const MINI_W = 190, MINI_H = 110;
      const miniScale = Math.min(MINI_W / width, MINI_H / height) * 0.92;
      const miniSvg = d3.select(miniMapRef.current).append("svg")
        .attr("width", MINI_W).attr("height", MINI_H)
        .style("background", "transparent");

      const miniG = miniSvg.append("g").attr(
        "transform",
        `translate(${MINI_W / 2 - ((x0 + x1) / 2) * miniScale}, ${MINI_H / 2 - ((y0 + y1) / 2) * miniScale}) scale(${miniScale})`
      );

      drawTreeInto(miniG, root, { rootScale: 1.6, childScale: 1.15, fontRoot: 0, fontChild: 0 }, true);

      const viewportRect = miniSvg.append("rect")
        .attr("class", "viewport-rect").attr("fill", branchColor("--b-deep", "#8a5f2e")).attr("fill-opacity", 0.15)
        .attr("stroke", branchColor("--b-deep", "#8a5f2e")).attr("stroke-width", 1.5).attr("pointer-events", "none");

      miniSvg.on("click", (event) => {
        const [mx, my] = d3.pointer(event);
        const worldX = (mx - (MINI_W / 2 - ((x0 + x1) / 2) * miniScale)) / miniScale;
        const worldY = (my - (MINI_H / 2 - ((y0 + y1) / 2) * miniScale)) / miniScale;
        const currentTransform = d3.zoomTransform(svg.node()!);
        const k = currentTransform.k;
        const newX = host2ClientW / 2 - worldX * k;
        const newY = host2ClientH / 2 - worldY * k;
        svg.transition().duration(300).call(zoomBehavior.transform as any, d3.zoomIdentity.translate(newX, newY).scale(k));
      });

      function syncMiniMapViewport(transform: d3.ZoomTransform) {
        const hostW = host.clientWidth || 900;
        const hostH = host.clientHeight || 600;
        const worldLeft = -transform.x / transform.k;
        const worldTop = -transform.y / transform.k;
        const worldW = hostW / transform.k;
        const worldH = hostH / transform.k;

        const miniOriginX = MINI_W / 2 - ((x0 + x1) / 2) * miniScale;
        const miniOriginY = MINI_H / 2 - ((y0 + y1) / 2) * miniScale;

        viewportRect
          .attr("x", miniOriginX + worldLeft * miniScale)
          .attr("y", miniOriginY + worldTop * miniScale)
          .attr("width", Math.max(4, worldW * miniScale))
          .attr("height", Math.max(4, worldH * miniScale));
      }
      syncMiniMapRef.current = syncMiniMapViewport;
      syncMiniMapViewport(d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));
    }

    return () => {
      host.innerHTML = "";
      if (miniMapRef.current) miniMapRef.current.innerHTML = "";
      syncMiniMapRef.current = null;
    };
  }, [isOpen, rootNode]);

  const handleExportSVG = () => {
    if (!rootNode) return;

    try {
      const btn = document.getElementById("pdf-btn");
      if (btn) btn.innerHTML = t("⏳ جاري التجهيز...");

      const { root, childScale, fontChild, rootScale, fontRoot, maxNameLen, x0: tx0, x1: tx1, y0: ty0, y1: ty1 } =
        buildRadialLayout(rootNode, {
          minRadius: 2600,
          minChildScale: 200,
          maxChildScale: 175,
          minFontChild: 1300,
          maxFontChild: 1900,
          fontToChildRatio: 6.84,
          // 🌟 تقريب حجم الورقة من حجم دائرة الأب بدل تصغيرها كثيراً عنها
          rootToChildRatio: 1.7,
          // 🌟 تقليل المسافة الزاوية بين الورقات المتجاورة لشكل أكثر تناسقاً
          separationFactor: 0.55,
        });

      const totalMembersCount = root.descendants().length;
      
      const printDate = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-JO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const treeActualWidth = tx1 - tx0;
      const treeActualHeight = ty1 - ty0;

      // 🌟 تكبير حجم الورقة (اللوحة) لتعطي مساحة أفخم حول الشجرة
      const padding = safeContentPadding(childScale, fontChild, maxNameLen, 3500);
      
      const dynamicWidth = treeActualWidth + padding * 2;
      const headerScale = Math.max(1, dynamicWidth / 3000);
      
      const headerHeight = 1800 * headerScale;
      // 🌟 التعديل 1: إضافة مساحة مخصصة للذيل السفلي (Footer) لعدم تداخل الشجرة معه
      const footerHeight = 750 * headerScale; 
      
      // دمج مساحة التذييل في الطول الكلي للوحة
      const dynamicHeight = treeActualHeight + padding * 2 + headerHeight + footerHeight;

      const tempSvgDoc = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const g = d3.select(tempSvgDoc).append("g");
      
      drawTreeInto(g, root, { rootScale, childScale, fontRoot, fontChild });
      const treeInnerMarkup = g.node()?.innerHTML || "";

      const translateX = dynamicWidth / 2 - ((tx0 + tx1) / 2);
      const translateY = headerHeight + padding - ty0;

      const hs = headerScale;
      const margin = 120 * hs;

      // 🌟 نحسب الحجم الحقيقي بالمليمتر للتوثيق فقط (لاستخدامه لاحقاً عند ضبط
      // مقاس اللوحة يدوياً في Illustrator/Inkscape قبل الطباعة)، لكن لا نفرضه
      // كـ width/height فعلي على الجذر — لأن ذلك يكسر التكبير التلقائي عند فتح
      // الملف كمعاينة في المتصفح (يصبح العنصر الزخرفي الواحد يملأ الشاشة رغم
      // تصغير الزوم، كما لاحظت). الأمان: نترك width/height = 100% للعرض،
      // ونحمل القياس الحقيقي كـ data-attribute توثيقي فقط.
      const MM_PER_UNIT = 0.1;
      const widthMm = (dynamicWidth * MM_PER_UNIT).toFixed(1);
      const heightMm = (dynamicHeight * MM_PER_UNIT).toFixed(1);

      const svgContent = `
        <!-- 🌟 الحجم الحقيقي عند الطباعة: ${widthMm}mm × ${heightMm}mm.
             عند الاستيراد إلى Illustrator/Inkscape للطباعة النهائية، اضبط مقاس
             اللوحة (Document Setup / Document Properties) على هذا الرقم يدوياً
             قبل تحويل النص إلى Outlines. -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dynamicWidth} ${dynamicHeight}" width="100%" height="100%" data-print-width-mm="${widthMm}" data-print-height-mm="${heightMm}" style="background-color: #fffdf8;">
          <defs>
            <pattern id="bg-pattern" x="0" y="0" width="${100 * hs}" height="${100 * hs}" patternUnits="userSpaceOnUse">
              <path d="M${50 * hs} 0 L${100 * hs} ${50 * hs} L${50 * hs} ${100 * hs} L0 ${50 * hs} Z" fill="none" stroke="${branchColor("--b-mid", "#d6b877")}" stroke-width="${1 * hs}" opacity="0.15"/>
            </pattern>
            <!-- 🌟 قوس خفيف لرسم الآية عليه بانحناء أنيق -->
            <path id="ayah-curve" fill="none"
              d="M ${dynamicWidth / 2 - 1050 * hs} ${700 * hs}
                 Q ${dynamicWidth / 2} ${580 * hs} ${dynamicWidth / 2 + 1050 * hs} ${700 * hs}" />
          </defs>

          <!--
            ⚠️ ملاحظة طباعة هامة:
            الخطوط أدناه محمّلة عبر @import من الإنترنت، وهذا يعمل فقط داخل المتصفح.
            معظم برامج الطباعة (Illustrator, Inkscape, أي RIP في المطبعة) لا تجلب خطوطاً
            من الشبكة عند فتح ملف SVG، وستستبدل الخط بخط افتراضي قد لا يدعم العربية.
            قبل التسليم للمطبعة: حوّل كل النصوص إلى مسارات (Outlines) عبر
            Inkscape: Path → Object to Path، أو Illustrator: Type → Create Outlines.
            هذا يضمن ظهور النص بنفس الشكل تماماً على أي جهاز أو مطبعة دون الاعتماد
            على توفر الخط.
          -->
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&amp;family=Amiri:wght@400;700&amp;family=Aref+Ruqaa:wght@700&amp;display=swap');
            .title { font-family: 'Aref Ruqaa', serif; }
            .ayah { font-family: 'Amiri', serif; } 
            .subtitle { font-family: 'Cairo', sans-serif; }
          </style>

          <rect x="0" y="0" width="${dynamicWidth}" height="${dynamicHeight}" fill="#fffdf8" />
          <rect x="0" y="0" width="${dynamicWidth}" height="${dynamicHeight}" fill="url(#bg-pattern)" />

          <!-- ================= الإطارات المتداخلة ================= -->
          <rect x="${margin}" y="${margin}" width="${dynamicWidth - 2*margin}" height="${dynamicHeight - 2*margin}" fill="none" stroke="#2b1d12" stroke-width="${14 * hs}" />
          <rect x="${margin + 24*hs}" y="${margin + 24*hs}" width="${dynamicWidth - 2*(margin + 24*hs)}" height="${dynamicHeight - 2*(margin + 24*hs)}" fill="none" stroke="${branchColor("--b-mid", "#d4af37")}" stroke-width="${4 * hs}" />
          <rect x="${margin + 36*hs}" y="${margin + 36*hs}" width="${dynamicWidth - 2*(margin + 36*hs)}" height="${dynamicHeight - 2*(margin + 36*hs)}" fill="none" stroke="${branchColor("--b-deep", "#8a5f2e")}" stroke-width="${2 * hs}" />

          <!-- ================= زوايا الإطار الهندسية ================= -->
          ${[
            [margin, margin],
            [dynamicWidth - margin, margin],
            [margin, dynamicHeight - margin],
            [dynamicWidth - margin, dynamicHeight - margin]
          ].map(([cx, cy]) => `
            <g transform="translate(${cx}, ${cy})">
              <rect x="${-35 * hs}" y="${-35 * hs}" width="${70 * hs}" height="${70 * hs}" fill="#fffdf8" />
              <rect x="${-24 * hs}" y="${-24 * hs}" width="${48 * hs}" height="${48 * hs}" fill="#2b1d12" />
              <rect x="${-12 * hs}" y="${-12 * hs}" width="${24 * hs}" height="${24 * hs}" fill="none" stroke="${branchColor("--b-mid", "#d4af37")}" stroke-width="${3 * hs}" />
              <circle cx="0" cy="0" r="${5 * hs}" fill="#fffdf8" />
            </g>
          `).join('')}

          <!-- ================= النصوص العلوية ================= -->
          <text class="title" x="${dynamicWidth / 2}" y="${460 * hs}" text-anchor="middle" font-size="${160 * hs}" fill="#2b1d12" font-weight="900">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</text>
          <text class="ayah" text-anchor="middle" direction="rtl" font-size="${100 * hs}" fill="#5c4a38" font-weight="700">
            <textPath href="#ayah-curve" startOffset="50%">وَهُوَ الَّذِي خَلَقَ مِنَ الْمَاءِ بَشَرًا فَجَعَلَهُ نَسَبًا وَصِهْرًا ۗ وَكَانَ رَبُّكَ قَدِيرًا</textPath>
          </text>

          <text class="title" x="${dynamicWidth / 2}" y="${1250 * hs}" text-anchor="middle" font-size="${220 * hs}" fill="#2b1d12" font-weight="900">${t("شجرة عائلة القواسمي")}</text>
          <line x1="${dynamicWidth / 2 - 500 * hs}" y1="${1330 * hs}" x2="${dynamicWidth / 2 + 500 * hs}" y2="${1330 * hs}" stroke="${branchColor("--b-mid", "#d4af37")}" stroke-width="${4 * hs}" stroke-linecap="round" />
          <text class="subtitle" x="${dynamicWidth / 2}" y="${1470 * hs}" text-anchor="middle" font-size="${100 * hs}" fill="${branchColor("--b-deep", "#8a5f2e")}" font-weight="bold">${t("فرع:")} ${rootNode.name.replace("فخذ ", "")}</text>
          
          <!-- ================= الشجرة ================= -->
          <g transform="translate(${translateX}, ${translateY})">
            ${treeInnerMarkup}
          </g>

          <!-- ================= تذييل الوثيقة (معلومات الطباعة) ================= -->
          <!-- 🌟 التعديل 2: تم تغيير الخط ليكون أردني رسمي وتصغير الحجم بشكل مريح 🌟 -->
          <text font-family="'Amiri', serif" x="${dynamicWidth / 2}" y="${dynamicHeight - margin - 220 * hs}" text-anchor="middle" font-size="${50 * hs}" fill="#5c4a38" font-weight="bold">
            ${t("عدد الأفراد في هذا التسلسل:")} ${totalMembersCount} ${t("فرداً")}   |   ${t("تاريخ الإصدار:")} ${printDate}
          </text>

          <!-- 🌟 توقيع صانع الشجرة: سطر صغير وأنيق أسفل عدد الأفراد والتاريخ 🌟 -->
          <text class="subtitle" x="${dynamicWidth / 2}" y="${dynamicHeight - margin - 150 * hs}" text-anchor="middle" font-size="${34 * hs}" fill="${branchColor("--b-deep", "#8a5f2e")}" font-style="italic" opacity="0.85">
            ${t("تم الإنشاء بواسطة")} ${nm("ينال سفيان ربحي القواسمي")}
          </text>
        </svg>
      `;

      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = lang === "en" ? `Al-Qawasmi_Family_Tree_${rootNode.name.replace("فخذ ", "").replace(/\s+/g, "_")}.svg` : `شجرة_عائلة_القواسمي_فرع_${rootNode.name.replace("فخذ ", "")}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (btn) btn.innerHTML = t("🖨️ طباعة / حفظ SVG");
    } catch (error) {
      console.error("خطأ أثناء التصدير:", error);
      alert(t("حدث خطأ أثناء التصدير."));
      const btn = document.getElementById("pdf-btn");
      if (btn) btn.innerHTML = t("🖨️ طباعة / حفظ SVG");
    }
  };

  function buildRadialLayout(
    data: FamilyNode,
    opts: {
      minRadius: number;
      minChildScale: number;
      maxChildScale: number;
      minFontChild: number;
      maxFontChild: number;
      fontToChildRatio: number; 
      rootToChildRatio: number; 
      separationFactor?: number;
    }
  ) {
    const root = d3.hierarchy(data as any) as d3.HierarchyPointNode<FamilyNode>;
    const maxDepth = root.height || 1;
    const names = root.descendants().map((d) => (d.data as FamilyNode).name.replace("فخذ ", ""));
    const maxNameLen = Math.max(...names.map((n) => n.length), 4);
 
    // 🌟 التعديل الجذري: تثبيت الحجم الذي تدخله أنت تماماً دون قيود رياضية 🌟
    let radius = opts.minRadius;
    let childScale = opts.maxChildScale; // سيأخذ القيمة الكبيرة التي وضعتها (مثلاً 140) مباشرة
    let fontChild = opts.maxFontChild;   // سيأخذ حجم الخط الذي وضعته مباشرة

    // توسيع الدائرة تلقائياً إذا كانت الأوراق الضخمة تحتاج مساحة لكي لا تتداخل
    const neededRadiusForDepth = maxDepth * (maxNameLen * fontChild * 0.65 + 55 * childScale) * 1.3;
    if (radius < neededRadiusForDepth) {
      radius = neededRadiusForDepth;
    }
 
    const rootScale = childScale * opts.rootToChildRatio;
    const fontRoot = fontChild * opts.rootToChildRatio;
 
    const sepFactor = opts.separationFactor ?? 1;
    d3.cluster<FamilyNode>()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.5) * sepFactor)(root);

    // 🌟 فحص السعة الزاوية: تأكد أن أضيق حلقة (أكثر الأجيال ازدحاماً بالإخوة) تملك
    // مساحة قوسية كافية لعرض كل تسمية دون تراكب، وإلا وسّع نصف القطر وأعد التوزيع.
    const minAngularRadius = computeMinAngularRadius(root, fontChild, childScale);
    if (minAngularRadius > radius) {
      radius = minAngularRadius;
      d3.cluster<FamilyNode>()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 1.5) * sepFactor)(root);
    }
 
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    root.each((d: any) => {
      const cx = d.y * Math.cos(d.x - Math.PI / 2);
      const cy = d.y * Math.sin(d.x - Math.PI / 2);
      if (cx > x1) x1 = cx;
      if (cx < x0) x0 = cx;
      if (cy > y1) y1 = cy;
      if (cy < y0) y0 = cy;
    });
 
    return {
      root: root as d3.HierarchyPointNode<FamilyNode>,
      radius,
      childScale,
      fontChild,
      rootScale,
      fontRoot,
      maxNameLen,
      x0,
      x1,
      y0,
      y1,
    };
  }
   
  // 🌟 يحسب أصغر نصف قطر تحتاجه الشجرة بحيث لا تتراكب تسميات أي حلقة (جيل) مهما كثر
  // عدد الإخوة فيها. يقارن، لكل مجموعة إخوة، مجموع الطول القوسي المطلوب لأسمائهم
  // بمحيط الحلقة عند عمقهم، ويرجع أكبر نصف قطر مطلوب عبر كل الأعماق.
  function computeMinAngularRadius(
    root: d3.HierarchyPointNode<FamilyNode>,
    fontChild: number,
    childScale: number
  ) {
    const maxDepth = root.height || 1;
    const byParent = new Map<any, any[]>();
    root.each((d: any) => {
      if (d.depth === 0) return;
      const key = d.parent;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(d);
    });
 
    let maxRequiredRadius = 0;
    byParent.forEach((siblings) => {
      if (siblings.length < 2) return;
      const depth = siblings[0].depth;
      const labelLen = Math.max(
        ...siblings.map((d: any) => (d.data as FamilyNode).name.replace("فخذ ", "").length)
      );
      // طول القوس التقريبي الذي تحتاجه كل تسمية + هامش أمان 15%
      const neededArcPerNode = labelLen * fontChild * 0.62 + 45 * childScale;
      const totalArcNeeded = neededArcPerNode * siblings.length * 1.15;
      // نصف القطر اللازم عند هذا الجيل حتى يتسع محيط الحلقة لكل الأقواس المطلوبة
      const requiredRingRadius = totalArcNeeded / (2 * Math.PI);
      // نُسقط هذا المطلب على نصف القطر الكامل للشجرة بالتناسب مع عمق هذا الجيل
      const requiredFullRadius = requiredRingRadius * (maxDepth / depth);
      if (requiredFullRadius > maxRequiredRadius) maxRequiredRadius = requiredFullRadius;
    });
 
    return maxRequiredRadius;
  }
 
  function safeContentPadding(childScale: number, fontChild: number, maxNameLen: number, base: number) {
    const leafPhysicalLength = 50 * childScale; 
    const textPhysicalLength = maxNameLen * fontChild * 1.0; 
    const frameAndSafetyMargin = 1500; 

    const requiredSpace = leafPhysicalLength + textPhysicalLength + frameAndSafetyMargin;

    return Math.max(base, requiredSpace);
  }
 
  function drawTreeInto(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    root: d3.HierarchyPointNode<FamilyNode>,
    opts: { rootScale: number; childScale: number; fontRoot: number; fontChild: number },
    miniature = false
  ) {
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", branchColor("--b-deep", "#5c4a38")) 
      .attr("stroke-width", miniature ? 0.6 : 1.2 * opts.childScale) 
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3.linkRadial()
          .angle((d: any) => d.x)
          .radius((d: any) => d.y) as any
      );

    const node = g
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d: any) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`);

    const rootNodes = node.filter((d: any) => d.depth === 0);
    const childNodes = node.filter((d: any) => d.depth !== 0);

    rootNodes
      .append("circle")
      .attr("r", 22 * opts.rootScale) 
      .attr("fill", branchColor("--b-mid", "#a97d3f"))
      .attr("stroke", branchColor("--b-ink", "#4a3320"))
      .attr("stroke-width", miniature ? 1 : 1.5 * opts.rootScale)
      .style("filter", miniature ? "none" : "drop-shadow(0 4px 8px rgba(0,0,0,0.4))");

    const RADIAL_LEAF = "M -15,0 C -5,-18 20,-22 40,0 C 20,22 -5,18 -15,0 Z";
    
    childNodes
      .append("path")
      .attr("d", RADIAL_LEAF)
      .attr("fill", branchColor("--b-ink", "#2d4a25"))
      .attr("stroke", branchColor("--b-deep", "#1f3d1f"))
      .attr("stroke-width", miniature ? 0.5 : 2.5)
      .attr("transform", `scale(${opts.childScale})`)
      .style("filter", miniature ? "none" : "drop-shadow(0 3px 5px rgba(0,0,0,0.3))");

    if (!miniature) {
      rootNodes
        .append("text")
        .attr("transform", (d: any) => {
           const angle = (d.x * 180) / Math.PI - 90;
           return `rotate(${-angle})`; 
        })
        .attr("dominant-baseline", "central") 
        .attr("fill", "#fff")
        .attr("font-family", "'Cairo', sans-serif")
        .attr("font-size", `${opts.fontRoot * 0.65}px`)
        .attr("font-weight", "900")
        .style("text-anchor", "middle")
        .text((d: any) => (d.data as FamilyNode).name.replace("فخذ ", ""));

      childNodes
        .append("text")
        .attr("transform", (d: any) => {
          const angle = (d.x * 180) / Math.PI - 90;
          const leafCenter = 13 * opts.childScale;
          
          if (angle > 90 && angle <= 270) {
            return `translate(${leafCenter}, 0) rotate(180)`;
          } else {
            return `translate(${leafCenter}, 0) rotate(0)`;
          }
        })
        .attr("dominant-baseline", "central") 
        .attr("fill", "#fff")
        .attr("font-family", "'Cairo', sans-serif")
        // 🌟 تدرّج هرمي للخط بحسب الجيل: الحلقات القريبة من الجذر أبرز قليلاً،
        // والحلقات البعيدة (الأكثر ازدحاماً بالإخوة) تصغر تدريجياً لتحافظ على الوضوح
        // دون تراكب، بدل استخدام حجم خط واحد ثابت لكل الأجيال.
        .attr("font-size", (d: any) => `${fontSizeForDepth(d.depth, root.height || 1, opts.fontChild)}px`)
        .attr("font-weight", "900")
        .style("text-anchor", "middle")
        .text((d: any) => (d.data as FamilyNode).name.replace("فخذ ", ""));
    }
  }

  // نطاق التدرج: 115% من الحجم الأساسي عند أول جيل، ينخفض تدريجياً إلى 78% عند أعمق جيل
  function fontSizeForDepth(depth: number, maxDepth: number, baseFontChild: number) {
    if (maxDepth <= 1) return baseFontChild;
    const t = (depth - 1) / (maxDepth - 1); // 0 عند أقرب جيل، 1 عند أبعد جيل
    const factor = 1.15 - t * (1.15 - 0.78);
    return baseFontChild * factor;
  }
  
  const displayNode = rootNode ?? cachedRootNode;

  return (
    <AnimatePresence>
      {isOpen && displayNode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 font-cairo p-4 backdrop-blur-sm print:hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col w-[94vw] h-[90vh] bg-[#fbfaf8] rounded-3xl shadow-2xl overflow-hidden border border-[rgb(var(--b-mid-rgb)/0.2)] dark:bg-[#161411] dark:border-[rgb(var(--b-lite-rgb)/0.2)]"
          >
            <div className="p-5 bg-gradient-to-b from-panel to-white border-b border-[rgb(var(--b-mid-rgb)/0.1)] flex items-center justify-between dark:from-[#1c1915] dark:to-[#161411] dark:border-white/10">
              <div>
                <h3 className="m-0 text-[20px] font-extrabold text-[rgb(var(--b-deep-rgb)/1)] font-ruqaa dark:text-[rgb(var(--b-lite-rgb)/1)]">
                  
                  {t("الشجرة الرقمية:")} {displayNode.name.replace("فخذ ", "")}
                </h3>
                <p className="m-0 text-[12px] text-ink-soft dark:text-gray-400">
                  
                  {t("مرر واسحب للتنقل، استخدم عجلة الفأرة للتكبير")}
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  id="pdf-btn"
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleExportSVG}
                  className="rounded-xl bg-gradient-to-b from-[rgb(var(--b-strong-rgb)/1)] to-[rgb(var(--b-ink-rgb)/1)] px-5 py-2 font-bold text-white text-[13.5px] shadow-md border border-[rgb(var(--b-ink-rgb)/1)]"
                >
                  
                  {t("🖨️ طباعة / حفظ SVG")}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  className="rounded-xl bg-[#f8f9fa] border border-[rgb(var(--b-deep-rgb)/0.3)] px-5 py-2 font-bold text-[#7c6c53] text-[13.5px] hover:bg-gray-100 transition-colors dark:bg-[#24201a] dark:border-[rgb(var(--b-lite-rgb)/0.2)] dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-[rgb(var(--b-lite-rgb)/1)]"
                >
                  
                  {t("✕ إغلاق")}
                </motion.button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="relative flex-1 overflow-hidden bg-[rgb(var(--b-deep-rgb)/1)] p-2 m-4 rounded-xl shadow-inner"
            >
              <div className="relative h-full w-full overflow-hidden rounded-lg border-2 border-[#f3ede1]/80 p-[4px]">
                <div id="tree-capture-area" className="relative h-full w-full overflow-hidden rounded-md border-[1.5px] border-[rgb(var(--b-lite-rgb)/1)] bg-[#fffdf8] dark:bg-[#161411] dark:border-[rgb(var(--b-lite-rgb)/0.3)]">
                  <div ref={hostRef} className="h-full w-full touch-none select-none outline-none" />

                  <div className="absolute bottom-4 left-4 overflow-hidden rounded-xl border-2 border-[rgb(var(--b-deep-rgb)/0.6)] bg-white shadow-lg z-10 dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.4)]">
                    <div className="bg-[rgb(var(--b-deep-rgb)/1)] px-3 py-1.5 text-[12px] font-bold text-white text-center">{t("خريطة الشجرة")}</div>
                    <div ref={miniMapRef} className="cursor-pointer bg-[#fffdf8] dark:bg-[#161411]" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}