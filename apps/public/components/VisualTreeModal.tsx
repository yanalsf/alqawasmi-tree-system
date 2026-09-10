// apps/admin/components/VisualTreeModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as d3 from "d3";
import type { FamilyNode } from "@/lib/constants";

interface VisualTreeModalProps {
  isOpen: boolean;
  rootNode: FamilyNode | null;
  onClose: () => void;
}

const LEAF_PATH = "M0,20 C-25,10 -30,-20 0,-40 C30,-20 25,10 0,20 Z";

export default function VisualTreeModal({ isOpen, rootNode, onClose }: VisualTreeModalProps) {
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
      minRadius: 10000,
      minChildScale: 4,
      maxChildScale: 6,
      minFontChild: 50,
      maxFontChild: 55,
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
        .attr("class", "viewport-rect").attr("fill", "rgba(138,95,46,0.15)")
        .attr("stroke", "#8a5f2e").attr("stroke-width", 1.5).attr("pointer-events", "none");

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
      if (btn) btn.innerHTML = "⏳ جاري التجهيز...";

      const { root, childScale, fontChild, rootScale, fontRoot, maxNameLen, x0: tx0, x1: tx1, y0: ty0, y1: ty1 } =
        buildRadialLayout(rootNode, {
          minRadius: 2000,       
          minChildScale: 150,     
          maxChildScale: 150,
          minFontChild: 1000,      
          maxFontChild: 1500,
          fontToChildRatio: 6.84,
          rootToChildRatio: 2.5,
        });

      const totalMembersCount = root.descendants().length;
      
      const printDate = new Date().toLocaleDateString('ar-JO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const treeActualWidth = tx1 - tx0;
      const treeActualHeight = ty1 - ty0;

      const padding = safeContentPadding(childScale, fontChild, maxNameLen, 2500);
      
      const dynamicWidth = treeActualWidth + padding * 2;
      const headerScale = Math.max(1, dynamicWidth / 3000);
      
      const headerHeight = 1500 * headerScale;
      // 🌟 التعديل 1: إضافة مساحة مخصصة للذيل السفلي (Footer) لعدم تداخل الشجرة معه
      const footerHeight = 600 * headerScale; 
      
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

      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dynamicWidth} ${dynamicHeight}" width="100%" height="100%" style="background-color: #fffdf8;">
          <defs>
            <pattern id="bg-pattern" x="0" y="0" width="${100 * hs}" height="${100 * hs}" patternUnits="userSpaceOnUse">
              <path d="M${50 * hs} 0 L${100 * hs} ${50 * hs} L${50 * hs} ${100 * hs} L0 ${50 * hs} Z" fill="none" stroke="#d6b877" stroke-width="${1 * hs}" opacity="0.15"/>
            </pattern>
          </defs>

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
          <rect x="${margin + 24*hs}" y="${margin + 24*hs}" width="${dynamicWidth - 2*(margin + 24*hs)}" height="${dynamicHeight - 2*(margin + 24*hs)}" fill="none" stroke="#d4af37" stroke-width="${4 * hs}" />
          <rect x="${margin + 36*hs}" y="${margin + 36*hs}" width="${dynamicWidth - 2*(margin + 36*hs)}" height="${dynamicHeight - 2*(margin + 36*hs)}" fill="none" stroke="#8a5f2e" stroke-width="${2 * hs}" />

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
              <rect x="${-12 * hs}" y="${-12 * hs}" width="${24 * hs}" height="${24 * hs}" fill="none" stroke="#d4af37" stroke-width="${3 * hs}" />
              <circle cx="0" cy="0" r="${5 * hs}" fill="#fffdf8" />
            </g>
          `).join('')}

          <!-- ================= النصوص العلوية ================= -->
          <text class="title" x="${dynamicWidth / 2}" y="${380 * hs}" text-anchor="middle" font-size="${160 * hs}" fill="#2b1d12" font-weight="900">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</text>
          <text class="ayah" x="${dynamicWidth / 2}" y="${580 * hs}" text-anchor="middle" font-size="${100 * hs}" fill="#5c4a38" font-weight="700">وَهُوَ الَّذِي خَلَقَ مِنَ الْمَاءِ بَشَرًا فَجَعَلَهُ نَسَبًا وَصِهْرًا ۗ وَكَانَ رَبُّكَ قَدِيرًا</text>

          <text class="title" x="${dynamicWidth / 2}" y="${1020 * hs}" text-anchor="middle" font-size="${220 * hs}" fill="#2b1d12" font-weight="900">شجرة عائلة القواسمي</text>
          <line x1="${dynamicWidth / 2 - 500 * hs}" y1="${1100 * hs}" x2="${dynamicWidth / 2 + 500 * hs}" y2="${1100 * hs}" stroke="#d4af37" stroke-width="${4 * hs}" stroke-linecap="round" />
          <text class="subtitle" x="${dynamicWidth / 2}" y="${1240 * hs}" text-anchor="middle" font-size="${100 * hs}" fill="#8a5f2e" font-weight="bold">فرع: ${rootNode.name.replace("فخذ ", "")}</text>
          
          <!-- ================= الشجرة ================= -->
          <g transform="translate(${translateX}, ${translateY})">
            ${treeInnerMarkup}
          </g>

          <!-- ================= تذييل الوثيقة (معلومات الطباعة) ================= -->
          <!-- 🌟 التعديل 2: تم تغيير الخط ليكون أردني رسمي وتصغير الحجم بشكل مريح 🌟 -->
          <text font-family="'Amiri', serif" x="${dynamicWidth / 2}" y="${dynamicHeight - margin - 220 * hs}" text-anchor="middle" font-size="${50 * hs}" fill="#5c4a38" font-weight="bold">
            عدد الأفراد في هذا التسلسل: ${totalMembersCount} فرداً   |   تاريخ الإصدار: ${printDate}
          </text>
        </svg>
      `;

      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `شجرة_عائلة_القواسمي_فرع_${rootNode.name.replace("فخذ ", "")}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (btn) btn.innerHTML = "🖨️ طباعة / حفظ SVG";
    } catch (error) {
      console.error("خطأ أثناء التصدير:", error);
      alert("حدث خطأ أثناء التصدير.");
      const btn = document.getElementById("pdf-btn");
      if (btn) btn.innerHTML = "🖨️ طباعة / حفظ SVG";
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
 
    d3.cluster<FamilyNode>()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.5))(root);
 
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
      .attr("stroke", "#5c4a38") 
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
      .attr("fill", "#a97d3f")
      .attr("stroke", "#4a3320")
      .attr("stroke-width", miniature ? 1 : 1.5 * opts.rootScale)
      .style("filter", miniature ? "none" : "drop-shadow(0 4px 8px rgba(0,0,0,0.4))");

    const RADIAL_LEAF = "M -15,0 C -5,-18 20,-22 40,0 C 20,22 -5,18 -15,0 Z";
    
    childNodes
      .append("path")
      .attr("d", RADIAL_LEAF)
      .attr("fill", "#2d4a25")
      .attr("stroke", "#1f3d1f")
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
        .attr("font-size", `${opts.fontChild}px`)
        .attr("font-weight", "900")
        .style("text-anchor", "middle")
        .text((d: any) => (d.data as FamilyNode).name.replace("فخذ ", ""));
    }
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
            className="flex flex-col w-[94vw] h-[90vh] bg-[#fbfaf8] rounded-3xl shadow-2xl overflow-hidden border border-gold/20"
          >
            <div className="p-5 bg-gradient-to-b from-panel to-white border-b border-gold/10 flex items-center justify-between">
              <div>
                <h3 className="m-0 text-[20px] font-extrabold text-gold-deep font-ruqaa">
                  الشجرة الرقمية: {displayNode.name.replace("فخذ ", "")}
                </h3>
                <p className="m-0 text-[12px] text-ink-soft">
                  مرر واسحب للتنقل، استخدم عجلة الفأرة للتكبير
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  id="pdf-btn"
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleExportSVG}
                  className="rounded-xl bg-gradient-to-b from-[#4c7a3f] to-[#3a5c30] px-5 py-2 font-bold text-white text-[13.5px] shadow-md border border-[#2d4a25]"
                >
                  🖨️ طباعة / حفظ SVG
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  className="rounded-xl bg-[#f8f9fa] border border-gold-deep/30 px-5 py-2 font-bold text-[#7c6c53] text-[13.5px] hover:bg-gray-100 transition-colors"
                >
                  ✕ إغلاق
                </motion.button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="relative flex-1 overflow-hidden bg-[#8a5f2e] p-2 m-4 rounded-xl shadow-inner"
            >
              <div className="relative h-full w-full overflow-hidden rounded-lg border-2 border-[#f3ede1]/80 p-[4px]">
                <div id="tree-capture-area" className="relative h-full w-full overflow-hidden rounded-md border-[1.5px] border-[#d6b877] bg-[#fffdf8]">
                  <div ref={hostRef} className="h-full w-full touch-none select-none outline-none" />

                  <div className="absolute bottom-4 left-4 overflow-hidden rounded-xl border-2 border-[#8a5f2e]/60 bg-white shadow-lg z-10">
                    <div className="bg-[#8a5f2e] px-3 py-1.5 text-[12px] font-bold text-white text-center">خريطة الشجرة</div>
                    <div ref={miniMapRef} className="cursor-pointer bg-[#fffdf8]" />
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