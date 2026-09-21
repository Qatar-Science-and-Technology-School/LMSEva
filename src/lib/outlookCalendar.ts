/**
 * Microsoft Outlook & Calendar Integration Utility
 * منظومة تقييم ومتابعة حصص التعليم الإلكتروني النموذجية
 * مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين
 */

import type { ModelLessonScheduleItem } from './data';

export interface PeriodTiming {
  period: string;
  label: string;
  startTime: string; // "HH:MM" in 24h
  endTime: string;   // "HH:MM" in 24h
}

/**
 * Standard School Schedule Period Timings for Qatar Secondary Schools (QSTSS)
 * 45-minute lesson periods
 */
export const SCHOOL_PERIOD_TIMINGS: Record<string, PeriodTiming> = {
  '1': { period: '1', label: 'الحصة الأولى', startTime: '07:10', endTime: '07:55' },
  '2': { period: '2', label: 'الحصة الثانية', startTime: '08:00', endTime: '08:45' },
  '3': { period: '3', label: 'الحصة الثالثة', startTime: '09:25', endTime: '10:10' },
  '4': { period: '4', label: 'الحصة الرابعة', startTime: '10:15', endTime: '11:00' },
  '5': { period: '5', label: 'الحصة الخامسة', startTime: '11:05', endTime: '11:50' },
  '6': { period: '6', label: 'الحصة السادسة', startTime: '12:10', endTime: '12:55' },
  '7': { period: '7', label: 'الحصة السابعة', startTime: '13:00', endTime: '13:45' },
};

/**
 * Get timing for a specific period, with fallback
 */
export function getPeriodTiming(period: string): PeriodTiming {
  return (
    SCHOOL_PERIOD_TIMINGS[period] || {
      period,
      label: `الحصة ${period}`,
      startTime: '08:00',
      endTime: '08:45',
    }
  );
}

/**
 * Escape text for iCalendar RFC 5545 format
 */
function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
}

/**
 * Clean ISO date formatting for iCalendar
 */
function toIcsDateStr(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.replace(/[^0-9]/g, '');
  const cleanTime = timeStr.replace(/[^0-9]/g, '');
  return `${cleanDate}T${cleanTime.padEnd(4, '0')}00`;
}

/**
 * Build rich event details for a model lesson
 */
export function buildLessonEventDetails(item: ModelLessonScheduleItem) {
  const timing = getPeriodTiming(item.period);
  const title = `حصة تعليم إلكتروني: ${item.teacherNameAr} - ${item.subject || ''} (${item.lessonTopic || 'حصة نموذجية'})`;
  const location = `مدرسة قطر للعلوم والتكنولوجيا - ${item.roomVenue || 'الصف الدراسي'} (صف ${item.classGrade})`;

  const description = [
    `📌 منظومة تقييم ومتابعة حصص التعليم الإلكتروني النموذجية`,
    `مدرسة قطر للعلوم والتكنولوجيا الثانوية للبنين`,
    `--------------------------------------------------`,
    `👨‍🏫 المعلم: ${item.teacherNameAr}${item.teacherNameEn ? ` (${item.teacherNameEn})` : ''}`,
    `📚 القسم والمادة: ${item.departmentName || ''} / ${item.subject || ''}`,
    `📅 الموعد: ${item.dayName || ''} ${item.date}`,
    `⏰ التوقيت: ${timing.label} (${timing.startTime} - ${timing.endTime})`,
    `🏫 الصف والشعبة: ${item.classGrade}`,
    `📍 القاعة / المكان: ${item.roomVenue || 'الصف الدراسي'}`,
    `🎯 موضوع الحصة: ${item.lessonTopic || 'حصة تعليم إلكتروني نموذجية'}`,
    item.toolsPlanned ? `💻 الأدوات والمنصات الرقمية: ${item.toolsPlanned}` : '',
    item.notes ? `📝 ملاحظات: ${item.notes}` : '',
    `--------------------------------------------------`,
    `رابط المنظومة: https://lmseva-qstss.web.app`
  ]
    .filter(Boolean)
    .join('\n');

  return { timing, title, location, description };
}

/**
 * Generate iCalendar (.ics) format file content for a single scheduled lesson
 * Includes Microsoft Outlook VALARM component for reminder notification
 */
