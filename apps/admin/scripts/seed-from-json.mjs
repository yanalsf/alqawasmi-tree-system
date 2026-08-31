// Rebuilds the `person` table from a tree.json backup (e.g. apps/public/data/tree.json).
// You likely don't need this — your database is already live and populated
// (per the schema you shared). This is here for disaster recovery / spinning
// up a fresh environment from a JSON backup only.
//
// Run:
//   cd apps/admin
//   node --env-file=.env.local scripts/seed-from-json.mjs [path/to/tree.json]

import mysql from "mysql2/promise";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TREE_JSON_PATH =
  process.argv[2] ?? path.join(__dirname, "..", "..", "public", "data", "tree.json");

const VIRTUAL_ROOT_ID = 941;

// Same matching rules the legacy front-end script uses to sort branch roots
// into their branch_id key (see the `branchNames` object in the old scripts).
const BRANCH_NAME_MATCHES = [
  ["dawoud", "داوود"],
  ["abu_nawara", "نواره"],
  ["al_sous", "الصوص"],
  ["abdullah", "عبدالله"],
  ["al_jadaa", "الجدع"],
  ["mohammed_sulaiman", "محمد سليمان"],
  ["younes", "يونس"],
  ["al_badawi", "بدوي"],
  ["mohammed_ali", "محمد علي"],
  ["abu_baid", "بيض"],
  ["al_khudair", "الخضير"],
  ["abdulhaq", "الحق"],
];

function branchIdForRootName(name) {
  const match = BRANCH_NAME_MATCHES.find(([, needle]) => name.includes(needle));
  return match ? match[0] : null;
}

function flatten(node, parentId, branchId, rows) {
  const isSyntheticRoot = node.name === "System_Root";

  if (!isSyntheticRoot) {
    rows.push({
      id: node.id,
      name: node.name,
      birth_date: node.birth_date ?? null,
      death_date: node.death_date ?? null,
      parent_id: parentId,
      branch_id: branchId,
    });
  }

  const nextParentId = isSyntheticRoot ? VIRTUAL_ROOT_ID : node.id;
  for (const child of node.children ?? []) {
    // A branch's own root determines branch_id for its whole subtree.
    const childBranchId = isSyntheticRoot ? branchIdForRootName(child.name) : branchId;
    flatten(child, nextParentId, childBranchId, rows);
  }
}

async function main() {
  const raw = await readFile(TREE_JSON_PATH, "utf-8");
  const tree = JSON.parse(raw);

  const rows = [];
  flatten(tree, null, null, rows);
  console.log(`Parsed ${rows.length} people from ${TREE_JSON_PATH}`);

  const unmatched = rows.filter((r) => r.parent_id === VIRTUAL_ROOT_ID && !r.branch_id);
  if (unmatched.length) {
    console.warn(
      "Warning: could not infer branch_id for these branch roots — fix BRANCH_NAME_MATCHES or set manually:",
      unmatched.map((r) => r.name)
    );
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const conn = await pool.getConnection();
  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const row of rows) {
      await conn.query(
        `INSERT INTO person (person_id, name_text, birth_date, death_date, parent_id, branch_id)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name_text = VALUES(name_text),
           birth_date = VALUES(birth_date),
           death_date = VALUES(death_date),
           parent_id = VALUES(parent_id),
           branch_id = VALUES(branch_id)`,
        [row.id, row.name, row.birth_date, row.death_date, row.parent_id, row.branch_id]
      );
    }
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log(`Inserted/updated ${rows.length} rows into person.`);
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
