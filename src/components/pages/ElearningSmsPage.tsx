'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MessageSquare, Send, Calendar, Download, Printer, Plus, Search, 
  Trash2, Edit3, Copy, Check, Filter, Smartphone, X, FileText, 
  AlertCircle, Sparkles, Clock, CheckCircle2, ChevronRight,
  Share2, Hash, ArrowUpDown, Eye
} from 'lucide-react';
import { 
  SCHOOL_NAME, db, generateId, 
  ACADEMIC_YEARS, type ElearningSms, type User 
} from '@/lib/data';

interface Props {
  currentUser: User;
  selectedYear?: string;
}

export default function ElearningSmsPage({ currentUser, selectedYear: propYear }: Props) {
  const [messages, setMessages] = useState<ElearningSms[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(propYear || '2026-2027');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ElearningSms | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields - Strictly: عنوان الرسالة، نص الرسالة، واختيار تاريخ الإرسال فقط
  const [formData, setFormData] = useState({
    title: '',
    messageText: '',
    sentDate: new Date().toISOString().split('T')[0],
  });

  // إغلاق إضافة وتعديل الرسائل على جميع المستخدمين باستثناء منسق المشاريع ومدير النظام
  const canManageSms = useMemo(() => {
    if (!currentUser) return false;
    // حظر قطعي لمنسقي الأقسام والقيادة والمشاهدين والمعلمين
    if (currentUser.role === 'coordinator' || currentUser.role === 'leader' || currentUser.role === 'viewer') {
      return false;
    }
    // السماح فقط لمدير النظام ومنسق المشاريع الإلكترونية
    if (currentUser.role === 'admin' || currentUser.role === 'evaluator') return true;
    const email = (currentUser.email || '').toLowerCase().trim();
    if (
      email === 'a.tubaishat1704@education.qa' ||
      email === 'admin@school.qa' ||
      email === 'evaluator@school.qa'
    ) return true;
    const name = (currentUser.name || '').trim();
    if (
      name.includes('طبيشات') ||
      name.includes('مدير النظام') ||
      name.includes('منسق المشاريع')
    ) return true;
    return false;
  }, [currentUser]);

  const isAdmin = canManageSms;

  // Load Messages
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await db.getElearningSms();
        setMessages(data || []);
      } catch (err) {
        console.error('Failed to load SMS records:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (propYear) setYearFilter(propYear);
  }, [propYear]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered & Sorted Messages
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const matchYear = !yearFilter || (m.academicYear ? m.academicYear === yearFilter : true);
      const matchSearch = !searchTerm || 
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.messageText.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = !dateFilter || m.sentDate === dateFilter;
      return matchYear && matchSearch && matchDate;
    }).sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());
  }, [messages, yearFilter, searchTerm, dateFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = messages.length;
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const thisMonthCount = messages.filter(m => m.sentDate.startsWith(currentMonth)).length;
    
    // Sort all dates to find earliest and latest
    const dates = messages.map(m => m.sentDate).filter(Boolean).sort();
    const latestDate = dates.length > 0 ? dates[dates.length - 1] : '—';
    const earliestDate = dates.length > 0 ? dates[0] : '—';

    // Character metrics
    const totalChars = messages.reduce((acc, m) => acc + (m.messageText?.length || 0), 0);
    const avgChars = total > 0 ? Math.round(totalChars / total) : 0;

    return { total, thisMonthCount, latestDate, earliestDate, avgChars };
  }, [messages]);

  // Handle Form Open (New)
  const handleOpenAdd = () => {
    if (!canManageSms) {
      alert('عذراً، إضافة الرسائل مقتصرة على منسق المشاريع ومدير النظام فقط.');
      return;
    }
    setEditingMessage(null);
    setFormData({
      title: '',
      messageText: '',
      sentDate: new Date().toISOString().split('T')[0],
    });
    setIsFormOpen(true);
  };

  // Handle Form Open (Edit)
  const handleOpenEdit = (msg: ElearningSms) => {
    if (!canManageSms) {
      alert('عذراً، تعديل الرسائل مقتصر على منسق المشاريع ومدير النظام فقط.');
      return;
    }
    setEditingMessage(msg);
    setFormData({
      title: msg.title,
      messageText: msg.messageText,
      sentDate: msg.sentDate,
    });
    setIsFormOpen(true);
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSms) {
      alert('غير مصرح لك بإضافة أو تعديل الرسائل.');
      return;
    }
    if (!formData.title.trim() || !formData.messageText.trim() || !formData.sentDate) {
      alert('يرجى ملء كافة الحقول: عنوان الرسالة، نص الرسالة، وتاريخ الإرسال');
      return;
    }

    let updated: ElearningSms[];
    const now = new Date().toISOString();

    if (editingMessage) {
      updated = messages.map(m => {
        if (m.id === editingMessage.id) {
          return {
            ...m,
            title: formData.title.trim(),
            messageText: formData.messageText.trim(),
            sentDate: formData.sentDate,
            updatedAt: now,
          };
        }
        return m;
      });
      showToast('تم تحديث بيانات الرسالة بنجاح');
    } else {
      const newSms: ElearningSms = {
        id: generateId(),
        title: formData.title.trim(),
        messageText: formData.messageText.trim(),
        sentDate: formData.sentDate,
        academicYear: yearFilter || '2026-2027',
        senderName: 'قسم التعليم الإلكتروني والمشاريع',
        createdAt: now,
        updatedAt: now,
      };
      updated = [newSms, ...messages];
      showToast('تمت إضافة الرسالة بنجاح وسجلت بالنظام');
    }

    setMessages(updated);
    setIsFormOpen(false);
    try {
      await db.saveElearningSms(updated);
    } catch (err) {
      console.error('Error saving to storage:', err);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!canManageSms) {
      alert('غير مصرح لك بحذف الرسائل.');
      return;
    }
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة نهائياً؟')) return;
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated);
    showToast('تم حذف الرسالة بنجاح');
    try {
      await db.deleteElearningSms(id);
      await db.saveElearningSms(updated);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  // Copy Message Text
  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('تم نسخ نص الرسالة إلى الحافظة');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download PDF Report
  const handleDownloadPdf = async () => {
    const reportElement = document.getElementById('elearning-sms-report-sheet');
    if (!reportElement) {
      alert('لم يتم العثور على محتوى التقرير للطباعة أو التنزيل');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(reportElement, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById('elearning-sms-report-sheet');
          if (clonedEl) {
            clonedEl.style.width = '1120px';
            clonedEl.style.maxWidth = '1120px';
            clonedEl.style.margin = '0 auto';
            clonedEl.style.boxShadow = 'none';
            clonedEl.style.borderRadius = '0';
            clonedEl.style.background = '#ffffff';

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

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 8;
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - (margin * 2);

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const canvasAspectRatio = canvasWidth / canvasHeight;
      const pageAspectRatio = availableWidth / availableHeight;

      let renderWidth = availableWidth;
      let renderHeight = availableHeight;
      let offsetX = margin;
      let offsetY = margin;

      if (canvasAspectRatio > pageAspectRatio) {
        renderWidth = availableWidth;
        renderHeight = availableWidth / canvasAspectRatio;
        offsetY = margin + ((availableHeight - renderHeight) / 2);
      } else {
        renderHeight = availableHeight;
        renderWidth = availableHeight * canvasAspectRatio;
        offsetX = margin + ((availableWidth - renderWidth) / 2);
      }

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');
      pdf.save(`تقرير_رسائل_أولياء_الأمور_Elearning_SMS_${yearFilter || '2026-2027'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate SMS segments (Arabic: 70 chars for 1st segment, 67 for concatenated)
  const getSmsSegmentCount = (text: string) => {
    const len = text.length;
    if (len === 0) return { chars: 0, segments: 0 };
    if (len <= 70) return { chars: len, segments: 1 };
    return { chars: len, segments: Math.ceil(len / 67) };
  };

  const formSmsMetrics = getSmsSegmentCount(formData.messageText);

  return (
    <div className="elearning-sms-page" style={{ padding: '1.75rem 2rem', background: '#F8FAFC', minHeight: '100vh', direction: 'rtl' }}>
      
      {/* Embedded Print Stylesheet */}
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
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-report {
            display: block !important;
            box-shadow: none !important;
            border: 1.5px solid #CBD5E1 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 6mm 10mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            position: relative !important;
            box-sizing: border-box !important;
          }
        }
      `}} />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '2rem', left: '2rem', zIndex: 9999,
          background: '#0F2044', color: '#fff', padding: '0.85rem 1.5rem',
          borderRadius: '12px', boxShadow: '0 8px 24px rgba(15,32,68,0.25)',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem',
          fontWeight: 800, border: '1px solid #00B4D8'
        }}>
          <CheckCircle2 size={18} color="#00B4D8" />
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="no-print" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0F2044 0%, #0284C7 100%)',
                color: '#fff', width: '40px', height: '40px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(2,132,199,0.25)'
              }}>
                <Smartphone size={22} />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 900, color: '#0F2044', letterSpacing: '-0.3px' }}>
                E-Learning SMS — رسائل أولياء الأمور
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748B' }}>
              توثيق وإدارة رسائل الـ SMS المرسلة لأولياء الأمور لنظام قطر للتعليم والتمكين الرقمي مع استخراج التقارير الرسمية بصيغة PDF.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsReportModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#fff', color: '#0F2044', border: '1.5px solid #CBD5E1',
                padding: '0.65rem 1.25rem', borderRadius: '12px', fontWeight: 800,
                fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.2s'
              }}
            >
              <FileText size={17} color="#0284C7" />
              استخراج تقرير PDF لجميع الرسائل
            </button>

            {canManageSms ? (
              <button
                onClick={handleOpenAdd}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
                  color: '#fff', border: 'none',
                  padding: '0.65rem 1.4rem', borderRadius: '12px', fontWeight: 900,
                  fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,32,68,0.25)',
                  transition: 'all 0.2s'
                }}
              >
                <Plus size={18} />
                إضافة رسالة جديدة
              </button>
            ) : (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  background: '#F1F5F9', color: '#475569', border: '1.5px solid #CBD5E1',
                  padding: '0.6rem 1.15rem', borderRadius: '12px', fontWeight: 700,
                  fontSize: '0.82rem'
                }}
              >
                <Eye size={16} color="#0284C7" />
                وضع المشاهدة والاطلاع فقط
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="no-print" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem', marginBottom: '1.75rem'
      }}>
        {/* Card 1: Total Messages */}
        <div style={{
          background: '#fff', padding: '1.15rem 1.25rem', borderRadius: '14px',
          border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ background: '#F0F9FF', color: '#0284C7', padding: '0.75rem', borderRadius: '12px' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, display: 'block' }}>إجمالي الرسائل الموثقة</span>
            <strong style={{ fontSize: '1.45rem', color: '#0F2044', fontWeight: 900 }}>{stats.total}</strong>
            <span style={{ fontSize: '0.7rem', color: '#0284C7', marginRight: '0.35rem' }}>رسالة مرسلة</span>
          </div>
        </div>

        {/* Card 2: This Month Messages */}
        <div style={{
          background: '#fff', padding: '1.15rem 1.25rem', borderRadius: '14px',
          border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ background: '#ECFDF5', color: '#059669', padding: '0.75rem', borderRadius: '12px' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, display: 'block' }}>رسائل هذا الشهر</span>
            <strong style={{ fontSize: '1.45rem', color: '#065F46', fontWeight: 900 }}>{stats.thisMonthCount}</strong>
            <span style={{ fontSize: '0.7rem', color: '#059669', marginRight: '0.35rem' }}>خلال الشهر الجاري</span>
          </div>
        </div>

        {/* Card 3: Latest Send Date */}
        <div style={{
          background: '#fff', padding: '1.15rem 1.25rem', borderRadius: '14px',
          border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ background: '#EEF2FF', color: '#4F46E5', padding: '0.75rem', borderRadius: '12px' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, display: 'block' }}>آخر تاريخ إرسال</span>
            <strong style={{ fontSize: '1.15rem', color: '#312E81', fontWeight: 900 }}>{stats.latestDate}</strong>
            <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>أحدث رسالة موثقة</span>
          </div>
        </div>

        {/* Card 4: Avg Chars */}
        <div style={{
          background: '#fff', padding: '1.15rem 1.25rem', borderRadius: '14px',
          border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ background: '#FFFBEB', color: '#D97706', padding: '0.75rem', borderRadius: '12px' }}>
            <Hash size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, display: 'block' }}>متوسط طول الرسالة</span>
            <strong style={{ fontSize: '1.45rem', color: '#92400E', fontWeight: 900 }}>{stats.avgChars}</strong>
            <span style={{ fontSize: '0.7rem', color: '#D97706', marginRight: '0.35rem' }}>حرف (معدل الرسالة)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="no-print" style={{
        background: '#fff', padding: '1rem 1.5rem', borderRadius: '14px',
        border: '1px solid #E2E8F0', marginBottom: '1.5rem',
        display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '480px' }}>
          <Search size={17} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="بحث في عنوان أو نص الرسائل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '0.65rem 2.4rem 0.65rem 1rem', borderRadius: '10px',
              border: '1px solid #CBD5E1', fontSize: '0.86rem', outline: 'none',
              background: '#F8FAFC', transition: 'border-color 0.2s'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Specific Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F8FAFC', padding: '0.35rem 0.65rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
            <Calendar size={15} color="#64748B" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.82rem', color: '#0F2044', fontWeight: 700 }}
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                title="إلغاء تصفية التاريخ"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Academic Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem', borderRadius: '10px',
              border: '1px solid #CBD5E1', fontSize: '0.82rem',
              fontWeight: 800, color: '#0F2044', background: '#F8FAFC', outline: 'none'
            }}
          >
            {ACADEMIC_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 700, marginRight: '0.5rem' }}>
            النتائج: <strong style={{ color: '#0F2044' }}>{filteredMessages.length}</strong> رسالة
          </span>
        </div>
      </div>

      {/* Messages List (Modern Cards View) */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <div style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.95rem' }}>جاري تحميل رسائل أولياء الأمور...</div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#fff', borderRadius: '14px', border: '1px dashed #CBD5E1' }}>
            <MessageSquare size={44} color="#94A3B8" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
            <h3 style={{ margin: '0 0 0.4rem', color: '#0F2044', fontSize: '1.1rem', fontWeight: 800 }}>لا توجد رسائل مسجلة مطابقة</h3>
            <p style={{ margin: '0 0 1.25rem', color: '#64748B', fontSize: '0.84rem' }}>
              {canManageSms 
                ? 'يمكنك البدء بإضافة الرسائل التي تم إرسالها لأولياء الأمور لتوثيقها واستخراج التقارير الرسمية.' 
                : 'لم يتم توثيق أي رسائل في هذا القسم حتى الآن.'}
            </p>
            {canManageSms && (
              <button
                onClick={handleOpenAdd}
                style={{
                  background: '#0F2044', color: '#fff', border: 'none',
                  padding: '0.6rem 1.4rem', borderRadius: '10px', fontWeight: 800,
                  fontSize: '0.86rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                <Plus size={16} /> إضافة أول رسالة الآن
              </button>
            )}
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const metrics = getSmsSegmentCount(msg.messageText);
            return (
              <div
                key={msg.id}
                style={{
                  background: '#ffffff', borderRadius: '14px',
                  border: '1px solid #E2E8F0', padding: '1.25rem 1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s', position: 'relative'
                }}
              >
                {/* Message Header Strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      background: '#0F2044', color: '#fff', width: '28px', height: '28px',
                      borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 900
                    }}>
                      {idx + 1}
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2044' }}>
                        {msg.title}
                      </h3>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        المستلمون: أولياء أمور الطلبة | {msg.academicYear || '2026-2027'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {/* Sent Date Badge */}
                    <span style={{
                      background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD',
                      padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.76rem',
                      fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                    }}>
                      <Calendar size={13} color="#0284C7" />
                      تاريخ الإرسال: {msg.sentDate}
                    </span>

                    {/* Status Badge */}
                    <span style={{
                      background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0',
                      padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.74rem',
                      fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                    }}>
                      <CheckCircle2 size={13} color="#059669" />
                      تم الإرسال لأولياء الأمور
                    </span>
                  </div>
                </div>

                {/* Message Body Content */}
                <div style={{
                  background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '10px',
                  border: '1px solid #E2E8F0', borderRight: '4px solid #00B4D8',
                  marginBottom: '0.85rem'
                }}>
                  <p style={{
                    margin: 0, fontSize: '0.88rem', color: '#1E293B',
                    lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit'
                  }}>
                    {msg.messageText}
                  </p>
                </div>

                {/* Card Footer Strip with Metrics and Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {/* SMS Metrics */}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: '#64748B' }}>
                    <span>طول النص: <strong style={{ color: '#0F2044' }}>{metrics.chars}</strong> حرفاً</span>
                    <span>حجم الرسالة: <strong style={{ color: '#0284C7' }}>{metrics.segments}</strong> جزء SMS</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => handleCopyText(msg.id, msg.messageText)}
                      title="نسخ نص الرسالة"
                      style={{
                        background: '#fff', border: '1px solid #CBD5E1', color: '#475569',
                        padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.76rem',
                        fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                      }}
                    >
                      {copiedId === msg.id ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                      {copiedId === msg.id ? 'تم النسخ' : 'نسخ النص'}
                    </button>

                    {canManageSms && (
                      <button
                        onClick={() => handleOpenEdit(msg)}
                        title="تعديل الرسالة"
                        style={{
                          background: '#fff', border: '1px solid #CBD5E1', color: '#0369A1',
                          padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.76rem',
                          fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                        }}
                      >
                        <Edit3 size={14} /> تعديل
                      </button>
                    )}

                    {canManageSms && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        title="حذف الرسالة"
                        style={{
                          background: '#fff', border: '1px solid #FCA5A5', color: '#DC2626',
                          padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.76rem',
                          fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                        }}
                      >
                        <Trash2 size={14} /> حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── ADD / EDIT MESSAGE MODAL ────────────────────────────────────── */}
      {isFormOpen && canManageSms && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 32, 68, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '640px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0F2044 0%, #1E3A8A 100%)',
              color: '#fff', padding: '1.25rem 1.75rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.5rem', borderRadius: '10px' }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>
                    {editingMessage ? 'تعديل رسالة أولياء الأمور' : 'إضافة وتوثيق رسالة أولياء الأمور (SMS)'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                    حقول الإدخال: عنوان الرسالة، نص الرسالة، واختيار تاريخ الإرسال فقط
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: '1.5rem 1.75rem' }}>
              {/* Field 1: عنوان الرسالة */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                  📌 عنوان الرسالة: <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تفعيل حسابات منصة نظام قطر للتعليم، أو إشعار الواجبات الأسبوعية"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
                    border: '1.5px solid #CBD5E1', fontSize: '0.9rem', outline: 'none',
                    boxSizing: 'border-box', background: '#F8FAFC'
                  }}
                />
              </div>

              {/* Field 2: نص الرسالة */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F2044' }}>
                    💬 نص الرسالة المرسلة لأولياء الأمور: <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {formSmsMetrics.chars} حرفاً ({formSmsMetrics.segments} أجزاء SMS)
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  placeholder="اكتب هنا النص الكامل للرسالة كما تم إرساله عبر نظام الرسائل النصية لأولياء الأمور..."
                  value={formData.messageText}
                  onChange={(e) => setFormData({ ...formData, messageText: e.target.value })}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
                    border: '1.5px solid #CBD5E1', fontSize: '0.88rem', outline: 'none',
                    boxSizing: 'border-box', background: '#F8FAFC', lineHeight: 1.6, resize: 'vertical'
                  }}
                />
              </div>

              {/* Field 3: تاريخ الإرسال */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#0F2044', marginBottom: '0.4rem' }}>
                  📅 تاريخ الإرسال: <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    required
                    value={formData.sentDate}
                    onChange={(e) => setFormData({ ...formData, sentDate: e.target.value })}
                    style={{
                      width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
                      border: '1.5px solid #CBD5E1', fontSize: '0.88rem', outline: 'none',
                      boxSizing: 'border-box', background: '#F8FAFC', fontWeight: 700, color: '#0F2044'
                    }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{
                    padding: '0.65rem 1.4rem', borderRadius: '10px', border: '1px solid #CBD5E1',
                    background: '#fff', color: '#64748B', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.6rem', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #0F2044 0%, #0284C7 100%)',
                    color: '#fff', fontWeight: 900, fontSize: '0.86rem', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15,32,68,0.2)'
                  }}
                >
                  {editingMessage ? 'حفظ التعديلات' : 'حفظ وتوثيق الرسالة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── OFFICIAL PDF REPORT MODAL / PREVIEW ─────────────────────────── */}
      {isReportModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(15, 32, 68, 0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem',
          overflowY: 'auto'
        }}>
          {/* Top Control Bar in Modal */}
          <div className="no-print" style={{
            background: '#ffffff', width: '100%', maxWidth: '1120px',
            padding: '1rem 1.5rem', borderRadius: '14px', marginBottom: '1.25rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#0284C7', color: '#fff', padding: '0.5rem', borderRadius: '10px' }}>
                <FileText size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2044' }}>
                  معاينة تقرير رسائل أولياء الأمور (A4 عرضي رسمي)
                </h3>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748B' }}>
                  يتضمن كشفاً شاملاً لجميع الرسائل المرسلة والاعتمادات الإدارية وتوقيع م. أحمد طبيشات وإدارة المدرسة
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  color: '#fff', border: 'none',
                  padding: '0.65rem 1.4rem', borderRadius: '10px', fontWeight: 900,
                  cursor: isGeneratingPdf ? 'wait' : 'pointer', fontSize: '0.85rem',
                  boxShadow: '0 4px 12px rgba(2,132,199,0.25)'
                }}
              >
                <Download size={16} />
                {isGeneratingPdf ? 'جاري تصدير PDF...' : 'حفظ كملف PDF مباشر (A4)'}
              </button>

              <button
                onClick={handlePrint}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: '#0F2044', color: '#fff', border: 'none',
                  padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 900,
                  cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                <Printer size={16} /> طباعة التقرير
              </button>

              <button
                onClick={() => setIsReportModalOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1',
                  padding: '0.65rem 1rem', borderRadius: '10px', fontWeight: 700,
                  cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                <X size={16} /> إغلاق
              </button>
            </div>
          </div>

          {/* Printable Report Sheet (A4 Landscape 1120px) */}
          <div
            id="elearning-sms-report-sheet"
            className="printable-report"
            style={{
              background: '#ffffff', width: '1120px', minHeight: '750px',
              padding: '1.25rem 1.75rem', borderRadius: '12px', border: '1px solid #CBD5E1',
              boxShadow: '0 12px 36px rgba(0,0,0,0.1)', boxSizing: 'border-box',
              position: 'relative', display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Report Header */}
            <div style={{
              marginBottom: '1rem', paddingBottom: '0.85rem',
              borderBottom: '2.5px solid #0F2044', position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
                {/* Ministry Logo */}
                <img src="/ministry-logo.png" alt="وزارة التعليم والتعليم العالي" style={{ height: '75px', maxWidth: '165px', objectFit: 'contain' }} />

                {/* Center Title & Metadata */}
                <div style={{ textAlign: 'center', flex: 1, padding: '0 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Title Banner */}
                  <div style={{
                    background: '#0F2044',
                    borderRadius: '8px', padding: '0.45rem 1.85rem',
                    border: '1.5px solid #0F2044', boxShadow: '0 3px 10px rgba(15,32,68,0.15)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '7px'
                  }}>
                    <h2
                      className="text-white print-header-badge"
                      style={{
                        margin: 0, fontSize: '0.94rem', fontWeight: 900,
                        color: '#ffffff !important', WebkitTextFillColor: '#ffffff !important',
                        letterSpacing: 'normal', textAlign: 'center'
                      }}
                    >
                      تقرير توثيق رسائل أولياء الأمور — منظومة التعليم الإلكتروني (E-Learning SMS)
                    </h2>
                  </div>
                </div>

                {/* School Logo */}
                <img src="/school-logo.png" alt="شعار المدرسة" style={{ height: '75px', maxWidth: '165px', objectFit: 'contain' }} />
              </div>
            </div>

            {/* Context & Summary Strip */}
            <div style={{
              background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px',
              padding: '0.55rem 0.85rem', marginBottom: '0.85rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem'
            }}>
              <span style={{ color: '#0369A1', fontWeight: 800 }}>
                📋 كشف الرسائل النصية التوثيقية الموجهة لأولياء الأمور لتعزيز التواصل والشراكة المدرسية الرقمية
              </span>
              <span style={{ color: '#0F2044', fontWeight: 800 }}>
                الفترة المرصودة: {stats.earliestDate} إلى {stats.latestDate}
              </span>
            </div>

            {/* Full Messages Table */}
            <div style={{ flex: 1, marginBottom: '1rem', overflowX: 'auto' }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem',
                border: '1px solid #CBD5E1', textAlign: 'right'
              }}>
                <thead>
                  <tr style={{ background: '#0F2044', color: '#ffffff' }}>
                    <th style={{ padding: '0.55rem 0.5rem', width: '35px', textAlign: 'center', border: '1px solid #CBD5E1' }}>#</th>
                    <th style={{ padding: '0.55rem 0.75rem', width: '110px', textAlign: 'center', border: '1px solid #CBD5E1' }}>تاريخ الإرسال</th>
                    <th style={{ padding: '0.55rem 0.85rem', width: '220px', border: '1px solid #CBD5E1' }}>عنوان الرسالة</th>
                    <th style={{ padding: '0.55rem 0.85rem', border: '1px solid #CBD5E1' }}>نص الرسالة المرسلة لأولياء الأمور</th>
                    <th style={{ padding: '0.55rem 0.65rem', width: '90px', textAlign: 'center', border: '1px solid #CBD5E1' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg, index) => (
                    <tr
                      key={msg.id}
                      style={{
                        background: index % 2 === 0 ? '#ffffff' : '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0'
                      }}
                    >
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#0F2044', border: '1px solid #E2E8F0' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 800, color: '#0284C7', border: '1px solid #E2E8F0' }}>
                        {msg.sentDate}
                      </td>
                      <td style={{ padding: '0.55rem 0.85rem', fontWeight: 800, color: '#0F2044', border: '1px solid #E2E8F0', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>
                        {msg.title}
                      </td>
                      <td style={{ padding: '0.55rem 0.85rem', color: '#1E293B', lineHeight: 1.55, border: '1px solid #E2E8F0', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                        {msg.messageText}
                      </td>
                      <td style={{ padding: '0.55rem 0.65rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                        <span style={{
                          background: '#ECFDF5', color: '#065F46', padding: '0.2rem 0.5rem',
                          borderRadius: '4px', fontSize: '0.66rem', fontWeight: 800, whiteSpace: 'nowrap'
                        }}>
                          ✓ معتمد
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Endorsements Block */}
            <div style={{
              marginTop: 'auto', paddingTop: '0.65rem', borderTop: '1.5px solid #0F2044',
              pageBreakInside: 'avoid'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                {/* 1. Eng. Ahmad Tubaishat */}
                <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.45rem 0.5rem', background: '#fff' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, display: 'block', marginBottom: '2px' }}>
                    منسق المشاريع الإلكترونية
                  </span>
                  <img
                    src="/signature-ahmad.png"
                    alt="توقيع م. أحمد طبيشات"
                    style={{ height: '36px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                  />
                  <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#0F2044', display: 'block' }}>م. أحمد عادل طبيشات</span>
                </div>

                {/* 2. Dr. Rani Toum */}
                <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.45rem 0.5rem', background: '#fff' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, display: 'block', marginBottom: '2px' }}>
                    النائب الأكاديمي
                  </span>
                  <img
                    src="/signature-rani.png"
                    alt="توقيع د. راني التوم"
                    style={{ height: '36px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                  />
                  <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#0F2044', display: 'block' }}>د. راني التوم</span>
                </div>

                {/* 3. School Principal */}
                <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.45rem 0.5rem', background: '#fff' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, display: 'block', marginBottom: '2px' }}>
                    مدير المدرسة
                  </span>
                  <img
                    src="/principal-signature.png"
                    alt="توقيع مدير المدرسة"
                    style={{ height: '36px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                  />
                  <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#0F2044', display: 'block' }}>محمد علي مندني العمادي</span>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}
    </div>
  );
}
