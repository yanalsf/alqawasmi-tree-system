// apps/admin/components/VisualTreeModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as d3 from "d3";
import type { FamilyNode } from "@/lib/constants";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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
  const treeExtentRef = useRef({ x0: 0, x1: 0, y0: 0, y1: 0, width: 0, height: 0 });
  const syncMiniMapRef = useRef<((transform: d3.ZoomTransform) => void) | null>(null);

  const [mounted, setMounted] = useState(false);
  const [printMarkup, setPrintMarkup] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen || !rootNode || !hostRef.current) return;

    const host = hostRef.current;
    host.innerHTML = "";
    if (miniMapRef.current) miniMapRef.current.innerHTML = "";

    const root = d3.hierarchy(rootNode as any) as d3.HierarchyPointNode<FamilyNode>;
    
    const dx = 150;
    const dy = 170;
    d3.tree<FamilyNode>().nodeSize([dx, dy])(root);

    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    root.each((d) => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
      if (d.y > y1) y1 = d.y;
      if (d.y < y0) y0 = d.y;
    });
    
    const padding = 100;
    const width = x1 - x0 + padding * 2;
    const height = y1 - y0 + padding * 2;
    treeExtentRef.current = { x0, x1, y0, y1, width, height };

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

    drawTreeInto(g, root, { 
      rootScale: 2.2,
      childScale: 1.6,
      fontRoot: 17,
      fontChild: 14
    });

    const host2ClientW = host.clientWidth || 900;
    const host2ClientH = host.clientHeight || 600;
    const initialScale = Math.min(host2ClientW / width, host2ClientH / height, 1) * 0.95;
    const initialX = host2ClientW / 2 - root.x * initialScale;
    const initialY = 250 * initialScale; 
    svg.call(zoomBehavior.transform as any, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

    if (miniMapRef.current) {
      const MINI_W = 190, MINI_H = 110;
      const miniScale = Math.min(MINI_W / width, MINI_H / height) * 0.92;
      const miniSvg = d3
        .select(miniMapRef.current)
        .append("svg")
        .attr("width", MINI_W)
        .attr("height", MINI_H)
        .style("background", "transparent");

      const miniG = miniSvg
        .append("g")
        .attr(
          "transform",
          `translate(${MINI_W / 2 - ((x0 + x1) / 2) * miniScale}, ${MINI_H / 2 - ((y0 + y1) / 2) * miniScale}) scale(${miniScale})`
        );

      drawTreeInto(miniG, root, { rootScale: 1.6, childScale: 1.15, fontRoot: 0, fontChild: 0 }, true);

      const viewportRect = miniSvg
        .append("rect")
        .attr("class", "viewport-rect")
        .attr("fill", "rgba(138,95,46,0.15)")
        .attr("stroke", "#8a5f2e")
        .attr("stroke-width", 1.5)
        .attr("pointer-events", "none");

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

      // 1. مضاعفة مسافات الشجرة عشان تاخذ راحتها وتصير هي العنصر الأكبر
      const dx = 800; 
      const dy = 700; 
      const root = d3.hierarchy(rootNode as any) as d3.HierarchyPointNode<FamilyNode>;
      d3.tree<FamilyNode>().nodeSize([dx, dy])(root);

      const totalMembers = root.descendants().length;
      const currentDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

      let tx0 = Infinity, tx1 = -Infinity, ty0 = Infinity, ty1 = -Infinity;
      root.each((d) => {
        if (d.x > tx1) tx1 = d.x;
        if (d.x < tx0) tx0 = d.x;
        if (d.y > ty1) ty1 = d.y;
        if (d.y < ty0) ty0 = d.y;
      });
      
      const treeActualWidth = tx1 - tx0;
      const treeActualHeight = ty1 - ty0;

      const baseDynamicWidth = Math.max(4000, treeActualWidth + 1800);
      const headerScale = baseDynamicWidth / 4000; 

      // 2. تصغير أحجام نصوص العناوين والفوتر عشان ما تسرق النظر من الشجرة
      const titleFontSize = 80 * headerScale;
      const subTitleFontSize = 45 * headerScale;
      const footerFontSize = 32 * headerScale;

      // 3. تقليل المساحات الفارغة (الهوامش) لتعبئة الصفحة بالشجرة
      const topPadding = (220 * headerScale) + 1500; 
      const bottomPadding = (160 * headerScale) + 500; 

      const dynamicWidth = baseDynamicWidth;
      const dynamicHeight = Math.max(2500, treeActualHeight + topPadding + bottomPadding); 

      // تنحيف الإطار قليلاً ليعطي مساحة أكبر للداخل
      const outerM = 30 * headerScale;
      const innerM = 60 * headerScale;

      // 4. بناء الشجرة: تكبير الورقات وخطوط الأسماء للضعف تقريباً!
      const tempSvgDoc = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const g = d3.select(tempSvgDoc).append("g");
      drawTreeInto(g, root, { rootScale: 16, childScale: 12.5, fontRoot: 160, fontChild: 125 });
      const treeInnerMarkup = g.node()?.innerHTML || "";

      // 5. التوسيط المضمون
      const translateX = (dynamicWidth - treeActualWidth) / 2 - tx0;
      const translateY = topPadding;

      // 6. بناء الملف النهائي
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dynamicWidth} ${dynamicHeight}" width="100%" height="100%" style="background-color: #fffdf8;">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&amp;family=Aref+Ruqaa:wght@700&amp;display=swap');
            .title { font-family: 'Aref Ruqaa', serif; }
            .subtitle { font-family: 'Cairo', sans-serif; }
          </style>

          <!-- الإطار الخارجي -->
          <rect x="${outerM}" y="${outerM}" width="${dynamicWidth - (outerM * 2)}" height="${dynamicHeight - (outerM * 2)}" fill="#fffdf8" stroke="#8a5f2e" stroke-width="${18 * headerScale}" rx="${40 * headerScale}" />
          
          <!-- الإطار الداخلي -->
          <rect x="${innerM}" y="${innerM}" width="${dynamicWidth - (innerM * 2)}" height="${dynamicHeight - (innerM * 2)}" fill="none" stroke="#d6b877" stroke-width="${8 * headerScale}" rx="${25 * headerScale}" />
          
          <!-- العناوين العلوية -->
          <text class="title" x="${dynamicWidth / 2}" y="${outerM + (140 * headerScale)}" text-anchor="middle" font-size="${titleFontSize}" fill="#8a5f2e" font-weight="900">الشجرة الرقمية</text>
          <text class="subtitle" x="${dynamicWidth / 2}" y="${outerM + (220 * headerScale)}" text-anchor="middle" font-size="${subTitleFontSize}" fill="#7c6c53" font-weight="bold">فرع: ${rootNode.name.replace("فخذ ", "")}</text>
          
          <!-- الشجرة المدمجة -->
          <g transform="translate(${translateX}, ${translateY})">
            ${treeInnerMarkup}
          </g>

          <!-- ====== الفوتر ====== -->
          <line x1="${innerM + (80 * headerScale)}" y1="${dynamicHeight - innerM - (100 * headerScale)}" x2="${dynamicWidth - innerM - (80 * headerScale)}" y2="${dynamicHeight - innerM - (100 * headerScale)}" stroke="#d6b877" stroke-width="${3 * headerScale}" stroke-dasharray="${12 * headerScale}, ${12 * headerScale}" opacity="0.6" />

          <text class="subtitle" x="${dynamicWidth - innerM - (80 * headerScale)}" y="${dynamicHeight - innerM - (40 * headerScale)}" text-anchor="end" font-size="${footerFontSize}" fill="#8a5f2e" font-weight="bold">عدد الأفراد الموثقين: ${totalMembers} فرد</text>
          <text class="subtitle" x="${innerM + (80 * headerScale)}" y="${dynamicHeight - innerM - (40 * headerScale)}" text-anchor="start" font-size="${footerFontSize}" fill="#8a5f2e" font-weight="bold">تاريخ الإصدار: ${currentDate}</text>
        </svg>
      `;

      // 7. التحميل
      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `شجرة_عائلة_القواسمي_فرع_${rootNode.name.replace("فخذ ", "")}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (btn) btn.innerHTML = "🌿 حفظ الشجرة كـ SVG";
    } catch (error) {
      console.error("خطأ أثناء التصدير:", error);
      alert("حدث خطأ أثناء التصدير.");
      const btn = document.getElementById("pdf-btn");
      if (btn) btn.innerHTML = "🌿 حفظ الشجرة كـ SVG";
    }
  };

  function drawTreeInto(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    root: d3.HierarchyPointNode<FamilyNode>,
    opts: { rootScale: number; childScale: number; fontRoot: number; fontChild: number },
    miniature = false
  ) {
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#6b8e5c")
      .attr("stroke-width", miniature ? 0.6 : 6.0)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d: any) => d.x)
          .y((d: any) => d.y) as any
      );

    const node = g
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    node
      .append("path")
      .attr("d", LEAF_PATH)
      .attr("fill", (d: any) => (d.depth === 0 ? "#a97d3f" : "#2d4a25"))
      .attr("stroke", (d: any) => (d.depth === 0 ? "#8a5f2e" : "#1f3d1f"))
      .attr("stroke-width", miniature ? 0.5 : 2.5)
      .attr("transform", (d: any) => `scale(${d.depth === 0 ? opts.rootScale : opts.childScale})`)
      .style("filter", miniature ? "none" : "drop-shadow(0 6px 10px rgba(0,0,0,0.4))");

   if (!miniature) {
      node
        .append("text")
        .attr("y", (d: any) => (d.depth === 0 ? -10 * opts.rootScale : -10 * opts.childScale)) 
        .attr("dy", "0.35em")
        .attr("fill", "#fff")
        .attr("font-family", "'Cairo', sans-serif")
        .attr("font-size", (d: any) => (d.depth === 0 ? `${opts.fontRoot}px` : `${opts.fontChild}px`))
        .attr("font-weight", "900")
        .style("text-anchor", "middle")
        .text((d: any) => (d.data as FamilyNode).name.replace("فخذ ", ""));
    }
  }

  function buildPrintSvgMarkup(node: FamilyNode): string {
    // 1. زيادة المسافات عشان الورق ياخذ راحته وما يركب على بعضه
    const dx = 290; // كبرناها لـ 290 عشان يبعدوا أفقياً (كانت 170)
    const dy = 260; // كبرناها لـ 260 عشان يبعدوا عمودياً والخطوط الخضراء تبين أحلى

    const root = d3.hierarchy(node) as d3.HierarchyPointNode<FamilyNode>;
    d3.tree<FamilyNode>().nodeSize([dx, dy])(root);

    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    root.each((d) => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
      if (d.y > y1) y1 = d.y;
      if (d.y < y0) y0 = d.y;
    });
    
    // زدنا الحواف شوي عشان الورق اللي ع الأطراف ما ينقص
    const padding = 220; 
    const width = x1 - x0 + padding * 2;
    const height = y1 - y0 + padding * 2;

    const svgNS = "http://www.w3.org/2000/svg";
    const svgEl = document.createElementNS(svgNS, "svg") as unknown as SVGSVGElement;
    
    svgEl.setAttribute("viewBox", `${x0 - padding} ${y0 - padding * 0.7} ${width} ${height}`);
    svgEl.setAttribute("width", "100%");
    svgEl.setAttribute("height", "100%");
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const g = d3.select(svgEl).append("g") as unknown as d3.Selection<SVGGElement, unknown, null, undefined>;
    
    // 2. تكبير الخطوط بشكل كبير لتناسب حجم الورق
    drawTreeInto(g, root, { 
      rootScale: 4.2,   
      childScale: 3.4,  
      fontRoot: 48,     // كبرنا خط الجد لـ 48 (كان 34)
      fontChild: 38     // كبرنا خط الأبناء لـ 38 (كان 26)
    });

    return svgEl.outerHTML;
  }

  function handlePrint() {
    if (!rootNode) return;
    setPrintMarkup(buildPrintSvgMarkup(rootNode));
    setTimeout(() => {
      window.print();
    }, 250);
  }

  if (!isOpen || !rootNode) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 font-cairo p-4 backdrop-blur-sm print:hidden"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col w-[94vw] h-[90vh] bg-[#fbfaf8] rounded-3xl shadow-2xl overflow-hidden border border-gold/20"
      >
        <div className="p-5 bg-gradient-to-b from-panel to-white border-b border-gold/10 flex items-center justify-between">
          <div>
            <h3 className="m-0 text-[20px] font-extrabold text-gold-deep font-ruqaa">
              الشجرة الرقمية: {rootNode.name.replace("فخذ ", "")}
            </h3>
            <p className="m-0 text-[12px] text-ink-soft">
              مرر واسحب للتنقل، استخدم عجلة الفأرة للتكبير — عند الطباعة تُعاد صياغة الشجرة تلقائياً لتملأ الصفحة بالكامل
            </p>
          </div>
          <div className="flex gap-2">
            {/* تمت إضافة id="pdf-btn" للزر */}
            <button
              id="pdf-btn"
              type="button"
              onClick={handleExportSVG}
              className="rounded-xl bg-gradient-to-b from-[#4c7a3f] to-[#3a5c30] px-5 py-2 font-bold text-white text-[13.5px] hover:scale-105 transition-transform shadow-md border border-[#2d4a25]"
            >
              🖨️ طباعة / حفظ SVG
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#f8f9fa] border border-gold-deep/30 px-5 py-2 font-bold text-[#7c6c53] text-[13.5px] hover:bg-gray-100 transition-colors"
            >
              ✕ إغلاق
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden bg-[#8a5f2e] p-2 m-4 rounded-xl shadow-inner">
          <div className="relative h-full w-full overflow-hidden rounded-lg border-2 border-[#f3ede1]/80 p-[4px]">
            {/* تمت إضافة id="tree-capture-area" هنا */}
            <div id="tree-capture-area" className="relative h-full w-full overflow-hidden rounded-md border-[1.5px] border-[#d6b877] bg-[#fffdf8]">
              <div ref={hostRef} className="h-full w-full touch-none select-none outline-none" />

              <div className="absolute bottom-4 left-4 overflow-hidden rounded-xl border-2 border-[#8a5f2e]/60 bg-white shadow-lg z-10">
                <div className="bg-[#8a5f2e] px-3 py-1.5 text-[12px] font-bold text-white text-center">خريطة الشجرة</div>
                <div ref={miniMapRef} className="cursor-pointer bg-[#fffdf8]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const printArea = (
    <div className="print-visual-tree hidden print:flex flex-col w-full h-screen bg-white p-4">
      <style>{`
        @media print {
          body > *:not(.print-visual-tree) { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
          @page { size: landscape; margin: 5mm; }
          .print-visual-tree {
            display: flex !important;
            flex-direction: column !important;
            width: 100vw !important;
            height: 100vh !important;
            background: white !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            box-sizing: border-box !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="flex-1 w-full bg-[#8a5f2e] p-[8px] rounded-2xl flex flex-col shadow-sm">
        <div className="flex-1 relative w-full flex flex-col overflow-hidden rounded-xl border-[3px] border-[#f3ede1]/90 p-[5px]">
          <div className="flex-1 relative w-full flex flex-col overflow-hidden rounded-lg border-[2px] border-[#d6b877] bg-[#fffdf8] p-6">
            
            <div className="mb-2 text-center flex-none">
              <h1 className="font-ruqaa text-[34px] text-[#8a5f2e] font-extrabold m-0 drop-shadow-sm">الشجرة الرقمية</h1>
              <h2 className="text-[#7c6c53] text-[18px] font-bold m-0 mt-1">فرع: {rootNode.name.replace("فخذ ", "")}</h2>
            </div>

            {printMarkup && (
              <div className="flex-1 w-full flex items-center justify-center overflow-hidden" dangerouslySetInnerHTML={{ __html: printMarkup }} />
            )}
            
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {modalContent}
      {mounted && typeof document !== "undefined" ? createPortal(printArea, document.body) : null}
    </>
  );
}