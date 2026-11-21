// Локальный умный парсер быстрого ввода для iPhone (без lookbehind для совместимости с iOS 15+)
(function (global) {
  'use strict';

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function toDateStr(d = new Date()) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function addDaysStr(dateStr, delta) {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    const dt = new Date(y, m - 1, d + delta);
    return toDateStr(dt);
  }

  function getIsoDayOfWeek(dateStr = toDateStr()) {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    return day === 0 ? 7 : day;
  }

  function normalizeTime(raw = '') {
    const m = String(raw || '').trim().match(/^(\d{1,2})[:.](\d{2})$/);
    if (!m) return '';
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return '';
    return `${pad2(h)}:${pad2(min)}`;
  }

  function nextDateForIsoDay(targetIsoDay, todayStr = toDateStr()) {
    const currentIso = getIsoDayOfWeek(todayStr);
    let diff = targetIsoDay - currentIso;
    if (diff <= 0) diff += 7;
    return addDaysStr(todayStr, diff);
  }

  const TARGET_WEEKDAYS = [
    { day: 1, rx: /(^|[\s,;.(])в\s+(?:понедельник|пн)(?=$|[\s,;.!?)])/i },
    { day: 2, rx: /(^|[\s,;.(])во?\s+(?:вторник|вт)(?=$|[\s,;.!?)])/i },
    { day: 3, rx: /(^|[\s,;.(])в\s+(?:среду|ср)(?=$|[\s,;.!?)])/i },
    { day: 4, rx: /(^|[\s,;.(])в\s+(?:четверг|чт)(?=$|[\s,;.!?)])/i },
    { day: 5, rx: /(^|[\s,;.(])в\s+(?:пятницу|пт)(?=$|[\s,;.!?)])/i },
    { day: 6, rx: /(^|[\s,;.(])в\s+(?:субботу|сб)(?=$|[\s,;.!?)])/i },
    { day: 7, rx: /(^|[\s,;.(])в\s+(?:воскресенье|вс)(?=$|[\s,;.!?)])/i },
  ];

  function splitBookTitleAuthor(raw = '') {
    const clean = String(raw || '').trim().replace(/^["«']|["»']$/g, '').trim();
    const sep = clean.match(/^(.+?)\s+(?:—|–|-)\s+(.+)$/);
    if (sep && sep[1].trim().length >= 2 && sep[2].trim().length >= 2) {
      return { title: sep[1].trim(), author: sep[2].trim() };
    }
    return { title: clean || 'Книга', author: '' };
  }

  function guessGlobalCategory(text = '') {
    const low = String(text || '').toLowerCase();
    if (/уч[её]б|экзамен|курс|конспект|англ|книг/.test(low)) return 'Учёба';
    if (/проект|дизайн|портфолио|сайт|бот|приложен|код|фигм|работ/.test(low)) return 'Проекты';
    return 'Личное';
  }

  function matchHabitFromText(text, habits) {
    const clean = String(text || '').trim();
    if (!clean || clean.length > 80 || !Array.isArray(habits) || !habits.length) return null;
    const lower = clean.toLowerCase();

    for (const h of habits) {
      const hTitle = String(h.title || '').trim().toLowerCase();
      if (!hTitle) continue;
      const escaped = hTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const directRx = new RegExp(
        `^(?:сделал[аи]?|выполнил[аи]?|заполнил[аи]?|выпил[аи]?|прочитал[аи]?|отметил[аи]?|\\+|✓|✔)?\\s*${escaped}(?:\\s*[:—–-]?\\s*(.+))?$`,
        'i'
      );
      const m = lower.match(directRx);
      if (m) {
        const tail = (m[1] || '').trim();
        if (h.kind === 'value') {
          const val = tail || (h.target_value ? `${h.target_value} ${h.unit || ''}`.trim() : 'выполнено');
          return { habit: h, valueText: val };
        }
        if (!tail || /^(\+|да|ок|готово|сделано|выполнено|\d+.*)$/i.test(tail)) {
          return { habit: h, valueText: tail };
        }
      }
    }
    return null;
  }

  function classifyQuickInput(rawText, habits = []) {
    const text = String(rawText || '').trim();
    const today = toDateStr();
    const tomorrow = addDaysStr(today, 1);

    if (!text) {
      return { type: 'plan_global', clean_title: 'План', plan_date: '', remind_time: '', category: '' };
    }

    // 1. Отметка привычки
    const habitMatch = matchHabitFromText(text, habits);
    if (habitMatch) {
      return {
        type: 'habit_log',
        habit: habitMatch.habit,
        value_text: habitMatch.valueText,
        clean_title: habitMatch.habit.title,
      };
    }

    // 2. Книги
    const bookDoneMatch = text.match(/^(?:прочитал[аи]?|дочитал[аи]?)(?:\s+книгу)?\s*[:—–-]?\s+(.+)$/i);
    if (bookDoneMatch) {
      const ba = splitBookTitleAuthor(bookDoneMatch[1]);
      return { type: 'book_done', clean_title: ba.title, author: ba.author };
    }
    const bookReadMatch = text.match(/^(?:читаю|начал[аи]?\s+читать)(?:\s+книгу)?\s*[:—–-]?\s+(.+)$/i);
    if (bookReadMatch) {
      const ba = splitBookTitleAuthor(bookReadMatch[1]);
      return { type: 'book_reading', clean_title: ba.title, author: ba.author };
    }
    const bookPlanMatch = text.match(/^(?:книг[ау]|хочу\s+прочитать|прочитать(?:\s+книгу)?)\s*[:—–-]?\s+(.+)$/i);
    if (bookPlanMatch) {
      const ba = splitBookTitleAuthor(bookPlanMatch[1]);
      return { type: 'book_planned', clean_title: ba.title, author: ba.author };
    }

    // 3. Общие планы
    if (/^(?:общий\s+план|глобальн(?:о|ый\s+план)?|цель|на\s+будущее|без\s+срока|список|в\s+список|заметка|мысль|запомнить|купить|посмотреть)\s*[:—–-]?\s+(.+)$/i.test(text)) {
      const isKeepFull = /^(?:купить|посмотреть)\s+(.+)$/i.test(text);
      const hasDateWord = /(^|[\s,;.])(?:сегодня|завтра|послезавтра|в\s+\d{1,2}[:.]\d{2})(?=$|[\s,;.!?])/i.test(text);
      if (!hasDateWord) {
        const m = text.match(/^(?:общий\s+план|глобальн(?:о|ый\s+план)?|цель|на\s+будущее|без\s+срока|список|в\s+список|заметка|мысль|запомнить)\s*[:—–-]?\s+(.+)$/i);
        const title = m && !isKeepFull ? m[1].trim() : text;
        return {
          type: 'plan_global',
          clean_title: title,
          category: guessGlobalCategory(title),
        };
      }
    }

    // 4. Дневные задания (дата + время)
    let working = text;
    let targetDate = '';
    let remindTime = '';
    let hasExplicitCue = false;

    const cueMatch = working.match(/^(?:задание|план|задача|дело|напомни(?:ть)?)\s*[:—–-]?\s+(.+)$/i);
    if (cueMatch) {
      working = cueMatch[1].trim();
      hasExplicitCue = true;
    }

    if (/(^|[\s,;.])послезавтра(?=$|[\s,;.!?])/i.test(working)) {
      targetDate = addDaysStr(today, 2);
      working = working.replace(/(^|[\s,;.])послезавтра(?=$|[\s,;.!?])/i, '$1 ').trim();
    } else if (/(^|[\s,;.])завтра(?=$|[\s,;.!?])/i.test(working)) {
      targetDate = tomorrow;
      working = working.replace(/(^|[\s,;.])завтра(?=$|[\s,;.!?])/i, '$1 ').trim();
    } else if (/(^|[\s,;.])сегодня(?=$|[\s,;.!?])/i.test(working)) {
      targetDate = today;
      working = working.replace(/(^|[\s,;.])сегодня(?=$|[\s,;.!?])/i, '$1 ').trim();
    } else {
      const dmMatch = working.match(/(^|[\s,;.])(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?(?=$|[\s,;.!?])/);
      if (dmMatch) {
        const ddNum = parseInt(dmMatch[2], 10);
        const mmNum = parseInt(dmMatch[3], 10);
        if (ddNum >= 1 && ddNum <= 31 && mmNum >= 1 && mmNum <= 12) {
          const yyyy = dmMatch[4] || String(new Date().getFullYear());
          targetDate = `${yyyy}-${pad2(mmNum)}-${pad2(ddNum)}`;
          working = working.replace(dmMatch[0], dmMatch[1] + ' ').trim();
        }
      }
      if (!targetDate) {
        for (const wd of TARGET_WEEKDAYS) {
          if (wd.rx.test(working)) {
            targetDate = nextDateForIsoDay(wd.day, today);
            working = working.replace(wd.rx, '$1 ').trim();
            break;
          }
        }
      }
    }

    const prepTime = working.match(/(^|[\s,;.])(?:в|к|на)\s+(\d{1,2}[:.]\d{2})(?=$|[\s,;.!?])/i);
    const startTime = working.match(/^(\d{1,2}:\d{2})\s+/);
    const endTime = working.match(/\s+(\d{1,2}:\d{2})$/);
    if (prepTime) {
      const norm = normalizeTime(prepTime[2]);
      if (norm) {
        remindTime = norm;
        working = working.replace(prepTime[0], prepTime[1] + ' ').trim();
      }
    } else if (startTime) {
      const norm = normalizeTime(startTime[1]);
      if (norm) {
        remindTime = norm;
        working = working.replace(startTime[0], ' ').trim();
      }
    } else if (endTime) {
      const norm = normalizeTime(endTime[1]);
      if (norm) {
        remindTime = norm;
        working = working.replace(endTime[0], ' ').trim();
      }
    }

    working = working
      .replace(/^[\s,.:;—–-]+|[\s,.:;—–-]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/(?:^|\s)(?:в|во|к|на|до|с|со)$/i, '')
      .replace(/^(?:в|во)\s+/i, '')
      .trim();

    const cleanTitle = working || text;

    if (targetDate || remindTime || hasExplicitCue) {
      const finalDate = targetDate || today;
      const subType =
        finalDate === today ? 'plan_today' : finalDate === tomorrow ? 'plan_tomorrow' : 'plan_dated';
      return {
        type: subType,
        clean_title: cleanTitle,
        plan_date: finalDate,
        remind_time: remindTime,
      };
    }

    const isShortLine = !text.includes('\n') && text.length <= 90;
    const actionVerbRx =
      /^(?:сделать|сдать|написать|позвонить|отправить|подготовить|решить|выучить|повторить|зайти|записаться|оплатить|забрать|отнести|проверить|доделать|закончить)(?=$|[\s,;.!?])/i;

    if (isShortLine && actionVerbRx.test(text)) {
      return {
        type: 'plan_today',
        clean_title: text,
        plan_date: today,
        remind_time: '',
      };
    }

    return {
      type: 'plan_global',
      clean_title: text,
      plan_date: '',
      remind_time: '',
      category: guessGlobalCategory(text),
    };
  }

  global.HelpParser = {
    toDateStr,
    addDaysStr,
    getIsoDayOfWeek,
    normalizeTime,
    classifyQuickInput,
  };
})(window);
