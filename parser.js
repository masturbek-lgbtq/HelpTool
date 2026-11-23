const {
  toDateStr,
  addDaysStr,
  getIsoDayOfWeek,
  normalizeTime,
  getSetting,
  getHabits,
} = require('./db');

const DAY_ALIASES = [
  { day: 1, rx: /^(?:понедельник|пн|mon)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 2, rx: /^(?:вторник|вт|tue)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 3, rx: /^(?:среда|ср|wed)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 4, rx: /^(?:четверг|чт|thu)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 5, rx: /^(?:пятница|пт|fri)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 6, rx: /^(?:суббота|сб|sat)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 7, rx: /^(?:воскресенье|вс|sun)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
];

const TARGET_WEEKDAY_RX = [
  { day: 1, rx: /(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))в\s+(?:понедельник|пн)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 2, rx: /(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))во?\s+(?:вторник|вт)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 3, rx: /(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))в\s+(?:среду|ср)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 4, rx: /(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))в\s+(?:четверг|чт)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 5, rx: /(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))в\s+(?:пятницу|пт)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 6, rx: /(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))в\s+(?:субботу|сб)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
  { day: 7, rx: /(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))в\s+(?:воскресенье|вс)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu },
];

function nextDateForIsoDay(targetIsoDay, todayStr = toDateStr()) {
  const currentIso = getIsoDayOfWeek(todayStr);
  let diff = targetIsoDay - currentIso;
  if (diff <= 0) diff += 7;
  return addDaysStr(todayStr, diff);
}

// Попытка разобрать многострочное текстовое расписание
function parseScheduleText(rawText = '', defaultDay = null, defaultWeekType = 0) {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  let currentDay = defaultDay;
  let currentWeekType = defaultWeekType;
  const lessons = [];
  let numCounterByDay = {};

  for (let line of lines) {
    // Проверка переключения верхней/нижней недели
    if (/^(?:верхняя|1\s*неделя|неделя\s*1|числитель)\s*:?$/i.test(line)) {
      currentWeekType = 1;
      continue;
    }
    if (/^(?:нижняя|2\s*неделя|неделя\s*2|знаменатель)\s*:?$/i.test(line)) {
      currentWeekType = 2;
      continue;
    }

    // Проверка заголовка дня недели
    let matchedDayHeader = false;
    for (const d of DAY_ALIASES) {
      if (d.rx.test(line)) {
        const rest = line.replace(d.rx, '').replace(/^[\s:—–-]+/, '').trim();
        currentDay = d.day;
        if (!rest) {
          matchedDayHeader = true;
          break;
        }
        line = rest;
        break;
      }
    }
    if (matchedDayHeader) continue;

    // Ищем время вида 08:30 или 8:30-9:15
    const timeMatch = line.match(
      /(?:^|\s)(?:(\d)\s*[.)]\s*)?(\d{1,2}[:.]\d{2})(?:\s*[-–—]\s*(\d{1,2}[:.]\d{2}))?\s+(.+)$/
    );
    if (timeMatch) {
      const day = currentDay || getIsoDayOfWeek();
      const lessonNum =
        parseInt(timeMatch[1], 10) || (numCounterByDay[day] = (numCounterByDay[day] || 0) + 1);
      const startTime = normalizeTime(timeMatch[2]);
      const endTime = timeMatch[3] ? normalizeTime(timeMatch[3]) : '';
      let restText = timeMatch[4].trim();

      // Извлекаем ссылку, если есть
      let joinUrl = '';
      const urlMatch = restText.match(/https?:\/\/\S+/i);
      if (urlMatch) {
        joinUrl = urlMatch[0];
        restText = restText.replace(urlMatch[0], '').trim();
      }

      // Извлекаем кабинет или пометку в скобках / через запятую / "каб."
      let roomOrNote = '';
      const parenMatch = restText.match(/\(([^)]+)\)\s*$/);
      if (parenMatch) {
        roomOrNote = parenMatch[1].trim();
        restText = restText.slice(0, parenMatch.index).trim();
      } else {
        const kabMatch = restText.match(/(?:,|\s+)(?:каб\.?|кабинет|ауд\.?)\s*([0-9а-яa-z-]+)$/i);
        if (kabMatch) {
          roomOrNote = `каб. ${kabMatch[1]}`;
          restText = restText.slice(0, kabMatch.index).trim();
        }
      }

      const subject = restText.replace(/[\s,—–-]+$/, '').trim() || 'Урок';
      if (startTime) {
        lessons.push({
          day_of_week: day,
          week_type: currentWeekType,
          lesson_num: lessonNum,
          start_time: startTime,
          end_time: endTime,
          subject,
          room_or_note: roomOrNote,
          join_url: joinUrl,
        });
      }
    }
  }

  return lessons;
}

