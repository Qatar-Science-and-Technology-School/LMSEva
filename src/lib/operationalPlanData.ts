// =============================================================================
// الخطة الإجرائية للتعليم الإلكتروني والحلول الرقمية - مدرسة قطر للعلوم والتكنولوجيا
// Operational Plan Data Model, Synchronization Engine & Storage Helpers
// =============================================================================

import { db, DailyTask, Achievement, ElearningSms } from './data';
import { loadEventsMeetings, EventMeetingItem } from './eventsMeetingsData';
import { getCollection, saveCollection, COLLECTIONS } from './firestoreDb';

export type ExecutionStatus = 'تم التنفيذ' | 'لم يتم التنفيذ' | 'غير محدد';

export type SourceModule =
  | 'workshops'
  | 'individual_pd'
  | 'meee'
  | 'daily_tasks'
  | 'events_meetings'
  | 'achievements'
  | 'model_lessons'
  | 'sms'
  | 'lms_monitoring'
  | 'manual';

export interface OperationalObjective {
  id: string;
  code: string;            // e.g. 'OBJ-01'
  title: string;
  description?: string;
  order: number;
  isManual?: boolean;
}

export interface OperationalAction {
  id: string;
  objectiveId: string;
  title: string;
  targetAudience: string;
  timeframe: string;
  status: ExecutionStatus;
  notes: string;
  sourceModule: SourceModule;
  sourceId?: string;       // Deterministic ID from source system
  sourceLabel?: string;    // Human-readable source name e.g. 'الورش التدريبية'
  sourceLink?: string;     // Route or page reference
  isManual?: boolean;      // Created directly by admin
  isCustomized?: boolean;  // Modified manually by user after import
  originalValues?: {
    title?: string;
    targetAudience?: string;
    timeframe?: string;
    status?: ExecutionStatus;
    notes?: string;
  };
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OperationalPlanState {
  objectives: OperationalObjective[];
  actions: OperationalAction[];
  excludedSourceIds: string[]; // List of sourceIds deleted from plan that should not be re-imported
  deletedObjectiveIds?: string[]; // List of objective IDs deleted by user that should not be re-created
  lastSyncedAt: string;
  syncStatus: 'success' | 'warning' | 'idle';
  syncMessage?: string;
  academicYear: string;
}

export const SOURCE_MODULE_LABELS: Record<SourceModule, string> = {
  workshops: 'الورش التدريبية (التطوير المهني)',
  individual_pd: 'التطوير المهني الفردي',
  meee: 'شهادات مايكروسوفت MEEE',
  daily_tasks: 'مهام العمل اليومية',
  events_meetings: 'الفعاليات والاجتماعات',
  achievements: 'الإنجازات والمسابقات',
  model_lessons: 'حصص المشاهدة والتعليم الإلكتروني',
  sms: 'رسائل E-Learning SMS',
  lms_monitoring: 'متابعة نظام قطر للتعليم والتدخل الأكاديمي',
  manual: 'إدخال يدوي مباشر',
};

// Strategic Operational Objectives representing school's official digital roadmap
export const DEFAULT_OPERATIONAL_OBJECTIVES: OperationalObjective[] = [
  {
    id: 'obj-01',
    code: 'OBJ-01',
    title: 'التمكين والتطوير المهني الرقمي للكوادر التعليمية والأكاديمية',
    description: 'رفع الكفاءة التكنولوجية للمعلمين والمنسقين عبر الورش التخصصية والشهادات الدولية المعتمدة وجلسات التدريب الفردي الموجهة',
    order: 1,
    isManual: false,
  },
  {
    id: 'obj-02',
    code: 'OBJ-02',
    title: 'تفعيل وتجويد استخدام منصة نظام قطر للتعليم (QES) والحلول الرقمية اليومية',
    description: 'المتابعة اليومية المستمرة للخطط والدروس والتقييمات، والتواصل مع أولياء الأمور، وتطبيق خطط الدعم والتدخل الأكاديمي',
    order: 2,
    isManual: false,
  },
  {
    id: 'obj-03',
    code: 'OBJ-03',
    title: 'تطوير ممارسات التدريس والدروس النموذجية المدمجة بالتقنية والذكاء الاصطناعي',
    description: 'تبادل الخبرات وتطبيق الحصص النموذجية والمشاهدات الصفية المعتمدة على الأدوات الرقمية الحديثة والمنصات الذكية',
    order: 3,
    isManual: false,
  },
  {
    id: 'obj-04',
    code: 'OBJ-04',
    title: 'رعاية الابتكارات والمشاريع والمسابقات التكنولوجية وتميز الطلبة',
    description: 'دعم مشاريع الذكاء الاصطناعي والروبوت والابتكار الرقمي والمشاركة في المسابقات الوطنية والإقليمية والدولية وتوثيق الإنجازات',
    order: 4,
    isManual: false,
  },
  {
    id: 'obj-05',
    code: 'OBJ-05',
    title: 'تعزيز الشراكات المؤسسية والفعاليات والاجتماعات التنسيقية للتعليم الإلكتروني',
    description: 'التنسيق المستمر مع وزارة التربية والتعليم والتعليم العالي والمؤسسات الأكاديمية والشركاء لتوظيف أحدث الحلول الرقمية',
    order: 5,
    isManual: false,
  },
];

const STORAGE_KEY_V2 = 'qstss_operational_plan_v2';
const STORAGE_KEY_V1 = 'qstss_operational_plan_v1';

// ─── Deduplication Helper for Sessions ──────────────────────────────────────
function deduplicateSessions(records: any[]): { executed: number; planned: number } {
  const seenExecuted = new Set<string>();
  const seenPlanned = new Set<string>();

  for (const r of records) {
    // Unique session compound key (teacher + date + skill) or id
    const teacherId = r.teacherId || r.traineeNameAr || 'unknown';
    const date = r.trainingDate || r.date || 'nodate';
    const skill = r.skillProvided || r.skillName || 'skill';
    const sessionKey = `${teacherId}_${date}_${skill}`.toLowerCase().trim();

    const isExecuted =
      r.signatureStatus === 'تم التوقيع' ||
      r.evidenceStatus === 'موثق' ||
      r.status === 'منفذة' ||
      r.status === 'مكتمل' ||
      r.status === 'تم التنفيذ' ||
      !r.signatureStatus; // Default historical records are certified executed

    if (isExecuted) {
      seenExecuted.add(sessionKey);
    } else {
      seenPlanned.add(sessionKey);
    }
  }

  return {
    executed: seenExecuted.size,
    planned: seenPlanned.size,
  };
}

// ─── Extract Real Source Actions Across Modules ─────────────────────────────
export async function extractLiveSourceActions(academicYear: string = '2026-2027'): Promise<OperationalAction[]> {
  const items: OperationalAction[] = [];
  let orderCounter = 1;

  // 1. Group Workshops (db.getWorkshops)
  try {
    const rawWorkshops = await db.getWorkshops();
    const relevantWorkshops = (rawWorkshops || []).filter(w => {
      if (!w) return false;
      if (w.academicYear && w.academicYear !== academicYear) return false;
      return true;
    });

    for (const w of relevantWorkshops) {
      const sourceId = `workshop_${w.id || w.workshopNumber || w.titleAr}`;
      let status: ExecutionStatus = 'تم التنفيذ';
      if (w.status === 'مخطط') {
        status = 'لم يتم التنفيذ';
      } else if (w.status === 'قيد التنفيذ' || w.status === 'يحتاج متابعة') {
        status = 'لم يتم التنفيذ';
      }

      const venueInfo = w.venue ? `المقر: ${w.venue}` : '';
      const trainerInfo = w.trainerName || w.facilitatorName ? `تقديم: ${w.trainerName || w.facilitatorName}` : '';
      const notes = [venueInfo, trainerInfo, w.notes || ''].filter(Boolean).join(' | ');

      items.push({
        id: `act_${sourceId}`,
        objectiveId: 'obj-01',
        title: `ورشة عمل تخصصية: ${w.titleAr || w.titleEn}`,
        targetAudience: w.targetAudience || 'الكادر التدريسي والمنسقون الأكاديميون',
        timeframe: w.date || w.month || academicYear,
        status,
        notes: notes || 'ورشة تدريب مهني معتمدة في خطة التمكين الرقمي',
        sourceModule: 'workshops',
        sourceId,
        sourceLabel: SOURCE_MODULE_LABELS.workshops,
        sourceLink: 'professional_development',
        order: orderCounter++,
      });
    }
  } catch (err) {
    console.error('Error fetching workshops for operational plan:', err);
  }

  // 2. Individual PD Records (Aggregated as NUMBERS ONLY!)
  // Strict rule: "اعرض التطوير الفردي بصورة إجمالية رقمية فقط، دون أسماء المعلمين أو تفاصيل الجلسات أو موضوعاتها."
  try {
    const rawIndividual = await db.getIndividualPDRecords();
    const relevantIndividual = (rawIndividual || []).filter(r => {
      if (!r) return false;
      if (r.academicYear && r.academicYear !== academicYear) return false;
      return true;
    });

    if (relevantIndividual.length > 0) {
      const { executed, planned } = deduplicateSessions(relevantIndividual);

      if (executed > 0) {
        const sourceId = `indiv_pd_executed_${academicYear}`;
        items.push({
          id: `act_${sourceId}`,
          objectiveId: 'obj-01',
          title: `التطوير الفردي للمعلمين: ${executed} جلسة تطوير فردي`,
          targetAudience: 'معلمو الأقسام الأكاديمية والمنسقون',
          timeframe: `طوال العام الأكاديمي ${academicYear}`,
          status: 'تم التنفيذ',
          notes: `إجمالي الجلسات الفردية المنجزة والموثقة لرفع الكفاءة الرقمية وتفعيل المنصات التعليمية (أرقام إجمالية معتمدة)`,
          sourceModule: 'individual_pd',
          sourceId,
          sourceLabel: SOURCE_MODULE_LABELS.individual_pd,
          sourceLink: 'professional_development',
          order: orderCounter++,
        });
      }

      if (planned > 0) {
        const sourceId = `indiv_pd_planned_${academicYear}`;
        items.push({
          id: `act_${sourceId}`,
          objectiveId: 'obj-01',
          title: `جلسات التطوير الفردي المجدولة للمتابعة والتحسين: ${planned} جلسة قيد التنفيذ والمتابعة`,
          targetAudience: 'معلمو الأقسام الأكاديمية المستهدفة',
          timeframe: `الفصل الدراسي الحالي ${academicYear}`,
          status: 'لم يتم التنفيذ',
          notes: `جلسات دعم فردي مباشرة قيد الاستكمال والتوثيق المكتبي`,
          sourceModule: 'individual_pd',
          sourceId,
          sourceLabel: SOURCE_MODULE_LABELS.individual_pd,
          sourceLink: 'professional_development',
          order: orderCounter++,
        });
      }
    }
  } catch (err) {
    console.error('Error calculating individual PD for operational plan:', err);
  }

  // 3. MEEE Certifications Program (db.getMeeeRecords)
  try {
    const meeeRecords = await db.getMeeeRecords();
    const relevantMeee = (meeeRecords || []).filter(m => m && (!m.academicYear || m.academicYear === academicYear || m.academicYear === '2025-2026'));
    const certifiedCount = relevantMeee.filter(m => m.status === 'حصل على الشهادة' || m.status === 'معتمد').length;

    const sourceId = `meee_program_${academicYear}`;
    items.push({
      id: `act_${sourceId}`,
      objectiveId: 'obj-01',
      title: 'برنامج تأهيل واعتماد الكوادر الأكاديمية لشهادات خبير مايكروسوفت للتعليم الإبداعي (MIE Expert / MEEE)',
      targetAudience: 'الهيئة التدريسية والمنسقون الأكاديميون',
      timeframe: `العام الأكاديمي ${academicYear}`,
      status: certifiedCount > 0 ? 'تم التنفيذ' : 'غير محدد',
      notes: `اعتماد وتوثيق شهادات خبراء مايكروسوفت للتعليم الإبداعي لدعم بيئة التميز الرقمي (تم اعتماد ${certifiedCount} معلماً ومنسقاً)`,
      sourceModule: 'meee',
      sourceId,
      sourceLabel: SOURCE_MODULE_LABELS.meee,
      sourceLink: 'professional_development',
      order: orderCounter++,
    });
  } catch (err) {
    console.error('Error fetching MEEE records for operational plan:', err);
  }

  // 4. Daily Tasks & Operational Platform Actions (db.getDailyTasks)
  try {
    const rawTasks = await db.getDailyTasks();
    const relevantTasks = (rawTasks || []).filter(t => {
      if (!t) return false;
      if (t.academicYear && t.academicYear !== academicYear) return false;
      return true;
    });

    for (const t of relevantTasks) {
      const sourceId = `task_${t.id}`;
      const status: ExecutionStatus = t.status === 'مكتملة' ? 'تم التنفيذ' : 'لم يتم التنفيذ';

      // Assign to Objective 2 (Platform & QES) or appropriate objective
      let objId = 'obj-02';
      const text = (t.title + ' ' + (t.notes || '')).toLowerCase();
      if (text.includes('مسابقة') || text.includes('مشروع') || text.includes('روبوت') || text.includes('ابتكار')) {
        objId = 'obj-04';
      } else if (text.includes('ورشة') || text.includes('تدريب') || text.includes('تطوير مهني')) {
        objId = 'obj-01';
      }

      items.push({
        id: `act_${sourceId}`,
        objectiveId: objId,
        title: t.title,
        targetAudience: 'المجتمع المدرسي والكوادر الأكاديمية والطلبة',
        timeframe: t.month ? `${t.month} ${t.academicYear || academicYear}` : academicYear,
        status,
        notes: t.notes || (t.category ? `تصنيف المهمة: ${t.category}` : 'مهمة تشغيلية ومتابعة تقنية دورية'),
        sourceModule: 'daily_tasks',
        sourceId,
        sourceLabel: SOURCE_MODULE_LABELS.daily_tasks,
        sourceLink: 'dashboard',
        order: orderCounter++,
      });
    }
  } catch (err) {
    console.error('Error fetching daily tasks for operational plan:', err);
  }

  // 5. Events & Meetings (loadEventsMeetings)
  try {
    const rawEvents = loadEventsMeetings();
    const relevantEvents = (rawEvents || []).filter(e => {
      if (!e) return false;
      if (e.academicYear && e.academicYear !== academicYear) return false;
      return true;
    });

    for (const e of relevantEvents) {
      const sourceId = `event_${e.id}`;
      const isExecuted = e.status === 'منفذة' || e.status === 'مكتملة';
      const status: ExecutionStatus = isExecuted ? 'تم التنفيذ' : 'لم يتم التنفيذ';

      let objId = 'obj-05'; // Default: partnerships & external/internal coordination
      if (e.category === 'مسابقة' || e.type === 'مشاركة لمسابقة' || e.type === 'عرض مشروع طلابي') {
        objId = 'obj-04';
      } else if (e.category === 'ورشة' || e.type === 'ورشة تعريفية') {
        objId = 'obj-01';
      }

      const locationDetails = e.location ? `المقر: ${e.location}` : '';
      const organizerDetails = e.organizer ? `الجهة: ${e.organizer}` : '';
      const notes = [locationDetails, organizerDetails, e.objectives || e.notes || ''].filter(Boolean).join(' | ');

      items.push({
        id: `act_${sourceId}`,
        objectiveId: objId,
        title: `${e.category}: ${e.title}`,
        targetAudience: e.targetAudience || 'الكوادر المعنية والطلبة المستهدفين',
        timeframe: e.date || 'سبتمبر 2026',
        status,
        notes: notes || 'فعالية/اجتماع رسمي مدرج في سجل الفعاليات المعتمد',
        sourceModule: 'events_meetings',
        sourceId,
        sourceLabel: SOURCE_MODULE_LABELS.events_meetings,
        sourceLink: 'events_meetings',
        order: orderCounter++,
      });
    }
  } catch (err) {
    console.error('Error fetching events & meetings for operational plan:', err);
  }

  // 6. National & International Achievements (db.getAchievements)
  try {
    const rawAchievements = await db.getAchievements();
    const relevantAchievements = (rawAchievements || []).filter(a => {
      if (!a) return false;
      if (a.academicYear && a.academicYear !== academicYear) return false;
      return true;
    });

    for (const a of relevantAchievements) {
      const sourceId = `achievement_${a.id || a.serialNumber}`;
      items.push({
        id: `act_${sourceId}`,
        objectiveId: 'obj-04',
        title: `المشاركة التنافسية والإنجاز: ${a.achievementName}`,
        targetAudience: a.participationType ? `الطلبة والفرق المشاركة (${a.participationType})` : 'الطلبة الموهوبون وفرق المشاريع التكنولوجية',
        timeframe: a.achievementDate || a.academicYear || academicYear,
        status: 'تم التنفيذ',
        notes: `الجهة المنظمة: ${a.organizer} | النتيجة: ${a.result} (${a.level})`,
        sourceModule: 'achievements',
        sourceId,
        sourceLabel: SOURCE_MODULE_LABELS.achievements,
        sourceLink: 'achievements',
        order: orderCounter++,
      });
    }
  } catch (err) {
    console.error('Error fetching achievements for operational plan:', err);
  }

  // 7. E-Learning SMS Communications (db.getElearningSms)
  try {
    const rawSms = await db.getElearningSms();
    const relevantSms = (rawSms || []).filter(s => {
      if (!s) return false;
      if (s.academicYear && s.academicYear !== academicYear) return false;
      return true;
    });

    for (const s of relevantSms) {
      const sourceId = `sms_${s.id}`;
      items.push({
        id: `act_${sourceId}`,
        objectiveId: 'obj-02',
        title: `حملة التواصل والتوعية الرقمية عبر الرسائل النصية: ${s.title}`,
        targetAudience: 'أولياء الأمور والطلبة والمجتمع المدرسي',
        timeframe: s.sentDate || academicYear,
        status: 'تم التنفيذ',
        notes: `نص الرسالة المرسلة: "${s.messageText.length > 70 ? s.messageText.slice(0, 68) + '...' : s.messageText}"`,
        sourceModule: 'sms',
        sourceId,
        sourceLabel: SOURCE_MODULE_LABELS.sms,
        sourceLink: 'elearning_sms',
        order: orderCounter++,
      });
    }
  } catch (err) {
    console.error('Error fetching SMS campaigns for operational plan:', err);
  }

  // 8. Model Lessons & Classroom Digital Observations (db.getModelLessonEvaluations)
  try {
    const modelLessonEvals = await db.getModelLessonEvaluations();
    const relevantLessons = (modelLessonEvals || []).filter(l => l && (!l.academicYear || l.academicYear === academicYear));

    const sourceId = `model_lessons_program_${academicYear}`;
    items.push({
      id: `act_${sourceId}`,
      objectiveId: 'obj-03',
      title: 'تنفيذ ومتابعة حصص المشاهدة الصفية والدروس النموذجية الموظفة للحلول الرقمية والذكاء الاصطناعي',
      targetAudience: 'معلمو الأقسام الأكاديمية والطلبة',
      timeframe: `الفصل الدراسي الأول ${academicYear}`,
      status: relevantLessons.length > 0 ? 'تم التنفيذ' : 'تم التنفيذ',
      notes: `تقييم ممارسات التدريس الإلكتروني وتوظيف المنصات التفاعلية وأدوات الذكاء الاصطناعي في الغرف الصفية`,
      sourceModule: 'model_lessons',
      sourceId,
      sourceLabel: SOURCE_MODULE_LABELS.model_lessons,
      sourceLink: 'model_lessons',
      order: orderCounter++,
    });
  } catch (err) {
    console.error('Error checking model lessons for operational plan:', err);
  }

  // 9. Academic Monitoring & LMS Interventions (September 2026 QES Reports)
  try {
    // Action A: Ongoing monthly QES monitoring
    const sourceIdA = `lms_monitoring_sep_${academicYear}`;
    items.push({
      id: `act_${sourceIdA}`,
      objectiveId: 'obj-02',
      title: `المتابعة الدورية الشاملة لرفع الدروس والتقييمات والواجبات على نظام قطر للتعليم (QES)`,
      targetAudience: 'منسقو ومعلمو جميع الأقسام الأكاديمية',
      timeframe: `شهرياً (بداية من سبتمبر ${academicYear.split('-')[0]})`,
      status: 'تم التنفيذ',
      notes: `تحقيق نسبة تغطية إجمالية 91.9% للمؤشرات ومتابعة الأقسام الأكاديمية بنظام قطر للتعليم`,
      sourceModule: 'lms_monitoring',
      sourceId: sourceIdA,
      sourceLabel: SOURCE_MODULE_LABELS.lms_monitoring,
      sourceLink: 'evaluation',
      order: orderCounter++,
    });

    // Action B: Academic intervention for lower engagement sections
    const sourceIdB = `lms_intervention_plan_${academicYear}`;
    items.push({
      id: `act_${sourceIdB}`,
      objectiveId: 'obj-02',
      title: `خطة التدخل الأكاديمي والدعم الفني للمواد والشعب الدراسية لرفع نسب تفاعل الطلبة على المنصة`,
      targetAudience: 'شعب ومواد التدخل الأكاديمي والطلبة المستهدفون',
      timeframe: `طوال العام الأكاديمي ${academicYear}`,
      status: 'تم التنفيذ',
      notes: `معالجة الفجوات وتقديم الدعم المباشر للشعب ذات التفاعل المنخفض وتكريم الكوادر والشعب المتميزة`,
      sourceModule: 'lms_monitoring',
      sourceId: sourceIdB,
      sourceLabel: SOURCE_MODULE_LABELS.lms_monitoring,
      sourceLink: 'class_analysis',
      order: orderCounter++,
    });
  } catch (err) {
    console.error('Error generating LMS monitoring actions for operational plan:', err);
  }

  return items;
}

// ─── Continuous Multi-Layer Synchronization Engine ──────────────────────────
export async function syncOperationalPlan(
  existingState?: OperationalPlanState | null,
  academicYear: string = '2026-2027'
): Promise<OperationalPlanState> {
  // If no state passed, load from localStorage / Firestore
  let state = existingState;
  if (!state) {
    state = await loadOperationalPlan(academicYear);
  }

  // Ensure objectives exist
  let objectives: OperationalObjective[] = [...(state.objectives || [])];
  if (objectives.length === 0) {
    objectives = DEFAULT_OPERATIONAL_OBJECTIVES.map(o => ({ ...o }));
  } else {
    // Ensure default objectives are present if not explicitly deleted by user
    const deletedObjSet = new Set<string>(state.deletedObjectiveIds || []);
    for (const defObj of DEFAULT_OPERATIONAL_OBJECTIVES) {
      if (!deletedObjSet.has(defObj.id) && !objectives.some(o => o.id === defObj.id)) {
        objectives.push({ ...defObj });
      }
    }
  }

  const excludedSet = new Set<string>(state.excludedSourceIds || []);
  const existingActions = state.actions || [];
  const existingMap = new Map<string, OperationalAction>();

  // Map existing actions by sourceId or id
  for (const act of existingActions) {
    if (act.sourceId) {
      existingMap.set(act.sourceId, act);
    }
    existingMap.set(act.id, act);
  }

  // Extract fresh live items from all modules
  const liveActions = await extractLiveSourceActions(academicYear);
  const updatedActions: OperationalAction[] = [];
  const handledSourceIds = new Set<string>();

  // 1. Process live imported items
  for (const live of liveActions) {
    if (!live.sourceId) continue;
    handledSourceIds.add(live.sourceId);

    // If user explicitly excluded this item, skip it!
    if (excludedSet.has(live.sourceId)) {
      continue;
    }

    const existing = existingMap.get(live.sourceId);
    if (!existing) {
      // Brand new item from source: add cleanly
      updatedActions.push({
        ...live,
        isCustomized: false,
        originalValues: {
          title: live.title,
          targetAudience: live.targetAudience,
          timeframe: live.timeframe,
          status: live.status,
          notes: live.notes,
        },
      });
    } else {
      // Item already exists:
      if (existing.isCustomized) {
        // PRESERVE MANUAL CUSTOMIZATIONS!
        // Keep user values, but update originalValues in case user clicks "استعادة قيمة المصدر"
        updatedActions.push({
          ...existing,
          objectiveId: existing.objectiveId || live.objectiveId,
          order: existing.order,
          originalValues: {
            title: live.title,
            targetAudience: live.targetAudience,
            timeframe: live.timeframe,
            status: live.status,
            notes: live.notes,
          },
        });
      } else {
        // Not customized: propagate latest source changes directly
        updatedActions.push({
          ...live,
          id: existing.id,
          objectiveId: existing.objectiveId || live.objectiveId,
          order: existing.order || live.order,
          isCustomized: false,
          originalValues: {
            title: live.title,
            targetAudience: live.targetAudience,
            timeframe: live.timeframe,
            status: live.status,
            notes: live.notes,
          },
        });
      }
    }
  }

  // 2. Preserve purely manual actions (created by admin)
  for (const act of existingActions) {
    if (act.isManual || act.sourceModule === 'manual' || !act.sourceId) {
      updatedActions.push(act);
    } else if (!handledSourceIds.has(act.sourceId) && !excludedSet.has(act.sourceId)) {
      // Item previously imported whose source might be missing:
      // If customized, keep it! If uncustomized, keep as historical or prune
      if (act.isCustomized) {
        updatedActions.push(act);
      }
    }
  }

  // Re-sort actions by order
  updatedActions.sort((a, b) => (a.order || 0) - (b.order || 0));

  const newState: OperationalPlanState = {
    objectives: objectives.sort((a, b) => a.order - b.order),
    actions: updatedActions,
    excludedSourceIds: Array.from(excludedSet),
    deletedObjectiveIds: state.deletedObjectiveIds || [],
    lastSyncedAt: new Date().toISOString(),
    syncStatus: 'success',
    syncMessage: `تمت المزامنة بنجاح من جميع أقسام النظام في ${new Date().toLocaleTimeString('ar-QA')}`,
    academicYear,
  };

  await saveOperationalPlan(newState);
  return newState;
}

// ─── Persistence Helpers (LocalStorage + Firestore) ─────────────────────────
export async function loadOperationalPlan(academicYear: string = '2026-2027'): Promise<OperationalPlanState> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_V2) || localStorage.getItem(STORAGE_KEY_V1);
      if (stored) {
        const parsed = JSON.parse(stored) as OperationalPlanState;
        if (parsed && Array.isArray(parsed.objectives) && Array.isArray(parsed.actions)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading operational plan from localStorage:', e);
    }
  }

  // Fallback: Attempt Firestore collection
  try {
    const firestoreDocs = await getCollection<any>(COLLECTIONS.operationalPlan);
    if (firestoreDocs && firestoreDocs.length > 0) {
      const docState = firestoreDocs.find(d => d.id === 'current_state' || d.academicYear === academicYear) || firestoreDocs[0];
      if (docState && docState.objectives && docState.actions) {
        return {
          objectives: docState.objectives,
          actions: docState.actions,
          excludedSourceIds: docState.excludedSourceIds || [],
          lastSyncedAt: docState.lastSyncedAt || new Date().toISOString(),
          syncStatus: 'success',
          academicYear: docState.academicYear || academicYear,
        };
      }
    }
  } catch (err) {
    console.warn('Error reading operational plan from Firestore:', err);
  }

  // If completely empty, perform initial live extraction and seed
  const initialState: OperationalPlanState = {
    objectives: DEFAULT_OPERATIONAL_OBJECTIVES.map(o => ({ ...o })),
    actions: [],
    excludedSourceIds: [],
    lastSyncedAt: new Date().toISOString(),
    syncStatus: 'idle',
    academicYear,
  };

  // Perform initial sync
  return syncOperationalPlan(initialState, academicYear);
}

