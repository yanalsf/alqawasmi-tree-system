// apps/public/components/PublicTreeView.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import treeDataRaw from "@/data/tree.json";
import type { FamilyNode } from "@/lib/constants";
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

const VIRTUAL_ROOT_ID = 941;
const tree = treeDataRaw as unknown as FamilyNode;

const BRANCHES = [
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

function findNodeById(node: FamilyNode, id: number): FamilyNode | null {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}
function countDescendants(node: FamilyNode): number {
  let n = 0;
  if (node.children) {
    n += node.children.length;
    node.children.forEach(c => n += countDescendants(c));
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
    <path d="M4 20 C 4 10, 12 4, 20 4 C 20 12, 14 20, 4 20 Z" fill="#fff8ec" opacity="0.85"/>
    <path d="M4 20 C 8 14, 12 10, 18 6" stroke="#4c7a3f" strokeWidth="1.2" fill="none" opacity="0.7"/>
  </svg>
);

function calculateAgeDisplay(birthStr?: string, deathStr?: string) {
  if (!birthStr && !deathStr) return null;

  const birthYear = birthStr ? parseInt(birthStr.split('-')[0]) : null;
  const deathYear = deathStr ? parseInt(deathStr.split('-')[0]) : null;
  const currentYear = new Date().getFullYear(); // رح ياخذ السنة الحالية تلقائياً

  if (birthYear && deathYear) {
    const age = deathYear - birthYear;
    return `${birthYear} - ${deathYear} (عاش ${age} عاماً)`;
  } else if (birthYear && !deathYear) {
    const age = currentYear - birthYear;
    return `مواليد ${birthYear} (العمر ${age} عاماً)`;
  } else if (!birthYear && deathYear) {
    return `توفي عام ${deathYear}`;
  }
  return null;
}


export default function PublicTreeView() {
  const [viewState, setViewState] = useState<'splash' | 'branchSelect' | 'tree' | 'placeholder'>('splash');
  const [placeholderName, setPlaceholderName] = useState("");

  const [pathIds, setPathIds] = useState<number[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setIsDarkMode(true);
  }, []);

  /* التعديل الجذري هون عشان Tailwind يفهم الدارك مود */
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

  const flatPeople = useMemo(() => {
    const list: any[] = [];
    function walk(n: FamilyNode, depth: number, father: string | null) {
      if (n.id !== VIRTUAL_ROOT_ID) list.push({ id: n.id, name: n.name, depth, father });
      if (n.children) n.children.forEach(c => walk(c, depth + 1, n.name));
    }
    walk(tree, 0, null);
    return list;
  }, []);

  function navigateIntoChild(id: number) { setPathIds(prev => [...prev, id]); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function goBack() { if (pathIds.length > 2) setPathIds(prev => prev.slice(0, -1)); }
  
  function goHome() { 
    if (pathIds.length > 1) {
      setPathIds([pathIds[0], pathIds[1]]);
    } else if (pathIds.length > 0) {
      setPathIds([pathIds[0]]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }
  
  function goToBranchSelect() { setViewState('branchSelect'); }
  function navigateToBreadcrumb(index: number) { setPathIds(prev => prev.slice(0, index + 1)); }

  function handleSelectBranch(branch: {id: string, label: string}) {
    const keyword = branch.label.replace('فخذ ', '').trim();
    const targetNode = tree.children?.find(c => 
      c.name.includes(keyword) || c.name.replace('فخذ ', '').trim() === keyword
    );

    if (targetNode && targetNode.children && targetNode.children.length > 0) {
      setPathIds([tree.id, targetNode.id]);
      setViewState('tree');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setPlaceholderName(branch.label);
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
    if (!tree) return;
    for (const branchRoot of tree.children ?? []) {
      const path = getPathToRoot(branchRoot, id);
      if (path) { setLineagePath(path); break; }
    }
  }

  if (viewState === 'splash') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="splash"
          id="splash"
          className="dark:bg-[#12100e] transition-colors duration-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ visibility: "visible", pointerEvents: "auto", display: "flex" }}
        >
          <motion.svg
            className="splash-leaf"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 120, delay: 0.1 }}
          >
            <path d="M4 20 C 4 10, 12 4, 20 4 C 20 12, 14 20, 4 20 Z" fill="#4c7a3f" opacity="0.85"/>
            <path d="M4 20 C 8 14, 12 10, 18 6" stroke="#2d4a25" strokeWidth="1.2" fill="none" opacity="0.7"/>
          </motion.svg>
          <motion.h1
            className="dark:text-[#d6b877]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            نسب آل القواسمي
          </motion.h1>
          <motion.h2
            className="dark:text-[#f3ede1]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            عائلة القواسمي
          </motion.h2>
          <motion.button
            className="btn-enter dark:!bg-[#d6b877] dark:!text-[#1c1915]"
            onClick={() => setViewState('branchSelect')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            دخول
          </motion.button>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (viewState === 'branchSelect') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="branchSelect"
          id="branchSelect"
          className="screen visible dark:bg-[#12100e] transition-colors duration-500"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <div className="branch-select-inner mx-auto max-w-6xl px-4">
            <h2 className="branch-title !mb-10 text-center dark:text-[#d6b877]">اختر الفخذ</h2>

            <motion.div
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              variants={gridContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {BRANCHES.map((b) => (
                <motion.div
                  key={b.id}
                  variants={gridItemVariants}
                  onClick={() => handleSelectBranch(b)}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-gold-deep/20 bg-gradient-to-b from-white to-[#fcf9f2] p-6 shadow-[0_8px_20px_rgba(138,95,46,0.06)] hover:border-gold-deep/60 hover:shadow-[0_15px_35px_rgba(138,95,46,0.18)] dark:border-[#d6b877]/20 dark:from-[#1c1915] dark:to-[#1a1713] dark:hover:border-[#d6b877]/60"
                >
                  <div className="absolute left-0 top-0 h-1 w-full scale-x-0 bg-gradient-to-r from-transparent via-gold-deep to-transparent opacity-0 transition-all duration-500 group-hover:scale-x-100 group-hover:opacity-100" />
                  <span className="mb-3 text-[28px] opacity-20 grayscale transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0">🌿</span>
                  <div className="font-cairo text-[18px] font-extrabold text-[#5c4a38] transition-colors duration-300 group-hover:text-gold-deep dark:text-[#f3ede1] dark:group-hover:text-[#d6b877]">
                    {b.label}
                  </div>
                  <div className="absolute bottom-[-20px] text-xs font-bold text-gold-deep/60 dark:text-[#d6b877]/60 opacity-0 transition-all duration-300 group-hover:bottom-2 group-hover:opacity-100">
                    دخول ⟵
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <p className="branch-note !mt-12 text-center dark:text-gray-400">الأفخاذ الجاهزة تفتح تلقائياً، وغير المكتملة تظهر لك رسالة قيد الإعداد.</p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (viewState === 'placeholder') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="placeholder"
          id="branchPlaceholder"
          className="screen visible dark:bg-[#12100e] transition-colors duration-500"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <div className="branch-select-inner">
            <h2 className="branch-title dark:text-[#d6b877]">{placeholderName}</h2>
            <p className="branch-note dark:text-gray-400">بيانات هذا الفخذ قيد الإعداد حاليًا ولم يتم إضافة أبناء له بعد.</p>
            <motion.button
              className="btn primary mt-4 dark:!bg-[#d6b877] dark:!text-[#1c1915]"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setViewState('branchSelect')}
            >
              ⟵ العودة لاختيار الفخذ
            </motion.button>
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
  const displayName = isRoot ? (isBranchRoot ? focusNode.name : "عائلة القواسمي") : focusNode.name.replace('فخذ ', '').trim();

  return (
    <div className="no-print min-h-screen font-cairo dark:bg-[#12100e] transition-colors duration-500">
      <Header
        title={currentPathNodes.length > 1 ? currentPathNodes[1].name.replace('فخذ ', '').trim() : "عائلة القواسمي"}
        branches={BRANCHES}
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
      />

     <div className="app-shell flex w-full">
        <Sidebar
          people={flatPeople}
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectPerson={handleSidebarSelect}
        />

        <main className="main flex-1 w-full transition-all duration-300 min-[901px]:!mr-[320px]">
          <header className="top-header">
            <h1 className="dark:text-[#d6b877]">شجرة العائلة</h1>
            <div className="subtitle dark:text-gray-400">انقر على أي اسم لعرض أبنائه فقط — واستخدم زر «رجوع» للعودة للأب السابق</div>
          </header>

          <div className="toolbar !my-8 !flex !w-full !flex-wrap !items-center !justify-center !gap-3 md:!gap-4">
            
            <motion.button
              className={`group !flex !items-center !gap-2 !rounded-full !border !px-5 !py-2.5 !font-cairo !text-[14.5px] !font-bold ${
                isBranchRoot 
                  ? '!cursor-not-allowed !border-gray-200/50 !bg-gray-50/40 !text-gray-400 !shadow-none dark:!bg-[#1c1915]/50 dark:!border-[#d6b877]/10 dark:!text-gray-600' 
                  : '!border-gold-deep/20 !bg-gradient-to-b !from-white !to-[#fdfbf7] !text-[#5c4a38] !shadow-[0_4px_12px_rgba(138,95,46,0.06)] hover:!text-gold-deep hover:!border-gold-deep/50 dark:!border-[#d6b877]/20 dark:!from-[#1c1915] dark:!to-[#171411] dark:!text-[#f3ede1] dark:hover:!text-[#d6b877]'
              }`}
              disabled={isBranchRoot}
              whileHover={isBranchRoot ? undefined : { y: -4, boxShadow: "0 10px 25px rgba(138,95,46,0.15)" }}
              whileTap={isBranchRoot ? undefined : { scale: 0.96 }}
              onClick={goBack}
            >
              <motion.svg
                className="h-4 w-4"
                animate={{ x: 0 }}
                whileHover={isBranchRoot ? undefined : { x: -4 }}
                viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </motion.svg>
              <span>رجوع</span>
            </motion.button>

            <motion.button
              className="group !flex !items-center !gap-2 !rounded-full !border !border-gold-deep/20 !bg-gradient-to-b !from-white !to-[#fdfbf7] !px-5 !py-2.5 !font-cairo !text-[14.5px] !font-bold !text-[#5c4a38] !shadow-[0_4px_12px_rgba(138,95,46,0.06)] hover:!text-gold-deep hover:!border-gold-deep/50 dark:!border-[#d6b877]/20 dark:!from-[#1c1915] dark:!to-[#171411] dark:!text-[#f3ede1] dark:hover:!text-[#d6b877]"
              whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(138,95,46,0.15)" }}
              whileTap={{ scale: 0.96 }}
              onClick={goHome}
            >
              <motion.span whileHover={{ scale: 1.15 }} className="inline-block">🏠</motion.span>
              <span>البداية</span>
            </motion.button>

            <motion.button
              className="group !flex !items-center !gap-2 !rounded-full !border !border-gold-deep/20 !bg-gradient-to-b !from-white !to-[#fdfbf7] !px-5 !py-2.5 !font-cairo !text-[14.5px] !font-bold !text-[#5c4a38] !shadow-[0_4px_12px_rgba(138,95,46,0.06)] hover:!text-gold-deep hover:!border-gold-deep/50 dark:!border-[#d6b877]/20 dark:!from-[#1c1915] dark:!to-[#171411] dark:!text-[#f3ede1] dark:hover:!text-[#d6b877]"
              whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(138,95,46,0.15)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setLegendOpen(true)}
            >
              <motion.span whileHover={{ scale: 1.15 }} className="inline-block">🎨</motion.span>
              <span>دليل الألوان</span>
            </motion.button>

            <motion.button
              className="group !flex !items-center !gap-2 !rounded-full !border !border-gold-deep/20 !bg-gradient-to-b !from-white !to-[#fdfbf7] !px-5 !py-2.5 !font-cairo !text-[14.5px] !font-bold !text-[#5c4a38] !shadow-[0_4px_12px_rgba(138,95,46,0.06)] hover:!text-gold-deep hover:!border-gold-deep/50 dark:!border-[#d6b877]/20 dark:!from-[#1c1915] dark:!to-[#171411] dark:!text-[#f3ede1] dark:hover:!text-[#d6b877]"
              whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(138,95,46,0.15)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setHelpOpen(true)}
            >
              <motion.span whileHover={{ scale: 1.15 }} className="inline-block">💡</motion.span>
              <span>المساعدة</span>
            </motion.button>
            
          </div>

          <motion.nav
            layout
            className="breadcrumb !mx-auto !mb-8 !flex !w-fit !max-w-full !flex-wrap !items-center !justify-center !gap-1 !rounded-2xl !border !border-gold-deep/15 !bg-gradient-to-r !from-[#fdfbf7] !via-white !to-[#fdfbf7] !px-4 !py-2.5 !shadow-[0_8px_25px_rgba(138,95,46,0.06)] dark:!border-[#d6b877]/20 dark:!bg-gradient-to-r dark:!from-[#1c1915] dark:!via-[#1a1713] dark:!to-[#1c1915]"
          >
            <AnimatePresence initial={false}>
              {currentPathNodes.slice(1).map((node, i) => {
                const isCurrent = i === currentPathNodes.slice(1).length - 1;
                const nodeName = node.name.replace('فخذ ', '');
                return (
                  <motion.span
                    key={node.id}
                    layout
                    initial={{ opacity: 0, x: 12, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", damping: 24, stiffness: 300 }}
                    className="flex items-center gap-1"
                  >
                    {i > 0 && (
                      <svg className="mx-1 h-3.5 w-3.5 text-gold-deep/40 dark:text-[#d6b877]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    )}

                    <button
                      onClick={() => !isCurrent && navigateToBreadcrumb(i + 1)}
                      className={`group relative rounded-xl px-3 py-1.5 font-cairo transition-all duration-300 ${
                        isCurrent
                          ? "!cursor-default !bg-gold-deep/5 dark:!bg-[#d6b877]/10 !text-[15.5px] !font-extrabold !text-gold-deep dark:!text-[#d6b877]"
                          : "!text-[14.5px] !font-bold !text-[#7a6652] dark:!text-gray-400 hover:!bg-gold-deep/10 dark:hover:!bg-[#d6b877]/10 hover:!text-gold-deep dark:hover:!text-[#d6b877]"
                      }`}
                    >
                      {nodeName}

                      {!isCurrent && (
                        <span className="absolute bottom-0.5 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-gold-deep/40 dark:bg-[#d6b877]/40 transition-all duration-300 group-hover:w-1/2" />
                      )}
                    </button>
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </motion.nav>

          <div className="page-wrap">
            <AnimatePresence mode="wait">
              <motion.div
                key={focusNode.id}
                className="page"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              >

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className={`focus-card reveal in-view ${kidsCount ? 'has-children' : 'no-children'}`}
                >
                  <LeafIcon />
                  <div className="name">{displayName}</div>

                  {calculateAgeDisplay(focusNode.birth_date, focusNode.death_date) && (
                    <div className="text-[13px] text-[#fff9ee] mt-1.5 opacity-95 leading-relaxed font-bold bg-black/15 w-fit mx-auto px-3 py-0.5 rounded-full shadow-sm">
                      {calculateAgeDisplay(focusNode.birth_date, focusNode.death_date)}
                    </div>
                  )}

                  {!isRoot && !isBranchRoot && (
                    <div className="father-tag">ابن {parentNode.name.replace('فخذ ', '')}</div>
                  )}

                  <div className="meta">
                    {kidsCount ? `${kidsCount} من الأبناء المباشرين — ${descCount} فرداً في هذا الفرع` : 'لا يوجد أبناء مسجلون'}
                  </div>

                  <div className="focus-actions">
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn ghost small" onClick={() => setVisualTreeRoot(focusNode)}>🌿 عرض الشجرة الرقمية</motion.button>

                    {!isRoot && (
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn ghost small" onClick={() => handleShowLineage(focusNode.id)}>📜 عرض تسلسل النسب</motion.button>
                    )}
                  </div>
                </motion.div>

                {kidsCount > 0 ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="section-title dark:text-[#d6b877]"
                    >
                      الأبناء <span className="badge">{kidsCount}</span>
                    </motion.div>
                    <motion.div
                      className="children-grid"
                      variants={gridContainerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {focusNode.children!.map((child) => {
                        const childKidsCount = child.children ? child.children.length : 0;
                        const totalDesc = countDescendants(child);

                        return (
                          <motion.div
                            key={child.id}
                            variants={gridItemVariants}
                            whileHover={{ y: -6, scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className={`child-card reveal in-view dark:bg-[#1c1915] dark:border-[#d6b877]/20 ${childKidsCount ? 'has-children' : 'no-children'}`}
                            onClick={() => navigateIntoChild(child.id)}
                          >
                            <LeafIcon />
                            <div className="name dark:text-[#f3ede1]">{child.name}</div>

                          {calculateAgeDisplay(child.birth_date, child.death_date) && (
                              <div className="text-[11px] mt-1.5 text-center leading-relaxed font-bold bg-black/15 dark:bg-black/30 text-white/95 dark:text-[#d6b877] w-fit mx-auto px-2.5 py-0.5 rounded-md transition-colors shadow-sm">
                                {calculateAgeDisplay(child.birth_date, child.death_date)}
                              </div>
                            )}

                            {!isRoot && <div className="father-tag mt-1 dark:text-gray-400">ابن {displayName}</div>}
                            <div className="sub dark:text-gray-500">{childKidsCount ? `${childKidsCount} أبناء` : 'بدون أبناء'}</div>
                            {childKidsCount > 0 && <span className="count-badge">{totalDesc > 99 ? '99+' : totalDesc}</span>}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                    
                    

                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="empty-state dark:bg-[#1c1915] dark:border-[#d6b877]/20 dark:text-gray-400"
                  >
                    لا يوجد أبناء مسجلين لهذا الاسم حتى الآن.
                  </motion.div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
          
          <footer className="mt-8 mb-4 flex flex-col items-center justify-center gap-1.5 text-center font-cairo">
            
            <div className="text-[12.5px] font-semibold text-ink-soft/90 dark:text-[#f3ede1]/70">
              إجمالي الأفراد في الشجرة: <span className="font-bold text-gold-deep dark:text-[#d6b877]">{countAllPeople(tree)}</span> فرد
            </div>

          {/* <motion.button
              onClick={() => setIsAddModalOpen(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="group my-1 flex items-center gap-2 rounded-full border border-gold-deep/30 bg-white/40 px-5 py-1.5 text-[12px] font-bold text-gold-deep hover:bg-gold-deep/10 hover:shadow-sm dark:border-[#d6b877]/30 dark:bg-[#1c1915]/50 dark:text-[#d6b877]"
            >
              <span className="text-[14px] transition-transform duration-300 group-hover:scale-110">📝</span>
              <span>طلب إضافة فرد جديد</span>
            </motion.button>*/}

            <div className="my-0.5 h-[1px] w-1/4 max-w-[80px] bg-gradient-to-r from-transparent via-gold-deep/20 to-transparent dark:via-[#d6b877]/30" />

            <div className="flex flex-col items-center gap-0.5 text-[12px] font-semibold text-ink-soft/80 dark:text-[#f3ede1]/60">
              <p className="m-0 leading-tight">
                تم بناؤه وتطويره بواسطة{' '}
                <button 
                  type="button"
                  onClick={() => {
                    const myNode = flatPeople.find(p => p.name.includes("ينال"));
                    if (myNode) {
                      handleSidebarSelect(myNode.id);
                    } else {
                      alert("لم يتم العثور على الاسم في البيانات! تأكد أن الاسم مسجل في الشجرة.");
                    }
                  }}
                  className="!inline !m-0 !border-none !bg-transparent !p-0 !shadow-none font-bold text-gold-deep underline decoration-gold-deep/30 underline-offset-4 outline-none transition-all hover:text-gold-deep/70 hover:decoration-gold-deep/70 focus:outline-none dark:text-[#d6b877] cursor-pointer"
                >
                  ينال سفيان ربحي القواسمي
                </button>
              </p>
              
              <a 
                href="https://wa.me/962791741700" 
                target="_blank" 
                rel="noreferrer" 
                className="group flex items-center justify-center gap-1.5 text-ink-soft/80 transition-colors hover:text-[#25D366] dark:text-[#f3ede1]/70 dark:hover:text-[#25D366] !no-underline outline-none"
              >
                <span>للإبلاغ عن أي خطأ أو تعديل:</span>
                <span className="font-bold tracking-wider text-gold-deep/90 transition-colors group-hover:text-[#25D366] dark:text-[#d6b877]/90" dir="ltr">+962 79 174 1700</span>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[15px] w-[15px] text-gold-deep/80 transition-colors group-hover:text-[#25D366] dark:text-[#d6b877]/80">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </footer>
        </main>
      </div>

      <AnimatePresence>
        {isLegendOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="legend-modal-overlay active"
            onClick={() => setLegendOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="legend-modal-content dark:!bg-[#1c1915] dark:border dark:border-[#d6b877]/20"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="legend-modal-title dark:text-[#d6b877]"><span>🎨</span> دليل الألوان</h3>
              <div className="legend-modal-item"><div className="legend-box legend-father"></div><span className="dark:text-[#f3ede1]">الأب (الاسم المعروض حالياً)</span></div>
              <div className="legend-modal-item"><div className="legend-box legend-has-kids"></div><span className="dark:text-[#f3ede1]">ابن يمتلك أبناء (يمكن الدخول إليه)</span></div>
              <div className="legend-modal-item"><div className="legend-box legend-no-kids"></div><span className="dark:text-[#f3ede1]">ابن بدون أبناء</span></div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn primary close-legend-btn dark:!bg-[#d6b877] dark:!text-[#1c1915]" onClick={() => setLegendOpen(false)}>إغلاق</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHelpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="legend-modal-overlay active"
            onClick={() => setHelpOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="legend-modal-content dark:!bg-[#1c1915] dark:border dark:border-[#d6b877]/20"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="legend-modal-title dark:text-[#d6b877]"><span>💡</span> ملاحظات ومساعدة</h3>
              <ul style={{ paddingRight: '20px', fontSize: '13.5px', lineHeight: '1.8', fontWeight: 600 }} className="text-[var(--ink)] dark:text-[#f3ede1]">
                <li>استخدم زر "الفهرس" للبحث عن الاسم المطلوب مباشرة.</li>
                <li>انقر على أي اسم داخل الشجرة للدخول إليه وعرض أبنائه.</li>
                <li>استخدم زر "رجوع" في الأعلى للعودة إلى الأب السابق.</li>
                <li>يمكنك عرض أو طباعة وثيقة النسب باستخدام الأزرار المخصصة.</li>
              </ul>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn primary close-legend-btn mt-4 dark:!bg-[#d6b877] dark:!text-[#1c1915]" onClick={() => setHelpOpen(false)}>حسناً، فهمت</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LineageCertificateModal isOpen={lineagePath !== null} ancestorPath={lineagePath} totalCount={countAllPeople(tree)} onClose={() => setLineagePath(null)} />
      <VisualTreeModal isOpen={visualTreeRoot !== null} rootNode={visualTreeRoot} onClose={() => setVisualTreeRoot(null)} />




     <LineageCertificateModal isOpen={lineagePath !== null} ancestorPath={lineagePath} totalCount={countAllPeople(tree)} onClose={() => setLineagePath(null)} />
      <VisualTreeModal isOpen={visualTreeRoot !== null} rootNode={visualTreeRoot} onClose={() => setVisualTreeRoot(null)} />

      {/* 👇 ضفنا المودال هون مع باقي النوافذ عشان يشتغل صح */}
      <FeaturesMenuModal 
     isOpen={isFeaturesMenuOpen} 
     onClose={() => setIsFeaturesMenuOpen(false)} 
     onOpenKinship={() => {
       setIsFeaturesMenuOpen(false);
       setTimeout(() => setIsKinshipOpen(true), 150);
     }}
     onOpenAddMember={() => {
       setIsFeaturesMenuOpen(false);
       setTimeout(() => setIsAddModalOpen(true), 150);
     }}
     // 👇 ضفنا أمر الإحصائيات هون
     onOpenStats={() => {
       setIsFeaturesMenuOpen(false);
       setTimeout(() => setIsStatsOpen(true), 150);
     }}
     onOpenAbout={() => {
       setIsFeaturesMenuOpen(false);
       setTimeout(() => setIsAboutOpen(true), 150);
     }}
     onOpenComplaints={() => {
     setIsFeaturesMenuOpen(false);
     setTimeout(() => setIsComplaintsOpen(true), 150); 
    }}
    onOpenEditRequest={() => {
    setIsFeaturesMenuOpen(false);
    setTimeout(() => setIsEditRequestOpen(true), 150);
  }}
   />

      {/* 2. نافذة كاشف القرابة (لازم تكون موجودة هون) */}
      <KinshipModal 
        isOpen={isKinshipOpen} 
        onClose={() => setIsKinshipOpen(false)} 
        people={flatPeople} 
      />

      <StatisticsModal 
     isOpen={isStatsOpen} 
     onClose={() => setIsStatsOpen(false)} 
   />

   <FamilyAboutModal 
     isOpen={isAboutOpen} 
     onClose={() => setIsAboutOpen(false)} 
   />
   <ComplaintsModal isOpen={isComplaintsOpen}
    onClose={() => setIsComplaintsOpen(false)} 
    />
    <EditRequestModal 
  isOpen={isEditRequestOpen} 
  onClose={() => setIsEditRequestOpen(false)} 
/>

      {/* 3. نافذة إضافة الفرد */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddMemberModal key="add-member" onClose={() => setIsAddModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}