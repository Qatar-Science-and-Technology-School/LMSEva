'use client';

import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  X,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
  BadgeCheck,
  Zap,
  Building2,
  FileText,
  UserCheck
} from 'lucide-react';
import type { Workshop, IndividualPDRecord } from '@/lib/pdData';
import * as XLSX from 'xlsx';

// ─── 1. تقرير ورش التطوير المهني الجماعية الشهري ──────────────────────────────
export interface MonthlyWorkshopsReportProps {
  workshops: Workshop[];
  allWorkshops?: Workshop[];
  selectedMonth: string;
  selectedYear: string;
  teachers?: any[];
  departments?: any[];
  onClose: () => void;
}

export function MonthlyWorkshopsReport({
  workshops,
  selectedMonth,
  selectedYear,
  onClose
}: MonthlyWorkshopsReportProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Statistics
  const totalWorkshops = workshops.length;
  const totalHours = workshops.reduce((acc, w) => acc + (parseFloat(w.hours) || 0), 0);
  const totalAttendance = workshops.reduce((acc, w) => acc + (w.attendanceCount || (w.attendees ? w.attendees.length : 0) || 0), 0);
  const documentedCount = workshops.filter(w => w.status === 'موثق' || w.status === 'تم التنفيذ' || w.status === 'مكتمل مع تقرير').length;
  const docRate = totalWorkshops > 0 ? Math.round((documentedCount / totalWorkshops) * 100) : 100;
  const uniqueTrainers = Array.from(new Set(workshops.map(w => w.facilitatorName || w.trainer || '').filter(Boolean)));

  const monthLabel = selectedMonth === 'all' ? 'كافة أشهر العام' : `شهر ${selectedMonth}`;

  // Export to Excel
  const handleExportExcel = () => {
    const data = workshops.map((w, idx) => ({
      '#': idx + 1,
      'رقم الورشة': w.workshopNumber || idx + 1,
      'اسم الورشة': w.titleAr || w.nameAr,
      'الاسم بالإنجليزية': w.titleEn || w.nameEn || '',
      'العام الدراسي': w.academicYear,
      'الشهر': w.month,
      'التاريخ': w.date,
      'المدرب': w.facilitatorName || w.trainer,
      'الجهة المنظمة': w.organizerName || w.entity || '',
      'الفئة المستهدفة': w.targetAudience || w.targetGroup,
      'عدد الساعات': w.hours,
      'القاعة / المقر': w.venue || w.location || 'مقر المدرسة',
      'عدد الحضور': w.attendanceCount || (w.attendees ? w.attendees.length : 0),
      'التصنيف': w.category,
      'الحالة': w.status,
      'الأهداف والمخرجات': w.procedure || w.objectives || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ورش التطوير الجماعي');
    XLSX.writeFile(wb, `تقرير_ورش_التطوير_الجماعية_${selectedMonth}_${selectedYear}.xlsx`);
  };

  // Export to PDF
  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const el = document.getElementById('monthly-workshops-printable-sheet');
      if (!el) {
        window.print();
        return;
      }
      if (document.fonts) await document.fonts.ready;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const imgWidth = 280;
      const pageHeight = 195;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 8;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 8;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      pdf.save(`تقرير_ورش_التطوير_الجماعية_${selectedMonth}_${selectedYear}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div style={{ direction: 'rtl', background: '#F1F5F9', minHeight: '100vh', padding: '1.5rem', fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif" }}>
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 landscape;
          margin: 8mm;
        }
        @media print {
          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .monthly-printable-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}} />

      {/* Action Toolbar */}
      <div className="no-print" style={{
        maxWidth: '1150px',
        margin: '0 auto 1.5rem',
        background: '#0F2044',
        color: '#fff',
        borderRadius: '16px',
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 24px rgba(15,32,68,0.2)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            📑
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>
              معاينة التقرير الرسمي المعتمد لورش التطوير المهني الجماعية
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
              {monthLabel} — العام الأكاديمي {selectedYear} (جاهز للطباعة والتصدير المباشر)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px',
              fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(2,132,199,0.3)'
            }}
          >
            <Printer size={16} /> طباعة التقرير فوراً
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              background: '#10B981', color: '#fff', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '10px',
              fontWeight: 800, fontSize: '0.88rem', cursor: isGeneratingPdf ? 'wait' : 'pointer'
            }}
          >
            <Download size={16} /> {isGeneratingPdf ? 'جارٍ التحميل...' : 'تصدير PDF'}
          </button>

          <button
            onClick={handleExportExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              background: '#fff', color: '#0F2044', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '10px',
              fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={16} color="#059669" /> تصدير Excel
          </button>

          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '0.65rem 1rem', borderRadius: '10px',
              fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer'
            }}
          >
            <X size={16} /> إغلاق
          </button>
        </div>
      </div>

      {/* Main Printable Sheet */}
      <div
        id="monthly-workshops-printable-sheet"
        className="monthly-printable-container"
        style={{
          maxWidth: '1150px',
          margin: '0 auto',
          background: '#fff',
          borderRadius: '20px',
          padding: '2.5rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
          border: '1px solid #E2E8F0',
          boxSizing: 'border-box'
        }}
      >
        {/* Official Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #0F2044', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Right Logo (Ministry) */}
          <div style={{ textAlign: 'right' }}>
            <img
              src="/ministry-logo.png"
              alt="وزارة التربية والتعليم والتعليم العالي"
              style={{ height: '78px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>

          {/* Center Text */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044' }}>دولة قـطـر</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569' }}>وزارة التربية والتعليم والتعليم العالي</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F2044', marginTop: '2px' }}>
              مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#00B4D8', marginTop: '2px' }}>
              قسم تكنولوجيا المعلومات والتعليم الإلكتروني والتمكين الرقمي
            </div>
          </div>

          {/* Left Logo (School) */}
          <div style={{ textAlign: 'left' }}>
            <img
              src="/school-logo.png"
              alt="مدرسة قطر للعلوم والتكنولوجيا"
              style={{ height: '78px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Report Title Ribbon */}
        <div style={{
          background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900 }}>
              تقرير ورش التطوير المهني الجماعية والتمكين الرقمي
            </h2>
            <div style={{ fontSize: '0.88rem', color: '#93C5FD', fontWeight: 700, marginTop: '3px' }}>
              الفترة المعتمدة: {monthLabel} — العام الأكاديمي {selectedYear}
            </div>
          </div>

          <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.85rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>تاريخ استخراج التقرير:</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{new Date().toLocaleDateString('ar-QA')}</div>
          </div>
        </div>

        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800 }}>إجمالي الورش</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F2044', marginTop: '2px' }}>{totalWorkshops}</div>
            <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>ورشة عمل</div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800 }}>إجمالي الساعات</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>{totalHours}</div>
            <div style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 700 }}>ساعة تدريبية</div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800 }}>إجمالي الحضور</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>{totalAttendance}</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>مشارك / مستفيد</div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800 }}>نسبة التوثيق</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>{docRate}%</div>
            <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 700 }}>اعتماد وتوثيق كامل</div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800 }}>المدربون والخبراء</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#7C3AED', marginTop: '2px' }}>{uniqueTrainers.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 700 }}>مدرب وجهة</div>
          </div>
        </div>

        {/* Detailed Workshops Table */}
        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                <th style={{ padding: '0.75rem 0.5rem', border: '1px solid #0F2044', fontWeight: 900, textAlign: 'center', width: '35px' }}>#</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900 }}>عنوان ورشة العمل والبرنامج</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900 }}>المدرب / الجهة المنظمة</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900, textAlign: 'center' }}>التاريخ والقاعة</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900, textAlign: 'center' }}>المستهدفون</th>
                <th style={{ padding: '0.75rem 0.5rem', border: '1px solid #0F2044', fontWeight: 900, textAlign: 'center' }}>الساعات</th>
                <th style={{ padding: '0.75rem 0.5rem', border: '1px solid #0F2044', fontWeight: 900, textAlign: 'center' }}>الحضور</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900, textAlign: 'center' }}>حالة التوثيق</th>
              </tr>
            </thead>
            <tbody>
              {workshops.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                    لا توجد ورش عمل جماعية مسجلة في {monthLabel} للعام {selectedYear}.
                  </td>
                </tr>
              ) : (
                workshops.map((w, idx) => {
                  const attendeesCount = w.attendanceCount || (w.attendees ? w.attendees.length : 0);
                  const isDocumented = w.status === 'موثق' || w.status === 'تم التنفيذ' || w.status === 'مكتمل مع تقرير';
                  return (
                    <tr
                      key={w.id || idx}
                      style={{
                        background: idx % 2 === 0 ? '#ffffff' : '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0'
                      }}
                    >
                      <td style={{ padding: '0.7rem 0.5rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800, color: '#475569' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 800, color: '#0F2044', fontSize: '0.86rem' }}>
                          {w.titleAr || w.nameAr}
                        </div>
                        {(w.titleEn || w.nameEn) && (
                          <div style={{ fontSize: '0.72rem', color: '#64748B', direction: 'ltr', textAlign: 'right', fontStyle: 'italic' }}>
                            {w.titleEn || w.nameEn}
                          </div>
                        )}
                        <div style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 700, marginTop: '2px' }}>
                          التصنيف: {w.category || 'تطوير مهني'}
                        </div>
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 800, color: '#0F2044' }}>{w.facilitatorName || w.trainer || 'أ. أحمد طبيشات'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{w.organizerName || w.entity || 'قسم التعليم الإلكتروني'}</div>
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700 }}>{w.date || w.month}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{w.venue || w.location || 'مقر المدرسة'}</div>
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 700 }}>
                        {w.targetAudience || w.targetGroup || 'المعلمين'}
                      </td>
                      <td style={{ padding: '0.7rem 0.5rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800, color: '#0284C7' }}>
                        {w.hours} س
                      </td>
                      <td style={{ padding: '0.7rem 0.5rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800, color: '#10B981' }}>
                        {attendeesCount > 0 ? attendeesCount : '—'}
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <span style={{
                          background: isDocumented ? '#D1FAE5' : '#FEF3C7',
                          color: isDocumented ? '#065F46' : '#92400E',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'inline-block'
                        }}>
                          {isDocumented ? '✓ معتمد وموثق' : w.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Official Signatures Block */}
        <div style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '2px dashed #CBD5E1',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
          textAlign: 'center'
        }}>
          {/* Coordinator */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>إعداد وتوثيق</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', margin: '4px 0 2px' }}>
              م. أحمد عادل طبيشات
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>منسق المشاريع الإلكترونية والتمكين الرقمي</div>
            <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
              <img
                src="/signature-ahmad.png"
                alt="توقيع م. أحمد طبيشات"
                style={{ height: '36px', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
          </div>

          {/* Academic Vice Principal */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>مراجعة وتدقيق</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', margin: '4px 0 2px' }}>
              أ. راني التميمي
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>النائب الأكاديمي</div>
            <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700 }}>معتمد أكاديمياً</span>
            </div>
          </div>

          {/* Principal */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>اعتماد مدير المدرسة</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', margin: '4px 0 2px' }}>
              أ. محمد علي مندني العمادي
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>مدير المدرسة</div>
            <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
              <img
                src="/principal-signature.png"
                alt="توقيع مدير المدرسة"
                style={{ height: '38px', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.7rem', color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
          هذا التقرير وثيقة رسمية معتمدة ومستخرجة من النظام الإلكتروني لمتابعة التمكين الرقمي والتطوير المهني بمدرسة قطر للعلوم والتكنولوجيا.
        </div>
      </div>
    </div>
  );
}

// ─── 2. تقرير جلسات التطوير الفردي للمعلمين الشهري ──────────────────────────────
export interface MonthlyIndividualReportProps {
  records: IndividualPDRecord[];
  allRecords?: IndividualPDRecord[];
  selectedMonth: string;
  selectedYear: string;
  teachers?: any[];
  departments?: any[];
  onClose: () => void;
}

export function MonthlyIndividualReport({
  records,
  selectedMonth,
  selectedYear,
  onClose
}: MonthlyIndividualReportProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Statistics
  const totalSessions = records.length;
  const uniqueTeachers = Array.from(new Set(records.map(r => r.traineeNameAr).filter(Boolean)));
  const uniqueDepts = Array.from(new Set(records.map(r => r.department).filter(Boolean)));
  const totalMinutes = records.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const signedCount = records.filter(r => r.signatureStatus === 'تم التوقيع').length;
  const signedRate = totalSessions > 0 ? Math.round((signedCount / totalSessions) * 100) : 100;

  const monthLabel = selectedMonth === 'all' ? 'كافة أشهر العام' : `شهر ${selectedMonth}`;

  // Export to Excel
  const handleExportExcel = () => {
    const data = records.map((r, idx) => ({
      '#': idx + 1,
      'كود الجلسة': r.id,
      'العام الدراسي': r.academicYear,
      'الشهر': r.month,
      'تاريخ التدريب': r.trainingDate,
      'اسم المعلم المستفيد': r.traineeNameAr,
      'القسم الأكاديمي': r.department,
      'المهارة المقدمة': r.skillProvided,
      'تصنيف المهارة': r.skillCategory,
      'المدرب': r.trainerName,
      'دور المدرب': r.trainerRole,
      'نوع التدريب': r.trainingType,
      'طريقة التنفيذ': r.deliveryMethod,
      'المدة (بالدقائق)': r.durationMinutes,
      'حالة التوقيع': r.signatureStatus,
      'مصدر البيانات': r.sourceType
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التطوير الفردي للمعلمين');
    XLSX.writeFile(wb, `تقرير_التطوير_الفردي_${selectedMonth}_${selectedYear}.xlsx`);
  };

  // Export to PDF
  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const el = document.getElementById('monthly-individual-printable-sheet');
      if (!el) {
        window.print();
        return;
      }
      if (document.fonts) await document.fonts.ready;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const imgWidth = 280;
      const pageHeight = 195;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 8;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 8;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
      pdf.save(`تقرير_التطوير_الفردي_${selectedMonth}_${selectedYear}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div style={{ direction: 'rtl', background: '#F1F5F9', minHeight: '100vh', padding: '1.5rem', fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif" }}>
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 landscape;
          margin: 8mm;
        }
        @media print {
          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .monthly-printable-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}} />

      {/* Action Toolbar */}
      <div className="no-print" style={{
        maxWidth: '1150px',
        margin: '0 auto 1.5rem',
        background: '#0F2044',
        color: '#fff',
        borderRadius: '16px',
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 24px rgba(15,32,68,0.2)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,180,216,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            👤
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>
              معاينة التقرير الرسمي لجلسات التطوير والتمكين الفردي للمعلمين
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
              {monthLabel} — العام الأكاديمي {selectedYear} (مع كشف المهارات والإقرارات)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              background: 'linear-gradient(135deg, #00B4D8 0%, #0284C7 100%)',
              color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '10px',
              fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,180,216,0.3)'
            }}
          >
            <Printer size={16} /> طباعة التقرير فوراً
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              background: '#10B981', color: '#fff', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '10px',
              fontWeight: 800, fontSize: '0.88rem', cursor: isGeneratingPdf ? 'wait' : 'pointer'
            }}
          >
            <Download size={16} /> {isGeneratingPdf ? 'جارٍ التحميل...' : 'تصدير PDF'}
          </button>

          <button
            onClick={handleExportExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              background: '#fff', color: '#0F2044', border: 'none', padding: '0.65rem 1.15rem', borderRadius: '10px',
              fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={16} color="#059669" /> تصدير Excel
          </button>

          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '0.65rem 1rem', borderRadius: '10px',
              fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer'
            }}
          >
            <X size={16} /> إغلاق
          </button>
        </div>
      </div>

      {/* Main Printable Sheet */}
      <div
        id="monthly-individual-printable-sheet"
        className="monthly-printable-container"
        style={{
          maxWidth: '1150px',
          margin: '0 auto',
          background: '#fff',
          borderRadius: '20px',
          padding: '2.5rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
          border: '1px solid #E2E8F0',
          boxSizing: 'border-box'
        }}
      >
        {/* Official Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #0F2044', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Right Logo (Ministry) */}
          <div style={{ textAlign: 'right' }}>
            <img
              src="/ministry-logo.png"
              alt="وزارة التربية والتعليم والتعليم العالي"
              style={{ height: '78px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>

          {/* Center Text */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2044' }}>دولة قـطـر</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569' }}>وزارة التربية والتعليم والتعليم العالي</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F2044', marginTop: '2px' }}>
              مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#00B4D8', marginTop: '2px' }}>
              قسم تكنولوجيا المعلومات والتعليم الإلكتروني — الدعم الفردي والتمكين الرقمي
            </div>
          </div>

          {/* Left Logo (School) */}
          <div style={{ textAlign: 'left' }}>
            <img
              src="/school-logo.png"
              alt="مدرسة قطر للعلوم والتكنولوجيا"
              style={{ height: '78px', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Report Title Ribbon */}
        <div style={{
          background: 'linear-gradient(135deg, #0F2044 0%, #0369A1 100%)',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900 }}>
              تقرير جلسات التطوير المهني والدعم الفردي المباشر للمعلمين
            </h2>
            <div style={{ fontSize: '0.88rem', color: '#BAE6FD', fontWeight: 700, marginTop: '3px' }}>
              الفترة المعتمدة: {monthLabel} — العام الأكاديمي {selectedYear}
            </div>
          </div>

          <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.85rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>تاريخ استخراج التقرير:</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{new Date().toLocaleDateString('ar-QA')}</div>
          </div>
        </div>

        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800 }}>إجمالي الجلسات</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F2044', marginTop: '2px' }}>{totalSessions}</div>
            <div style={{ fontSize: '0.7rem', color: '#00B4D8', fontWeight: 700 }}>جلسة دعم فردي</div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800 }}>المعلمون المستفيدون</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>{uniqueTeachers.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>معلماً متميزاً</div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800 }}>إجمالي ساعات التدريب</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>{totalHours}</div>
            <div style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 700 }}>ساعة ({totalMinutes} دقيقة)</div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800 }}>الأقسام المغطاة</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#7C3AED', marginTop: '2px' }}>{uniqueDepts.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 700 }}>قسماً أكاديمياً</div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800 }}>نسبة التوقيع والإقرار</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>{signedRate}%</div>
            <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>إقرار المعلم المتدرب</div>
          </div>
        </div>

        {/* Detailed Sessions Table */}
        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                <th style={{ padding: '0.75rem 0.5rem', border: '1px solid #0F2044', fontWeight: 900, textAlign: 'center', width: '35px' }}>#</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900, textAlign: 'center' }}>التاريخ</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900 }}>اسم المعلم المستفيد</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900 }}>القسم الأكاديمي</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900 }}>المهارة والأداة المقدمة</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900 }}>التصنيف</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900 }}>المدرب المسؤول</th>
                <th style={{ padding: '0.75rem 0.5rem', border: '1px solid #0F2044', fontWeight: 900, textAlign: 'center' }}>المدة</th>
                <th style={{ padding: '0.75rem 0.6rem', border: '1px solid #0F2044', fontWeight: 900, textAlign: 'center' }}>الإقرار والتوقيع</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                    لا توجد جلسات تدريب فردي مسجلة في {monthLabel} للعام {selectedYear}.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  const isSigned = r.signatureStatus === 'تم التوقيع';
                  return (
                    <tr
                      key={r.id || idx}
                      style={{
                        background: idx % 2 === 0 ? '#ffffff' : '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0'
                      }}
                    >
                      <td style={{ padding: '0.7rem 0.5rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800, color: '#475569' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>
                        {r.trainingDate}
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 900, color: '#0F2044' }}>{r.traineeNameAr}</div>
                        {r.traineeNameEn && (
                          <div style={{ fontSize: '0.7rem', color: '#64748B', direction: 'ltr', textAlign: 'right' }}>{r.traineeNameEn}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0', fontWeight: 700, color: '#334155' }}>
                        {r.department}
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 800, color: '#00B4D8' }}>{r.skillProvided}</div>
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0' }}>
                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {r.skillCategory}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0', fontWeight: 700 }}>
                        {r.trainerName || 'أحمد طبيشات'}
                      </td>
                      <td style={{ padding: '0.7rem 0.5rem', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800, color: '#0284C7' }}>
                        {r.durationMinutes || 20} د
                      </td>
                      <td style={{ padding: '0.7rem 0.6rem', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <span style={{
                          background: isSigned ? '#D1FAE5' : '#FEE2E2',
                          color: isSigned ? '#065F46' : '#991B1B',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'inline-block'
                        }}>
                          {isSigned ? '✓ تم التوقيع' : 'بانتظار التوقيع'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Official Signatures Block */}
        <div style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '2px dashed #CBD5E1',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
          textAlign: 'center'
        }}>
          {/* Coordinator */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>إعداد وتوثيق</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', margin: '4px 0 2px' }}>
              م. أحمد عادل طبيشات
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>منسق المشاريع الإلكترونية والتمكين الرقمي</div>
            <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
              <img
                src="/signature-ahmad.png"
                alt="توقيع م. أحمد طبيشات"
                style={{ height: '36px', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
          </div>

          {/* Academic Vice Principal */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>مراجعة وتدقيق</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', margin: '4px 0 2px' }}>
              أ. راني التميمي
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>النائب الأكاديمي</div>
            <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 700 }}>معتمد أكاديمياً</span>
            </div>
          </div>

          {/* Principal */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>اعتماد مدير المدرسة</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F2044', margin: '4px 0 2px' }}>
              أ. محمد علي مندني العمادي
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>مدير المدرسة</div>
            <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
              <img
                src="/principal-signature.png"
                alt="توقيع مدير المدرسة"
                style={{ height: '38px', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.7rem', color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
          هذا التقرير وثيقة رسمية معتمدة ومستخرجة من النظام الإلكتروني لمتابعة التمكين الرقمي والتطوير المهني بمدرسة قطر للعلوم والتكنولوجيا.
        </div>
      </div>
    </div>
  );
}