export async function saveOperationalPlan(state: OperationalPlanState): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving operational plan to localStorage:', e);
    }
  }

  // Save to Firestore asynchronously
  try {
    await saveCollection(COLLECTIONS.operationalPlan, [
      {
        id: 'current_state',
        ...state,
        updatedAt: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.warn('Failed to sync operational plan to Firestore:', err);
  }
}

// ─── CRUD Helper Operations ──────────────────────────────────────────────────

export function addObjective(
  state: OperationalPlanState,
  title: string,
  code?: string,
  description?: string
): OperationalPlanState {
  const nextOrder = state.objectives.length + 1;
  const newCode = code?.trim() || `OBJ-${String(nextOrder).padStart(2, '0')}`;
  const newObj: OperationalObjective = {
    id: `obj_manual_${Date.now()}`,
    code: newCode,
    title: title.trim(),
    description: description?.trim() || '',
    order: nextOrder,
    isManual: true,
  };

  return {
    ...state,
    objectives: [...state.objectives, newObj],
  };
}

export function updateObjective(
  state: OperationalPlanState,
  id: string,
  updates: Partial<OperationalObjective>
): OperationalPlanState {
  return {
    ...state,
    objectives: state.objectives.map(o => (o.id === id ? { ...o, ...updates } : o)),
  };
}

export function deleteObjective(
  state: OperationalPlanState,
  id: string,
  reassignToObjectiveId?: string
): OperationalPlanState {
  const deletedSet = new Set(state.deletedObjectiveIds || []);
  deletedSet.add(id);

  let newActions = state.actions;
  const newExcluded = [...state.excludedSourceIds];

  if (reassignToObjectiveId && reassignToObjectiveId !== id) {
    // Reassign actions to target objective
    newActions = state.actions.map(a =>
      a.objectiveId === id ? { ...a, objectiveId: reassignToObjectiveId, updatedAt: new Date().toISOString() } : a
    );
  } else {
    // Exclude actions from re-import if they came from source
    const actionsToRemove = state.actions.filter(a => a.objectiveId === id);
    actionsToRemove.forEach(a => {
      if (a.sourceId && !newExcluded.includes(a.sourceId)) {
        newExcluded.push(a.sourceId);
      }
    });
    newActions = state.actions.filter(a => a.objectiveId !== id);
  }

  return {
    ...state,
    objectives: state.objectives.filter(o => o.id !== id),
    actions: newActions,
    excludedSourceIds: newExcluded,
    deletedObjectiveIds: Array.from(deletedSet),
  };
}

export function addAction(
  state: OperationalPlanState,
  action: {
    objectiveId: string;
    title: string;
    targetAudience: string;
    timeframe: string;
    status: ExecutionStatus;
    notes: string;
  }
): OperationalPlanState {
  const nextOrder = state.actions.length + 1;
  const newAct: OperationalAction = {
    id: `act_manual_${Date.now()}`,
    objectiveId: action.objectiveId,
    title: action.title.trim(),
    targetAudience: action.targetAudience.trim(),
    timeframe: action.timeframe.trim(),
    status: action.status,
    notes: action.notes.trim(),
    sourceModule: 'manual',
    sourceLabel: SOURCE_MODULE_LABELS.manual,
    isManual: true,
    isCustomized: false,
    order: nextOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    ...state,
    actions: [...state.actions, newAct],
  };
}

export function updateAction(
  state: OperationalPlanState,
  id: string,
  updates: Partial<OperationalAction>
): OperationalPlanState {
  return {
    ...state,
    actions: state.actions.map(a => {
      if (a.id !== id) return a;

      const isManual = a.isManual || a.sourceModule === 'manual';
      const hasCustomization =
        !isManual &&
        (updates.title !== undefined ||
          updates.targetAudience !== undefined ||
          updates.timeframe !== undefined ||
          updates.status !== undefined ||
          updates.notes !== undefined ||
          updates.objectiveId !== undefined);

      return {
        ...a,
        ...updates,
        isCustomized: isManual ? false : (a.isCustomized || hasCustomization),
        updatedAt: new Date().toISOString(),
      };
    }),
  };
}

export function toggleActionStatus(
  state: OperationalPlanState,
  id: string
): OperationalPlanState {
  return {
    ...state,
    actions: state.actions.map(a => {
      if (a.id !== id) return a;
      const nextStatus: ExecutionStatus = a.status === 'تم التنفيذ' ? 'لم يتم التنفيذ' : 'تم التنفيذ';
      const isManual = a.isManual || a.sourceModule === 'manual';
      return {
        ...a,
        status: nextStatus,
        isCustomized: isManual ? false : true,
        updatedAt: new Date().toISOString(),
      };
    }),
  };
}

export function deleteAction(
  state: OperationalPlanState,
  id: string
): OperationalPlanState {
  const target = state.actions.find(a => a.id === id);
  if (!target) return state;

  const newExcluded = [...state.excludedSourceIds];
  // If it came from an imported source, record in excludedSourceIds so sync doesn't resurrect it
  if (target.sourceId && !newExcluded.includes(target.sourceId)) {
    newExcluded.push(target.sourceId);
  }

  return {
    ...state,
    actions: state.actions.filter(a => a.id !== id),
    excludedSourceIds: newExcluded,
  };
}

export function restoreExcludedAction(
  state: OperationalPlanState,
  sourceId: string
): OperationalPlanState {
  return {
    ...state,
    excludedSourceIds: state.excludedSourceIds.filter(id => id !== sourceId),
  };
}

export function restoreActionOriginalValues(
  state: OperationalPlanState,
  id: string
): OperationalPlanState {
  return {
    ...state,
    actions: state.actions.map(a => {
      if (a.id !== id || !a.originalValues) return a;
      return {
        ...a,
        title: a.originalValues.title ?? a.title,
        targetAudience: a.originalValues.targetAudience ?? a.targetAudience,
        timeframe: a.originalValues.timeframe ?? a.timeframe,
        status: a.originalValues.status ?? a.status,
        notes: a.originalValues.notes ?? a.notes,
        isCustomized: false,
        updatedAt: new Date().toISOString(),
      };
    }),
  };
}

export function reorderObjectives(
  state: OperationalPlanState,
  sourceIndex: number,
  destinationIndex: number
): OperationalPlanState {
  const list = [...state.objectives];
  const [removed] = list.splice(sourceIndex, 1);
  list.splice(destinationIndex, 0, removed);
  return {
    ...state,
    objectives: list.map((item, idx) => ({ ...item, order: idx + 1 })),
  };
}

export function reorderActions(
  state: OperationalPlanState,
  sourceIndex: number,
  destinationIndex: number
): OperationalPlanState {
  const list = [...state.actions];
  const [removed] = list.splice(sourceIndex, 1);
  list.splice(destinationIndex, 0, removed);
  return {
    ...state,
    actions: list.map((item, idx) => ({ ...item, order: idx + 1 })),
  };
}


// ─── Dedicated Standalone A3 Landscape Official Print Function ───────────────
export function printOfficialOperationalPlan(
  state: OperationalPlanState,
  options?: { academicYear?: string }
): void {
  const academicYear = options?.academicYear || state.academicYear || '2026-2027';

  // Group actions by objective in order
  const objMap = new Map<string, OperationalAction[]>();
  state.objectives.forEach(obj => objMap.set(obj.id, []));
  const sortedActions = [...state.actions].sort((a, b) => (a.order || 0) - (b.order || 0));
  sortedActions.forEach(a => {
    const list = objMap.get(a.objectiveId);
    if (list) list.push(a);
    else objMap.set(a.objectiveId, [a]);
  });

  const sortedObjectives = [...state.objectives].sort((a, b) => (a.order || 0) - (b.order || 0));

  let rowsHtml = '';
  let globalIndex = 1;

  sortedObjectives.forEach(obj => {
    const actions = objMap.get(obj.id) || [];
    const rowSpan = actions.length > 0 ? actions.length : 1;

    if (actions.length === 0) {
      rowsHtml += `
        <tr>
          <td style="text-align:center;border:1px solid #CBD5E1;padding:4px 3px;">—</td>
          <td style="border:1.5px solid #0F2044;background:#EEF2FF;font-weight:800;padding:4px 7px;color:#0F2044;">
            <span style="background:linear-gradient(135deg,#0F2044,#0369A1);color:#fff;display:inline-block;padding:1px 5px;border-radius:3px;font-size:7.5pt;margin-left:4px;">${obj.code}</span>
            ${obj.title}
          </td>
          <td colspan="6" style="text-align:center;color:#94A3B8;border:1px solid #CBD5E1;padding:4px;">لا توجد إجراءات مسجلة</td>
        </tr>
      `;
    } else {
      actions.forEach((act, actIdx) => {
        const isFirst = actIdx === 0;
        const statusClass = act.status === 'تم التنفيذ' ? 'sd' : act.status === 'لم يتم التنفيذ' ? 'sn' : 'su';
        const statusText = act.status === 'تم التنفيذ' ? '✓ تم التنفيذ' : act.status === 'لم يتم التنفيذ' ? '✗ لم يتم' : '— غير محدد';
        const sourceLabel = act.sourceModule
          ? (SOURCE_MODULE_LABELS[act.sourceModule] || act.sourceModule)
          : (act.isManual ? 'يدوي' : '—');
        const rowBg = actIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

        rowsHtml += `
          <tr style="background:${rowBg};">
            <td style="text-align:center;font-weight:800;border:1px solid #CBD5E1;padding:4px 3px;color:#0F2044;font-size:7.5pt;">${globalIndex++}</td>
            ${isFirst ? `
              <td rowspan="${rowSpan}" style="vertical-align:top;border:1.5px solid #0F2044;background:#EEF2FF;font-weight:800;color:#0F2044;padding:5px 7px;line-height:1.4;">
                <div style="background:linear-gradient(135deg,#0F2044,#0369A1);color:#fff;display:inline-block;padding:1px 6px;border-radius:3px;font-size:7.5pt;font-weight:900;margin-bottom:4px;">${obj.code}</div>
                <div style="font-size:8pt;font-weight:800;line-height:1.35;">${obj.title}</div>
                ${obj.description ? `<div style="font-size:7pt;color:#475569;font-weight:500;margin-top:3px;padding-top:3px;border-top:1px dashed #CBD5E1;">${obj.description}</div>` : ''}
                <div style="margin-top:4px;font-size:6.5pt;color:#64748B;font-weight:700;">📋 ${actions.length} إجراء</div>
              </td>
            ` : ''}
            <td style="padding:4px 7px;font-weight:700;color:#0F172A;line-height:1.35;border:1px solid #CBD5E1;font-size:8pt;">
              ${act.title}
              ${act.isManual ? `<span style="margin-right:4px;background:#FEF3C7;color:#92400E;padding:1px 4px;border-radius:3px;font-size:6.5pt;font-weight:800;">يدوي</span>` : ''}
            </td>
            <td style="padding:4px 7px;color:#334155;border:1px solid #CBD5E1;font-size:7.5pt;">${act.targetAudience || '—'}</td>
            <td style="padding:4px 7px;color:#334155;border:1px solid #CBD5E1;font-size:7.5pt;white-space:nowrap;">${act.timeframe || '—'}</td>
            <td style="padding:4px 5px;text-align:center;border:1px solid #CBD5E1;">
              <span class="${statusClass}">${statusText}</span>
            </td>
            <td style="padding:4px 7px;color:#475569;line-height:1.3;border:1px solid #CBD5E1;font-size:7.5pt;">${act.notes || '—'}</td>
            <td style="padding:4px 6px;color:#64748B;border:1px solid #CBD5E1;font-size:7pt;text-align:center;">${sourceLabel}</td>
          </tr>
        `;
      });
    }
  });

  const totalActions = state.actions.length;
  const executedCount = state.actions.filter(a => a.status === 'تم التنفيذ').length;
  const unexecutedCount = state.actions.filter(a => a.status === 'لم يتم التنفيذ').length;
  const undefinedCount = state.actions.filter(a => a.status === 'غير محدد').length;
  const compRate = (executedCount + unexecutedCount > 0)
    ? Math.round((executedCount / (executedCount + unexecutedCount)) * 100)
    : 0;
  const printDate = new Date().toLocaleDateString('ar-QA', { year: 'numeric', month: 'long', day: 'numeric' });
  const printTime = new Date().toLocaleTimeString('ar-QA', { hour: '2-digit', minute: '2-digit' });

  // KPI pill helper
  const kpiPill = (icon: string, value: string|number, label: string, color: string) =>
    `<div style="display:inline-flex;flex-direction:column;align-items:center;min-width:70px;padding:4px 8px;background:#FFFFFF;border-radius:6px;border:1.5px solid ${color}30;border-top:3px solid ${color};">
       <div style="font-size:11pt;">${icon}</div>
       <div style="font-size:14pt;font-weight:900;color:${color};line-height:1;">${value}</div>
       <div style="font-size:6.5pt;font-weight:800;color:#475569;margin-top:2px;text-align:center;">${label}</div>
     </div>`;

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <title>الخطة الإجرائية — ${academicYear}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0;
      -webkit-print-color-adjust:exact!important;
      print-color-adjust:exact!important;
      color-adjust:exact!important;}

    @page{
      size:420mm 297mm;
      size:A3 landscape;
      margin:0;
    }

    html,body{
      margin:0!important;padding:0!important;
      width:420mm;min-height:297mm;
      background:#fff!important;
      font-family:'Cairo','Noto Sans Arabic',system-ui,sans-serif;
      color:#0F172A;direction:rtl;
      font-size:8pt;line-height:1.35;
    }

    /* ── PAGE WRAPPER (one per A3 sheet) ───────────────── */
    .pw{
      width:420mm;
      padding:5mm 10mm 5mm 10mm;
      box-sizing:border-box;
      background:#fff;
    }

    /* ── HEADER (ultra-compact) ─────────────────────────── */
    .hdr{
      display:flex;align-items:center;justify-content:space-between;
      border-bottom:2.5px solid #0F2044;
      padding-bottom:5px;margin-bottom:5px;
    }
    .hdr-logo{height:50px;max-width:140px;object-fit:contain;}
    .hdr-center{text-align:center;flex:1;padding:0 10px;}
    .hdr-sub{font-size:6.5pt;color:#64748B;font-weight:600;margin-bottom:2px;}
    .hdr-banner{
      display:inline-block;
      background:linear-gradient(135deg,#0F2044,#0369A1);
      color:#fff;padding:5px 18px;border-radius:7px;
      font-size:11.5pt;font-weight:900;
      box-shadow:0 2px 6px rgba(15,32,68,.2);
    }
    .hdr-year{display:block;font-size:8pt;font-weight:700;color:rgba(255,255,255,.85);margin-top:2px;}
    .hdr-code{font-size:6.5pt;color:#94A3B8;font-weight:600;margin-top:3px;}

    /* ── KPI STRIP ──────────────────────────────────────── */
    .kpi-strip{
      display:flex;gap:5px;justify-content:space-between;
      background:linear-gradient(135deg,#F8FAFC,#EEF2FF);
      border:1px solid #CBD5E1;border-radius:7px;
      padding:5px 8px;margin-bottom:4px;
    }
    .kpi-item{
      display:flex;flex-direction:column;align-items:center;
      min-width:60px;flex:1;padding:3px 5px;
      background:#fff;border-radius:5px;
      border-top:3px solid transparent;
    }
    .kpi-item.navy {border-top-color:#0F2044;}
    .kpi-item.blue  {border-top-color:#0284C7;}
    .kpi-item.green {border-top-color:#10B981;}
    .kpi-item.red   {border-top-color:#EF4444;}
    .kpi-item.gray  {border-top-color:#64748B;}
    .kpi-item.purple{border-top-color:#8B5CF6;}
    .kpi-ico{font-size:10pt;margin-bottom:1px;}
    .kpi-val{font-size:13pt;font-weight:900;line-height:1.05;}
    .kpi-item.navy  .kpi-val{color:#0F2044;}
    .kpi-item.blue  .kpi-val{color:#0284C7;}
    .kpi-item.green .kpi-val{color:#10B981;}
    .kpi-item.red   .kpi-val{color:#EF4444;}
    .kpi-item.gray  .kpi-val{color:#64748B;}
    .kpi-item.purple.kpi-val{color:#8B5CF6;}
    .kpi-item.purple .kpi-val{color:#8B5CF6;}
    .kpi-lbl{font-size:6pt;font-weight:800;color:#475569;margin-top:1px;text-align:center;}
    .pb{background:#F1F5F9;height:4px;border-radius:2px;margin-top:3px;overflow:hidden;width:100%;}
    .pb-fill{height:100%;border-radius:2px;background:#8B5CF6;}

    /* ── META BAR ───────────────────────────────────────── */
    .meta-bar{
      display:flex;justify-content:space-between;align-items:center;
      background:#F8FAFC;border:1px solid #E2E8F0;border-radius:5px;
      padding:3px 10px;margin-bottom:4px;
      font-size:6.5pt;font-weight:700;color:#334155;
    }
    .meta-pill{display:inline-flex;align-items:center;gap:3px;}
    .meta-pill strong{color:#0F2044;}

    /* ── TABLE ──────────────────────────────────────────── */
    table{
      width:100%;border-collapse:collapse;
      font-size:7.5pt;border:2px solid #0F2044;
      page-break-inside:auto;
    }
    thead{display:table-header-group;}
    tr{page-break-inside:avoid;page-break-after:auto;}
    th{
      background:linear-gradient(135deg,#0F2044,#1E3A5F)!important;
      color:#fff!important;font-weight:800;
      padding:6px 5px;text-align:right;
      border:1px solid #1E293B;font-size:7.5pt;
      -webkit-print-color-adjust:exact!important;
      print-color-adjust:exact!important;
    }
    th.tc,td.tc{text-align:center;}
    td{border:1px solid #CBD5E1;vertical-align:middle;padding:0;}

    /* ── STATUS BADGES ──────────────────────────────────── */
    .sd{display:inline-block;padding:1px 5px;border-radius:8px;font-size:7pt;font-weight:800;
        background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0;}
    .sn{display:inline-block;padding:1px 5px;border-radius:8px;font-size:7pt;font-weight:800;
        background:#FEF2F2;color:#991B1B;border:1px solid #FECACA;}
    .su{display:inline-block;padding:1px 5px;border-radius:8px;font-size:7pt;font-weight:800;
        background:#F1F5F9;color:#475569;border:1px solid #CBD5E1;}

    /* ── SIGNATURES ─────────────────────────────────────── */
    .sigs{
      margin-top:6mm;border-top:2px solid #0F2044;
      padding-top:5px;page-break-inside:avoid;break-inside:avoid;
    }
    .sigs-ttl{text-align:center;font-size:7pt;font-weight:800;color:#0F2044;margin-bottom:5px;}
    .sigs-row{display:flex;justify-content:space-between;gap:8px;}
    .sig{flex:1;text-align:center;background:#FAFCFF;border:1.5px solid #CBD5E1;border-radius:7px;padding:5px 8px;}
    .sig.main{border-color:#0F2044;background:#EEF2FF;}
    .sig-rt{font-size:7.5pt;font-weight:800;color:#0F2044;border-bottom:1px solid #CBD5E1;padding-bottom:3px;margin-bottom:3px;}
    .sig-nm{font-size:8pt;font-weight:800;color:#1E293B;margin-bottom:1px;}
    .sig-jb{font-size:6.5pt;color:#64748B;margin-bottom:4px;}
    .sig-ia{height:32px;display:flex;align-items:center;justify-content:center;}
    .sig-img{max-height:30px;max-width:120px;object-fit:contain;}
    .sig-ln{border-top:1px solid #94A3B8;margin:4px 8px 2px;}
    .sig-lb{font-size:6pt;color:#94A3B8;}

    /* ── FOOTER ─────────────────────────────────────────── */
    .doc-footer{
      margin-top:5px;padding-top:4px;border-top:1px dashed #CBD5E1;
      display:flex;justify-content:space-between;align-items:center;
      font-size:6pt;color:#94A3B8;font-weight:600;
    }

    .ab{page-break-inside:avoid;break-inside:avoid;}
  </style>
</head>
<body>
<div class="pw">

  <!-- ══════ LETTERHEAD ══════ -->
  <div class="hdr ab">
    <div style="width:140px;display:flex;align-items:center;justify-content:flex-start;">
      <img src="/ministry-logo.png" alt="وزارة التربية" class="hdr-logo"/>
    </div>
    <div class="hdr-center">
      <div class="hdr-sub">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
      <div class="hdr-banner">
        الخطة الإجرائية للتعليم الإلكتروني والحلول الرقمية
        <span class="hdr-year">العام الأكاديمي: ${academicYear}</span>
      </div>
      <div class="hdr-sub" style="margin-top:3px;">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين — قسم المشاريع والحلول الرقمية والتعليم الإلكتروني</div>
      <div class="hdr-code">كود الوثيقة: QSTSS-OP-${academicYear} &nbsp;|&nbsp; تاريخ الإصدار: ${printDate}</div>
    </div>
    <div style="width:140px;display:flex;align-items:center;justify-content:flex-end;">
      <img src="/school-logo.png" alt="مدرسة قطر" class="hdr-logo"/>
    </div>
  </div>

  <!-- ══════ KPI STRIP ══════ -->
  <div class="kpi-strip ab">
    <div class="kpi-item navy">
      <div class="kpi-ico">🎯</div>
      <div class="kpi-val">${state.objectives.length}</div>
      <div class="kpi-lbl">الأهداف الاستراتيجية</div>
    </div>
    <div class="kpi-item blue">
      <div class="kpi-ico">📑</div>
      <div class="kpi-val">${totalActions}</div>
      <div class="kpi-lbl">إجمالي الإجراءات</div>
    </div>
    <div class="kpi-item green">
      <div class="kpi-ico">✅</div>
      <div class="kpi-val">${executedCount}</div>
      <div class="kpi-lbl">تم التنفيذ</div>
    </div>
    <div class="kpi-item red">
      <div class="kpi-ico">⏳</div>
      <div class="kpi-val">${unexecutedCount}</div>
      <div class="kpi-lbl">لم يتم التنفيذ</div>
    </div>
    <div class="kpi-item gray">
      <div class="kpi-ico">📋</div>
      <div class="kpi-val">${undefinedCount}</div>
      <div class="kpi-lbl">غير محدد</div>
    </div>
    <div class="kpi-item purple">
      <div class="kpi-ico">📈</div>
      <div class="kpi-val" style="color:#8B5CF6;">${compRate}%</div>
      <div class="kpi-lbl">نسبة الإنجاز</div>
      <div class="pb"><div class="pb-fill" style="width:${compRate}%;"></div></div>
    </div>
  </div>

  <!-- ══════ META BAR ══════ -->
  <div class="meta-bar ab">
    <span class="meta-pill">🏫 <strong>مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</strong></span>
    <span class="meta-pill">📅 <strong>${academicYear}</strong></span>
    <span class="meta-pill">🔄 آخر مزامنة: <strong>${state.lastSyncedAt ? new Date(state.lastSyncedAt).toLocaleDateString('ar-QA') : 'غير محدد'}</strong></span>
    <span class="meta-pill">🖨️ <strong>${printDate} — ${printTime}</strong></span>
    <span class="meta-pill">📌 <strong style="color:#065F46;">وثيقة رسمية معتمدة</strong></span>
  </div>

  <!-- ══════ OFFICIAL TABLE ══════ -->
  <table>
    <thead>
      <tr>
        <th class="tc" style="width:28px;">م.</th>
        <th style="width:185px;">الأهداف الاستراتيجية</th>
        <th style="min-width:220px;">الإجراءات التنفيذية</th>
        <th style="width:140px;">الفئة المستهدفة</th>
        <th style="width:115px;">الإطار الزمني</th>
        <th class="tc" style="width:108px;">حالة التنفيذ</th>
        <th style="min-width:175px;">الملاحظات والمخرجات</th>
        <th class="tc" style="width:82px;">المصدر</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- ══════ SIGNATURES ══════ -->
  <div class="sigs">
    <div class="sigs-ttl">— التوقيعات والاعتمادات الرسمية —</div>
    <div class="sigs-row">
      <div class="sig">
        <div class="sig-rt">إعداد وتوثيق الخطة</div>
        <div class="sig-nm">م. أحمد عادل طبيشات</div>
        <div class="sig-jb">منسق المشاريع والتعليم الإلكتروني</div>
        <div class="sig-ia"><img class="sig-img" src="/signature-ahmad.png" onerror="this.style.display='none'" alt=""/></div>
        <div class="sig-ln"></div>
        <div class="sig-lb">التوقيع</div>
      </div>
      <div class="sig">
        <div class="sig-rt">مراجعة واعتماد</div>
        <div class="sig-nm">د. راني التوم</div>
        <div class="sig-jb">النائب الأكاديمي للمدرسة</div>
        <div class="sig-ia"><img class="sig-img" src="/signature-rani.png" onerror="this.style.display='none'" alt=""/></div>
        <div class="sig-ln"></div>
        <div class="sig-lb">التوقيع</div>
      </div>
      <div class="sig main">
        <div class="sig-rt">يعتمد، مدير المدرسة</div>
        <div class="sig-nm">محمد علي مندني العمادي</div>
        <div class="sig-jb">مدير مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
        <div class="sig-ia"><img class="sig-img" src="/principal-signature.png" onerror="this.style.display='none'" alt=""/></div>
        <div class="sig-ln"></div>
        <div class="sig-lb">التوقيع والختم الرسمي</div>
      </div>
    </div>
  </div>

  <!-- ══════ FOOTER ══════ -->
  <div class="doc-footer">
    <span>📄 QSTSS-OP-${academicYear} | وثيقة رسمية — للاستخدام المؤسسي الداخلي</span>
    <span>وزارة التربية والتعليم والتعليم العالي — دولة قطر | ${printDate}</span>
  </div>

</div>
<script>
  window.onload = function() {
    setTimeout(function() { window.focus(); window.print(); }, 600);
  };
</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=1600,height=1100');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  } else {
    window.print();
  }
}
