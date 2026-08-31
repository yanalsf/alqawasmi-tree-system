"use client";

import { useEffect, useRef } from "react";
import markupHtml from "@/lib/adminMarkup";
import initScript from "@/lib/adminScriptInit";
import mainScript from "@/lib/adminScriptMain";

/**
 * Ports editing.html 1:1 — same rationale as apps/public/app/LegacyTreeApp.tsx.
 * The legacy script already calls fetch('/api/tree'), fetch('/api/person', ...)
 * etc. with relative paths, which now hit this app's own Next.js API routes
 * (app/api/tree, app/api/person) instead of the old Express-style server —
 * no changes were needed to the fetch calls themselves for that to work.
 */
export default function LegacyAdminApp() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const combined = initScript + "\n" + mainScript;
    const scriptEl = document.createElement("script");
    scriptEl.text = combined;
    document.body.appendChild(scriptEl);

    return () => {
      scriptEl.remove();
    };
  }, []);

  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: markupHtml }} />;
}
