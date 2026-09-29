// =============================================================================
// محرك طباعة التقارير الرسمية للتطوير الذاتي (Self Development Print Engine)
// مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين - قسم التعليم الإلكتروني والحلول الرقمية
// خاص بالشهادات المهنية والدورات التخصصية لمنسق المشاريع: م. أحمد عادل طبيشات
// =============================================================================

import {
  SelfDevelopmentRecord,
  SELF_DEV_CATEGORIES,
  SELF_DEV_STATUS_CONFIG,
  calculateSelfDevelopmentStats,
} from './selfDevelopmentData';

interface PrintReportOptions {
  title?: string;
  subtitle?: string;
  academicYear?: string;
  filterLabel?: string;
  reportDate?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. تقرير رسمي شامل لسجل التطوير الذاتي لمنسق المشاريع (Comprehensive Report)
// ─────────────────────────────────────────────────────────────────────────────
export function printComprehensiveSelfDevelopmentReport(
  records: SelfDevelopmentRecord[],
  options: PrintReportOptions | string = {}
): void {
  if (typeof window === 'undefined') return;

  const opts: PrintReportOptions = typeof options === 'string' ? { academicYear: options } : options;
  const academicYear = opts.academicYear || '2026-2027';
  const reportDate =
    opts.reportDate ||
    new Date().toLocaleDateString('ar-QA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const stats = calculateSelfDevelopmentStats(records);

  const rowsHtml = records
    .map((rec, idx) => {
      const statusCfg = SELF_DEV_STATUS_CONFIG[rec.status] || {
        label: rec.status,
        color: '#059669',
        bgColor: '#D1FAE5',
      };

      const categoryCfg = SELF_DEV_CATEGORIES.find(c => c.category === rec.category) || {
        color: '#0F2044',
        bgColor: '#EFF6FF',
      };

      return `
      <tr>
        <td class="text-center bold">${idx + 1}</td>
        <td>
          <div class="cert-title">${rec.title}</div>
          ${rec.titleEn ? `<div class="cert-title-en">${rec.titleEn}</div>` : ''}
        </td>
        <td>
          <div class="issuer-badge">${rec.issuer}</div>
        </td>
        <td>
          <span class="category-chip" style="color: ${categoryCfg.color}; background-color: ${categoryCfg.bgColor};">
            ${rec.category}
          </span>
        </td>
        <td class="text-center bold text-primary" style="font-size: 13px;">${rec.hours} س</td>
        <td class="text-center font-mono">${rec.issueDate}</td>
        <td class="text-center font-mono text-muted" style="font-size: 11px;">
          ${rec.credentialId || '—'}
        </td>
        <td class="text-center">
          <span class="status-chip" style="color: ${statusCfg.color}; background-color: ${statusCfg.bgColor};">
            ${statusCfg.label}
          </span>
        </td>
        <td class="impact-cell">
          ${rec.impactOnWork || '—'}
        </td>
      </tr>
    `;
    })
    .join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>سجل التطوير الذاتي والشهادات المهنية - م. أحمد عادل طبيشات</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Alexandria:wght@400;600;700;800;900&display=swap');

          @page {
            size: A4 landscape;
            margin: 0;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            margin: 0;
            padding: 10mm 12mm;
            font-family: 'Tajawal', sans-serif;
            background: #fff;
            color: #0F172A;
            font-size: 11.5px;
            line-height: 1.45;
            direction: rtl;
          }

          .report-container {
            width: 100%;
            max-width: 297mm;
            margin: 0 auto;
          }

          /* Header */
          .official-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2.5px solid #0F2044;
            padding-bottom: 12px;
            margin-bottom: 12px;
          }

          .header-logo {
            height: 65px;
            max-width: 190px;
            object-fit: contain;
          }

          .header-text {
            text-align: center;
            flex: 1;
            padding: 0 15px;
          }

          .gov-title {
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            margin: 0 0 3px;
          }

          .school-title {
            font-size: 14px;
            font-weight: 900;
            color: #0F2044;
            margin: 0 0 4px;
          }

          .report-main-title {
            font-family: 'Alexandria', sans-serif;
            font-size: 16px;
            font-weight: 900;
            color: #0284C7;
            margin: 0 0 3px;
          }

          .report-subtitle {
            font-size: 11.5px;
            color: #334155;
            font-weight: 700;
          }

          /* Coordinator Bio Banner */
          .coordinator-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, #0F2044 0%, #1e3a8a 100%);
            color: #fff;
            padding: 10px 18px;
            border-radius: 10px;
            margin-bottom: 12px;
          }

