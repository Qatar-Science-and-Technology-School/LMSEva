'use client';

import React, { useRef, useState } from 'react';
import { List, CheckSquare, Sparkles, Eye, Edit3 } from 'lucide-react';

/**
 * Normalizes bullet text copied from MS Word, PowerPoint, OneNote, Web, or PDF.
 * Converts private-use and unsupported glyphs (like Word's \uf0b7) into standard Unicode bullets and symbols.
 */
export function normalizeBulletText(raw: string): string {
  if (!raw) return '';
  return raw
    // MS Word / Office private-use symbol bullets & shapes
    .replace(/[\uf0b7\uf0a7\u25cf\u2043\u2023]/g, '• ')
    .replace(/[\uf076\u2714\u2713]/g, '✓ ')
    .replace(/[\u25aa\u25fe\u25a0]/g, '▪ ')
    .replace(/[\u25ab\u25fd\u25a1\u25cb\u25e6]/g, '◦ ')
    // Unicode dashes
    .replace(/[\u2013\u2014]/g, '— ')
    // Non-breaking spaces and zero-width spaces
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
    // Clean up double bullets e.g. "• • "
    .replace(/^[ \t]*[•\-\*][ \t]*[•\-\*][ \t]*/gm, '• ')
    // Normalize lines that start with bullet without a space: "•word" -> "• word"
    .replace(/^[ \t]*([•▪◦✓–—])([^\s])/gm, '$1 $2');
}

export interface BulletItem {
  type: 'bullet' | 'number' | 'symbol' | 'text';
  prefix: string;
  content: string;
}

/**
 * Parses raw text into structured bullet and list items.
 */
export function parseBulletItems(rawText: string): BulletItem[] {
  if (!rawText || !rawText.trim()) return [];

  const normalized = normalizeBulletText(rawText.trim());
  let rawLines = normalized.split(/\r?\n/);

  // If there's only 1 line, but it has inline bullets like "• A • B • C" or "1. A 2. B"
  if (rawLines.length === 1 && (rawLines[0].match(/•/g) || []).length > 1) {
    rawLines = rawLines[0]
      .split(/(?=[•▪◦✓🔹⭐📌🎯💡])/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  const items: BulletItem[] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1. Check for numbered list: "1.", "1)", "(1)"
    const numMatch = trimmed.match(/^(\(?\d+[\.\)]?)\s+(.*)$/);
    if (numMatch) {
      items.push({
        type: 'number',
        prefix: numMatch[1].endsWith('.') ? numMatch[1] : `${numMatch[1]}.`,
        content: numMatch[2].trim()
      });
      continue;
    }

    // 2. Check for emojis and special symbols: ✓, 🔹, ⭐, 📌, 🎯, 💡, ▪, etc.
    const symbolMatch = trimmed.match(/^([✓✔🔹🔸⭐🌟📌📍🎯💡▪▫▶✦★])\s*(.*)$/u);
    if (symbolMatch) {
      items.push({
        type: 'symbol',
        prefix: symbolMatch[1],
        content: symbolMatch[2].trim()
      });
      continue;
    }

    // 3. Check for standard bullet markers: •, -, *, –, —, ◦
    const bulletMatch = trimmed.match(/^[•\-\*–—◦]\s*(.*)$/);
    if (bulletMatch) {
      items.push({
        type: 'bullet',
        prefix: '•',
        content: bulletMatch[1].trim()
      });
      continue;
    }

    // 4. Default: standard text item
    items.push({
      type: 'text',
      prefix: '',
      content: trimmed
    });
  }

  return items;
}

/**
 * FormattedReportPoints:
 * Renders bullet lists, numbered points, and symbols with 100% vector-sharp dots,
 * perfect hanging indents, RTL alignment, and guaranteed visibility in print & PDF export.
 */
export function FormattedReportPoints({
  text,
  defaultText,
  bulletColor = '#00B4D8',
  fontSize = '0.67rem',
  style = {}
}: {
  text?: string | null;
  defaultText?: string;
  bulletColor?: string;
  fontSize?: string;
  style?: React.CSSProperties;
}) {
  const contentToRender = text && text.trim().length > 0 ? text : defaultText;

  if (!contentToRender || !contentToRender.trim()) {
    return <span style={{ color: '#94A3B8', fontSize }}>—</span>;
  }

  const items = parseBulletItems(contentToRender);

  // If only 1 text item with no bullets or symbols, render cleanly
  if (items.length === 1 && items[0].type === 'text') {
    return (
      <div
        style={{
          fontSize,
          color: '#334155',
          lineHeight: 1.42,
          wordBreak: 'break-word',
          direction: 'rtl',
          textAlign: 'right',
          fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif",
          ...style
        }}
      >
        {items[0].content}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.24rem',
        width: '100%',
        direction: 'rtl',
        textAlign: 'right',
        fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif",
        ...style
      }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.35rem',
            fontSize,
            lineHeight: 1.38,
            color: '#334155'
          }}
        >
          {/* Bullet / Symbol Column */}
          {item.type === 'symbol' ? (
            <span
              style={{
                flexShrink: 0,
                fontSize: '0.74rem',
                lineHeight: 1.2,
                marginTop: '1px',
                fontFamily: "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif"
              }}
            >
              {item.prefix}
            </span>
          ) : item.type === 'number' ? (
            <span
              style={{
                flexShrink: 0,
                fontWeight: 800,
                color: bulletColor,
                fontSize: '0.68rem',
                minWidth: '15px'
              }}
            >
              {item.prefix}
            </span>
          ) : (
            <span
              style={{
                flexShrink: 0,
                display: 'inline-block',
                width: '5.5px',
                height: '5.5px',
                borderRadius: '50%',
                backgroundColor: bulletColor,
                marginTop: '5px'
              }}
            />
          )}

          {/* Text Content with Hanging Indent */}
          <span
            style={{
              flex: 1,
              wordBreak: 'break-word',
              color: '#1E293B',
              fontWeight: 500
            }}
          >
            {item.content}
          </span>
        </div>
      ))}
    </div>
  );
}

