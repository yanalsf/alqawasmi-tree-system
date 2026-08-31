// apps/admin/components/AdminTreeView.tsx
"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import type { FamilyNode } from "@/lib/constants";
import {
  addChildToTree, updateNodeInTree, removeNodeFromTree,
  findNodeById, getPathToRoot, countAllPeople
} from "@/lib/treeUtils";

import Header from "./Header";
import Sidebar from "./Sidebar";
import AddPersonModal, { CreatedPerson } from "./AddPersonModal";
import EditPersonModal, { EditedPerson } from "./EditPersonModal";
import ConfirmDeleteModal, { DeleteTarget } from "./ConfirmDeleteModal";
import LineageCertificateModal from "./LineageCertificateModal";
import VisualTreeModal from "./VisualTreeModal";

const VIRTUAL_ROOT_ID = 941;

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

const LeafIcon = () => (
  <svg className="leaf-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20 C 4 10, 12 4, 20 4 C 20 12, 14 20, 4 20 Z" fill="#fff8ec" opacity="0.85"/>
    <path d="M4 20 C 8 14, 12 10, 18 6" stroke="#4c7a3f" strokeWidth="1.2" fill="none" opacity="0.7"/>
  </svg>
);

function countDescendants(node: FamilyNode): number {
  let n = 0;
  if (node.children) {
    n += node.children.length;
    node.children.forEach(c => n += countDescendants(c));
  }
  return n;
}

