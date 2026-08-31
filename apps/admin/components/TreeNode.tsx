// apps/admin/components/TreeNode.tsx
"use client";

import { useState } from "react";
import type { FamilyNode } from "@/lib/constants";

interface TreeNodeProps {
  node: FamilyNode;
  onAddChild: (parentId: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onPrintLineage: (id: number) => void;
  onViewTree: (id: number) => void;
  /** Depth in the tree — 0 for branch roots, 1+ for everyone else. Only used
   *  for a subtle left-edge accent color, not a heavy background change. */
  depth?: number;
  /** Root branch nodes start expanded; deeper nodes start collapsed. */
  defaultExpanded?: boolean;
}

export default function TreeNode({
  node,
  onAddChild,
  onEdit,
  onDelete,
  onPrintLineage,
  onViewTree,
  depth = 0,
  defaultExpanded = false,
}: TreeNodeProps) {
  const [isExpanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = !!node.children?.length;
  const isRoot = depth === 0;

  return (
    <li className="animate-fade-slide">
      <div
        className={`group relative flex items-center justify-between gap-3 rounded-lg border
                    ${isRoot ? "border-r-4 border-r-gold-deep" : "border-r-4 border-r-green-2"}
                    border-y border-l border-y-gray-200 border-l-gray-200 bg-panel px-4 py-3
                    shadow-md transition-shadow duration-200 hover:shadow-lg`}
      >
        {/* Count badge — number of direct children */}
        {hasChildren && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 border-panel bg-maroon text-[10px] font-bold text-white">
            {node.children!.length}
          </span>
        )}

        {/* Expand/collapse toggle + name — explicit bg-transparent/border-0/p-0
            resets are required here since Preflight is disabled app-wide, so
            a bare <button> would otherwise render with native browser chrome
            (a light gray box) instead of blending into the card. */}
        <button
          type="button"
          onClick={() => hasChildren && setExpanded((v) => !v)}
          disabled={!hasChildren}
          className="flex min-w-0 flex-1 items-center gap-2 border-0 bg-transparent p-0 text-right disabled:cursor-default"
        >
          <span
            className={`flex-none text-xs text-ink-soft transition-transform duration-200 ${
              hasChildren ? "opacity-90" : "opacity-25"
            } ${isExpanded ? "rotate-90" : ""}`}
          >
            ◂
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate font-bold text-ink ${isRoot ? "font-ruqaa text-lg" : "text-sm"}`}>
              {node.name}
            </span>
            {(node.birth_date || node.death_date) && (
              <span className="block text-[11px] text-ink-soft">
                ({node.birth_date ?? "؟"} – {node.death_date ?? "..."})
              </span>
            )}
          </span>
        </button>

        {/* Action bar — clean flex row, revealed on hover/focus. Every button
            gets an explicit border-0/bg-transparent baseline (again, because
            Preflight is off) before its own visible background is layered on. */}
        <div
          className="flex flex-none items-center gap-1 opacity-0 transition-opacity duration-200
                     group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <button
            type="button"
            onClick={() => onViewTree(node.id)}
            title="عرض الشجرة المرئية"
            aria-label="عرض الشجرة المرئية"
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full border-0 bg-green-1/15 p-0 text-xs transition-colors hover:bg-green-1/30"
          >
            🌳
          </button>
          <button
            type="button"
            onClick={() => onPrintLineage(node.id)}
            title="طباعة النسب (PDF)"
            aria-label="طباعة النسب (PDF)"
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full border-0 bg-gold/15 p-0 text-xs transition-colors hover:bg-gold/30"
          >
            🖨️
          </button>
          <button
            type="button"
            onClick={() => onEdit(node.id)}
            title="تعديل البيانات"
            aria-label="تعديل البيانات"
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full border-0 bg-gold/15 p-0 text-xs transition-colors hover:bg-gold/30"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            title="حذف"
            aria-label="حذف"
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full border-0 bg-maroon/15 p-0 text-xs text-maroon transition-all hover:scale-110 hover:bg-maroon hover:text-white"
          >
            🗑️
          </button>
          <button
            type="button"
            onClick={() => onAddChild(node.id)}
            title="إضافة ابن"
            aria-label="إضافة ابن"
            className="flex h-7 flex-none items-center justify-center rounded-full border-0 bg-green-2 px-2.5 text-[11px] font-bold text-white transition-colors hover:bg-green-deep"
          >
            + ابن
          </button>
        </div>
      </div>

      {/* Smooth height animation for expand/collapse via the CSS grid-rows
          trick (0fr -> 1fr) — animates to any content height without
          measuring scrollHeight in JS. */}
      {hasChildren && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <ul className="m-0 mr-5 mt-2 flex list-none flex-col gap-2 border-r border-gold/25 p-0 pr-4">
              {node.children!.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPrintLineage={onPrintLineage}
                  onViewTree={onViewTree}
                  depth={depth + 1}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}