export function generateIcsForLesson(item: ModelLessonScheduleItem, reminderMinutes: number = 15): string {
  const { timing, title, location, description } = buildLessonEventDetails(item);
  const dtStart = toIcsDateStr(item.date, timing.startTime);
  const dtEnd = toIcsDateStr(item.date, timing.endTime);

  const now = new Date();
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `lesson-${item.id || Date.now()}-${Math.random().toString(36).substring(2, 8)}@qstss.edu.qa`;

  const alarmTrigger = reminderMinutes >= 1440
    ? `-P${Math.round(reminderMinutes / 1440)}D`
    : `-PT${reminderMinutes}M`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Qatar Science and Technology Secondary School//LMS System//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:حصص التعليم الإلكتروني النموذجية - QSTSS',
    'X-WR-TIMEZONE:Asia/Qatar',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Qatar',
    'X-LIC-LOCATION:Asia/Qatar',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0300',
    'TZNAME:AST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Asia/Qatar:${dtStart}`,
    `DTEND;TZID=Asia/Qatar:${dtEnd}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(`تنبيه: حصة تعليم إلكتروني بعد قليل للمعلم ${item.teacherNameAr}`)}`,
    `TRIGGER:${alarmTrigger}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

/**
 * Generate iCalendar (.ics) format file content for multiple scheduled lessons
 */
export function generateBulkIcsForLessons(items: ModelLessonScheduleItem[], reminderMinutes: number = 15): string {
  const now = new Date();
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Qatar Science and Technology Secondary School//LMS System//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:جدول حصص التعليم الإلكتروني النموذجية - QSTSS',
    'X-WR-TIMEZONE:Asia/Qatar',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Qatar',
    'X-LIC-LOCATION:Asia/Qatar',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0300',
    'TZNAME:AST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  items.forEach(item => {
    const { timing, title, location, description } = buildLessonEventDetails(item);
    const dtStart = toIcsDateStr(item.date, timing.startTime);
    const dtEnd = toIcsDateStr(item.date, timing.endTime);
    const uid = `lesson-${item.id || Date.now()}-${Math.random().toString(36).substring(2, 8)}@qstss.edu.qa`;
    const alarmTrigger = reminderMinutes >= 1440 ? `-P${Math.round(reminderMinutes / 1440)}D` : `-PT${reminderMinutes}M`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;TZID=Asia/Qatar:${dtStart}`,
      `DTEND;TZID=Asia/Qatar:${dtEnd}`,
      `SUMMARY:${escapeIcsText(title)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `LOCATION:${escapeIcsText(location)}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(`تنبيه: حصة تعليم إلكتروني بعد قليل للمعلم ${item.teacherNameAr}`)}`,
      `TRIGGER:${alarmTrigger}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Generate Microsoft 365 / Outlook Web compose link
 * Used for Qatar Ministry of Education accounts (@education.qa)
 */
export function getOutlookWebCalendarUrl(item: ModelLessonScheduleItem): string {
  const { timing, title, location, description } = buildLessonEventDetails(item);

  const startIso = `${item.date}T${timing.startTime}:00`;
  const endIso = `${item.date}T${timing.endTime}:00`;

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: startIso,
    enddt: endIso,
    location: location,
    body: description,
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Personal Microsoft Outlook Live link
 */
export function getOutlookLiveCalendarUrl(item: ModelLessonScheduleItem): string {
  const { timing, title, location, description } = buildLessonEventDetails(item);
  const startIso = `${item.date}T${timing.startTime}:00`;
  const endIso = `${item.date}T${timing.endTime}:00`;

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: startIso,
    enddt: endIso,
    location: location,
    body: description,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Google Calendar Web URL
 */
export function getGoogleCalendarUrl(item: ModelLessonScheduleItem): string {
  const { timing, title, location, description } = buildLessonEventDetails(item);
  const cleanDate = item.date.replace(/[^0-9]/g, '');
  const sTime = timing.startTime.replace(/[^0-9]/g, '').padEnd(4, '0');
  const eTime = timing.endTime.replace(/[^0-9]/g, '').padEnd(4, '0');

  const dates = `${cleanDate}T${sTime}00/${cleanDate}T${eTime}00`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: dates,
    details: description,
    location: location,
    ctz: 'Asia/Qatar',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Trigger download of an .ics file in browser
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
