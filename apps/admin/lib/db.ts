import mysql from "mysql2/promise";

// Reuses one pool across hot-reloads in dev instead of opening a new one per request.
declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

export const pool =
  global._mysqlPool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global._mysqlPool = pool;
}

// Re-exported so existing `import { VIRTUAL_ROOT_ID, FamilyNode } from "@/lib/db"`
// call sites in server code (API routes) keep working unchanged.
export { VIRTUAL_ROOT_ID } from "./constants";
export type { FamilyNode } from "./constants";
import { VIRTUAL_ROOT_ID, FamilyNode } from "./constants";

// Matches the live table: person(person_id, name_text, parent_id, birth_date,
// death_date, created_at, updated_at, branch_id).
export interface PersonRow {
  person_id: number;
  name_text: string;
  parent_id: number | null;
  birth_date: string | null;
  death_date: string | null;
  branch_id: string | null;
}

/** Turns the flat `person` table into the nested shape the front end expects. */
export function buildTree(rows: PersonRow[], parentId: number = VIRTUAL_ROOT_ID): FamilyNode[] {
  return rows
    .filter((r) => r.parent_id === parentId)
    .map((r) => {
      const children = buildTree(rows, r.person_id);
      const node: FamilyNode = {
        id: r.person_id,
        name: r.name_text,
        birth_date: r.birth_date,
        death_date: r.death_date,
      };
      if (children.length) node.children = children;
      return node;
    });
}

export async function fetchFullTree(): Promise<FamilyNode> {
  const [rows] = await pool.query<mysql.RowDataPacket[]>("SELECT * FROM person");
  return {
    id: VIRTUAL_ROOT_ID,
    name: "System_Root",
    birth_date: null,
    death_date: null,
    children: buildTree(rows as PersonRow[], VIRTUAL_ROOT_ID),
  };
}

/** Looks up the branch_id of an existing person, so new children can inherit it. */
export async function getBranchId(personId: number): Promise<string | null> {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT branch_id FROM person WHERE person_id = ? LIMIT 1",
    [personId]
  );
  const row = (rows as any[])[0];
  return row ? row.branch_id : null;
}