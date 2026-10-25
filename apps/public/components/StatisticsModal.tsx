"use client";
 
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import treeDataRaw from "@/data/tree.json";
import type { FamilyNode } from "../lib/constants";
import { BRANCHES, withFounderNames } from "../lib/branches";
 
import { useT } from "../lib/i18n";
const tree = withFounderNames(treeDataRaw as unknown as FamilyNode);
const VIRTUAL_ROOT_ID = 941;
 
interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** الشجرة التي تُحسب منها أرقام تبويب "هذا الفخذ" (الفخذ الحالي). إن لم تُمرَّر تُحسب كل العائلة. */
  root?: FamilyNode;
}
 
// ───────────── دوال الحساب ─────────────
function cleanName(name: string) {
  return name.replace("فخذ ", "").trim();
}
function firstNameOf(name: string) {
  return cleanName(name).split(" ")[0];
}
 
/** إحصائيات فخذ واحد (أو أي شجرة) */
function computeStats(root: FamilyNode) {
  let total = 0;
  let dead = 0;
  const generations: Record<number, number> = {};
  const nameCounts: Record<string, number> = {};
 
  function walk(node: FamilyNode, depth: number) {
    if (node.id !== VIRTUAL_ROOT_ID) {
      total++;
      if (node.death_date) dead++;
      generations[depth] = (generations[depth] || 0) + 1;
      const fn = firstNameOf(node.name);
      if (fn && fn.length > 2) nameCounts[fn] = (nameCounts[fn] || 0) + 1;
    }
    const nextDepth = node.id !== VIRTUAL_ROOT_ID ? depth + 1 : depth;
    node.children?.forEach((c) => walk(c, nextDepth));
  }
  walk(root, 1);
 
  const genArray = Object.entries(generations)
    .map(([depth, count]) => ({ depth: parseInt(depth), count }))
    .sort((a, b) => a.depth - b.depth);
  const maxGenCount = Math.max(...genArray.map((g) => g.count), 1);
  const topNames = Object.entries(nameCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
 
  return { total, dead, alive: total - dead, generations: genArray, maxGenCount, topNames };
}
 
/** إحصائيات تجمع كل الأفخاذ */
function computeFamilyStats() {
  const branchRows = BRANCHES.map((b) => {
    const node = tree.children?.find((c) => c.id === b.rootId);
    const s = node ? computeStats({ ...tree, children: [node] }) : null;
    return {
      id: b.id,
      label: b.label,
      color: b.color as string,
      total: s?.total ?? 0,
      dead: s?.dead ?? 0,
      alive: s?.alive ?? 0,
    };
  });
 
  let total = 0;
  let dead = 0;
  const generations: Record<number, number> = {};
  const nameCounts: Record<string, number> = {};
 
  function walk(node: FamilyNode, depth: number) {
    const real = node.id !== VIRTUAL_ROOT_ID;
    if (real) {
      total++;
      if (node.death_date) dead++;
      generations[depth] = (generations[depth] || 0) + 1;
      const fn = firstNameOf(node.name);
      if (fn && fn.length > 2) nameCounts[fn] = (nameCounts[fn] || 0) + 1;
    }
    const nextDepth = real ? depth + 1 : depth;
    node.children?.forEach((c) => walk(c, nextDepth));
  }
  walk(tree, 1);
 
  const genArray = Object.entries(generations)
    .map(([depth, count]) => ({ depth: parseInt(depth), count }))
    .sort((a, b) => a.depth - b.depth);
  const topNames = Object.entries(nameCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const sortedBranches = [...branchRows].sort((a, b) => b.total - a.total);
 
  return {
    total,
    dead,
    alive: total - dead,
    branches: sortedBranches,
    maxBranch: Math.max(...branchRows.map((b) => b.total), 1),
    branchCount: branchRows.length,
    generations: genArray,
    maxGenCount: Math.max(...genArray.map((g) => g.count), 1),
    topNames,
    depth: genArray.length,
  };
}
 
export default function StatisticsModal({ isOpen, onClose, root }: StatisticsModalProps) {
  const { t } = useT();
  const [tab, setTab] = useState<"family" | "branch">("family");
 
  const stats = useMemo(() => computeStats(root ?? tree), [root]);
  const fam = useMemo(() => computeFamilyStats(), []);
 
  const getGenName = (num: number) => {
    const names = ["", t("الأول"), t("الثاني"), t("الثالث"), t("الرابع"), t("الخامس"), t("السادس"), t("السابع"), t("الثامن"), t("التاسع"), t("العاشر"), t("الحادي عشر"), t("الثاني عشر")];
    return names[num] || num.toString();
  };
 
  const card = "bg-white dark:bg-[#24201a] p-4 rounded-2xl border border-[rgb(var(--b-mid-rgb)/0.2)] dark:border-[rgb(var(--b-lite-rgb)/0.2)] shadow-sm";
  const cardTitle = "text-[13px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] mb-3 text-center";
 
  const NumberCards = ({ total, alive, dead }: { total: number; alive: number; dead: number }) => (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-gradient-to-b from-[rgb(var(--b-mid-rgb)/0.1)] to-[rgb(var(--b-mid-rgb)/0.05)] dark:from-[rgb(var(--b-lite-rgb)/0.1)] dark:to-transparent p-3 rounded-2xl text-center border border-[rgb(var(--b-mid-rgb)/0.3)] dark:border-[rgb(var(--b-lite-rgb)/0.2)] shadow-sm">
        <div className="text-[22px] font-extrabold text-[#5c4a38] dark:text-[#f3ede1]">{total}</div>
        <div className="text-[11px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/0.8)] mt-1">{t("عدد الأفراد")}</div>
      </div>
      <div className="bg-gradient-to-b from-green-50 to-white dark:from-green-900/20 dark:to-[#1c1915] p-3 rounded-2xl text-center border border-green-200 dark:border-green-900/30 shadow-sm">
        <div className="text-[22px] font-extrabold text-green-700 dark:text-green-400">{alive}</div>
        <div className="text-[11px] font-bold text-green-600 dark:text-green-500/80 mt-1">{t("عدد الأحياء")}</div>
      </div>
      <div className="bg-gradient-to-b from-gray-100 to-white dark:from-gray-800/40 dark:to-[#1c1915] p-3 rounded-2xl text-center border border-gray-200 dark:border-gray-700/50 shadow-sm">
        <div className="text-[22px] font-extrabold text-gray-600 dark:text-gray-300">{dead}</div>
        <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-1">{t("عدد الأموات")}</div>
      </div>
    </div>
  );
 
  const Note = () => (
    <div className="flex items-start gap-2 bg-orange-50/80 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-900/30 rounded-xl px-4 py-3">
      <span className="text-orange-500 text-[14px]">⚠️</span>
      <p className="text-[11px] font-bold text-orange-700/80 dark:text-orange-400/80 m-0 leading-relaxed text-right">
        <span className="font-extrabold">{t("ملاحظة:")}</span>  {t("أرقام الأحياء والأموات تقريبية، حيث أن تواريخ الوفاة لبعض الأفراد (خاصة من الأجيال القديمة) قد لا تكون متوفرة أو موثقة بالكامل في النظام.")}
      </p>
    </div>
  );
 
  const GenChart = ({ gens, max }: { gens: { depth: number; count: number }[]; max: number }) => (
    <div className={card}>
      <h3 className={`${cardTitle} !mb-5`}>{t("عدد الأفراد لكل جيل")}</h3>
      <div className="flex items-end justify-center gap-1.5 h-32 mt-2 px-1">
        {gens.map((gen) => (
          <div key={gen.depth} className="flex flex-col items-center flex-1 group relative h-full justify-end">
            <span className="absolute -top-7 text-[11px] font-bold text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md z-10">{gen.count}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(gen.count / max) * 100}%` }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
              className="w-full max-w-[28px] min-w-[12px] bg-gradient-to-t from-[rgb(var(--b-mid-rgb)/1)] to-[rgb(var(--b-soft-rgb)/1)] dark:from-[rgb(var(--b-ink-rgb)/1)] dark:to-[rgb(var(--b-strong-rgb)/1)] rounded-t-lg opacity-85 group-hover:opacity-100 transition-opacity shadow-sm"
            />
            <span className="text-[9.5px] sm:text-[10px] font-bold text-[#5c4a38] dark:text-[#9a8c78] mt-2 block whitespace-nowrap">{getGenName(gen.depth)}</span>
          </div>
        ))}
      </div>
    </div>
  );
 
  const NamesList = ({ names }: { names: [string, number][] }) => (
    <div className={card}>
      <h3 className={cardTitle}>{t("أكثر الأسماء تكراراً")}</h3>
      <div className="flex flex-col gap-2">
        {names.map(([name, count], index) => (
          <div key={name} className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-2 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[rgb(var(--b-mid-rgb)/0.2)] dark:bg-[rgb(var(--b-lite-rgb)/0.2)] text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] text-[10px] font-bold">{index + 1}</span>
              <span className="text-[13px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">{name}</span>
            </div>
            <span className="text-[12px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] bg-[rgb(var(--b-mid-rgb)/0.1)] dark:bg-[rgb(var(--b-lite-rgb)/0.1)] px-2.5 py-0.5 rounded-md">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
 
  const Fact = ({ icon, value, label, sub }: { icon: string; value: string | number; label: string; sub?: string }) => (
    <div className="bg-white dark:bg-[#24201a] p-3 rounded-2xl border border-[rgb(var(--b-mid-rgb)/0.2)] dark:border-[rgb(var(--b-lite-rgb)/0.2)] shadow-sm text-center">
      <div className="text-xl">{icon}</div>
      <div className="text-[18px] font-extrabold text-[#5c4a38] dark:text-[#f3ede1] leading-tight mt-0.5">{value}</div>
      <div className="text-[10.5px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/0.85)] mt-0.5">{label}</div>
      {sub ? <div className="text-[10px] font-semibold text-gray-400 dark:text-[#9a8c78] mt-0.5 line-clamp-1">{sub}</div> : null}
    </div>
  );
 
  const tabBtn = (key: "family" | "branch", label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`cursor-pointer flex-1 rounded-xl py-2 text-[13px] font-extrabold transition-all border-none outline-none ${
        tab === key
          ? "bg-gradient-to-l from-[rgb(var(--b-deep-rgb)/1)] to-[rgb(var(--b-mid-rgb)/1)] text-white shadow-md"
          : "bg-transparent text-[#7a6652] dark:text-gray-400 hover:bg-[rgb(var(--b-mid-rgb)/0.1)]"
      }`}
    >
      {label}
    </button>
  );
 
  const alivePct = fam.total ? Math.round((fam.alive / fam.total) * 100) : 0;
 
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
 
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden rounded-3xl bg-[#fdfbf7] border border-[rgb(var(--b-mid-rgb)/0.3)] shadow-2xl dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.2)]"
          >
            {/* الجزء العلوي الثابت */}
            <div className="relative pt-6 pb-3 shrink-0 z-10 bg-[#fdfbf7] dark:bg-[#1c1915] rounded-t-3xl px-6">
              <button onClick={onClose} className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border-none outline-none focus:outline-none focus:ring-0 dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30">✕</button>
 
              <div className="text-center">
                <span className="text-3xl mb-2 block">📊</span>
                <h2 className="text-2xl font-bold text-[rgb(var(--b-deep-rgb)/1)] font-ruqaa dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("الإحصائيات")}</h2>
              </div>
 
              <div className="mt-4 flex gap-1 rounded-2xl bg-[rgb(var(--b-mid-rgb)/0.08)] dark:bg-white/5 p-1">
                {tabBtn("family", t("كل العائلة"))}
                {tabBtn("branch", t("هذا الفخذ"))}
              </div>
            </div>
 
            {/* المحتوى (قابل للتمرير) */}
            <div className="p-6 pt-2 overflow-y-auto sidebar-scroll space-y-5">
              {tab === "family" ? (
                <>
                  <NumberCards total={fam.total} alive={fam.alive} dead={fam.dead} />
 
                  {/* شريط الأحياء مقابل الأموات */}
                  <div className={card}>
                    <div className="flex items-center justify-between text-[11px] font-bold mb-2">
                      <span className="text-green-700 dark:text-green-400">{t("الأحياء")} {alivePct}%</span>
                      <span className="text-gray-500 dark:text-gray-400">{t("الأموات")} {100 - alivePct}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${alivePct}%` }} transition={{ duration: 0.9 }} className="h-full bg-gradient-to-l from-green-500 to-green-600" />
                    </div>
                  </div>
 
                  {/* حقائق لافتة */}
                  <div className="grid grid-cols-2 gap-3">
                    <Fact icon="🌿" value={fam.branchCount} label={t("عدد الأفخاذ")} />
                    <Fact icon="🧬" value={fam.depth} label={t("عدد الأجيال")} />
                  </div>
 
                  <Note />
 
                  {/* مقارنة الأفخاذ */}
                  <div className={card}>
                    <h3 className={cardTitle}>{t("مقارنة الأفخاذ")}</h3>
                    <div className="flex flex-col gap-3">
                      {fam.branches.map((b, i) => (
                        <div key={b.id}>
                          <div className="flex items-center justify-between text-[12px] font-bold mb-1">
                            <span className="text-[#5c4a38] dark:text-[#f3ede1]">{i + 1}. {t(b.label)}</span>
                            <span className="text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)]">
                              {b.total} <span className="text-[10px] text-gray-400 font-semibold">({b.alive} {t("حي")})</span>
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(b.total / fam.maxBranch) * 100}%` }}
                              transition={{ duration: 0.8, delay: i * 0.04 }}
                              className="h-full rounded-full"
                              style={{ background: b.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
 
                  <GenChart gens={fam.generations} max={fam.maxGenCount} />
 
                  <NamesList names={fam.topNames} />
                </>
              ) : (
                <>
                  <NumberCards total={stats.total} alive={stats.alive} dead={stats.dead} />
                  <Note />
                  <GenChart gens={stats.generations} max={stats.maxGenCount} />
                  <NamesList names={stats.topNames} />
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}