// Проверка: похоже ли сообщение целиком на загрузку расписания
function looksLikeScheduleBlock(text = '') {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return false;
  const parsed = parseScheduleText(text);
  return parsed.length >= 2;
}

// Попытка сопоставить текст с одной из существующих привычек пользователя
function matchHabitFromText(text = '') {
  const clean = String(text || '').trim();
  if (!clean || clean.length > 80) return null;
  const habits = getHabits();
  if (habits.length === 0) return null;

  const lower = clean.toLowerCase();

  for (const h of habits) {
    const hTitle = h.title.trim().toLowerCase();
    if (!hTitle) continue;

    // 1. Точное совпадение или "Привычка +" / "сделал <привычка>" / "выпил <привычка>"
    const escaped = hTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const directRx = new RegExp(
      `^(?:сделал[аи]?|выполнил[аи]?|заполнил[аи]?|выпил[аи]?|прочитал[аи]?|отметил[аи]?|\\+|✓|✔)?\\s*${escaped}(?:\\s*[:—–-]?\\s*(.+))?$`,
      'i'
    );
    const m = lower.match(directRx);
    if (m) {
      const tail = (m[1] || '').trim();
      if (h.kind === 'value') {
        const val = tail || (h.target_value ? `${h.target_value} ${h.unit}`.trim() : 'выполнено');
        return { habit: h, valueText: val };
      }
      if (!tail || /^(\+|да|ок|готово|сделано|выполнено|\d+.*)$/i.test(tail)) {
        return { habit: h, valueText: tail };
      }
    }
  }
  return null;
}

