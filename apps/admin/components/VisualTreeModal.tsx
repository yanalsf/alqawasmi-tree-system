// apps/admin/components/VisualTreeModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { jsPDF } from "jspdf";
import type { FamilyNode } from "@/lib/constants";

interface VisualTreeModalProps {
  isOpen: boolean;
  rootNode: FamilyNode | null;
  onClose: () => void;
}

function drawDecorativePrintBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, w, h);

  const bloomTL = ctx.createRadialGradient(w * 0.07, h * 0.05, 0, w * 0.07, h * 0.05, Math.max(w, h) * 0.55);
  bloomTL.addColorStop(0, "rgba(201,151,79,0.16)");
  bloomTL.addColorStop(1, "rgba(201,151,79,0)");
  ctx.fillStyle = bloomTL;
  ctx.fillRect(0, 0, w, h);

  const bloomBR = ctx.createRadialGradient(w * 0.95, h * 0.96, 0, w * 0.95, h * 0.96, Math.max(w, h) * 0.55);
  bloomBR.addColorStop(0, "rgba(76,122,63,0.13)");
  bloomBR.addColorStop(1, "rgba(76,122,63,0)");
  ctx.fillStyle = bloomBR;
  ctx.fillRect(0, 0, w, h);

  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.38, w / 2, h / 2, Math.max(w, h) * 0.74);
  vignette.addColorStop(0, "rgba(58,44,30,0)");
  vignette.addColorStop(1, "rgba(58,44,30,0.055)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

export default function VisualTreeModal({ isOpen, rootNode, onClose }: VisualTreeModalProps) {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const minimapWrapRef = useRef<HTMLDivElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const minimapViewportRef = useRef<HTMLDivElement>(null);
  
  const [isExporting, setExporting] = useState(false);

  // لحفظ حالة الميني ماب لاستخدامها في التفاعل
  const mmStateRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || !rootNode || !canvasHostRef.current || !minimapWrapRef.current || !minimapCanvasRef.current || !minimapViewportRef.current) return;

    const host = canvasHostRef.current;
    // تنظيف الـ SVG القديم فقط لتجنب تكرار الرسم
    const oldSvg = host.querySelector("svg");
    if (oldSvg) oldSvg.remove();

    const root = d3.hierarchy(rootNode as any);

    const totalLeaves = root.leaves().length;
    const maxTreeDepth = root.height;
    const dx = Math.max(400, 500 - totalLeaves * 6);
    const dy = Math.max(750, 1150 - maxTreeDepth * 55);

    const layout = d3.tree<FamilyNode>().nodeSize([dx, dy]);
    layout(root as any);

    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    root.each((d: any) => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
      if (d.y > y1) y1 = d.y;
      if (d.y < y0) y0 = d.y;
    });

    const treeWidth = x1 - x0 + dx * 2;
    const treeHeight = y1 - y0 + dy * 2;

    const svg = d3.select(host)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background", "var(--paper)")
      .style("cursor", "grab");

    const g = svg.append("g");

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        updateMinimapViewport(event.transform);
      });

    svg.call(zoomBehavior as any);

    // رسم الخطوط (الروابط)
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "var(--green-1)")
      .attr("stroke-width", 10)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("d", d3.linkVertical().x((d: any) => d.x).y((d: any) => d.y) as any);

    // رسم العقد (أوراق الشجر)
    const node = g.append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    const leafPath = "M0,20 C-25,10 -30,-20 0,-40 C30,-20 25,10 0,20 Z";

    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id", "goldGrad").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%");
    grad.append("stop").attr("offset", "0%").style("stop-color", "#d3a765");
    grad.append("stop").attr("offset", "100%").style("stop-color", "#8a5f2e");

    node.append("path")
      .attr("d", leafPath)
      .attr("fill", (d: any) => (d.depth === 0 ? "url(#goldGrad)" : "var(--green-deep)"))
      .attr("stroke", (d: any) => (d.depth === 0 ? "var(--gold-deep)" : "#2d4a25"))
      .attr("stroke-width", 2)
      .attr("transform", (d: any) => {
        if (d.depth === 0) return "scale(13)";
        return d.x < 0 ? "scale(10) rotate(-25)" : "scale(10) rotate(25)";
      })
      .style("filter", "drop-shadow(0px 6px 10px rgba(0,0,0,0.15))");

    node.append("text")
      .attr("dy", "0.35em")
      .attr("fill", (d: any) => (d.depth === 0 ? "#fff" : "var(--paper)"))
      .attr("font-family", "'Cairo', sans-serif")
      .attr("font-size", (d: any) => (d.depth === 0 ? "120px" : "100px"))
      .attr("font-weight", "800")
      .style("text-anchor", "middle")
      .attr("transform", (d: any) => {
        if (d.depth === 0) return "translate(5, -95)";
        return d.x < 0 ? "translate(-18, -70)" : "translate(18, -70)";
      })
      .text((d: any) => d.data.name);

    // توسيط الشجرة عند الفتح
    const clientWidth = host.clientWidth || 800;
    const clientHeight = host.clientHeight || 600;
    const initialScale = Math.min(clientWidth / treeWidth, clientHeight / treeHeight, 1) * 0.95;
    const initialX = (clientWidth - (x1 + x0) * initialScale) / 2;
    const initialY = (clientHeight - (y1 + y0) * initialScale) / 2;

    svg.call(zoomBehavior.transform as any, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

    // ==========================================
    // منطق الـ Mini-map (الخريطة المصغرة)
    // ==========================================
    function buildMinimap() {
      const wrap = minimapWrapRef.current!;
      const canvas = minimapCanvasRef.current!;
      wrap.style.display = 'block';

      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, cw * dpr);
      canvas.height = Math.max(1, ch * dpr);
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';

      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      const pad = 10;
      const boundsW = Math.max(1, x1 - x0);
      const boundsH = Math.max(1, y1 - y0);
      const scale = Math.min((cw - pad * 2) / boundsW, (ch - pad * 2) / boundsH);
      const drawnW = boundsW * scale, drawnH = boundsH * scale;
      const offX = (cw - drawnW) / 2;
      const offY = (ch - drawnH) / 2;

      const toMmX = (tx: number) => offX + (tx - x0) * scale;
      const toMmY = (ty: number) => offY + (ty - y0) * scale;

      // قراءة الألوان من CSS
      const styles = getComputedStyle(document.body);
      const linkColor = (styles.getPropertyValue('--green-1') || '#7ba869').trim();
      const rootColor = (styles.getPropertyValue('--gold-deep') || '#8a5f2e').trim();
      const nodeColor = (styles.getPropertyValue('--green-2') || '#4c7a3f').trim();

      ctx.strokeStyle = linkColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.85;
      root.links().forEach((link: any) => {
        ctx.beginPath();
        ctx.moveTo(toMmX(link.source.x), toMmY(link.source.y));
        ctx.lineTo(toMmX(link.target.x), toMmY(link.target.y));
        ctx.stroke();
      });

      ctx.globalAlpha = 1;
      root.descendants().forEach((d: any) => {
        ctx.beginPath();
        ctx.fillStyle = d.depth === 0 ? rootColor : nodeColor;
        ctx.arc(toMmX(d.x), toMmY(d.y), d.depth === 0 ? 3.5 : 2, 0, Math.PI * 2);
        ctx.fill();
      });

      mmStateRef.current = { cw, ch, scale, offX, offY, toMmX, toMmY, svg, zoomBehavior, x0, y0 };
    }

    function updateMinimapViewport(transform: any) {
      if (!mmStateRef.current || !minimapViewportRef.current) return;
      const state = mmStateRef.current;
      const viewportEl = minimapViewportRef.current;
      
      const cw = host.clientWidth, ch = host.clientHeight;
      const k = transform.k;
      const treeX0 = -transform.x / k;
      const treeY0 = -transform.y / k;
      const treeX1 = (cw - transform.x) / k;
      const treeY1 = (ch - transform.y) / k;

      let px0 = state.toMmX(treeX0);
      let py0 = state.toMmY(treeY0);
      let px1 = state.toMmX(treeX1);
      let py1 = state.toMmY(treeY1);

      px0 = Math.max(0, Math.min(state.cw, px0));
      px1 = Math.max(0, Math.min(state.cw, px1));
      py0 = Math.max(0, Math.min(state.ch, py0));
      py1 = Math.max(0, Math.min(state.ch, py1));

      viewportEl.style.left = px0 + 'px';
      viewportEl.style.top = py0 + 'px';
      viewportEl.style.width = Math.max(4, px1 - px0) + 'px';
      viewportEl.style.height = Math.max(4, py1 - py0) + 'px';
    }

    buildMinimap();
    updateMinimapViewport(d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

  }, [isOpen, rootNode]);

  // ==========================================
  // أحداث التنقل بواسطة الميني ماب
  // ==========================================
  const handleMinimapInteraction = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, animated: boolean) => {
    if (!mmStateRef.current || !canvasHostRef.current || !minimapCanvasRef.current) return;
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const rect = minimapCanvasRef.current.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    const state = mmStateRef.current;
    const treeX = state.x0 + (px - state.offX) / state.scale;
    const treeY = state.y0 + (py - state.offY) / state.scale;
    
    const k = d3.zoomTransform(state.svg.node()).k;
    const tx = canvasHostRef.current.clientWidth / 2 - treeX * k;
    const ty = canvasHostRef.current.clientHeight / 2 - treeY * k;

    if (animated) {
      state.svg.transition().duration(300).call(state.zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    } else {
      state.svg.call(state.zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    }
  };

  useEffect(() => {
    const viewport = minimapViewportRef.current;
    if (!viewport) return;
    
    let isDragging = false;
    
    const onMouseDown = (e: MouseEvent) => { isDragging = true; e.preventDefault(); e.stopPropagation(); };
    const onMouseMove = (e: MouseEvent) => { if (isDragging) handleMinimapInteraction(e, false); };
    const onMouseUp = () => { isDragging = false; };
    
    const onTouchStart = (e: TouchEvent) => { isDragging = true; e.stopPropagation(); };
    const onTouchMove = (e: TouchEvent) => { if (isDragging) handleMinimapInteraction(e, false); };
    const onTouchEnd = () => { isDragging = false; };

    viewport.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    viewport.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      viewport.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      viewport.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isOpen]);

  // دالة الاستخراج بصيغة PDF
  async function handleExportPdf() {
    if (!rootNode) return;
    const userConsent = window.confirm("هل ترغب في حفظ هذه الشجرة كملف PDF عالي الدقة؟");
    if (!userConsent) return;

    const liveSvg = canvasHostRef.current?.querySelector("svg");
    if (!liveSvg) return window.alert("لم يتم العثور على الشجرة.");

    setExporting(true);
    try {
      await (document as any).fonts?.ready;
      const liveG = liveSvg.querySelector("g")!;
      const bbox = liveG.getBBox();
      let minX = bbox.x, maxX = bbox.x + bbox.width, minY = bbox.y, maxY = bbox.y + bbox.height;
      if (!isFinite(minX) || bbox.width === 0) { minX = 0; maxX = 1000; minY = 0; maxY = 1000; }

      const clonedSvg = liveSvg.cloneNode(true) as SVGSVGElement;
      const clonedG = clonedSvg.querySelector("g")!;

      clonedSvg.setAttribute("dir", "ltr");
      clonedSvg.style.direction = "ltr";

      const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
      styleEl.textContent = `text { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif !important; font-weight: bold !important; }`;
      clonedSvg.prepend(styleEl);

      const safePadding = 600;
      const width = Math.ceil(maxX - minX + safePadding * 2);
      const height = Math.ceil(maxY - minY + safePadding * 2);

      clonedG.setAttribute("transform", `translate(${-minX + safePadding}, ${-minY + safePadding}) scale(1)`);

      const frameMargin = 100;
      const outerFrame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      outerFrame.setAttribute("x", String(frameMargin)); outerFrame.setAttribute("y", String(frameMargin));
      outerFrame.setAttribute("width", String(width - frameMargin * 2)); outerFrame.setAttribute("height", String(height - frameMargin * 2));
      outerFrame.setAttribute("fill", "none"); outerFrame.setAttribute("stroke", "#8a5f2e"); outerFrame.setAttribute("stroke-width", "10");
      clonedSvg.appendChild(outerFrame);

      const innerFrame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      innerFrame.setAttribute("x", String(frameMargin + 30)); innerFrame.setAttribute("y", String(frameMargin + 30));
      innerFrame.setAttribute("width", String(width - frameMargin * 2 - 60)); innerFrame.setAttribute("height", String(height - frameMargin * 2 - 60));
      innerFrame.setAttribute("fill", "none"); innerFrame.setAttribute("stroke", "#c9974f"); innerFrame.setAttribute("stroke-width", "4");
      clonedSvg.appendChild(innerFrame);

      const printedCount = countDescendants(rootNode);
      const todayDate = new Date().toLocaleDateString("ar-JO", { year: "numeric", month: "long", day: "numeric" });

      const footerInfo = document.createElementNS("http://www.w3.org/2000/svg", "text");
      footerInfo.setAttribute("x", String(width / 2 - 80));
      footerInfo.setAttribute("y", String(height - (frameMargin + 30) - 60));
      footerInfo.setAttribute("text-anchor", "middle");
      footerInfo.setAttribute("fill", "#8a5f2e");
      footerInfo.setAttribute("font-size", "150px");
      footerInfo.setAttribute("font-weight", "bold");
      footerInfo.setAttribute("font-family", "'Cairo', sans-serif");
      footerInfo.textContent = `عدد الأفراد في هذه الوثيقة: ${printedCount} فرد | تاريخ الطباعة: ${todayDate}`;
      clonedSvg.appendChild(footerInfo);

      clonedSvg.style.width = `${width}px`; clonedSvg.style.height = `${height}px`;
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clonedSvg.setAttribute("width", String(width)); clonedSvg.setAttribute("height", String(height));
      clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.src = url;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_CANVAS_DIMENSION = 4000;
          let scale = 2;
          if (width * scale > MAX_CANVAS_DIMENSION || height * scale > MAX_CANVAS_DIMENSION) {
            scale = Math.min(MAX_CANVAS_DIMENSION / width, MAX_CANVAS_DIMENSION / height);
          }
          canvas.width = width * scale; canvas.height = height * scale;
          const ctx = canvas.getContext("2d")!;

          drawDecorativePrintBackground(ctx, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, width, height);

          const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? "landscape" : "portrait", unit: "px", format: [canvas.width, canvas.height] });
          const imgData = canvas.toDataURL("image/jpeg", 0.9);
          pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
          pdf.save(`شجرة_نسب_${rootNode.name}.pdf`);

          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => reject(new Error("SVG rasterization failed"));
      });
    } catch (err) {
      window.alert("تعذر تصدير الملف. حاول مرة أخرى.");
    } finally {
      setExporting(false);
    }
  }

  if (!isOpen || !rootNode) return null;

  return (
    <div className="fixed inset-0 z-[900] flex flex-col bg-black/50 font-cairo">
      <div className="flex items-center justify-between bg-panel px-4 py-3 shadow-md">
        <h2 className="text-base font-extrabold text-gold-deep">شجرة نسب: {rootNode.name}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={handleExportPdf} disabled={isExporting} className="rounded-lg bg-gold-deep px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {isExporting ? "جارٍ التصدير..." : "💾 حفظ كـ PDF"}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg bg-maroon px-4 py-2 text-sm font-bold text-white">
            ✕ إغلاق
          </button>
        </div>
      </div>

      <div className="relative flex-1 touch-none select-none overflow-hidden">
        {/* حاوية الشجرة D3 */}
        <div ref={canvasHostRef} className="absolute inset-0" />
        
        {/* الخريطة المصغرة (Mini-map) */}
        <div ref={minimapWrapRef} className="minimap-wrap" title="خريطة الشجرة — اضغط أو اسحب للتنقل" style={{ display: 'none' }}>
          <span className="minimap-label">خريطة الشجرة</span>
          <canvas ref={minimapCanvasRef} onClick={(e) => handleMinimapInteraction(e, true)} onTouchStart={(e) => handleMinimapInteraction(e, true)} />
          <div ref={minimapViewportRef} className="minimap-viewport" />
        </div>
      </div>
    </div>
  );
}

function countDescendants(node: FamilyNode): number {
  return 1 + (node.children ?? []).reduce((sum, child) => sum + countDescendants(child), 0);
}