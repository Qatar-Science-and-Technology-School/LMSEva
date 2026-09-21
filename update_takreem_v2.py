import re

file_path = "/Users/ahmadtubaishat/.gemini/antigravity/scratch/teacher-tracking/src/components/pages/TakreemPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Props
old_props = """interface Props {
  currentUser: User;
  selectedYear?: string;
}"""

new_props = """interface Props {
  currentUser: User;
  selectedYear?: string;
  onNavigateToPage?: (page: string) => void;
}"""

if old_props in content:
    content = content.replace(old_props, new_props)
    print("Props replaced in TakreemPage.")
else:
    print("old_props not found in TakreemPage!")

# 2. Update function signature
old_sig = "export default function TakreemPage({ currentUser, selectedYear: propYear }: Props) {"
new_sig = "export default function TakreemPage({ currentUser, selectedYear: propYear, onNavigateToPage }: Props) {"

if old_sig in content:
    content = content.replace(old_sig, new_sig)
    print("Signature replaced in TakreemPage.")
else:
    print("old_sig not found in TakreemPage!")

# 3. Add monthly evaluations computation
old_current_honorees = """  const currentHonorees = useMemo(() => {
    let list = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, selMonth);
    if (isCoord && coordDepts.length > 0) {
      list = list.filter(h => coordDepts.includes(h.departmentId));
    }
    return list;
  }, [evaluations, teachers, departments, selYear, selMonth, isCoord, coordDepts]);"""

new_current_honorees = """  const currentHonorees = useMemo(() => {
    let list = getMonthlyDepartmentHonorees(evaluations, teachers, departments, selYear, selMonth);
    if (isCoord && coordDepts.length > 0) {
      list = list.filter(h => coordDepts.includes(h.departmentId));
    }
    return list;
  }, [evaluations, teachers, departments, selYear, selMonth, isCoord, coordDepts]);

  const monthlyTop10 = useMemo(() => {
    if (selMonth === 'سبتمبر') return [];
    const evs = evaluations.filter(e => e.academicYear === selYear && e.month === selMonth);
    if (evs.length === 0) return [];
    const sorted = [...evs].sort((a, b) => b.totalScore - a.totalScore);
    return sorted.slice(0, 10).map((ev, idx) => {
      const t = teachers.find(x => x.id === ev.teacherId);
      const d = departments.find(x => x.id === t?.departmentId);
      return {
        rank: idx + 1,
        teacherId: ev.teacherId,
        teacherNameAr: t?.nameAr || 'معلم',
        departmentName: d?.nameAr || 'القسم الأكاديمي',
        totalScore: ev.totalScore,
        averageScore: ev.averageScore,
        performanceLevel: ev.performanceLevel,
      };
    });
  }, [evaluations, selYear, selMonth, teachers, departments]);"""

if old_current_honorees in content:
    content = content.replace(old_current_honorees, new_current_honorees)
    print("Monthly top 10 logic added.")
else:
    print("old_current_honorees not found!")

# 4. In Header Banner, add Month Selector right under title or alongside title
old_header_title = """          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🏆</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#fff' }}>
                لوحة تكريم المعلمين وشهادات الشكر والتقدير
              </h1>
            </div>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>
              مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين · تكريم العشرة الأوائل وفرسان الأقسام في تفعيل نظام قطر للتعليم والمنصات الرقمية
            </p>
          </div>"""

new_header_title = """          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🏆</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#fff' }}>
                لوحة تكريم المعلمين وشهادات الشكر والتقدير
              </h1>
            </div>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>
              مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين · تكريم العشرة الأوائل وفرسان الأقسام في تفعيل نظام قطر للتعليم والمنصات الرقمية
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.18)', padding: '0.35rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.25)' }}>
                <span style={{ fontSize: '0.9rem' }}>📅</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>شهر التكريم والشهادات:</span>
                <select
                  value={selMonth}
                  onChange={(e) => setSelMonth(e.target.value)}
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
                  {APPROVED_MONTHS.map(m => (
                    <option key={m} value={m} style={{ color: '#0F2044', fontWeight: 700 }}>
                      شهر {m} {m === 'سبتمبر' ? '(المعتمد حالياً)' : m === 'أكتوبر' ? '(الشهر القادم)' : ''}
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    background: selMonth === 'سبتمبر' ? '#10B981' : '#F59E0B',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                  }}
                >
                  {selMonth === 'سبتمبر' ? 'معتمد ومكتمل' : 'قيد الانتظار'}
                </span>
              </div>
            </div>
          </div>"""