function splitBookTitleAuthor(raw = '') {
  const clean = String(raw || '').trim().replace(/^["«']|["»']$/g, '').trim();
  const sep = clean.match(/^(.+?)\s+(?:—|–|-)\s+(.+)$/);
  if (sep && sep[1].trim().length >= 2 && sep[2].trim().length >= 2) {
    return { title: sep[1].trim(), author: sep[2].trim() };
  }
  return { title: clean || 'Книга', author: '' };
}

function getConfiguredCategories() {
  try {
    const raw = getSetting('profile_config_json', '');
    if (raw) {
      const cfg = JSON.parse(raw);
      if (Array.isArray(cfg.categories) && cfg.categories.length > 0) {
        return cfg.categories.map((c) => String(typeof c === 'string' ? c : c.name || '').trim()).filter(Boolean);
      }
    }
  } catch {}
  return ['Учёба', 'Проекты', 'Личное'];
}

function guessGlobalCategory(text = '') {
  const low = String(text || '').toLowerCase();
  const cats = getConfiguredCategories();
  for (const c of cats) {
    const cl = c.toLowerCase();
    if (cl && low.includes(cl)) return c;
  }
  if (/работ|заказ|клиент|отч[её]т|созвон|встреч|смен|дедлайн|зарплат|офис/.test(low)) {
    if (cats.includes('Работа')) return 'Работа';
    if (cats.includes('Проекты')) return 'Проекты';
  }
  if (/уч[её]б|экзамен|контрольн|олимпиад|реферат|проект по|школ|урок|матем|алгебр|физик|англ|домашк|дз/.test(low)) {
    if (cats.includes('Учёба')) return 'Учёба';
    if (cats.includes('Домашка')) return 'Домашка';
    if (cats.includes('Работа')) return 'Работа';
  }
  if (/проект|дизайн|портфолио|сайт|бот|приложен|код|фигм/.test(low)) {
    if (cats.includes('Проекты')) return 'Проекты';
  }
  if (/спорт|трен|зал|бег|здоров/.test(low) && cats.includes('Спорт')) {
    return 'Спорт';
  }
  return '';
}

// Локальный умный классификатор сообщения
function classifyMessageLocal(rawText = '') {
  const text = String(rawText || '').trim();
  const today = toDateStr();
  const tomorrow = addDaysStr(today, 1);

  if (!text) {
    return {
      type: 'plan_global',
      clean_title: 'План',
      plan_date: '',
      remind_time: '',
      category: '',
    };
  }

  // 1. Явная загрузка блока расписания
  if (looksLikeScheduleBlock(text)) {
    const lessons = parseScheduleText(text);
    return {
      type: 'schedule_bulk',
      lessons,
      clean_title: `Расписание (${lessons.length})`,
    };
  }

  // 2. Проверка отметки существующей привычки
  const habitMatch = matchHabitFromText(text);
  if (habitMatch) {
    return {
      type: 'habit_log',
      habit: habitMatch.habit,
      value_text: habitMatch.valueText,
      clean_title: habitMatch.habit.title,
    };
  }

  // 3. База книг: «книга ...», «хочу прочитать ...», «читаю ...», «прочитал ...»
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

  // 4. Явные общие (глобальные) планы без срока
  if (/^(?:общий\s+план|глобальн(?:о|ый\s+план)?|цель|на\s+будущее|без\s+срока|список|в\s+список|заметка|мысль|запомнить|купить|посмотреть)\s*[:—–-]?\s+(.+)$/i.test(text)) {
    const isKeepFull = /^(?:купить|посмотреть)\s+(.+)$/i.test(text);
    const hasDateWord = /(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))(?:сегодня|завтра|послезавтра|в\s+\d{1,2}[:.]\d{2})(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu.test(text);
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

  // 5. Извлечение даты и времени для дневных заданий
  let working = text;
  let targetDate = '';
  let remindTime = '';
  let hasExplicitPlanCue = false;

  if (/^(?:задание|план|задача|дело|напомни(?:ть)?)\s*[:—–-]?\s+(.+)$/i.test(working)) {
    const m = working.match(/^(?:задание|план|задача|дело|напомни(?:ть)?)\s*[:—–-]?\s+(.+)$/i);
    working = m[1].trim();
    hasExplicitPlanCue = true;
  }

  // Сначала даты: сегодня / завтра / послезавтра / ДД.ММ(.ГГГГ) / день недели (чтобы 25.11 не принялось за время!)
  if (/(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))послезавтра(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu.test(working)) {
    targetDate = addDaysStr(today, 2);
    working = working.replace(/(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))послезавтра(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu, ' ').trim();
  } else if (/(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))завтра(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu.test(working)) {
    targetDate = tomorrow;
    working = working.replace(/(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))завтра(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu, ' ').trim();
  } else if (/(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))сегодня(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu.test(working)) {
    targetDate = today;
    working = working.replace(/(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))сегодня(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu, ' ').trim();
  } else {
    const dmMatch = working.match(/(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/u);
    if (dmMatch) {
      const ddNum = parseInt(dmMatch[1], 10);
      const mmNum = parseInt(dmMatch[2], 10);
      if (ddNum >= 1 && ddNum <= 31 && mmNum >= 1 && mmNum <= 12) {
        const dd = String(ddNum).padStart(2, '0');
        const mm = String(mmNum).padStart(2, '0');
        const yyyy = dmMatch[3] || String(new Date().getFullYear());
        targetDate = `${yyyy}-${mm}-${dd}`;
        working = working.replace(dmMatch[0], ' ').trim();
      }
    }
    if (!targetDate) {
      for (const wd of TARGET_WEEKDAY_RX) {
        if (wd.rx.test(working)) {
          targetDate = nextDateForIsoDay(wd.day, today);
          working = working.replace(wd.rx, ' ').trim();
          break;
        }
      }
    }
  }

  // Время "в 16:30" / "к 16.30" или "16:30" (с двоеточием) в начале/конце строки
  const timeMatch =
    working.match(/(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))(?:в|к|на)\s+(\d{1,2}[:.]\d{2})(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu) ||
    working.match(/^(\d{1,2}:\d{2})\s+/) ||
    working.match(/\s+(\d{1,2}:\d{2})$/);

  if (timeMatch) {
    const norm = normalizeTime(timeMatch[1]);
    if (norm) {
      remindTime = norm;
      working = working.replace(timeMatch[0], ' ').replace(/\s+/g, ' ').trim();
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

  // Если есть время, дата или явный маркер задания — это дневное задание
  if (targetDate || remindTime || hasExplicitPlanCue) {
    const finalDate = targetDate || today;
    const subType =
      finalDate === today
        ? 'plan_today'
        : finalDate === tomorrow
        ? 'plan_tomorrow'
        : 'plan_dated';
    return {
      type: subType,
      clean_title: cleanTitle,
      plan_date: finalDate,
      remind_time: remindTime,
    };
  }

  // Глаголы действия в короткой строке ("сделать дз", "сдать физику", "позвонить маме")
  const isShortLine = !text.includes('\n') && text.length <= 90;
  const actionVerbRx =
    /^(?:сделать|сдать|написать|позвонить|отправить|подготовить|решить|выучить|повторить|зайти|записаться|оплатить|забрать|отнести|проверить|доделать|закончить)(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))/iu;

  if (isShortLine && actionVerbRx.test(text)) {
    return {
      type: 'plan_today',
      clean_title: text,
      plan_date: today,
      remind_time: '',
    };
  }

  // По умолчанию — в «Общие планы»
  return {
    type: 'plan_global',
    clean_title: text,
    plan_date: '',
    remind_time: '',
    category: guessGlobalCategory(text),
  };
}

// ================= GEMINI ИИ-РАЗБОР (ОПЦИОНАЛЬНО: ФОТО, ГОЛОС, ТЕКСТ) =================

function getActiveGeminiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    getSetting('gemini_api_key', '') ||
    ''
  ).trim();
}

function getGeminiModel() {
  return (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
}

async function callGeminiGenerate(parts, systemInstruction = '') {
  const apiKey = getActiveGeminiKey();
  if (!apiKey) return null;
  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };
  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const textOut =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!textOut) return null;
  return JSON.parse(textOut);
}

// Распознавание скриншота/фото расписания через Gemini
async function parseScheduleImageWithGemini(base64Data, mimeType = 'image/jpeg', caption = '') {
  const prompt = `Распознай школьное расписание с изображения.
Верни JSON объект формата:
{
  "lessons": [
    {
      "day_of_week": 1, // 1=Понедельник ... 7=Воскресенье
      "lesson_num": 1,
      "start_time": "08:30", // формат HH:MM
      "end_time": "09:15", // формат HH:MM или ""
      "subject": "Название предмета",
      "room_or_note": "кабинет или примечание, если видно, иначе пусто"
    }
  ]
}
Если на картинке расписание только на один день и день указан в подписи (${caption || 'не указан'}), используй этот день.`;

  const parsed = await callGeminiGenerate([
    { text: prompt },
    { inlineData: { mimeType, data: base64Data } },
  ]);

  if (!parsed || !Array.isArray(parsed.lessons)) return [];
  return parsed.lessons
    .filter((l) => l && l.subject && l.start_time)
    .map((l, idx) => ({
      day_of_week: Math.min(7, Math.max(1, parseInt(l.day_of_week, 10) || 1)),
      week_type: 0,
      lesson_num: parseInt(l.lesson_num, 10) || idx + 1,
      start_time: normalizeTime(l.start_time) || '08:30',
      end_time: normalizeTime(l.end_time) || '',
      subject: String(l.subject).trim(),
      room_or_note: String(l.room_or_note || '').trim(),
      join_url: '',
    }));
}

// Расшифровка голосового сообщения и классификация через Gemini
async function transcribeAndClassifyVoiceWithGemini(base64Audio, mimeType = 'audio/ogg') {
  const today = toDateStr();
  const habits = getHabits().map((h) => `${h.title} (${h.kind})`).join(', ');
  const prompt = `Сегодняшняя дата: ${today}.
Список привычек пользователя: ${habits || 'пока нет'}.
Расшифруй голосовое сообщение на русском языке и классифицируй его.
Верни JSON:
{
  "transcript": "полный текст расшифровки",
  "category": "plan_dated" | "plan_global" | "book_planned" | "book_reading" | "book_done" | "habit_log",
  "clean_title": "короткая формулировка задания, общего плана или названия книги",
  "author": "автор книги (если это книга и автор назван, иначе пусто)",
  "plan_date": "YYYY-MM-DD (для plan_dated, по умолчанию ${today})",
  "remind_time": "HH:MM или пусто",
  "habit_title": "название привычки, если это habit_log",
  "habit_value": "значение привычки, если названо"
}`;

  return callGeminiGenerate([
    { text: prompt },
    { inlineData: { mimeType, data: base64Audio } },
  ]);
}

module.exports = {
  parseScheduleText,
  looksLikeScheduleBlock,
  matchHabitFromText,
  classifyMessageLocal,
  getActiveGeminiKey,
  parseScheduleImageWithGemini,
  transcribeAndClassifyVoiceWithGemini,
};
