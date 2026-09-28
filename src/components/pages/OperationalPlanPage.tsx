'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, SCHOOL_NAME } from '@/lib/data';
import {
  OperationalObjective,
  OperationalAction,
  OperationalPlanState,
  ExecutionStatus,
  SOURCE_MODULE_LABELS,
  loadOperationalPlan,
  saveOperationalPlan,
  syncOperationalPlan,
  addObjective,
  updateObjective,
  deleteObjective,
  addAction,
  updateAction,
  toggleActionStatus,
  deleteAction,
  restoreExcludedAction,
  restoreActionOriginalValues,
  reorderObjectives,
  reorderActions,
  printOfficialOperationalPlan,
} from '@/lib/operationalPlanData';

interface Props {
  currentUser: User;
  selectedYear: string;
  onNavigate?: (page: string) => void;
}

export default function OperationalPlanPage({ currentUser, selectedYear, onNavigate }: Props) {
  // Permission check
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'leader' || currentUser.role === 'evaluator';

  // Core State
  const [state, setState] = useState<OperationalPlanState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'interactive' | 'print_preview'>('interactive');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObjectiveFilter, setSelectedObjectiveFilter] = useState('ALL');
  const [selectedAudienceFilter, setSelectedAudienceFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | ExecutionStatus>('ALL');

  // Modals & Drawers
  const [showAddObjModal, setShowAddObjModal] = useState(false);
  const [showAddActModal, setShowAddActModal] = useState(false);
  const [editingAction, setEditingAction] = useState<OperationalAction | null>(null);
  const [editingObjective, setEditingObjective] = useState<OperationalObjective | null>(null);
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null);
  const [deletingObjectiveId, setDeletingObjectiveId] = useState<string | null>(null);
  const [deleteReassignToId, setDeleteReassignToId] = useState<string>('DELETE_ACTIONS');
  const [showExcludedDrawer, setShowExcludedDrawer] = useState(false);
  const [viewingSourceAction, setViewingSourceAction] = useState<OperationalAction | null>(null);
  const [showPrintInstructionsModal, setShowPrintInstructionsModal] = useState(false);

  // Form State for Add Objective
  const [newObjTitle, setNewObjTitle] = useState('');
  const [newObjCode, setNewObjCode] = useState('');
  const [newObjDesc, setNewObjDesc] = useState('');

  // Form State for Edit Objective
  const [editObjTitle, setEditObjTitle] = useState('');
  const [editObjCode, setEditObjCode] = useState('');
  const [editObjDesc, setEditObjDesc] = useState('');

  // Form State for Add Action
  const [newActObjectiveId, setNewActObjectiveId] = useState('');
  const [newActTitle, setNewActTitle] = useState('');
  const [newActAudience, setNewActAudience] = useState('');
  const [newActTimeframe, setNewActTimeframe] = useState('');
  const [newActStatus, setNewActStatus] = useState<ExecutionStatus>('تم التنفيذ');
  const [newActNotes, setNewActNotes] = useState('');

  // ─── Initial Load & Auto-Sync ──────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoading(true);
      try {
        const loaded = await loadOperationalPlan(selectedYear);
        if (isMounted) {
          setState(loaded);
          // Set default objective for new action
          if (loaded.objectives.length > 0) {
            setNewActObjectiveId(loaded.objectives[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load operational plan:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [selectedYear]);

  // Manual continuous sync
  const handleManualSync = async () => {
    if (!state || syncing) return;
    setSyncing(true);
    try {
      const updated = await syncOperationalPlan(state, selectedYear);
      setState(updated);
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  // ─── Metrics & KPI Summary ────────────────────────────────────────────────
  const metrics = useMemo(() => {
    if (!state) return { totalObj: 0, totalAct: 0, executed: 0, unexecuted: 0, undefinedCount: 0, rate: 0 };
    const totalObj = state.objectives.length;
    const totalAct = state.actions.length;
    const executed = state.actions.filter(a => a.status === 'تم التنفيذ').length;
    const unexecuted = state.actions.filter(a => a.status === 'لم يتم التنفيذ').length;
    const undefinedCount = state.actions.filter(a => a.status === 'غير محدد').length;

    // Strict rule: do not count undefined in unexecuted
    const base = executed + unexecuted;
    const rate = base > 0 ? Math.round((executed / base) * 100) : 0;

    return { totalObj, totalAct, executed, unexecuted, undefinedCount, rate };
  }, [state]);

  // ─── Filter Options ───────────────────────────────────────────────────────
  const audienceOptions = useMemo(() => {
    if (!state) return [];
    const set = new Set<string>();
    state.actions.forEach(a => {
      if (a.targetAudience && a.targetAudience !== 'غير محدد') {
        set.add(a.targetAudience);
      }
    });
    return Array.from(set).sort();
  }, [state]);

  // Filtered Actions for Screen Display
  const filteredActions = useMemo(() => {
    if (!state) return [];
    return state.actions.filter(a => {
      // Objective filter
      if (selectedObjectiveFilter !== 'ALL' && a.objectiveId !== selectedObjectiveFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'ALL' && a.status !== selectedStatusFilter) {
        return false;
      }
      // Audience filter
      if (selectedAudienceFilter !== 'ALL' && a.targetAudience !== selectedAudienceFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const obj = state.objectives.find(o => o.id === a.objectiveId);
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchAudience = a.targetAudience.toLowerCase().includes(q);
        const matchTime = a.timeframe.toLowerCase().includes(q);
        const matchNotes = (a.notes || '').toLowerCase().includes(q);
        const matchObj = obj ? obj.title.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchAudience && !matchTime && !matchNotes && !matchObj) {
          return false;
        }
      }
      return true;
    });
  }, [state, selectedObjectiveFilter, selectedStatusFilter, selectedAudienceFilter, searchQuery]);

  // Group actions by objective for screen display
  const groupedScreenData = useMemo(() => {
    if (!state) return [];
    const map = new Map<string, OperationalAction[]>();
    state.objectives.forEach(obj => {
      map.set(obj.id, []);
    });

    filteredActions.forEach(action => {
      const list = map.get(action.objectiveId);
      if (list) {
        list.push(action);
      } else {
        map.set(action.objectiveId, [action]);
      }
    });

    return state.objectives
      .map(obj => ({
        objective: obj,
        actions: map.get(obj.id) || [],
      }))
      .filter(group => {
        // If an objective filter is active, only show that objective
        if (selectedObjectiveFilter !== 'ALL') {
          return group.objective.id === selectedObjectiveFilter;
        }
        // If there's a search/status/audience filter active, only show objectives that have matching actions
        if (searchQuery.trim() || selectedStatusFilter !== 'ALL' || selectedAudienceFilter !== 'ALL') {
          return group.actions.length > 0;
        }
        return true;
      });
  }, [state, filteredActions, selectedObjectiveFilter, selectedStatusFilter, selectedAudienceFilter, searchQuery]);

  // Group full actions by objective for official printing
  const groupedPrintData = useMemo(() => {
    if (!state) return [];
    const map = new Map<string, OperationalAction[]>();
    state.objectives.forEach(obj => {
      map.set(obj.id, []);
    });

    const sorted = [...state.actions].sort((a, b) => (a.order || 0) - (b.order || 0));
    sorted.forEach(action => {
      const list = map.get(action.objectiveId);
      if (list) {
        list.push(action);
      } else {
        map.set(action.objectiveId, [action]);
      }
    });

    return state.objectives.map(obj => ({
      objective: obj,
      actions: map.get(obj.id) || [],
    }));
  }, [state]);

  // ─── Objective Handlers (Add / Edit / Delete / Reorder) ────────────────────
  const handleAddObjectiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !newObjTitle.trim()) return;
    const updated = addObjective(state, newObjTitle, newObjCode, newObjDesc);
    setState(updated);
    await saveOperationalPlan(updated);
    setNewObjTitle('');
    setNewObjCode('');
    setNewObjDesc('');
    setShowAddObjModal(false);
  };

  const handleOpenEditObjective = (obj: OperationalObjective) => {
    setEditingObjective(obj);
    setEditObjTitle(obj.title);
    setEditObjCode(obj.code);
    setEditObjDesc(obj.description || '');
  };

  const handleEditObjectiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !editingObjective || !editObjTitle.trim()) return;
    const updated = updateObjective(state, editingObjective.id, {
      title: editObjTitle.trim(),
      code: editObjCode.trim() || editingObjective.code,
      description: editObjDesc.trim(),
    });
    setState(updated);
    await saveOperationalPlan(updated);
    setEditingObjective(null);
  };

  const handleDeleteObjectiveConfirm = async () => {
    if (!state || !deletingObjectiveId) return;
    const reassignId = deleteReassignToId === 'DELETE_ACTIONS' ? undefined : deleteReassignToId;
    const updated = deleteObjective(state, deletingObjectiveId, reassignId);
    setState(updated);
    await saveOperationalPlan(updated);
    setDeletingObjectiveId(null);
    setDeleteReassignToId('DELETE_ACTIONS');
  };

  const handleMoveObjective = async (objectiveId: string, direction: 'up' | 'down') => {
    if (!state || !isAdmin) return;
    const index = state.objectives.findIndex(o => o.id === objectiveId);
    if (index < 0) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === state.objectives.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = reorderObjectives(state, index, targetIndex);
    setState(updated);
    await saveOperationalPlan(updated);
  };

  // ─── Action Handlers (Add / Edit / Toggle / Delete / Reorder) ───────────────
  const handleToggleStatus = async (actionId: string) => {
    if (!state || !isAdmin) return;
    const updated = toggleActionStatus(state, actionId);
    setState(updated);
    await saveOperationalPlan(updated);
  };

  const handleAddActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !newActTitle.trim() || !newActObjectiveId) return;
    const updated = addAction(state, {
      objectiveId: newActObjectiveId,
      title: newActTitle,
      targetAudience: newActAudience || 'المجتمع المدرسي والكوادر المعنية',
      timeframe: newActTimeframe || `العام الأكاديمي ${selectedYear}`,
      status: newActStatus,
      notes: newActNotes,
    });
    setState(updated);
    await saveOperationalPlan(updated);
    setNewActTitle('');
    setNewActAudience('');
    setNewActTimeframe('');
    setNewActNotes('');
    setShowAddActModal(false);
  };

  const handleEditActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !editingAction) return;
    const updated = updateAction(state, editingAction.id, {
      title: editingAction.title,
      targetAudience: editingAction.targetAudience,
      timeframe: editingAction.timeframe,
      status: editingAction.status,
      notes: editingAction.notes,
      objectiveId: editingAction.objectiveId,
    });
    setState(updated);
    await saveOperationalPlan(updated);
    setEditingAction(null);
  };

  const handleRestoreSource = async (actionId: string) => {
    if (!state || !isAdmin) return;
    const updated = restoreActionOriginalValues(state, actionId);
    setState(updated);
    await saveOperationalPlan(updated);
    if (editingAction && editingAction.id === actionId) {
      const refreshed = updated.actions.find(a => a.id === actionId);
      if (refreshed) setEditingAction(refreshed);
    }
  };

  const handleDeleteActionConfirm = async () => {
    if (!state || !deletingActionId) return;
    const updated = deleteAction(state, deletingActionId);
    setState(updated);
    await saveOperationalPlan(updated);
    setDeletingActionId(null);
  };

  const handleRestoreExcluded = async (sourceId: string) => {
    if (!state) return;
    const unexcluded = restoreExcludedAction(state, sourceId);
    const reSynced = await syncOperationalPlan(unexcluded, selectedYear);
    setState(reSynced);
  };

  const handleMoveAction = async (objectiveId: string, actionId: string, direction: 'up' | 'down') => {
    if (!state || !isAdmin) return;
    const objActions = state.actions.filter(a => a.objectiveId === objectiveId);
    const index = objActions.findIndex(a => a.id === actionId);
    if (index < 0) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === objActions.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const globalFrom = state.actions.findIndex(a => a.id === objActions[index].id);
    const globalTo = state.actions.findIndex(a => a.id === objActions[targetIndex].id);

    const updated = reorderActions(state, globalFrom, globalTo);
    setState(updated);
    await saveOperationalPlan(updated);
  };

  // Launch official printout
  const handlePrintOfficial = () => {
    if (state) {
      printOfficialOperationalPlan(state, { academicYear: selectedYear });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', direction: 'rtl', color: '#0F2044' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1s infinite linear' }}>⏳</div>
        <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>جاري تحميل ومزامنة الخطة الإجرائية للتعليم الإلكتروني والحلول الرقمية...</p>
        <p style={{ color: '#64748B', fontSize: '0.85rem' }}>يتم جلب وتدقيق البنود الفعلية من جميع أقسام النظام وقاعدة البيانات</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', direction: 'rtl', color: '#DC2626' }}>
        <p style={{ fontWeight: 800 }}>تعذر تحميل بيانات الخطة الإجرائية. يُرجى إعادة المحاولة.</p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', background: '#0F2044', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          إعادة تحميل الصفحة
        </button>
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', background: '#F8FAFC', paddingBottom: '3rem' }}>
      {/* ─── Print Stylesheet (Strict A3 Landscape 0 Margins) ──────────────── */}
      <style>{`
        @media print {
          @page {
            size: A3 landscape !important;
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', sans-serif !important;
          }
          .no-print, header, aside, nav, button, .admin-controls, .screen-only {
            display: none !important;
          }
          .print-root {
            display: block !important;
            width: 420mm !important;
            min-height: 297mm !important;
            padding: 10mm 14mm !important;
            box-sizing: border-box !important;
            background: #FFFFFF !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            font-size: 8.5pt !important;
          }
          .print-table thead {
            display: table-header-group !important;
          }
          .print-table tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #1E293B !important;
            padding: 4.5pt 6pt !important;
          }
          .print-signatures-footer {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-top: 15mm !important;
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* ─── Screen Header & Navigation Bar ───────────────────────────────── */}
      <div className="no-print" style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '1rem 1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Title and Academic Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #0F2044 0%, #0284C7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', color: '#fff', boxShadow: '0 4px 10px rgba(15,32,68,0.2)'
            }}>
              🎯
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0F2044' }}>
                  الخطة الإجرائية للتعليم الإلكتروني والحلول الرقمية
                </h1>
                <span style={{
                  background: '#E0F2FE', color: '#0369A1', fontSize: '0.75rem',
                  fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '6px'
                }}>
                  {selectedYear}
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                {SCHOOL_NAME} — قسم المشاريع والحلول الرقمية والتعليم الإلكتروني (مزامنة تلقائية حية)
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* View Mode Switcher */}
            <div style={{ background: '#F1F5F9', padding: '3px', borderRadius: '8px', display: 'flex' }}>
              <button
                onClick={() => setActiveTab('interactive')}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: '6px', border: 'none',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  background: activeTab === 'interactive' ? '#0F2044' : 'transparent',
                  color: activeTab === 'interactive' ? '#FFFFFF' : '#64748B',
                  transition: 'all 0.2s',
                }}
              >
                📋 إدارة الخطة
              </button>
              <button
                onClick={() => setActiveTab('print_preview')}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: '6px', border: 'none',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  background: activeTab === 'print_preview' ? '#0F2044' : 'transparent',
                  color: activeTab === 'print_preview' ? '#FFFFFF' : '#64748B',
                  transition: 'all 0.2s',
                }}
              >
                👁️ معاينة قالب الطباعة
              </button>
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={syncing}
              title={`آخر مزامنة: ${state.lastSyncedAt ? new Date(state.lastSyncedAt).toLocaleString('ar-QA') : 'غير محدد'}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F2044',
                padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem',
                fontWeight: 700, cursor: syncing ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{ display: 'inline-block', animation: syncing ? 'spin 1s infinite linear' : 'none' }}>🔄</span>
              <span>{syncing ? 'جاري المزامنة...' : 'تحديث البيانات الآن'}</span>
            </button>

            {/* Print Official Button (Direct Standalone Window with Official Letterhead & Signatures) */}
            <button
              onClick={handlePrintOfficial}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF', border: 'none', padding: '0.45rem 1rem',
                borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 2px 6px rgba(2,132,199,0.3)',
              }}
            >
              <span>🖨️</span>
              <span>طباعة الخطة A3</span>
            </button>

            {/* Admin Add Controls */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowAddActModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: '#0F2044', color: '#FFFFFF', border: 'none',
                    padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem',
                    fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(15,32,68,0.2)',
                  }}
                >
                  <span>➕</span>
                  <span>إضافة إجراء</span>
                </button>

                <button
                  onClick={() => setShowAddObjModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#FFFFFF', border: 'none',
                    padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem',
                    fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
                  }}
                >
                  <span>🎯</span>
                  <span>إضافة هدف استراتيجي</span>
                </button>

                {state.excludedSourceIds && state.excludedSourceIds.length > 0 && (
                  <button
                    onClick={() => setShowExcludedDrawer(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
                      padding: '0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem',
                      fontWeight: 800, cursor: 'pointer',
                    }}
                  >
                    <span>🗑️</span>
                    <span>المستبعدات ({state.excludedSourceIds.length})</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sync Status Banner */}
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
              background: state.syncStatus === 'success' ? '#10B981' : '#F59E0B'
            }} />
            <span>حالة المزامنة: {state.syncStatus === 'success' ? 'متصل ومحدّث تلقائيًا من مصادر النظام' : 'تنبيه في المزامنة'}</span>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <span>آخر تدقيق وتحديث: {new Date(state.lastSyncedAt).toLocaleString('ar-QA')}</span>
          </div>
          <div>
            <span style={{ color: '#0369A1', fontWeight: 700 }}>
              {metrics.totalAct} إجراء موزعاً على {metrics.totalObj} أهداف استراتيجية
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Content Container ───────────────────────────────────────── */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.5rem 1.5rem 0' }}>
        {/* KPI Summary Cards Row */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Total Objectives */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderTop: '4px solid #0F2044', borderRadius: '12px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800 }}>الأهداف الاستراتيجية</span>
              <span style={{ fontSize: '1.25rem' }}>🎯</span>
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F2044', margin: '0.4rem 0 0' }}>{metrics.totalObj}</p>
            <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: '0.2rem 0 0' }}>مجالات الخطة المعتمدة</p>
          </div>

          {/* Total Actions */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderTop: '4px solid #0284C7', borderRadius: '12px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800 }}>إجمالي الإجراءات</span>
              <span style={{ fontSize: '1.25rem' }}>📑</span>
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284C7', margin: '0.4rem 0 0' }}>{metrics.totalAct}</p>
            <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: '0.2rem 0 0' }}>إجراء تشغيلي وتنفيذي</p>
          </div>

          {/* Executed Actions */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderTop: '4px solid #10B981', borderRadius: '12px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800 }}>تم التنفيذ</span>
              <span style={{ fontSize: '1.25rem' }}>✅</span>
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', margin: '0.4rem 0 0' }}>{metrics.executed}</p>
            <p style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700, margin: '0.2rem 0 0' }}>إجراءات منجزة وموثقة</p>
          </div>

          {/* Unexecuted Actions */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderTop: '4px solid #EF4444', borderRadius: '12px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800 }}>لم يتم التنفيذ</span>
              <span style={{ fontSize: '1.25rem' }}>⏳</span>
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#EF4444', margin: '0.4rem 0 0' }}>{metrics.unexecuted}</p>
            <p style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 700, margin: '0.2rem 0 0' }}>قيد المتابعة / متبقية</p>
          </div>

          {/* Execution Progress Rate */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderTop: '4px solid #8B5CF6', borderRadius: '12px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800 }}>نسبة الإنجاز المكتمل</span>
              <span style={{ fontSize: '1.25rem' }}>📈</span>
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#8B5CF6', margin: '0.4rem 0 0' }}>{metrics.rate}%</p>
            <div style={{ marginTop: '0.35rem', background: '#F1F5F9', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${metrics.rate}%`, height: '100%', background: '#8B5CF6', borderRadius: '3px' }} />
            </div>
            {metrics.undefinedCount > 0 && (
              <p style={{ fontSize: '0.66rem', color: '#94A3B8', margin: '0.3rem 0 0' }}>
                ({metrics.undefinedCount} غير محدد - مستثنى من النسبة)
              </p>
            )}
          </div>
        </div>

        {/* ─── Interactive Admin & Search View ─────────────────────────────── */}
        {activeTab === 'interactive' && (
          <div>
            {/* Filter and Search Bar */}
            <div className="no-print" style={{
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px',
              padding: '1rem 1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                {/* Search Text */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                    🔍 بحث في نصوص الإجراءات والأهداف
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم، الفئة، التوقيت، أو الملاحظة..."
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                      border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none',
                    }}
                  />
                </div>

                {/* Filter by Objective */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                    🎯 تصفية حسب الهدف
                  </label>
                  <select
                    value={selectedObjectiveFilter}
                    onChange={e => setSelectedObjectiveFilter(e.target.value)}
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                      border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', background: '#FFFFFF'
                    }}
                  >
                    <option value="ALL">كافة الأهداف ({state.objectives.length})</option>
                    {state.objectives.map(o => (
                      <option key={o.id} value={o.id}>{o.code}: {o.title.slice(0, 45)}...</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Target Audience */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                    👥 تصفية حسب الفئة المستهدفة
                  </label>
                  <select
                    value={selectedAudienceFilter}
                    onChange={e => setSelectedAudienceFilter(e.target.value)}
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                      border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', background: '#FFFFFF'
                    }}
                  >
                    <option value="ALL">كافة الفئات المستهدفة ({audienceOptions.length})</option>
                    {audienceOptions.map(aud => (
                      <option key={aud} value={aud}>{aud}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Execution Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '0.3rem' }}>
                    🚦 حالة التنفيذ
                  </label>
                  <select
                    value={selectedStatusFilter}
                    onChange={e => setSelectedStatusFilter(e.target.value as any)}
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                      border: '1px solid #CBD5E1', fontSize: '0.82rem', outline: 'none', background: '#FFFFFF'
                    }}
                  >
                    <option value="ALL">كافة الحالات</option>
                    <option value="تم التنفيذ">✅ تم التنفيذ ({metrics.executed})</option>
                    <option value="لم يتم التنفيذ">⏳ لم يتم التنفيذ ({metrics.unexecuted})</option>
                    <option value="غير محدد">⚪ غير محدد ({metrics.undefinedCount})</option>
                  </select>
                </div>
              </div>

              {/* Reset filters shortcut */}
              {(searchQuery || selectedObjectiveFilter !== 'ALL' || selectedAudienceFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    نتائج التصفية المعروضة: <strong>{filteredActions.length}</strong> من أصل {state.actions.length} إجراء
                  </span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedObjectiveFilter('ALL');
                      setSelectedAudienceFilter('ALL');
                      setSelectedStatusFilter('ALL');
                    }}
                    style={{
                      background: 'none', border: 'none', color: '#EF4444',
                      fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline'
                    }}
                  >
                    إعادة ضبط الفلاتر وعرض الخطة كاملة
                  </button>
                </div>
              )}
            </div>

            {/* ─── Interactive Table Display ──────────────────────────────── */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: '#0F2044', color: '#FFFFFF' }}>
                      <th style={{ padding: '0.85rem 0.75rem', width: '45px', textAlign: 'center', fontWeight: 800 }}>م.</th>
                      <th style={{ padding: '0.85rem 1rem', width: '220px', fontWeight: 800 }}>الأهداف</th>
                      <th style={{ padding: '0.85rem 1rem', minWidth: '280px', fontWeight: 800 }}>الإجراءات لكل هدف</th>
                      <th style={{ padding: '0.85rem 0.9rem', width: '170px', fontWeight: 800 }}>الفئة المستهدفة</th>
                      <th style={{ padding: '0.85rem 0.9rem', width: '140px', fontWeight: 800 }}>وقت التنفيذ</th>
                      <th style={{ padding: '0.85rem 0.9rem', width: '130px', textAlign: 'center', fontWeight: 800 }}>حالة التنفيذ</th>
                      <th style={{ padding: '0.85rem 1rem', minWidth: '220px', fontWeight: 800 }}>ملاحظات</th>
                      {isAdmin && (
                        <th className="no-print" style={{ padding: '0.85rem 0.75rem', width: '120px', textAlign: 'center', fontWeight: 800 }}>
                          إدارة
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {groupedScreenData.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                          <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>لا توجد بنود مطابقة لمعايير البحث والتصفية المحددة</p>
                          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.4rem' }}>
                            يرجى تعديل معايير البحث أو الضغط على «إعادة ضبط الفلاتر»
                          </p>
                        </td>
                      </tr>
                    ) : (
                      groupedScreenData.map((group, groupIdx) => {
                        const { objective, actions } = group;
                        return (
                          <React.Fragment key={objective.id}>
                            {/* Objective Header Row */}
                            <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                              <td colSpan={isAdmin ? 8 : 7} style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  {/* Objective Details */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <span style={{
                                      background: '#0F2044', color: '#FFFFFF', padding: '0.25rem 0.65rem',
                                      borderRadius: '6px', fontSize: '0.78rem', fontWeight: 900
                                    }}>
                                      {objective.code}
                                    </span>
                                    <span style={{ fontWeight: 900, color: '#0F2044', fontSize: '0.94rem' }}>
                                      {objective.title}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: '#64748B', background: '#E2E8F0', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                      {actions.length} إجراء
                                    </span>
                                    {objective.description && (
                                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                        • {objective.description}
                                      </span>
                                    )}
                                  </div>

                                  {/* Objective Controls (Add action, Edit objective, Move, Delete) */}
                                  {isAdmin && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                      {/* Add action under this objective */}
                                      <button
                                        onClick={() => {
                                          setNewActObjectiveId(objective.id);
                                          setShowAddActModal(true);
                                        }}
                                        style={{
                                          background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px',
                                          padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 700,
                                          color: '#0F2044', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                        }}
                                        title="إضافة إجراء جديد تحت هذا الهدف"
                                      >
                                        <span>➕</span>
                                        <span>إضافة إجراء</span>
                                      </button>

                                      {/* Edit Objective */}
                                      <button
                                        onClick={() => handleOpenEditObjective(objective)}
                                        style={{
                                          background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px',
                                          padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 800,
                                          color: '#1D4ED8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                        }}
                                        title="تعديل عنوان ورمز ووصف هذا الهدف"
                                      >
                                        <span>✏️</span>
                                        <span>تعديل الهدف</span>
                                      </button>

                                      {/* Reorder Objective Up */}
                                      <button
                                        onClick={() => handleMoveObjective(objective.id, 'up')}
                                        disabled={groupIdx === 0}
                                        style={{
                                          background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px',
                                          padding: '0.25rem 0.45rem', fontSize: '0.72rem', fontWeight: 700,
                                          color: groupIdx === 0 ? '#CBD5E1' : '#475569', cursor: groupIdx === 0 ? 'not-allowed' : 'pointer'
                                        }}
                                        title="تحريك الهدف لأعلى"
                                      >
                                        ⬆️
                                      </button>

                                      {/* Reorder Objective Down */}
                                      <button
                                        onClick={() => handleMoveObjective(objective.id, 'down')}
                                        disabled={groupIdx === state.objectives.length - 1}
                                        style={{
                                          background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px',
                                          padding: '0.25rem 0.45rem', fontSize: '0.72rem', fontWeight: 700,
                                          color: groupIdx === state.objectives.length - 1 ? '#CBD5E1' : '#475569', cursor: groupIdx === state.objectives.length - 1 ? 'not-allowed' : 'pointer'
                                        }}
                                        title="تحريك الهدف لأسفل"
                                      >
                                        ⬇️
                                      </button>

                                      {/* Delete Objective */}
                                      <button
                                        onClick={() => {
                                          setDeletingObjectiveId(objective.id);
                                          setDeleteReassignToId('DELETE_ACTIONS');
                                        }}
                                        style={{
                                          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
                                          padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 800,
                                          color: '#DC2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                        }}
                                        title="حذف هذا الهدف من الخطة"
                                      >
                                        <span>🗑️</span>
                                        <span>حذف الهدف</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Actions under this objective */}
                            {actions.length === 0 ? (
                              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td colSpan={isAdmin ? 8 : 7} style={{ padding: '1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.78rem' }}>
                                  لا توجد إجراءات مسجلة تحت هذا الهدف حالياً
                                </td>
                              </tr>
                            ) : (
                              actions.map((act, actIdx) => (
                                <tr
                                  key={act.id}
                                  style={{
                                    borderBottom: '1px solid #E2E8F0',
                                    background: actIdx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                                    transition: 'background 0.15s',
                                  }}
                                >
                                  {/* Serial */}
                                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>
                                    {actIdx + 1}
                                  </td>

                                  {/* Objective Code Pill */}
                                  <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top', color: '#334155' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369A1' }}>
                                      {objective.code}
                                    </span>
                                  </td>

                                  {/* Action Title & Badges */}
                                  <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                                    <div style={{ fontWeight: 800, color: '#0F2044', lineHeight: 1.45, fontSize: '0.84rem' }}>
                                      {act.title}
                                    </div>

                                    {/* Action Meta & Origin Badges */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                                      {/* Source Module Badge */}
                                      <button
                                        onClick={() => setViewingSourceAction(act)}
                                        style={{
                                          background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569',
                                          fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '4px',
                                          fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem'
                                        }}
                                        title="اضغط لعرض تفاصيل المصدر الأصلي"
                                      >
                                        <span>🔍</span>
                                        <span>المصدر: {act.sourceLabel || act.sourceModule}</span>
                                      </button>

                                      {/* Customized / Manual Badges */}
                                      {act.isCustomized && (
                                        <span style={{
                                          background: '#FEF3C7', color: '#B45309', fontSize: '0.65rem',
                                          fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #FDE68A'
                                        }}>
                                          ✏️ معدّل يدويًا
                                        </span>
                                      )}

                                      {act.isManual && (
                                        <span style={{
                                          background: '#E0E7FF', color: '#4338CA', fontSize: '0.65rem',
                                          fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px'
                                        }}>
                                          ➕ إدخال يدوي
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Target Audience */}
                                  <td style={{ padding: '0.75rem 0.9rem', verticalAlign: 'top', color: '#334155', fontSize: '0.8rem', fontWeight: 600 }}>
                                    {act.targetAudience || 'غير محدد'}
                                  </td>

                                  {/* Execution Timeframe */}
                                  <td style={{ padding: '0.75rem 0.9rem', verticalAlign: 'top', color: '#334155', fontSize: '0.78rem' }}>
                                    <span style={{ background: '#F8FAFC', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #E2E8F0', display: 'inline-block' }}>
                                      {act.timeframe || 'غير محدد'}
                                    </span>
                                  </td>

                                  {/* Execution Status Badge (Interactive Toggle for Admins) */}
                                  <td style={{ padding: '0.75rem 0.9rem', verticalAlign: 'top', textAlign: 'center' }}>
                                    <button
                                      onClick={() => isAdmin && handleToggleStatus(act.id)}
                                      disabled={!isAdmin}
                                      title={isAdmin ? 'اضغط لتغيير حالة التنفيذ مباشرة' : ''}
                                      style={{
                                        background: act.status === 'تم التنفيذ' ? '#ECFDF5' : act.status === 'لم يتم التنفيذ' ? '#FEF2F2' : '#F1F5F9',
                                        color: act.status === 'تم التنفيذ' ? '#065F46' : act.status === 'لم يتم التنفيذ' ? '#991B1B' : '#475569',
                                        border: `1px solid ${act.status === 'تم التنفيذ' ? '#A7F3D0' : act.status === 'لم يتم التنفيذ' ? '#FECACA' : '#CBD5E1'}`,
                                        padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem',
                                        fontWeight: 800, cursor: isAdmin ? 'pointer' : 'default',
                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap'
                                      }}
                                    >
                                      <span>{act.status === 'تم التنفيذ' ? '✓' : act.status === 'لم يتم التنفيذ' ? '✗' : '—'}</span>
                                      <span>{act.status}</span>
                                    </button>
                                  </td>

                                  {/* Notes */}
                                  <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top', color: '#475569', fontSize: '0.78rem', lineHeight: 1.45 }}>
                                    {act.notes || '—'}
                                  </td>

                                  {/* Admin Actions */}
                                  {isAdmin && (
                                    <td className="no-print" style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                        {/* Edit Action */}
                                        <button
                                          onClick={() => setEditingAction(act)}
                                          title="تعديل الإجراء"
                                          style={{
                                            background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px',
                                            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', color: '#0F2044', fontSize: '0.85rem'
                                          }}
                                        >
                                          ✏️
                                        </button>

                                        {/* Reorder Up */}
                                        <button
                                          onClick={() => handleMoveAction(objective.id, act.id, 'up')}
                                          disabled={actIdx === 0}
                                          title="تحريك لأعلى"
                                          style={{
                                            background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px',
                                            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: actIdx === 0 ? 'not-allowed' : 'pointer', color: '#64748B', fontSize: '0.75rem'
                                          }}
                                        >
                                          ⬆️
                                        </button>

                                        {/* Reorder Down */}
                                        <button
                                          onClick={() => handleMoveAction(objective.id, act.id, 'down')}
                                          disabled={actIdx === actions.length - 1}
                                          title="تحريك لأسفل"
                                          style={{
                                            background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px',
                                            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: actIdx === actions.length - 1 ? 'not-allowed' : 'pointer', color: '#64748B', fontSize: '0.75rem'
                                          }}
                                        >
                                          ⬇️
                                        </button>

                                        {/* Delete Action */}
                                        <button
                                          onClick={() => setDeletingActionId(act.id)}
                                          title="حذف الإجراء من الخطة"
                                          style={{
                                            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
                                            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', color: '#DC2626', fontSize: '0.8rem'
                                          }}
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── Screen Print Preview Tab ─────────────────────────────────────── */}
        {activeTab === 'print_preview' && (
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0F2044', fontSize: '1.1rem', fontWeight: 900 }}>
                  معاينة وثيقة الخطة الإجرائية الرسمية (قالب A3 أفقي مع الترويسة والتوقيعات)
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                  هذه المعاينة تعرض الوثيقة الرسمية الشاملة لكافة الأهداف والإجراءات مع الترويسة والتوقيعات الرسمية
                </p>
              </div>
              <button
                onClick={handlePrintOfficial}
                style={{
                  background: 'linear-gradient(135deg, #0F2044 0%, #0284C7 100%)',
                  color: '#FFFFFF', border: 'none', padding: '0.6rem 1.4rem',
                  borderRadius: '8px', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 3px 8px rgba(15,32,68,0.2)'
                }}
              >
                <span>🖨️</span>
                <span>فتح نافذة الطباعة الرسمية (A3)</span>
              </button>
            </div>

            {/* Embedded Live Preview Container */}
            <OfficialPrintDocument state={state} selectedYear={selectedYear} groupedData={groupedPrintData} isPreview />
          </div>
        )}
      </div>

      {/* ─── Hidden Printable Root (Rendered Only for Native Browser Print) ─ */}
      <div className="print-root" style={{ display: 'none' }}>
        <OfficialPrintDocument state={state} selectedYear={selectedYear} groupedData={groupedPrintData} />
      </div>

      {/* ─── Modal: Add Objective ─────────────────────────────────────────── */}
      {showAddObjModal && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', direction: 'rtl' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 900, color: '#0F2044' }}>
              🎯 إضافة هدف استراتيجي تشغيلي جديد
            </h3>
            <form onSubmit={handleAddObjectiveSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  كود الهدف (مثل OBJ-06)
                </label>
                <input
                  type="text"
                  value={newObjCode}
                  onChange={e => setNewObjCode(e.target.value)}
                  placeholder={`OBJ-${String(state.objectives.length + 1).padStart(2, '0')}`}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  عنوان الهدف *
                </label>
                <input
                  type="text"
                  required
                  value={newObjTitle}
                  onChange={e => setNewObjTitle(e.target.value)}
                  placeholder="أدخل عنوان الهدف الاستراتيجي..."
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  الوصف أو النطاق التنفيذي (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={newObjDesc}
                  onChange={e => setNewObjDesc(e.target.value)}
                  placeholder="وصف مختصر لمجال تطبيق الهدف..."
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddObjModal(false)}
                  style={{ padding: '0.5rem 1rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.5rem', background: '#0F2044', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  حفظ الهدف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Edit Objective ────────────────────────────────────────── */}
      {editingObjective && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', direction: 'rtl' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 900, color: '#0F2044' }}>
              ✏️ تعديل الهدف الاستراتيجي التشغيلي
            </h3>
            <form onSubmit={handleEditObjectiveSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  كود الهدف (مثل OBJ-01)
                </label>
                <input
                  type="text"
                  required
                  value={editObjCode}
                  onChange={e => setEditObjCode(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  عنوان الهدف *
                </label>
                <input
                  type="text"
                  required
                  value={editObjTitle}
                  onChange={e => setEditObjTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  الوصف أو النطاق التنفيذي (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={editObjDesc}
                  onChange={e => setEditObjDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingObjective(null)}
                  style={{ padding: '0.5rem 1rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.5rem', background: '#0F2044', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Delete Objective (With Action Reassignment) ────────────── */}
      {deletingObjectiveId && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', direction: 'rtl' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚨</div>
              <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 900, color: '#DC2626' }}>
                تأكيد حذف الهدف الاستراتيجي
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 800, margin: 0 }}>
                {state.objectives.find(o => o.id === deletingObjectiveId)?.code}: {state.objectives.find(o => o.id === deletingObjectiveId)?.title}
              </p>
            </div>

            {/* Actions count alert & Reassignment options */}
            {(() => {
              const actCount = state.actions.filter(a => a.objectiveId === deletingObjectiveId).length;
              const otherObjectives = state.objectives.filter(o => o.id !== deletingObjectiveId);
              return (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 700, margin: '0 0 0.75rem' }}>
                    يحتوي هذا الهدف حالياً على <strong>{actCount}</strong> إجراء مسجلاً في الخطة.
                  </p>

                  {actCount > 0 && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#475569', marginBottom: '0.4rem' }}>
                        ماذا ترغب أن تفعل بالإجراءات التابعة لهذا الهدف؟
                      </label>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="deleteActionChoice"
                            checked={deleteReassignToId === 'DELETE_ACTIONS'}
                            onChange={() => setDeleteReassignToId('DELETE_ACTIONS')}
                          />
                          <span>حذف الإجراءات التابعة مع الهدف نهائياً ({actCount} إجراء)</span>
                        </label>

                        {otherObjectives.length > 0 && (
                          <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.35rem' }}>
                              <input
                                type="radio"
                                name="deleteActionChoice"
                                checked={deleteReassignToId !== 'DELETE_ACTIONS'}
                                onChange={() => setDeleteReassignToId(otherObjectives[0].id)}
                              />
                              <span>نقل كافة الإجراءات ({actCount}) إلى هدف استراتيجي آخر:</span>
                            </label>

                            {deleteReassignToId !== 'DELETE_ACTIONS' && (
                              <select
                                value={deleteReassignToId}
                                onChange={e => setDeleteReassignToId(e.target.value)}
                                style={{
                                  width: '100%', padding: '0.45rem 0.65rem', borderRadius: '6px',
                                  border: '1px solid #CBD5E1', fontSize: '0.78rem', background: '#FFFFFF', marginTop: '0.2rem'
                                }}
                              >
                                {otherObjectives.map(o => (
                                  <option key={o.id} value={o.id}>
                                    {o.code}: {o.title}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setDeletingObjectiveId(null);
                  setDeleteReassignToId('DELETE_ACTIONS');
                }}
                style={{ padding: '0.5rem 1.2rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteObjectiveConfirm}
                style={{ padding: '0.5rem 1.4rem', background: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
              >
                تأكيد حذف الهدف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Add Action ────────────────────────────────────────────── */}
      {showAddActModal && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', direction: 'rtl', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', fontWeight: 900, color: '#0F2044' }}>
              ➕ إضافة إجراء تشغيلي جديد للخطة
            </h3>
            <form onSubmit={handleAddActionSubmit}>
              {/* Select Objective */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  الهدف التابع له الإجراء *
                </label>
                <select
                  required
                  value={newActObjectiveId}
                  onChange={e => setNewActObjectiveId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFFFFF' }}
                >
                  {state.objectives.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.code}: {o.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  عنوان الإجراء *
                </label>
                <input
                  type="text"
                  required
                  value={newActTitle}
                  onChange={e => setNewActTitle(e.target.value)}
                  placeholder="أدخل نص الإجراء بلغة رسمية ومختصرة..."
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                {/* Target Audience */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    الفئة المستهدفة *
                  </label>
                  <input
                    type="text"
                    required
                    value={newActAudience}
                    onChange={e => setNewActAudience(e.target.value)}
                    placeholder="مثال: الكادر التدريسي والمنسقون"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Execution Timeframe */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    وقت التنفيذ *
                  </label>
                  <input
                    type="text"
                    required
                    value={newActTimeframe}
                    onChange={e => setNewActTimeframe(e.target.value)}
                    placeholder="مثال: سبتمبر 2026 / طوال العام"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Status */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  حالة التنفيذ *
                </label>
                <select
                  value={newActStatus}
                  onChange={e => setNewActStatus(e.target.value as ExecutionStatus)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFFFFF' }}
                >
                  <option value="تم التنفيذ">✅ تم التنفيذ</option>
                  <option value="لم يتم التنفيذ">⏳ لم يتم التنفيذ</option>
                  <option value="غير محدد">⚪ غير محدد</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  الملاحظات وأدلة الإنجاز (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={newActNotes}
                  onChange={e => setNewActNotes(e.target.value)}
                  placeholder="ملاحظات توثيقية، مخرجات، أدلة تنفيذ..."
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddActModal(false)}
                  style={{ padding: '0.5rem 1rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.5rem', background: '#0F2044', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  حفظ الإجراء في الخطة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Edit Action ───────────────────────────────────────────── */}
      {editingAction && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', direction: 'rtl', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F2044' }}>
                ✏️ تعديل بيانات الإجراء
              </h3>
              {editingAction.originalValues && (
                <button
                  type="button"
                  onClick={() => handleRestoreSource(editingAction.id)}
                  style={{
                    background: '#FEF3C7', border: '1px solid #FDE68A', color: '#B45309',
                    padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                  }}
                  title="استعادة القيم الأصلية من المصدر"
                >
                  🔄 استعادة قيمة المصدر
                </button>
              )}
            </div>

            <form onSubmit={handleEditActionSubmit}>
              {/* Select Objective */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  الهدف التابع له
                </label>
                <select
                  value={editingAction.objectiveId}
                  onChange={e => setEditingAction({ ...editingAction, objectiveId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFFFFF' }}
                >
                  {state.objectives.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.code}: {o.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  نص الإجراء
                </label>
                <input
                  type="text"
                  required
                  value={editingAction.title}
                  onChange={e => setEditingAction({ ...editingAction, title: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                {/* Target Audience */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    الفئة المستهدفة
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAction.targetAudience}
                    onChange={e => setEditingAction({ ...editingAction, targetAudience: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Timeframe */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    وقت التنفيذ
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAction.timeframe}
                    onChange={e => setEditingAction({ ...editingAction, timeframe: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Status */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  حالة التنفيذ
                </label>
                <select
                  value={editingAction.status}
                  onChange={e => setEditingAction({ ...editingAction, status: e.target.value as ExecutionStatus })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFFFFF' }}
                >
                  <option value="تم التنفيذ">✅ تم التنفيذ</option>
                  <option value="لم يتم التنفيذ">⏳ لم يتم التنفيذ</option>
                  <option value="غير محدد">⚪ غير محدد</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  ملاحظات
                </label>
                <textarea
                  rows={3}
                  value={editingAction.notes}
                  onChange={e => setEditingAction({ ...editingAction, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingAction(null)}
                  style={{ padding: '0.5rem 1rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.5rem', background: '#0F2044', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: View Source Details ───────────────────────────────────── */}
      {viewingSourceAction && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '540px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', direction: 'rtl' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🔗</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F2044' }}>
                  بيانات المصدر الأصلي المرتبط
                </h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                  معرف المصدر وتفاصيل المزامنة التلقائية المستمرة
                </p>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.82rem', lineHeight: 1.8 }}>
              <div><strong>قسم المصدر:</strong> {viewingSourceAction.sourceLabel || viewingSourceAction.sourceModule}</div>
              <div><strong>معرّف البند الثابت:</strong> <code style={{ background: '#E2E8F0', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{viewingSourceAction.sourceId || viewingSourceAction.id}</code></div>
              <div><strong>نوع الإدراج:</strong> {viewingSourceAction.isManual ? 'إدخال يدوي مباشر' : 'مستورد ومزامن تلقائياً'}</div>
              <div><strong>التعديل اليدوي:</strong> {viewingSourceAction.isCustomized ? 'تم تعديل بعض القيم يدويًا (محمية من الاستبدال)' : 'مطابق تماماً لبيانات المصدر'}</div>
              {viewingSourceAction.originalValues && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #CBD5E1', fontSize: '0.75rem', color: '#475569' }}>
                  <div><strong>النص الأصلي بالمصدر:</strong> {viewingSourceAction.originalValues.title}</div>
                  <div><strong>الحالة الأصلية:</strong> {viewingSourceAction.originalValues.status}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {viewingSourceAction.sourceLink && onNavigate ? (
                <button
                  onClick={() => {
                    const page = viewingSourceAction.sourceLink!;
                    setViewingSourceAction(null);
                    onNavigate(page);
                  }}
                  style={{
                    background: '#0284C7', color: '#FFFFFF', border: 'none',
                    padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  الانتقال لصفحة المصدر ↗
                </button>
              ) : <div />}

              <button
                onClick={() => setViewingSourceAction(null)}
                style={{ padding: '0.5rem 1.25rem', background: '#0F2044', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Drawer / Modal: Excluded Items ───────────────────────────────── */}
      {showExcludedDrawer && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '620px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', direction: 'rtl', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#DC2626' }}>
                  🗑️ البنود المستبعدة من الخطة الإجرائية
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                  هذه البنود تم حذفها من الخطة ولا تعاد تلقائياً أثناء المزامنة، مع بقائها آمنة في صفحاتها الأصلية
                </p>
              </div>
              <button
                onClick={() => setShowExcludedDrawer(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {state.excludedSourceIds.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.85rem' }}>
                لا توجد بنود مستبعدة حالياً
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {state.excludedSourceIds.map(sourceId => (
                  <div
                    key={sourceId}
                    style={{
                      background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px',
                      padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <code style={{ fontSize: '0.8rem', color: '#0F2044', fontWeight: 700 }}>{sourceId}</code>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#64748B' }}>
                        مستبعد ومحمي من الاسترجاع التلقائي
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestoreExcluded(sourceId)}
                      style={{
                        background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
                        padding: '0.35rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      ↩️ استعادة للخطة
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
              <button
                onClick={() => setShowExcludedDrawer(false)}
                style={{ padding: '0.5rem 1.25rem', background: '#0F2044', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal (Action) ───────────────────────────── */}
      {deletingActionId && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', direction: 'rtl', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 900, color: '#DC2626' }}>
              تأكيد حذف الإجراء
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              هل أنت متأكد من حذف هذا الإجراء من الخطة الإجرائية؟
              <br />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                (سيتم حفظ البند في قائمة المستبعدات لضمان عدم إعادته تلقائيًا أثناء المزامنة، دون التأثير على بياناته الأصلية في صفحات الموقع).
              </span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setDeletingActionId(null)}
                style={{ padding: '0.5rem 1.2rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteActionConfirm}
                style={{ padding: '0.5rem 1.4rem', background: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Official Print Document Component (Rendered for Browser Print & Live Preview)
// Follows strict A3 Landscape 0 Margins official standards
// =============================================================================
function OfficialPrintDocument({
  state,
  selectedYear,
  groupedData,
  isPreview = false,
}: {
  state: OperationalPlanState;
  selectedYear: string;
  groupedData: { objective: OperationalObjective; actions: OperationalAction[] }[];
  isPreview?: boolean;
}) {
  return (
    <div style={{
      width: isPreview ? '100%' : '420mm',
      boxSizing: 'border-box',
      background: '#FFFFFF',
      color: '#0F172A',
      direction: 'rtl',
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', sans-serif",
    }}>
      {/* ─── Official Centered Letterhead ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '0.75rem',
        borderBottom: '2.5px solid #0F2044',
        marginBottom: '1rem',
      }}>
        {/* Right Logo: State of Qatar / Ministry */}
        <div style={{ width: '180px', textAlign: 'right' }}>
          <img
            src="/ministry-logo.png"
            alt="وزارة التربية والتعليم والتعليم العالي"
            style={{ height: '70px', maxWidth: '180px', objectFit: 'contain' }}
          />
        </div>

        {/* Center Official Title & Metadata Banner */}
        <div style={{ textAlign: 'center', flex: 1, padding: '0 1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0F2044', letterSpacing: '-0.3px' }}>
            دولة قطر — وزارة التربية والتعليم والتعليم العالي
          </h2>
          <h3 style={{ margin: '0.2rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#1E3A8A' }}>
            {SCHOOL_NAME}
          </h3>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284C7', margin: '2px 0 6px' }}>
            قسم المشاريع والحلول الرقمية والتعليم الإلكتروني
          </div>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #0F2044 0%, #0369A1 100%)',
            color: '#FFFFFF',
            padding: '0.35rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(15,32,68,0.15)',
          }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 900 }}>
              الخطة الإجرائية للتعليم الإلكتروني والحلول الرقمية
            </span>
            <span style={{ margin: '0 0.6rem', opacity: 0.7 }}>|</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              العام الأكاديمي: {selectedYear}
            </span>
          </div>
        </div>

        {/* Left Logo: Qatar Science and Technology School */}
        <div style={{ width: '180px', textAlign: 'left' }}>
          <img
            src="/school-logo.png"
            alt="شعار مدرسة قطر للعلوم والتكنولوجيا"
            style={{ height: '70px', maxWidth: '180px', objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* ─── Official Table ──────────────────────────────────────────────── */}
      <table className="print-table" style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: isPreview ? '0.78rem' : '8.5pt',
        marginBottom: '1rem',
        border: '1.5px solid #0F2044',
      }}>
        <thead>
          <tr style={{ background: '#0F2044', color: '#FFFFFF', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            <th style={{ width: '38px', textAlign: 'center', padding: '6px 4px', fontWeight: 800, border: '1px solid #1E293B' }}>م.</th>
            <th style={{ width: '210px', textAlign: 'right', padding: '6px 8px', fontWeight: 800, border: '1px solid #1E293B' }}>الأهداف</th>
            <th style={{ minWidth: '260px', textAlign: 'right', padding: '6px 8px', fontWeight: 800, border: '1px solid #1E293B' }}>الإجراءات لكل هدف</th>
            <th style={{ width: '160px', textAlign: 'right', padding: '6px 8px', fontWeight: 800, border: '1px solid #1E293B' }}>الفئة المستهدفة</th>
            <th style={{ width: '130px', textAlign: 'right', padding: '6px 8px', fontWeight: 800, border: '1px solid #1E293B' }}>وقت التنفيذ</th>
            <th style={{ width: '110px', textAlign: 'center', padding: '6px 6px', fontWeight: 800, border: '1px solid #1E293B' }}>حالة التنفيذ</th>
            <th style={{ minWidth: '200px', textAlign: 'right', padding: '6px 8px', fontWeight: 800, border: '1px solid #1E293B' }}>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {groupedData.map((group, groupIdx) => {
            const { objective, actions } = group;
            const hasActions = actions.length > 0;
            const rowSpanCount = hasActions ? actions.length : 1;

            return (
              <React.Fragment key={objective.id}>
                {hasActions ? (
                  actions.map((act, actIdx) => (
                    <tr
                      key={act.id}
                      style={{
                        pageBreakInside: 'avoid',
                        background: groupIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                      }}
                    >
                      {/* Serial Number */}
                      <td style={{
                        textAlign: 'center',
                        fontWeight: 700,
                        padding: '5px 4px',
                        border: '1px solid #334155',
                        color: '#0F2044',
                      }}>
                        {actIdx + 1}
                      </td>

                      {/* Objective Cell (RowSpanned for all actions under this objective) */}
                      {actIdx === 0 && (
                        <td
                          rowSpan={rowSpanCount}
                          style={{
                            verticalAlign: 'top',
                            padding: '6px 8px',
                            border: '1.5px solid #0F2044',
                            background: '#F1F5F9',
                            fontWeight: 800,
                            color: '#0F2044',
                            lineHeight: 1.45,
                            printColorAdjust: 'exact',
                            WebkitPrintColorAdjust: 'exact',
                          }}
                        >
                          <div style={{
                            display: 'inline-block',
                            background: '#0F2044',
                            color: '#FFFFFF',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            marginBottom: '4px',
                            printColorAdjust: 'exact',
                            WebkitPrintColorAdjust: 'exact',
                          }}>
                            {objective.code}
                          </div>
                          <div>{objective.title}</div>
                        </td>
                      )}

                      {/* Action Title */}
                      <td style={{
                        padding: '5px 8px',
                        fontWeight: 700,
                        color: '#0F172A',
                        lineHeight: 1.4,
                        border: '1px solid #334155',
                      }}>
                        {act.title}
                      </td>

                      {/* Target Audience */}
                      <td style={{
                        padding: '5px 8px',
                        color: '#334155',
                        border: '1px solid #334155',
                      }}>
                        {act.targetAudience}
                      </td>

                      {/* Timeframe */}
                      <td style={{
                        padding: '5px 8px',
                        color: '#334155',
                        border: '1px solid #334155',
                        whiteSpace: 'nowrap',
                      }}>
                        {act.timeframe}
                      </td>

                      {/* Execution Status: Both explicit text and icon */}
                      <td style={{
                        padding: '5px 6px',
                        textAlign: 'center',
                        fontWeight: 800,
                        border: '1px solid #334155',
                        whiteSpace: 'nowrap',
                        color: act.status === 'تم التنفيذ' ? '#065F46' : act.status === 'لم يتم التنفيذ' ? '#991B1B' : '#475569',
                      }}>
                        <span>{act.status === 'تم التنفيذ' ? '✓ تم التنفيذ' : act.status === 'لم يتم التنفيذ' ? '✗ لم يتم التنفيذ' : '— غير محدد'}</span>
                      </td>

                      {/* Notes */}
                      <td style={{
                        padding: '5px 8px',
                        color: '#475569',
                        lineHeight: 1.35,
                        border: '1px solid #334155',
                      }}>
                        {act.notes || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr style={{ pageBreakInside: 'avoid', background: '#FFFFFF' }}>
                    <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #334155' }}>—</td>
                    <td style={{ padding: '6px 8px', border: '1.5px solid #0F2044', background: '#F1F5F9', fontWeight: 800 }}>
                      {objective.code}: {objective.title}
                    </td>
                    <td colSpan={5} style={{ padding: '6px', textAlign: 'center', color: '#94A3B8', border: '1px solid #334155' }}>
                      لا توجد إجراءات مسجلة
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* ─── Official Approval Signatures Footer ──────────────────────────── */}
      <div className="print-signatures-footer" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: '1.5rem',
        paddingTop: '0.85rem',
        borderTop: '2px solid #0F2044',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}>
        {/* E-Learning & Projects Coordinator */}
        <div style={{ textAlign: 'center', width: '220px' }}>
          <p style={{
            fontWeight: 800,
            borderBottom: '1.5px solid #0F2044',
            paddingBottom: '0.35rem',
            marginBottom: '0.35rem',
            fontSize: '0.82rem',
            color: '#0F2044',
          }}>
            منسق المشاريع والتعليم الإلكتروني
          </p>
          <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 2px', color: '#1E293B' }}>
            م. أحمد عادل طبيشات
          </p>
          <img
            src="/signature-ahmad.png"
            alt="توقيع منسق المشاريع والتعليم الإلكتروني"
            style={{ height: '36px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
          />
        </div>

        {/* Academic Vice Principal */}
        <div style={{ textAlign: 'center', width: '220px' }}>
          <p style={{
            fontWeight: 800,
            borderBottom: '1.5px solid #0F2044',
            paddingBottom: '0.35rem',
            marginBottom: '0.35rem',
            fontSize: '0.82rem',
            color: '#0F2044',
          }}>
            النائب الأكاديمي
          </p>
          <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 2px', color: '#1E293B' }}>
            د. راني التوم
          </p>
          <img
            src="/signature-rani.png"
            alt="توقيع النائب الأكاديمي"
            style={{ height: '36px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
          />
        </div>

        {/* School Principal */}
        <div style={{ textAlign: 'center', width: '220px' }}>
          <p style={{
            fontWeight: 800,
            borderBottom: '1.5px solid #0F2044',
            paddingBottom: '0.35rem',
            marginBottom: '0.35rem',
            fontSize: '0.82rem',
            color: '#0F2044',
          }}>
            مدير المدرسة
          </p>
          <p style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 2px', color: '#1E293B' }}>
            محمد علي مندني العمادي
          </p>
          <img
            src="/principal-signature.png"
            alt="توقيع مدير المدرسة محمد علي مندني العمادي"
            style={{ height: '36px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
          />
        </div>
      </div>
    </div>
  );
}
