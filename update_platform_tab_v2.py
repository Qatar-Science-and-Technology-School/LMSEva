import re

file_path = "/Users/ahmadtubaishat/.gemini/antigravity/scratch/teacher-tracking/src/components/pages/PlatformReportTab.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Props interface to include selectedMonth and onMonthChange
old_props = """interface Props {
  teachers: Teacher[];
  departments: Department[];
  onSelectTeacherForEval: (teacherId: string) => void;
  onSyncEvals: () => Promise<void>;
  isSyncing: boolean;
  syncSuccessMsg: string;
  onExportExcel: () => void;
  onNavigateToTakreem?: () => void;
}"""

new_props = """export interface EvaluationMonthOption {
  id: string;
  month: string;
  year: string;
  label: string;
  status: 'available' | 'upcoming';
  badgeText: string;
  recordCount: number;
}

export const EVALUATION_MONTHS: EvaluationMonthOption[] = [
  { id: '2026-09', month: 'سبتمبر', year: '2026-2027', label: 'سبتمبر ٢٠٢٦', status: 'available', badgeText: 'معتمد ومكتمل (٥٢ معلماً)', recordCount: 52 },
  { id: '2026-10', month: 'أكتوبر', year: '2026-2027', label: 'أكتوبر ٢٠٢٦', status: 'upcoming', badgeText: 'قيد الانتظار - الشهر القادم', recordCount: 0 },
  { id: '2026-11', month: 'نوفمبر', year: '2026-2027', label: 'نوفمبر ٢٠٢٦', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2026-12', month: 'ديسمبر', year: '2026-2027', label: 'ديسمبر ٢٠٢٦', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-01', month: 'يناير', year: '2026-2027', label: 'يناير ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-02', month: 'فبراير', year: '2026-2027', label: 'فبراير ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-03', month: 'مارس', year: '2026-2027', label: 'مارس ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-04', month: 'أبريل', year: '2026-2027', label: 'أبريل ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-05', month: 'مايو', year: '2026-2027', label: 'مايو ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
  { id: '2027-06', month: 'يونيو', year: '2026-2027', label: 'يونيو ٢٠٢٧', status: 'upcoming', badgeText: 'مجدول لاحقاً', recordCount: 0 },
];

interface Props {
  teachers: Teacher[];
  departments: Department[];
  onSelectTeacherForEval: (teacherId: string) => void;
  onSyncEvals: () => Promise<void>;
  isSyncing: boolean;
  syncSuccessMsg: string;
  onExportExcel: () => void;
  onNavigateToTakreem?: () => void;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
}"""

if old_props in content:
    content = content.replace(old_props, new_props)
    print("Props replaced successfully.")
else:
    print("old_props not found!")

# 2. Update PlatformReportTab arguments and state
old_args = """export default function PlatformReportTab({
  teachers,
  departments,
  onSelectTeacherForEval,
  onSyncEvals,
  isSyncing,
  syncSuccessMsg,
  onExportExcel,
  onNavigateToTakreem,
}: Props) {
  const [subTab, setSubTab] = useState<'top_teachers' | 'departments' | 'admin_ratings' | 'followup' | 'full_table' | 'grades'>('top_teachers');
  const [selectedTeacherModal, setSelectedTeacherModal] = useState<LmsReportTeacherRecord | null>(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isPrintingReport, setIsPrintingReport] = useState(false);"""

new_args = """export default function PlatformReportTab({
  teachers,
  departments,
  onSelectTeacherForEval,
  onSyncEvals,
  isSyncing,
  syncSuccessMsg,
  onExportExcel,
  onNavigateToTakreem,
  selectedMonth,
  onMonthChange,
}: Props) {
  const [selectedMonthId, setSelectedMonthId] = useState(
    selectedMonth ? (EVALUATION_MONTHS.find(m => m.month === selectedMonth)?.id || '2026-09') : '2026-09'
  );
  const currentMonthObj = EVALUATION_MONTHS.find(m => m.id === selectedMonthId) || EVALUATION_MONTHS[0];
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [subTab, setSubTab] = useState<'top_teachers' | 'departments' | 'admin_ratings' | 'followup' | 'full_table' | 'grades'>('top_teachers');
  const [selectedTeacherModal, setSelectedTeacherModal] = useState<LmsReportTeacherRecord | null>(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isPrintingReport, setIsPrintingReport] = useState(false);"""