if old_header_title in content:
    content = content.replace(old_header_title, new_header_title)
    print("Header title & month selector replaced.")
else:
    print("old_header_title not found!")

# 5. Update batch print buttons in header
old_batch_btns = """        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              // Print all Top 10 certificates sequentially
              TOP_10_INDEX_TEACHERS.forEach((t, i) => {
                setTimeout(() => {
                  handlePrintCertificate({
                    teacherNameAr: t.name,
                    departmentName: t.department,
                    totalScore: t.generalIndex,
                    recognitionReason: `تكريم وتقدير لحصول المعلم على المركز ${t.rank} على مستوى المدرسة في مؤشرات تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية لشهر سبتمبر 2026.`,
                    badgeTitle: `المركز ${t.rank} على مستوى المدرسة`,
                  });
                }, i * 600);
              });
            }}
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
            }}
          >
            <span>📜</span> طباعة شهادات العشرة الأوائل (A4)
          </button>

          <button
            onClick={() => {
              // Print all Department Champions certificates sequentially
              DEPARTMENT_CHAMPIONS_10.forEach((d, i) => {
                setTimeout(() => {
                  handlePrintCertificate({
                    teacherNameAr: d.teacherName,
                    departmentName: d.department,
                    totalScore: d.score,
                    recognitionReason: `تكريم وتقدير لتصدر المعلم لقسم ${d.department} وحصوله على لقب (${d.title}) في تفعيل نظام قطر للتعليم لشهر سبتمبر 2026.`,
                    badgeTitle: d.title,
                  });
                }, i * 600);
              });
            }}
            style={{
              background: '#0284C7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
            }}
          >
            <span>🎖️</span> طباعة شهادات فرسان الأقسام (A4)
          </button>
        </div>"""

new_batch_btns = """        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (selMonth === 'سبتمبر') {
                TOP_10_INDEX_TEACHERS.forEach((t, i) => {
                  setTimeout(() => {
                    handlePrintCertificate({
                      teacherNameAr: t.name,
                      departmentName: t.department,
                      totalScore: t.generalIndex,
                      recognitionReason: `تكريم وتقدير لحصول المعلم على المركز ${t.rank} على مستوى المدرسة في مؤشرات تفعيل نظام قطر للتعليم والمنصات التعليمية الرقمية لشهر ${selMonth} ${selYear}.`,
                      badgeTitle: `المركز ${t.rank} على مستوى المدرسة`,
                      month: selMonth,
                      academicYear: selYear,
                    });
                  }, i * 600);
                });
              } else if (monthlyTop10.length > 0) {
                monthlyTop10.forEach((t: any, i: number) => {
                  setTimeout(() => {
                    handlePrintCertificate({
                      teacherNameAr: t.teacherNameAr,
                      departmentName: t.departmentName,
                      totalScore: t.totalScore,
                      recognitionReason: `تكريم وتقدير لحصول المعلم على المركز ${i + 1} على مستوى المدرسة في تفعيل نظام قطر للتعليم لشهر ${selMonth} ${selYear}.`,
                      badgeTitle: `المركز ${i + 1} على مستوى المدرسة`,
                      month: selMonth,
                      academicYear: selYear,
                    });
                  }, i * 600);
                });
              } else {
                alert(`لا توجد بيانات تقييم معتمدة لشهر ${selMonth} حتى الآن لطباعة شهادات الأوائل.`);
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
            }}
          >
            <span>📜</span> طباعة شهادات العشرة الأوائل - {selMonth} (A4)
          </button>

          <button
            onClick={() => {
              if (selMonth === 'سبتمبر') {
                DEPARTMENT_CHAMPIONS_10.forEach((d, i) => {
                  setTimeout(() => {
                    handlePrintCertificate({
                      teacherNameAr: d.teacherName,
                      departmentName: d.department,
                      totalScore: d.score,
                      recognitionReason: `تكريم وتقدير لتصدر المعلم لقسم ${d.department} وحصوله على لقب (${d.title}) في تفعيل نظام قطر للتعليم لشهر ${selMonth} ${selYear}.`,
                      badgeTitle: d.title,
                      month: selMonth,
                      academicYear: selYear,
                    });
                  }, i * 600);
                });
              } else if (currentHonorees.length > 0) {
                currentHonorees.forEach((d: any, i: number) => {
                  setTimeout(() => {
                    handlePrintCertificate({
                      teacherNameAr: d.teacherNameAr,
                      departmentName: d.departmentName,
                      totalScore: d.totalScore,
                      recognitionReason: `تكريم وتقدير لتصدر المعلم لقسم ${d.departmentName} في تفعيل نظام قطر للتعليم لشهر ${selMonth} ${selYear}.`,
                      badgeTitle: `فارس قسم ${d.departmentName}`,
                      month: selMonth,
                      academicYear: selYear,
                    });
                  }, i * 600);
                });
              } else {
                alert(`لا توجد بيانات تقييم معتمدة لشهر ${selMonth} حتى الآن لطباعة شهادات فرسان الأقسام.`);
              }
            }}
            style={{
              background: '#0284C7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
            }}
          >
            <span>🎖️</span> طباعة شهادات فرسان الأقسام - {selMonth} (A4)
          </button>
        </div>"""

