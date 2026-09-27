import {
  SEPTEMBER_2026_LMS_METRICS,
  SEPTEMBER_2026_LMS_TEACHERS,
  GRADE_LEVEL_LMS_STATS,
  TOP_10_INDEX_TEACHERS,
  DEPARTMENT_PERFORMANCE_LIST,
  ADMINISTRATIVE_RATINGS_LIST,
  FOLLOWUP_PENDING_TEACHERS,
  FOLLOWUP_PARTIAL_TEACHERS,
  UNASSIGNED_EVAL_TEACHERS,
  ZERO_LESSON_TEACHERS,
  SECTIONS_LMS_STATS,
  SUBJECTS_LMS_STATS,
  DEPARTMENT_CHAMPIONS_10,
} from './data';

interface PrintReportOptions {
  monthName: string;
  academicYear?: string;
}

export function printComprehensiveLmsReport(options: PrintReportOptions) {
  const { monthName, academicYear = '2026-2027' } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير الشامل.');
    return;
  }

  // Department Champions (Official 27 Sep 2026)
  const deptChampions = DEPARTMENT_CHAMPIONS_10;

  // Split teachers into 2 groups for A3 Landscape pages (26 each)
  const teachersPage1 = SEPTEMBER_2026_LMS_TEACHERS.slice(0, 26);
  const teachersPage2 = SEPTEMBER_2026_LMS_TEACHERS.slice(26);

  // Split administrative ratings into 2 columns (14 each) for clean A3 Landscape layout
  const adminRatingsCol1 = ADMINISTRATIVE_RATINGS_LIST.slice(0, 14);
  const adminRatingsCol2 = ADMINISTRATIVE_RATINGS_LIST.slice(14);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>التقرير التقييمي الشامل لنظام قطر للتعليم (A3 Landscape) - ${monthName} ${academicYear}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:wght@700&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A3 landscape;
            margin: 8mm 12mm 8mm 12mm;
          }

          body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #ffffff;
            color: #1E293B;
            direction: rtl;
            font-size: 11px;
            line-height: 1.4;
          }

          .page-break {
            page-break-before: always;
            break-before: page;
            padding-top: 6px;
          }

          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Official Header */
          .official-header {
            display: flex;
            justifyContent: space-between;
            align-items: center;
            border-bottom: 2.5px solid #0F2044;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }

          .header-logo {
            width: 140px;
            height: 60px;
            object-fit: contain;
          }

          .header-center {
            text-align: center;
            flex: 1;
            padding: 0 15px;
          }

          .header-center .country {
            font-size: 13px;
            font-weight: 800;
            color: #8A1538;
          }

          .header-center .school {
            font-size: 15px;
            font-weight: 900;
            color: #0F2044;
            margin: 1px 0;
          }

          .header-center .doc-title {
            display: inline-block;
            background: #0F2044;
            color: #ffffff;
            font-size: 14px;
            font-weight: 900;
            padding: 4px 18px;
            border-radius: 6px;
            margin-top: 3px;
          }

          .header-center .doc-sub {
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            margin-top: 2px;
          }

          /* Section Titles */
          .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 900;
            color: #0F2044;
            background: #F1F5F9;
            padding: 6px 12px;
            border-radius: 6px;
            border-right: 5px solid #00B4D8;
            margin: 8px 0 6px;
          }

          /* KPI Grid */
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-bottom: 10px;
          }

          .kpi-card {
            background: #F8FAFC;
            border: 1px solid #CBD5E1;
            border-radius: 8px;
            padding: 8px 12px;
            text-align: center;
            border-top: 3.5px solid #0F2044;
          }

          .kpi-label {
            font-size: 11px;
            font-weight: 800;
            color: #64748B;
          }

          .kpi-value {
            font-size: 22px;
            font-weight: 900;
            color: #0F2044;
            margin: 2px 0;
          }

          .kpi-sub {
            font-size: 10px;
            font-weight: 700;
            color: #0284C7;
          }

          /* Charts Container */
          .charts-row {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 12px;
            margin-bottom: 8px;
          }

          .chart-box {
            background: #ffffff;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 14px;
          }

          .chart-title {
            font-size: 12px;
            font-weight: 800;
            color: #0F2044;
            margin-bottom: 6px;
            border-bottom: 1px dashed #CBD5E1;
            padding-bottom: 4px;
          }

          /* Custom SVG Bar item */
          .bar-item {
            margin-bottom: 5px;
          }
          .bar-header {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .bar-track {
            background: #E2E8F0;
            border-radius: 4px;
            height: 8px;
            overflow: hidden;
          }
          .bar-fill {
            height: 100%;
            border-radius: 4px;
          }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 8px;
          }

          thead {
            display: table-header-group;
          }

          tr {
            page-break-inside: avoid;
          }

          th {
            background-color: #0F2044 !important;
            background: #0F2044 !important;
            color: #ffffff !important;
            font-weight: 800;
            padding: 6px 8px;
            text-align: right;
            border: 1px solid #0F2044;
            font-size: 10.5px;
            white-space: nowrap;
          }

          th * {
            color: #ffffff !important;
          }

          td {
            padding: 4.5px 7px;
            border: 1px solid #E2E8F0;
            color: #334155;
          }

          tr:nth-child(even) {
            background: #F8FAFC;
          }

          .text-center { text-align: center; }
          .font-bold { font-weight: 800; }
          .text-navy { color: #0F2044; }
          .text-green { color: #047857; }
          .text-blue { color: #1E40AF; }
          .text-amber { color: #B45309; }

          .badge-gold {
            background: #FEF3C7;
            color: #92400E;
            padding: 2px 7px;
            border-radius: 4px;
            font-weight: 800;
            font-size: 9.5px;
            display: inline-block;
          }

          .badge-excellent {
            background: #DCFCE7;
            color: #166534;
            padding: 2px 7px;
            border-radius: 4px;
            font-weight: 800;
            font-size: 9.5px;
            display: inline-block;
          }

          .badge-verygood {
            background: #E0F2FE;
            color: #075985;
            padding: 2px 7px;
            border-radius: 4px;
            font-weight: 800;
            font-size: 9.5px;
            display: inline-block;
          }

          /* Signatures Footer */
          .report-footer {
            margin-top: 14px;
            padding-top: 10px;
            border-top: 2px solid #E2E8F0;
            display: flex;
            justify-content: space-around;
            align-items: center;
          }

          .sig-box {
            text-align: center;
            width: 250px;
          }

          .sig-title {
            font-weight: 800;
            font-size: 11.5px;
            color: #0F2044;
          }

          .sig-img-container {
            height: 55px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 4px 0;
          }

          .sig-img {
            max-height: 50px;
            max-width: 160px;
            object-fit: contain;
          }

          .sig-name {
            font-size: 12px;
            font-weight: 900;
            color: #1E293B;
          }


          /* Print controls */
          .print-bar {
            background: #0F2044;
            color: #fff;
            padding: 10px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 9999;
          }
          @media print {
            .print-bar { display: none !important; }
          }
        </style>
      </head>
      <body>
        <!-- Print Header Bar (Screen Only) -->
        <div class="print-bar">
          <div style="font-weight: 800; font-size: 14px;">
            📄 معاينة التقرير التقييمي الشامل لنظام قطر للتعليم — تنسيق A3 Landscape (${monthName} ${academicYear})
          </div>
          <div>
            <button onclick="window.print()" style="background: #00B4D8; color: #0F2044; border: none; padding: 7px 22px; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 13px;">
              🖨️ طباعة الآن (Save as PDF - A3 Landscape)
            </button>
            <button onclick="window.close()" style="background: rgba(255,255,255,0.2); color: #fff; border: none; padding: 7px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; margin-right: 10px;">
              ✕ إغلاق
            </button>
          </div>
        </div>

        <div style="padding: 6px 10px;">
          <!-- ══════════════════════════════════════════════════════════
               PAGE 1: الغلاف والملخص التنفيذي والإحصاءات العامة (A3 Landscape)
          ══════════════════════════════════════════════════════════ -->
          <div class="avoid-break">
            <!-- Official Header -->
            <div class="official-header">
              <img class="header-logo" src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
              <div class="header-center">
                <div class="country">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
                <div class="school">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
                <div class="doc-title">التقرير التقييمي الشامل لنشاط وتفاعل نظام قطر للتعليم (QES)</div>
                <div class="doc-sub">تقييم ومتابعة شهر ${monthName} — العام الأكاديمي ${academicYear} م — تنسيق A3 عريض (Landscape)</div>
              </div>
              <img class="header-logo" src="/school-logo.png" alt="مدرسة قطر للعلوم والتكنولوجيا" />
            </div>

            <!-- Executive Summary KPI Cards -->
            <div class="kpi-grid">
              <div class="kpi-card" style="border-top-color: #3B82F6;">
                <div class="kpi-label">نطاق الكادر الأكاديمي والنشط</div>
                <div class="kpi-value">42 <span style="font-size: 12px; color: #64748B;">/ 63</span></div>
                <div class="kpi-sub">26 بالتقييمات + 42 بالدروس (100% نشاط)</div>
              </div>
              <div class="kpi-card" style="border-top-color: #10B981;">
                <div class="kpi-label">تحليل الشعب والمواد الدراسية</div>
                <div class="kpi-value" style="color: #047857;">19 <span style="font-size: 12px; color: #64748B;">شعبة</span></div>
                <div class="kpi-sub">5 صفوف (7، 9، 10، 11، 12) · 18 مادة</div>
              </div>
              <div class="kpi-card" style="border-top-color: #8B5CF6;">
                <div class="kpi-label">إجمالي تسليمات التقييمات</div>
                <div class="kpi-value" style="color: #6D28D9;">2,440</div>
                <div class="kpi-sub">1,921 مصححاً (78.7%) + 519 قيد الانتظار</div>
              </div>
              <div class="kpi-card" style="border-top-color: #00B4D8;">
                <div class="kpi-label">نسبة حل التقييمات العامة</div>
                <div class="kpi-value" style="color: #0284C7;">66.7%</div>
                <div class="kpi-sub">249 تقييماً مسنداً للطلبة (100% نسبة إسناد)</div>
              </div>
              <div class="kpi-card" style="border-top-color: #F59E0B;">
                <div class="kpi-label">إجمالي الدروس المفعلة</div>
                <div class="kpi-value" style="color: #B45309;">1,460</div>
                <div class="kpi-sub">796 ظاهراً (54.5%) · 99% مستوفية للأقسام</div>
              </div>
            </div>

            <!-- Charts Section -->
            <div class="charts-row">
              <!-- Department Performance Bar Chart -->
              <div class="chart-box">
                <div class="chart-title">📊 ترتيب الأقسام الأكاديمية حسب المؤشر العام المركب (100) — شهر ${monthName}</div>
                ${DEPARTMENT_PERFORMANCE_LIST.filter(d => d.index !== null).map(d => `
                  <div class="bar-item">
                    <div class="bar-header">
                      <span>${d.department}</span>
                      <span class="font-bold text-navy">${d.index?.toFixed(2)}%</span>
                    </div>
                    <div class="bar-track">
                      <div class="bar-fill" style="width: ${d.index}%; background: ${d.index! >= 75 ? '#047857' : d.index! >= 60 ? '#0284C7' : '#F59E0B'};"></div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Grade Level Stats -->
              <div class="chart-box">
                <div class="chart-title">🏫 تغطية التقييمات والدروس حسب الصفوف الدراسية وتوجيهات الأداء</div>
                ${GRADE_LEVEL_LMS_STATS.map(g => `
                  <div style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dotted #E2E8F0;">
                    <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 11px; margin-bottom: 3px;">
                      <span class="text-navy">${g.grade}</span>
                      <span style="color: #64748B;">التقييمات: <b>${g.evalPercent}%</b> | الدروس: <b>${g.lessonsPercent}%</b></span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                      <div>
                        <div class="bar-track" style="height: 7px;">
                          <div class="bar-fill" style="width: ${g.evalPercent}%; background: #8B5CF6;"></div>
                        </div>
                      </div>
                      <div>
                        <div class="bar-track" style="height: 7px;">
                          <div class="bar-fill" style="width: ${g.lessonsPercent}%; background: #10B981;"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}

                <div style="margin-top: 10px; font-size: 10px; color: #475569; line-height: 1.45; background: #F8FAFC; padding: 6px 10px; border-radius: 6px; border-right: 3px solid #0F2044;">
                  📌 <b>توجيه إدارة المدرسة:</b> الصفان 11 و 12 لديهما مقررات تخصصية ومنصات تدريبية رديفة (مختبرات التصنيع الرقمي، محاكاة الطاقة، ومشاريع التخرج البحثية)، وقد اعتُمد التقدير الإداري الداعم لمنسوبيها.
                </div>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════════
               PAGE 2: لوحة الشرف الذهبية وفرسان الأقسام (A3 Landscape)
          ══════════════════════════════════════════════════════════ -->
          <div class="page-break avoid-break">
            <div class="section-title">
              <span>🥇</span> لوحة الشرف الذهبية — أفضل عشرة معلمين متميزين على مستوى مدرسة قطر للعلوم والتكنولوجيا (${monthName} ${academicYear})
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 55px;" class="text-center">المركز</th>
                  <th style="width: 210px;">اسم المعلم</th>
                  <th style="width: 170px;">القسم الأكاديمي</th>
                  <th class="text-center" style="width: 110px;">المؤشر العام (100)</th>
                  <th class="text-center" style="width: 110px;">مؤشر التقييمات</th>
                  <th class="text-center" style="width: 110px;">مؤشر الدروس</th>
                  <th class="text-center" style="width: 75px;">السجلات</th>
                  <th style="width: 140px;">حالة الاعتماد</th>
                  <th>أبرز مؤشرات الإنجاز والتميز الأكاديمي</th>
                </tr>
              </thead>
              <tbody>
                ${TOP_10_INDEX_TEACHERS.map(t => `
                  <tr>
                    <td class="text-center font-bold">
                      ${t.rank === 1 ? '🥇 الأول' : t.rank === 2 ? '🥈 الثاني' : t.rank === 3 ? '🥉 الثالث' : t.rank}
                    </td>
                    <td class="font-bold text-navy" style="font-size: 11px;">${t.name}</td>
                    <td>${t.department}</td>
                    <td class="text-center font-bold text-green" style="font-size: 11.5px;">${t.generalIndex.toFixed(2)}%</td>
                    <td class="text-center font-bold text-blue">${t.evalIndex.toFixed(2)}%</td>
                    <td class="text-center font-bold" style="color: #6B21A8;">${t.lessonsIndex.toFixed(2)}%</td>
                    <td class="text-center">${t.sectionsCount}</td>
                    <td><span class="badge-gold">${t.adminRating === 'لا يوجد تعديل إداري' ? 'اعتماد رقمي مباشر' : t.adminRating}</span></td>
                    <td style="font-size: 9.5px; color: #475569;">
                      ${t.rank === 1 ? 'تصحيح 100% (122 تسليماً) واستيفاء 100% للدروس (66/66) وحل 84.7%' :
                        t.rank === 2 ? 'تغطية تقييمات كاملة 100% لـ 4 شعب وتصحيح 100% واستيفاء كامل للدروس' :
                        t.rank === 3 ? 'تغطية 100% للدروس والتقييمات وتصحيح 88 تسليماً بنسبة 93.6%' :
                        t.rank === 4 ? 'تغطية تقييمات 100% لـ 4 شعب وتصحيح 100% واستيفاء كامل للدروس' :
                        'تميز في مؤشرات الرفع والمتابعة والتفاعل الإيجابي مع منصة قطر للتعليم'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="section-title" style="margin-top: 14px;">
              <span>🏛️</span> فرسان الأقسام الأكاديمية (أفضل معلم متميز من كل قسم أكاديمي — 10 معلمين)
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 45px;" class="text-center">م</th>
                  <th style="width: 170px;">القسم الأكاديمي</th>
                  <th style="width: 220px;">فارس القسم المكرم</th>
                  <th class="text-center" style="width: 90px;">المعدل</th>
                  <th>أبرز إنجازات وتفاصيل التميز لشهر ${monthName}</th>
                </tr>
              </thead>
              <tbody>
                ${deptChampions.map((d: any) => `
                  <tr>
                    <td class="text-center font-bold">${d.rank}</td>
                    <td class="font-bold text-navy">${d.department}</td>
                    <td class="font-bold" style="color: #0284C7; font-size: 11px;">${d.teacherName}</td>
                    <td class="text-center font-bold text-green" style="font-size: 11.5px;">${d.score.toFixed(1)}%</td>
                    <td style="font-size: 10px; color: #334155;">${d.achievement}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- ══════════════════════════════════════════════════════════
               PAGE 3: المرصد التشخيصي الأكاديمي — تحليل الشعب والمواد الدراسية (A3 Landscape)
          ══════════════════════════════════════════════════════════ -->
          <div class="page-break avoid-break">
            <div class="section-title">
              <span>🏫</span> المرصد التشخيصي الأكاديمي الشامل: تحليل الشعب الدراسية الـ 19 والمواد الـ 18 (${monthName} ${academicYear})
            </div>

            <!-- 2-Column: 19 Sections Table + 18 Subjects Table & Action Plan -->
            <div style="display: grid; grid-template-columns: 1.28fr 0.95fr; gap: 12px; margin-bottom: 8px;">
              
              <!-- Column 1: 19 Sections Table -->
              <div>
                <div style="font-weight: 800; font-size: 11px; color: #0F2044; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                  <span>📋 كشف ترتيب ومؤشرات أداء الشعب الدراسية الـ 19:</span>
                  <span style="background: #DCFCE7; color: #166534; padding: 1px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 800;">
                    أفضل 5 شعب: 9/1 (89%) · 7/1 (84.4%) · 10/4 (84%) · 11/4 (81.3%) · 11/2 (80.8%)
                  </span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 28px;" class="text-center">#</th>
                      <th style="width: 52px;">الشعبة</th>
                      <th style="width: 52px;">الصف</th>
                      <th class="text-center" style="width: 38px;">الطلاب</th>
                      <th class="text-center" style="width: 48px;">التقييمات</th>
                      <th class="text-center" style="width: 50px;">التسليمات</th>
                      <th class="text-center" style="width: 52px;">نسبة الحل</th>
                      <th class="text-center" style="width: 52px;">التصحيح</th>
                      <th class="text-center" style="width: 40px;">معلق</th>
                      <th>المادة الأضعف حلًا</th>
                      <th class="text-center" style="width: 58px;">ظهور الدروس</th>
                      <th class="text-center" style="width: 65px;">التصنيف</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${SECTIONS_LMS_STATS.map(s => `
                      <tr>
                        <td class="text-center font-bold">${s.rank}</td>
                        <td class="font-bold text-navy" style="font-size: 10px;">شعبة ${s.section}</td>
                        <td style="font-size: 9px; color: #475569;">${s.grade}</td>
                        <td class="text-center font-bold">${s.studentsCount}</td>
                        <td class="text-center">${s.evalCount}</td>
                        <td class="text-center font-bold text-blue">${s.submissions}</td>
                        <td class="text-center font-bold" style="color: ${s.solveRate >= 80 ? '#166534' : s.solveRate >= 65 ? '#1E40AF' : s.solveRate >= 50 ? '#B45309' : '#DC2626'};">
                          ${s.solveRate}%
                        </td>
                        <td class="text-center font-bold">${s.gradingRate}%</td>
                        <td class="text-center font-bold" style="color: ${s.ungraded > 0 ? '#DC2626' : '#16A34A'};">${s.ungraded > 0 ? s.ungraded : '0 ✓'}</td>
                        <td style="font-size: 8.5px; color: #475569;">${s.weakestEvalSubject}</td>
                        <td class="text-center font-bold" style="font-size: 9px;">${s.lessonVisiblePercent}%</td>
                        <td class="text-center">
                          <span class="${s.evalClass === 'متميزة' ? 'badge-excellent' : s.evalClass === 'جيدة' ? 'badge-verygood' : s.evalClass === 'مقبولة' ? 'badge-gold' : 'badge-gold'}" style="font-size: 8.5px; padding: 1px 5px; ${s.evalClass === 'تحتاج تحسين' ? 'background: #FEE2E2; color: #991B1B;' : ''}">
                            ${s.evalClass}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Column 2: 18 Subjects & Grade 12 Intervention Plan -->
              <div>
                <div style="font-weight: 800; font-size: 11px; color: #0F2044; margin-bottom: 4px;">
                  📚 كشف مؤشرات المواد الدراسية الـ 18 على المنصة:
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 25px;" class="text-center">م</th>
                      <th>المادة الدراسية</th>
                      <th class="text-center" style="width: 36px;">الكادر</th>
                      <th class="text-center" style="width: 42px;">التقييمات</th>
                      <th class="text-center" style="width: 48px;">التسليمات</th>
                      <th class="text-center" style="width: 52px;">نسبة الحل</th>
                      <th class="text-center" style="width: 52px;">التصحيح</th>
                      <th class="text-center" style="width: 38px;">معلق</th>
                      <th class="text-center" style="width: 55px;">ظهور الدروس</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${SUBJECTS_LMS_STATS.map((sub, i) => `
                      <tr>
                        <td class="text-center font-bold">${i + 1}</td>
                        <td class="font-bold text-navy" style="font-size: 9.5px;">${sub.name}</td>
                        <td class="text-center">${sub.teachersCount}</td>
                        <td class="text-center">${sub.evalsCount}</td>
                        <td class="text-center font-bold text-blue">${sub.submissions}</td>
                        <td class="text-center font-bold" style="color: ${sub.solveRate >= 80 ? '#166534' : sub.solveRate >= 65 ? '#1E40AF' : '#DC2626'}; font-size: 9.5px;">${sub.solveRate}%</td>
                        <td class="text-center font-bold">${sub.gradingRate}%</td>
                        <td class="text-center font-bold" style="color: ${sub.ungraded > 0 ? '#DC2626' : '#16A34A'};">${sub.ungraded > 0 ? sub.ungraded : '0 ✓'}</td>
                        <td class="text-center font-bold" style="font-size: 9px;">${sub.lessonVisibilityRate}%</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <!-- Grade 12 Intervention & Diagnostic Plan -->
                <div style="background: #FFF5F5; border: 1.5px solid #FCA5A5; border-radius: 8px; padding: 7px 10px; margin-top: 6px;">
                  <div style="font-weight: 900; font-size: 10.5px; color: #991B1B; margin-bottom: 3px; display: flex; justify-content: space-between;">
                    <span>🚨 خطة التدخل والتوجيه الأكاديمي لشعب الصف الثاني عشر (12/1 - 12/5):</span>
                    <span>نسبة الحل: 43.3% | المعلق: 78</span>
                  </div>
                  <div style="font-size: 9px; color: #7F1D1D; line-height: 1.45;">
                    • <b>تشخيص الأداء:</b> سجل الصف الثاني عشر 141 تسليماً فقط بنسبة حل 43.3% ونسبة تصحيح 44.7%، واختفاء 293 درساً (63.6% خفية).<br/>
                    • <b>الإجراءات المعتمدة:</b> (1) إرسال رسائل SMS فورية لأولياء أمور الطلبة المتأخرين عبر نظام E-Learning SMS. (2) إلزام معلمي مواد التربية الإسلامية والفيزياء بتصفير المتأخرات فوراً. (3) إظهار الدروس الخفية لدعم تحصيل الطلبة.
                  </div>
                </div>

              </div>

            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════════
               PAGE 4: ترتيب الأقسام الأكاديمية والتقديرات الإدارية (A3 Landscape)
          ══════════════════════════════════════════════════════════ -->
          <div class="page-break avoid-break">
            <div class="section-title">
              <span>📈</span> التقرير المقارن للأقسام الأكاديمية ونسب الرفع والتصحيح (${monthName} ${academicYear})
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 40px;" class="text-center">م</th>
                  <th>القسم الأكاديمي</th>
                  <th class="text-center">المؤشر العام</th>
                  <th class="text-center">تغطية التقييمات</th>
                  <th class="text-center">تغطية الدروس</th>
                  <th class="text-center">السجلات</th>
                  <th class="text-center">كادر القسم (بيانات / نطاق)</th>
                  <th class="text-center">الدروس المرفوعة (الحصة)</th>
                  <th class="text-center">التقييمات المرفوعة (الحصة)</th>
                  <th>المعلم المتصدر بالقسم</th>
                </tr>
              </thead>
              <tbody>
                ${DEPARTMENT_PERFORMANCE_LIST.map((d, i) => `
                  <tr>
                    <td class="text-center font-bold">${i + 1}</td>
                    <td class="font-bold text-navy">${d.department}</td>
                    <td class="text-center font-bold ${d.index ? 'text-green' : ''}">${d.index ? d.index.toFixed(2) + '%' : 'غير متاح'}</td>
                    <td class="text-center">${d.evalCoverage} (${d.evalRatio})</td>
                    <td class="text-center">${d.lessonsCoverage} (${d.lessonsRatio})</td>
                    <td class="text-center font-bold">${d.recordsCount}</td>
                    <td class="text-center">${d.teachersRatio}</td>
                    <td class="text-center">${d.lessonsCount} (${d.lessonsShare})</td>
                    <td class="text-center">${d.evalsCount} (${d.evalsShare})</td>
                    <td style="font-size: 10px; font-weight: 700; color: #0284C7;">${d.topTeacher || '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="section-title" style="margin-top: 12px;">
              <span>🎖️</span> قائمة التقديرات الإدارية المعتمدة رسمياً بتوجيه إدارة المدرسة (28 معلماً)
            </div>

            <!-- 2-Column Administrative Ratings Layout for A3 Landscape -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 35px;" class="text-center">م</th>
                      <th style="width: 150px;">اسم المعلم</th>
                      <th style="width: 110px;">القسم</th>
                      <th class="text-center" style="width: 65px;">التقدير</th>
                      <th>مبررات ومستندات الاعتماد الإداري</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${adminRatingsCol1.map((a, i) => `
                      <tr>
                        <td class="text-center font-bold">${i + 1}</td>
                        <td class="font-bold text-navy">${a.name}</td>
                        <td style="font-size: 9.5px;">${a.department}</td>
                        <td class="text-center">
                          <span class="${a.rating === 'ممتاز' ? 'badge-excellent' : 'badge-verygood'}">${a.rating}</span>
                        </td>
                        <td style="font-size: 9px; color: #475569;">${a.basis}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 35px;" class="text-center">م</th>
                      <th style="width: 150px;">اسم المعلم</th>
                      <th style="width: 110px;">القسم</th>
                      <th class="text-center" style="width: 65px;">التقدير</th>
                      <th>مبررات ومستندات الاعتماد الإداري</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${adminRatingsCol2.map((a, i) => `
                      <tr>
                        <td class="text-center font-bold">${i + 15}</td>
                        <td class="font-bold text-navy">${a.name}</td>
                        <td style="font-size: 9.5px;">${a.department}</td>
                        <td class="text-center">
                          <span class="${a.rating === 'ممتاز' ? 'badge-excellent' : 'badge-verygood'}">${a.rating}</span>
                        </td>
                        <td style="font-size: 9px; color: #475569;">${a.basis}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════════
               PAGE 5: أولويات المتابعة الميدانية والتدخل الأكاديمي (A3 Landscape 2x2 Grid)
          ══════════════════════════════════════════════════════════ -->
          <div class="page-break avoid-break">
            <div class="section-title" style="border-right-color: #EF4444;">
              <span>⚠️</span> أولويات المتابعة الميدانية والتدخل الأكاديمي الفوري (${monthName} ${academicYear})
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 6px;">
              <!-- Box 1: Pending Submissions -->
              <div>
                <div style="font-weight: 800; font-size: 11.5px; color: #991B1B; margin-bottom: 4px;">
                  1. التسليمات غير المصححة (أعلى 6 معلمين لديهم 199 تسليماً معلقاً من أصل 244):
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>اسم المعلم</th>
                      <th>القسم</th>
                      <th class="text-center">المستلمة</th>
                      <th class="text-center">المصححة</th>
                      <th class="text-center" style="color: #EF4444;">المعلقة</th>
                      <th class="text-center">النسبة</th>
                      <th>التوجيه</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${FOLLOWUP_PENDING_TEACHERS.map(t => `
                      <tr>
                        <td class="font-bold text-navy">${t.name}</td>
                        <td style="font-size: 9.5px;">${t.department}</td>
                        <td class="text-center">${t.submissionsReceived}</td>
                        <td class="text-center">${t.submissionsGraded}</td>
                        <td class="text-center font-bold" style="color: #DC2626;">${t.submissionsPending}</td>
                        <td class="text-center font-bold">${t.gradingRate.toFixed(1)}%</td>
                        <td style="font-size: 9px; color: #7F1D1D;">إنهاء رصد الدرجات</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Box 2: Partial Coverage -->
              <div>
                <div style="font-weight: 800; font-size: 11.5px; color: #B45309; margin-bottom: 4px;">
                  2. المعلمون ذوو التغطية الجزئية للتقييمات (9 معلمين):
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>اسم المعلم</th>
                      <th>القسم</th>
                      <th class="text-center">السجلات المغطاة</th>
                      <th class="text-center">النسبة</th>
                      <th>السجلات والشعب المتبقية</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${FOLLOWUP_PARTIAL_TEACHERS.map(t => `
                      <tr>
                        <td class="font-bold text-navy">${t.name}</td>
                        <td style="font-size: 9.5px;">${t.department}</td>
                        <td class="text-center">${t.evalCoverageRatio}</td>
                        <td class="text-center font-bold text-amber">${t.evalCoveragePercent.toFixed(1)}%</td>
                        <td style="font-size: 9px; color: #475569;">${t.missingEvalRecords}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Box 3: Unassigned Evaluations -->
              <div>
                <div style="font-weight: 800; font-size: 11.5px; color: #0284C7; margin-bottom: 4px;">
                  3. تقييمات مرفوعة وغير مسندة للطلاب (23 تقييماً لدى 5 معلمين):
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>اسم المعلم</th>
                      <th>القسم الأكاديمي</th>
                      <th class="text-center">تقييمات غير مسندة</th>
                      <th>المواد والشعب المتأثرة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${UNASSIGNED_EVAL_TEACHERS.map(t => `
                      <tr>
                        <td class="font-bold text-navy">${t.name}</td>
                        <td style="font-size: 9.5px;">${t.department}</td>
                        <td class="text-center font-bold" style="color: #0284C7;">${t.evalUnassigned} تقييمات</td>
                        <td style="font-size: 9px; color: #475569;">${t.subjectsAndSections}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Box 4: Zero Lessons Records -->
              <div>
                <div style="font-weight: 800; font-size: 11.5px; color: #475569; margin-bottom: 4px;">
                  4. مواد وشعب بلا دروس مرفوعة (33 سجلاً لدى 7 معلمين):
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>اسم المعلم</th>
                      <th>القسم الأكاديمي</th>
                      <th class="text-center">سجلات بلا دروس</th>
                      <th>التفاصيل والمواد المتبقية</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ZERO_LESSON_TEACHERS.map(t => `
                      <tr>
                        <td class="font-bold text-navy">${t.name}</td>
                        <td style="font-size: 9.5px;">${t.department}</td>
                        <td class="text-center font-bold" style="color: #DC2626;">${t.sectionsCount} سجلات</td>
                        <td style="font-size: 9px; color: #475569;">${t.missingLessonRecords}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════════
               PAGE 6: الكشف الشامل لكادر المعلمين - الجزء الأول (1 إلى 26) (A3 Landscape)
          ══════════════════════════════════════════════════════════ -->
          <div class="page-break avoid-break">
            <div class="section-title">
              <span>👥</span> الكشف التقييمي الشامل لكادر المعلمين (الجزء الأول: المعلمون من 1 إلى 26)
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 30px;" class="text-center">م</th>
                  <th style="width: 170px;">اسم المعلم</th>
                  <th style="width: 130px;">القسم الأكاديمي</th>
                  <th class="text-center" style="width: 60px;">الشعب</th>
                  <th class="text-center" style="width: 85px;">الدروس (مستوفى/مرفوع)</th>
                  <th class="text-center" style="width: 85px;">التقييمات (مغطى/مسجل)</th>
                  <th class="text-center" style="width: 90px;">التسليمات (مصحح/مستلم)</th>
                  <th class="text-center" style="width: 70px;">نسبة التصحيح</th>
                  <th class="text-center" style="width: 65px;">نسبة الحل</th>
                  <th class="text-center" style="width: 75px;">المؤشر العام</th>
                  <th class="text-center" style="width: 85px;">التقدير الإداري</th>
                  <th>الملاحظات والتوصيات الأكاديمية المعتمدة</th>
                </tr>
              </thead>
              <tbody>
                ${teachersPage1.map((t, idx) => `
                  <tr>
                    <td class="text-center font-bold">${idx + 1}</td>
                    <td class="font-bold text-navy">${t.name}</td>
                    <td>${t.department}</td>
                    <td class="text-center">${t.sectionsCount}</td>
                    <td class="text-center">${t.lessonsValid} / ${t.lessonsUploaded}</td>
                    <td class="text-center">${t.evalCoverageRatio}</td>
                    <td class="text-center">${t.submissionsGraded} / ${t.submissionsReceived}</td>
                    <td class="text-center font-bold">${t.gradingRate.toFixed(1)}%</td>
                    <td class="text-center">${t.solveRate.toFixed(1)}%</td>
                    <td class="text-center font-bold ${t.generalIndex ? 'text-green' : ''}">${t.generalIndex ? t.generalIndex.toFixed(1) + '%' : '—'}</td>
                    <td class="text-center">
                      <span class="${t.adminRating === 'ممتاز' ? 'badge-excellent' : t.adminRating === 'جيد جداً' ? 'badge-verygood' : ''}">${t.adminRating || 'معتمد'}</span>
                    </td>
                    <td style="font-size: 9px; color: #475569;">${t.notes}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- ══════════════════════════════════════════════════════════
               PAGE 6: الكشف الشامل لكادر المعلمين - الجزء الثاني (27 إلى 52) + التوقيعات (A3 Landscape)
          ══════════════════════════════════════════════════════════ -->
          <div class="page-break avoid-break">
            <div class="section-title">
              <span>👥</span> الكشف التقييمي الشامل لكادر المعلمين (الجزء الثاني: المعلمون من 27 إلى 52)
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 30px;" class="text-center">م</th>
                  <th style="width: 170px;">اسم المعلم</th>
                  <th style="width: 130px;">القسم الأكاديمي</th>
                  <th class="text-center" style="width: 60px;">الشعب</th>
                  <th class="text-center" style="width: 85px;">الدروس (مستوفى/مرفوع)</th>
                  <th class="text-center" style="width: 85px;">التقييمات (مغطى/مسجل)</th>
                  <th class="text-center" style="width: 90px;">التسليمات (مصحح/مستلم)</th>
                  <th class="text-center" style="width: 70px;">نسبة التصحيح</th>
                  <th class="text-center" style="width: 65px;">نسبة الحل</th>
                  <th class="text-center" style="width: 75px;">المؤشر العام</th>
                  <th class="text-center" style="width: 85px;">التقدير الإداري</th>
                  <th>الملاحظات والتوصيات الأكاديمية المعتمدة</th>
                </tr>
              </thead>
              <tbody>
                ${teachersPage2.map((t, idx) => `
                  <tr>
                    <td class="text-center font-bold">${idx + 27}</td>
                    <td class="font-bold text-navy">${t.name}</td>
                    <td>${t.department}</td>
                    <td class="text-center">${t.sectionsCount}</td>
                    <td class="text-center">${t.lessonsValid} / ${t.lessonsUploaded}</td>
                    <td class="text-center">${t.evalCoverageRatio}</td>
                    <td class="text-center">${t.submissionsGraded} / ${t.submissionsReceived}</td>
                    <td class="text-center font-bold">${t.gradingRate.toFixed(1)}%</td>
                    <td class="text-center">${t.solveRate.toFixed(1)}%</td>
                    <td class="text-center font-bold ${t.generalIndex ? 'text-green' : ''}">${t.generalIndex ? t.generalIndex.toFixed(1) + '%' : '—'}</td>
                    <td class="text-center">
                      <span class="${t.adminRating === 'ممتاز' ? 'badge-excellent' : t.adminRating === 'جيد جداً' ? 'badge-verygood' : ''}">${t.adminRating || 'معتمد'}</span>
                    </td>
                    <td style="font-size: 9px; color: #475569;">${t.notes}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Signatures Section -->
            <div class="avoid-break report-footer">
              <div class="sig-box">
                <div class="sig-title">منسق المشاريع والتعليم الإلكتروني</div>
                <div class="sig-name">م. أحمد عادل طبيشات</div>
                <div class="sig-img-container">
                  <img class="sig-img" src="/signature-ahmad.png" alt="توقيع م. أحمد طبيشات" />
                </div>
              </div>

              <div class="sig-box">
                <div class="sig-title">نائب المدير للشؤون الأكاديمية</div>
                <div class="sig-name">د. راني التوم</div>
                <div class="sig-img-container">
                  <img class="sig-img" src="/signature-rani.png" alt="توقيع د. راني التوم" />
                </div>
              </div>

              <div class="sig-box">
                <div class="sig-title">مدير المدرسة</div>
                <div class="sig-name">محمد علي مندني العمادي</div>
                <div class="sig-img-container">
                  <img class="sig-img" src="/principal-signature.png" alt="توقيع مدير المدرسة" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
