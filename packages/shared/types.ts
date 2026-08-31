export interface FamilyNode {
  id: number;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  children?: FamilyNode[];
}
