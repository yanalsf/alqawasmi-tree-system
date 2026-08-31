// apps/admin/lib/branches.ts

export interface Branch {
  id: string; // matches person.branch_id in the DB
  label: string;
}

// Same 12 branches as the public site's header dropdown (data-branch values).
export const BRANCHES: Branch[] = [
  { id: "dawoud", label: "فخذ داوود" },
  { id: "abu_nawara", label: "فخذ ابو نواره" },
  { id: "al_sous", label: "فخذ الصوص" },
  { id: "abdullah", label: "فخذ عبدالله" },
  { id: "al_jadaa", label: "فخذ الجدع" },
  { id: "mohammed_sulaiman", label: "فخذ محمد سليمان" },
  { id: "younes", label: "فخذ يونس" },
  { id: "al_badawi", label: "فخذ البدوي" },
  { id: "mohammed_ali", label: "فخذ محمد علي" },
  { id: "abu_baid", label: "فخذ ابو بيض" },
  { id: "al_khudair", label: "فخذ الخضير" },
  { id: "abdulhaq", label: "فخذ عبد الحق" },
];