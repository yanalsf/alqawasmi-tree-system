"use client";

import { useEffect, useRef } from "react";
import treeData from "@/data/tree.json";
import markupHtml from "@/lib/publicMarkup";
import mainScript from "@/lib/publicScriptMain";
import modalScript from "@/lib/publicScriptModal";

/**
 * This component ports the original index.html 1:1.
 *
 * Why it works this way instead of a rewritten React component tree:
 * the original page is ~2,600 lines of hand-written DOM manipulation
 * (renderPage(), rebuildSidebar(), the PDF/print export, the D3 visual
 * tree, etc). Manually re-implementing all of that as React state/JSX
 * cannot be verified pixel-for-pixel without a human clicking through
 * every screen — any typo in that translation is a silent visual or
 * functional regression. Instead:
 *
 *   1. The exact original markup is injected as-is (dangerouslySetInnerHTML).
 *   2. The exact original <script> contents (data.js + the two inline
 *      scripts) are executed as real classic <script> tags, in the same
 *      order, in the global scope — exactly like a plain HTML page —
 *      once the markup is in the DOM.
 *
 * The result behaves identically to the old site, because it IS the old
 * site's code, just delivered through Next.js. The only substantive change
 * is where treeData comes from: originally a static data.js file generated
 * by a local script; now data/tree.json, produced by the admin app's sync
 * step (see apps/admin/lib/sync.ts).
 */
export default function LegacyTreeApp() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return; // guards against React 18 dev double-invoke
    hasRun.current = true;

    const dataScript = `const treeData = ${JSON.stringify(treeData)};\n`;
    const combined = dataScript + mainScript + "\n" + modalScript;

    const scriptEl = document.createElement("script");
    scriptEl.text = combined;
    document.body.appendChild(scriptEl);

    return () => {
      // Single-page app — this only matters if the route is ever unmounted.
      scriptEl.remove();
    };
  }, []);

  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: markupHtml }} />;
}
