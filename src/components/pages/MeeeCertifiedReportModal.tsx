'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Award, FileText, Download, Printer, X, BadgeCheck, 
  Users, Target, TrendingUp, Calendar, Filter, CheckCircle2,
  Building2, Sparkles, ShieldCheck, FileCheck, RotateCw, Clock,
  BarChart3, PieChart as PieChartIcon, LayoutGrid, Layers, Type, CheckCircle
} from 'lucide-react';
import { 
  SCHOOL_NAME, ACADEMIC_YEARS, 
  type Teacher, type Department,
  getDepartmentStaffCount, getInstitutionalEvaluation,
  resolveTeacherDepartment 
} from '@/lib/data';
import {
  MINISTRY_LOGO_BASE64,
  SCHOOL_LOGO_BASE64,
  SIGNATURE_AHMAD_BASE64,
  SIGNATURE_RANI_BASE64
} from '@/lib/reportAssets';

interface MeeeRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  department: string;
  role?: string;
  status: 'تم التقديم' | 'حصل على الشهادة';
  applicationDate: string;
  certificationDate?: string;
  academicYear: string;
  notes?: string;
  updatedAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  meeeRecords: MeeeRecord[];
  meeeStats: any;
  teachers?: any[];
  departments?: any[];
  filterYear: string;
}

// Configurable font scales for tables
const FONT_SCALES = {
  normal: {
    name: 'عادي (11.5px - متناسق)',
    thFont: '0.72rem',
    tdFont: '0.70rem',
    badgeFont: '0.64rem',
    paddingY: '0.25rem',
    paddingX: '0.45rem',
    lineHeight: '1.32'
  },
  large: {
    name: 'مكبّر (12.5px - بارز)',
    thFont: '0.78rem',
    tdFont: '0.76rem',
    badgeFont: '0.70rem',
    paddingY: '0.32rem',
    paddingX: '0.52rem',
    lineHeight: '1.38'
  },
  compact: {
    name: 'مدمج (10.5px - موفر للمساحة)',
    thFont: '0.66rem',
    tdFont: '0.64rem',
    badgeFont: '0.60rem',
    paddingY: '0.18rem',
    paddingX: '0.35rem',
    lineHeight: '1.25'
  }
};