if old_batch_btns in content:
    content = content.replace(old_batch_btns, new_batch_btns)
    print("Batch buttons replaced.")
else:
    print("old_batch_btns not found!")

# 6. In activeTab === 'top_honorees', check if selMonth === 'سبتمبر' vs upcoming month
old_top_honorees_start = """      {/* ══════════════════════════════════════════════════════════════
          TAB 1: 🏆 لوحة التميز (العشرة الأوائل بالمدرسة + أفضل معلم من كل قسم)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'top_honorees' && (
        <div>
          {/* Section 1: Top 10 Outstanding Teachers */}"""

new_top_honorees_start = """      {/* ══════════════════════════════════════════════════════════════
          TAB 1: 🏆 لوحة التميز (العشرة الأوائل بالمدرسة + أفضل معلم من كل قسم)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'top_honorees' && (
        <div>
          {selMonth !== 'سبتمبر' && monthlyTop10.length === 0 && currentHonorees.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3.5rem 2rem', background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: '2rem' }}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto 1.25rem', background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                🏆
              </div>
              <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.82rem', fontWeight: 800, padding: '0.3rem 0.8rem', borderRadius: '999px', display: 'inline-block', marginBottom: '0.75rem' }}>
                تكريم شهر {selMonth} — قيد الانتظار
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F2044', margin: '0 0 0.5rem' }}>
                لوحة التميز وشهادات الشكر والتقدير — شهر {selMonth} {selYear}
              </h2>
              <p style={{ color: '#64748B', maxWidth: '650px', margin: '0 auto 1.75rem', fontSize: '0.92rem', lineHeight: '1.65' }}>
                لم يتم إرفاق تقرير تقييم نظام قطر للتعليم لشهر {selMonth} حتى الآن. سيتم احتساب مؤشرات الأداء وإظهار العشرة الأوائل وفرسان الأقسام وإصدار شهادات التكريم تلقائياً بمجرد إرفاق تقرير شهر {selMonth} في صفحة تقييم نظام قطر للتعليم.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {onNavigateToPage && (
                  <button
                    onClick={() => onNavigateToPage('evaluation')}
                    style={{
                      background: '#0F2044',
                      color: '#fff',
                      border: 'none',
                      padding: '0.65rem 1.4rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <span>📊</span> الانتقال لصفحة تقييم نظام قطر للتعليم لإرفاق تقرير شهر {selMonth}
                  </button>
                )}

                <button
                  onClick={() => setSelMonth('سبتمبر')}
                  style={{
                    background: '#F1F5F9',
                    color: '#0F2044',
                    border: '1px solid #CBD5E1',
                    padding: '0.65rem 1.4rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <span>🏆</span> عرض المكرمين لشهر سبتمبر ٢٠٢٦ (المعتمد)
                </button>
              </div>
            </div>
          ) : (
            <>
          {/* Section 1: Top 10 Outstanding Teachers */}"""

if old_top_honorees_start in content:
    content = content.replace(old_top_honorees_start, new_top_honorees_start)
    print("Top honorees start replaced.")
else:
    print("old_top_honorees_start not found!")

# 7. Close fragment before Tab 2
old_tab2_start = """      {/* ══════════════════════════════════════════════════════════════
          TAB 2: 📅 التكريم الشهري العام
      ══════════════════════════════════════════════════════════════ */}"""

new_tab2_start = """            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: 📅 التكريم الشهري العام
      ══════════════════════════════════════════════════════════════ */}"""

# Note: check if line 685 has `</div>\n      )}`
old_tab1_end = """            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: 📅 التكريم الشهري العام"""

new_tab1_end = """            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: 📅 التكريم الشهري العام"""

if old_tab1_end in content:
    content = content.replace(old_tab1_end, new_tab1_end)
    print("Tab 1 end closed successfully.")
else:
    print("old_tab1_end not found!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Finished writing TakreemPage.tsx.")
