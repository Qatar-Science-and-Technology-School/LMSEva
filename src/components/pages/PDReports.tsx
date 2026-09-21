'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Download, Printer, X, CheckCircle2, Clock, Users, Calendar, 
  MapPin, Target, Layers, Award, UserCheck, Globe, 
  Monitor, Zap, Plus, Trash2, Edit3, ChevronDown, Check,
  FileSpreadsheet, Sparkles, BookOpen, AlertCircle, FileText
} from 'lucide-react';
import { SCHOOL_NAME, getDeptName } from '@/lib/data';
import type { Workshop, IndividualPDRecord, PDAttendee } from '@/lib/pdData';
import { FormattedReportPoints, RichBulletTextarea } from '@/components/RichBulletTextarea';

interface OfficialHeaderProps {
  title: string;
  subtitle: string;
  reportCode: string;
  academicYear: string;
  reportDate?: string;
}

export function ReportLetterheadBackground({ orientation = 'landscape' }: { orientation?: 'landscape' | 'portrait' }) {
  return null;
}

export function OfficialReportHeader({ title, subtitle, hideLogos = false }: OfficialHeaderProps & { hideLogos?: boolean }) {
  return (
    <div style={{ 
      marginBottom: '0.75rem', 
      paddingBottom: '0.5rem', 
      borderBottom: '2px solid #0F2044', 
      background: 'transparent',
      position: 'relative',
      zIndex: 1,
      fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif"
    }}>
      {/* Decorative subtle gradient accent below the main navy rule */}
      <div style={{ 
        position: 'absolute', 
        bottom: '-3px', 
        left: '25px', 
        right: '25px', 
        height: '2px', 
        background: 'linear-gradient(90deg, transparent 0%, #0284C7 50%, transparent 100%)' 
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        {/* Ministry Logo Right */}
        <div style={{ textAlign: 'right', flexShrink: 0, width: '165px' }}>
          <img 
            src="/ministry-logo.png" 
            alt="وزارة التربية والتعليم والتعليم العالي" 
            style={{ height: '75px', maxWidth: '165px', objectFit: 'contain', display: 'block' }} 
          />
        </div>

        {/* Center: Document Title Banner + Subtitle + Metadata */}
        <div style={{ textAlign: 'center', flex: 1, padding: '0 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Document Title Banner */}
          <div 
            className="print-header-badge"
            style={{ 
              background: '#0F2044', 
              color: '#ffffff', 
              padding: '0.45rem 1.8rem', 
              borderRadius: '8px',
              border: '1.5px solid #0F2044',
              boxShadow: '0 2px 8px rgba(15, 32, 68, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '94%',
              boxSizing: 'border-box',
              marginBottom: subtitle ? '5px' : 0
            }}
          >
            <h2 
              className="text-white print-header-badge" 
              style={{ 
                margin: 0, 
                fontSize: '0.94rem', 
                fontWeight: 900, 
                color: '#ffffff !important',
                WebkitTextFillColor: '#ffffff !important',
                letterSpacing: 'normal',
                lineHeight: 1.35,
                textAlign: 'center',
                fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif",
                whiteSpace: 'normal',
                wordBreak: 'break-word'
              }}
            >
              {title}
            </h2>
          </div>

          {subtitle && (
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F2044', margin: 0, textAlign: 'center' }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* School Logo Left */}
        <div style={{ textAlign: 'left', flexShrink: 0, width: '165px' }}>
          <img 
            src="/school-logo.png" 
            alt="مدرسة قطر للعلوم والتكنولوجيا" 
            style={{ height: '75px', maxWidth: '165px', objectFit: 'contain', display: 'block', marginLeft: 'auto' }} 
          />
        </div>
      </div>
    </div>
  );
}

// ─── Direct High-Fidelity Landscape PDF Exporter (Lossless PNG & Multi-Page A4 Fit) ─────
export async function downloadReportAsPdf(
  elementId: string, 
  defaultFileName: string,
  pageOption: 'all' | 'page1' | 'page2' = 'all'
) {
  const page1 = document.getElementById(`${elementId}-page-1`);
  const page2 = document.getElementById(`${elementId}-page-2`);
  const singleElement = document.getElementById(elementId);

  const pagesToRender: HTMLElement[] = [];
  if (pageOption === 'page1' && page1) {
    pagesToRender.push(page1);
  } else if (pageOption === 'page2' && page2) {
    pagesToRender.push(page2);
  } else if (page1 && page2) {
    pagesToRender.push(page1, page2);
  } else if (singleElement) {
    pagesToRender.push(singleElement);
  } else if (page1) {
    pagesToRender.push(page1);
  } else {
    console.error(`Report element #${elementId} not found in DOM.`);
    window.print();
    return;
  }
  
  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Ensure document web fonts are fully rendered
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Standard A4 Landscape: 297mm width x 210mm height
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 297;  // A4 Landscape mm width
    const pageHeight = 210; // A4 Landscape mm height
    const margin = 7;       // 7mm border margin

    const availableWidth = pageWidth - (margin * 2);   // 283 mm
    const availableHeight = pageHeight - (margin * 2); // 196 mm

    for (let i = 0; i < pagesToRender.length; i++) {
      const el = pagesToRender[i];
      if (i > 0) {
        pdf.addPage('a4', 'landscape');
      }

      // High resolution rasterization of the exact visible DOM element
      const canvas = await html2canvas(el, {
        scale: 2.2, // 2.2x for crystal-clear vector text and official stamps
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        onclone: async (clonedDoc) => {
          if ((clonedDoc as any).fonts) {
            await (clonedDoc as any).fonts.ready;
          }
          const clonedEl = clonedDoc.getElementById(el.id);
          if (clonedEl) {
            clonedEl.style.width = '1120px';
            clonedEl.style.maxWidth = '1120px';
            clonedEl.style.margin = '0 auto';
            clonedEl.style.boxShadow = 'none';
            clonedEl.style.borderRadius = '0';
            clonedEl.style.position = 'relative';
            clonedEl.style.overflow = 'hidden';
            clonedEl.style.fontFamily = "'IBM Plex Sans Arabic', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Segoe UI', Arial, sans-serif";

            // Force white text elements to remain strictly white in canvas rasterization
            const whiteElements = clonedEl.querySelectorAll('.text-white, .print-header-badge');
            whiteElements.forEach((wel: any) => {
              wel.style.color = '#ffffff';
              if (wel.style.setProperty) {
                wel.style.setProperty('color', '#ffffff', 'important');
                wel.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
              }
            });
          }
        }
      });

      // Lossless PNG eliminates all compression halos and dirty background artifacts
      const imgData = canvas.toDataURL('image/png');
      const contentRatio = canvas.width / canvas.height;

      let renderWidth = availableWidth;
      let renderHeight = renderWidth / contentRatio;

      // Strict single-page fit algorithm per sheet:
      if (renderHeight > availableHeight) {
        renderHeight = availableHeight;
        renderWidth = renderHeight * contentRatio;
      }

      const xOffset = margin + (availableWidth - renderWidth) / 2;
      const yOffset = margin + (availableHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');
    }

    const cleanName = defaultFileName.replace(/[/\\?%*:|"<>]/g, '-').trim();
    pdf.save(`${cleanName}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    window.print();
  }
}

// ─── Interactive Digital Signature Pad (Draw) Component ───────────────────────
interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendeeName: string;
  workshopTitle?: string;
  onSave: (signatureDataUrl: string) => void;
}

export function SignaturePadModal({
  isOpen,
  onClose,
  attendeeName,
  workshopTitle,
  onSave
}: SignaturePadModalProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [penColor, setPenColor] = useState('#0F2044'); // Default official navy
  const [penWidth, setPenWidth] = useState(2.8);

  // Initialize canvas on modal open
  React.useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling for ultra sharp signatures
    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    canvas.width = (rect.width || 500) * dpr;
    canvas.height = (rect.height || 190) * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    setHasStrokes(false);
  }, [isOpen]);

  // Update stroke style when color/width changes
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
    }
  }, [penColor, penWidth]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
    const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
    return {
      x: mouseEvent.clientX - rect.left,
      y: mouseEvent.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasStrokes(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.SyntheticEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasStrokes(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 32, 68, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      direction: 'rtl',
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1.5px solid #0F2044',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
          padding: '1.1rem 1.5rem',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.45rem', borderRadius: '10px' }}>
              <Edit3 size={20} color="#38BDF8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#ffffff' }}>
                لوحة التوقيع الفعلي للمعلم (Draw Signature)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#BAE6FD' }}>
                المعلم المشارك: <strong>{attendeeName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {workshopTitle && (
            <div style={{
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '8px',
              padding: '0.5rem 0.85rem',
              fontSize: '0.78rem',
              color: '#0369A1',
              fontWeight: 700,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              <BookOpen size={16} color="#0284C7" />
              <span>الورشة التدريبية: <strong>{workshopTitle}</strong></span>
            </div>
          )}

          <div style={{
            fontSize: '0.8rem',
            color: '#475569',
            fontWeight: 700,
            marginBottom: '0.6rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>✍️ ارسم توقيعك الفعلي داخل المربع (بالماوس أو شاشة اللمس):</span>
            <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 800 }}>توقيع رقمي موثق</span>
          </div>

          {/* Canvas Box */}
          <div style={{
            position: 'relative',
            border: '2px solid #CBD5E1',
            borderRadius: '12px',
            background: '#FAFBFD',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
            height: '190px',
            overflow: 'hidden',
            cursor: 'crosshair',
            touchAction: 'none'
          }}>
            {/* Guide line in CSS so it is never saved to the final signature image */}
            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '25px',
              right: '25px',
              borderBottom: '1.5px dashed #CBD5E1',
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '3px'
            }}>
              <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>مكان التوقيع ✍️</span>
              <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Sign on line</span>
            </div>

            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                touchAction: 'none'
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Controls Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.85rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #E2E8F0'
          }}>
            {/* Ink color selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>لون الحبر:</span>
              {[
                { color: '#0F2044', label: 'كحلي رسمي' },
                { color: '#000000', label: 'أسود' },
                { color: '#1D4ED8', label: 'أزرق ملكي' }
              ].map(c => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setPenColor(c.color)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: c.color,
                    border: penColor === c.color ? '2.5px solid #00B4D8' : '1.5px solid #CBD5E1',
                    boxShadow: penColor === c.color ? '0 0 0 2px rgba(0,180,216,0.35)' : 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title={c.label}
                />
              ))}
            </div>

            {/* Clear button */}
            <button
              type="button"
              onClick={handleClear}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#F1F5F9',
                color: '#64748B',
                border: '1px solid #CBD5E1',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} /> مسح وإعادة رسم
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: '#F8FAFC',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#fff',
              color: '#64748B',
              border: '1px solid #CBD5E1',
              padding: '0.6rem 1.4rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasStrokes}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: hasStrokes ? 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)' : '#CBD5E1',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.8rem',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 900,
              cursor: hasStrokes ? 'pointer' : 'not-allowed',
              boxShadow: hasStrokes ? '0 4px 12px rgba(15,32,68,0.2)' : 'none'
            }}
          >
            <Check size={16} /> اعتماد وتثبيت التوقيع
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Single Workshop Report Component (2-Page Architecture) ────────────────────
interface SingleWorkshopReportProps {
  workshop: Workshop;
  teachers?: any[];
  departments?: any[];
  onClose?: () => void;
  onUpdateWorkshop?: (updated: Workshop) => void;
  canEdit?: boolean;
}

export function SingleWorkshopReport({ workshop, teachers = [], departments = [], onClose, onUpdateWorkshop, canEdit }: SingleWorkshopReportProps) {
  const [isManageAttendeesOpen, setIsManageAttendeesOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [signingAttendee, setSigningAttendee] = useState<PDAttendee | null>(null);
  const [isEditingVenue, setIsEditingVenue] = useState(false);
  const [venueInput, setVenueInput] = useState(workshop.venue || workshop.location || 'مدرسة قطر للعلوم والتكنولوجيا');
  const [printMode, setPrintMode] = useState<'all' | 'page1'>('all');

  const [isEditingContent, setIsEditingContent] = useState(false);
  const [contentForm, setContentForm] = useState({
    objectives: workshop.objectives || '',
    keyPoints: workshop.keyPoints || '',
    recommendations: workshop.recommendations || ''
  });

  const handleUpdateVenue = (val: string) => {
    setVenueInput(val);
    if (onUpdateWorkshop) {
      onUpdateWorkshop({
        ...workshop,
        venue: val,
        location: val
      });
    }
  };

  const handleSaveContent = () => {
    if (onUpdateWorkshop) {
      onUpdateWorkshop({
        ...workshop,
        objectives: contentForm.objectives,
        keyPoints: contentForm.keyPoints,
        recommendations: contentForm.recommendations
      });
    }
    setIsEditingContent(false);
  };

  const handleDownloadAllPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadReportAsPdf(`workshop-report-${workshop.id}`, `تقرير_ورشة_${workshop.titleAr || workshop.nameAr}_${workshop.academicYear}_كامل`, 'all');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPage1Pdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadReportAsPdf(`workshop-report-${workshop.id}`, `توثيق_ورشة_${workshop.titleAr || workshop.nameAr}_${workshop.academicYear}_اعتمادات_رسمية`, 'page1');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const [currentAttendees, setCurrentAttendees] = useState<PDAttendee[]>(() => {
    if (workshop.attendees && workshop.attendees.length > 0) {
      return workshop.attendees;
    }
    // Default fallback: If notes contain names or create sample attendance from teachers
    if (workshop.notes && workshop.notes.includes('Attendance:')) {
      const namesPart = workshop.notes.replace('Attendance:', '').trim();
      const names = namesPart.split('،').map(n => n.trim()).filter(Boolean);
      return names.map((name, idx) => {
        const found = teachers.find(t => t.nameAr === name);
        const dept = found ? getDeptName(found.departmentId, departments) : 'الهيئة التدريسية';
        return {
          id: `att-${idx}`,
          name,
          department: dept,
          jobTitle: found?.jobTitle || 'معلم',
          signatureStatus: 'تم التوقيع' as const,
          signatureDate: workshop.date || workshop.createdAt
        };
      });
    }
    // If targeted at teachers, provide sample list from registered teachers
    if (teachers.length > 0) {
      const sample = teachers.slice(0, 10).map((t, idx) => ({
        id: `att-${idx}`,
        teacherId: t.id,
        name: t.nameAr,
        department: getDeptName(t.departmentId, departments),
        jobTitle: t.jobTitle || 'معلم',
        signatureStatus: (idx % 4 === 0 ? 'بانتظار التوقيع' : 'تم التوقيع') as any,
        signatureDate: workshop.date
      }));
      return sample;
    }
    return [];
  });

  const handleSaveAttendees = (newAttendees: PDAttendee[]) => {
    setCurrentAttendees(newAttendees);
    if (onUpdateWorkshop) {
      onUpdateWorkshop({
        ...workshop,
        attendees: newAttendees,
        attendanceCount: newAttendees.length
      });
    }
    setIsManageAttendeesOpen(false);
  };

  const handleSaveDrawnSignature = (signatureDataUrl: string) => {
    if (!signingAttendee) return;
    const updated = currentAttendees.map(a => {
      if (a.id === signingAttendee.id || (a.name === signingAttendee.name && !a.id)) {
        return {
          ...a,
          signatureStatus: 'تم التوقيع' as const,
          signatureImage: signatureDataUrl,
          signatureDate: new Date().toLocaleDateString('ar-QA')
        };
      }
      return a;
    });
    handleSaveAttendees(updated);
    setSigningAttendee(null);
  };

  const handlePrintAll = () => {
    setPrintMode('all');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintPage1Only = () => {
    setPrintMode('page1');
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode('all'), 1000);
    }, 150);
  };

  const signedCount = currentAttendees.filter(a => a.signatureStatus === 'تم التوقيع' || a.signatureStatus === 'حاضر' || a.signatureImage).length;
  const attendanceRate = currentAttendees.length > 0 ? Math.round((signedCount / currentAttendees.length) * 100) : 100;

  return (
    <div className={`single-workshop-report-container ${printMode === 'page1' ? 'print-page1-only' : ''}`} style={{ direction: 'rtl', background: '#F8FAFC', minHeight: '100vh', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif" }}>
      {/* Embedded Landscape Print Rules */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 landscape !important;
          margin: 6mm !important;
        }
        @media print {
          html, body {
            width: 297mm !important;
            height: 210mm !important;
            background: #ffffff !important;
            font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .single-workshop-report-container {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            display: block !important;
          }
          .print-page1-only #workshop-report-${workshop.id}-page-2,
          .print-page1-only .landscape-page-2-sheet {
            display: none !important;
          }
          .printable-report.landscape-report-sheet,
          .landscape-report-sheet {
            width: 285mm !important;
            max-width: 285mm !important;
            min-height: 198mm !important;
            height: 198mm !important;
            box-shadow: none !important;
            border: 1.5px solid #CBD5E1 !important;
            margin: 0 auto !important;
            padding: 6mm 10mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justifyContent: space-between !important;
            font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif !important;
          }
          .printable-report.landscape-report-sheet:last-child,
          .landscape-report-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}} />

      {/* Screen Toolbar (Hidden in Print) */}
      <div className="no-print" style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        background: '#fff', padding: '1rem 1.75rem', borderRadius: '18px', 
        border: '1px solid #E2E8F0', marginBottom: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
        width: '100%', maxWidth: '1120px', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#0F2044', color: '#fff', padding: '0.6rem', borderRadius: '12px' }}>
            <FileText size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#0F2044', fontSize: '1.05rem', fontWeight: 900 }}>
              معاينة التقرير الرسمي لورشة العمل الجماعية (A4 عرضي)
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
              الصفحة 1: التوثيق الأكاديمي والاعتمادات الرسمية | الصفحة 2: كشف الحضور والتواقيع المعتمدة
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {canEdit && (
            <button 
              onClick={() => setIsManageAttendeesOpen(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.4rem', 
                background: '#F1F5F9', color: '#0F2044', border: '1px solid #CBD5E1', 
                padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer',
                fontSize: '0.82rem'
              }}
            >
              <Users size={15} color="#00B4D8" /> كشف الحضور ({currentAttendees.length})
            </button>
          )}

          {/* Page 1 Only PDF (Single Page A4) */}
          <button 
            onClick={handleDownloadPage1Pdf}
            disabled={isGeneratingPdf}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', 
              background: '#0F2044', 
              color: '#fff', border: 'none', 
              padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(15,32,68,0.2)', fontSize: '0.82rem'
            }}
            title="تحميل صفحة 1 (التوثيق والاعتمادات الإدارية فقط) كملف PDF"
          >
            <Download size={15} /> {isGeneratingPdf ? 'جاري التحميل...' : 'حفظ صفحة 1 (A4 عرضي PDF)'}
          </button>

          {/* Complete 2-Pages PDF */}
          <button 
            onClick={handleDownloadAllPdf}
            disabled={isGeneratingPdf}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', 
              background: '#0284C7', 
              color: '#fff', border: 'none', 
              padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(2,132,199,0.25)', fontSize: '0.82rem'
            }}
            title="تحميل التقرير كاملاً (التوثيق + كشف وتواقيع الحضور) كملف PDF"
          >
            <Download size={15} /> {isGeneratingPdf ? 'جاري التحميل...' : 'حفظ التقرير كاملاً (A4 صفحتين PDF)'}
          </button>

          {/* Print Options */}
          <button 
            onClick={handlePrintPage1Only}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', 
              background: '#F8FAFC', 
              color: '#0F2044', border: '1px solid #CBD5E1', 
              padding: '0.55rem 0.9rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer',
              fontSize: '0.82rem'
            }}
            title="طباعة صفحة التوثيق والاعتمادات فقط"
          >
            <Printer size={15} /> طباعة صفحة 1
          </button>

          <button 
            onClick={handlePrintAll}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', 
              background: '#0F2044', 
              color: '#fff', border: 'none', 
              padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(15,32,68,0.2)', fontSize: '0.82rem'
            }}
            title="طباعة التقرير كاملاً (عرضي)"
          >
            <Printer size={15} /> طباعة الكل
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.3rem', 
                background: '#fff', color: '#64748B', border: '1px solid #E2E8F0', 
                padding: '0.55rem 0.9rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
                fontSize: '0.82rem'
              }}
            >
              <X size={15} /> إغلاق
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════════════
          PAGE 1: ACADEMIC & TECHNICAL DOCUMENTATION + ADMINISTRATIVE SIGNATURES
          ════════════════════════════════════════════════════════════════════════════════ */}
      <div className="no-print" style={{ 
        width: '1120px', margin: '0 auto 0.75rem', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#0F2044', color: '#fff', padding: '0.55rem 1.25rem', borderRadius: '10px',
        fontSize: '0.82rem', fontWeight: 800
      }}>
        <span>📄 الصفحة الأولى: التوثيق الأكاديمي والاعتمادات الإدارية الرسمية للورشة (A4 عرضي منسق)</span>
        <span style={{ color: '#38BDF8' }}>معتمد رسمياً من قسم المشاريع الإلكترونية والنائب الأكاديمي ومدير المدرسة</span>
      </div>

      <div 
        id={`workshop-report-${workshop.id}-page-1`}
        className="printable-report landscape-report-sheet"
        style={{ 
          background: '#ffffff', 
          width: '100%', 
          maxWidth: '1120px', 
          minHeight: '740px', 
          margin: '0 auto 2.5rem', 
          padding: '1.25rem 1.75rem', 
          borderRadius: '12px', 
          border: '1.5px solid #CBD5E1',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif"
        }}
      >
        {/* Official Header */}
        <OfficialReportHeader 
          title="تقرير توثيق ورشة عمل تدريبية (جماعية)"
          subtitle={workshop.titleAr || workshop.nameAr || ''}
          reportCode={workshop.id || `PD-${workshop.academicYear}-W${workshop.workshopNumber || '01'}`}
          academicYear={workshop.academicYear}
          reportDate={workshop.date}
        />

        {/* ─── 1. Workshop Meta Info Banner ─── */}
        <div style={{ 
          background: '#F8FAFC', 
          border: '1px solid #CBD5E1', 
          borderRadius: '10px', 
          padding: '0.5rem 0.85rem', 
          marginBottom: '0.55rem'
        }}>
          {/* Main Title Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '0.35rem', 
            borderBottom: '1px solid #E2E8F0', 
            paddingBottom: '0.35rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.02rem', 
                fontWeight: 900, 
                color: '#0F2044',
                fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif",
                lineHeight: 1.3,
                letterSpacing: 'normal'
              }}>
                {workshop.titleAr || workshop.nameAr}
              </h3>
              {(workshop.titleEn || workshop.nameEn) && (
                <bdi dir="ltr" style={{ 
                  fontSize: '0.74rem', 
                  color: '#0F2044', 
                  fontWeight: 700, 
                  background: '#F0F9FF',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid #BAE6FD',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  lineHeight: 1.2
                }}>
                  {workshop.titleEn || workshop.nameEn}
                </bdi>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, alignItems: 'center' }}>
              <span style={{ 
                background: '#EEF2FF', color: '#312E81', border: '1.5px solid #C7D2FE', 
                padding: '0.22rem 0.65rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.2,
                fontFamily: "'IBM Plex Sans Arabic', sans-serif"
              }}>
                {workshop.category || 'تطوير ذاتي'}
              </span>
              <span style={{ 
                background: '#ECFDF5', color: '#065F46', border: '1.5px solid #A7F3D0', 
                padding: '0.22rem 0.65rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.2,
                fontFamily: "'IBM Plex Sans Arabic', sans-serif"
              }}>
                {workshop.status || 'تم التنفيذ والاعتماد'}
              </span>
            </div>
          </div>

          {/* Key Facts Grid (5 Columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.45rem', fontSize: '0.74rem' }}>
            <div style={{ background: '#fff', padding: '0.35rem 0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '48px', boxSizing: 'border-box' }}>
              <span style={{ color: '#64748B', fontSize: '0.62rem', display: 'block', fontWeight: 700, marginBottom: '2px' }}>مقدم الورشة / المدرب:</span>
              <strong style={{ color: '#0F2044', fontSize: '0.76rem', display: 'block', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.25, fontWeight: 800 }}>
                {workshop.facilitatorName || workshop.trainer || 'غير محدد'}
              </strong>
            </div>

            <div style={{ background: '#fff', padding: '0.35rem 0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '48px', boxSizing: 'border-box' }}>
              <span style={{ color: '#64748B', fontSize: '0.62rem', display: 'block', fontWeight: 700, marginBottom: '2px' }}>الجهة المنظمة:</span>
              <strong style={{ color: '#0F2044', fontSize: '0.76rem', display: 'block', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.25, fontWeight: 800 }}>
                {workshop.organizerName || workshop.organizedBy || SCHOOL_NAME}
              </strong>
            </div>

            <div style={{ background: '#fff', padding: '0.35rem 0.55rem', borderRadius: '8px', border: '1px solid #BAE6FD', boxShadow: '0 1px 4px rgba(2,132,199,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '48px', boxSizing: 'border-box' }}>
              <span style={{ color: '#0284C7', fontSize: '0.62rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800, marginBottom: '2px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={11} color="#0284C7" /> مكان الانعقاد:
                </span>
                {canEdit && !isEditingVenue && (
                  <button 
                    onClick={() => setIsEditingVenue(true)}
                    className="no-print"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284C7', padding: '0 2px', fontSize: '0.7rem' }}
                    title="تعديل مكان الانعقاد"
                  >
                    ✎
                  </button>
                )}
              </span>
              {isEditingVenue ? (
                <div className="no-print" style={{ display: 'flex', gap: '0.25rem', marginTop: '0.2rem' }}>
                  <input
                    type="text"
                    value={venueInput}
                    onChange={e => setVenueInput(e.target.value)}
                    list="report-venue-datalist"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.35rem', borderRadius: '4px', border: '1px solid #0284C7', width: '100%', outline: 'none' }}
                    autoFocus
                  />
                  <datalist id="report-venue-datalist">
                    <option value="مدرسة قطر للعلوم والتكنولوجيا" />
                    <option value="قاعة الاجتماعات الرئيسية" />
                    <option value="مختبر الروبوت" />
                    <option value="مختبر الواقع الافتراضي (VR)" />
                    <option value="مسرح المدرسة" />
                    <option value="مختبر ستيم STEM" />
                    <option value="مختبر التصنيع الرقمي (FabLab)" />
                    <option value="مختبر الطاقة" />
                    <option value="قاعة المحاضرات" />
                    <option value="الصف الدراسي" />
                    <option value="عن بعد عبر Microsoft Teams" />
                  </datalist>
                  <button
                    onClick={() => {
                      handleUpdateVenue(venueInput);
                      setIsEditingVenue(false);
                    }}
                    style={{ background: '#0284C7', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.2rem 0.45rem', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700 }}
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setIsEditingVenue(false)}
                    style={{ background: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '4px', padding: '0.2rem 0.35rem', cursor: 'pointer', fontSize: '0.68rem' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <strong style={{ color: '#0F2044', fontSize: '0.76rem', display: 'block', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.25, fontWeight: 800 }}>
                  {workshop.venue || workshop.location || 'مقر المدرسة'}
                </strong>
              )}
            </div>

            <div style={{ background: '#fff', padding: '0.35rem 0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '48px', boxSizing: 'border-box' }}>
              <span style={{ color: '#64748B', fontSize: '0.62rem', display: 'block', fontWeight: 700, marginBottom: '2px' }}>التاريخ والساعات:</span>
              <strong style={{ color: '#0284C7', fontSize: '0.76rem', display: 'block', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.25, fontWeight: 800 }}>
                {workshop.date || workshop.month} ({workshop.hours} ساعات معتمدة)
              </strong>
            </div>

            <div style={{ background: '#fff', padding: '0.35rem 0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '48px', boxSizing: 'border-box' }}>
              <span style={{ color: '#64748B', fontSize: '0.62rem', display: 'block', fontWeight: 700, marginBottom: '2px' }}>الفئة المستهدفة:</span>
              <strong style={{ color: '#0F2044', fontSize: '0.76rem', display: 'block', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.25, fontWeight: 800 }}>
                {workshop.targetAudience || workshop.targetGroup || 'المعلمين'}
                {workshop.targetAudience === 'الطلاب' && workshop.targetClasses ? ` (${workshop.targetClasses})` : ''}
              </strong>
            </div>
          </div>
        </div>

        {/* ─── 2. Full-Width Pedagogical & Content Dashboard (3 Cards) ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '0.55rem' }}>
          {/* Objectives */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.55rem 0.75rem', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ 
              margin: '0 0 0.3rem', fontSize: '0.76rem', fontWeight: 900, color: '#0F2044', 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #00B4D8', paddingBottom: '0.2rem',
              fontFamily: "'IBM Plex Sans Arabic', sans-serif"
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Target size={13} color="#00B4D8" /> أهداف ومخرجات الورشة:
              </span>
              {canEdit && (
                <button
                  type="button"
                  className="no-print"
                  onClick={() => {
                    setContentForm({
                      objectives: workshop.objectives || '',
                      keyPoints: workshop.keyPoints || '',
                      recommendations: workshop.recommendations || ''
                    });
                    setIsEditingContent(true);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0284C7',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    padding: '0 0.2rem'
                  }}
                  title="تعديل الأهداف والمحاور والتوصيات"
                >
                  <Edit3 size={11} />
                </button>
              )}
            </h4>
            <div style={{ flex: 1 }}>
              <FormattedReportPoints
                text={workshop.objectives}
                defaultText="تمكين الكوادر المستهدفة من توظيف الأدوات الرقمية الحديثة وتعزيز تفعيل نظام قطر للتعليم والمنصات التفاعلية المعتمدة في البيئة التعليمية والمدرسية."
                bulletColor="#00B4D8"
                fontSize="0.67rem"
              />
            </div>
          </div>

          {/* Key Topics / What was discussed */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.55rem 0.75rem', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ 
              margin: '0 0 0.3rem', fontSize: '0.76rem', fontWeight: 900, color: '#0F2044', 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #10B981', paddingBottom: '0.2rem',
              fontFamily: "'IBM Plex Sans Arabic', sans-serif"
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Layers size={13} color="#10B981" /> المحاور والتدريب العملي (ما تم مناقشته):
              </span>
              {canEdit && (
                <button
                  type="button"
                  className="no-print"
                  onClick={() => {
                    setContentForm({
                      objectives: workshop.objectives || '',
                      keyPoints: workshop.keyPoints || '',
                      recommendations: workshop.recommendations || ''
                    });
                    setIsEditingContent(true);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#10B981',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    padding: '0 0.2rem'
                  }}
                  title="تعديل الأهداف والمحاور والتوصيات"
                >
                  <Edit3 size={11} />
                </button>
              )}
            </h4>
            <div style={{ flex: 1 }}>
              <FormattedReportPoints
                text={workshop.keyPoints}
                defaultText="شرح الميزات التقنية الحديثة، التطبيق العملي التفاعلي مع الحضور، إتاحة النقاش وطرح النماذج التطبيقية، وإصدار التوصيات العملية الفورية."
                bulletColor="#10B981"
                fontSize="0.67rem"
              />
            </div>
          </div>

          {/* Recommendations & Follow-up */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.55rem 0.75rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              fontWeight: 900, color: '#0F2044', fontSize: '0.76rem', marginBottom: '0.3rem', 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #F59E0B', paddingBottom: '0.2rem',
              fontFamily: "'IBM Plex Sans Arabic', sans-serif"
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={13} color="#F59E0B" /> التوصيات ومخرجات المتابعة:
              </span>
              {canEdit && (
                <button
                  type="button"
                  className="no-print"
                  onClick={() => {
                    setContentForm({
                      objectives: workshop.objectives || '',
                      keyPoints: workshop.keyPoints || '',
                      recommendations: workshop.recommendations || ''
                    });
                    setIsEditingContent(true);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#D97706',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    padding: '0 0.2rem'
                  }}
                  title="تعديل الأهداف والمحاور والتوصيات"
                >
                  <Edit3 size={11} />
                </button>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <FormattedReportPoints
                text={workshop.recommendations}
                defaultText="المتابعة الميدانية لأثر التدريب وتوثيق تفعيل المهارات الرقمية عبر نظام قطر للتعليم والمنصات التعليمية المعتمدة لضمان استدامة الأثر."
                bulletColor="#F59E0B"
                fontSize="0.67rem"
              />
            </div>
          </div>
        </div>

        {/* ─── 3. Operational Indicators Strip ─── */}
        <div style={{
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: '8px',
          padding: '0.35rem 0.75rem',
          marginBottom: '0.55rem',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.4rem',
          fontSize: '0.70rem',
          fontFamily: "'IBM Plex Sans Arabic', sans-serif"
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <span style={{ color: '#0369A1', fontWeight: 700 }}>إجمالي المسجلين: </span>
            <strong style={{ color: '#0F2044', fontSize: '0.76rem', fontWeight: 900 }}>{currentAttendees.length} مشارك</strong>
          </div>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <span style={{ color: '#0369A1', fontWeight: 700 }}>مكان الانعقاد: </span>
            <strong style={{ color: '#0284C7', fontSize: '0.76rem', fontWeight: 900 }}>📍 {workshop.venue || workshop.location || 'مقر المدرسة'}</strong>
          </div>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <span style={{ color: '#0369A1', fontWeight: 700 }}>التواقيع المعتمدة: </span>
            <strong style={{ color: '#059669', fontSize: '0.76rem', fontWeight: 900 }}>{signedCount} من {currentAttendees.length} ({attendanceRate}%)</strong>
          </div>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <span style={{ color: '#0369A1', fontWeight: 700 }}>الساعات المعتمدة: </span>
            <strong style={{ color: '#0F2044', fontSize: '0.76rem', fontWeight: 900 }}>{workshop.hours} ساعات</strong>
          </div>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <span style={{ color: '#0369A1', fontWeight: 700 }}>طريقة التقديم: </span>
            <strong style={{ color: '#0F2044', fontSize: '0.76rem', fontWeight: 900 }}>{workshop.deliveryMethod || 'حضوري تفاعلي'}</strong>
          </div>
        </div>

        {/* ─── 4. OFFICIAL SIGNATURES & ENDORSEMENTS BLOCK (الصفحة الأولى) ─── */}
        <div style={{ 
          marginTop: 'auto', 
          paddingTop: '0.45rem', 
          borderTop: '1.5px solid #0F2044',
          pageBreakInside: 'avoid',
          fontFamily: "'IBM Plex Sans Arabic', sans-serif"
        }}>
          <h5 style={{ 
            fontSize: '0.72rem', fontWeight: 900, color: '#0F2044', 
            textAlign: 'center', margin: '0 0 0.35rem', letterSpacing: 'normal' 
          }}>
            الاعتمادات والتوقيعات الإدارية والأكاديمية المعتمدة
          </h5>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.55rem', textAlign: 'center' }}>
            {/* 1. Facilitator / Trainer */}
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.35rem 0.4rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ fontWeight: 800, margin: '0 0 0.15rem', fontSize: '0.68rem', color: '#0F2044', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.15rem', width: '100%', textAlign: 'center' }}>
                مقدم الورشة / المدرب
              </p>
              <div style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'serif' }}>
                  ............................................
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 900, color: '#0F2044', textAlign: 'center' }}>
                {workshop.facilitatorName || workshop.trainer || 'المدرب'}
              </p>
            </div>

            {/* 2. E-Projects Coordinator: Eng. Ahmad Tubaishat */}
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.35rem 0.4rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ fontWeight: 800, margin: '0 0 0.15rem', fontSize: '0.68rem', color: '#0F2044', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.15rem', width: '100%', textAlign: 'center' }}>
                منسق المشاريع والتطوير المهني
              </p>
              <div style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/signature-ahmad.png" 
                  alt="توقيع م. أحمد طبيشات" 
                  style={{ height: '32px', objectFit: 'contain', margin: '0 auto', display: 'block' }} 
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 900, color: '#0F2044', textAlign: 'center' }}>
                م. أحمد عادل طبيشات
              </p>
              <span style={{ fontSize: '0.60rem', color: '#64748B', textAlign: 'center' }}>منسق المشاريع الإلكترونية</span>
            </div>

            {/* 3. Academic Vice Principal: Dr. Rani Toum */}
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.35rem 0.4rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ fontWeight: 800, margin: '0 0 0.15rem', fontSize: '0.68rem', color: '#0F2044', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.15rem', width: '100%', textAlign: 'center' }}>
                النائب الأكاديمي
              </p>
              <div style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/signature-rani.png" 
                  alt="توقيع د. راني التوم" 
                  style={{ height: '32px', objectFit: 'contain', margin: '0 auto', display: 'block' }} 
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 900, color: '#0F2044', textAlign: 'center' }}>
                د. راني التوم
              </p>
              <span style={{ fontSize: '0.60rem', color: '#64748B', textAlign: 'center' }}>النائب الأكاديمي للمدرسة</span>
            </div>

            {/* 4. School Principal */}
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.35rem 0.4rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ fontWeight: 800, margin: '0 0 0.15rem', fontSize: '0.68rem', color: '#0F2044', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.15rem', width: '100%', textAlign: 'center' }}>
                مدير المدرسة
              </p>
              <div style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/principal-signature.png" 
                  alt="توقيع مدير المدرسة" 
                  style={{ height: '32px', objectFit: 'contain', margin: '0 auto', display: 'block' }} 
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 900, color: '#0F2044', textAlign: 'center' }}>
                محمد علي مندني العمادي
              </p>
              <span style={{ fontSize: '0.60rem', color: '#64748B', textAlign: 'center' }}>مدير المدرسة</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════════════
          PAGE 2: ATTENDANCE ROSTER & DIGITAL DRAWN SIGNATURES (صفحة منفصلة)
          ════════════════════════════════════════════════════════════════════════════════ */}
      <div className="no-print" style={{ 
        width: '1120px', margin: '0 auto 0.75rem', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#0284C7', color: '#fff', padding: '0.55rem 1.25rem', borderRadius: '10px',
        fontSize: '0.82rem', fontWeight: 800
      }}>
        <span>📄 الصفحة الثانية: كشف حضور وتواقيع المشاركين الفعلية (مع خاصية التوقيع بالرسم Draw)</span>
        <span style={{ color: '#E0F2FE' }}>إجمالي الموقعين: {signedCount} من أصل {currentAttendees.length} مشارك ({attendanceRate}%)</span>
      </div>

      {/* ── ATTENDANCE PAGES (one per 15 attendees on print, all visible on screen) ── */}
      {(() => {
        const ROWS_PER_PAGE = 15;
        const totalPages = Math.max(1, Math.ceil(currentAttendees.length / ROWS_PER_PAGE));
        const pages = Array.from({ length: totalPages }, (_, pi) =>
          currentAttendees.slice(pi * ROWS_PER_PAGE, (pi + 1) * ROWS_PER_PAGE)
        );

        // Table header row (reused on every page)
        const tableHead = (
          <thead>
            <tr style={{ background: '#0F2044', color: '#ffffff' }}>
              <th style={{ padding: '0.5rem 0.4rem', width: '34px', textAlign: 'center', fontWeight: 900, borderLeft: '1px solid rgba(255,255,255,0.15)' }}>#</th>
              <th style={{ padding: '0.5rem 0.8rem', textAlign: 'right', fontWeight: 900, borderLeft: '1px solid rgba(255,255,255,0.15)' }}>اسم المعلم / المشارك</th>
              <th style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 900, borderLeft: '1px solid rgba(255,255,255,0.15)', width: '140px' }}>القسم الأكاديمي</th>
              <th style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 900, borderLeft: '1px solid rgba(255,255,255,0.15)', width: '120px' }}>المسمى الوظيفي</th>
              <th style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 900, borderLeft: '1px solid rgba(255,255,255,0.15)', width: '120px' }}>حالة الحضور</th>
              <th style={{ padding: '0.5rem 0.8rem', textAlign: 'center', fontWeight: 900, width: '230px', background: '#0B1730' }}>
                ✍️ التوقيع الفعلي للمعلم (Actual Drawn Signature)
              </th>
            </tr>
          </thead>
        );

        // Endorsement strip (shown only on last page)
        const endorsementStrip = (
          <div style={{
            marginTop: 'auto',
            paddingTop: '0.5rem',
            borderTop: '1.5px solid #0F2044',
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',
            alignItems: 'center'
          }}>
            <div style={{ width: '220px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.35rem 0.5rem', background: '#fff', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.66rem', color: '#64748B', fontWeight: 800, display: 'block', marginBottom: '2px', textAlign: 'center' }}>
                تدقيق واعتماد منسق المشاريع
              </span>
              <img src="/signature-ahmad.png" alt="توقيع م. أحمد طبيشات" style={{ height: '30px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
              <span style={{ fontSize: '0.70rem', fontWeight: 900, color: '#0F2044', display: 'block', textAlign: 'center' }}>م. أحمد عادل طبيشات</span>
            </div>
            <div style={{ width: '220px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.35rem 0.5rem', background: '#fff', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.66rem', color: '#64748B', fontWeight: 800, display: 'block', marginBottom: '2px', textAlign: 'center' }}>
                اعتماد النائب الأكاديمي
              </span>
              <img src="/signature-rani.png" alt="توقيع د. راني التوم" style={{ height: '30px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
              <span style={{ fontSize: '0.70rem', fontWeight: 900, color: '#0F2044', display: 'block', textAlign: 'center' }}>د. راني التوم</span>
            </div>
          </div>
        );

        return pages.map((pageAttendees, pi) => {
          const isLastPage = pi === totalPages - 1;
          const pageLabel = totalPages > 1 ? ` (${pi + 1}/${totalPages})` : '';

          return (
            <div
              key={`attendance-page-${pi}`}
              id={`workshop-report-${workshop.id}-page-2-${pi}`}
              className="printable-report landscape-report-sheet landscape-page-2-sheet"
              style={{
                background: '#ffffff',
                width: '100%',
                maxWidth: '1120px',
                minHeight: '740px',
                margin: pi === 0 ? '0 auto' : '1.5rem auto 0',
                padding: '1.25rem 1.75rem',
                borderRadius: '12px',
                border: '1.5px solid #CBD5E1',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                boxSizing: 'border-box' as const,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'space-between',
                fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif",
                pageBreakAfter: isLastPage ? 'auto' : 'always',
                breakAfter: isLastPage ? 'auto' : 'page',
              }}
            >
              {/* Official Header on every page */}
              <OfficialReportHeader
                title={`كشف حضور وتوقيع المشاركين في الورشة التدريبية${pageLabel}`}
                subtitle=""
                reportCode={workshop.id || `PD-${workshop.academicYear}-W${workshop.workshopNumber || '01'}`}
                academicYear={workshop.academicYear}
                reportDate={workshop.date}
              />

              {/* Quick Context & Summary Banner (only on first page) */}
              {pi === 0 && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '0.55rem 0.9rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.76rem', flexWrap: 'wrap' }}>
                    <span>اسم الورشة: <strong style={{ color: '#0F2044', fontSize: '0.82rem' }}>{workshop.titleAr || workshop.nameAr}</strong></span>
                    <span>التاريخ: <strong style={{ color: '#0F2044' }}>{workshop.date || workshop.month}</strong></span>
                    {workshop.targetAudience === 'الطلاب' && workshop.targetClasses && (
                      <>
                        <span style={{ color: '#CBD5E1' }}>•</span>
                        <span>الصفوف المستهدفة: <strong style={{ color: '#0F2044' }}>{workshop.targetClasses}</strong></span>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      background: '#EEF2FF', color: '#312E81', border: '1.5px solid #C7D2FE',
                      padding: '0.22rem 0.7rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.2
                    }}>
                      إجمالي المشاركين: {currentAttendees.length}
                    </span>
                    <span style={{
                      background: '#ECFDF5', color: '#065F46', border: '1.5px solid #A7F3D0',
                      padding: '0.22rem 0.7rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.2
                    }}>
                      نسبة اكتمال التواقيع: {attendanceRate}%
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsManageAttendeesOpen(true)}
                        className="no-print"
                        style={{
                          background: '#0F2044', color: '#fff', border: 'none', borderRadius: '6px',
                          padding: '0.25rem 0.75rem', fontSize: '0.72rem', fontWeight: 800,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                        }}
                      >
                        <Plus size={13} /> إضافة مشارك
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Attendance Table for this page slice */}
              <div style={{
                flex: 1,
                border: '1.5px solid #0F2044',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '0.85rem'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  {tableHead}
                  <tbody>
                    {pageAttendees.map((att, relIdx) => {
                      const idx = pi * ROWS_PER_PAGE + relIdx;
                      return (
                        <tr key={att.id || idx} style={{
                          borderBottom: '1px solid #E2E8F0',
                          background: relIdx % 2 === 0 ? '#fff' : '#F8FAFC'
                        }}>
                          <td style={{ padding: '0.4rem 0.4rem', textAlign: 'center', color: '#64748B', fontWeight: 800, borderLeft: '1px solid #E2E8F0' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '0.4rem 0.8rem', fontWeight: 900, color: '#0F2044', borderLeft: '1px solid #E2E8F0' }}>
                            {att.name}
                          </td>
                          <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', borderLeft: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                            <span style={{
                              background: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: '4px',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.2, fontSize: '0.68rem'
                            }}>
                              {att.department || 'عام'}
                            </span>
                          </td>
                          <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', borderLeft: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.70rem' }}>
                            {att.jobTitle || 'معلم'}
                          </td>
                          <td style={{ padding: '0.35rem 0.5rem', textAlign: 'center', borderLeft: '1px solid #E2E8F0' }}>
                            <span style={{
                              background: '#D1FAE5', color: '#065F46',
                              padding: '0.18rem 0.55rem', borderRadius: '5px', fontSize: '0.66rem', fontWeight: 800,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.2, gap: '0.25rem'
                            }}>
                              <CheckCircle2 size={11} /> {att.signatureStatus === 'تم التوقيع' || att.signatureImage ? 'حاضر وموقّع' : 'حاضر ومشارك'}
                            </span>
                          </td>
                          <td style={{ padding: '0.35rem 0.6rem', textAlign: 'center', background: att.signatureImage ? '#F0FDF4' : '#FAFBFD' }}>
                            {att.signatureImage ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <img
                                  src={att.signatureImage}
                                  alt={`توقيع ${att.name}`}
                                  className="no-print"
                                  style={{ height: '34px', maxWidth: '140px', objectFit: 'contain', display: 'block' }}
                                />
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => setSigningAttendee(att)}
                                    className="no-print"
                                    style={{ fontSize: '0.6rem', color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                                  >
                                    إعادة التوقيع ✍️
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => setSigningAttendee(att)}
                                  className="no-print"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                    background: '#0F2044', color: '#fff', border: 'none',
                                    padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.7rem',
                                    fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,32,68,0.15)'
                                  }}
                                >
                                  <Edit3 size={12} /> ✍️ توقيع بالرسم (Draw)
                                </button>
                                <div className="print-only" style={{
                                  border: '1.5px dashed #CBD5E1', borderRadius: '4px', height: '28px', width: '100%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#94A3B8', fontSize: '0.66rem'
                                }}>
                                  توقيع الحاضر: ........................
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Fill blank rows only on last page if fewer than 8 total */}
                    {isLastPage && currentAttendees.length < 8 && Array.from({ length: 8 - currentAttendees.length }).map((_, i) => (
                      <tr key={`blank-${i}`} style={{ borderBottom: '1px solid #E2E8F0', height: '36px', background: '#fff' }}>
                        <td style={{ padding: '0.25rem', textAlign: 'center', color: '#CBD5E1', borderLeft: '1px solid #E2E8F0' }}>{currentAttendees.length + i + 1}</td>
                        <td style={{ borderLeft: '1px solid #E2E8F0' }}></td>
                        <td style={{ borderLeft: '1px solid #E2E8F0' }}></td>
                        <td style={{ borderLeft: '1px solid #E2E8F0' }}></td>
                        <td style={{ borderLeft: '1px solid #E2E8F0', textAlign: 'center', color: '#CBD5E1', fontSize: '0.68rem' }}>حاضر</td>
                        <td style={{ padding: '0.25rem 0.6rem' }}>
                          <div style={{ border: '1px dashed #E2E8F0', borderRadius: '4px', height: '24px' }}></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Endorsement strip on every page */}
              {endorsementStrip}
            </div>
          );
        });
      })()}

      {/* Attendees Management Modal */}
      {isManageAttendeesOpen && (
        <ManageAttendeesModal 
          currentAttendees={currentAttendees}
          teachers={teachers}
          departments={departments}
          onSave={handleSaveAttendees}
          onClose={() => setIsManageAttendeesOpen(false)}
        />
      )}

      {/* Interactive Signature Pad Modal for Attendee Drawing */}
      {signingAttendee && (
        <SignaturePadModal 
          isOpen={!!signingAttendee}
          attendeeName={signingAttendee.name}
          workshopTitle={workshop.titleAr || workshop.nameAr || ''}
          onSave={handleSaveDrawnSignature}
          onClose={() => setSigningAttendee(null)}
        />
      )}

      {/* Quick Edit Modal for Objectives, Topics, Recommendations */}
      {isEditingContent && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,32,68,0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            padding: '1rem'
          }}
          onClick={() => setIsEditingContent(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '750px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: '1.75rem 2rem',
              direction: 'rtl'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#00B4D8" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F2044' }}>
                  تحرير الأهداف والمحاور والتوصيات بالرموز والنقاط
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingContent(false)}
                style={{ background: '#FEE2E2', border: 'none', borderRadius: '8px', padding: '0.35rem', color: '#EF4444', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <RichBulletTextarea
                label="أهداف ومخرجات الورشة"
                value={contentForm.objectives}
                onChange={val => setContentForm(f => ({ ...f, objectives: val }))}
                colorTheme="teal"
                rows={4}
                placeholder="اكتب الأهداف التعليمية أو استخدم أزرار الرموز بالأعلى (•، ✓، 🔹، ⭐، 📌)..."
              />

              <RichBulletTextarea
                label="المحاور الرئيسية والتدريب العملي (ما تم مناقشته)"
                value={contentForm.keyPoints}
                onChange={val => setContentForm(f => ({ ...f, keyPoints: val }))}
                colorTheme="emerald"
                rows={4}
                placeholder="اكتب ما تم مناقشته والمحاور المطروحة..."
              />

              <RichBulletTextarea
                label="التوصيات ومخرجات المتابعة"
                value={contentForm.recommendations}
                onChange={val => setContentForm(f => ({ ...f, recommendations: val }))}
                colorTheme="amber"
                rows={4}
                placeholder="التوصيات والخطوات التطبيقية التالية..."
              />
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsEditingContent(false)}
                style={{ padding: '0.75rem 1.75rem', borderRadius: '12px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: 800, cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveContent}
                style={{ padding: '0.75rem 2.5rem', background: '#0F2044', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}
              >
                حفظ وتحديث التقرير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single Individual PD Report Component ─────────────────────────────────────
interface SingleIndividualPDReportProps {
  record: IndividualPDRecord;
  onClose?: () => void;
  canEdit?: boolean;
}

export function SingleIndividualPDReport({ record, onClose, canEdit }: SingleIndividualPDReportProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<IndividualPDRecord>(record);
  const [isSigningOpen, setIsSigningOpen] = useState(false);

  const handleSaveDrawnSignature = (signatureDataUrl: string) => {
    setCurrentRecord(prev => ({
      ...prev,
      signatureImage: signatureDataUrl,
      signatureDate: new Date().toLocaleDateString('ar-QA')
    }));
    setIsSigningOpen(false);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadReportAsPdf(`ind-report-${currentRecord.id}`, `تقرير_تدريب_فردي_${currentRecord.traineeNameAr}_${currentRecord.month}_${currentRecord.academicYear}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="single-ind-report-container" style={{ direction: 'rtl', background: '#F8FAFC', minHeight: '100vh', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif" }}>
      {/* Embedded Landscape Print Rules */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 landscape !important;
          margin: 6mm !important;
        }
        @media print {
          html, body {
            width: 297mm !important;
            height: 210mm !important;
            background: #ffffff !important;
            font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .single-ind-report-container {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            display: block !important;
          }
          .printable-report.landscape-report-sheet,
          .landscape-report-sheet {
            width: 285mm !important;
            max-width: 285mm !important;
            min-height: 198mm !important;
            height: 198mm !important;
            box-shadow: none !important;
            border: 1.5px solid #CBD5E1 !important;
            margin: 0 auto !important;
            padding: 6mm 10mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justifyContent: space-between !important;
            font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif !important;
          }
        }
      `}} />

      {/* Screen Toolbar */}
      <div className="no-print" style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        background: '#fff', padding: '1rem 1.75rem', borderRadius: '18px', 
        border: '1px solid #E2E8F0', marginBottom: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
        width: '100%', maxWidth: '1120px', flexWrap: 'wrap', gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#0284C7', color: '#fff', padding: '0.6rem', borderRadius: '12px' }}>
            <Award size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#0F2044', fontSize: '1.05rem', fontWeight: 900 }}>
              سجل جلسة التطوير والتمكين المهني الفردي (A4 عرضي رسمي)
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
              معتمد للتوثيق الأكاديمي، كشف المهارات المكتسبة، والتواقيع الإلكترونية للمستفيد والمنسق والإدارة
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          {canEdit && (
            <button 
              onClick={() => setIsSigningOpen(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.4rem', 
                background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', 
                padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer',
                fontSize: '0.82rem'
              }}
            >
              <UserCheck size={16} color="#16A34A" /> التوقيع بالرسم (Draw)
            </button>
          )}

          <button 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', 
              background: '#0284C7', color: '#fff', border: 'none', 
              padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: 800, cursor: isGeneratingPdf ? 'wait' : 'pointer',
              boxShadow: '0 3px 10px rgba(2,132,199,0.25)', fontSize: '0.82rem'
            }}
          >
            <Download size={17} /> {isGeneratingPdf ? 'جاري التحميل...' : 'حفظ كملف PDF'}
          </button>

          <button 
            onClick={handlePrint}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', 
              background: '#0F2044', color: '#fff', border: 'none', 
              padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer',
              fontSize: '0.82rem'
            }}
          >
            <Printer size={17} /> طباعة التقرير (عرضي)
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.4rem', 
                background: '#fff', color: '#64748B', border: '1px solid #E2E8F0', 
                padding: '0.6rem 1.1rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <X size={17} /> إغلاق
            </button>
          )}
        </div>
      </div>

      {/* Printable Sheet (Landscape A4 Form Factor) */}
      <div 
        id={`ind-report-${currentRecord.id}`}
        className="printable-report landscape-report-sheet"
        style={{ 
          background: '#ffffff', 
          width: '100%', 
          maxWidth: '1120px', 
          minHeight: '740px', 
          margin: '0 auto', 
          padding: '1.25rem 1.75rem', 
          borderRadius: '12px', 
          border: '1.5px solid #CBD5E1',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif"
        }}
      >
        {/* Official Header */}
        <OfficialReportHeader 
          title="سجل توثيق جلسة تدريب وتمكين رقمي (فردي)"
          subtitle={`المعلم المستفيد: ${record.traineeNameAr}`}
          reportCode={record.id || 'IND-PD-2627'}
          academicYear={record.academicYear}
          reportDate={record.trainingDate}
        />

        {/* ─── 1. Trainee & Session Identity Banner ─── */}
        <div style={{ 
          background: '#F0F9FF', 
          border: '1px solid #BAE6FD', 
          borderRadius: '10px', 
          padding: '0.65rem 1rem', 
          marginBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', borderBottom: '1px solid #BAE6FD', paddingBottom: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div 
                className="text-white print-header-badge"
                style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)', 
                  color: '#ffffff !important', 
                  WebkitTextFillColor: '#ffffff !important',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '1.2rem', fontWeight: 900,
                  boxShadow: '0 2px 6px rgba(15,32,68,0.18)' 
                }}
              >
                {record.traineeNameAr.charAt(0)}
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: '#0284C7', fontWeight: 800 }}>المعلم / الموظف المستفيد:</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F2044' }}>
                  {record.traineeNameAr}
                </h3>
              </div>
              <div style={{ marginRight: '1.5rem' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>القسم الأكاديمي:</span>
                <strong style={{ display: 'block', color: '#0284C7', fontSize: '0.88rem' }}>{record.department}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ 
                background: '#EEF2FF', 
                color: '#312E81', 
                border: '1.5px solid #C7D2FE', 
                padding: '0.22rem 0.75rem', 
                borderRadius: '6px', 
                fontSize: '0.70rem', 
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                lineHeight: 1.2,
                gap: '0.3rem'
              }}>
                <Sparkles size={12} color="#4F46E5" />
                {record.trainingType || 'تدريب فردي مباشر'}
              </span>
              <span style={{ 
                background: '#ECFDF5', 
                color: '#065F46', 
                border: '1.5px solid #A7F3D0', 
                padding: '0.22rem 0.75rem', 
                borderRadius: '6px', 
                fontSize: '0.70rem', 
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                lineHeight: 1.2,
                gap: '0.3rem'
              }}>
                <Clock size={12} color="#059669" />
                المدة: {record.durationMinutes} دقيقة
              </span>
            </div>
          </div>

          {/* Details 4-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', fontSize: '0.74rem' }}>
            <div style={{ background: '#fff', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #BAE6FD', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <span style={{ color: '#475569', fontSize: '0.64rem', display: 'block', fontWeight: 700 }}>المهارة / الأداة الرقمية:</span>
              <strong style={{ color: '#0369A1', fontSize: '0.80rem' }}>{record.skillProvided}</strong>
            </div>

            <div style={{ background: '#fff', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #BAE6FD', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <span style={{ color: '#475569', fontSize: '0.64rem', display: 'block', fontWeight: 700 }}>تصنيف المهارة:</span>
              <strong style={{ color: '#0F2044', fontSize: '0.80rem' }}>{record.skillCategory}</strong>
            </div>

            <div style={{ background: '#fff', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #BAE6FD', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <span style={{ color: '#475569', fontSize: '0.64rem', display: 'block', fontWeight: 700 }}>تاريخ الجلسة:</span>
              <strong style={{ color: '#0F2044', fontSize: '0.80rem' }}>{record.trainingDate} ({record.month})</strong>
            </div>

            <div style={{ background: '#fff', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #BAE6FD', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <span style={{ color: '#475569', fontSize: '0.64rem', display: 'block', fontWeight: 700 }}>طريقة التقديم:</span>
              <strong style={{ color: '#059669', fontSize: '0.80rem' }}>{record.deliveryMethod || 'دعم مباشر'}</strong>
            </div>
          </div>
        </div>

        {/* ─── 2. Landscape Two-Column Dashboard (Pedagogical Content + Attendee Acknowledgement & Signatures) ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '1rem', marginBottom: '0.85rem' }}>
          {/* Right Column: Training Content & Outcomes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.75rem 0.9rem', background: '#fff' }}>
              <h4 style={{ 
                margin: '0 0 0.45rem', fontSize: '0.82rem', fontWeight: 900, color: '#0F2044', 
                borderBottom: '2px solid #00B4D8', paddingBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' 
              }}>
                <Sparkles size={14} color="#00B4D8" /> مخرجات جلسة التمكين والمهارات المقدمة:
              </h4>
              <ul style={{ margin: 0, paddingRight: '1.2rem', fontSize: '0.73rem', color: '#334155', lineHeight: 1.6 }}>
                <li>تمكين المعلم من الاستخدام المتقن للأداة الرقمية (<strong>{record.skillProvided}</strong>) وربطها بالتدريس الصفي.</li>
                <li>تطبيق ممارسات التعليم الإلكتروني المعتمدة من وزارة التربية والتعليم والتعليم العالي.</li>
                <li>مراجعة تفعيل نظام قطر للتعليم والمنصات التفاعلية وحل التحديات التقنية التي تواجه المعلم.</li>
                <li>تحسين كفاءة إعداد المحتوى التعليمي التفاعلي والتقييمات الرقمية ومتابعة أداء الطلاب.</li>
              </ul>
            </div>

            {record.notes && (
              <div style={{ background: '#F8FAFC', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontWeight: 800, color: '#0F2044', fontSize: '0.72rem', display: 'block', marginBottom: '0.2rem' }}>ملاحظات المدرب وتوصيات الاستمرار:</span>
                <FormattedReportPoints text={record.notes} bulletColor="#0284C7" fontSize="0.70rem" />
              </div>
            )}
          </div>

          {/* Left Column: Trainee Acknowledgement & Designated Signature Space */}
          <div style={{ 
            border: '1.5px solid #0F2044', 
            borderRadius: '10px', 
            padding: '0.85rem 1rem', 
            background: '#FAFBFD'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1.5px solid #0F2044', paddingBottom: '0.35rem' }}>
              <Award size={16} color="#0F2044" />
              <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 900, color: '#0F2044' }}>
                إقرار وتوقيع المعلم الحاضر (المستفيد من التدريب)
              </h4>
            </div>

            <p style={{ 
              fontSize: '0.73rem', color: '#1E293B', lineHeight: 1.5, margin: '0 0 0.75rem',
              background: '#F1F5F9', padding: '0.65rem 0.9rem', borderRadius: '8px', borderRight: '4px solid #00B4D8' 
            }}>
              « أقر أنا المعلم الوارد اسمه وبياناته أعلاه بحضوري جلسة التدريب والتمكين الرقمي الفردي واستفادتي الكاملة من المهارات والأدوات الرقمية الموضحة في هذا التقرير، والالتزام بتطبيقها لدعم العملية التعليمية ومنصات التعلم المعتمدة بمدرسة قطر للعلوم والتكنولوجيا. »
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.74rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>اسم المعلم الحاضر: </span>
                  <strong style={{ color: '#0F2044' }}>{record.traineeNameAr}</strong>
                </div>
                <div style={{ fontSize: '0.74rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>القسم: </span>
                  <strong style={{ color: '#0F2044' }}>{record.department}</strong>
                </div>
                <div style={{ fontSize: '0.74rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>تاريخ الجلسة: </span>
                  <strong style={{ color: '#0F2044' }}>{record.trainingDate}</strong>
                </div>
              </div>

              {/* DESIGNATED ATTENDEE SIGNATURE BOX */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0F2044' }}>
                    ✍️ توقيع المعلم الحاضر:
                  </span>
                  <button
                    type="button"
                    className="no-print"
                    onClick={() => setIsSigningOpen(true)}
                    style={{
                      border: '1px solid #0284C7',
                      background: '#F0F9FF',
                      color: '#0284C7',
                      borderRadius: '6px',
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Edit3 size={11} /> {currentRecord.signatureImage ? 'إعادة التوقيع' : '✍️ توقيع بالرسم'}
                  </button>
                </div>
                <div style={{ 
                  border: '1.5px dashed #0F2044', 
                  borderRadius: '8px', 
                  minHeight: '52px', 
                  background: '#fff', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '0.35rem'
                }}>
                  {currentRecord.signatureImage ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <img 
                        src={currentRecord.signatureImage} 
                        alt={`توقيع ${currentRecord.traineeNameAr}`} 
                        style={{ height: '36px', maxWidth: '140px', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <>
                      <span style={{ 
                        color: '#065F46', background: '#D1FAE5', padding: '0.15rem 0.6rem', 
                        borderRadius: '4px', fontSize: '0.64rem', fontWeight: 800, marginBottom: '2px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.2
                      }}>
                        ✓ تم توثيق واعتماد الحضور إلكترونياً
                      </span>
                      <span style={{ fontSize: '0.64rem', color: '#64748B', fontStyle: 'italic' }}>
                        توقيع المعلم المستفيد: {currentRecord.traineeNameAr}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. TRAINER & OFFICIAL ENDORSEMENTS BLOCK ─── */}
        <div style={{ 
          marginTop: '0.75rem', 
          paddingTop: '0.55rem', 
          borderTop: '1.5px solid #0F2044',
          pageBreakInside: 'avoid'
        }}>
          <h5 style={{ 
            fontSize: '0.72rem', fontWeight: 900, color: '#64748B', 
            textAlign: 'center', margin: '0 0 0.45rem', letterSpacing: 'normal',
            fontFamily: "'IBM Plex Sans Arabic', sans-serif"
          }}>
            التوقيعات والاعتمادات الإدارية والأكاديمية المعتمدة
          </h5>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            {/* 1. Trainer / Coach */}
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.35rem 0.35rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ fontWeight: 800, margin: '0 0 0.2rem', fontSize: '0.70rem', color: '#0F2044', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.15rem', width: '100%', textAlign: 'center' }}>
                توقيع المدرب ومقدم الدعم
              </p>
              <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: '#0369A1', fontWeight: 800, fontFamily: 'serif' }}>
                  {record.trainerName}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, color: '#0F2044', textAlign: 'center' }}>
                {record.trainerName}
              </p>
              <span style={{ fontSize: '0.62rem', color: '#64748B', textAlign: 'center' }}>{record.trainerRole || 'منسق التمكين الرقمي'}</span>
            </div>

            {/* 2. E-Projects Coordinator: Eng. Ahmad Tubaishat */}
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.35rem 0.35rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ fontWeight: 800, margin: '0 0 0.2rem', fontSize: '0.70rem', color: '#0F2044', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.15rem', width: '100%', textAlign: 'center' }}>
                اعتماد منسق المشاريع
              </p>
              <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/signature-ahmad.png" 
                  alt="توقيع م. أحمد طبيشات" 
                  style={{ height: '36px', objectFit: 'contain', margin: '0 auto', display: 'block' }} 
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, color: '#0F2044', textAlign: 'center' }}>
                م. أحمد عادل طبيشات
              </p>
              <span style={{ fontSize: '0.62rem', color: '#64748B', textAlign: 'center' }}>منسق المشاريع الإلكترونية</span>
            </div>

            {/* 3. Academic Vice Principal: Dr. Rani Toum */}
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.35rem 0.35rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ fontWeight: 800, margin: '0 0 0.2rem', fontSize: '0.70rem', color: '#0F2044', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.15rem', width: '100%', textAlign: 'center' }}>
                اعتماد النائب الأكاديمي
              </p>
              <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/signature-rani.png" 
                  alt="توقيع د. راني التوم" 
                  style={{ height: '36px', objectFit: 'contain', margin: '0 auto', display: 'block' }} 
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, color: '#0F2044', textAlign: 'center' }}>
                د. راني التوم
              </p>
              <span style={{ fontSize: '0.62rem', color: '#64748B', textAlign: 'center' }}>النائب الأكاديمي للمدرسة</span>
            </div>

            {/* 4. School Principal */}
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.35rem 0.35rem', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ fontWeight: 800, margin: '0 0 0.2rem', fontSize: '0.70rem', color: '#0F2044', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.15rem', width: '100%', textAlign: 'center' }}>
                اعتماد مدير المدرسة
              </p>
              <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/principal-signature.png" 
                  alt="محمد علي مندني العمادي" 
                  style={{ height: '34px', objectFit: 'contain', margin: '0 auto', display: 'block' }} 
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, color: '#0F2044', textAlign: 'center' }}>
                محمد علي مندني العمادي
              </p>
              <span style={{ fontSize: '0.62rem', color: '#64748B', textAlign: 'center' }}>مدير المدرسة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Signature Pad Modal for Attendee Drawing */}
      {isSigningOpen && (
        <SignaturePadModal 
          isOpen={isSigningOpen}
          attendeeName={currentRecord.traineeNameAr}
          workshopTitle={currentRecord.skillProvided || 'جلسة تدريب وتمكين رقمي فردي'}
          onSave={handleSaveDrawnSignature}
          onClose={() => setIsSigningOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Manage Attendees Modal Component ─────────────────────────────────────────
interface ManageAttendeesModalProps {
  currentAttendees: PDAttendee[];
  teachers: any[];
  departments: any[];
  onSave: (attendees: PDAttendee[]) => void;
  onClose: () => void;
}

function ManageAttendeesModal({ currentAttendees, teachers, departments, onSave, onClose }: ManageAttendeesModalProps) {
  const [list, setList] = useState<PDAttendee[]>([...currentAttendees]);
  const [selectedDeptId, setSelectedDeptId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeachersToAdd = useMemo(() => {
    return teachers.filter(t => {
      const alreadyIn = list.some(a => a.name === t.nameAr || a.teacherId === t.id);
      if (alreadyIn) return false;
      if (selectedDeptId !== 'all' && t.departmentId !== selectedDeptId) return false;
      if (searchTerm && !t.nameAr.includes(searchTerm)) return false;
      return true;
    });
  }, [teachers, list, selectedDeptId, searchTerm]);

  const handleAddTeacher = (teacher: any) => {
    const newAtt: PDAttendee = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      teacherId: teacher.id,
      name: teacher.nameAr,
      department: getDeptName(teacher.departmentId, departments),
      jobTitle: teacher.jobTitle || 'معلم',
      signatureStatus: 'تم التوقيع',
      signatureDate: new Date().toISOString().split('T')[0]
    };
    setList(prev => [...prev, newAtt]);
  };

  const handleAddAllFromDept = () => {
    if (selectedDeptId === 'all') return;
    const teachersToAdd = teachers.filter(t => t.departmentId === selectedDeptId && !list.some(a => a.name === t.nameAr));
    const newAttendees: PDAttendee[] = teachersToAdd.map(t => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      teacherId: t.id,
      name: t.nameAr,
      department: getDeptName(t.departmentId, departments),
      jobTitle: t.jobTitle || 'معلم',
      signatureStatus: 'تم التوقيع',
      signatureDate: new Date().toISOString().split('T')[0]
    }));
    setList(prev => [...prev, ...newAttendees]);
  };

  const handleRemove = (index: number) => {
    setList(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleSignature = (index: number) => {
    setList(prev => prev.map((item, i) => {
      if (i === index) {
        const nextStatus = item.signatureStatus === 'تم التوقيع' ? 'بانتظار التوقيع' : 'تم التوقيع';
        return { ...item, signatureStatus: nextStatus as any };
      }
      return item;
    }));
  };

  return (
    <div style={{ 
      position: 'fixed', inset: 0, background: 'rgba(15,32,68,0.7)', 
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', 
      backdropFilter: 'blur(6px)', padding: '1rem' 
    }}>
      <div style={{ 
        background: '#fff', borderRadius: '24px', width: '95%', maxWidth: '850px', 
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
      }}>
        {/* Modal Header */}
        <div style={{ 
          padding: '1.25rem 2rem', background: '#0F2044', color: '#fff', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>إدارة كشف الحضور وتوقيعات المشاركين</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
              إضافة معلمين من كادر المدرسة وتعديل حالة التوقيع لكل حاضر
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', padding: '0.5rem', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>
          {/* Quick Add Form */}
          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
            <h5 style={{ margin: '0 0 0.75rem', color: '#0F2044', fontWeight: 900, fontSize: '0.88rem' }}>إضافة مشارك من كادر المدرسة:</h5>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr auto', gap: '0.75rem', alignItems: 'center' }}>
              <select 
                value={selectedDeptId} 
                onChange={e => setSelectedDeptId(e.target.value)}
                style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700 }}
              >
                <option value="all">جميع الأقسام</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
              </select>

              <input 
                type="text" 
                placeholder="بحث باسم المعلم..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />

              {selectedDeptId !== 'all' && (
                <button 
                  onClick={handleAddAllFromDept}
                  style={{ 
                    background: '#00B4D8', color: '#fff', border: 'none', 
                    padding: '0.65rem 1.2rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer',
                    fontSize: '0.82rem', whiteSpace: 'nowrap'
                  }}
                >
                  إضافة قسم كامل
                </button>
              )}
            </div>

            {/* Filtered Teachers Chips */}
            {filteredTeachersToAdd.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', maxHeight: '110px', overflowY: 'auto' }}>
                {filteredTeachersToAdd.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => handleAddTeacher(t)}
                    style={{ 
                      background: '#fff', border: '1px solid #CBD5E1', borderRadius: '8px', 
                      padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, 
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                      color: '#0F2044'
                    }}
                  >
                    <Plus size={14} color="#00B4D8" /> {t.nameAr} ({getDeptName(t.departmentId, departments)})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current Attendees List */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ background: '#F1F5F9', padding: '0.75rem 1rem', fontWeight: 900, fontSize: '0.85rem', color: '#0F2044', display: 'flex', justifyContent: 'space-between' }}>
              <span>قائمة المشاركين الحاليين ({list.length})</span>
              <span style={{ color: '#0284C7', fontSize: '0.75rem' }}>اضغط على شارة التوقيع للتبديل بين (تم التوقيع / بانتظار التوقيع)</span>
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {list.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem', margin: 0 }}>لا يوجد مشاركون مسجلون حالياً في هذه الورشة.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <tbody>
                    {list.map((att, idx) => (
                      <tr key={att.id || idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                        <td style={{ padding: '0.65rem 1rem', width: '35px', color: '#94A3B8', fontWeight: 800 }}>{idx + 1}</td>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: '#0F2044' }}>{att.name}</td>
                        <td style={{ padding: '0.65rem 1rem', color: '#475569' }}>{att.department}</td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          <button 
                            onClick={() => handleToggleSignature(idx)}
                            style={{ 
                              background: att.signatureStatus === 'تم التوقيع' ? '#D1FAE5' : '#FEF3C7',
                              color: att.signatureStatus === 'تم التوقيع' ? '#065F46' : '#92400E',
                              border: 'none', padding: '0.3rem 0.75rem', borderRadius: '8px', 
                              fontWeight: 800, cursor: 'pointer', fontSize: '0.75rem',
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                            }}
                          >
                            <CheckCircle2 size={13} /> {att.signatureStatus || 'تم التوقيع'}
                          </button>
                        </td>
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'left' }}>
                          <button 
                            onClick={() => handleRemove(idx)}
                            style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '0.35rem', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#F8FAFC' }}>
          <button 
            onClick={onClose}
            style={{ padding: '0.75rem 1.75rem', borderRadius: '12px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: 800, cursor: 'pointer' }}
          >
            إلغاء
          </button>
          <button 
            onClick={() => onSave(list)}
            style={{ padding: '0.75rem 2.5rem', borderRadius: '12px', background: '#0F2044', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}
          >
            حفظ واعتماد الكشف
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── PD Reports Center Tab Component ──────────────────────────────────────────
export function PDReportsCenterTab({
  workshops,
  individualRecords,
  teachers,
  departments,
  filterYear,
  onOpenComprehensive,
  canEdit,
  onUpdateWorkshop
}: {
  workshops: Workshop[];
  individualRecords: IndividualPDRecord[];
  teachers: any[];
  departments: any[];
  filterYear: string;
  onOpenComprehensive?: () => void;
  canEdit?: boolean;
  onUpdateWorkshop?: (w: Workshop) => void;
}) {
  const [reportSubTab, setReportSubTab] = useState<'workshops' | 'individual' | 'annual'>('workshops');
  
  // Workshops filtering and selection
  const yearWorkshops = useMemo(() => {
    return workshops.filter(w => filterYear === 'all' || w.academicYear === filterYear);
  }, [workshops, filterYear]);

  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>(yearWorkshops[0]?.id || '');
  React.useEffect(() => {
    if (!selectedWorkshopId && yearWorkshops.length > 0) {
      setSelectedWorkshopId(yearWorkshops[0].id);
    }
  }, [yearWorkshops, selectedWorkshopId]);

  const activeWorkshop = useMemo(() => {
    return yearWorkshops.find(w => w.id === selectedWorkshopId) || yearWorkshops[0] || null;
  }, [yearWorkshops, selectedWorkshopId]);

  // Individual PD filtering and selection
  const yearIndividual = useMemo(() => {
    return individualRecords.filter(r => filterYear === 'all' || r.academicYear === filterYear);
  }, [individualRecords, filterYear]);

  const [selectedIndId, setSelectedIndId] = useState<string>(yearIndividual[0]?.id || '');
  React.useEffect(() => {
    if (!selectedIndId && yearIndividual.length > 0) {
      setSelectedIndId(yearIndividual[0].id);
    }
  }, [yearIndividual, selectedIndId]);

  const activeIndividual = useMemo(() => {
    return yearIndividual.find(r => r.id === selectedIndId) || yearIndividual[0] || null;
  }, [yearIndividual, selectedIndId]);

  return (
    <div>
      {/* Subtabs Selector */}
      <div className="no-print" style={{ display: 'flex', gap: '0.85rem', marginBottom: '2rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setReportSubTab('workshops')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.85rem 1.6rem', borderRadius: '14px', border: 'none',
            background: reportSubTab === 'workshops' ? '#0F2044' : '#F1F5F9',
            color: reportSubTab === 'workshops' ? '#fff' : '#475569',
            fontWeight: 900, cursor: 'pointer', fontSize: '0.95rem',
            boxShadow: reportSubTab === 'workshops' ? '0 4px 12px rgba(15,32,68,0.2)' : 'none'
          }}
        >
          <BookOpen size={18} /> تقارير ورش العمل الجماعية (مع كشف وتواقيع الحضور)
        </button>

        <button
          onClick={() => setReportSubTab('individual')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.85rem 1.6rem', borderRadius: '14px', border: 'none',
            background: reportSubTab === 'individual' ? '#00B4D8' : '#F1F5F9',
            color: reportSubTab === 'individual' ? '#fff' : '#475569',
            fontWeight: 900, cursor: 'pointer', fontSize: '0.95rem',
            boxShadow: reportSubTab === 'individual' ? '0 4px 12px rgba(0,180,216,0.25)' : 'none'
          }}
        >
          <Zap size={18} /> تقارير التدريب والدعم الفردي (مع إقرار وتوقيع الحاضر)
        </button>

        <button
          onClick={() => {
            if (onOpenComprehensive) onOpenComprehensive();
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.85rem 1.6rem', borderRadius: '14px', border: '1px solid #CBD5E1',
            background: '#fff', color: '#0F2044',
            fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          <FileText size={18} /> التقرير الشامل السنوي للمدرسة
        </button>
      </div>

      {reportSubTab === 'workshops' && (
        <div>
          {/* Workshop Selector Bar */}
          <div className="no-print" style={{ 
            background: '#F8FAFC', padding: '1.25rem 1.5rem', borderRadius: '18px', 
            border: '1px solid #E2E8F0', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', marginBottom: '0.35rem' }}>
                اختر ورشة العمل لعرض تقريرها وكشف حضورها:
              </label>
              <select
                value={selectedWorkshopId}
                onChange={e => setSelectedWorkshopId(e.target.value)}
                style={{
                  width: '100%', padding: '0.85rem 1.25rem', borderRadius: '12px',
                  border: '1.5px solid #0F2044', fontWeight: 800, fontSize: '0.95rem',
                  background: '#fff', color: '#0F2044', cursor: 'pointer'
                }}
              >
                {yearWorkshops.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.workshopNumber ? `#${w.workshopNumber} - ` : ''}{w.titleAr || w.nameAr} ({w.date || w.month}) - {w.facilitatorName || w.trainer}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <button
                onClick={async () => {
                  if (activeWorkshop) {
                    await downloadReportAsPdf(`workshop-report-${activeWorkshop.id}`, `تقرير_ورشة_${activeWorkshop.titleAr || activeWorkshop.nameAr}_${activeWorkshop.academicYear}`);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: '#fff', border: 'none',
                  padding: '0.85rem 1.6rem', borderRadius: '12px', fontWeight: 900,
                  cursor: 'pointer', fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(2,132,199,0.25)'
                }}
              >
                <Download size={18} /> حفظ وتحميل كـ PDF مباشر (A4 عرضي)
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: '#0F2044', color: '#fff', border: 'none',
                  padding: '0.85rem 1.6rem', borderRadius: '12px', fontWeight: 900,
                  cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                <Printer size={18} /> طباعة التقرير (عرضي)
              </button>
            </div>
          </div>

          {activeWorkshop ? (
            <SingleWorkshopReport
              workshop={activeWorkshop}
              teachers={teachers}
              departments={departments}
              canEdit={canEdit}
              onUpdateWorkshop={onUpdateWorkshop}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <BookOpen size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ color: '#0F2044', fontWeight: 800 }}>لا توجد ورش عمل مسجلة لهذا العام</h4>
              <p style={{ color: '#64748B' }}>يرجى اختيار عام دراسي آخر أو إضافة ورشة عمل جديدة.</p>
            </div>
          )}
        </div>
      )}

      {reportSubTab === 'individual' && (
        <div>
          {/* Individual Selector Bar */}
          <div className="no-print" style={{ 
            background: '#F8FAFC', padding: '1.25rem 1.5rem', borderRadius: '18px', 
            border: '1px solid #E2E8F0', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', marginBottom: '0.35rem' }}>
                اختر جلسة التدريب الفردي لعرض التقرير وإقرار التوقيع:
              </label>
              <select
                value={selectedIndId}
                onChange={e => setSelectedIndId(e.target.value)}
                style={{
                  width: '100%', padding: '0.85rem 1.25rem', borderRadius: '12px',
                  border: '1.5px solid #00B4D8', fontWeight: 800, fontSize: '0.95rem',
                  background: '#fff', color: '#0F2044', cursor: 'pointer'
                }}
              >
                {yearIndividual.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.traineeNameAr} | {r.department} - {r.skillProvided} ({r.trainingDate})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <button
                onClick={async () => {
                  if (activeIndividual) {
                    await downloadReportAsPdf(`ind-report-${activeIndividual.id}`, `تقرير_تدريب_فردي_${activeIndividual.traineeNameAr}_${activeIndividual.month}_${activeIndividual.academicYear}`);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: '#fff', border: 'none',
                  padding: '0.85rem 1.6rem', borderRadius: '12px', fontWeight: 900,
                  cursor: 'pointer', fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(2,132,199,0.25)'
                }}
              >
                <Download size={18} /> حفظ وتحميل كـ PDF مباشر (A4 عرضي)
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: '#0F2044', color: '#fff', border: 'none',
                  padding: '0.85rem 1.6rem', borderRadius: '12px', fontWeight: 900,
                  cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                <Printer size={18} /> طباعة التقرير (عرضي)
              </button>
            </div>
          </div>

          {activeIndividual ? (
            <SingleIndividualPDReport
              record={activeIndividual}
              canEdit={canEdit}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <Zap size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ color: '#0F2044', fontWeight: 800 }}>لا توجد جلسات تدريب فردي مسجلة لهذا العام</h4>
              <p style={{ color: '#64748B' }}>يرجى اختيار عام دراسي آخر أو إضافة جلسة تدريب فردي جديدة.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