if old_args in content:
    content = content.replace(old_args, new_args)
    print("Args and state replaced successfully.")
else:
    print("old_args not found!")

# 3. Update handlePrintCertificate to use currentMonthObj
old_cert = """  // Handle Certificate Print
  const handlePrintCertificate = (teacher: LmsReportTeacherRecord | { name: string; department: string; generalIndex?: number; notes?: string }) => {
    printTeacherCertificate({
      teacherNameAr: teacher.name,
      departmentName: teacher.department,
      academicYear: '2026-2027',
      month: 'سبتمبر',
      totalScore: teacher.generalIndex || (teacher as any).evalIndex || undefined,
      recognitionReason: (teacher as any).notes || `تكريم وتقدير لتميز المعلم وتصدره مؤشرات متابعة نشاط نظام قطر للتعليم لشهر سبتمبر 2026.`,
    });
  };"""

new_cert = """  // Handle Certificate Print
  const handlePrintCertificate = (teacher: LmsReportTeacherRecord | { name: string; department: string; generalIndex?: number; notes?: string }) => {
    printTeacherCertificate({
      teacherNameAr: teacher.name,
      departmentName: teacher.department,
      academicYear: currentMonthObj.year,
      month: currentMonthObj.month,
      totalScore: teacher.generalIndex || (teacher as any).evalIndex || undefined,
      recognitionReason: (teacher as any).notes || `تكريم وتقدير لتميز المعلم وتصدره مؤشرات متابعة نشاط نظام قطر للتعليم لشهر ${currentMonthObj.month} ${currentMonthObj.year}.`,
    });
  };"""

if old_cert in content:
    content = content.replace(old_cert, new_cert)
    print("Certificate handler replaced successfully.")
else:
    print("old_cert not found!")

# 4. In Top Banner, insert the Month Selector prominently
old_badge = """            <span
              style={{
                background: '#00B4D8',
                color: '#0F2044',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
              }}
            >
              سبتمبر 2026
            </span>"""

new_badge = """            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.18)', padding: '0.35rem 0.85rem', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.85rem' }}>📅</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>شهر التقييم:</span>
              <select
                value={selectedMonthId}
                onChange={(e) => {
                  setSelectedMonthId(e.target.value);
                  const m = EVALUATION_MONTHS.find(x => x.id === e.target.value);
                  if (m && onMonthChange) onMonthChange(m.month);
                }}
                style={{
                  background: '#fff',
                  color: '#0F2044',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {EVALUATION_MONTHS.map(m => (
                  <option key={m.id} value={m.id} style={{ color: '#0F2044', fontWeight: 700 }}>
                    {m.label} {m.status === 'available' ? '✅ معتمد' : '⏳ قادم'}
                  </option>
                ))}
              </select>
              <span
                style={{
                  background: currentMonthObj.status === 'available' ? '#10B981' : '#F59E0B',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                }}
              >
                {currentMonthObj.badgeText}
              </span>
            </div>"""

if old_badge in content:
    content = content.replace(old_badge, new_badge)
    print("Badge replaced with Month Selector successfully.")
else:
    print("old_badge not found!")

# 5. Wrap KPI Summary Cards and Subtabs with conditional check for selectedMonthId === '2026-09'
old_kpi_start = """      {/* ── 2. KPI Summary Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.25rem',
        }}
      >"""

