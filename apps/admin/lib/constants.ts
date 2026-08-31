// apps/admin/lib/constants.ts
//
// Plain constants/types only — no imports of mysql2 or anything Node-only.
// Both server code (lib/db.ts, API routes) and client components
// (AddPersonModal, AdminTreeView) import from here, so the browser bundle
// never accidentally pulls in the database driver.

// The id used as `parent_id` for every branch root (داوود, ابو نواره, ...).
// Not a real row in `person` — same synthetic root id the old data.js used
// ("System_Root", id 941). Only ever appears as a parent_id value.
export const VIRTUAL_ROOT_ID = 941;

// The shape the front-end consumes (same property names as the old data.js /
// treeData object) — deliberately different from the DB column names.
export interface FamilyNode {
  id: number;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  children?: FamilyNode[];
}