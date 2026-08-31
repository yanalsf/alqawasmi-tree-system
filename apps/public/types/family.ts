// apps/public/types/family.ts

/** One flattened row in the sidebar index (built from the tree by walking it). */
export interface FlatPerson {
  id: number;
  name: string;
  /** Depth in the tree — root's direct children are depth 0. Drives indent + dot opacity. */
  depth: number;
  /** Parent's display name, or null for a branch root. Rendered as "ابن {father}". */
  father: string | null;
}

/** One item in the header's branch-switcher dropdown. */
export interface Branch {
  id: string; // e.g. "dawoud" — matches person.branch_id in the DB
  label: string; // e.g. "فخذ داوود"
}