// apps/public/components/PublicTreeView.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import treeDataRaw from "@/data/tree.json";
import type { FamilyNode } from "../lib/constants";
import { BRANCHES, applyBranchTheme, branchCardVars, getBranchById, getBranchByRootId, type BranchDef } from "../lib/branches";
import Header from "./Header";
import Sidebar from "./Sidebar";
import VisualTreeModal from "./VisualTreeModal";
import LineageCertificateModal from "./LineageCertificateModal";
import AddMemberModal from "@/components/AddMemberModal";
import FeaturesMenuModal from './FeaturesMenuModal';
import KinshipModal from './KinshipModal';
import StatisticsModal from './StatisticsModal';
import FamilyAboutModal from './FamilyAboutModal';
import ComplaintsModal from './ComplaintsModal';
import EditRequestModal from './EditRequestModal';
import SequenceModal from './SequenceModal';
import IosInstallPrompt from "./IosInstallPrompt";
import BranchPosterModal from './BranchPosterModal';

import { LangProvider, useT } from "../lib/i18n";
const VIRTUAL_ROOT_ID = 941;
const treeAr = treeDataRaw as unknown as FamilyNode;

// --- تحكم مؤقت بعرض بعض العناصر ---
// لإعادة إظهار أي عنصر: غيّر قيمته إلى true. لا يتم حذف أي كود، فقط إخفاء مؤقت.
const SHOW_FULL_SEQUENCE_BUTTON = false; // زر "عرض التسلسل الكامل لشجرة العائلة" + نافذة SequenceModal
const SHOW_BRANCH_CARDS = true; // بطاقات اختيار الفخوذ (الشبكة)
// قائمة الأفخاذ وألوانها صارت في lib/branches.ts (ملف واحد تعدّل منه)

// كل الفخوذ ظاهرة
const VISIBLE_BRANCH_IDS = BRANCHES.map((b) => b.id);

function findNodeById(node: FamilyNode, id: number): FamilyNode | null {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}
/** نسخة من الشجرة بأسماء محوَّلة (تُستخدم لما تكون اللغة English حتى تأخذ كل المكونات الأسماء الإنجليزية تلقائياً). */
function mapTreeNames(node: FamilyNode, fn: (name: string) => string): FamilyNode {
  return { ...node, name: fn(node.name), children: node.children?.map((c) => mapTreeNames(c, fn)) };
}
function findNodeByNameIncluding(node: FamilyNode, part: string): FamilyNode | null {
  if (node.id !== VIRTUAL_ROOT_ID && node.name.includes(part)) return node;
  for (const child of node.children ?? []) {
    const found = findNodeByNameIncluding(child, part);
    if (found) return found;
  }
  return null;
}
function countDescendants(node: FamilyNode): number {
  let n = 0;
  if (node.children) {
    n += node.children.length;
    node.children.forEach(c => (n += countDescendants(c)));
  }
  return n;
}
function countAllPeople(node: FamilyNode): number {
  const ownCount = node.id === VIRTUAL_ROOT_ID ? 0 : 1;
  const childCount = (node.children ?? []).reduce((sum, child) => sum + countAllPeople(child), 0);
  return ownCount + childCount;
}
function getPathToRoot(root: FamilyNode, id: number): FamilyNode[] | null {
  if (root.id === id) return [root];
  for (const child of root.children ?? []) {
    const path = getPathToRoot(child, id);
    if (path) return [root, ...path];
  }
  return null;
}

function calculateAgeDisplay(birthStr: string | null | undefined, deathStr: string | null | undefined, t: (ar: string, vars?: Record<string, string | number>) => string) {
  if (!birthStr && !deathStr) return null;

  const birthYear = birthStr ? parseInt(String(birthStr).split('-')[0]) : null;
  const deathYear = deathStr ? parseInt(String(deathStr).split('-')[0]) : null;
  const currentYear = new Date().getFullYear();

  if (birthYear && deathYear) {
    return t("{birth} - {death} (عاش {years} عاماً)", { birth: birthYear, death: deathYear, years: deathYear - birthYear });
  } else if (birthYear && !deathYear) {
    return t("مواليد {birth} (العمر {age} عاماً)", { birth: birthYear, age: currentYear - birthYear });
  } else if (!birthYear && deathYear) {
    return t("توفي عام {death}", { death: deathYear });
  }
  return null;
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};
const pageTransition = { duration: 0.35, ease: [0.25, 1, 0.5, 1] as const };
const gridContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const gridItemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const LeafIcon = () => (
  <svg className="leaf-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20 C 4 10, 12 4, 20 4 C 20 12, 14 20, 4 20 Z" fill="#fff8ec" opacity="0.85" />
    <path d="M4 20 C 8 14, 12 10, 18 6" style={{ stroke: "rgb(var(--b-strong-rgb))" }} strokeWidth="1.2" fill="none" opacity="0.7" />
  </svg>
);

// يلفّ الواجهة بمزوّد اللغة بنفسه، فتعمل اللغة حتى لو لم يُحدَّث layout.tsx
export default function PublicTreeView() {
  return (
    <LangProvider>
      <PublicTreeViewInner />
    </LangProvider>
  );
}

