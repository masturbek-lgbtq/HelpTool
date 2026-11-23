const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');

const {
  DAY_NAMES_FULL,
  DAY_NAMES_SHORT,
  toDateStr,
  toTimeStr,
  addDaysStr,
  getIsoDayOfWeek,
  normalizeTime,
  timeToMinutes,
  getSetting,
  setSetting,
  getAllSettings,
  getWeekTypeForDate,
  toggleCurrentWeekType,
  addLesson,
  getLessonById,
  updateLesson,
  deleteLesson,
  clearDayLessons,
  clearAllLessons,
  toggleCancelLessonForDate,
  getAllLessons,
  getLessonsForDay,
  getLessonsForDate,
  wasLessonAlertSent,
  markLessonAlertSent,
  getHabits,
  getHabitById,
  addHabit,
  updateHabit,
  deleteHabit,
  getHabitLog,
  setHabitLog,
  toggleHabitCheck,
  getHabitsForDate,
  getHabitsHistoryGrid,
  cleanupExpiredPlans,
  addPlan,
  getPlanById,
  togglePlanDone,
  togglePlanPriority,
  updatePlan,
  movePlanToDate,
  moveAllOverdueToToday,
  takeGlobalPlanToToday,
  deletePlan,
  clearDoneGlobalPlans,
  clearDoneSimplePlans,
  getOverdueDailyPlans,
  getPlansForDate,
  getUpcomingDatedPlans,
  getGlobalPlans,
  getSimpleListPlans,
  getDuePlanReminders,
  markPlanReminded,
  getBooks,
  getBookById,
  addBook,
  updateBook,
  cycleBookStatus,
  deleteBook,
  saveInboxEvent,
  getInboxEvent,
  removeInboxTarget,
  reclassifyInboxEvent,
  exportVaultBackup,
  importVaultBackup,
} = require('./db');

const {
  parseScheduleText,
  classifyMessageLocal,
  getActiveGeminiKey,
  parseScheduleImageWithGemini,
  transcribeAndClassifyVoiceWithGemini,
} = require('./parser');

