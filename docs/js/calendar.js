// Генератор системных напоминаний для Календаря iPhone (.ics)
(function (global) {
  'use strict';

  function escIcs(text) {
    return String(text || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function toUtcStamp(d) {
    return (
      d.getUTCFullYear() +
      pad2(d.getUTCMonth() + 1) +
      pad2(d.getUTCDate()) +
      'T' +
      pad2(d.getUTCHours()) +
      pad2(d.getUTCMinutes()) +
      pad2(d.getUTCSeconds()) +
      'Z'
    );
  }

  function toLocalStamp(dateStr, timeStr) {
    const cleanDate = String(dateStr || '').replace(/-/g, '');
    const m = String(timeStr || '10:00').match(/^(\d{2}):(\d{2})$/);
    const hh = m ? m[1] : '10';
    const mm = m ? m[2] : '00';
    return `${cleanDate}T${hh}${mm}00`;
  }

  function addMinutesLocal(dateStr, timeStr, deltaMin) {
    const [y, mo, d] = String(dateStr).split('-').map(Number);
    const [hh, mm] = String(timeStr || '10:00').split(':').map(Number);
    const dt = new Date(y, mo - 1, d, hh, mm + deltaMin, 0);
    return (
      dt.getFullYear() +
      pad2(dt.getMonth() + 1) +
      pad2(dt.getDate()) +
      'T' +
      pad2(dt.getHours()) +
      pad2(dt.getMinutes()) +
      '00'
    );
  }

  function exportTaskToCalendar(task) {
    if (!task || !task.title) return;
    const today = new Date();
    const fallbackDate = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
    const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(task.plan_date || '') ? task.plan_date : fallbackDate;
    const timeStr = /^\d{2}:\d{2}$/.test(task.remind_time || '') ? task.remind_time : '10:00';

    const dtStart = toLocalStamp(dateStr, timeStr);
    const dtEnd = addMinutesLocal(dateStr, timeStr, 30);
    const uid = `helptool-${task.id || Date.now()}-${Date.now()}@helptool.local`;

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HelpTool//iPhone Assistant//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${toUtcStamp(new Date())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escIcs(task.title)}`,
      'DESCRIPTION:Создано в Личном помощнике',
      'BEGIN:VALARM',
      'TRIGGER:-PT5M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escIcs(task.title)}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    const icsContent = lines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-${dateStr}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  global.HelpCalendar = {
    exportTaskToCalendar,
  };
})(window);