function PublicTreeViewInner() {
  const { t, nm, lang } = useT();

  // الشجرة المعروضة: بالعربي كما هي، وبالإنجليزي بأسماء محوَّلة حرفياً
  const tree = useMemo(() => (lang === "en" ? mapTreeNames(treeAr, nm) : treeAr), [lang, nm]);
  // الاسم العربي لكل شخص (للبحث بالعربي حتى لو الواجهة English)
  const arNames = useMemo(() => {
    const m = new Map<number, string>();
    (function walk(nd: FamilyNode) { m.set(nd.id, nd.name); nd.children?.forEach(walk); })(treeAr);
    return m;
  }, []);
  const [viewState, setViewState] = useState<'splash' | 'branchSelect' | 'tree' | 'placeholder'>('splash');
  const [placeholderName, setPlaceholderName] = useState("");
  const [placeholderBranch, setPlaceholderBranch] = useState<BranchDef | null>(null);
  const deepLinkReadyRef = useRef(false);
  const [pathIds, setPathIds] = useState<number[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 🌟 متغيرات الإعدادات الإضافية
  const [showDates, setShowDates] = useState(true);
  const [reduceAnimations, setReduceAnimations] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lineagePath, setLineagePath] = useState<FamilyNode[] | null>(null);
  const [visualTreeRoot, setVisualTreeRoot] = useState<FamilyNode | null>(null);
  const [isLegendOpen, setLegendOpen] = useState(false);
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [isFeaturesMenuOpen, setIsFeaturesMenuOpen] = useState(false);
  const [isKinshipOpen, setIsKinshipOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isComplaintsOpen, setIsComplaintsOpen] = useState(false);
  const [isEditRequestOpen, setIsEditRequestOpen] = useState(false);
  const [isSequenceOpen, setIsSequenceOpen] = useState(false);

  const [isPosterOpen, setIsPosterOpen] = useState(false);

  const prevDepthRef = useRef(0);
  const suppressPopRef = useRef(false);
  const fromPopRef = useRef(false);

  // ───────────── فصل الفخذ الحالي ─────────────
  // كل ما يُعرض (الفهرس، العدّاد، الإحصائيات، القرابة) يُحسب من الفخذ المفتوح فقط.
  // نغلّف رأس الفخذ بجذر وهمي (941) حتى تبقى كل الدوال القديمة تعمل كما هي.
  const activeBranchRootId = viewState === "tree" ? pathIds[1] : undefined;
  const activeBranchNode = useMemo(
    () => (activeBranchRootId != null ? tree.children?.find((c) => c.id === activeBranchRootId) ?? null : null),
    [activeBranchRootId, tree]
  );
  const scopedTree = useMemo<FamilyNode>(
    () => (activeBranchNode ? { ...tree, children: [activeBranchNode] } : tree),
    [activeBranchNode, tree]
  );
  const activeBranch = useMemo<BranchDef | undefined>(
    () => (viewState === "placeholder" ? placeholderBranch ?? undefined : getBranchByRootId(activeBranchRootId)),
    [viewState, placeholderBranch, activeBranchRootId]
  );
  const totalPeopleCount = useMemo(() => countAllPeople(scopedTree), [scopedTree]); // أفراد الفخذ الحالي
  const fullPeopleCount = useMemo(() => countAllPeople(tree), [tree]); // كل العائلة (شاشة اختيار الفخذ فقط)

  // لون الفخذ: يُطبَّق على <body> حتى يصل للنوافذ المنبثقة (portals) أيضاً
  useEffect(() => {
    if (!activeBranch) return;
    return applyBranchTheme(activeBranch, isDarkMode);
  }, [activeBranch, isDarkMode]);

  // رابط مباشر لكل فخذ:  ?branch=dawoud  (يُقرأ عند فتح الموقع ويُحدَّث عند التنقل بدون إضافة سجل جديد)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("branch");
    const branch = getBranchById(id);
    if (branch) handleSelectBranch(branch);
    deepLinkReadyRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!deepLinkReadyRef.current) return;
    const inBranch = (viewState === "tree" || viewState === "placeholder") && activeBranch;
    const url = new URL(window.location.href);
    if (inBranch) url.searchParams.set("branch", activeBranch!.id);
    else url.searchParams.delete("branch");
    if (url.toString() !== window.location.href) {
      window.history.replaceState(window.history.state, "", url.toString());
    }
  }, [viewState, activeBranch]);

  const navDepth = viewState === "branchSelect" ? 1 : viewState === "tree" || viewState === "placeholder" ? 2 + Math.max(0, pathIds.length - 2) : 0;
  const modalsDepth = [
    isAddModalOpen, isKinshipOpen, isStatsOpen, isAboutOpen, isComplaintsOpen,
    isEditRequestOpen, isFeaturesMenuOpen, isSequenceOpen, isHelpOpen, isLegendOpen,
    visualTreeRoot !== null, lineagePath !== null, isSidebarOpen
  ].filter(Boolean).length;
  
  const currentNavDepth = navDepth + modalsDepth;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setIsDarkMode(true);

    // 🌟 استرجاع تفضيلات "إظهار التواريخ" و "تقليل الحركة" المحفوظة سابقاً
    const savedShowDates = localStorage.getItem("pref_showDates");
    if (savedShowDates !== null) setShowDates(savedShowDates === "true");

    const savedReduceAnimations = localStorage.getItem("pref_reduceAnimations");
    if (savedReduceAnimations !== null) setReduceAnimations(savedReduceAnimations === "true");
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // 🌟 حفظ تفضيل "إظهار التواريخ" في كل مرة يتغيّر فيها
  useEffect(() => {
    localStorage.setItem("pref_showDates", String(showDates));
  }, [showDates]);

  // 🌟 حفظ تفضيل "تقليل الحركة" في كل مرة يتغيّر فيها
  useEffect(() => {
    localStorage.setItem("pref_reduceAnimations", String(reduceAnimations));
  }, [reduceAnimations]);

  useEffect(() => {
    if (fromPopRef.current) {
      fromPopRef.current = false;
      prevDepthRef.current = currentNavDepth;
      return;
    }
    const diff = currentNavDepth - prevDepthRef.current;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        window.history.pushState({ __appDepth: prevDepthRef.current + i + 1 }, "");
      }
    } else if (diff < 0) {
      suppressPopRef.current = true;
      window.history.go(diff);
    }
    prevDepthRef.current = currentNavDepth;
  }, [currentNavDepth]);

  useEffect(() => {
    const handlePopState = () => {
      if (suppressPopRef.current) {
        suppressPopRef.current = false;
        return;
      }
      fromPopRef.current = true;

      if (isAddModalOpen) return setIsAddModalOpen(false);
      if (isKinshipOpen) return setIsKinshipOpen(false);
      if (isStatsOpen) return setIsStatsOpen(false);
      if (isAboutOpen) return setIsAboutOpen(false);
      if (isComplaintsOpen) return setIsComplaintsOpen(false);
      if (isEditRequestOpen) return setIsEditRequestOpen(false);
      if (isFeaturesMenuOpen) return setIsFeaturesMenuOpen(false);
      if (isSequenceOpen) return setIsSequenceOpen(false);
      if (isHelpOpen) return setHelpOpen(false);
      if (isLegendOpen) return setLegendOpen(false);
      if (visualTreeRoot) return setVisualTreeRoot(null);
      if (lineagePath) return setLineagePath(null);
      if (isSidebarOpen) return setSidebarOpen(false);

      if (viewState === "tree" && pathIds.length > 2) {
        setPathIds((prev) => prev.slice(0, -1));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (viewState === "tree" || viewState === "placeholder") {
        setPathIds([]);
        setPlaceholderName("");
        setViewState("branchSelect");
        return;
      }
      if (viewState === "branchSelect") {
        setViewState("splash");
        return;
      }
      fromPopRef.current = false;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    isAddModalOpen, isKinshipOpen, isStatsOpen, isAboutOpen, isComplaintsOpen,
    isEditRequestOpen, isFeaturesMenuOpen, isSequenceOpen, isHelpOpen, isLegendOpen,
    visualTreeRoot, lineagePath, isSidebarOpen, viewState, pathIds,
  ]);

  const flatPeople = useMemo(() => {
    const list: any[] = [];
    function walk(n: FamilyNode, depth: number, father: FamilyNode | null) {
      if (n.id !== VIRTUAL_ROOT_ID) {
        list.push({
          id: n.id, name: n.name, depth, father: father ? father.name : null,
          nameAr: arNames.get(n.id), fatherAr: father ? arNames.get(father.id) ?? null : null,
        });
      }
      if (n.children) n.children.forEach(c => walk(c, depth + 1, n));
    }
    walk(scopedTree, 0, null);
    return list;
  }, [scopedTree, arNames]);

  function navigateIntoChild(id: number) { 
    setPathIds(prev => [...prev, id]); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }

  function goBack() { 
    if (pathIds.length > 2) setPathIds(prev => prev.slice(0, -1)); 
  }
  
  function goHome() { 
    setPathIds(pathIds.length > 1 ? [pathIds[0], pathIds[1]] : [pathIds[0]]);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }
  
  function goToBranchSelect() { setViewState('branchSelect'); }
  function navigateToBreadcrumb(index: number) { setPathIds(prev => prev.slice(0, index + 1)); }

  function handleSelectBranch(branch: BranchDef) {
    const targetNode = tree.children?.find((c) => c.id === branch.rootId);

    if (targetNode && targetNode.children && targetNode.children.length > 0) {
      setPathIds([tree.id, targetNode.id]);
      setViewState('tree');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setPlaceholderName(branch.label);
      setPlaceholderBranch(branch);
      setViewState('placeholder');
    }
  }

  function handleSidebarSelect(id: number) {
    for (const branchRoot of tree.children ?? []) {
      const path = getPathToRoot(branchRoot, id);
      if (path) {
        setPathIds([tree.id, ...path.map(n => n.id)]);
        setViewState('tree');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
  }

  function handleShowLineage(id: number) {
    for (const branchRoot of tree.children ?? []) {
      const path = getPathToRoot(branchRoot, id);
      if (path) { setLineagePath(path); break; }
    }
  }

  if (viewState === 'splash') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="splash" id="splash" className="dark:bg-[#12100e] transition-colors duration-500 flex visible pointer-events-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <motion.svg className="splash-leaf" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" initial={{ scale: 0.6, opacity: 0, rotate: -15 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", damping: 12, stiffness: 120, delay: 0.1 }}>
            <path d="M4 20 C 4 10, 12 4, 20 4 C 20 12, 14 20, 4 20 Z" fill="#4c7a3f" opacity="0.85"/>
            <path d="M4 20 C 8 14, 12 10, 18 6" stroke="#2d4a25" strokeWidth="1.2" fill="none" opacity="0.7"/>
          </motion.svg>
          <motion.h1 className="dark:text-[rgb(var(--b-lite-rgb)/1)]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>{t("نسب آل القواسمي")}</motion.h1>
          <motion.h2 className="dark:text-[#f3ede1]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>{t("عائلة القواسمي")}</motion.h2>
          <motion.button className="btn-enter dark:!bg-[rgb(var(--b-lite-rgb)/1)] dark:!text-[#1c1915]" onClick={() => setViewState('branchSelect')} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ delay: 0.45, duration: 0.4 }}>{t("دخول")}</motion.button>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (viewState === 'branchSelect') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="branchSelect" id="branchSelect" className="screen visible dark:bg-[#12100e] transition-colors duration-500" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
          <div className="branch-select-inner mx-auto max-w-6xl px-4">
            <h2 className="branch-title !mb-6 text-center dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("اختر الفخذ")}</h2>

            {SHOW_FULL_SEQUENCE_BUTTON && (
              <div className="flex justify-center mb-10">
                <motion.button onClick={() => setIsSequenceOpen(true)} whileHover={{ scale: 1.03, boxShadow: "0 12px 26px rgba(138,95,46,0.4)" }} whileTap={{ scale: 0.96 }} className="flex items-center gap-2 rounded-full border border-[rgb(var(--b-deep-rgb)/0.2)] bg-gradient-to-b from-white to-[#fdfbf7] px-6 py-3 font-cairo text-[15px] font-bold text-[rgb(var(--b-deep-rgb)/1)] shadow-[0_8px_20px_rgba(138,95,46,0.15)] transition-all dark:border-[rgb(var(--b-lite-rgb)/0.2)] dark:from-[#1c1915] dark:to-[#1a1713] dark:text-[rgb(var(--b-lite-rgb)/1)]">
                  <span className="text-[18px]">🌳</span><span>{t("عرض التسلسل الكامل لشجرة العائلة")}</span>
                </motion.button>
              </div>
            )}

            {SHOW_BRANCH_CARDS ? (
              <>
                <motion.div className="flex flex-wrap justify-center gap-5" variants={gridContainerVariants} initial="hidden" animate="visible">
                  {BRANCHES.filter((b) => VISIBLE_BRANCH_IDS.includes(b.id)).map((b) => (
                    <motion.div key={b.id} variants={gridItemVariants} style={branchCardVars(b)} onClick={() => handleSelectBranch(b)} whileHover={{ y: -8 }} whileTap={{ scale: 0.97 }} className="group relative flex w-full max-w-[280px] sm:w-[240px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-[rgb(var(--b-deep-rgb)/0.2)] bg-gradient-to-b from-white to-[#fcf9f2] p-6 shadow-[0_8px_20px_rgba(138,95,46,0.06)] hover:border-[rgb(var(--b-deep-rgb)/0.6)] hover:shadow-[0_15px_35px_rgba(138,95,46,0.18)] dark:border-[rgb(var(--b-lite-rgb)/0.2)] dark:from-[#1c1915] dark:to-[#1a1713] dark:hover:border-[rgb(var(--b-lite-rgb)/0.6)]">
                      <div className="absolute left-0 top-0 h-1 w-full opacity-80" style={{ background: b.color }} />
                      <div className="absolute left-0 top-0 h-1 w-full scale-x-0 bg-gradient-to-r from-transparent via-[rgb(var(--b-deep-rgb)/1)] to-transparent opacity-0 transition-all duration-500 group-hover:scale-x-100 group-hover:opacity-100" />
                      <span className="mb-3 text-[28px] opacity-20 grayscale transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0">🌿</span>
                      <div className="font-cairo text-[18px] font-extrabold text-[#5c4a38] transition-colors duration-300 group-hover:text-[rgb(var(--b-deep-rgb)/1)] dark:text-[#f3ede1] dark:group-hover:text-[rgb(var(--b-lite-rgb)/1)]">{t(b.label)}</div>
                      <div className="absolute bottom-[-20px] text-xs font-bold text-[rgb(var(--b-deep-rgb)/0.6)] dark:text-[rgb(var(--b-lite-rgb)/0.6)] opacity-0 transition-all duration-300 group-hover:bottom-2 group-hover:opacity-100">{t("دخول ⟵")}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative mx-auto flex max-w-2xl flex-col items-center overflow-hidden rounded-3xl border border-[rgb(var(--b-deep-rgb)/0.2)] bg-gradient-to-b from-white to-[#fcf9f2] px-8 py-14 text-center shadow-[0_15px_40px_rgba(138,95,46,0.1)] dark:border-[rgb(var(--b-lite-rgb)/0.2)] dark:from-[#1c1915] dark:to-[#1a1713]"
              >
                <div className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.08]" style={{ backgroundImage: "radial-gradient(currentColor 1.5px, transparent 1.5px)", backgroundSize: "22px 22px", color: "#8a5f2e" }} />
                <motion.span
                  className="relative mb-4 text-[46px]"
                  initial={{ scale: 0.7, rotate: -10, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.15 }}
                >
                  🌳
                </motion.span>
                <h3 className="relative font-ruqaa text-[26px] text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("عائلة القواسمي")}</h3>
                <p className="relative mt-2 max-w-md font-cairo text-[14px] leading-relaxed text-[#7c6c53] dark:text-gray-400">
                  
                  {t("جذور ممتدة عبر الأجيال، وأفخاذ عديدة تجمعها شجرة نسب واحدة.")}
                </p>
                <div className="relative mt-8 flex items-center gap-8">
                  <div className="text-center">
                    <div className="font-cairo text-[24px] font-extrabold text-[#5c4a38] dark:text-[#f3ede1]">{fullPeopleCount}</div>
                    <div className="mt-1 text-[11px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/0.8)]">{t("فرداً في الشجرة")}</div>
                  </div>
                  <div className="h-10 w-px bg-[rgb(var(--b-deep-rgb)/0.2)] dark:bg-[rgb(var(--b-lite-rgb)/0.2)]" />
                  <div className="text-center">
                    <div className="font-cairo text-[24px] font-extrabold text-[#5c4a38] dark:text-[#f3ede1]">{BRANCHES.length}</div>
                    <div className="mt-1 text-[11px] font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/0.8)]">{t("فخذاً")}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          {SHOW_FULL_SEQUENCE_BUTTON && (
            <SequenceModal isOpen={isSequenceOpen} onClose={() => setIsSequenceOpen(false)} onSelectBranch={(branchId) => { setIsSequenceOpen(false); const branch = BRANCHES.find(b => b.id === branchId); if (branch) handleSelectBranch(branch); }} />
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (viewState === 'placeholder') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="placeholder" id="branchPlaceholder" className="screen visible dark:bg-[#12100e] transition-colors duration-500" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
          <div className="branch-select-inner">
            <h2 className="branch-title dark:text-[rgb(var(--b-lite-rgb)/1)]">{t(placeholderName)}</h2>
            <p className="branch-note dark:text-gray-400">{t("بيانات هذا الفخذ قيد الإعداد حاليًا ولم يتم إضافة أبناء له بعد.")}</p>
            <motion.button className="btn primary mt-4 dark:!bg-[rgb(var(--b-lite-rgb)/1)] dark:!text-[#1c1915]" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setViewState('branchSelect')}>{t("⟵ العودة لاختيار الفخذ")}</motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const currentPathNodes = pathIds.map(id => findNodeById(tree, id)).filter(Boolean) as FamilyNode[];
  const focusNode = currentPathNodes[currentPathNodes.length - 1];
  if (!focusNode) return null;

  const isRoot = currentPathNodes.length === 1;
  const parentNode = currentPathNodes[currentPathNodes.length - 2];
  const isBranchRoot = parentNode?.id === 941;

  const kidsCount = focusNode.children ? focusNode.children.length : 0;
  const descCount = countDescendants(focusNode);
  const displayName = isRoot ? (isBranchRoot ? focusNode.name : t("عائلة القواسمي")) : focusNode.name.replace('فخذ ', '').trim();

  const sortedChildren = [...(focusNode.children || [])].sort((a, b) => {
    const yearA = a.birth_date ? parseInt(String(a.birth_date).split('-')[0]) : 9999;
    const yearB = b.birth_date ? parseInt(String(b.birth_date).split('-')[0]) : 9999;
    return yearA - yearB;
  });

  const premiumBtnClasses = "cursor-pointer group relative !flex !items-center !justify-center !gap-2.5 !rounded-full !border-[1.5px] !border-[rgb(var(--b-deep-rgb)/0.3)] !bg-gradient-to-b !from-[#fffdf8] !via-[#fcf8f2] !to-[rgb(var(--b-pale-rgb)/1)] !px-6 !py-2.5 !font-cairo !text-[15.5px] !font-extrabold !text-[rgb(var(--b-ink-rgb)/1)] !shadow-[0_5px_15px_rgba(138,95,46,0.1),inset_0_2px_3px_rgba(255,255,255,0.8)] !transition-all !duration-300 dark:!border-[rgb(var(--b-lite-rgb)/0.3)] dark:!from-[#221f1a] dark:!via-[#1c1915] dark:!to-[#14120f] dark:!text-[#e8dfce] dark:!shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)]";
  const premiumHoverClasses = "hover:!border-[rgb(var(--b-deep-rgb)/0.7)] hover:!text-[rgb(var(--b-deep-rgb)/1)] hover:!shadow-[0_8px_25px_rgba(138,95,46,0.2),inset_0_2px_3px_rgba(255,255,255,0.9)] hover:-translate-y-1 dark:hover:!border-[rgb(var(--b-lite-rgb)/0.7)] dark:hover:!text-[rgb(var(--b-lite-rgb)/1)] dark:hover:!shadow-[0_8px_25px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.05)]";

  return (
    // 🌟 تفعيل كلاس إيقاف الحركات في حال تم طلبه من الإعدادات
    <div className={`no-print min-h-screen font-cairo dark:bg-[#12100e] transition-colors duration-500 ${reduceAnimations ? 'reduce-animations' : ''}`}>
      
      {/* 🌟 الكود النووي (يشمل كود إيقاف الحركات ولون المتوفين) */}
      <style dangerouslySetInnerHTML={{
        __html: `
          html body .app-shell main .page-wrap div.deceased-card,
          html body div.deceased-card {
            background: #5e6368 !important;
            background-color: #5e6368 !important;
            background-image: none !important;
            border-color: #4b5563 !important;
          }
          html body div.deceased-card:hover {
            background: #4b5563 !important;
            background-color: #4b5563 !important;
            background-image: none !important;
          }
          .reduce-animations * {
             transition: none !important;
             animation: none !important;
          }
        `
      }} />

      <Header
        title={currentPathNodes.length > 1 ? currentPathNodes[1].name.replace('فخذ ', '').trim() : t("عائلة القواسمي")}
        branches={BRANCHES.filter((b) => VISIBLE_BRANCH_IDS.includes(b.id))}
        onNavigateHome={goToBranchSelect}
        onSelectBranch={(branchId) => {
          const branch = BRANCHES.find(b => b.id === branchId);
          if (branch) handleSelectBranch(branch);
        }}
        onToggleSidebar={() => setSidebarOpen(true)}
        isSidebarOpen={isSidebarOpen}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenFeatures={() => setIsFeaturesMenuOpen(true)}
        // 🌟 تمرير الدوال للـ Header بشكل صحيح
        showDates={showDates}
        setShowDates={setShowDates}
        reduceAnimations={reduceAnimations}
        setReduceAnimations={setReduceAnimations}
      />

     <div className="app-shell flex w-full">
        <Sidebar people={flatPeople} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} onSelectPerson={handleSidebarSelect} />

        <main className="main flex-1 w-full transition-all duration-300 min-[901px]:!mr-[320px]">
          <header className="top-header">
            <h1 className="dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("شجرة العائلة")}</h1>
            <div className="subtitle dark:text-gray-400">{t("انقر على أي اسم لعرض أبنائه فقط — واستخدم زر «رجوع» للعودة للأب السابق")}</div>
          </header>

          <div className="toolbar !my-8 !flex !w-full !flex-wrap !items-center !justify-center !gap-3 md:!gap-4">
            <motion.button className={`${premiumBtnClasses} ${isBranchRoot ? '!cursor-not-allowed !opacity-50 !shadow-none' : premiumHoverClasses}`} disabled={isBranchRoot} whileTap={isBranchRoot ? undefined : { scale: 0.96 }} onClick={goBack}>
              <svg className="h-[18px] w-[18px] transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12H4M4 12L10 6M4 12L10 18"/></svg>
              <span>{t("رجوع")}</span>
            </motion.button>
            <motion.button className={`${premiumBtnClasses} ${premiumHoverClasses}`} whileTap={{ scale: 0.96 }} onClick={goHome}>
              <svg className="h-[18px] w-[18px] transition-transform group-hover:scale-110 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>{t("البداية")}</span>
            </motion.button>
            <motion.button className={`${premiumBtnClasses} ${premiumHoverClasses}`} whileTap={{ scale: 0.96 }} onClick={() => setLegendOpen(true)}>
              <svg className="h-[18px] w-[18px] transition-transform group-hover:scale-110 group-hover:rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
              <span>{t("دليل الألوان")}</span>
            </motion.button>
            <motion.button className={`${premiumBtnClasses} ${premiumHoverClasses}`} whileTap={{ scale: 0.96 }} onClick={() => setHelpOpen(true)}>
              <svg className="h-[18px] w-[18px] transition-transform group-hover:scale-110 group-hover:rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>
              <span>{t("المساعدة")}</span>
            </motion.button>
          </div>

          <motion.nav layout className="breadcrumb !mx-auto !mb-8 !flex !w-fit !max-w-full !flex-wrap !items-center !justify-center !gap-1 !rounded-2xl !border !border-[rgb(var(--b-deep-rgb)/0.15)] !bg-gradient-to-r !from-[#fdfbf7] !via-white !to-[#fdfbf7] !px-4 !py-2.5 !shadow-[0_8px_25px_rgba(138,95,46,0.06)] dark:!border-[rgb(var(--b-lite-rgb)/0.2)] dark:!bg-gradient-to-r dark:!from-[#1c1915] dark:!via-[#1a1713] dark:!to-[#1c1915]">
            <AnimatePresence initial={false}>
              {currentPathNodes.slice(1).map((node, i) => {
                const isCurrent = i === currentPathNodes.slice(1).length - 1;
                const nodeName = node.name.replace('فخذ ', '');
                return (
                  <motion.span key={node.id} layout initial={{ opacity: 0, x: 12, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", damping: 24, stiffness: 300 }} className="flex items-center gap-1">
                    {i > 0 && <svg className="mx-1 h-3.5 w-3.5 text-[rgb(var(--b-deep-rgb)/0.4)] dark:text-[rgb(var(--b-lite-rgb)/0.4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>}
                    <button onClick={() => !isCurrent && navigateToBreadcrumb(i + 1)} className={`group relative rounded-xl px-3 py-1.5 font-cairo transition-all duration-300 ${isCurrent ? "!cursor-default !bg-[rgb(var(--b-deep-rgb)/0.05)] dark:!bg-[rgb(var(--b-lite-rgb)/0.1)] !text-[15.5px] !font-extrabold !text-[rgb(var(--b-deep-rgb)/1)] dark:!text-[rgb(var(--b-lite-rgb)/1)]" : "!text-[14.5px] !font-bold !text-[#7a6652] dark:!text-gray-400 hover:!bg-[rgb(var(--b-deep-rgb)/0.1)] dark:hover:!bg-[rgb(var(--b-lite-rgb)/0.1)] hover:!text-[rgb(var(--b-deep-rgb)/1)] dark:hover:!text-[rgb(var(--b-lite-rgb)/1)]"}`}>
                      {nodeName}
                      {!isCurrent && <span className="absolute bottom-0.5 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[rgb(var(--b-deep-rgb)/0.4)] dark:bg-[rgb(var(--b-lite-rgb)/0.4)] transition-all duration-300 group-hover:w-1/2" />}
                    </button>
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </motion.nav>

          <div className="page-wrap">
            <AnimatePresence mode="wait">
              <motion.div key={focusNode.id} className="page" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}>
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className={`focus-card reveal in-view ${kidsCount ? 'has-children' : 'no-children'}`}>
                  <LeafIcon />
                  <div className="name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: lang === 'en' ? '2px 10px' : '8px' }}>
                    <span>{displayName}</span>
                    {focusNode.death_date && <span style={lang === 'en' ? { fontFamily: 'inherit', fontStyle: 'italic', fontSize: '15px', fontWeight: 500, color: '#f3ede1', opacity: 0.9, whiteSpace: 'nowrap' } : { fontFamily: "'Aref Ruqaa', 'Amiri', serif", fontSize: '24px', fontWeight: 'normal', color: '#f3ede1' }}>{t("رحمه الله")}</span>}
                  </div>
                  
                  {/* 🌟 إخفاء التواريخ حسب الإعدادات */}
                  {showDates && calculateAgeDisplay(focusNode.birth_date, focusNode.death_date, t) && (
                    <div className="text-[13px] text-[#fff9ee] mt-1.5 opacity-95 leading-relaxed font-bold bg-black/15 w-fit mx-auto px-3 py-0.5 rounded-full shadow-sm">
                      {calculateAgeDisplay(focusNode.birth_date, focusNode.death_date, t)}
                    </div>
                  )}
                  
                  {!isRoot && !isBranchRoot && <div className="father-tag">{t("ابن")} {parentNode.name.replace('فخذ ', '')}</div>}
                  <div className="meta">{kidsCount ? t("{kids} من الأبناء المباشرين — {desc} فرداً في هذا الفرع", { kids: kidsCount, desc: descCount }) : t("لا يوجد أبناء مسجلون")}</div>
                  <div className="focus-actions">
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn ghost small" onClick={() => setVisualTreeRoot(focusNode)}>{t("🌿 عرض الشجرة الرقمية")}</motion.button>
                    {!isRoot && <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn ghost small" onClick={() => handleShowLineage(focusNode.id)}>{t("📜 عرض تسلسل النسب")}</motion.button>}
                  </div>
                </motion.div>

                {kidsCount > 0 ? (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="section-title dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("الأبناء")} <span className="badge">{kidsCount}</span></motion.div>
                    <motion.div className="children-grid" variants={gridContainerVariants} initial="hidden" animate="visible">
                      {sortedChildren.map((child) => {
                        const childKidsCount = child.children ? child.children.length : 0;
                        const totalDesc = countDescendants(child);
                        const deceasedClasses = child.death_date ? "deceased-card" : "";

                        return (
                          <motion.div
                            key={child.id}
                            variants={gridItemVariants}
                            whileHover={{ y: -6, scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className={`child-card reveal in-view dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.2)] ${childKidsCount ? 'has-children' : 'no-children'} ${deceasedClasses}`}
                            onClick={() => navigateIntoChild(child.id)}
                          >
                            <LeafIcon />
                            <div className="name dark:text-[#f3ede1]" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: lang === 'en' ? '0 6px' : '6px' }}>
                              <span>{child.name}</span>
                              {child.death_date && <span className="opacity-90" style={lang === 'en' ? { fontFamily: 'inherit', fontStyle: 'italic', fontSize: '12px', fontWeight: 500, color: '#f3ede1', whiteSpace: 'nowrap' } : { fontFamily: "'Aref Ruqaa', 'Amiri', serif", fontSize: '18px', fontWeight: 'normal', color: '#f3ede1' }}>{t("رحمه الله")}</span>}
                            </div>
                            
                            {/* 🌟 إخفاء التواريخ حسب الإعدادات للأبناء أيضاً */}
                            {showDates && calculateAgeDisplay(child.birth_date, child.death_date, t) && (
                              <div className="text-[11px] mt-1.5 text-center leading-relaxed font-bold bg-black/15 dark:bg-black/30 text-white/95 dark:text-[rgb(var(--b-lite-rgb)/1)] w-fit mx-auto px-2.5 py-0.5 rounded-md transition-colors shadow-sm">
                                {calculateAgeDisplay(child.birth_date, child.death_date, t)}
                              </div>
                            )}

                            {!isRoot && <div className="father-tag mt-1 dark:text-gray-400">{t("ابن")} {displayName}</div>}
                            <div className="sub dark:text-gray-500">{childKidsCount ? t("{count} أبناء", { count: childKidsCount }) : ''}</div>
                            {childKidsCount > 0 && (
  <div className="mt-2.5 mx-auto flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[11px] font-bold text-[#f3ede1] shadow-sm backdrop-blur-md transition-colors hover:bg-black/40">
    <svg className="w-3.5 h-3.5 text-[rgb(var(--b-lite-rgb)/1)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    <span className="mt-[1px] tracking-wide whitespace-nowrap" dir={lang === "en" ? "ltr" : "rtl"}>{totalDesc}  {t("فرد بالفرع")}</span>
  </div>
)}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="empty-state dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.2)] dark:text-gray-400">{t("لا يوجد أبناء مسجلين لهذا الاسم حتى الآن.")}</motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <footer className="mt-8 mb-4 flex flex-col items-center justify-center gap-1.5 text-center font-cairo">
            <div className="text-[12.5px] font-semibold text-ink-soft/90 dark:text-[#f3ede1]/70">
              
              {t("إجمالي الأفراد في")} {activeBranch ? t(activeBranch.label) : t("الشجرة")}: <span className="font-bold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)]">{totalPeopleCount}</span>  {t("فرد")}
            </div>
            <div className="my-0.5 h-[1px] w-1/4 max-w-[80px] bg-gradient-to-r from-transparent via-[rgb(var(--b-deep-rgb)/0.2)] to-transparent dark:via-[rgb(var(--b-lite-rgb)/0.3)]" />
            <div className="flex flex-col items-center gap-0.5 text-[12px] font-semibold text-ink-soft/80 dark:text-[#f3ede1]/60">
              <p className="m-0 leading-tight">
                
                {t("تم بناؤه وتطويره بواسطة")}{' '}
                <button 
                  type="button"
                  onClick={() => {
                    const myNode = findNodeByNameIncluding(treeAr, "ينال");
                    if (myNode) handleSidebarSelect(myNode.id);
                    else alert(t("لم يتم العثور على الاسم في البيانات! تأكد أن الاسم مسجل في الشجرة."));
                  }}
                  className="!inline !m-0 !border-none !bg-transparent !p-0 !shadow-none font-bold text-[rgb(var(--b-deep-rgb)/1)] underline decoration-[rgb(var(--b-deep-rgb)/0.3)] underline-offset-4 outline-none transition-all hover:text-[rgb(var(--b-deep-rgb)/0.7)] hover:decoration-[rgb(var(--b-deep-rgb)/0.7)] focus:outline-none dark:text-[rgb(var(--b-lite-rgb)/1)] cursor-pointer"
                >
                  
                  {t("ينال سفيان ربحي القواسمي")}
                </button>
              </p>
              <a href="https://wa.me/962791741700" target="_blank" rel="noreferrer" className="group flex items-center justify-center gap-1.5 text-ink-soft/80 transition-colors hover:text-[#25D366] dark:text-[#f3ede1]/70 dark:hover:text-[#25D366] !no-underline outline-none">
                <span>{t("للإبلاغ عن أي خطأ أو تعديل:")}</span>
                <span className="font-bold tracking-wider text-[rgb(var(--b-deep-rgb)/0.9)] transition-colors group-hover:text-[#25D366] dark:text-[rgb(var(--b-lite-rgb)/0.9)]" dir="ltr">+962 79 174 1700</span>
              </a>
            </div>
          </footer>
        </main>
      </div>

      <AnimatePresence>
        {isLegendOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLegendOpen(false)} className="cursor-pointer absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#fdfbf7] border border-[rgb(var(--b-mid-rgb)/0.3)] shadow-2xl dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.2)] flex flex-col font-cairo" onClick={e => e.stopPropagation()}>
              <div className="relative pt-6 pb-4 shrink-0 z-10 bg-[#fdfbf7] dark:bg-[#1c1915] rounded-t-3xl px-6 border-b border-[rgb(var(--b-mid-rgb)/0.1)] dark:border-[rgb(var(--b-lite-rgb)/0.1)] flex flex-col items-center">
                <button onClick={() => setLegendOpen(false)} className="cursor-pointer absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30">✕</button>
                <div className="flex items-center justify-center w-14 h-14 bg-[rgb(var(--b-mid-rgb)/0.1)] text-[rgb(var(--b-deep-rgb)/1)] dark:bg-[rgb(var(--b-lite-rgb)/0.1)] dark:text-[rgb(var(--b-lite-rgb)/1)] rounded-full mb-3">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[rgb(var(--b-deep-rgb)/1)] font-ruqaa dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("دليل الألوان")}</h2>
              </div>
              <div className="p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#24201a] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:border-[rgb(var(--b-mid-rgb)/0.3)]">
                  <span className="text-[14px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">{t("الأب (الاسم المعروض حالياً)")}</span>
                  <div className="w-8 h-8 rounded-lg shadow-inner border border-black/10" style={{ background: "linear-gradient(160deg, var(--focus-1, #d3a765), var(--focus-2, #8a5f2e))" }}></div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#24201a] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:border-[rgb(var(--b-mid-rgb)/0.3)]">
                  <span className="text-[14px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">{t("ابن يمتلك أبناء (يمكن الدخول إليه)")}</span>
                  <div className="w-8 h-8 rounded-lg shadow-inner border border-black/10" style={{ background: "var(--theme-has-kids, #397639)" }}></div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#24201a] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:border-[rgb(var(--b-mid-rgb)/0.3)]">
                  <span className="text-[14px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">{t("ابن بدون أبناء")}</span>
                  <div className="w-8 h-8 rounded-lg shadow-inner border border-black/10" style={{ background: "var(--theme-no-kids, #61b461)" }}></div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#24201a] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:border-[rgb(var(--b-mid-rgb)/0.3)]">
                  <span className="text-[14px] font-bold text-[#5c4a38] dark:text-[#f3ede1]">{t("متوفى")}</span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#71767c] to-[#4b5563] shadow-inner border border-[#374151]/50"></div>
                </div>
              </div>
              <div className="p-4 border-t border-[rgb(var(--b-mid-rgb)/0.1)] dark:border-[rgb(var(--b-lite-rgb)/0.1)] bg-[#fdfbf7] dark:bg-[#1c1915]">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="cursor-pointer w-full bg-gradient-to-l from-[rgb(var(--b-deep-rgb)/1)] to-[rgb(var(--b-mid-rgb)/1)] text-white font-bold py-3 text-[15px] rounded-xl transition-all shadow-md hover:shadow-lg dark:from-[rgb(var(--b-ink-rgb)/1)] dark:to-[rgb(var(--b-ink-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)]" onClick={() => setLegendOpen(false)}>{t("إغلاق")}</motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHelpOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#fdfbf7] border border-[rgb(var(--b-mid-rgb)/0.3)] shadow-2xl dark:bg-[#1c1915] dark:border-[rgb(var(--b-lite-rgb)/0.2)] flex flex-col font-cairo max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="relative pt-6 pb-4 shrink-0 z-10 bg-[#fdfbf7] dark:bg-[#1c1915] rounded-t-3xl px-6 border-b border-[rgb(var(--b-mid-rgb)/0.1)] dark:border-[rgb(var(--b-lite-rgb)/0.1)] flex flex-col items-center">
                <button onClick={() => setHelpOpen(false)} className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors dark:bg-[#2b261f] dark:text-gray-400 dark:hover:bg-red-900/30">✕</button>
                <div className="flex items-center justify-center w-14 h-14 bg-[rgb(var(--b-mid-rgb)/0.1)] text-[rgb(var(--b-deep-rgb)/1)] dark:bg-[rgb(var(--b-lite-rgb)/0.1)] dark:text-[rgb(var(--b-lite-rgb)/1)] rounded-full mb-3 shadow-inner">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-[rgb(var(--b-deep-rgb)/1)] font-ruqaa dark:text-[rgb(var(--b-lite-rgb)/1)]">{t("ملاحظات ومساعدة")}</h2>
              </div>
              <div className="p-5 flex flex-col gap-3 overflow-y-auto sidebar-scroll">
                {[
                  { title: t("البحث:"), desc: t("استخدم زر \"الفهرس\" (القائمة الجانبية) للبحث السريع عن أي شخص.") },
                  { title: t("التنقل:"), desc: t("انقر على أي بطاقة لعرض أبناء هذا الشخص، واستخدم \"شريط المسار\" أو زر \"رجوع\" في الأعلى للعودة.") },
                  { title: t("الترتيب:"), desc: t("النظام يقوم بترتيب الأبناء تلقائياً (من الأكبر للأصغر) بناءً على سنة الولادة.") },
                  { title: t("المتوفين:"), desc: t("يتم تمييز الأشخاص المتوفين باللون السكني مع إرفاق عبارة (رحمه الله) بجانب أسمائهم.") },
                  { title: t("الطباعة:"), desc: t("يمكنك عرض أو طباعة \"وثيقة تسلسل الأفخاذ\" الكاملة بصيغة PDF عالية الدقة عبر الزر المخصص.") }
                ].map((item, index) => (
                  <div key={index} className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white dark:bg-[#24201a] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:border-[rgb(var(--b-mid-rgb)/0.3)] hover:shadow-md">
                    <span className="text-[14.5px] font-extrabold text-[rgb(var(--b-deep-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--b-mid-rgb)/1)] dark:bg-[rgb(var(--b-lite-rgb)/1)] inline-block"></span>{item.title}</span>
                    <span className="text-[13px] font-semibold text-[#5c4a38] dark:text-[#f3ede1] leading-relaxed px-3 border-r-2 border-[rgb(var(--b-mid-rgb)/0.2)] dark:border-[rgb(var(--b-lite-rgb)/0.2)] mr-1.5">{item.desc}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[rgb(var(--b-mid-rgb)/0.1)] dark:border-[rgb(var(--b-lite-rgb)/0.1)] bg-[#fdfbf7] dark:bg-[#1c1915]">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gradient-to-l from-[rgb(var(--b-deep-rgb)/1)] to-[rgb(var(--b-mid-rgb)/1)] text-white font-bold py-3 text-[15px] rounded-xl transition-all shadow-md hover:shadow-lg dark:from-[rgb(var(--b-ink-rgb)/1)] dark:to-[rgb(var(--b-ink-rgb)/1)] dark:text-[rgb(var(--b-lite-rgb)/1)]" onClick={() => setHelpOpen(false)}>{t("حسناً، فهمت")}</motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LineageCertificateModal isOpen={lineagePath !== null} ancestorPath={lineagePath} totalCount={totalPeopleCount} onClose={() => setLineagePath(null)} />
      <VisualTreeModal isOpen={visualTreeRoot !== null} rootNode={visualTreeRoot} onClose={() => setVisualTreeRoot(null)} />
      
      <FeaturesMenuModal 
  isOpen={isFeaturesMenuOpen} 
  onClose={() => setIsFeaturesMenuOpen(false)} 
  onOpenKinship={() => { setIsFeaturesMenuOpen(false); setTimeout(() => setIsKinshipOpen(true), 150); }}
  onOpenAddMember={() => { setIsFeaturesMenuOpen(false); setTimeout(() => setIsAddModalOpen(true), 150); }}
  onOpenStats={() => { setIsFeaturesMenuOpen(false); setTimeout(() => setIsStatsOpen(true), 150); }}
  onOpenAbout={() => { setIsFeaturesMenuOpen(false); setTimeout(() => setIsAboutOpen(true), 150); }}
  onOpenComplaints={() => { setIsFeaturesMenuOpen(false); setTimeout(() => setIsComplaintsOpen(true), 150); }}
  onOpenEditRequest={() => { setIsFeaturesMenuOpen(false); setTimeout(() => setIsEditRequestOpen(true), 150); }}
  onOpenPoster={() => { setIsFeaturesMenuOpen(false); setTimeout(() => setIsPosterOpen(true), 150); }} // 🌟 هذا السطر
/>

      <KinshipModal isOpen={isKinshipOpen} onClose={() => setIsKinshipOpen(false)} people={flatPeople} />
      <StatisticsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} root={scopedTree} />
      <FamilyAboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <ComplaintsModal isOpen={isComplaintsOpen} onClose={() => setIsComplaintsOpen(false)} />
      <EditRequestModal isOpen={isEditRequestOpen} onClose={() => setIsEditRequestOpen(false)} />

      <AnimatePresence>
        {isAddModalOpen && <AddMemberModal key="add-member" onClose={() => setIsAddModalOpen(false)} />}
          <BranchPosterModal isOpen={isPosterOpen} onClose={() => setIsPosterOpen(false)} treeData={treeDataRaw} />
      </AnimatePresence>

      {/* 🌟 نافذة الآيفون المنبثقة 🌟 */}
      <IosInstallPrompt />


      {/* نماذج وهمية لتعريف الحقول لسيرفر Netlify وقت البناء */}
      <div style={{ display: 'none' }}>
        <form name="add-member-form" data-netlify="true">
          <input type="text" name="name" />
          <input type="text" name="parent_name" />
          <input type="text" name="member_phone" />
          <input type="text" name="branch" />
          <input type="text" name="location" />
          <input type="text" name="birth_year" />
          <input type="text" name="death_year" />
          <input type="text" name="children_data" />
        </form>
        
        <form name="edit-requests-form" data-netlify="true" netlify-honeypot="bot-field">
          <input type="text" name="name" />
          <input type="text" name="target_person" />
          <input type="text" name="edit_type" />
          <input type="text" name="correct_info" />
          <input type="text" name="submitter_name" />
          <input type="text" name="edit_phone" />
          <input type="text" name="bot-field" />
        </form>
        
        <form name="complaints-form" data-netlify="true" netlify-honeypot="bot-field">
          <input type="text" name="name" />
          <input type="text" name="message_type" />
          <input type="text" name="message_text" />
          <input type="text" name="sender_name" />
          <input type="text" name="complaint_phone" />
          <input type="text" name="bot-field" />
        </form>
      </div>

    </div>
  );
}