export default function AdminTreeView() {
  const [tree, setTree] = useState<FamilyNode | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [viewState, setViewState] = useState<'splash' | 'branchSelect' | 'tree' | 'placeholder'>('splash');
  const [placeholderName, setPlaceholderName] = useState("");
  
  const [pathIds, setPathIds] = useState<number[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // النوافذ المنبثقة
  const [addModalParentId, setAddModalParentId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<EditedPerson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [lineagePath, setLineagePath] = useState<FamilyNode[] | null>(null);
  const [visualTreeRoot, setVisualTreeRoot] = useState<FamilyNode | null>(null);
  const [isLegendOpen, setLegendOpen] = useState(false);
  const [isHelpOpen, setHelpOpen] = useState(false);

  const loadTree = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/tree");
      if (!res.ok) throw new Error("bad response");
      const data: FamilyNode = await res.json();
      setTree(data);
    } catch {
      setLoadError("تعذر تحميل شجرة العائلة");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setIsDarkMode(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const flatPeople = useMemo(() => {
    const list: any[] = [];
    function walk(n: FamilyNode, depth: number, father: string | null) {
      if (n.id !== VIRTUAL_ROOT_ID) list.push({ id: n.id, name: n.name, depth, father });
      if (n.children) n.children.forEach(c => walk(c, depth + 1, n.name));
    }
    if (tree) walk(tree, 0, null);
    return list;
  }, [tree]);

  // --- دوال التنقل ---
  function handleSelectBranch(branch: {id: string, label: string}) {
    if (!tree) return;
    const targetNode = tree.children?.find(c => c.name.includes(branch.label.replace('فخذ ', '')));
    if (targetNode) {
      setPathIds([tree.id, targetNode.id]);
      setViewState('tree');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setPlaceholderName(branch.label);
      setViewState('placeholder');
    }
  }

  function handleSidebarSelect(id: number) {
    if (!tree) return;
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

  function navigateIntoChild(id: number) { setPathIds(prev => [...prev, id]); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function goBack() { if (pathIds.length > 2) setPathIds(prev => prev.slice(0, -1)); }
  
  // زر البداية يرجع لرأس الفخذ الأساسي الحالي (العنصر الثاني في المسار متجاوزاً الجذر 941)
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

  // --- دوال الإضافة والتعديل ---
  function handleAddChild(parentId: number) { setAddModalParentId(parentId); }
  function handleEdit(id: number) {
    if (!tree) return;
    const node = findNodeById(tree, id);
    if (node) setEditTarget({ id: node.id, name: node.name, birth_date: node.birth_date, death_date: node.death_date });
  }
  function handleDelete(id: number) {
    if (!tree) return;
    const node = findNodeById(tree, id);
    if (node) setDeleteTarget({ id: node.id, name: node.name });
  }
  function handleCreated(created: CreatedPerson) {
    if (tree === null || addModalParentId === null) return;
    const newNode: FamilyNode = { id: created.id, name: created.name, birth_date: created.birth_date, death_date: created.death_date };
    setTree(addChildToTree(tree, addModalParentId, newNode));
  }
  function handleSaved(edited: EditedPerson) {
    if (!tree) return;
    setTree(updateNodeInTree(tree, edited.id, { name: edited.name, birth_date: edited.birth_date, death_date: edited.death_date }));
  }
  function handleDeleted(id: number) {
    if (!tree) return;
    setTree(removeNodeFromTree(tree, id));
    if (pathIds.includes(id)) setPathIds(prev => prev.slice(0, prev.indexOf(id)));
  }

  function handleShowLineage(id: number) {
    if (!tree) return;
    for (const branchRoot of tree.children ?? []) {
      const path = getPathToRoot(branchRoot, id);
      if (path) { setLineagePath(path); break; }
    }
  }

  if (isLoading) return <p className="p-6 text-center text-ink-soft">جارٍ تحميل الشجرة...</p>;
  if (loadError || !tree) return <div className="p-6 text-center text-maroon">{loadError}</div>;

  if (viewState === 'splash') {
    return (
      <div id="splash" style={{ opacity: 1, visibility: "visible", pointerEvents: "auto", display: "flex" }}>
        <svg className="splash-leaf" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 20 C 4 10, 12 4, 20 4 C 20 12, 14 20, 4 20 Z" fill="#4c7a3f" opacity="0.85"/>
          <path d="M4 20 C 8 14, 12 10, 18 6" stroke="#2d4a25" strokeWidth="1.2" fill="none" opacity="0.7"/>
        </svg>
        <h1>لوحة الإدارة - القواسمي</h1>
        <h2>تعديل بيانات العائلة</h2>
        <button className="btn-enter" onClick={() => {
          const pass = window.prompt("الرجاء إدخال كلمة المرور للوحة الإدارة:");
          if (pass) {
            sessionStorage.setItem("editorPassword", pass.trim());
            setViewState('branchSelect');
          }
        }}>دخول للوحة التعديل</button>
      </div>
    );
  }

  if (viewState === 'branchSelect') {
    return (
      <div id="branchSelect" className="screen visible">
        <div className="branch-select-inner">
          <h2 className="branch-title">اختر الفخذ للتعديل</h2>
          <div className="branch-options">
            {BRANCHES.map((b) => (
              <div key={b.id} className="branch-card" onClick={() => handleSelectBranch(b)}>
                <div className="branch-name">{b.label}</div>
              </div>
            ))}
          </div>
          <p className="branch-note">يمكنك إضافة وتعديل الأسماء مباشرة بعد الدخول للفخذ.</p>
        </div>
      </div>
    );
  }

  if (viewState === 'placeholder') {
    return (
      <div id="branchPlaceholder" className="screen visible">
        <div className="branch-select-inner">
          <h2 className="branch-title">{placeholderName}</h2>
          <p className="branch-note">هذا الفخذ غير موجود بعد. يمكنك إضافته من لوحة التحكم.</p>
          <button className="btn primary mt-4" onClick={() => setViewState('branchSelect')}>⟵ العودة لاختيار الفخذ</button>
        </div>
      </div>
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
  const displayName = isRoot ? "لوحة الإدارة" : focusNode.name.replace('فخذ ', '').trim();

  return (
    <div className="no-print min-h-screen font-cairo">
      <Header
        title="لوحة الإدارة"
        branches={BRANCHES}
        onNavigateHome={goToBranchSelect}
        onSelectBranch={(branchId) => {
          const branch = BRANCHES.find(b => b.id === branchId);
          if (branch) handleSelectBranch(branch);
        }}
        onToggleSidebar={() => setSidebarOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <div className="app-shell">
        <Sidebar
          people={flatPeople}
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectPerson={handleSidebarSelect}
        />

        <main className="main">
          <header className="top-header">
            <h1>إدارة شجرة العائلة</h1>
            <div className="subtitle">انقر على أي اسم لعرض أبنائه، أو استخدم أيقونات القلم وسلة المهملات للتعديل.</div>
          </header>

          <div className="toolbar">
            <button className="btn icon-only" id="backBtn" title="رجوع" disabled={isBranchRoot} onClick={goBack}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="label">رجوع</span>
            </button>
            <button className="btn ghost" onClick={goHome}>🏠 <span className="label">البداية</span></button>
            <button className="btn ghost" onClick={() => setLegendOpen(true)}>🎨 <span className="label">دليل الألوان</span></button>
            <button className="btn ghost" onClick={() => setHelpOpen(true)}>💡 <span className="label">المساعدة</span></button>
          </div>

          <nav className="breadcrumb">
            {currentPathNodes.slice(1).map((node, i) => {
              const isCurrent = i === currentPathNodes.slice(1).length - 1;
              const nodeName = node.name.replace('فخذ ', '');
              return (
                <span key={node.id} className="flex items-center gap-1.5">
                  {i > 0 && <span className="sep">‹</span>}
                  <button className={isCurrent ? "current" : ""} onClick={() => !isCurrent && navigateToBreadcrumb(i + 1)}>
                    {nodeName}
                  </button>
                </span>
              );
            })}
          </nav>

          <div className="page-wrap">
            <div className="page animate-fade-slide">
              
              <div className={`focus-card reveal in-view ${kidsCount ? 'has-children' : 'no-children'}`}>
                <LeafIcon />
                <div className="name">{displayName}</div>
                
                {(focusNode.birth_date || focusNode.death_date) && (
                  <div className="text-[13.5px] text-[#fff9ee] mt-1 opacity-95 leading-relaxed">
                    <span>{focusNode.birth_date ? focusNode.birth_date.split('-')[0] : '؟'} - {focusNode.death_date ? focusNode.death_date.split('-')[0] : '...'}</span>
                  </div>
                )}

                {!isRoot && !isBranchRoot && (
                  <div className="father-tag">ابن {parentNode.name.replace('فخذ ', '')}</div>
                )}
                
                <div className="meta">
                  {kidsCount ? `${kidsCount} من الأبناء المباشرين — ${descCount} فرداً في هذا الفرع` : 'لا يوجد أبناء مسجلون'}
                </div>
                
                <div className="focus-actions">
                  <button className="btn ghost small" onClick={() => setVisualTreeRoot(focusNode)}>🌿 عرض الشجرة الرقمية</button>
                  
                  {!isRoot && (
                    <button className="btn ghost small" onClick={() => handleShowLineage(focusNode.id)}>📜 عرض تسلسل النسب</button>
                  )}

                  <button className="btn small" onClick={() => handleAddChild(focusNode.id)}>+ إضافة ابن</button>
                  {!isRoot && (
                    <button className="btn small" onClick={() => handleEdit(focusNode.id)}>تعديل الاسم</button>
                  )}
                </div>
              </div>

              {kidsCount > 0 ? (
                <>
                  <div className="section-title">الأبناء <span className="badge">{kidsCount}</span></div>
                  <div className="children-grid">
                    {focusNode.children!.map((child, idx) => {
                      const childKidsCount = child.children ? child.children.length : 0;
                      const totalDesc = countDescendants(child);
                      
                      return (
                        <div 
                          key={child.id} 
                          className={`child-card reveal in-view ${childKidsCount ? 'has-children' : 'no-children'}`}
                          style={{ transitionDelay: `${Math.min(idx * 45, 360)}ms` }}
                          onClick={() => navigateIntoChild(child.id)}
                        >
                          <LeafIcon />
                          <div className="name">{child.name}</div>
                          
                          {(child.birth_date || child.death_date) && (
                            <div className="text-[11.5px] text-[#f6fbef] mt-1 text-center opacity-90 leading-relaxed font-bold">
                              {child.birth_date ? child.birth_date.split('-')[0] : '؟'} - {child.death_date ? child.death_date.split('-')[0] : '...'}
                            </div>
                          )}

                          {!isRoot && <div className="father-tag mt-1">ابن {displayName}</div>}
                          <div className="sub">{childKidsCount ? `${childKidsCount} أبناء` : 'بدون أبناء'}</div>
                          
                          {childKidsCount > 0 && <span className="count-badge">{totalDesc > 99 ? '99+' : totalDesc}</span>}

                          <button className="edit-pencil" title="تعديل" onClick={(e) => { e.stopPropagation(); handleEdit(child.id); }}>✎</button>
                          <button className="delete-trash" title="حذف" onClick={(e) => { e.stopPropagation(); handleDelete(child.id); }}>🗑️</button>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="empty-state">لا يوجد أبناء مسجلين لهذا الاسم حتى الآن.</div>
              )}

            </div>
          </div>
          
          <footer className="stats-line mt-8 text-center text-xs text-ink-soft opacity-75">
            إجمالي الأفراد في الشجرة: {countAllPeople(tree)} فرد
          </footer>
        </main>
      </div>

      {isLegendOpen && (
        <div className="legend-modal-overlay active" onClick={() => setLegendOpen(false)}>
          <div className="legend-modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="legend-modal-title"><span>🎨</span> دليل الألوان</h3>
            <div className="legend-modal-item"><div className="legend-box legend-father"></div><span>الأب (الاسم المعروض حالياً)</span></div>
            <div className="legend-modal-item"><div className="legend-box legend-has-kids"></div><span>ابن يمتلك أبناء (يمكن الدخول إليه)</span></div>
            <div className="legend-modal-item"><div className="legend-box legend-no-kids"></div><span>ابن بدون أبناء</span></div>
            <button className="btn primary close-legend-btn" onClick={() => setLegendOpen(false)}>إغلاق</button>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="legend-modal-overlay active" onClick={() => setHelpOpen(false)}>
          <div className="legend-modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="legend-modal-title"><span>💡</span> ملاحظات ومساعدة</h3>
            <ul style={{ paddingRight: '20px', fontSize: '13.5px', lineHeight: '1.8', color: 'var(--ink)', fontWeight: 600 }}>
              <li>هذه لوحة الإدارة، يمكنك التعديل وإضافة الأسماء بحرية.</li>
              <li>استخدم زر "الفهرس" للبحث عن الاسم المطلوب مباشرة.</li>
              <li>انقر على أي اسم داخل الشجرة للدخول إليه.</li>
              <li>اضغط على أيقونة القلم ✎ لتعديل بيانات الابن، وأيقونة السلة 🗑️ للحذف.</li>
            </ul>
            <button className="btn primary close-legend-btn mt-4" onClick={() => setHelpOpen(false)}>حسناً، فهمت</button>
          </div>
        </div>
      )}

      <AddPersonModal isOpen={addModalParentId !== null} parentId={addModalParentId ?? tree!.id} onClose={() => setAddModalParentId(null)} onCreated={handleCreated} />
      <EditPersonModal isOpen={editTarget !== null} person={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />
      <ConfirmDeleteModal isOpen={deleteTarget !== null} target={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      <LineageCertificateModal isOpen={lineagePath !== null} ancestorPath={lineagePath} totalCount={countAllPeople(tree!)} onClose={() => setLineagePath(null)} />
      <VisualTreeModal isOpen={visualTreeRoot !== null} rootNode={visualTreeRoot} onClose={() => setVisualTreeRoot(null)} />
    </div>
  );
}