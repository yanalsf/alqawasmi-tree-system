// apps/public/lib/constants.ts
export const VIRTUAL_ROOT_ID = 941;

export interface FamilyNode {
  id: number;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  children?: FamilyNode[];
}