upcoming_view = """      {/* ── Conditional Month View: Available vs Upcoming ── */}
      {selectedMonthId !== '2026-09' ? (
        <div style={{ ...cardStyle, padding: '3rem 2rem', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 1.25rem', background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
            📑
          </div>
          <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.82rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '999px', display: 'inline-block', marginBottom: '0.75rem' }}>
            قيد الانتظار — {currentMonthObj.badgeText}
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.5rem' }}>
            تقرير تقييم نظام قطر للتعليم — شهر {currentMonthObj.label}
          </h2>
          <p style={{ color: '#64748B', maxWidth: '680px', margin: '0 auto 1.75rem', fontSize: '0.92rem', lineHeight: '1.65' }}>
            سيتم تفعيل تقييمات شهر {currentMonthObj.month} وحساب مؤشرات المعلمين الـ 52 فور إرفاق التقرير الشهري الصادر عن نظام قطر للتعليم.
            بمجرد إرفاق الملف، سيقوم النظام تلقائياً باستخراج نشاط وتفاعل كافة المعلمين، احتساب مؤشرات الدروس والتسليمات والتغطية، تحديث لوحة الشرف وفرسان الأقسام، وتوليد شهادات الشكر والتقدير لشهر {currentMonthObj.month}.
          </p>

          {/* Upload Box */}
          <div
            style={{
              maxWidth: '560px',
              margin: '0 auto 1.5rem',
              border: '2px dashed #94A3B8',
              borderRadius: '14px',
              padding: '2rem 1.5rem',
              background: '#F8FAFC',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="file"
              accept=".pdf,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadedFileName(e.target.files[0].name);
                  setUploadSuccess(true);
                }
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
            <div style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>📤</div>
            <div style={{ fontWeight: 800, color: '#0F2044', fontSize: '1rem', marginBottom: '0.35rem' }}>
              {uploadedFileName ? `تم اختيار الملف: ${uploadedFileName}` : `انقر هنا أو اسحب وأفلت تقرير شهر ${currentMonthObj.month} (PDF أو Excel)`}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
              يدعم ملفات التقارير الرسمية لنظام قطر للتعليم (ملفات PDF والتقارير المجدولة)
            </div>
          </div>

          {uploadSuccess && (
            <div style={{ maxWidth: '560px', margin: '0 auto 1.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem' }}>
              ✅ تم استقبال ملف التقرير بنجاح: {uploadedFileName}
              <div style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: '0.3rem', color: '#047857' }}>
                سيتم مطابقة المؤشرات وتوليد التقييمات لشهر {currentMonthObj.month} فور معالجة الملف.
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button
              onClick={() => onSelectTeacherForEval(teachers[0]?.id || 't1')}
              style={{
                background: '#0F2044',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.35rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <span>📝</span> إدخال تقييمات شهر {currentMonthObj.month} يدوياً عبر النموذج
            </button>

            {onNavigateToTakreem && (
              <button
                onClick={onNavigateToTakreem}
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem 1.35rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>🏆</span> الانتقال لصفحة تكريم المعلمين
              </button>
            )}

            <button
              onClick={() => setSelectedMonthId('2026-09')}
              style={{
                background: '#F1F5F9',
                color: '#0F2044',
                border: '1px solid #CBD5E1',
                padding: '0.65rem 1.35rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <span>🔄</span> العودة لتقرير شهر سبتمبر ٢٠٢٦ (المعتمد)
            </button>
          </div>

          {/* Teacher readiness roster */}
          <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'right', background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044', margin: '0 0 0.4rem' }}>
              👥 كادر المعلمين المعتمد لتقييم شهر {currentMonthObj.month} (52 معلماً):
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem' }}>
              تمت تهيئة سجلات المعلمين والأقسام الأكاديمية لاستقبال بيانات نشاط نظام قطر للتعليم فور اعتماد التقرير.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', padding: '0.6rem', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              {SEPTEMBER_2026_LMS_TEACHERS.slice(0, 24).map((t, idx) => (
                <div key={idx} style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', background: '#F1F5F9', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#0F2044' }}>{t.name}</span>
                  <span style={{ color: '#64748B' }}>{t.department}</span>
                </div>
              ))}
              <div style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', color: '#0284C7', fontWeight: 700, textAlign: 'center' }}>
                + 28 معلماً آخرين...
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── 2. KPI Summary Cards ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >"""

if old_kpi_start in content:
    content = content.replace(old_kpi_start, upcoming_view)
    print("KPI start replaced successfully.")
else:
    print("old_kpi_start not found!")

# Now close the fragment before modal
old_modal_start = """      {/* ── Teacher Detail Modal ── */}
      {selectedTeacherModal && ("""

new_modal_start = """        </>
      )}

      {/* ── Teacher Detail Modal ── */}
      {selectedTeacherModal && ("""

if old_modal_start in content:
    content = content.replace(old_modal_start, new_modal_start)
    print("Modal start replaced and fragment closed successfully.")
else:
    print("old_modal_start not found!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Finished writing PlatformReportTab.tsx.")