interface RichBulletTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  colorTheme?: 'teal' | 'emerald' | 'amber' | 'blue' | 'indigo';
  showPreviewToggle?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const THEME_COLORS = {
  teal: { primary: '#00B4D8', bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1' },
  emerald: { primary: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', text: '#047857' },
  amber: { primary: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
  blue: { primary: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  indigo: { primary: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA' }
};

export const QUICK_SYMBOLS = [
  { symbol: '•', label: 'نقطة', title: 'إدراج نقطة تعداد (•)' },
  { symbol: '✓', label: 'صح', title: 'إدراج علامة صح (✓)' },
  { symbol: '🔹', label: 'معين', title: 'إدراج معين أزرق (🔹)' },
  { symbol: '⭐', label: 'نجمة', title: 'إدراج نجمة تميز (⭐)' },
  { symbol: '📌', label: 'دبوس', title: 'إدراج دبوس تثبيت (📌)' },
  { symbol: '🎯', label: 'هدف', title: 'إدراج هدف محدد (🎯)' },
  { symbol: '💡', label: 'فكرة', title: 'إدراج فكرة وتوصية (💡)' },
  { symbol: '▪', label: 'مربع', title: 'إدراج مربع نقطي (▪)' },
  { symbol: '1.', label: 'ترقيم', title: 'إدراج رقم تعداد (1.)' }
];

export function RichBulletTextarea({
  value,
  onChange,
  placeholder = 'اكتب النقاط هنا...',
  rows = 3,
  label,
  colorTheme = 'teal',
  showPreviewToggle = true,
  disabled = false,
  style = {},
  className = 'form-textarea'
}: RichBulletTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const theme = THEME_COLORS[colorTheme] || THEME_COLORS.teal;

  // Insert symbol at current cursor position
  const insertSymbol = (sym: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value ? `${value}\n${sym} ` : `${sym} `);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const text = value || '';

    // If text is selected across multiple lines, prepend symbol to each line
    if (start !== end && text.substring(start, end).includes('\n')) {
      const selected = text.substring(start, end);
      const replaced = selected
        .split('\n')
        .map(l => (l.trim().length > 0 ? `${sym} ${l.replace(/^[•\-\*▪▫✓🔹⭐📌🎯💡]\s*/, '')}` : l))
        .join('\n');
      const nextVal = text.substring(0, start) + replaced + text.substring(end);
      onChange(nextVal);
      return;
    }

    // If cursor is at line start
    const isLineStart = start === 0 || text[start - 1] === '\n';
    const insertStr = isLineStart ? `${sym} ` : `\n${sym} `;

    const nextVal = text.substring(0, start) + insertStr + text.substring(end);
    onChange(nextVal);

    setTimeout(() => {
      textarea.focus();
      const nextPos = start + insertStr.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  // Smart keyboard Enter handling (auto bullet continuation / exit list)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start !== end) return;

      const text = textarea.value || '';
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const currentLine = text.substring(lineStart, start);

      // Check for bullet or symbol match
      const bulletMatch = currentLine.match(/^(\s*)([•\-\*▪▫✓✔🔹🔸⭐📌🎯💡])\s*(.*)$/);
      const numberMatch = currentLine.match(/^(\s*)(\d+)[\.\)]\s*(.*)$/);

      if (bulletMatch) {
        const indent = bulletMatch[1];
        const symbol = bulletMatch[2];
        const lineText = bulletMatch[3];

        // If line is empty (user just pressed enter on empty bullet), remove bullet and exit list
        if (!lineText || lineText.trim().length === 0) {
          e.preventDefault();
          const before = text.substring(0, lineStart);
          const after = text.substring(start);
          const newValue = before + after;
          onChange(newValue);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
          return;
        }

        // Auto-continue next line with same bullet
        e.preventDefault();
        const insertText = `\n${indent}${symbol} `;
        const newValue = text.substring(0, start) + insertText + text.substring(start);
        onChange(newValue);
        const newPos = start + insertText.length;
        setTimeout(() => {
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }

      if (numberMatch) {
        const indent = numberMatch[1];
        const currentNum = parseInt(numberMatch[2], 10);
        const lineText = numberMatch[3];

        if (!lineText || lineText.trim().length === 0) {
          e.preventDefault();
          const before = text.substring(0, lineStart);
          const after = text.substring(start);
          const newValue = before + after;
          onChange(newValue);
          setTimeout(() => {
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
          return;
        }

        e.preventDefault();
        const nextNum = currentNum + 1;
        const insertText = `\n${indent}${nextNum}. `;
        const newValue = text.substring(0, start) + insertText + text.substring(start);
        onChange(newValue);
        const newPos = start + insertText.length;
        setTimeout(() => {
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }
    }
  };

  // Smart paste: intercepts MS Word / PowerPoint private use bullets and converts to clean symbols
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text/plain');
    if (!pastedText) return;

    const normalized = normalizeBulletText(pastedText);
    if (normalized !== pastedText) {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = textarea.value || '';
      const newValue = current.substring(0, start) + normalized + current.substring(end);
      onChange(newValue);

      const newPos = start + normalized.length;
      setTimeout(() => {
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  return (
    <div style={{ width: '100%', direction: 'rtl', ...style }}>
      {/* Header bar: Label & Quick Symbols & Preview Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.4rem',
          marginBottom: '0.35rem'
        }}
      >
        {label && (
          <label
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#0F2044',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            {label}
          </label>
        )}

        {/* Quick Symbol Toolbar */}
        {!disabled && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: '#F8FAFC',
              padding: '0.2rem 0.4rem',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B', marginLeft: '0.2rem' }}>
              رموز ونقاط:
            </span>
            {QUICK_SYMBOLS.map(item => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => insertSymbol(item.symbol)}
                title={item.title}
                style={{
                  background: '#fff',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '0.15rem 0.4rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#1E293B',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.15rem',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = theme.primary;
                  e.currentTarget.style.background = theme.bg;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.background = '#fff';
                }}
              >
                <span style={{ fontSize: '0.8rem' }}>{item.symbol}</span>
                <span style={{ fontSize: '0.64rem', color: '#64748B' }}>{item.label}</span>
              </button>
            ))}

            {showPreviewToggle && (
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  background: showPreview ? theme.primary : '#fff',
                  color: showPreview ? '#fff' : theme.text,
                  border: `1px solid ${showPreview ? theme.primary : theme.border}`,
                  borderRadius: '6px',
                  padding: '0.15rem 0.45rem',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  marginRight: '0.3rem'
                }}
                title="معاينة شكل النقاط كما ستظهر في التقرير الرسمي المطبوع"
              >
                {showPreview ? <Edit3 size={11} /> : <Eye size={11} />}
                {showPreview ? 'تحرير' : 'معاينة'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Editor OR Live Report Preview */}
      {showPreview ? (
        <div
          style={{
            background: '#fff',
            border: `1.5px solid ${theme.border}`,
            borderRadius: '14px',
            padding: '0.85rem 1rem',
            minHeight: `${rows * 28}px`,
            maxHeight: '220px',
            overflowY: 'auto'
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: theme.text, marginBottom: '0.4rem' }}>
            👁️ معاينة النقاط والتنسيق المعتمد في التقرير:
          </div>
          <FormattedReportPoints
            text={value}
            defaultText="لم تتم كتابة أي نقاط بعد... اضغط 'تحرير' للبدء في الكتابة أو إضافة الرموز."
            bulletColor={theme.primary}
            fontSize="0.75rem"
          />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          className={className}
          style={{
            width: '100%',
            fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Segoe UI', Tahoma, sans-serif",
            fontSize: '0.82rem',
            lineHeight: 1.6,
            direction: 'rtl',
            textAlign: 'right',
            resize: 'vertical',
            background: disabled ? '#F1F5F9' : '#fff',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.8 : 1
          }}
        />
      )}
    </div>
  );
}