// Загрузка .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
  } else {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const ENV_ALLOWED_IDS = (process.env.ALLOWED_USER_ID || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const WEB_PORT = parseInt(process.env.WEB_PORT || '3847', 10);

// Если BOT_TOKEN передан через .env — переносим его в зашифрованную БД (DPAPI)
const ENV_BOT_TOKEN = (process.env.BOT_TOKEN || '').trim();
if (ENV_BOT_TOKEN) {
  setSetting('bot_token', ENV_BOT_TOKEN);
}

function getActiveBotToken() {
  const envTok = (process.env.BOT_TOKEN || '').trim();
  const dbTok = (getSetting('bot_token', '') || '').trim();
  return envTok || dbTok;
}

function safeWriteFile(filePath, content, options) {
  try {
    fs.writeFileSync(filePath, content, options);
  } catch (err) {
    if (err && (err.code === 'EPERM' || err.code === 'EACCES') && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
      fs.writeFileSync(filePath, content, options);
      if (process.platform === 'win32') {
        try {
          execFileSync('attrib', ['+H', filePath], { windowsHide: true });
        } catch {}
      }
      return;
    }
    throw err;
  }
}

// Записываем bot.pid для удобного управления фоновым процессом
const PID_FILE = path.join(__dirname, 'bot.pid');
try {
  safeWriteFile(PID_FILE, String(process.pid), 'utf8');
} catch {}

const GITHUB_OWNER = 'masturbek-lgbtq';
const GITHUB_REPO = 'HelpTool';
const APP_VERSION_FILE = path.join(__dirname, '.app-version.json');

function readLocalAppVersion() {
  try {
    if (!fs.existsSync(APP_VERSION_FILE)) {
      return { edition: '', schoolEnabled: undefined, commitSha: '', fileShas: {} };
    }
    const parsed = JSON.parse(fs.readFileSync(APP_VERSION_FILE, 'utf8').replace(/^\uFEFF/, ''));
    return {
      edition: typeof parsed.edition === 'string' ? parsed.edition.trim() : '',
      schoolEnabled: typeof parsed.schoolEnabled === 'boolean' ? parsed.schoolEnabled : undefined,
      commitSha: typeof parsed.commitSha === 'string' ? parsed.commitSha.trim() : '',
      fileShas: parsed.fileShas && typeof parsed.fileShas === 'object' ? parsed.fileShas : {},
    };
  } catch {
    return { edition: '', schoolEnabled: undefined, commitSha: '', fileShas: {} };
  }
}

function isDefaultEditionSchoolEnabled() {
  try {
    const ver = readLocalAppVersion();
    if (ver.edition === 'friend' || ver.schoolEnabled === false) return false;
    if (ver.edition === 'personal' || ver.schoolEnabled === true) return true;
  } catch {}
  if (process.env.ENABLE_SCHOOL === '1') return true;
  if (process.env.DISABLE_SCHOOL === '1') return false;
  return fs.existsSync(path.join(__dirname, '.git'));
}

function isSchoolEnabled() {
  try {
    const raw = getSetting('profile_config_json', '');
    if (raw) {
      const cfg = JSON.parse(raw);
      if (cfg && cfg.sections && cfg.sections.lessons && typeof cfg.sections.lessons.enabled === 'boolean') {
        return cfg.sections.lessons.enabled;
      }
    }
  } catch {}
  return isDefaultEditionSchoolEnabled();
}

function getWebAccessKey() {
  const token = getActiveBotToken();
  if (!token) return '';
  return crypto
    .createHash('sha256')
    .update(`${token}:personal-assistant-key`)
    .digest('hex')
    .slice(0, 24);
}

let publicTunnelUrl = '';
let tunnelProcess = null;
const userSessions = new Map();

// Нижняя панель в чате: единая система разделов + Обзор
function getMainReplyKeyboard() {
  const row1 = isSchoolEnabled()
    ? [{ text: 'Обзор' }, { text: 'Расписание' }, { text: 'Задания' }]
    : [{ text: 'Обзор' }, { text: 'Задания' }];
  return {
    keyboard: [
      row1,
      [{ text: 'Общие планы' }, { text: 'Привычки' }, { text: 'Книги' }],
    ],
    resize_keyboard: true,
  };
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(str = '', maxLen = 40) {
  const clean = String(str || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 1).trimEnd() + '…';
}

function formatHumanDateShort(dateStr = '') {
  const m = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateStr;
  return `${m[3]}.${m[2]}`;
}

function getWebAppUrl() {
  const webKey = getWebAccessKey();
  if (!publicTunnelUrl || !webKey) return '';
  return `${publicTunnelUrl}/?k=${webKey}`;
}

function makeWebAppButtonRow(label = 'Открыть экран') {
  const url = getWebAppUrl();
  if (!url) return null;
  return [{ text: label, web_app: { url } }];
}

// Авторизация только для владельца
function isAuthorized(userId, chatId = null) {
  const uidStr = String(userId);
  if (ENV_ALLOWED_IDS.length > 0) {
    const ok = ENV_ALLOWED_IDS.includes(uidStr);
    if (ok && chatId) {
      setSetting('owner_user_id', uidStr);
      setSetting('owner_chat_id', String(chatId));
    }
    return ok;
  }

  const savedOwner = getSetting('owner_user_id', '');
  if (!savedOwner) {
    // Автопривязка первого пользователя (владельца)
    setSetting('owner_user_id', uidStr);
    if (chatId) setSetting('owner_chat_id', String(chatId));
    return true;
  }

  if (savedOwner === uidStr) {
    if (chatId && getSetting('owner_chat_id', '') !== String(chatId)) {
      setSetting('owner_chat_id', String(chatId));
    }
    return true;
  }
  return false;
}

// ================= TELEGRAM API =================

async function callApi(method, payload = {}) {
  const token = getActiveBotToken();
  if (!token) {
    throw new Error('BOT_TOKEN не задан');
  }
  const apiBase = `https://api.telegram.org/bot${token}`;
  const timeoutMs = method === 'getUpdates' ? 45000 : 15000;
  const res = await fetch(`${apiBase}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json();
  if (!data.ok) {
    if (
      data.description &&
      data.description.includes('message is not modified')
    ) {
      return null;
    }
    throw new Error(`Telegram API [${method}]: ${data.description}`);
  }
  return data.result;
}

async function sendMessage(chatId, text, extra = {}) {
  const res = await callApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra,
  });
  try {
    const kb = extra?.reply_markup?.inline_keyboard;
    if (res?.message_id && Array.isArray(kb)) {
      const hasWebApp = kb.some(
        (row) => Array.isArray(row) && row.some((btn) => Boolean(btn.web_app))
      );
      if (hasWebApp) {
        setSetting('last_webapp_message_id', String(res.message_id));
      }
    }
  } catch {}
  return res;
}

function editMessageText(chatId, messageId, text, extra = {}) {
  return callApi('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra,
  });
}

function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
  return callApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
  }).catch(() => {});
}

async function downloadTelegramFileBase64(fileId) {
  const token = getActiveBotToken();
  if (!token) {
    throw new Error('BOT_TOKEN не задан');
  }
  const fileInfo = await callApi('getFile', { file_id: fileId });
  if (!fileInfo || !fileInfo.file_path) {
    throw new Error('Не удалось получить файл из Telegram');
  }
  const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
  const res = await fetch(fileUrl, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} при скачивании файла`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString('base64');
}

async function updateTelegramMenuButton() {
  if (!getActiveBotToken()) return;
  const url = getWebAppUrl();
  if (!url) return;
  const menu_button = {
    type: 'web_app',
    text: 'Экран',
    web_app: { url },
  };
  try {
    await callApi('setChatMenuButton', { menu_button });
    const ownerChatId = getSetting('owner_chat_id', '');
    if (ownerChatId) {
      await callApi('setChatMenuButton', {
        chat_id: Number(ownerChatId),
        menu_button,
      }).catch(() => {});

      const lastMsgId = parseInt(getSetting('last_webapp_message_id', '0'), 10);
      const view = buildTodayView();
      if (lastMsgId > 0) {
        await editMessageText(Number(ownerChatId), lastMsgId, view.text, {
          reply_markup: view.reply_markup,
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Не удалось обновить кнопку меню WebApp:', err.message);
  }
}

// ================= ПОСТРОЕНИЕ ЭКРАНОВ В ЧАТЕ =================

function buildTodayView() {
  const today = toDateStr();
  const isoDay = getIsoDayOfWeek(today);
  const schoolOn = isSchoolEnabled();
  const wt = getWeekTypeForDate(today);
  const mode2 = schoolOn && getSetting('week_cycle_mode', '1') === '2';
  const pauseAll = getSetting('pause_all', '0') === '1';
  const pauseLessons = schoolOn && getSetting('pause_lessons', '0') === '1';

  const lessons = schoolOn ? getLessonsForDate(today) : [];
  const habits = getHabitsForDate(today).filter((h) => h.scheduled_today);
  const overdue = getOverdueDailyPlans(today);
  const plans = getPlansForDate(today);
  const globals = getGlobalPlans().filter((g) => !g.is_done);
  const books = getBooks();
  const readingBooks = books.filter((b) => b.status === 'reading');

  const lines = [];
  const weekTag = mode2 ? ` · ${wt === 1 ? 'Верхняя' : 'Нижняя'} нед.` : '';
  lines.push(`<b>Обзор дня · ${DAY_NAMES_FULL[isoDay]}, ${formatHumanDateShort(today)}</b>${weekTag}`);

  if (pauseAll) {
    lines.push(`<i>× Включена полная тишина</i>`);
  } else if (pauseLessons) {
    lines.push(`<i>◐ Уроки на паузе (каникулы / болезнь)</i>`);
  }

  // 1. Уроки (только если включён школьный раздел)
  if (schoolOn) {
    lines.push(``, `<b>Школьное расписание</b>`);
    if (lessons.length === 0) {
      lines.push(`<i>Сегодня уроков нет</i>`);
    } else {
      for (const l of lessons) {
        const sym = l.is_cancelled_today ? '×' : '●';
        const timeStr = l.end_time ? `${l.start_time}–${l.end_time}` : l.start_time;
        const room = l.room_or_note ? ` · ${escapeHtml(l.room_or_note)}` : '';
        if (l.is_cancelled_today) {
          lines.push(`${sym} <s>${timeStr} ${escapeHtml(l.subject)}</s> <i>(отменён)</i>`);
        } else {
          lines.push(`${sym} <code>${timeStr}</code> ${escapeHtml(l.subject)}${room}`);
        }
      }
    }
  }

  // 2. Дневные задания
  lines.push(``, `<b>Дневные задания</b>`);
  if (overdue.length > 0) {
    lines.push(`<i>С прошлых дней не закрыто: ${overdue.length}</i>`);
  }
  if (plans.length === 0) {
    lines.push(`<i>На сегодня пусто</i>`);
  } else {
    for (const p of plans) {
      const sym = p.is_done ? '●' : '○';
      const t = p.remind_time ? ` <code>${p.remind_time}</code>` : '';
      const titleHtml = p.is_done ? `<s>${escapeHtml(p.title)}</s>` : escapeHtml(p.title);
      lines.push(`${sym}${t} ${titleHtml}`);
    }
  }

  // 3. Привычки
  lines.push(``, `<b>Привычки</b>`);
  if (habits.length === 0) {
    lines.push(`<i>Пока не добавлены</i>`);
  } else {
    for (const h of habits) {
      const isDone = h.log_status === 'done';
      const sym = isDone ? '●' : '○';
      const valStr = h.log_value ? ` (${escapeHtml(h.log_value)})` : '';
      const streakStr = h.streak > 0 ? ` · ${h.streak} дн.` : '';
      lines.push(`${sym} ${escapeHtml(h.title)}${valStr}${streakStr}`);
    }
  }

  // 4. Общие планы (коротко важные)
  if (globals.length > 0) {
    lines.push(``, `<b>Общие планы</b> (${globals.length})`);
    for (const g of globals.slice(0, 3)) {
      const star = g.is_priority ? '★ ' : '○ ';
      const cat = g.category ? ` <i>· ${escapeHtml(g.category)}</i>` : '';
      lines.push(`${star}${escapeHtml(truncate(g.title, 50))}${cat}`);
    }
  }

  // 5. Книги
  const plannedCnt = books.filter((b) => b.status === 'planned').length;
  const doneCnt = books.filter((b) => b.status === 'done').length;
  lines.push(``, `<b>Книги</b>`);
  if (readingBooks.length > 0) {
    for (const b of readingBooks.slice(0, 2)) {
      const auth = b.author ? ` — ${escapeHtml(b.author)}` : '';
      const note = b.note ? ` (${escapeHtml(b.note)})` : '';
      lines.push(`● Читаю: <b>${escapeHtml(b.title)}</b>${auth}${note}`);
    }
  } else {
    lines.push(`<i>В планах: ${plannedCnt} · Прочитано: ${doneCnt}</i>`);
  }

  const inline_keyboard = [];
  const webRow = makeWebAppButtonRow('Открыть экран «Обзор дня»');
  if (webRow) inline_keyboard.push(webRow);

  for (const h of habits.slice(0, 3)) {
    const isDone = h.log_status === 'done';
    inline_keyboard.push([
      {
        text: `${isDone ? '●' : '○'} Привычка: ${truncate(h.title, 22)}${h.log_value ? ' · ' + h.log_value : ''}`,
        callback_data: h.kind === 'value' ? `hab_val:${h.id}:today` : `hab_tog:${h.id}:today`,
      },
    ]);
  }

  for (const p of plans.slice(0, 3)) {
    inline_keyboard.push([
      {
        text: `${p.is_done ? '●' : '○'} Задание: ${truncate(p.title, 24)}`,
        callback_data: `pl_tog:${p.id}:today_home`,
      },
    ]);
  }

  const navRow1 = schoolOn
    ? [
        { text: 'Расписание', callback_data: `nav:lessons:${isoDay}` },
        { text: 'Задания', callback_data: `nav:plans:today` },
        { text: 'Общие планы', callback_data: `nav:plans:global` },
      ]
    : [
        { text: 'Задания', callback_data: `nav:plans:today` },
        { text: 'Общие планы', callback_data: `nav:plans:global` },
      ];
  inline_keyboard.push(navRow1);
  inline_keyboard.push([
    { text: 'Привычки', callback_data: `nav:habits` },
    { text: 'Книги', callback_data: `nav:books:all` },
    { text: 'Пауза', callback_data: `nav:pause` },
  ]);

  return { text: lines.join('\n'), reply_markup: { inline_keyboard } };
}

function buildLessonsView(selectedDay = getIsoDayOfWeek()) {
  const day = Math.min(7, Math.max(1, parseInt(selectedDay, 10) || getIsoDayOfWeek()));
  const today = toDateStr();
  const isToday = day === getIsoDayOfWeek(today);
  const mode2 = getSetting('week_cycle_mode', '1') === '2';
  const currentWt = getWeekTypeForDate(today);
  const pauseLessons = getSetting('pause_lessons', '0') === '1';

  const lessons = getLessonsForDay(day, mode2 ? currentWt : 0);

  const lines = [
    `<b>Расписание · ${DAY_NAMES_FULL[day]}</b>${mode2 ? ` (${currentWt === 1 ? 'Верхняя 1' : 'Нижняя 2'})` : ''}`,
  ];
  if (pauseLessons) {
    lines.push(`<i>◐ Уведомления об уроках на паузе</i>`);
  }
  lines.push('');

  if (lessons.length === 0) {
    lines.push(`<i>На этот день уроков нет.</i>`);
    lines.push(`<i>Отправьте список текстом, фото расписания или добавьте урок кнопкой ниже.</i>`);
  } else {
    for (const l of lessons) {
      const cancelled = isToday && l.cancelled_date === today;
      const timeStr = l.end_time ? `${l.start_time}–${l.end_time}` : l.start_time;
      const room = l.room_or_note ? ` · ${escapeHtml(l.room_or_note)}` : '';
      const link = l.join_url ? ` · <a href="${escapeHtml(l.join_url)}">вход</a>` : '';
      if (cancelled) {
        lines.push(`× <s><code>${timeStr}</code> ${escapeHtml(l.subject)}</s> <i>(отменен сегодня)</i>`);
      } else {
        lines.push(`● <code>${timeStr}</code> <b>${escapeHtml(l.subject)}</b>${room}${link}`);
      }
    }
  }

  const inline_keyboard = [];

  // Переключатель дней Пн..Вс
  inline_keyboard.push(
    [1, 2, 3, 4, 5, 6, 7].map((d) => ({
      text: d === day ? `[${DAY_NAMES_SHORT[d]}]` : DAY_NAMES_SHORT[d],
      callback_data: `nav:lessons:${d}`,
    }))
  );

  // Быстрая отмена или удаление уроков выбранного дня
  for (const l of lessons) {
    const cancelled = isToday && l.cancelled_date === today;
    const row = [];
    if (l.join_url && !cancelled) {
      row.push({ text: `${truncate(l.subject, 14)} →`, url: l.join_url });
    }
    if (isToday) {
      row.push({
        text: cancelled ? `Вернуть: ${truncate(l.subject, 14)}` : `Отменить сегодня: ${truncate(l.subject, 12)}`,
        callback_data: `les_can:${l.id}:${day}`,
      });
    }
    row.push({
      text: `× ${truncate(l.subject, 10)}`,
      callback_data: `les_del:${l.id}:${day}`,
    });
    inline_keyboard.push(row);
  }

  inline_keyboard.push([
    { text: '+ Урок', callback_data: `les_add:${day}` },
    { text: 'Загрузить список / фото', callback_data: `les_import:${day}` },
  ]);

  const modeRow = [
    {
      text: pauseLessons ? '● Снять паузу уроков' : '○ Пауза на уроки',
      callback_data: `les_pause:${day}`,
    },
    {
      text: mode2 ? 'Режим: 2 нед.' : 'Режим: 1 нед.',
      callback_data: `les_wmode:${day}`,
    },
  ];
  if (mode2) {
    modeRow.push({
      text: currentWt === 1 ? 'Нед: Верх' : 'Нед: Низ',
      callback_data: `les_wflip:${day}`,
    });
  }
  inline_keyboard.push(modeRow);

  const webRow = makeWebAppButtonRow('Открыть расписание на экране');
  if (webRow) inline_keyboard.push(webRow);

  return { text: lines.join('\n'), reply_markup: { inline_keyboard } };
}

function buildHabitsView() {
  const today = toDateStr();
  const habits = getHabitsForDate(today);

  const lines = [`<b>Привычки · ${formatHumanDateShort(today)}</b>`, ``];

  if (habits.length === 0) {
    lines.push(`<i>Список привычек пуст.</i>`);
    lines.push(`<i>Можно создать привычку с галочкой (○/●) или с вводом числа и текста (вода, сон, страницы).</i>`);
  } else {
    for (const h of habits) {
      const isDone = h.log_status === 'done';
      const sym = isDone ? '●' : h.scheduled_today ? '○' : '·';
      const val = h.log_value ? ` — <b>${escapeHtml(h.log_value)}</b>` : '';
      const target =
        h.kind === 'value' && (h.target_value || h.unit)
          ? ` <i>(цель: ${escapeHtml(`${h.target_value} ${h.unit}`.trim())})</i>`
          : '';
      const streak = h.streak > 0 ? ` · ${h.streak} дн.` : '';
      lines.push(`${sym} ${escapeHtml(h.title)}${val}${target}${streak}`);
    }
  }

  const inline_keyboard = [];
  for (const h of habits) {
    const isDone = h.log_status === 'done';
    const mainBtn =
      h.kind === 'value'
        ? {
            text: `${isDone ? '●' : '◐'} ${truncate(h.title, 18)}${h.log_value ? ': ' + h.log_value : ' (ввести)'}`,
            callback_data: `hab_val:${h.id}:habits`,
          }
        : {
            text: `${isDone ? '●' : '○'} ${truncate(h.title, 22)}`,
            callback_data: `hab_tog:${h.id}:habits`,
          };

    inline_keyboard.push([
      mainBtn,
      { text: '×', callback_data: `hab_del:${h.id}` },
    ]);
  }

  inline_keyboard.push([
    { text: '+ Привычка (галочка)', callback_data: 'hab_new:check' },
    { text: '+ Привычка (число/текст)', callback_data: 'hab_new:value' },
  ]);

  const webRow = makeWebAppButtonRow('Таблица привычек на экране');
  if (webRow) inline_keyboard.push(webRow);

  return { text: lines.join('\n'), reply_markup: { inline_keyboard } };
}

function buildPlansView(subTab = 'today') {
  const today = toDateStr();
  const tomorrow = addDaysStr(today, 1);
  const tab = subTab === 'simple' ? 'global' : subTab;
  const overdue = getOverdueDailyPlans(today);

  let items = [];
  let header = '';
  if (tab === 'today') {
    header = `<b>Дневные задания · Сегодня (${formatHumanDateShort(today)})</b>`;
    items = getPlansForDate(today);
  } else if (tab === 'tomorrow') {
    header = `<b>Дневные задания · Завтра (${formatHumanDateShort(tomorrow)})</b>`;
    items = getPlansForDate(tomorrow);
  } else if (tab === 'global') {
    header = `<b>Общие планы (глобальные цели)</b>`;
    items = getGlobalPlans();
  } else {
    header = `<b>Все дневные задания</b>`;
    items = getUpcomingDatedPlans(today);
  }

  const lines = [header, ``];

  if (tab === 'today' && overdue.length > 0) {
    lines.push(`<b>С прошлых дней (${overdue.length}):</b>`);
    for (const o of overdue.slice(0, 5)) {
      lines.push(`○ <code>${formatHumanDateShort(o.plan_date)}</code> ${escapeHtml(o.title)}`);
    }
    lines.push(``);
  }

  if (items.length === 0) {
    lines.push(`<i>Пока пусто.</i>`);
  } else {
    for (const p of items) {
      const sym = p.is_done ? '●' : p.is_priority && tab === 'global' ? '★' : '○';
      const datePrefix =
        tab === 'all' && p.plan_date ? `<code>${formatHumanDateShort(p.plan_date)}</code> ` : '';
      const timePrefix = p.remind_time ? `<code>${p.remind_time}</code> ` : '';
      const catSuffix = tab === 'global' && p.category ? ` <i>· ${escapeHtml(p.category)}</i>` : '';
      const titleHtml = p.is_done ? `<s>${escapeHtml(p.title)}</s>` : escapeHtml(p.title);
      lines.push(`${sym} ${datePrefix}${timePrefix}${titleHtml}${catSuffix}`);
    }
  }

  const inline_keyboard = [
    [
      { text: tab === 'today' ? '[ Сегодня ]' : 'Сегодня', callback_data: 'nav:plans:today' },
      { text: tab === 'tomorrow' ? '[ Завтра ]' : 'Завтра', callback_data: 'nav:plans:tomorrow' },
      { text: tab === 'global' ? '[ Общие планы ]' : 'Общие планы', callback_data: 'nav:plans:global' },
    ],
  ];

  if (tab === 'today' && overdue.length > 0) {
    inline_keyboard.push([
      { text: `Перенести прошлые (${overdue.length}) на сегодня`, callback_data: 'pl_move_all' },
    ]);
  }

  for (const p of items.slice(0, 10)) {
    if (tab === 'global') {
      inline_keyboard.push([
        { text: `${p.is_done ? '●' : '○'} ${truncate(p.title, 18)}`, callback_data: `pl_tog:${p.id}:global` },
        { text: p.is_priority ? '★' : '☆', callback_data: `pl_prio:${p.id}` },
        { text: '→ День', callback_data: `pl_take:${p.id}` },
        { text: '×', callback_data: `pl_del:${p.id}:global` },
      ]);
    } else {
      inline_keyboard.push([
        { text: `${p.is_done ? '●' : '○'} ${truncate(p.title, 24)}`, callback_data: `pl_tog:${p.id}:${tab}` },
        { text: '×', callback_data: `pl_del:${p.id}:${tab}` },
      ]);
    }
  }

  inline_keyboard.push([
    { text: '+ На сегодня', callback_data: 'pl_add:today' },
    { text: '+ На завтра', callback_data: 'pl_add:tomorrow' },
    { text: '+ Общий план', callback_data: 'pl_add:global' },
  ]);

  if (tab === 'global' && items.some((i) => i.is_done)) {
    inline_keyboard.push([{ text: 'Очистить выполненные', callback_data: 'pl_clear_global' }]);
  }

  const webRow = makeWebAppButtonRow('Открыть на экране');
  if (webRow) inline_keyboard.push(webRow);

  return { text: lines.join('\n'), reply_markup: { inline_keyboard } };
}

function bookStatusHuman(status) {
  if (status === 'reading') return 'Читаю';
  if (status === 'done') return 'Прочитано';
  return 'В планах';
}

function buildBooksView(filter = 'all') {
  const allBooks = getBooks();
  const books = filter === 'all' ? allBooks : allBooks.filter((b) => b.status === filter);
  const cntRead = allBooks.filter((b) => b.status === 'reading').length;
  const cntPlan = allBooks.filter((b) => b.status === 'planned').length;
  const cntDone = allBooks.filter((b) => b.status === 'done').length;

  const lines = [
    `<b>База книг</b>`,
    `<i>Читаю: ${cntRead} · В планах: ${cntPlan} · Прочитано: ${cntDone}</i>`,
    ``,
  ];

  if (books.length === 0) {
    lines.push(`<i>В этом разделе книг пока нет.</i>`);
    lines.push(`<i>Можно писать прямо в чат: «книга Дюна — Фрэнк Герберт», «читаю Ведьмак», «прочитал 1984».</i>`);
  } else {
    for (const b of books.slice(0, 15)) {
      const sym = b.status === 'reading' ? '▶' : b.status === 'done' ? '●' : '○';
      const author = b.author ? ` — ${escapeHtml(b.author)}` : '';
      const note = b.note ? ` <i>(${escapeHtml(b.note)})</i>` : '';
      const stars = b.rating > 0 ? ` · ${b.rating}★` : '';
      lines.push(`${sym} <b>${escapeHtml(b.title)}</b>${author}${note}${stars}`);
    }
  }

  const inline_keyboard = [
    [
      { text: filter === 'all' ? '[ Все ]' : 'Все', callback_data: 'nav:books:all' },
      { text: filter === 'reading' ? '[ Читаю ]' : 'Читаю', callback_data: 'nav:books:reading' },
      { text: filter === 'planned' ? '[ В планах ]' : 'В планах', callback_data: 'nav:books:planned' },
      { text: filter === 'done' ? '[ Прочитано ]' : 'Прочитано', callback_data: 'nav:books:done' },
    ],
  ];

  for (const b of books.slice(0, 8)) {
    inline_keyboard.push([
      {
        text: `${truncate(b.title, 20)} · ${bookStatusHuman(b.status)} ↻`,
        callback_data: `bk_cyc:${b.id}:${filter}`,
      },
      { text: '×', callback_data: `bk_del:${b.id}:${filter}` },
    ]);
  }

  inline_keyboard.push([
    { text: '+ В планы', callback_data: 'bk_add:planned' },
    { text: '+ Читаю', callback_data: 'bk_add:reading' },
    { text: '+ Прочитано', callback_data: 'bk_add:done' },
  ]);

  const webRow = makeWebAppButtonRow('Открыть базу книг на экране');
  if (webRow) inline_keyboard.push(webRow);

  return { text: lines.join('\n'), reply_markup: { inline_keyboard } };
}

function buildPauseView() {
  const schoolOn = isSchoolEnabled();
  const pauseLessons = schoolOn && getSetting('pause_lessons', '0') === '1';
  const pauseAll = getSetting('pause_all', '0') === '1';
  const leadMin = getSetting('lesson_lead_minutes', '2');

  const lines = [`<b>Пауза и уведомления</b>`, ``];
  if (schoolOn) {
    lines.push(
      `Уроки: <b>${pauseLessons || pauseAll ? 'На паузе' : `Активны (за ${leadMin} мин до начала)`}</b>`
    );
  }
  lines.push(`Общий режим: <b>${pauseAll ? 'Полная тишина' : 'Активен'}</b>`);
  lines.push(``, `<i>Во время паузы серии привычек замораживаются и не сбрасываются.</i>`);

  const inline_keyboard = [];
  if (schoolOn) {
    inline_keyboard.push([
      {
        text: pauseLessons
          ? '[ ● Пауза только на уроки ]'
          : '○ Пауза только на уроки (каникулы / болезнь)',
        callback_data: 'pause_tog:lessons',
      },
    ]);
  }
  inline_keyboard.push([
    {
      text: pauseAll
        ? '[ ● Полная тишина (все уведомления) ]'
        : '○ Полная тишина (все уведомления)',
      callback_data: 'pause_tog:all',
    },
  ]);
  if (schoolOn) {
    inline_keyboard.push([
      {
        text: leadMin === '1' ? '[ За 1 мин ]' : 'За 1 мин',
        callback_data: 'lead_set:1',
      },
      {
        text: leadMin === '2' ? '[ За 2 мин ]' : 'За 2 мин',
        callback_data: 'lead_set:2',
      },
      {
        text: leadMin === '5' ? '[ За 5 мин ]' : 'За 5 мин',
        callback_data: 'lead_set:5',
      },
      {
        text: leadMin === '10' ? '[ За 10 мин ]' : 'За 10 мин',
        callback_data: 'lead_set:10',
      },
    ]);
  }

  const webRow = makeWebAppButtonRow('Все настройки на экране');
  if (webRow) inline_keyboard.push(webRow);

  return { text: lines.join('\n'), reply_markup: { inline_keyboard } };
}

// Клавиатура быстрой корректировки под автоугаданным сообщением
function buildCorrectionKeyboard(eventId, currentType, extraButtons = []) {
  const buttons = [
    { key: 'plan_today', text: 'Задание · Сегодня' },
    { key: 'plan_tomorrow', text: 'Задание · Завтра' },
    { key: 'plan_global', text: 'Общий план' },
    { key: 'book_planned', text: 'В книги' },
  ].filter((b) => b.key !== currentType);

  const row1 = buttons.slice(0, 2).map((b) => ({
    text: b.text,
    callback_data: `reclass:${eventId}:${b.key}`,
  }));
  const row2 = buttons.slice(2).map((b) => ({
    text: b.text,
    callback_data: `reclass:${eventId}:${b.key}`,
  }));
  row2.push({
    text: '× Удалить',
    callback_data: `reclass:${eventId}:delete`,
  });

  const inline_keyboard = [];
  if (extraButtons.length > 0) inline_keyboard.push(extraButtons);
  if (row1.length > 0) inline_keyboard.push(row1);
  if (row2.length > 0) inline_keyboard.push(row2);
  return { inline_keyboard };
}

// Выполнение автоугадывания и сохранения
function executeSmartCapture(rawText, mediaType = '', mediaFileId = '') {
  const today = toDateStr();
  const classified = classifyMessageLocal(rawText);

  if (classified.type === 'schedule_bulk' && isSchoolEnabled()) {
    for (const l of classified.lessons) {
      addLesson(l);
    }
    const ev = saveInboxEvent({
      raw_text: rawText,
      media_type: mediaType,
      media_file_id: mediaFileId,
      guessed_type: 'schedule_bulk',
      target_id: 0,
      meta: { count: classified.lessons.length },
    });
    return {
      summary: `Добавлено уроков в расписание: ${classified.lessons.length}`,
      html: `● <b>Расписание обновлено</b>\nДобавлено уроков: <b>${classified.lessons.length}</b>`,
      event: ev,
      item: classified.lessons,
    };
  }

  if (classified.type === 'habit_log') {
    const h = classified.habit;
    setHabitLog(h.id, today, 'done', classified.value_text || '');
    const ev = saveInboxEvent({
      raw_text: rawText,
      media_type: mediaType,
      media_file_id: mediaFileId,
      guessed_type: 'habit_log',
      target_id: h.id,
      meta: {
        clean_title: rawText,
        date_str: today,
        value_text: classified.value_text || '',
      },
    });
    const valNote = classified.value_text ? ` (${escapeHtml(classified.value_text)})` : '';
    return {
      summary: `Привычка отмечена: ${h.title}`,
      html: `● <b>Привычка отмечена</b>\n${escapeHtml(h.title)}${valNote}`,
      event: ev,
      item: h,
    };
  }

  if (
    classified.type === 'book_planned' ||
    classified.type === 'book_reading' ||
    classified.type === 'book_done'
  ) {
    const status =
      classified.type === 'book_reading'
        ? 'reading'
        : classified.type === 'book_done'
        ? 'done'
        : 'planned';
    const book = addBook({
      title: classified.clean_title,
      author: classified.author || '',
      status,
    });
    const ev = saveInboxEvent({
      raw_text: rawText,
      media_type: mediaType,
      media_file_id: mediaFileId,
      guessed_type: classified.type,
      target_id: book.id,
      meta: { clean_title: book.title, author: book.author },
    });
    const authPart = book.author ? ` — ${escapeHtml(book.author)}` : '';
    return {
      summary: `Книга (${bookStatusHuman(status)}): ${book.title}`,
      html: `● <b>Книги · ${bookStatusHuman(status)}</b>\n${escapeHtml(book.title)}${authPart}`,
      event: ev,
      item: book,
    };
  }

  if (
    classified.type === 'plan_today' ||
    classified.type === 'plan_tomorrow' ||
    classified.type === 'plan_dated'
  ) {
    const plan = addPlan({
      title: classified.clean_title,
      list_type: 'dated',
      plan_date: classified.plan_date || today,
      remind_time: classified.remind_time || '',
    });
    const ev = saveInboxEvent({
      raw_text: rawText,
      media_type: mediaType,
      media_file_id: mediaFileId,
      guessed_type: classified.type,
      target_id: plan.id,
      meta: {
        clean_title: classified.clean_title,
        plan_date: plan.plan_date,
        remind_time: plan.remind_time,
      },
    });
    const dayLabel =
      classified.type === 'plan_today'
        ? 'Сегодня'
        : classified.type === 'plan_tomorrow'
        ? 'Завтра'
        : formatHumanDateShort(plan.plan_date);
    const timePart = plan.remind_time ? ` · <code>${plan.remind_time}</code>` : '';
    return {
      summary: `Дневное задание (${dayLabel}): ${plan.title}`,
      html: `● <b>Дневное задание · ${dayLabel}</b>${timePart}\n${escapeHtml(plan.title)}`,
      event: ev,
      item: plan,
    };
  }

  // По умолчанию — «Общие планы»
  const plan = addPlan({
    title: classified.clean_title || rawText,
    list_type: 'global',
    category: classified.category || '',
  });
  const ev = saveInboxEvent({
    raw_text: rawText,
    media_type: mediaType,
    media_file_id: mediaFileId,
    guessed_type: 'plan_global',
    target_id: plan.id,
    meta: { clean_title: plan.title, category: plan.category },
  });
  const catNote = plan.category ? ` · ${escapeHtml(plan.category)}` : '';
  return {
    summary: `Общий план: ${plan.title}`,
    html: `● <b>Общие планы</b>${catNote}\n${escapeHtml(plan.title)}`,
    event: ev,
    item: plan,
  };
}

// ================= ОБРАБОТКА СООБЩЕНИЙ В ЧАТЕ =================

async function handleMessage(msg) {
  if (!msg.from) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = String(msg.text || msg.caption || '').trim();

  if (text === '/id') {
    await sendMessage(chatId, `ID: <code>${userId}</code>`);
    return;
  }

  if (!isAuthorized(userId, chatId)) {
    await sendMessage(chatId, `Доступ ограничен.`);
    return;
  }

  // Команда установки ключа Gemini: /key AIza...
  if (text.startsWith('/key ')) {
    const k = text.slice(5).trim();
    setSetting('gemini_api_key', k);
    const keyHint = isSchoolEnabled()
      ? '● Ключ ИИ сохранен. Распознавание фото расписания и голоса включено.'
      : '● Ключ ИИ сохранен. Распознавание фото и голоса включено.';
    await sendMessage(chatId, keyHint, {
      reply_markup: getMainReplyKeyboard(),
    });
    return;
  }

  if (text === 'Отмена' || text === '/cancel') {
    userSessions.delete(userId);
    await sendMessage(chatId, `Отменено.`, { reply_markup: getMainReplyKeyboard() });
    return;
  }

  if (text === '/start' || text === '/help') {
    userSessions.delete(userId);
    const view = buildTodayView();
    await sendMessage(chatId, view.text, {
      reply_markup: getMainReplyKeyboard(),
    });
    if (view.reply_markup.inline_keyboard.length > 0) {
      const startHint = isSchoolEnabled()
        ? `<i>Пишите в чат свободным текстом: бот распределит сообщение в дневные задания, общие планы, книги, привычки или расписание. Кнопками под ответом раздел всегда можно поправить.</i>`
        : `<i>Пишите в чат свободным текстом: бот распределит сообщение в дневные задания, общие планы, книги или привычки. Кнопками под ответом раздел всегда можно поправить.</i>`;
      await sendMessage(chatId, startHint, { reply_markup: view.reply_markup });
    }
    return;
  }

  // Навигация с нижней клавиатуры и команд (единая система с приложением)
  if (text === 'Обзор' || text === 'Сегодня' || text === '/today') {
    userSessions.delete(userId);
    const view = buildTodayView();
    await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (text === 'Расписание' || text === 'Уроки' || text === '/lessons') {
    userSessions.delete(userId);
    if (!isSchoolEnabled()) {
      await sendMessage(chatId, `Раздел школьного расписания отключён в этой версии.`, {
        reply_markup: getMainReplyKeyboard(),
      });
      return;
    }
    const view = buildLessonsView(getIsoDayOfWeek());
    await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (text === 'Задания' || text === '/daily') {
    userSessions.delete(userId);
    const view = buildPlansView('today');
    await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (text === 'Общие планы' || text === 'Планы' || text === '/plans' || text === 'Заметки' || text === '/notes') {
    userSessions.delete(userId);
    const view = buildPlansView('global');
    await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (text === 'Привычки' || text === '/habits') {
    userSessions.delete(userId);
    const view = buildHabitsView();
    await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (text === 'Книги' || text === '/books') {
    userSessions.delete(userId);
    const view = buildBooksView('all');
    await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (text === 'Пауза' || text === '/pause') {
    userSessions.delete(userId);
    const view = buildPauseView();
    await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  // Проверка активного пошагового ввода
  const session = userSessions.get(userId);
  if (session) {
    if (session.step === 'HABIT_VALUE') {
      userSessions.delete(userId);
      const val = text || '';
      setHabitLog(session.habitId, toDateStr(), val ? 'done' : 'none', val);
      const view = session.returnTo === 'today' ? buildTodayView() : buildHabitsView();
      await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
      return;
    }

    if (session.step === 'NEW_HABIT_CHECK') {
      userSessions.delete(userId);
      if (text) {
        addHabit({ title: text, kind: 'check' });
      }
      const view = buildHabitsView();
      await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
      return;
    }

    if (session.step === 'NEW_HABIT_VALUE') {
      userSessions.delete(userId);
      if (text) {
        // Формат: "Вода, 2, л" или просто "Вода"
        const parts = text.split(',').map((s) => s.trim());
        addHabit({
          title: parts[0] || text,
          kind: 'value',
          target_value: parts[1] || '',
          unit: parts[2] || '',
        });
      }
      const view = buildHabitsView();
      await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
      return;
    }

    if (session.step === 'ADD_LESSON_SINGLE') {
      userSessions.delete(userId);
      const parsed = parseScheduleText(text, session.day);
      if (parsed.length > 0) {
        for (const l of parsed) addLesson(l);
      } else if (text) {
        addLesson({
          day_of_week: session.day,
          start_time: '08:30',
          subject: text,
        });
      }
      const view = buildLessonsView(session.day);
      await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
      return;
    }

    if (session.step === 'IMPORT_SCHEDULE' && !msg.photo) {
      userSessions.delete(userId);
      const parsed = parseScheduleText(text, session.day);
      for (const l of parsed) addLesson(l);
      const view = buildLessonsView(session.day);
      await sendMessage(
        chatId,
        `● Добавлено уроков: <b>${parsed.length}</b>\n\n${view.text}`,
        { reply_markup: view.reply_markup }
      );
      return;
    }

    if (session.step === 'ADD_PLAN_PROMPT') {
      userSessions.delete(userId);
      const today = toDateStr();
      const tomorrow = addDaysStr(today, 1);
      if (session.target === 'global' || session.target === 'simple') {
        addPlan({ title: text, list_type: 'global' });
      } else {
        const cl = classifyMessageLocal(text);
        addPlan({
          title: cl.clean_title || text,
          list_type: 'dated',
          plan_date: session.target === 'tomorrow' ? tomorrow : today,
          remind_time: cl.remind_time || '',
        });
      }
      const view = buildPlansView(session.target === 'simple' ? 'global' : session.target);
      await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
      return;
    }

    if (session.step === 'ADD_BOOK_PROMPT') {
      userSessions.delete(userId);
      if (text) {
        const sep = text.match(/^(.+?)\s+(?:—|–|-)\s+(.+)$/);
        addBook({
          title: sep ? sep[1].trim() : text,
          author: sep ? sep[2].trim() : '',
          status: session.status || 'planned',
        });
      }
      const view = buildBooksView(session.status || 'all');
      await sendMessage(chatId, view.text, { reply_markup: view.reply_markup });
      return;
    }
  }

  // 1. Обработка голосового сообщения
  if (msg.voice) {
    const fileId = msg.voice.file_id;
    const geminiKey = getActiveGeminiKey();
    if (geminiKey) {
      try {
        const base64Audio = await downloadTelegramFileBase64(fileId);
        const aiRes = await transcribeAndClassifyVoiceWithGemini(
          base64Audio,
          msg.voice.mime_type || 'audio/ogg'
        );
        if (aiRes && aiRes.transcript) {
          const cap = executeSmartCapture(aiRes.transcript, 'voice', fileId);
          await sendMessage(
            chatId,
            `${cap.html}\n<i>Голос: «${escapeHtml(aiRes.transcript)}»</i>`,
            {
              reply_markup: buildCorrectionKeyboard(
                cap.event.id,
                cap.event.guessed_type
              ),
            }
          );
          return;
        }
      } catch (err) {
        console.error('Ошибка распознавания голоса Gemini:', err.message);
      }
    }

    // Если нет ключа Gemini — сохраняем голосовую заметку напрямую
    const noteText = text || `Голосовая заметка (${toTimeStr()})`;
    const cap = executeSmartCapture(noteText, 'voice', fileId);
    await sendMessage(chatId, cap.html, {
      reply_markup: buildCorrectionKeyboard(cap.event.id, cap.event.guessed_type),
    });
    return;
  }

  // 2. Обработка фото (скриншот расписания или фото-заметка)
  if (msg.photo && msg.photo.length > 0) {
    const bestPhoto = msg.photo[msg.photo.length - 1];
    const fileId = bestPhoto.file_id;
    const schoolOn = isSchoolEnabled();
    const isScheduleIntent =
      schoolOn && (session?.step === 'IMPORT_SCHEDULE' || /расписани|урок/i.test(text));

    if (isScheduleIntent) {
      userSessions.delete(userId);
      const geminiKey = getActiveGeminiKey();
      if (!geminiKey) {
        await sendMessage(
          chatId,
          `Для чтения расписания со скриншота нужен ключ Google Gemini (команда <code>/key ВАШ_КЛЮЧ</code> или в настройках на экране).\n\nЛибо просто отправьте расписание списком в чат, например:\n<code>Понедельник\n08:30 Алгебра каб. 204\n09:25 Физика</code>`
        );
        return;
      }
      try {
        await sendMessage(chatId, `<i>Распознаю расписание с изображения...</i>`);
        const b64 = await downloadTelegramFileBase64(fileId);
        const lessons = await parseScheduleImageWithGemini(b64, 'image/jpeg', text);
        for (const l of lessons) addLesson(l);
        const view = buildLessonsView(lessons[0]?.day_of_week || getIsoDayOfWeek());
        await sendMessage(
          chatId,
          `● Распознано и добавлено уроков: <b>${lessons.length}</b>\n\n${view.text}`,
          { reply_markup: view.reply_markup }
        );
      } catch (err) {
        await sendMessage(chatId, `Не удалось разобрать картинку: ${escapeHtml(err.message)}`);
      }
      return;
    }

    const noteCaption = text || `Фото (${formatHumanDateShort(toDateStr())} ${toTimeStr()})`;
    const cap = executeSmartCapture(noteCaption, 'photo', fileId);
    const extraBtns = isSchoolEnabled()
      ? [{ text: 'Распознать как расписание', callback_data: `photo_sched:${cap.event.id}` }]
      : [];
    await sendMessage(chatId, cap.html, {
      reply_markup: buildCorrectionKeyboard(cap.event.id, cap.event.guessed_type, extraBtns),
    });
    return;
  }

  // 3. Свободный текстовый ввод (автоугадывание)
  if (text) {
    const cap = executeSmartCapture(text);
    const kb =
      cap.event.guessed_type === 'schedule_bulk'
        ? buildLessonsView(getIsoDayOfWeek()).reply_markup
        : buildCorrectionKeyboard(cap.event.id, cap.event.guessed_type);
    await sendMessage(chatId, cap.html, { reply_markup: kb });
  }
}

// ================= ОБРАБОТКА INLINE-КНОПОК =================

async function handleCallbackQuery(cb) {
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  const userId = cb.from?.id;
  if (!chatId || !userId || !isAuthorized(userId, chatId)) {
    await answerCallbackQuery(cb.id, 'Доступ ограничен', true);
    return;
  }

  const data = String(cb.data || '');
  const parts = data.split(':');
  const action = parts[0];

  // Навигация
  if (action === 'nav') {
    const section = parts[1];
    userSessions.delete(userId);
    if (section === 'today') {
      const view = buildTodayView();
      await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    } else if (section === 'lessons') {
      if (!isSchoolEnabled()) {
        const view = buildTodayView();
        await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
      } else {
        const day = parseInt(parts[2] || String(getIsoDayOfWeek()), 10);
        const view = buildLessonsView(day);
        await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
      }
    } else if (section === 'habits') {
      const view = buildHabitsView();
      await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    } else if (section === 'plans') {
      const sub = parts[2] || 'today';
      const view = buildPlansView(sub);
      await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    } else if (section === 'books') {
      const filter = parts[2] || 'all';
      const view = buildBooksView(filter);
      await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    } else if (section === 'pause') {
      const view = buildPauseView();
      await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    }
    await answerCallbackQuery(cb.id);
    return;
  }

  // Переклассификация автоугаданного сообщения
  if (action === 'reclass') {
    const eventId = parseInt(parts[1], 10);
    const newType = parts[2];
    const res = reclassifyInboxEvent(eventId, newType);
    if (!res) {
      await answerCallbackQuery(cb.id, 'Запись уже удалена');
      return;
    }
    if (res.deleted) {
      await editMessageText(
        chatId,
        messageId,
        `× <s>${escapeHtml(truncate(res.raw_text, 120))}</s> <i>(удалено)</i>`
      );
      await answerCallbackQuery(cb.id, 'Удалено');
      return;
    }

    const labels = {
      plan_today: 'Задание · Сегодня',
      plan_tomorrow: 'Задание · Завтра',
      plan_global: 'Общие планы',
      book_planned: 'Книги · В планах',
      book_reading: 'Книги · Читаю',
      book_done: 'Книги · Прочитано',
    };
    await editMessageText(
      chatId,
      messageId,
      `● <b>Перенесено → ${labels[newType] || newType}</b>\n${escapeHtml(res.event.raw_text)}`,
      {
        reply_markup: buildCorrectionKeyboard(eventId, newType),
      }
    );
    await answerCallbackQuery(cb.id, `Перенесено: ${labels[newType] || newType}`);
    return;
  }

  // Распознать присланное фото как расписание
  if (action === 'photo_sched') {
    const eventId = parseInt(parts[1], 10);
    const ev = getInboxEvent(eventId);
    if (!ev || !ev.media_file_id) {
      await answerCallbackQuery(cb.id, 'Фото не найдено', true);
      return;
    }
    const geminiKey = getActiveGeminiKey();
    if (!geminiKey) {
      await answerCallbackQuery(
        cb.id,
        'Укажите ключ Gemini в настройках экрана или через /key',
        true
      );
      return;
    }
    await answerCallbackQuery(cb.id, 'Распознаю расписание...');
    try {
      const b64 = await downloadTelegramFileBase64(ev.media_file_id);
      const lessons = await parseScheduleImageWithGemini(b64, 'image/jpeg', ev.raw_text || '');
      for (const l of lessons) addLesson(l);
      removeInboxTarget(ev);
      const view = buildLessonsView(lessons[0]?.day_of_week || getIsoDayOfWeek());
      await editMessageText(
        chatId,
        messageId,
        `● Распознано уроков: <b>${lessons.length}</b>\n\n${view.text}`,
        { reply_markup: view.reply_markup }
      );
    } catch (err) {
      await sendMessage(chatId, `Ошибка распознавания: ${escapeHtml(err.message)}`);
    }
    return;
  }

  // Уроки
  if (action === 'les_can') {
    const id = parseInt(parts[1], 10);
    const day = parseInt(parts[2] || String(getIsoDayOfWeek()), 10);
    const updated = toggleCancelLessonForDate(id, toDateStr());
    await answerCallbackQuery(
      cb.id,
      updated?.cancelled_date ? 'Урок отменен на сегодня' : 'Урок возвращен'
    );
    const view = buildLessonsView(day);
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'les_del') {
    const id = parseInt(parts[1], 10);
    const day = parseInt(parts[2] || String(getIsoDayOfWeek()), 10);
    deleteLesson(id);
    await answerCallbackQuery(cb.id, 'Урок удален');
    const view = buildLessonsView(day);
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'les_pause') {
    const day = parseInt(parts[1] || String(getIsoDayOfWeek()), 10);
    const cur = getSetting('pause_lessons', '0') === '1';
    setSetting('pause_lessons', cur ? '0' : '1');
    await answerCallbackQuery(
      cb.id,
      cur ? 'Уведомления об уроках включены' : 'Уроки поставлены на паузу'
    );
    const view = buildLessonsView(day);
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'les_wmode') {
    const day = parseInt(parts[1] || String(getIsoDayOfWeek()), 10);
    const cur = getSetting('week_cycle_mode', '1');
    setSetting('week_cycle_mode', cur === '2' ? '1' : '2');
    await answerCallbackQuery(cb.id, cur === '2' ? 'Режим: 1 неделя' : 'Режим: 2 недели');
    const view = buildLessonsView(day);
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'les_wflip') {
    const day = parseInt(parts[1] || String(getIsoDayOfWeek()), 10);
    const nextWt = toggleCurrentWeekType(toDateStr());
    await answerCallbackQuery(
      cb.id,
      nextWt === 1 ? 'Текущая неделя: Верхняя (1)' : 'Текущая неделя: Нижняя (2)'
    );
    const view = buildLessonsView(day);
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'les_add') {
    const day = parseInt(parts[1] || String(getIsoDayOfWeek()), 10);
    userSessions.set(userId, { step: 'ADD_LESSON_SINGLE', day });
    await answerCallbackQuery(cb.id);
    await sendMessage(
      chatId,
      `<b>Новый урок · ${DAY_NAMES_FULL[day]}</b>\n\nНапишите время, предмет, кабинет и ссылку (если есть) одной строкой:\n<code>08:30 Алгебра каб. 204</code>\nили\n<code>10:00 Английский https://zoom.us/...</code>`
    );
    return;
  }

  if (action === 'les_import') {
    const day = parseInt(parts[1] || String(getIsoDayOfWeek()), 10);
    userSessions.set(userId, { step: 'IMPORT_SCHEDULE', day });
    await answerCallbackQuery(cb.id);
    await sendMessage(
      chatId,
      `<b>Загрузка расписания</b>\n\nОтправьте список уроков текстом (на один день или всю неделю) или пришлите скриншот расписания:\n\n<code>Понедельник\n08:30 Алгебра каб. 204\n09:25 Физика\n\nВторник\n08:30 История</code>`
    );
    return;
  }

  // Привычки
  if (action === 'hab_tog') {
    const id = parseInt(parts[1], 10);
    const ret = parts[2] || 'habits';
    toggleHabitCheck(id, toDateStr());
    await answerCallbackQuery(cb.id, 'Отметка обновлена');
    const view = ret === 'today' ? buildTodayView() : buildHabitsView();
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'hab_val') {
    const id = parseInt(parts[1], 10);
    const ret = parts[2] || 'habits';
    const h = getHabitById(id);
    if (!h) {
      await answerCallbackQuery(cb.id, 'Привычка не найдена');
      return;
    }
    userSessions.set(userId, { step: 'HABIT_VALUE', habitId: id, returnTo: ret });
    await answerCallbackQuery(cb.id);
    const unitHint = h.target_value || h.unit ? ` (цель: ${h.target_value} ${h.unit})`.trim() : '';
    await sendMessage(
      chatId,
      `<b>${escapeHtml(h.title)}</b>${escapeHtml(unitHint)}\nВведите значение за сегодня (например: <code>${escapeHtml(h.target_value || '1.5')} ${escapeHtml(h.unit || '')}</code>):`
    );
    return;
  }

  if (action === 'hab_del') {
    const id = parseInt(parts[1], 10);
    deleteHabit(id);
    await answerCallbackQuery(cb.id, 'Привычка удалена');
    const view = buildHabitsView();
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'hab_new') {
    const kind = parts[1] === 'value' ? 'value' : 'check';
    userSessions.set(userId, {
      step: kind === 'value' ? 'NEW_HABIT_VALUE' : 'NEW_HABIT_CHECK',
    });
    await answerCallbackQuery(cb.id);
    if (kind === 'value') {
      await sendMessage(
        chatId,
        `<b>Новая привычка со значением</b>\n\nНапишите название, цель и единицу через запятую:\n<code>Вода, 2, л</code>\nили\n<code>Чтение, 30, мин</code>`
      );
    } else {
      await sendMessage(
        chatId,
        `<b>Новая привычка (галочка)</b>\n\nНапишите название привычки (например: <code>Зарядка</code>):`
      );
    }
    return;
  }

  // Планы
  if (action === 'pl_tog') {
    const id = parseInt(parts[1], 10);
    const sub = parts[2] || 'today';
    togglePlanDone(id);
    await answerCallbackQuery(cb.id, 'Статус обновлен');
    const view = sub === 'today_home' ? buildTodayView() : buildPlansView(sub);
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'pl_del') {
    const id = parseInt(parts[1], 10);
    const sub = parts[2] || 'today';
    deletePlan(id);
    await answerCallbackQuery(cb.id, 'Удалено');
    const view = buildPlansView(sub);
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'pl_add') {
    const target = parts[1] === 'simple' ? 'global' : parts[1] || 'today';
    userSessions.set(userId, { step: 'ADD_PLAN_PROMPT', target });
    await answerCallbackQuery(cb.id);
    const label =
      target === 'global'
        ? 'в «Общие планы» (глобальная цель без срока)'
        : target === 'tomorrow'
        ? 'на завтра (можно указать время, например «в 16:00 сдать проект»)'
        : 'на сегодня (можно указать время, например «в 18:00 тренировка»)';
    await sendMessage(chatId, `Напишите задачу ${label}:`);
    return;
  }

  if (action === 'pl_prio') {
    const id = parseInt(parts[1], 10);
    togglePlanPriority(id);
    await answerCallbackQuery(cb.id, 'Приоритет обновлён');
    const view = buildPlansView('global');
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'pl_take') {
    const id = parseInt(parts[1], 10);
    takeGlobalPlanToToday(id, toDateStr());
    await answerCallbackQuery(cb.id, 'Добавлено в задания на сегодня');
    const view = buildPlansView('global');
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'pl_move_all') {
    const cnt = moveAllOverdueToToday(toDateStr());
    await answerCallbackQuery(cb.id, `Перенесено на сегодня: ${cnt}`);
    const view = buildPlansView('today');
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'pl_clear_global' || action === 'pl_clear_simple') {
    clearDoneGlobalPlans();
    await answerCallbackQuery(cb.id, 'Выполненные пункты очищены');
    const view = buildPlansView('global');
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  // База книг
  if (action === 'bk_cyc') {
    const id = parseInt(parts[1], 10);
    const filter = parts[2] || 'all';
    const updated = cycleBookStatus(id);
    await answerCallbackQuery(cb.id, updated ? `Статус: ${bookStatusHuman(updated.status)}` : 'Обновлено');
    const view = buildBooksView(filter);
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'bk_del') {
    const id = parseInt(parts[1], 10);
    const filter = parts[2] || 'all';
    deleteBook(id);
    await answerCallbackQuery(cb.id, 'Книга удалена');
    const view = buildBooksView(filter);
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'bk_add') {
    const status = parts[1] || 'planned';
    userSessions.set(userId, { step: 'ADD_BOOK_PROMPT', status });
    await answerCallbackQuery(cb.id);
    await sendMessage(
      chatId,
      `<b>Добавить книгу (${bookStatusHuman(status)})</b>\nНапишите название или <code>Название — Автор</code>:`
    );
    return;
  }

  // Пауза и время до урока
  if (action === 'pause_tog') {
    const which = parts[1];
    const key = which === 'all' ? 'pause_all' : 'pause_lessons';
    const cur = getSetting(key, '0') === '1';
    setSetting(key, cur ? '0' : '1');
    await answerCallbackQuery(cb.id, cur ? 'Пауза снята' : 'Пауза включена');
    const view = buildPauseView();
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }

  if (action === 'lead_set') {
    const mins = String(parseInt(parts[1], 10) || 2);
    setSetting('lesson_lead_minutes', mins);
    await answerCallbackQuery(cb.id, `Напоминание за ${mins} мин до урока`);
    const view = buildPauseView();
    await editMessageText(chatId, messageId, view.text, { reply_markup: view.reply_markup });
    return;
  }
}

// ================= ФОНОВЫЙ ПЛАНИРОВЩИК УВЕДОМЛЕНИЙ =================

const desktopAlertsQueue = [];

function pushDesktopAlert(title, message, url = '') {
  desktopAlertsQueue.push({
    title: String(title || 'Помощник'),
    message: String(message || ''),
    url: String(url || ''),
    createdAt: Date.now(),
  });
  if (desktopAlertsQueue.length > 30) {
    desktopAlertsQueue.splice(0, desktopAlertsQueue.length - 30);
  }
}

async function runSchedulerTick() {
  const today = toDateStr();
  const nowTime = toTimeStr();
  const nowMin = timeToMinutes(nowTime);

  // 1. Автоудаление несделанных планов за прошлые дни в начале новых суток
  if (getSetting('last_cleanup_date', '') !== today) {
    cleanupExpiredPlans(today);
  }

  const ownerChatId = getSetting('owner_chat_id', '');

  const pauseAll = getSetting('pause_all', '0') === '1';
  if (pauseAll) return;

  const schoolOn = isSchoolEnabled();
  const pauseLessons = schoolOn && getSetting('pause_lessons', '0') === '1';
  const leadMin = Math.max(1, parseInt(getSetting('lesson_lead_minutes', '2'), 10) || 2);

  // 2. Уведомления об уроках (по умолчанию за 2 минуты до начала)
  const todayLessons = schoolOn ? getLessonsForDate(today).filter((l) => !l.is_cancelled_today) : [];

  if (schoolOn && !pauseLessons) {
    for (const lesson of todayLessons) {
      const startMin = timeToMinutes(lesson.start_time);
      if (startMin < 0) continue;
      const diff = startMin - nowMin;

      if (diff <= leadMin && diff >= -2 && !wasLessonAlertSent(lesson.id, today)) {
        markLessonAlertSent(lesson.id, today);
        const room = lesson.room_or_note ? ` · ${escapeHtml(lesson.room_or_note)}` : '';
        const whenLabel = diff > 0 ? `через ${diff} мин` : 'сейчас';
        const desktopRoom = lesson.room_or_note ? ` · ${lesson.room_or_note}` : '';
        pushDesktopAlert(
          `Урок ${whenLabel} (${lesson.start_time})`,
          `${lesson.subject}${desktopRoom}`,
          lesson.join_url || ''
        );

        if (ownerChatId && getActiveBotToken()) {
          const text = [
            `<b>Урок ${whenLabel}</b> · <code>${lesson.start_time}</code>`,
            `<b>${escapeHtml(lesson.subject)}</b>${room}`,
          ].join('\n');

          const inline_keyboard = [];
          if (lesson.join_url) {
            inline_keyboard.push([{ text: 'Зайти на урок →', url: lesson.join_url }]);
          }
          inline_keyboard.push([
            {
              text: 'Отменить этот урок сегодня',
              callback_data: `les_can:${lesson.id}:${lesson.day_of_week}`,
            },
            {
              text: 'Пауза на уроки',
              callback_data: `les_pause:${lesson.day_of_week}`,
            },
          ]);

          await sendMessage(ownerChatId, text, {
            reply_markup: { inline_keyboard },
          }).catch((err) => console.error('Ошибка отправки уведомления об уроке:', err.message));
        }
      }
    }
  }

  // 3. Напоминания по делам с точным временем
  const duePlans = getDuePlanReminders(today, nowTime);
  for (const plan of duePlans) {
    markPlanReminded(plan.id);
    pushDesktopAlert(`Напоминание · ${plan.remind_time}`, plan.title, '');
    if (ownerChatId && getActiveBotToken()) {
      const text = `<b>Напоминание</b> · <code>${plan.remind_time}</code>\n${escapeHtml(plan.title)}`;
      await sendMessage(ownerChatId, text, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '● Выполнено', callback_data: `pl_tog:${plan.id}:today` },
              { text: '× Удалить', callback_data: `pl_del:${plan.id}:today` },
            ],
          ],
        },
      }).catch((err) => console.error('Ошибка напоминания о плане:', err.message));
    }
  }

  // 4. Утренняя сводка (за 30 минут до первого урока или в 10:00 в дни без уроков)
  if (
    getSetting('morning_digest_enabled', '1') === '1' &&
    getSetting('last_morning_digest_date', '') !== today
  ) {
    const offsetMin = parseInt(getSetting('morning_digest_offset_min', '30'), 10) || 30;
    const fallbackMin = timeToMinutes(getSetting('morning_digest_fallback_time', '10:00'));

    let targetMin = fallbackMin >= 0 ? fallbackMin : 600;
    if (!pauseLessons && todayLessons.length > 0) {
      const firstLessonMin = timeToMinutes(todayLessons[0].start_time);
      if (firstLessonMin > offsetMin) {
        targetMin = firstLessonMin - offsetMin;
      }
    }

    if (nowMin >= targetMin && nowMin <= targetMin + 90) {
      setSetting('last_morning_digest_date', today);
      if (ownerChatId && getActiveBotToken()) {
        const view = buildTodayView();
        await sendMessage(ownerChatId, `<b>Утренняя сводка</b>\n\n${view.text}`, {
          reply_markup: view.reply_markup,
        }).catch((err) => console.error('Ошибка утренней сводки:', err.message));
      }
    }
  }

  // 5. Вечерняя карточка привычек (по умолчанию в 21:00)
  if (
    getSetting('evening_habits_enabled', '1') === '1' &&
    getSetting('last_evening_habits_date', '') !== today
  ) {
    const eveningMin = timeToMinutes(getSetting('evening_habits_time', '21:00'));
    if (eveningMin >= 0 && nowMin >= eveningMin && nowMin <= eveningMin + 90) {
      setSetting('last_evening_habits_date', today);
      const habits = getHabitsForDate(today).filter(
        (h) => h.scheduled_today && h.log_status !== 'done'
      );
      if (habits.length > 0) {
        pushDesktopAlert(
          'Вечерняя проверка привычек',
          `Не отмечено за сегодня: ${habits.length}`,
          ''
        );
        if (ownerChatId && getActiveBotToken()) {
          const view = buildHabitsView();
          await sendMessage(
            ownerChatId,
            `<b>Вечерняя проверка привычек</b>\nНе отмечено за сегодня: <b>${habits.length}</b>\n\n${view.text}`,
            { reply_markup: view.reply_markup }
          ).catch((err) => console.error('Ошибка вечерней сводки привычек:', err.message));
        }
      }
    }
  }
}

// ================= ВЕБ-СЕРВЕР И API ДЛЯ ЭКРАНА MINI APP =================

function isLoopbackClient(req) {
  const host = String(req.headers.host || '').toLowerCase();
  const hostOk = host.startsWith('127.0.0.1') || host.startsWith('localhost');
  const remote = String(req.socket?.remoteAddress || '');
  const ipOk = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
  const viaProxy = Boolean(
    req.headers['cf-ray'] ||
    req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for']
  );
  return hostOk && ipOk && !viaProxy;
}

function runGitSync(args, timeoutMs = 12000) {
  return execFileSync('git', args, {
    cwd: __dirname,
    encoding: 'utf8',
    timeout: timeoutMs,
    windowsHide: true,
    env: {
      ...process.env,
      GCM_INTERACTIVE: 'never',
      GIT_TERMINAL_PROMPT: '0',
    },
  }).trim();
}

function createAutoBackup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupsRoot = path.join(__dirname, 'backups');
  const targetDir = path.join(backupsRoot, `before-update-${stamp}`);
  fs.mkdirSync(targetDir, { recursive: true });
  for (const name of ['assistant.db', 'assistant.db-wal', 'assistant.db-shm', '.env', 'tunnel.json']) {
    const src = path.join(__dirname, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(targetDir, name));
    }
  }
  // Оставляем только 5 последних автобэкапов
  try {
    const dirs = fs
      .readdirSync(backupsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('before-update-'))
      .map((d) => d.name)
      .sort()
      .reverse();
    for (const oldDir of dirs.slice(5)) {
      fs.rmSync(path.join(backupsRoot, oldDir), { recursive: true, force: true });
    }
  } catch {}
  return targetDir;
}

function fetchGithubBuffer(urlStr, timeoutMs = 15000, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 3) {
      reject(new Error('Слишком много перенаправлений'));
      return;
    }
    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch {
      reject(new Error('Некорректный адрес обновления'));
      return;
    }
    const allowedHosts = ['api.github.com', 'raw.githubusercontent.com'];
    if (parsed.protocol !== 'https:' || !allowedHosts.includes(parsed.hostname)) {
      reject(new Error('Недопустимый источник загрузки'));
      return;
    }
    const req = https.get(
      parsed,
      {
        timeout: timeoutMs,
        headers: {
          'User-Agent': 'HelpTool-Updater/2.1',
          Accept: parsed.hostname === 'api.github.com' ? 'application/vnd.github+json' : '*/*',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          const nextUrl = new URL(res.headers.location, parsed).toString();
          fetchGithubBuffer(nextUrl, timeoutMs, redirects + 1).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`GitHub HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('Превышено время ожидания GitHub'));
    });
    req.on('error', reject);
  });
}

async function fetchGithubJson(urlStr, timeoutMs = 10000) {
  const buf = await fetchGithubBuffer(urlStr, timeoutMs);
  return JSON.parse(buf.toString('utf8'));
}

function writeLocalAppVersion(data) {
  safeWriteFile(APP_VERSION_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function isAllowedAppUpdatePath(relPath) {
  if (!relPath || typeof relPath !== 'string') return false;
  if (relPath.includes('..') || relPath.includes('\\') || relPath.startsWith('/')) return false;
  return (
    /^(bot\.js|db\.js|parser\.js|package\.json|README\.md|start-bot\.vbs|status-bot\.cmd|stop-bot\.cmd|joker-noir-v2\.ico)$/.test(
      relPath
    ) ||
    relPath === 'public/index.html' ||
    relPath === 'public/joker-icon-256.png' ||
    /^public\/(gallery|css|js)\/[a-zA-Z0-9._-]+$/.test(relPath)
  );
}

async function checkGithubDirectUpdates() {
  try {
    const commit = await fetchGithubJson(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/main`,
      10000
    );
    const remoteSha = String(commit.sha || '').trim();
    if (!/^[a-f0-9]{40}$/.test(remoteSha)) {
      return { ok: false, error: 'Некорректный ответ от GitHub' };
    }
    const localVer = readLocalAppVersion();
    const hasUpdate = localVer.commitSha !== remoteSha;
    const latestMsg = String(commit.commit?.message || '').split('\n')[0].trim();
    return {
      ok: true,
      mode: 'github',
      hasUpdate,
      behindCount: hasUpdate ? 1 : 0,
      localHash: localVer.commitSha ? localVer.commitSha.slice(0, 7) : 'сборка',
      remoteHash: remoteSha.slice(0, 7),
      remoteSha,
      latestMsg,
    };
  } catch (err) {
    const isPrivate404 = /404/.test(String(err.message || ''));
    return {
      ok: true,
      mode: 'offline',
      hasUpdate: false,
      behindCount: 0,
      warn: isPrivate404
        ? 'Репозиторий обновлений закрыт (HTTP 404) — данные экрана обновлены'
        : 'Не удалось связаться с GitHub — проверяю локально',
      detail: err.message,
    };
  }
}

async function applyGithubDirectUpdate() {
  const check = await checkGithubDirectUpdates();
  if (!check.ok) return check;
  if (check.mode === 'offline') {
    return { ok: false, error: check.warn || 'Нет подключения к GitHub' };
  }
  if (!check.hasUpdate) {
    return { ok: true, mode: 'reload', message: 'Уже установлена актуальная версия' };
  }

  const remoteSha = check.remoteSha;
  let treeData;
  try {
    treeData = await fetchGithubJson(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${remoteSha}?recursive=1`,
      12000
    );
  } catch (err) {
    return { ok: false, error: `Не удалось получить список файлов с GitHub: ${err.message}` };
  }

  const entries = Array.isArray(treeData.tree)
    ? treeData.tree.filter((t) => t.type === 'blob' && isAllowedAppUpdatePath(t.path))
    : [];
  if (!entries.length) {
    return { ok: false, error: 'Список файлов обновления пуст' };
  }

  const localVer = readLocalAppVersion();
  const nextFileShas = { ...(localVer.fileShas || {}) };
  const toDownload = entries.filter((entry) => {
    const absPath = path.join(__dirname, entry.path);
    const existsLocally = fs.existsSync(absPath);
    return !existsLocally || nextFileShas[entry.path] !== entry.sha;
  });

  const downloaded = [];
  for (const entry of toDownload) {
    const encodedPath = entry.path.split('/').map(encodeURIComponent).join('/');
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${remoteSha}/${encodedPath}`;
    let buf;
    try {
      buf = await fetchGithubBuffer(rawUrl, 15000);
    } catch (err) {
      return { ok: false, error: `Не удалось скачать ${entry.path}: ${err.message}` };
    }
    if (!buf || buf.length === 0) {
      return { ok: false, error: `Пустой файл при загрузке: ${entry.path}` };
    }
    if (/\.js$/i.test(entry.path)) {
      try {
        new vm.Script(buf.toString('utf8'), { filename: entry.path });
      } catch (syntaxErr) {
        return { ok: false, error: `Ошибка проверки ${entry.path}: ${syntaxErr.message}` };
      }
    }
    if (entry.path === 'public/index.html') {
      const txt = buf.toString('utf8');
      if (!txt.includes('<!DOCTYPE html>') || !txt.includes('</html>') || !txt.includes('</script>')) {
        return { ok: false, error: 'Скачанный public/index.html повреждён' };
      }
    }
    downloaded.push({ relPath: entry.path, sha: entry.sha, buf });
  }

  let backupDir = '';
  try {
    backupDir = createAutoBackup();
    for (const rel of ['bot.js', 'db.js', 'parser.js', 'public/index.html']) {
      const src = path.join(__dirname, rel);
      if (fs.existsSync(src)) {
        const dest = path.join(backupDir, 'code', rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
    }
  } catch (err) {
    return { ok: false, error: `Не удалось создать резервную копию: ${err.message}` };
  }

  const rootResolved = path.resolve(__dirname) + path.sep;
  let jsChanged = false;
  try {
    for (const file of downloaded) {
      const targetPath = path.resolve(__dirname, file.relPath);
      if (!targetPath.startsWith(rootResolved)) {
        throw new Error(`Недопустимый путь: ${file.relPath}`);
      }
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      safeWriteFile(targetPath, file.buf);
      nextFileShas[file.relPath] = file.sha;
      if (/^(bot|db|parser)\.js$/i.test(file.relPath)) jsChanged = true;
    }
    const nextVersionObj = {
      edition: localVer.edition || (fs.existsSync(path.join(__dirname, '.git')) ? '' : 'friend'),
      commitSha: remoteSha,
      fileShas: nextFileShas,
      updatedAt: new Date().toISOString(),
    };
    if (typeof localVer.schoolEnabled === 'boolean') {
      nextVersionObj.schoolEnabled = localVer.schoolEnabled;
    }
    writeLocalAppVersion(nextVersionObj);
  } catch (err) {
    return { ok: false, error: `Ошибка записи обновления: ${err.message}` };
  }

  return {
    ok: true,
    mode: jsChanged ? 'restart_server' : 'reload',
    backupDir,
    updatedFiles: downloaded.length,
    remoteHash: check.remoteHash,
    message: check.latestMsg || 'Обновление установлено',
  };
}

async function checkRepoUpdates() {
  if (!fs.existsSync(path.join(__dirname, '.git'))) {
    return await checkGithubDirectUpdates();
  }
  try {
    const originUrl = runGitSync(['remote', 'get-url', 'origin'], 4000);
    if (!/github\.com[:/]masturbek-lgbtq\/HelpTool(?:\.git)?$/i.test(originUrl)) {
      return { ok: false, error: 'Неподтверждённый источник обновлений' };
    }
    runGitSync(['fetch', 'origin', 'main', '--quiet'], 12000);
    const behind = parseInt(runGitSync(['rev-list', 'HEAD..origin/main', '--count'], 4000), 10) || 0;
    const localHash = runGitSync(['rev-parse', '--short', 'HEAD'], 4000);
    const remoteHash = runGitSync(['rev-parse', '--short', 'origin/main'], 4000);
    const latestMsg = behind > 0 ? runGitSync(['log', '-1', '--pretty=%s', 'origin/main'], 4000) : '';
    const changedFiles =
      behind > 0
        ? runGitSync(['diff', '--name-only', 'HEAD..origin/main'], 4000).split(/\r?\n/).filter(Boolean)
        : [];
    const needsExeRestart = changedFiles.some((f) => /\.(exe|dll)$/i.test(f));
    return {
      ok: true,
      mode: 'git',
      hasUpdate: behind > 0,
      behindCount: behind,
      localHash,
      remoteHash,
      latestMsg,
      needsExeRestart,
    };
  } catch (err) {
    const isPrivate404 = /404/.test(String(err.message || ''));
    return {
      ok: true,
      mode: 'offline',
      hasUpdate: false,
      behindCount: 0,
      warn: isPrivate404
        ? 'Репозиторий обновлений закрыт (HTTP 404) — данные экрана обновлены'
        : 'Не удалось связаться с GitHub — проверяю локально',
      detail: err.message,
    };
  }
}

function restartBotViaVbs() {
  try {
    const vbsPath = path.join(__dirname, 'start-bot.vbs');
    if (fs.existsSync(vbsPath)) {
      const child = spawn('wscript.exe', ['//B', vbsPath], {
        cwd: __dirname,
        detached: true,
        windowsHide: true,
        stdio: 'ignore',
      });
      child.unref();
    }
  } catch (err) {
    console.error('[restartBotViaVbs]', err.message);
  }
}

async function applyRepoUpdate() {
  if (!fs.existsSync(path.join(__dirname, '.git'))) {
    return await applyGithubDirectUpdate();
  }
  const check = await checkRepoUpdates();
  if (!check.ok) return check;
  if (!check.hasUpdate) {
    return { ok: true, mode: 'reload', message: 'Уже установлена актуальная версия' };
  }

  let backupDir = '';
  try {
    backupDir = createAutoBackup();
  } catch (err) {
    return { ok: false, error: `Не удалось создать резервную копию: ${err.message}` };
  }

  try {
    const dirty = runGitSync(['status', '--porcelain'], 4000);
    if (dirty) {
      return {
        ok: false,
        error: 'В рабочей папке есть несохранённые правки — обновление отменено ради безопасности',
      };
    }

    const changedFiles = runGitSync(['diff', '--name-only', 'HEAD..origin/main'], 4000)
      .split(/\r?\n/)
      .filter(Boolean);
    const hasBinaryChanges = changedFiles.some((f) => /\.(exe|dll)$/i.test(f));

    if (hasBinaryChanges) {
      const backupsRoot = path.join(__dirname, 'backups');
      const psScript = path.join(backupsRoot, 'apply-exe-update.ps1');
      const scriptBody = [
        'Start-Sleep -Milliseconds 700',
        'Get-Process -Name "Помощник" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue',
        '$pidFile = Join-Path $PSScriptRoot "..\\bot.pid"',
        'if (Test-Path $pidFile) {',
        '  $oldPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()',
        '  if ($oldPid) { Stop-Process -Id ([int]$oldPid) -Force -ErrorAction SilentlyContinue }',
        '}',
        'Start-Sleep -Milliseconds 600',
        'Set-Location (Join-Path $PSScriptRoot "..")',
        '$env:GCM_INTERACTIVE = "never"',
        '$env:GIT_TERMINAL_PROMPT = "0"',
        'git merge --ff-only origin/main',
        '$exePath = Join-Path (Get-Location) "Помощник.exe"',
        'if (Test-Path $exePath) { Start-Process -FilePath $exePath }',
      ].join('\r\n');
      fs.writeFileSync(psScript, '\uFEFF' + scriptBody, 'utf8');
      const child = spawn(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psScript],
        { cwd: __dirname, detached: true, windowsHide: true, stdio: 'ignore' }
      );
      child.unref();
      return {
        ok: true,
        mode: 'restart_app',
        backupDir,
        message: 'Перезапускаю приложение для установки обновления',
      };
    }

    runGitSync(['merge', '--ff-only', 'origin/main'], 12000);
    const jsChanged = changedFiles.some((f) => /^(bot|db|parser)\.js$/i.test(f));
    return {
      ok: true,
      mode: jsChanged ? 'restart_server' : 'reload',
      backupDir,
      remoteHash: check.remoteHash,
      message: check.latestMsg || 'Обновление установлено',
    };
  } catch (err) {
    return { ok: false, error: `Ошибка применения обновления: ${err.message}` };
  }
}

function safeEqualToken(a, b) {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyWebRequest(req, parsedUrl) {
  if (isLoopbackClient(req)) {
    return true;
  }
  const webKey = getWebAccessKey();
  if (!webKey) return false;
  const keyFromQuery = parsedUrl.searchParams.get('k') || '';
  const keyFromHeader = String(req.headers['x-access-key'] || '');
  if (safeEqualToken(keyFromQuery, webKey) || safeEqualToken(keyFromHeader, webKey)) {
    return true;
  }
  return false;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 8 * 1024 * 1024) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

let dataVersion = 1;
function bumpDataVersion() {
  dataVersion++;
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

function startWebServer() {
  const indexHtmlPath = path.join(__dirname, 'public', 'index.html');
  let cachedHtmlText = null;
  let cachedHtmlMtime = 0;

  function sendStaticCached(req, res, filePath, contentType, cacheControl) {
    if (!fs.existsSync(filePath)) return false;
    const st = fs.statSync(filePath);
    if (!st.isFile()) return false;
    const etag = `"${Math.floor(st.mtimeMs)}-${st.size}"`;
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, {
        ETag: etag,
        'Cache-Control': cacheControl,
      });
      res.end();
      return true;
    }
    const buf = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': buf.length,
      ETag: etag,
      'Cache-Control': cacheControl,
    });
    res.end(buf);
    return true;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;

      if (pathname === '/' || pathname === '/index.html') {
        if (!verifyWebRequest(req, parsedUrl)) {
          res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Доступ ограничен. Откройте экран через кнопку внутри вашего Telegram-бота.');
          return;
        }
        const st = fs.statSync(indexHtmlPath);
        if (cachedHtmlText === null || st.mtimeMs !== cachedHtmlMtime) {
          cachedHtmlText = fs.readFileSync(indexHtmlPath, 'utf8');
          cachedHtmlMtime = st.mtimeMs;
        }
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        });
        res.end(cachedHtmlText);
        return;
      }

      if (pathname === '/joker-icon-256.png') {
        const pngPath = path.join(__dirname, 'public', 'joker-icon-256.png');
        if (sendStaticCached(req, res, pngPath, 'image/png', 'public, max-age=86400')) {
          return;
        }
      }

      if (pathname === '/joker-noir-v2.ico' || pathname === '/joker-noir.ico' || pathname === '/favicon.ico') {
        const icoPath = path.join(__dirname, 'joker-noir-v2.ico');
        if (sendStaticCached(req, res, icoPath, 'image/x-icon', 'public, max-age=86400')) {
          return;
        }
      }

      if (pathname.startsWith('/css/') || pathname.startsWith('/js/')) {
        const folder = pathname.startsWith('/css/') ? 'css' : 'js';
        const safeName = path.basename(pathname);
        if (/^[a-zA-Z0-9._-]+$/.test(safeName)) {
          const assetPath = path.join(__dirname, 'public', folder, safeName);
          const mime = folder === 'css'
            ? 'text/css; charset=utf-8'
            : 'application/javascript; charset=utf-8';
          if (sendStaticCached(req, res, assetPath, mime, 'no-cache')) {
            return;
          }
        }
      }

      if (pathname.startsWith('/gallery/')) {
        const relPath = path.join('gallery', path.basename(pathname));
        const imgPath = path.join(__dirname, 'public', relPath);
        const ext = path.extname(imgPath).toLowerCase();
        const mime =
          ext === '.png'
            ? 'image/png'
            : ext === '.webp'
            ? 'image/webp'
            : ext === '.gif'
            ? 'image/gif'
            : 'image/jpeg';
        if (sendStaticCached(req, res, imgPath, mime, 'public, max-age=86400')) {
          return;
        }
      }

      if (pathname.startsWith('/api/')) {
        if (!verifyWebRequest(req, parsedUrl)) {
          sendJson(res, 403, { error: 'Доступ ограничен' });
          return;
        }

        if (pathname === '/api/ping' && req.method === 'GET') {
          sendJson(res, 200, { ok: true });
          return;
        }

        const today = toDateStr();
        if (getSetting('last_cleanup_date', '') !== today) {
          cleanupExpiredPlans(today);
          bumpDataVersion();
        }

        if (pathname === '/api/desktop-alerts' && req.method === 'GET') {
          const alerts = desktopAlertsQueue.splice(0, desktopAlertsQueue.length);
          sendJson(res, 200, { alerts });
          return;
        }

        if (pathname === '/api/state' && req.method === 'GET') {
          const stateVersion = `${today}:${dataVersion}`;
          if (parsedUrl.searchParams.get('v') === stateVersion) {
            res.writeHead(304, { 'Cache-Control': 'no-store' });
            res.end();
            return;
          }

          const allSettings = getAllSettings();
          const hasGemini = Boolean(getActiveGeminiKey());
          const hasBotToken = Boolean(getActiveBotToken());
          const hasPin = Boolean(allSettings.pin_hash);
          delete allSettings.gemini_api_key;
          delete allSettings.bot_token;
          delete allSettings.pin_hash;
          allSettings.has_gemini_key = hasGemini;
          allSettings.has_bot_token = hasBotToken;
          allSettings.has_pin = hasPin;
          allSettings.bot_username = telegramBotUsername;

          const schoolOn = isSchoolEnabled();
          const habitsGrid = getHabitsHistoryGrid(14, today);
          const todayHabits = habitsGrid.habits.map((h) => {
            const last = h.history[h.history.length - 1] || { scheduled: false, status: '', value: '' };
            const { history, ...rest } = h;
            return {
              ...rest,
              scheduled_today: last.scheduled,
              log_status: last.status,
              log_value: last.value,
            };
          });

          sendJson(res, 200, {
            stateVersion,
            todayStr: today,
            nowTimeStr: toTimeStr(),
            isoDay: getIsoDayOfWeek(today),
            weekType: getWeekTypeForDate(today),
            features: { school: schoolOn },
            settings: allSettings,
            todayLessons: schoolOn ? getLessonsForDate(today) : [],
            allLessons: schoolOn ? getAllLessons() : [],
            todayHabits,
            habitsGrid,
            overduePlans: getOverdueDailyPlans(today),
            todayPlans: getPlansForDate(today),
            upcomingPlans: getUpcomingDatedPlans(today),
            globalPlans: getGlobalPlans(),
            books: getBooks(),
          });
          return;
        }

        const body = req.method === 'POST' ? await readJsonBody(req) : {};
        if (req.method === 'POST' && pathname !== '/api/update/check') {
          bumpDataVersion();
        }

        if (pathname === '/api/quick-capture') {
          const out = executeSmartCapture(body.text || '');
          sendJson(res, 200, out);
          return;
        }

        if (pathname === '/api/reclassify') {
          const out = reclassifyInboxEvent(Number(body.eventId), String(body.newType));
          sendJson(res, 200, { ok: true, result: out });
          return;
        }

        // Уроки API
        if (pathname.startsWith('/api/lessons/') && !isSchoolEnabled()) {
          sendJson(res, 404, { error: 'Раздел расписания отключён в этой версии' });
          return;
        }
        if (pathname === '/api/lessons/add') {
          const item = addLesson(body);
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/lessons/bulk-text') {
          if (body.replaceAll) {
            clearAllLessons();
          }
          const parsed = parseScheduleText(body.text || '', body.defaultDay || 1);
          for (const l of parsed) addLesson(l);
          sendJson(res, 200, { ok: true, count: parsed.length });
          return;
        }

        if (pathname === '/api/lessons/toggle-cancel') {
          const item = toggleCancelLessonForDate(Number(body.id), today);
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/lessons/delete') {
          deleteLesson(Number(body.id));
          sendJson(res, 200, { ok: true });
          return;
        }

        if (pathname === '/api/lessons/flip-week') {
          const next = toggleCurrentWeekType(today);
          sendJson(res, 200, { ok: true, weekType: next });
          return;
        }

        // Привычки API
        if (pathname === '/api/habits/add') {
          const item = addHabit(body);
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/habits/toggle') {
          const log = toggleHabitCheck(Number(body.id), body.date_str || today);
          sendJson(res, 200, { ok: true, log });
          return;
        }

        if (pathname === '/api/habits/set-value') {
          const val = String(body.value_text || '').trim();
          const log = setHabitLog(
            Number(body.id),
            body.date_str || today,
            val ? 'done' : 'none',
            val
          );
          sendJson(res, 200, { ok: true, log });
          return;
        }

        if (pathname === '/api/habits/delete') {
          deleteHabit(Number(body.id));
          sendJson(res, 200, { ok: true });
          return;
        }

        // Дневные задания и общие планы API
        if (pathname === '/api/plans/add') {
          const item = addPlan(body);
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/plans/toggle') {
          const item = togglePlanDone(Number(body.id));
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/plans/toggle-priority') {
          const item = togglePlanPriority(Number(body.id));
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/plans/update') {
          const item = updatePlan(Number(body.id), body);
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/plans/move-today') {
          const item = movePlanToDate(Number(body.id), today);
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/plans/move-all-overdue') {
          const count = moveAllOverdueToToday(today);
          sendJson(res, 200, { ok: true, count });
          return;
        }

        if (pathname === '/api/plans/take-today') {
          const item = takeGlobalPlanToToday(Number(body.id), today);
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/plans/move') {
          const targetType = body.targetType === 'global' || body.targetType === 'simple' ? 'global' : 'dated';
          const item = updatePlan(Number(body.id), {
            list_type: targetType,
            plan_date: targetType === 'dated' ? today : '',
          });
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/plans/delete') {
          deletePlan(Number(body.id));
          sendJson(res, 200, { ok: true });
          return;
        }

        if (pathname === '/api/plans/clear-done-global' || pathname === '/api/plans/clear-done-simple') {
          clearDoneGlobalPlans();
          sendJson(res, 200, { ok: true });
          return;
        }

        // База книг API
        if (pathname === '/api/books/add') {
          const item = addBook(body);
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/books/update') {
          const item = updateBook(Number(body.id), body);
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/books/cycle-status') {
          const item = cycleBookStatus(Number(body.id));
          sendJson(res, 200, { ok: true, item });
          return;
        }

        if (pathname === '/api/books/delete') {
          deleteBook(Number(body.id));
          sendJson(res, 200, { ok: true });
          return;
        }

        // Настройки API
        if (pathname === '/api/settings') {
          const allowedKeys = [
            'pause_lessons',
            'pause_all',
            'lesson_lead_minutes',
            'morning_digest_enabled',
            'morning_digest_offset_min',
            'morning_digest_fallback_time',
            'evening_habits_enabled',
            'evening_habits_time',
            'week_cycle_mode',
            'sound_enabled',
            'fx_enabled',
            'eco_mode',
            'user_profile',
            'profile_config_json',
            'layout_config_json',
            'custom_themes_json',
            'auto_lock_sec',
            'bot_token',
            'gemini_api_key',
          ];
          const isLocal = isLoopbackClient(req);
          for (const k of allowedKeys) {
            if (body[k] !== undefined) {
              if ((k === 'bot_token' || k === 'gemini_api_key') && !isLocal) {
                sendJson(res, 403, { error: 'Изменение секретных ключей разрешено только локально с ПК' });
                return;
              }
              const val = (k === 'bot_token' || k === 'gemini_api_key')
                ? String(body[k]).trim()
                : String(body[k]);
              setSetting(k, val);
            }
          }
          let telegram = null;
          if (body.bot_token !== undefined && isLocal) {
            if (String(body.bot_token).trim()) {
              telegram = await ensureTelegramRunning();
            } else {
              telegramBotUsername = '';
            }
          }
          sendJson(res, 200, { ok: true, telegram });
          return;
        }

        // PIN-защита экрана (хеширование SHA-256 на сервере без передачи хеша наружу)
        if (pathname === '/api/pin/verify' && req.method === 'POST') {
          const savedHash = getSetting('pin_hash', '');
          if (!savedHash) {
            sendJson(res, 200, { ok: true });
            return;
          }
          const pin = String(body.pin || '').trim();
          const candidate = crypto.createHash('sha256').update(`helptool-pin-v31:${pin}`).digest('hex');
          const match = safeEqualToken(candidate, savedHash);
          sendJson(res, 200, { ok: match });
          return;
        }

        if (pathname === '/api/pin/set' && req.method === 'POST') {
          if (!isLoopbackClient(req)) {
            sendJson(res, 403, { error: 'Управление PIN-кодом разрешено только локально с ПК' });
            return;
          }
          const savedHash = getSetting('pin_hash', '');
          if (savedHash) {
            const curPin = String(body.currentPin || '').trim();
            const curHash = crypto.createHash('sha256').update(`helptool-pin-v31:${curPin}`).digest('hex');
            if (!safeEqualToken(curHash, savedHash)) {
              sendJson(res, 403, { ok: false, error: 'Неверный текущий PIN-код' });
              return;
            }
          }
          const newPin = String(body.newPin || '').trim();
          if (!newPin) {
            setSetting('pin_hash', '');
            sendJson(res, 200, { ok: true, enabled: false });
            return;
          }
          if (!/^\d{4}$/.test(newPin)) {
            sendJson(res, 400, { ok: false, error: 'PIN-код должен состоять из 4 цифр' });
            return;
          }
          const nextHash = crypto.createHash('sha256').update(`helptool-pin-v31:${newPin}`).digest('hex');
          setSetting('pin_hash', nextHash);
          sendJson(res, 200, { ok: true, enabled: true });
          return;
        }

        // Резервное копирование и восстановление базы (строго локально с ПК)
        if (pathname === '/api/backup/export') {
          if (!isLoopbackClient(req)) {
            sendJson(res, 403, { error: 'Экспорт базы разрешён только локально с ПК' });
            return;
          }
          const dump = exportVaultBackup();
          sendJson(res, 200, { ok: true, backup: dump });
          return;
        }

        if (pathname === '/api/backup/import' && req.method === 'POST') {
          if (!isLoopbackClient(req)) {
            sendJson(res, 403, { error: 'Импорт базы разрешён только локально с ПК' });
            return;
          }
          try {
            createAutoBackup();
            importVaultBackup(body.backup || body);
            bumpDataVersion();
            sendJson(res, 200, { ok: true });
          } catch (err) {
            sendJson(res, 400, { ok: false, error: err.message });
          }
          return;
        }

        // Безопасное автообновление (строго локально 127.0.0.1, никогда извне)
        if (pathname.startsWith('/api/update/')) {
          if (!isLoopbackClient(req)) {
            sendJson(res, 403, { error: 'Обновление разрешено только локально с компьютера' });
            return;
          }

          if (pathname === '/api/update/check') {
            const info = await checkRepoUpdates();
            sendJson(res, 200, info);
            return;
          }

          if (pathname === '/api/update/apply') {
            const result = await applyRepoUpdate();
            sendJson(res, 200, result);
            if (result.ok && result.mode === 'restart_server') {
              setTimeout(() => restartBotViaVbs(), 200);
            }
            return;
          }

          if (pathname === '/api/update/restart-local') {
            sendJson(res, 200, { ok: true, mode: 'restart_server' });
            setTimeout(() => restartBotViaVbs(), 200);
            return;
          }
        }

        sendJson(res, 404, { error: 'Маршрут не найден' });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
  });

  server.listen(WEB_PORT, '127.0.0.1', () => {
    const webKey = getWebAccessKey();
    const localSuffix = webKey ? `/?k=${webKey}` : '/';
    console.log(`Локальный экран запущен: http://127.0.0.1:${WEB_PORT}${localSuffix}`);
    if (getActiveBotToken()) {
      startCloudflareTunnel();
    } else {
      console.log('Cloudflare-туннель не запускается: Telegram-бот не подключён (экономия памяти).');
    }
  });
}

const TUNNEL_STATE_FILE = path.join(__dirname, 'tunnel.json');

function isProcessAlive(pid) {
  if (!pid || Number.isNaN(Number(pid))) return false;
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

function startCloudflareTunnel() {
  if (!getActiveBotToken()) return;
  if (tunnelProcess) return;
  // Если туннель уже запущен и его процесс жив — переиспользуем его URL без пересоздания
  if (fs.existsSync(TUNNEL_STATE_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(TUNNEL_STATE_FILE, 'utf8'));
      if (saved && saved.pid && saved.url && isProcessAlive(saved.pid)) {
        publicTunnelUrl = saved.url;
        console.log(`Переиспользован активный HTTPS-туннель (PID ${saved.pid}): ${getWebAppUrl()}`);
        updateTelegramMenuButton();
        return;
      }
    } catch {}
  }

  const cfPath = path.join(__dirname, 'bin', 'cloudflared.exe');
  if (!fs.existsSync(cfPath)) {
    console.log('cloudflared.exe не найден, экран доступен только локально.');
    return;
  }

  try {
    let tunnelBuf = '';
    tunnelProcess = spawn(
      cfPath,
      ['tunnel', '--url', `http://127.0.0.1:${WEB_PORT}`, '--no-autoupdate'],
      { windowsHide: true, detached: true, stdio: ['ignore', 'pipe', 'pipe'] }
    );

    const onOutput = (chunk) => {
      tunnelBuf += String(chunk || '');
      if (tunnelBuf.length > 16000) {
        tunnelBuf = tunnelBuf.slice(-8000);
      }
      const m = tunnelBuf.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (m && m[0] !== publicTunnelUrl) {
        publicTunnelUrl = m[0];
        try {
          safeWriteFile(
            TUNNEL_STATE_FILE,
            JSON.stringify({ pid: tunnelProcess.pid, url: publicTunnelUrl }),
            'utf8'
          );
        } catch {}
        console.log(`HTTPS-туннель Mini App активен: ${getWebAppUrl()}`);
        updateTelegramMenuButton();
      }
    };

    tunnelProcess.stdout.on('data', onOutput);
    tunnelProcess.stderr.on('data', onOutput);
    tunnelProcess.on('error', (err) => {
      console.error('Ошибка процесса cloudflared:', err.message);
    });
    tunnelProcess.on('exit', () => {
      tunnelProcess = null;
      if (running) {
        setTimeout(startCloudflareTunnel, 5000);
      }
    });
  } catch (err) {
    console.error('Не удалось запустить HTTPS-туннель:', err.message);
  }
}

async function registerCommands() {
  try {
    const commands = [
      { command: 'today', description: 'Обзор дня' },
      ...(isSchoolEnabled() ? [{ command: 'lessons', description: 'Школьное расписание' }] : []),
      { command: 'daily', description: 'Дневные задания' },
      { command: 'plans', description: 'Общие глобальные планы' },
      { command: 'habits', description: 'База привычек' },
      { command: 'books', description: 'База книг' },
      { command: 'pause', description: 'Пауза и режим тишины' },
    ];
    await callApi('setMyCommands', { commands });
  } catch (err) {
    console.error('Ошибка регистрации команд:', err.message);
  }
}

let running = true;
function cleanupAndExit() {
  running = false;
  if (tunnelProcess) {
    try {
      tunnelProcess.kill();
    } catch {}
  }
  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);

let telegramPollingActive = false;
let telegramBotUsername = '';

async function ensureTelegramRunning() {
  const token = getActiveBotToken();
  if (!token) {
    telegramBotUsername = '';
    return { ok: false, error: 'Токен не задан' };
  }

  try {
    const me = await callApi('getMe');
    telegramBotUsername = me.username || '';
    console.log(`Бот запущен: @${telegramBotUsername}`);
    await registerCommands();
    startCloudflareTunnel();
    updateTelegramMenuButton();
  } catch (err) {
    telegramBotUsername = '';
    console.error('Ошибка подключения к Telegram:', err.message);
    return { ok: false, error: err.message };
  }

  if (!telegramPollingActive) {
    telegramPollingActive = true;
    (async () => {
      let offset = 0;
      let lastToken = getActiveBotToken();
      while (running) {
        const currentToken = getActiveBotToken();
        if (!currentToken) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        if (currentToken !== lastToken) {
          offset = 0;
          lastToken = currentToken;
        }
        try {
          const updates = await callApi('getUpdates', {
            offset,
            timeout: 30,
            allowed_updates: ['message', 'callback_query'],
          });

          for (const update of updates) {
            offset = update.update_id + 1;
            if (update.message) {
              await handleMessage(update.message).catch((err) =>
                console.error('Ошибка обработки сообщения:', err.message)
              );
              bumpDataVersion();
            } else if (update.callback_query) {
              await handleCallbackQuery(update.callback_query).catch((err) =>
                console.error('Ошибка обработки кнопки:', err.message)
              );
              bumpDataVersion();
            }
          }
        } catch (err) {
          if (!running) break;
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
      telegramPollingActive = false;
    })();
  }

  return { ok: true, username: telegramBotUsername };
}

async function startApp() {
  startWebServer();
  cleanupExpiredPlans(toDateStr());

  setInterval(() => {
    runSchedulerTick().catch((err) =>
      console.error('Ошибка планировщика:', err.message)
    );
  }, 15000);

  if (getActiveBotToken()) {
    ensureTelegramRunning();
  } else {
    console.log('Telegram-бот не подключен (BOT_TOKEN не задан) — приложение работает локально.');
  }
}

startApp();