          .coord-info-main {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .coord-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: #0284C7;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 900;
          }

          .coord-name {
            font-size: 15px;
            font-weight: 900;
            margin: 0;
            color: #fff;
          }

          .coord-role {
            font-size: 11px;
            color: #93C5FD;
            font-weight: 700;
            margin: 2px 0 0;
          }

          .coord-meta {
            display: flex;
            gap: 14px;
            font-size: 11px;
            color: #E2E8F0;
            font-weight: 700;
          }

          .coord-meta span {
            background: rgba(255, 255, 255, 0.12);
            padding: 4px 10px;
            border-radius: 6px;
          }

          /* KPI Stats Grid */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin-bottom: 14px;
          }

          .stat-card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 8px 10px;
            text-align: center;
          }

          .stat-val {
            font-size: 19px;
            font-weight: 900;
            color: #0F2044;
            line-height: 1.1;
          }

          .stat-lbl {
            font-size: 9.5px;
            color: #64748B;
            font-weight: 800;
            margin-top: 3px;
          }

          /* Table */
          table.report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 10.5px;
          }

          table.report-table th {
            background: #0F2044;
            color: #fff;
            padding: 7px 6px;
            font-weight: 800;
            text-align: right;
            border: 1px solid #0F2044;
            white-space: nowrap;
          }

          table.report-table td {
            padding: 6px 7px;
            border: 1px solid #CBD5E1;
            vertical-align: middle;
          }

          table.report-table tr:nth-child(even) {
            background-color: #F8FAFC;
          }

          .cert-title {
            font-weight: 800;
            color: #0F2044;
            font-size: 11px;
          }

          .cert-title-en {
            font-size: 9px;
            color: #64748B;
            direction: ltr;
            text-align: right;
          }

          .issuer-badge {
            font-weight: 800;
            color: #1E293B;
            font-size: 10.5px;
          }

          .category-chip {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 9.5px;
            font-weight: 800;
            white-space: nowrap;
          }

          .status-chip {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 9.5px;
            font-weight: 800;
            white-space: nowrap;
          }

          .impact-cell {
            font-size: 9.5px;
            color: #334155;
            line-height: 1.35;
            max-width: 250px;
          }

          .text-center { text-align: center !important; }
          .bold { font-weight: 800; }
          .font-mono { font-family: monospace; }
          .text-primary { color: #0284C7; }
          .text-muted { color: #64748B; }

          /* Signatures */
          .signatures-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 18px;
            padding-top: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .sig-box {
            text-align: center;
            width: 260px;
          }

          .sig-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #0F2044;
            margin-bottom: 2px;
          }

          .sig-name {
            font-size: 12.5px;
            font-weight: 900;
            color: #0284C7;
            margin-bottom: 2px;
          }

          .sig-img-container {
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .sig-img {
            max-height: 48px;
            max-width: 170px;
            object-fit: contain;
          }

          .report-footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #64748B;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- Official Letterhead -->
          <div class="official-header">
            <img src="/ministry-logo.png" alt="شعار الوزارة" class="header-logo" />
            <div class="header-text">
              <div class="gov-title">دولة قطر — وزارة التربية والتعليم والتعليم العالي</div>
              <div class="school-title">مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</div>
              <div class="report-main-title">سجل التطوير الذاتي والشهادات المهنية المعتمدة</div>
              <div class="report-subtitle">
                قسم المشاريع الإلكترونية والحلول الرقمية — العام الأكاديمي ${academicYear}م
              </div>
            </div>
            <img src="/school-logo.png" alt="شعار المدرسة" class="header-logo" />
          </div>

          <!-- Coordinator Bio -->
          <div class="coordinator-banner">
            <div class="coord-info-main">
              <div class="coord-avatar">👨‍💻</div>
              <div>
                <h3 class="coord-name">م. أحمد عادل عبده طبيشات</h3>
                <div class="coord-role">منسق المشاريع والحلول الرقمية والتعليم الإلكتروني — خبير مايكروسوفت MIEE</div>
              </div>
            </div>
            <div class="coord-meta">
              <span>العام: ${academicYear}</span>
              <span>تاريخ التقرير: ${reportDate}</span>
              <span>الحالة: معتمد رسمياً</span>
            </div>
          </div>

          <!-- KPI Summary -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-val" style="color: #0284C7;">${stats.totalCertificates}</div>
              <div class="stat-lbl">إجمالي الشهادات والدورات</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #059669;">${stats.totalHours}</div>
              <div class="stat-lbl">ساعة تدريب وتطوير ذاتي</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #7C3AED;">${stats.uniqueCategoriesCount}</div>
              <div class="stat-lbl">مجالات تخصصية دقيقة</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #D97706;">${stats.uniqueIssuersCount}</div>
              <div class="stat-lbl">جهات اعتماد دولية ووطنية</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #0F2044;">${stats.averageHoursPerCert} س</div>
              <div class="stat-lbl">متوسط ساعات الاعتماد الواحد</div>
            </div>
          </div>

          <!-- Table of Records -->
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 28px;" class="text-center">#</th>
                <th>اسم الشهادة / البرنامج التدريبي التخصصي</th>
                <th style="width: 140px;">الجهة المانحة</th>
                <th style="width: 130px;">المجال التخصصي</th>
                <th style="width: 50px;" class="text-center">الساعات</th>
                <th style="width: 80px;" class="text-center">تاريخ الإنجاز</th>
                <th style="width: 110px;" class="text-center">رقم الاعتماد</th>
                <th style="width: 90px;" class="text-center">الحالة</th>
                <th style="width: 240px;">الأثر والتطبيق العملي في المدرسة</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <!-- Official Signatures -->
          <div class="signatures-section">
            <div class="sig-box">
              <div class="sig-title">إعداد واعتماد</div>
              <div class="sig-name">م. أحمد عادل طبيشات</div>
              <div style="font-size: 10px; color: #475569; font-weight: 700;">منسق المشاريع والحلول الرقمية</div>
              <div class="sig-img-container">
                <img src="/signature-ahmad.png" alt="توقيع م. أحمد عادل طبيشات" class="sig-img" />
              </div>
            </div>

            <div class="sig-box" style="text-align: center;">
              <div style="font-size: 11px; font-weight: 800; color: #64748B; margin-bottom: 4px;">ختم المدرسة والاعتماد الرسمي</div>
              <div style="width: 75px; height: 75px; border: 2px dashed #0284C7; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #0284C7; font-size: 9px; font-weight: 900; line-height: 1.2;">
                مدرسة قطر<br/>للعلوم والتكنولوجيا<br/>★ معتمد ★
              </div>
            </div>

            <div class="sig-box">
              <div class="sig-title">يعتمد، مدير المدرسة</div>
              <div class="sig-name">محمد علي مندني العمادي</div>
              <div style="font-size: 10px; color: #475569; font-weight: 700;">مدير مدرسة قطر للعلوم والتكنولوجيا</div>
              <div class="sig-img-container">
                <img src="/principal-signature.png" alt="توقيع مدير المدرسة" class="sig-img" />
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="report-footer">
            <span>نظام إدارة الجودة والتعليم الإلكتروني — مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</span>
            <span>طبع بتاريخ: ${reportDate}</span>
            <span>وثيقة رسمية معتمدة محفوظة سحابياً</span>
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
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. طباعة بطاقة اعتماد / شهادة إنجاز فردية لدورة أو شهادة محددة
// ─────────────────────────────────────────────────────────────────────────────
export function printSingleSelfDevelopmentCard(record: SelfDevelopmentRecord): void {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة الشهادة.');
    return;
  }

  const categoryCfg = SELF_DEV_CATEGORIES.find(c => c.category === record.category) || {
    color: '#0284C7',
    bgColor: '#E0F2FE',
  };

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>شهادة اعتماد مهني - ${record.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Alexandria:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap');
          @page { size: A4 landscape; margin: 0; }
          body {
            margin: 0;
            padding: 15mm;
            font-family: 'Tajawal', sans-serif;
            background: #f1f5f9;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            box-sizing: border-box;
          }
          .cert-frame {
            width: 267mm;
            height: 180mm;
            background: #fff;
            border: 4px solid #0F2044;
            border-radius: 12px;
            padding: 20px 30px;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
          }
          .cert-frame::before {
            content: '';
            position: absolute;
            top: 6px; left: 6px; right: 6px; bottom: 6px;
            border: 1.5px solid #0284C7;
            border-radius: 8px;
            pointer-events: none;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.5px solid #E2E8F0;
            padding-bottom: 10px;
          }
          .header img { height: 60px; max-width: 180px; object-fit: contain; }
          .header-center { text-align: center; }
          .header-center h2 { margin: 0; font-size: 15px; color: #0F2044; font-weight: 900; }
          .header-center p { margin: 2px 0 0; font-size: 11px; color: #64748B; font-weight: 700; }
          .body {
            text-align: center;
            margin: auto 0;
            padding: 10px 0;
          }
          .title-tag {
            display: inline-block;
            background: #EFF6FF;
            color: #0284C7;
            padding: 4px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            margin-bottom: 10px;
          }
          .coord-name {
            font-family: 'Amiri', serif;
            font-size: 30px;
            font-weight: 700;
            color: #0F2044;
            margin: 6px 0;
          }
          .cert-name {
            font-size: 20px;
            font-weight: 900;
            color: #0284C7;
            margin: 8px 0;
          }
          .cert-details {
            font-size: 12.5px;
            color: #334155;
            max-width: 780px;
            margin: 10px auto;
            line-height: 1.6;
          }
          .badges-row {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-top: 10px;
          }
          .badge {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 800;
            color: #0F2044;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1.5px solid #E2E8F0;
            padding-top: 8px;
          }
          .sig-box { text-align: center; width: 200px; }
          .sig-box .name { font-weight: 900; color: #0F2044; font-size: 12px; }
          .sig-box .role { font-size: 10px; color: #64748B; font-weight: 700; }
          .sig-img { max-height: 42px; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div class="cert-frame">
          <div class="header">
            <img src="/ministry-logo.png" alt="وزارة التربية والتعليم والتعليم العالي" />
            <div class="header-center">
              <h2>دولة قطر — مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين</h2>
              <p>سجل الشهادات المهنية والتطوير الذاتي لمنسق المشاريع</p>
            </div>
            <img src="/school-logo.png" alt="شعار المدرسة" />
          </div>

          <div class="body">
            <div class="title-tag">إفادة اعتماد مهني وتطوير ذاتي مستمر</div>
            <div style="font-size: 13px; color: #64748B; font-weight: 700;">تشهد إدارة المدرسة بأن الزميل الفاضل:</div>
            <div class="coord-name">م. أحمد عادل عبده طبيشات</div>
            <div style="font-size: 11.5px; color: #0284C7; font-weight: 800;">منسق المشاريع الإلكترونية والحلول الرقمية</div>
            <div style="font-size: 13px; color: #475569; margin-top: 8px;">قد اجتاز بنجاح متطلبات الاعتماد وحصل على:</div>
            <div class="cert-name">${record.title}</div>
            ${record.titleEn ? `<div style="font-size: 11px; color: #64748B; direction: ltr;">${record.titleEn}</div>` : ''}
            <div class="cert-details">
              الصادرة من <strong>${record.issuer}</strong> في مجال <strong>${record.category}</strong>، بواقع <strong>${record.hours} ساعة تدريبية معتمدة</strong>، والموثقة برقم الاعتماد (${record.credentialId || 'معتمد'}).
            </div>
            <div class="badges-row">
              <span class="badge">📅 تاريخ الإنجاز: ${record.issueDate}</span>
              <span class="badge">⏱️ الساعات: ${record.hours} ساعة</span>
              <span class="badge">🏛️ العام الأكاديمي: ${record.academicYear}</span>
              <span class="badge" style="color: ${categoryCfg.color}; background: ${categoryCfg.bgColor};">🏷️ ${record.category}</span>
            </div>
          </div>

          <div class="footer">
            <div class="sig-box">
              <div class="name">م. أحمد عادل طبيشات</div>
              <div class="role">منسق المشاريع والحلول الرقمية</div>
              <img src="/signature-ahmad.png" alt="التوقيع" class="sig-img" />
            </div>
            <div style="text-align: center; font-size: 9.5px; color: #64748B;">
              <div>رقم الاعتماد: ${record.credentialId || 'QSTSS-SDEV-2026'}</div>
              <div>تم إصدار هذه الإفادة الرسمية من نظام إدارة الجودة المدرسية</div>
            </div>
            <div class="sig-box">
              <div class="name">محمد علي مندني العمادي</div>
              <div class="role">مدير المدرسة</div>
              <img src="/principal-signature.png" alt="التوقيع" class="sig-img" />
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
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