export default function MeeeCertifiedReportModal({
  isOpen,
  onClose,
  meeeRecords,
  meeeStats,
  teachers = [],
  departments = [],
  filterYear: initialFilterYear = 'all'
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(
    initialFilterYear !== 'all' ? initialFilterYear : '2026-2027'
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'certified_only' | 'all_records'>('certified_only');
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [activeReportTab, setActiveReportTab] = useState<'full' | 'single' | 'page1' | 'page2'>('full');
  const [tableFontSize, setTableFontSize] = useState<'normal' | 'large' | 'compact'>('normal');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Isolate print layout so ONLY the modal report is printed from (0,0) on Page 1
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('miee-printing-active');
    } else {
      document.body.classList.remove('miee-printing-active');
    }
    return () => {
      document.body.classList.remove('miee-printing-active');
    };
  }, [isOpen]);

  const fontScale = FONT_SCALES[tableFontSize] || FONT_SCALES.normal;
  const totalTeachersCount = selectedYear === '2026-2027' ? 65 : (meeeStats?.totalSchoolTeachers || 62);

  // Filter records by selected academic year
  const yearFilteredRecords = useMemo(() => {
    return meeeRecords.filter(r => selectedYear === 'all' || r.academicYear === selectedYear);
  }, [meeeRecords, selectedYear]);

  // Certified vs Applied
  const certifiedRecords = useMemo(() => {
    return yearFilteredRecords.filter(r => r.status === 'حصل على الشهادة');
  }, [yearFilteredRecords]);

  const appliedRecords = useMemo(() => {
    return yearFilteredRecords.filter(r => r.status === 'تم التقديم');
  }, [yearFilteredRecords]);

  const totalApplicantsInYear = yearFilteredRecords.length;

  const certRateFromAllTeachers = totalTeachersCount > 0 
    ? Math.round((certifiedRecords.length / totalTeachersCount) * 100) 
    : 0;

  const applicantSuccessRate = totalApplicantsInYear > 0 
    ? Math.round((certifiedRecords.length / totalApplicantsInYear) * 100) 
    : 100;

  // Department Breakdown
  const departmentBreakdown = useMemo(() => {
    const defaultDepts = [
      'التربية الإسلامية', 'البحث العلمي', 'مختبر الطاقة', 'الرياضيات',
      'اللغة الإنجليزية', 'اللغة العربية', 'إداري', 'STEM',
      'الحاسوب', 'مختبر التصنيع الرقمي'
    ];

    const allDepts = Array.from(new Set([
      ...defaultDepts,
      ...yearFilteredRecords.map(r => resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments)).filter(Boolean)
    ]));

    return allDepts.map(deptName => {
      const { count: deptTotal } = getDepartmentStaffCount(deptName, teachers, departments);

      const deptCert = certifiedRecords.filter(r => 
        resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments) === deptName
      ).length;
      const deptAppl = appliedRecords.filter(r => 
        resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments) === deptName
      ).length;

      const certifiedRate = deptTotal > 0 ? Math.round((deptCert / deptTotal) * 100) : 0;
      const evaluation = getInstitutionalEvaluation(certifiedRate, deptCert);

      return {
        name: deptName,
        deptTeachersCount: deptTotal,
        certified: deptCert,
        applied: deptAppl,
        certifiedRate: certifiedRate,
        evaluation: evaluation
      };
    }).sort((a, b) => {
      if (b.certifiedRate !== a.certifiedRate) {
        return b.certifiedRate - a.certifiedRate;
      }
      return b.certified - a.certified;
    });
  }, [yearFilteredRecords, certifiedRecords, appliedRecords, teachers, departments]);

  // Top Department
  const topDept = useMemo(() => {
    const list = departmentBreakdown.filter(d => d.certified > 0 && d.certifiedRate > 0);
    return list[0] || departmentBreakdown[0] || null;
  }, [departmentBreakdown]);

  // Displayed records based on scope
  const displayedTeachersRecords = useMemo(() => {
    if (scopeFilter === 'certified_only') {
      return certifiedRecords;
    }
    return [...certifiedRecords, ...appliedRecords];
  }, [scopeFilter, certifiedRecords, appliedRecords]);

  const page2FontScale = useMemo(() => {
    const count = displayedTeachersRecords.length;
    if (count > 25) {
      return {
        thFont: '0.62rem',
        tdFont: '0.60rem',
        badgeFont: '0.54rem',
        paddingY: '0.12rem',
        paddingX: '0.3rem',
        lineHeight: '1.2'
      };
    }
    if (count > 16) {
      return {
        thFont: '0.66rem',
        tdFont: '0.64rem',
        badgeFont: '0.58rem',
        paddingY: '0.16rem',
        paddingX: '0.35rem',
        lineHeight: '1.24'
      };
    }
    return fontScale;
  }, [displayedTeachersRecords.length, fontScale]);

  const currentDateStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('ar-QA', { year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  // High-Resolution PDF Download via jsPDF & html2canvas
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const isPort = pageOrientation === 'portrait';
      const targetWidth = isPort ? 800 : 1100;
      const pageWidth = isPort ? 210 : 297;
      const pageHeight = isPort ? 297 : 210;
      const margin = 10;
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - (margin * 2);

      const pdf = new jsPDF({
        orientation: isPort ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const renderSheet = async (sheetId: string) => {
        const el = document.getElementById(sheetId);
        if (!el) return null;

        return await html2canvas(el, {
          scale: 2.4,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: targetWidth + 40,
          onclone: (clonedDoc) => {
            const clonedEl = clonedDoc.getElementById(sheetId);
            if (clonedEl) {
              clonedEl.style.width = `${targetWidth}px`;
              clonedEl.style.maxWidth = `${targetWidth}px`;
              clonedEl.style.margin = '0 auto';
              clonedEl.style.boxShadow = 'none';
              clonedEl.style.borderRadius = '0';
              clonedEl.style.position = 'relative';
              clonedEl.style.overflow = 'hidden';
              clonedEl.style.boxSizing = 'border-box';

              const whiteElements = clonedEl.querySelectorAll('.text-white, .print-header-badge');
              whiteElements.forEach((wel: any) => {
                wel.style.color = '#ffffff';
                if (wel.style.setProperty) {
                  wel.style.setProperty('color', '#ffffff', 'important');
                  wel.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
                }
              });

              const images = clonedEl.querySelectorAll('img');
              images.forEach((img: any) => {
                img.style.display = 'block';
                img.style.visibility = 'visible';
                img.style.opacity = '1';
              });
            }
          }
        });
      };

      if (activeReportTab === 'single') {
        const canvasSingle = await renderSheet('miee-report-sheet-single');
        if (canvasSingle) {
          const imgData = canvasSingle.toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', margin, margin, availableWidth, availableHeight, undefined, 'FAST');
        }
      } else {
        const renderPage1 = activeReportTab === 'full' || activeReportTab === 'page1';
        const renderPage2 = activeReportTab === 'full' || activeReportTab === 'page2';

        if (renderPage1) {
          const canvas1 = await renderSheet('miee-report-sheet-page-1');
          if (canvas1) {
            const imgData1 = canvas1.toDataURL('image/png', 1.0);
            pdf.addImage(imgData1, 'PNG', margin, margin, availableWidth, availableHeight, undefined, 'FAST');
          }
        }

        if (renderPage1 && renderPage2) {
          pdf.addPage();
        }

        if (renderPage2) {
          const canvas2 = await renderSheet('miee-report-sheet-page-2');
          if (canvas2) {
            const imgData2 = canvas2.toDataURL('image/png', 1.0);
            pdf.addImage(imgData2, 'PNG', margin, margin, availableWidth, availableHeight, undefined, 'FAST');
          }
        }
      }

      pdf.save(`تقرير_معلمي_مايكروسوفت_المبدعين_الخبراء_MIEE_${selectedYear || '2026-2027'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF via html2canvas:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    document.body.classList.add('miee-printing-active');
    window.print();
  };

  if (!isOpen || !mounted) return null;

  const isPortrait = pageOrientation === 'portrait';
  const sheetWidth = isPortrait ? '800px' : '1100px';

  // Calculations for Bar Chart SVG
  const maxCertifiedCount = Math.max(1, ...departmentBreakdown.map(d => d.certified));

  // Calculations for Donut Chart SVG
  const circumference = 2 * Math.PI * 46;
  const certStroke = (certifiedRecords.length / totalTeachersCount) * circumference;
  const uncertStroke = circumference - certStroke;

  // Shared Common Official Header Component
  const renderOfficialHeader = (subtitleEn: string, pageNumberStr: string) => (
    <div className="print-avoid-break" style={{ marginBottom: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', gap: '1.25rem' }}>
        {/* Right: Ministry Logo */}
        <div style={{ textAlign: 'right', flexShrink: 0, width: '160px' }}>
          <img
            src="/ministry-logo.png"
            alt="وزارة التربية والتعليم والتعليم العالي"
            style={{ height: '75px', maxWidth: '160px', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {/* Center: Main Title Banner */}
        <div style={{ flex: 1, textAlign: 'center', padding: '0 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            background: '#0F2044',
            color: '#ffffff',
            padding: '0.45rem 1.4rem',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 3px 8px rgba(15, 32, 68, 0.15)',
            border: '1.5px solid #0F2044',
            display: 'inline-block',
            maxWidth: '96%'
          }}>
            <h1 className="text-white print-header-badge" style={{ margin: 0, fontSize: '0.94rem', fontWeight: 900, letterSpacing: 'normal', color: '#ffffff !important' }}>
              التقرير الرسمي للمعلمين الحاصلين على شهادة معلّم مايكروسوفت المبدع الخبير (MIEE)
            </h1>
            <p className="text-white print-header-badge" style={{ margin: '0.12rem 0 0 0', fontSize: '0.68rem', fontWeight: 700, opacity: 0.92, letterSpacing: 'normal', color: '#ffffff !important' }}>
              {subtitleEn}
            </p>
          </div>
        </div>

        {/* Left: School Logo */}
        <div style={{ textAlign: 'left', flexShrink: 0, width: '160px' }}>
          <img
            src="/school-logo.png"
            alt="مدرسة قطر للعلوم والتكنولوجيا"
            style={{ height: '75px', maxWidth: '160px', objectFit: 'contain', display: 'block', margin: '0 0 0 auto' }}
          />
        </div>
      </div>

      {/* Official Metadata Strip */}
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '5px',
        padding: '0.25rem 0.65rem',
        marginTop: '0.35rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.68rem',
        color: '#334155',
        fontWeight: 700
      }}>
        <div>العام الأكاديمي: <strong style={{ color: '#0F2044' }}>{selectedYear === 'all' ? 'جميع الأعوام' : selectedYear}</strong></div>
        <div style={{ color: '#CBD5E1' }}>•</div>
        <div>كادر المدرسة: <strong style={{ color: '#0F2044' }}>{totalTeachersCount} معلماً</strong></div>
        <div style={{ color: '#CBD5E1' }}>•</div>
        <div>إجمالي الحاصلين: <strong style={{ color: '#059669' }}>{certifiedRecords.length} معلماً</strong></div>
        <div style={{ color: '#CBD5E1' }}>•</div>
        <div>نسبة التغطية المدرسية: <strong style={{ color: '#0284C7' }}>%{certRateFromAllTeachers}</strong></div>
        <div style={{ color: '#CBD5E1' }}>•</div>
        <div>تاريخ الإصدار: <strong>{currentDateStr}</strong></div>
      </div>
    </div>
  );

  const modalContent = (
    <div id="miee-report-portal-root">
      <div 
        className="miee-report-modal-backdrop"
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(15, 32, 68, 0.88)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem',
          overflowY: 'auto', direction: 'rtl'
        }}
      >
        {/* Embedded Print CSS: 100% Isolated, Starts from Page 1 (0,0), Zero Background Leak */}
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: ${isPortrait ? 'A4 portrait' : 'A4 landscape'} !important;
            margin: 6mm !important;
          }
          @media print {
            /* 1. COMPLETELY HIDE EVERYTHING IN THE BODY EXCEPT THIS MODAL PORTAL */
            body.miee-printing-active > *:not(#miee-report-portal-root) {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              max-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
            }

            /* Extra safety: hide standard page containers */
            aside, header, footer, nav, .main-content-area, .no-print, button, .modal-close-btn {
              display: none !important;
            }

            /* 2. Reset html and body to pure white and start from top */
            html, body {
              width: 100% !important;
              height: auto !important;
              min-height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            #miee-report-portal-root {
              display: block !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              position: static !important;
            }

            .miee-report-modal-backdrop {
              position: static !important;
              inset: auto !important;
              background: transparent !important;
              backdrop-filter: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              display: block !important;
              overflow: visible !important;
            }

            .miee-sheets-container {
              display: block !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* 3. Printable Report Sheets */
            .printable-report-sheet {
              position: relative !important;
              inset: auto !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: ${isPortrait ? '287mm' : '198mm'} !important;
              height: ${isPortrait ? '287mm' : '198mm'} !important;
              margin: 0 auto !important;
              padding: 6mm 8mm !important;
              box-shadow: none !important;
              border: 1.5px solid #CBD5E1 !important;
              border-radius: 8px !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justifyContent: space-between !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            .sheet-page-1 {
              page-break-after: always !important;
              break-after: page !important;
            }

            .sheet-page-2, #miee-report-sheet-single {
              page-break-after: auto !important;
              break-after: auto !important;
            }

            .print-avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            .printable-report-sheet table {
              table-layout: fixed !important;
              width: 100% !important;
            }

            .printable-report-sheet th, .printable-report-sheet td {
              white-space: normal !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              word-break: normal !important;
            }

            .sheet-page-2 table td, .sheet-page-2 table th {
              padding: ${displayedTeachersRecords.length > 25 ? '1.5px 3.5px !important' : '2.5px 4.5px !important'};
              font-size: ${displayedTeachersRecords.length > 25 ? '0.58rem !important' : '0.64rem !important'};
              line-height: 1.2 !important;
            }

            .printable-report-sheet img {
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />

        {/* Top Floating Control Bar */}
        <div 
          className="no-print" 
          style={{
            background: '#ffffff', width: '100%', maxWidth: sheetWidth,
            padding: '0.85rem 1.4rem', borderRadius: '16px', marginBottom: '1rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0'
          }}
        >
          {/* Title & Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#10B981', color: '#fff', padding: '0.6rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              <Award size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900, color: '#0F2044' }}>
                التقرير الرسمي لشهادة معلّم مايكروسوفت المبدع الخبير (MIEE)
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
                تنسيق A4 ممتد لكامل الصفحة مع التفاف تلقائي للنصوص وترتيب متناسق للخطوط
              </p>
            </div>
          </div>

          {/* View Tabs Switcher */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.25rem', borderRadius: '12px', gap: '0.25rem' }}>
            <button
              onClick={() => setActiveReportTab('full')}
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '9px', border: 'none',
                background: activeReportTab === 'full' ? '#0F2044' : 'transparent',
                color: activeReportTab === 'full' ? '#ffffff' : '#64748B',
                fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}
            >
              <Layers size={14} /> التقرير الشامل (صفحتين A4)
            </button>
            <button
              onClick={() => setActiveReportTab('single')}
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '9px', border: 'none',
                background: activeReportTab === 'single' ? '#0F2044' : 'transparent',
                color: activeReportTab === 'single' ? '#ffffff' : '#64748B',
                fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}
            >
              <FileText size={14} /> صفحة واحدة A4 مدمجة
            </button>
            <button
              onClick={() => setActiveReportTab('page1')}
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '9px', border: 'none',
                background: activeReportTab === 'page1' ? '#0F2044' : 'transparent',
                color: activeReportTab === 'page1' ? '#ffffff' : '#64748B',
                fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}
            >
              <BarChart3 size={14} /> ص1: المؤشرات والرسوم
            </button>
            <button
              onClick={() => setActiveReportTab('page2')}
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '9px', border: 'none',
                background: activeReportTab === 'page2' ? '#0F2044' : 'transparent',
                color: activeReportTab === 'page2' ? '#ffffff' : '#64748B',
                fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}
            >
              <FileText size={14} /> ص2: كشف الأسماء والتواقيع
            </button>
          </div>

          {/* Filters and Actions */}
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Table Font Size Adjuster */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Type size={13} /> خط الجدول:
              </label>
              <select 
                value={tableFontSize} 
                onChange={(e: any) => setTableFontSize(e.target.value)}
                style={{
                  padding: '0.42rem 0.7rem', borderRadius: '9px', border: '1.5px solid #CBD5E1',
                  fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', outline: 'none', background: '#F8FAFC'
                }}
              >
                <option value="normal">عادي (11.5px - متناسق)</option>
                <option value="large">مكبّر (12.5px - بارز)</option>
                <option value="compact">مدمج (10.5px - موفر للمساحة)</option>
              </select>
            </div>

            {/* Scope Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>النطاق:</label>
              <select 
                value={scopeFilter} 
                onChange={(e: any) => setScopeFilter(e.target.value)}
                style={{
                  padding: '0.42rem 0.7rem', borderRadius: '9px', border: '1.5px solid #CBD5E1',
                  fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', outline: 'none', background: '#F8FAFC'
                }}
              >
                <option value="certified_only">الحاصلين على الشهادة فقط</option>
                <option value="all_records">جميع المسجلين (حاصلين ومقدمين)</option>
              </select>
            </div>

            {/* Year Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>العام:</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  padding: '0.42rem 0.7rem', borderRadius: '9px', border: '1.5px solid #CBD5E1',
                  fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', outline: 'none', background: '#F8FAFC'
                }}
              >
                <option value="all">جميع الأعوام</option>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Orientation Toggle */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.2rem', borderRadius: '9px', border: '1px solid #CBD5E1' }}>
              <button
                onClick={() => setPageOrientation('portrait')}
                style={{
                  padding: '0.35rem 0.6rem', borderRadius: '7px', border: 'none',
                  background: isPortrait ? '#0F2044' : 'transparent',
                  color: isPortrait ? '#ffffff' : '#64748B',
                  fontSize: '0.73rem', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.25rem'
                }}
                title="طباعة وتصدير عمودي (A4 Portrait)"
              >
                <FileText size={12} /> عمودي (Portrait)
              </button>
              <button
                onClick={() => setPageOrientation('landscape')}
                style={{
                  padding: '0.35rem 0.6rem', borderRadius: '7px', border: 'none',
                  background: !isPortrait ? '#0F2044' : 'transparent',
                  color: !isPortrait ? '#ffffff' : '#64748B',
                  fontSize: '0.73rem', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.25rem'
                }}
                title="طباعة وتصدير عرضي (A4 Landscape)"
              >
                <RotateCw size={12} /> عرضي (Landscape)
              </button>
            </div>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#fff', border: 'none',
                padding: '0.55rem 1.25rem', borderRadius: '11px', fontWeight: 900,
                cursor: isGeneratingPdf ? 'wait' : 'pointer', fontSize: '0.82rem',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)', transition: 'transform 0.2s'
              }}
            >
              <Download size={15} />
              {isGeneratingPdf ? 'جاري التصدير...' : `تصدير PDF (${activeReportTab === 'full' ? 'شامل صفحتين' : activeReportTab === 'single' ? 'صفحة واحدة A4' : activeReportTab === 'page1' ? 'صفحة 1' : 'صفحة 2'})`}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                background: '#0F2044', color: '#fff', border: 'none',
                padding: '0.55rem 1.1rem', borderRadius: '11px', fontWeight: 900,
                cursor: 'pointer', fontSize: '0.82rem', boxShadow: '0 4px 12px rgba(15,32,68,0.2)'
              }}
            >
              <Printer size={15} /> طباعة
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="modal-close-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1',
                padding: '0.55rem 0.85rem', borderRadius: '11px', fontWeight: 800,
                cursor: 'pointer', fontSize: '0.82rem'
              }}
            >
              <X size={15} /> إغلاق
            </button>
          </div>
        </div>

        {/* ─── CONTAINER FOR REPORT SHEETS ────────────────────────────────────────── */}
        <div className="miee-sheets-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', alignItems: 'center', width: '100%' }}>

          {/* ══════════════════════════════════════════════════════════════════════════════════
              PAGE 1: EXECUTIVE DASHBOARD, VISUAL CHARTS & DEPARTMENT BENCHMARKS TABLE
             ══════════════════════════════════════════════════════════════════════════════════ */}
          {(activeReportTab === 'full' || activeReportTab === 'page1') && (
            <div
              id="miee-report-sheet-page-1"
              className="printable-report-sheet sheet-page-1"
              style={{
                background: '#ffffff', 
                width: sheetWidth,
                minHeight: isPortrait ? '1130px' : '750px',
                padding: isPortrait ? '1.25rem 1.75rem' : '1rem 1.5rem', 
                borderRadius: '8px', 
                border: '1.5px solid #CBD5E1',
                boxShadow: '0 15px 40px rgba(0,0,0,0.15)', 
                boxSizing: 'border-box',
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* Top Section */}
              <div>
                {renderOfficialHeader(
                  'Microsoft Innovative Educator Expert (MIEE) Official Analytics & Department Benchmarks',
                  'صفحة 1 من 2'
                )}

                {/* 1. 4 KPI Cards */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.55rem',
                  marginBottom: '0.55rem'
                }}>
                  {/* Card 1: Navy Gradient */}
                  <div style={{
                    background: 'linear-gradient(135deg, #0F2044 0%, #1e3a8a 100%)',
                    padding: '0.65rem 0.75rem', borderRadius: '10px', color: '#fff',
                    boxShadow: '0 4px 12px rgba(15,32,68,0.15)', position: 'relative', overflow: 'hidden'
                  }}>
                    <p style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.85, margin: '0 0 0.25rem 0', wordWrap: 'break-word' }}>إجمالي المعلمين الحاصلين على الشهاده</p>
                    <h3 style={{ fontSize: '1.65rem', fontWeight: 900, margin: 0, lineHeight: 1.1 }}>{certifiedRecords.length}</h3>
                    <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', opacity: 0.85 }}>
                      <Award size={12} /> MEEE {selectedYear === 'all' ? '2026-2027' : selectedYear}
                    </div>
                  </div>

                  {/* Card 2: Applied (Amber) */}
                  <div style={{
                    background: '#fff', padding: '0.65rem 0.75rem', borderRadius: '10px',
                    border: '1px solid #E2E8F0', borderBottom: '3.5px solid #F59E0B',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, margin: '0 0 0.2rem 0' }}>تم التقديم</p>
                        <h3 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#F59E0B', margin: 0, lineHeight: 1.1 }}>{totalApplicantsInYear - certifiedRecords.length}</h3>
                      </div>
                      <div style={{ background: '#FEF3C7', padding: '0.35rem', borderRadius: '8px', color: '#F59E0B' }}>
                        <Clock size={16} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.64rem', color: '#94A3B8', fontWeight: 700, margin: '0.35rem 0 0 0' }}>بانتظار النتيجة الرسمية</p>
                  </div>

                  {/* Card 3: Certified (Emerald) */}
                  <div style={{
                    background: '#fff', padding: '0.65rem 0.75rem', borderRadius: '10px',
                    border: '1px solid #E2E8F0', borderBottom: '3.5px solid #10B981',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, margin: '0 0 0.2rem 0' }}>حصل على الشهادة</p>
                        <h3 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#10B981', margin: 0, lineHeight: 1.1 }}>{certifiedRecords.length}</h3>
                      </div>
                      <div style={{ background: '#D1FAE5', padding: '0.35rem', borderRadius: '8px', color: '#10B981' }}>
                        <BadgeCheck size={16} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.64rem', color: '#10B981', fontWeight: 800, margin: '0.35rem 0 0 0' }}>معلم معتمد MIEE رسمياً 🎓</p>
                  </div>

                  {/* Card 4: Rate from total teachers (Purple) */}
                  <div style={{
                    background: '#fff', padding: '0.65rem 0.75rem', borderRadius: '10px',
                    border: '1px solid #E2E8F0', borderBottom: '3.5px solid #8B5CF6',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, margin: '0 0 0.2rem 0' }}>نسبة الحصول على الشهادة</p>
                        <h3 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#8B5CF6', margin: 0, lineHeight: 1.1 }}>{certRateFromAllTeachers}%</h3>
                      </div>
                      <div style={{ background: '#EDE9FE', padding: '0.35rem', borderRadius: '8px', color: '#8B5CF6' }}>
                        <TrendingUp size={16} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.63rem', color: '#64748B', fontWeight: 800, margin: '0.35rem 0 0 0', wordWrap: 'break-word' }}>
                      من إجمالي الكادر ({certifiedRecords.length} من {totalTeachersCount} معلماً)
                    </p>
                  </div>
                </div>

                {/* 2. Visual Charts Row (Bar Chart + Donut Gauge) */}
                <div style={{
                  display: 'grid', gridTemplateColumns: isPortrait ? '1.9fr 1.1fr' : '2fr 1fr', gap: '0.65rem',
                  marginBottom: '0.55rem'
                }}>
                  {/* Bar Chart Container */}
                  <div style={{
                    background: '#ffffff', border: '1px solid #CBD5E1', borderRadius: '10px',
                    padding: '0.65rem 0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ padding: '0.3rem', borderRadius: '6px', background: '#F8FAFC', color: '#0F2044' }}><BarChart3 size={14} /></div>
                        <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 900, color: '#0F2044' }}>
                          إحصائيات الحاصلين على شهادة MIEE حسب الأقسام
                        </h4>
                      </div>
                      <span style={{ fontSize: '0.64rem', color: '#059669', background: '#ECFDF5', padding: '0.12rem 0.45rem', borderRadius: '5px', fontWeight: 800 }}>
                        ● الحاصلين على الشهادة
                      </span>
                    </div>

                    {/* Pure Vector SVG Bar Chart */}
                    <div style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: '10px', paddingBottom: '4px' }}>
                      {departmentBreakdown.slice(0, 8).map((dept) => {
                        const barHeight = maxCertifiedCount > 0 ? (dept.certified / maxCertifiedCount) * 78 : 0;
                        return (
                          <div key={dept.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0, padding: '0 2px' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: dept.certified > 0 ? '#065F46' : '#94A3B8', marginBottom: '2px' }}>
                              {dept.certified > 0 ? `🎓 ${dept.certified}` : '0'}
                            </div>
                            <div 
                              style={{
                                width: '70%',
                                maxWidth: '24px',
                                minWidth: '12px',
                                height: `${Math.max(barHeight, 4)}px`,
                                background: dept.certified > 0 ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)' : '#E2E8F0',
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.3s'
                              }}
                            />
                            <div style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              color: '#0F2044',
                              marginTop: '3px',
                              textAlign: 'center',
                              width: '100%',
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              lineHeight: 1.15
                            }}>
                              {dept.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Leader Summary Strip */}
                    <div style={{
                      marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid #F1F5F9',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.66rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ color: '#64748B', fontWeight: 800 }}>🏆 القسم المتصدر:</span>
                        <strong style={{ color: '#065F46', background: '#D1FAE5', padding: '0.1rem 0.4rem', borderRadius: '5px', border: '1px solid #A7F3D0' }}>
                          {topDept ? `${topDept.name} (${topDept.certifiedRate}%)` : 'لا يوجد'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ color: '#64748B', fontWeight: 800 }}>🎯 معدل النجاح:</span>
                        <strong style={{ color: '#10B981', background: '#ECFDF5', padding: '0.1rem 0.4rem', borderRadius: '5px' }}>
                          %{applicantSuccessRate} ({certifiedRecords.length} من {totalApplicantsInYear})
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Donut Coverage Gauge Container */}
                  <div style={{
                    background: '#ffffff', border: '1px solid #CBD5E1', borderRadius: '10px',
                    padding: '0.65rem 0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      <div style={{ padding: '0.3rem', borderRadius: '6px', background: '#EDE9FE', color: '#8B5CF6' }}><Target size={14} /></div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 900, color: '#0F2044' }}>مؤشر التغطية المدرسية</h4>
                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.62rem', color: '#64748B', fontWeight: 700 }}>نسبة الحاصلين من إجمالي معلمي المدرسة</p>
                      </div>
                    </div>

                    {/* Vector SVG Donut Gauge */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '95px' }}>
                      <svg width="95" height="95" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="46" fill="none" stroke="#F1F5F9" strokeWidth="18" />
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="18"
                          strokeDasharray={`${certStroke} ${uncertStroke}`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                        />
                        <text x="60" y="58" textAnchor="middle" fontSize="22" fontWeight="900" fill="#0F2044">{certRateFromAllTeachers}%</text>
                        <text x="60" y="73" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#10B981">تغطية الكادر</text>
                      </svg>
                    </div>

                    {/* Donut Legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.15rem 0.45rem', background: '#ECFDF5', borderRadius: '5px' }}>
                        <span style={{ color: '#065F46', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> حصل على الشهادة:
                        </span>
                        <strong style={{ color: '#065F46', fontWeight: 900 }}>{certifiedRecords.length} ({certRateFromAllTeachers}%)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.15rem 0.45rem', background: '#F8FAFC', borderRadius: '5px' }}>
                        <span style={{ color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#CBD5E1', display: 'inline-block' }} /> باقي كادر المدرسة:
                        </span>
                        <strong style={{ color: '#64748B', fontWeight: 800 }}>{totalTeachersCount - certifiedRecords.length} معلماً</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Official Department Breakdown Table */}
                <div className="print-avoid-break">
                  <div style={{
                    background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '5px',
                    padding: '0.22rem 0.6rem', marginBottom: '0.25rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem'
                  }}>
                    <span style={{ color: '#0369A1', fontWeight: 900 }}>
                      🏢 أولاً: إحصائية أعداد الحاصلين على الشهادة ونسب الإنجاز حسب الأقسام الأكاديمية
                    </span>
                    <span style={{ color: '#0F2044', fontWeight: 800 }}>
                      عدد الأقسام: {departmentBreakdown.length} قسماً
                    </span>
                  </div>
                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '5px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'right' }}>
                      <colgroup>
                        <col style={{ width: '4%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '18%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                          <th style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, textAlign: 'center', fontSize: fontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>#</th>
                          <th style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, fontSize: fontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>القسم الأكاديمي</th>
                          <th style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, textAlign: 'center', fontSize: fontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>إجمالي كادر القسم</th>
                          <th style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, textAlign: 'center', fontSize: fontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>الحاصلين على الشهادة</th>
                          <th style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, textAlign: 'center', fontSize: fontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>قيد التقديم</th>
                          <th style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, textAlign: 'center', fontSize: fontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>نسبة الاعتماد بالقسم</th>
                          <th style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, textAlign: 'center', fontSize: fontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>التقييم المؤسسي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentBreakdown.map((dept, idx) => (
                          <tr key={dept.name} style={{ background: idx % 2 === 0 ? '#ffffff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, textAlign: 'center', fontWeight: 800, color: '#0F2044', fontSize: fontScale.tdFont, verticalAlign: 'middle' }}>{idx + 1}</td>
                            <td style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, fontWeight: 900, color: '#0F2044', fontSize: fontScale.tdFont, whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', verticalAlign: 'middle', lineHeight: fontScale.lineHeight }}>{dept.name}</td>
                            <td style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, textAlign: 'center', fontWeight: 800, color: '#475569', fontSize: fontScale.tdFont, verticalAlign: 'middle' }}>{dept.deptTeachersCount} معلم</td>
                            <td style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, textAlign: 'center', fontWeight: 900, color: '#059669', background: dept.certified > 0 ? '#ECFDF5' : 'transparent', fontSize: fontScale.tdFont, verticalAlign: 'middle' }}>
                              {dept.certified > 0 ? `🟢 ${dept.certified} معلم` : '0'}
                            </td>
                            <td style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, textAlign: 'center', fontWeight: 700, color: '#D97706', fontSize: fontScale.tdFont, verticalAlign: 'middle' }}>{dept.applied}</td>
                            <td style={{ 
                              padding: `${fontScale.paddingY} ${fontScale.paddingX}`, 
                              textAlign: 'center', 
                              fontWeight: 900, 
                              color: dept.certifiedRate >= 70 ? '#059669' : dept.certifiedRate >= 50 ? '#0369A1' : dept.certifiedRate >= 30 ? '#7C3AED' : '#64748B', 
                              fontSize: fontScale.tdFont, 
                              verticalAlign: 'middle' 
                            }}>
                              {dept.certifiedRate}%
                            </td>
                            <td style={{ padding: `${fontScale.paddingY} ${fontScale.paddingX}`, textAlign: 'center', verticalAlign: 'middle' }}>
                              <span style={{
                                padding: '0.12rem 0.45rem', 
                                borderRadius: '4px', 
                                fontSize: fontScale.badgeFont, 
                                fontWeight: 800,
                                background: dept.evaluation?.bg || '#F1F5F9',
                                color: dept.evaluation?.color || '#64748B',
                                border: `1px solid ${dept.evaluation?.border || '#CBD5E1'}`,
                                display: 'inline-block', 
                                whiteSpace: 'nowrap'
                              }}>
                                {dept.evaluation?.label || `${dept.certifiedRate}%`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════════
              PAGE 2: COMPLETE NOMINAL ROLL, TESTIMONIAL & 3 OFFICIAL SIGNATURES
             ══════════════════════════════════════════════════════════════════════════════════ */}
          {(activeReportTab === 'full' || activeReportTab === 'page2') && (
            <div
              id="miee-report-sheet-page-2"
              className="printable-report-sheet sheet-page-2"
              style={{
                background: '#ffffff', 
                width: sheetWidth,
                minHeight: isPortrait ? '1130px' : '750px',
                padding: isPortrait ? '1.25rem 1.75rem' : '1rem 1.5rem', 
                borderRadius: '8px', 
                border: '1.5px solid #CBD5E1',
                boxShadow: '0 15px 40px rgba(0,0,0,0.15)', 
                boxSizing: 'border-box',
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* Top Section */}
              <div>
                {renderOfficialHeader(
                  'Microsoft Innovative Educator Expert (MIEE) Official Nominal Roll & Endorsements',
                  'صفحة 2 من 2'
                )}

                {/* 1. Full Certified / All Teachers Table */}
                <div className="print-avoid-break" style={{ marginBottom: '0.55rem' }}>
                  <div style={{
                    background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '5px',
                    padding: '0.22rem 0.6rem', marginBottom: '0.25rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem'
                  }}>
                    <span style={{ color: '#065F46', fontWeight: 900 }}>
                      🎓 ثانياً: كشف أسماء وبيانات المعلمين الحاصلين رسمياً على شهادة معلّم مايكروسوفت المبدع الخبير (MIEE)
                    </span>
                    <span style={{ color: '#0F2044', fontWeight: 800 }}>
                      إجمالي المعروضين بالكشف: {displayedTeachersRecords.length} معلماً
                    </span>
                  </div>

                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '5px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'right' }}>
                      <colgroup>
                        <col style={{ width: '4%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '13%' }} />
                        <col style={{ width: '13%' }} />
                        <col style={{ width: '19%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                          <th style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, textAlign: 'center', fontSize: page2FontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>#</th>
                          <th style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, fontSize: page2FontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>اسم المعلم</th>
                          <th style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, fontSize: page2FontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>القسم الأكاديمي</th>
                          <th style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, fontSize: page2FontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>المسمى / التخصص</th>
                          <th style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, textAlign: 'center', fontSize: page2FontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>الحالة والصفة</th>
                          <th style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, textAlign: 'center', fontSize: page2FontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>تاريخ الاعتماد</th>
                          <th style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, fontSize: page2FontScale.thFont, fontWeight: 900, borderBottom: '1px solid #CBD5E1' }}>الملاحظات والاعتماد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedTeachersRecords.map((r, index) => {
                          const teacherObj = teachers.find(t => t.id === r.teacherId || t.nameAr === r.teacherName);
                          const subjectOrRole = r.role || teacherObj?.subject || teacherObj?.jobCategory || 'معلم';
                          const isCert = r.status === 'حصل على الشهادة';
                          return (
                            <tr key={r.id} style={{ background: index % 2 === 0 ? '#ffffff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                              <td style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, textAlign: 'center', fontWeight: 800, color: '#0F2044', fontSize: page2FontScale.tdFont, verticalAlign: 'middle' }}>{index + 1}</td>
                              <td style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, fontWeight: 900, color: '#0F2044', fontSize: page2FontScale.tdFont, whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', verticalAlign: 'middle', lineHeight: page2FontScale.lineHeight }}>{r.teacherName}</td>
                              <td style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, fontWeight: 800, color: '#1E293B', fontSize: page2FontScale.tdFont, whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', verticalAlign: 'middle' }}>{resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments)}</td>
                              <td style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, color: '#475569', fontSize: page2FontScale.tdFont, whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', verticalAlign: 'middle' }}>{subjectOrRole}</td>
                              <td style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, textAlign: 'center', verticalAlign: 'middle' }}>
                                <span style={{
                                  padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: page2FontScale.badgeFont, fontWeight: 900,
                                  background: isCert ? '#D1FAE5' : '#FEF3C7',
                                  color: isCert ? '#065F46' : '#92400E',
                                  display: 'inline-block', whiteSpace: 'normal', wordWrap: 'break-word'
                                }}>
                                  {isCert ? '✓ معتمد MIEE' : 'قيد التقديم'}
                                </span>
                              </td>
                              <td style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, textAlign: 'center', fontWeight: 800, color: '#059669', fontSize: page2FontScale.tdFont, verticalAlign: 'middle' }}>
                                {r.certificationDate || '-'}
                              </td>
                              <td style={{ padding: `${page2FontScale.paddingY} ${page2FontScale.paddingX}`, color: '#64748B', fontSize: page2FontScale.tdFont, whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', verticalAlign: 'middle', lineHeight: page2FontScale.lineHeight }}>
                                {r.notes || (isCert ? 'تم استيفاء معايير مايكروسوفت واجتياز المتطلبات' : 'بانتظار نتائج التحكيم')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Official Endorsement Statement */}
                <div className="print-avoid-break" style={{
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRight: '4px solid #0F2044',
                  borderRadius: '6px',
                  padding: displayedTeachersRecords.length > 25 ? '0.35rem 0.65rem' : '0.45rem 0.85rem',
                  marginBottom: displayedTeachersRecords.length > 25 ? '0.35rem' : '0.55rem',
                  fontSize: displayedTeachersRecords.length > 25 ? '0.67rem' : '0.72rem',
                  color: '#334155',
                  lineHeight: '1.38'
                }}>
                  <strong style={{ color: '#0F2044', display: 'block', marginBottom: '0.1rem' }}>
                    📜 بيان الإقرار والمصادقة المدرسية الرسمية:
                  </strong>
                  تشهد إدارة مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين وقسم المشاريع الإلكترونية والتعليم الإلكتروني والحلول الرقمية بأن المعلمين الواردة أسماؤهم أعلاه قد اجتازوا بنجاح كافة متطلبات الترشح والاعتماد الدولي لبرنامج <strong>شهادة معلّم مايكروسوفت المبدع الخبير (Microsoft Innovative Educator Expert - MIEE)</strong> للعام الأكاديمي {selectedYear === 'all' ? '2026-2027' : selectedYear}، بعد استيفاء معايير التوظيف المبتكر للتقنيات الذكية في التعليم وقيادة التحول الرقمي المدرسي. وبناءً عليه تم منحهم هذا البيان التوثيقي المعتمد.
                </div>

                {/* 3. Three Official Administrative Signatures */}
                <div className="print-avoid-break" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  marginTop: '0.25rem'
                }}>
                  {/* Sig 1: Eng. Ahmad Tubaishat */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: displayedTeachersRecords.length > 25 ? '0.3rem 0.5rem' : '0.45rem 0.65rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800, margin: '0 0 0.1rem 0' }}>
                      إعداد وتوثيق منسق المشاريع الإلكترونية
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#0F2044', fontWeight: 900, margin: '0 0 0.2rem 0' }}>
                      م. أحمد عادل طبيشات
                    </p>
                    <div style={{ height: displayedTeachersRecords.length > 25 ? '36px' : '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img 
                        src={SIGNATURE_AHMAD_BASE64} 
                        alt="توقيع م. أحمد طبيشات" 
                        style={{ maxHeight: displayedTeachersRecords.length > 25 ? '34px' : '42px', maxWidth: '115px', objectFit: 'contain' }}
                      />
                    </div>
                  </div>

                  {/* Sig 2: Dr. Rani Al-Toum */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: displayedTeachersRecords.length > 25 ? '0.3rem 0.5rem' : '0.45rem 0.65rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800, margin: '0 0 0.1rem 0' }}>
                      مراجعة واعتماد النائب الأكاديمي
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#0F2044', fontWeight: 900, margin: '0 0 0.2rem 0' }}>
                      د. راني التوم
                    </p>
                    <div style={{ height: displayedTeachersRecords.length > 25 ? '36px' : '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img 
                        src={SIGNATURE_RANI_BASE64} 
                        alt="توقيع د. راني التوم" 
                        style={{ maxHeight: displayedTeachersRecords.length > 25 ? '34px' : '42px', maxWidth: '115px', objectFit: 'contain' }}
                      />
                    </div>
                  </div>

                  {/* Sig 3: School Principal */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: displayedTeachersRecords.length > 25 ? '0.3rem 0.5rem' : '0.45rem 0.65rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 800, margin: '0 0 0.1rem 0' }}>
                      مصادقة واعتماد مدير المدرسة
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#0F2044', fontWeight: 900, margin: '0 0 0.2rem 0' }}>
                      محمد علي مندني العمادي
                    </p>
                    <div style={{ height: displayedTeachersRecords.length > 25 ? '36px' : '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src="/principal-signature.png"
                        alt="محمد علي مندني العمادي"
                        style={{ maxHeight: displayedTeachersRecords.length > 25 ? '34px' : '42px', maxWidth: '115px', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════════
              SINGLE CONDENSED A4 PAGE OPTION
             ══════════════════════════════════════════════════════════════════════════════════ */}
          {activeReportTab === 'single' && (
            <div
              id="miee-report-sheet-single"
              className="printable-report-sheet"
              style={{
                background: '#ffffff', 
                width: sheetWidth,
                minHeight: isPortrait ? '1130px' : '750px',
                padding: isPortrait ? '1.25rem 1.75rem' : '1rem 1.5rem', 
                borderRadius: '8px', 
                border: '1.5px solid #CBD5E1',
                boxShadow: '0 15px 40px rgba(0,0,0,0.15)', 
                boxSizing: 'border-box',
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* Top Section */}
              <div>
                {renderOfficialHeader(
                  'Microsoft Innovative Educator Expert (MIEE) Comprehensive Single Page Report',
                  'تقرير رسمي معتمد'
                )}

                {/* 4 KPIs Compact Row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem',
                  marginBottom: '0.45rem'
                }}>
                  <div style={{ background: 'linear-gradient(135deg, #0F2044 0%, #1e3a8a 100%)', padding: '0.4rem 0.6rem', borderRadius: '8px', color: '#fff' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, opacity: 0.85, display: 'block' }}>إجمالي الحاصلين على الشهادة</span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 900 }}>{certifiedRecords.length}</strong>
                  </div>
                  <div style={{ background: '#fff', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', borderBottom: '3px solid #F59E0B' }}>
                    <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 800, display: 'block' }}>تم التقديم</span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D97706' }}>{totalApplicantsInYear - certifiedRecords.length}</strong>
                  </div>
                  <div style={{ background: '#fff', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', borderBottom: '3px solid #10B981' }}>
                    <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 800, display: 'block' }}>معتمد رسمياً 🎓</span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>{certifiedRecords.length}</strong>
                  </div>
                  <div style={{ background: '#fff', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', borderBottom: '3px solid #8B5CF6' }}>
                    <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 800, display: 'block' }}>نسبة الاعتماد الكلية</span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: '#7C3AED' }}>{certRateFromAllTeachers}%</strong>
                  </div>
                </div>

                {/* Department Table (Compact & Wrapped) */}
                <div style={{ marginBottom: '0.45rem' }}>
                  <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '4px', padding: '0.2rem 0.5rem', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 900, color: '#0369A1' }}>
                    <span>🏢 إحصائية أعداد ونسب الحاصلين حسب الأقسام</span>
                    <span>عدد الأقسام: {departmentBreakdown.length}</span>
                  </div>
                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'right' }}>
                      <colgroup>
                        <col style={{ width: '5%' }} />
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '14%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                          <th style={{ padding: '0.22rem 0.35rem', textAlign: 'center', fontSize: fontScale.thFont }}>#</th>
                          <th style={{ padding: '0.22rem 0.35rem', fontSize: fontScale.thFont }}>القسم</th>
                          <th style={{ padding: '0.22rem 0.35rem', textAlign: 'center', fontSize: fontScale.thFont }}>الكادر</th>
                          <th style={{ padding: '0.22rem 0.35rem', textAlign: 'center', fontSize: fontScale.thFont }}>الحاصلين</th>
                          <th style={{ padding: '0.22rem 0.35rem', textAlign: 'center', fontSize: fontScale.thFont }}>مقدمين</th>
                          <th style={{ padding: '0.22rem 0.35rem', textAlign: 'center', fontSize: fontScale.thFont }}>النسبة</th>
                          <th style={{ padding: '0.22rem 0.35rem', textAlign: 'center', fontSize: fontScale.thFont }}>التقييم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentBreakdown.slice(0, 7).map((dept, idx) => (
                          <tr key={dept.name} style={{ background: idx % 2 === 0 ? '#ffffff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '0.18rem 0.35rem', textAlign: 'center', fontWeight: 800, fontSize: fontScale.tdFont }}>{idx + 1}</td>
                            <td style={{ padding: '0.18rem 0.35rem', fontWeight: 900, color: '#0F2044', fontSize: fontScale.tdFont, whiteSpace: 'normal', wordWrap: 'break-word' }}>{dept.name}</td>
                            <td style={{ padding: '0.18rem 0.35rem', textAlign: 'center', fontSize: fontScale.tdFont }}>{dept.deptTeachersCount}</td>
                            <td style={{ padding: '0.18rem 0.35rem', textAlign: 'center', fontWeight: 900, color: '#059669', fontSize: fontScale.tdFont }}>{dept.certified}</td>
                            <td style={{ padding: '0.18rem 0.35rem', textAlign: 'center', color: '#D97706', fontSize: fontScale.tdFont }}>{dept.applied}</td>
                            <td style={{ 
                              padding: '0.18rem 0.35rem', 
                              textAlign: 'center', 
                              fontWeight: 900, 
                              color: dept.certifiedRate >= 70 ? '#059669' : dept.certifiedRate >= 50 ? '#0369A1' : dept.certifiedRate >= 30 ? '#7C3AED' : '#64748B', 
                              fontSize: fontScale.tdFont 
                            }}>
                              {dept.certifiedRate}%
                            </td>
                            <td style={{ padding: '0.18rem 0.35rem', textAlign: 'center', verticalAlign: 'middle' }}>
                              <span style={{
                                padding: '0.08rem 0.3rem', 
                                borderRadius: '4px', 
                                fontSize: fontScale.badgeFont, 
                                fontWeight: 800,
                                background: dept.evaluation?.bg || '#F1F5F9',
                                color: dept.evaluation?.color || '#64748B',
                                display: 'inline-block', 
                                whiteSpace: 'nowrap'
                              }}>
                                {dept.evaluation?.shortLabel || `${dept.certifiedRate}%`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Teachers Roll (Compact & Wrapped) */}
                <div>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '4px', padding: '0.2rem 0.5rem', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 900, color: '#065F46' }}>
                    <span>🎓 كشف أسماء المعلمين المعتمدين رسمياً (MIEE)</span>
                    <span>العدد: {displayedTeachersRecords.length}</span>
                  </div>
                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'right' }}>
                      <colgroup>
                        <col style={{ width: '5%' }} />
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                          <th style={{ padding: '0.22rem 0.35rem', textAlign: 'center', fontSize: fontScale.thFont }}>#</th>
                          <th style={{ padding: '0.22rem 0.35rem', fontSize: fontScale.thFont }}>اسم المعلم</th>
                          <th style={{ padding: '0.22rem 0.35rem', fontSize: fontScale.thFont }}>القسم</th>
                          <th style={{ padding: '0.22rem 0.35rem', fontSize: fontScale.thFont }}>المسمى</th>
                          <th style={{ padding: '0.22rem 0.35rem', textAlign: 'center', fontSize: fontScale.thFont }}>الحالة</th>
                          <th style={{ padding: '0.22rem 0.35rem', textAlign: 'center', fontSize: fontScale.thFont }}>الاعتماد</th>
                          <th style={{ padding: '0.22rem 0.35rem', fontSize: fontScale.thFont }}>ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedTeachersRecords.slice(0, 8).map((r, index) => {
                          const teacherObj = teachers.find(t => t.id === r.teacherId || t.nameAr === r.teacherName);
                          const subjectOrRole = teacherObj?.subject || teacherObj?.jobCategory || 'معلم';
                          const isCert = r.status === 'حصل على الشهادة';
                          return (
                            <tr key={r.id} style={{ background: index % 2 === 0 ? '#ffffff' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                              <td style={{ padding: '0.18rem 0.35rem', textAlign: 'center', fontWeight: 800, fontSize: fontScale.tdFont }}>{index + 1}</td>
                              <td style={{ padding: '0.18rem 0.35rem', fontWeight: 900, color: '#0F2044', fontSize: fontScale.tdFont, whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.teacherName}</td>
                              <td style={{ padding: '0.18rem 0.35rem', fontWeight: 800, fontSize: fontScale.tdFont, whiteSpace: 'normal', wordWrap: 'break-word' }}>{resolveTeacherDepartment(r.teacherId, r.teacherName, r.department, teachers, departments)}</td>
                              <td style={{ padding: '0.18rem 0.35rem', color: '#475569', fontSize: fontScale.tdFont, whiteSpace: 'normal', wordWrap: 'break-word' }}>{subjectOrRole}</td>
                              <td style={{ padding: '0.18rem 0.35rem', textAlign: 'center' }}>
                                <span style={{ background: isCert ? '#D1FAE5' : '#FEF3C7', color: isCert ? '#065F46' : '#92400E', padding: '0.08rem 0.3rem', borderRadius: '3px', fontSize: fontScale.badgeFont, fontWeight: 900 }}>
                                  {isCert ? '✓ معتمد' : 'مقدم'}
                                </span>
                              </td>
                              <td style={{ padding: '0.18rem 0.35rem', textAlign: 'center', color: '#059669', fontWeight: 800, fontSize: fontScale.tdFont }}>{r.certificationDate || '-'}</td>
                              <td style={{ padding: '0.18rem 0.35rem', color: '#64748B', fontSize: fontScale.tdFont, whiteSpace: 'normal', wordWrap: 'break-word' }}>{r.notes || 'معتمد'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Compact Signatures Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginTop: '0.45rem' }}>
                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.35rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 800, margin: '0 0 0.1rem 0' }}>إعداد وتوثيق: م. أحمد طبيشات</p>
                    <img src={SIGNATURE_AHMAD_BASE64} alt="توقيع" style={{ maxHeight: '30px', maxWidth: '85px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.35rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 800, margin: '0 0 0.1rem 0' }}>مراجعة واعتماد: د. راني التوم</p>
                    <img src={SIGNATURE_RANI_BASE64} alt="توقيع" style={{ maxHeight: '30px', maxWidth: '85px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.35rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 800, margin: '0 0 0.1rem 0' }}>مصادقة: مدير المدرسة</p>
                    <img src="/principal-signature.png" alt="محمد علي مندني العمادي" style={{ maxHeight: '30px', maxWidth: '85px', objectFit: 'contain' }} />
                  </div>
                </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
