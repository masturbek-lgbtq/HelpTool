const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'assistant.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL,
    week_type INTEGER NOT NULL DEFAULT 0,
    lesson_num INTEGER NOT NULL DEFAULT 1,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL,
    room_or_note TEXT NOT NULL DEFAULT '',
    join_url TEXT NOT NULL DEFAULT '',
    cancelled_date TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS lesson_alerts_sent (
    lesson_id INTEGER NOT NULL,
    date_str TEXT NOT NULL,
    PRIMARY KEY (lesson_id, date_str)
  );

  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'check',
    unit TEXT NOT NULL DEFAULT '',
    target_value TEXT NOT NULL DEFAULT '',
    days_mask TEXT NOT NULL DEFAULT '1,2,3,4,5,6,7',
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date_str TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'done',
    value_text TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE(habit_id, date_str)
  );

  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    list_type TEXT NOT NULL DEFAULT 'dated',
    plan_date TEXT NOT NULL DEFAULT '',
    remind_time TEXT NOT NULL DEFAULT '',
    reminded INTEGER NOT NULL DEFAULT 0,
    is_done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT '',
    media_file_id TEXT NOT NULL DEFAULT '',
    is_pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS inbox_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_text TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT '',
    media_file_id TEXT NOT NULL DEFAULT '',
    guessed_type TEXT NOT NULL,
    target_id INTEGER NOT NULL DEFAULT 0,
    meta_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS frozen_days (
    date_str TEXT PRIMARY KEY,
    reason TEXT NOT NULL DEFAULT 'pause'
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'planned',
    note TEXT NOT NULL DEFAULT '',
    rating INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_plans_type_date ON plans(list_type, plan_date, is_done);
  CREATE INDEX IF NOT EXISTS idx_lessons_active_day ON lessons(is_active, day_of_week);
  CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date_str);
  CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date_str);
`);

// Мягкая миграция колонок plans для глобальных планов (категория и важность)
try {
  const planCols = db.prepare(`PRAGMA table_info(plans)`).all().map((c) => c.name);
  if (!planCols.includes('category')) {
    db.exec(`ALTER TABLE plans ADD COLUMN category TEXT NOT NULL DEFAULT ''`);
  }
  if (!planCols.includes('is_priority')) {
    db.exec(`ALTER TABLE plans ADD COLUMN is_priority INTEGER NOT NULL DEFAULT 0`);
  }
} catch (err) {
  console.error('[db migrate plans columns]', err.message);
}

// Переводим старый простой список в общие глобальные планы
try {
  db.prepare(`UPDATE plans SET list_type = 'global' WHERE list_type = 'simple'`).run();
} catch {}

const DEFAULT_SETTINGS = {
  owner_user_id: '',
  owner_chat_id: '',
  pause_lessons: '0',
  pause_all: '0',
  lesson_lead_minutes: '2',
  morning_digest_enabled: '1',
  morning_digest_offset_min: '30',
  morning_digest_fallback_time: '10:00',
  evening_habits_enabled: '1',
  evening_habits_time: '21:00',
  week_cycle_mode: '1', // 1 = одинаковая неделя, 2 = верхняя/нижняя
  week_cycle_anchor: '2026-11-16', // Понедельник верхней недели (неделя 1)
  last_cleanup_date: '',
  last_morning_digest_date: '',
  last_evening_habits_date: '',
  sound_enabled: '1',
  fx_enabled: '1',
  eco_mode: '0',
  user_profile: '',
  profile_config_json: '',
  layout_config_json: '',
  custom_themes_json: '',
  pin_hash: '',
  auto_lock_sec: '0',
  bot_token: '',
  gemini_api_key: '',
};

const initSettingStmt = db.prepare(`
  INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
`);
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
  initSettingStmt.run(k, v);
}

// Вспомогательные функции дат (локальное время ПК)
function toDateStr(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeStr(d = new Date()) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function addDaysStr(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return toDateStr(dt);
}

// 1 = Пн ... 7 = Вс
function getIsoDayOfWeek(dateStrOrDate = new Date()) {
  let dt;
  if (typeof dateStrOrDate === 'string') {
    const [y, m, d] = dateStrOrDate.split('-').map(Number);
    dt = new Date(y, m - 1, d);
  } else {
    dt = dateStrOrDate;
  }
  const day = dt.getDay();
  return day === 0 ? 7 : day;
}

const DAY_NAMES_FULL = {
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
  7: 'Воскресенье',
};

const DAY_NAMES_SHORT = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
  7: 'Вс',
};

// Защита чувствительных настроек через Windows DPAPI (привязка к текущему пользователю Windows)
const SENSITIVE_KEYS = new Set(['bot_token', 'gemini_api_key']);
const DPAPI_EXE = path.join(__dirname, 'bin', 'dpapi.exe');
const decryptedCache = new Map();

function encryptSecret(plain) {
  const str = String(plain ?? '');
  if (!str) return '';
  if (str.startsWith('dpapi:')) return str;
  if (!fs.existsSync(DPAPI_EXE)) return str;
  try {
    const b64 = Buffer.from(str, 'utf8').toString('base64');
    const out = execFileSync(DPAPI_EXE, ['encrypt'], {
      input: b64,
      encoding: 'utf8',
      windowsHide: true,
    }).trim();
    if (out.startsWith('dpapi:')) {
      decryptedCache.set(out, str);
      return out;
    }
  } catch (err) {
    console.error('[dpapi encrypt error]', err.message);
  }
  return str;
}

function decryptSecret(stored) {
  const str = String(stored ?? '');
  if (!str) return '';
  if (!str.startsWith('dpapi:')) return str;
  if (decryptedCache.has(str)) return decryptedCache.get(str);
  if (!fs.existsSync(DPAPI_EXE)) return '';
  try {
    const outB64 = execFileSync(DPAPI_EXE, ['decrypt'], {
      input: str,
      encoding: 'utf8',
      windowsHide: true,
    }).trim();
    const plain = outB64 ? Buffer.from(outB64, 'base64').toString('utf8') : '';
    decryptedCache.set(str, plain);
    return plain;
  } catch (err) {
    console.error('[dpapi decrypt error]', err.message);
    return '';
  }
}

// Настройки
const getSettingStmt = db.prepare(`SELECT value FROM settings WHERE key = ?`);
const setSettingStmt = db.prepare(`
  INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

function getSetting(key, fallback = '') {
  const row = getSettingStmt.get(key);
  const val = row ? row.value : fallback;
  if (SENSITIVE_KEYS.has(key)) {
    return decryptSecret(val);
  }
  return val;
}

function setSetting(key, value) {
  let stored = String(value ?? '');
  if (SENSITIVE_KEYS.has(key) && stored) {
    stored = encryptSecret(stored);
  }
  setSettingStmt.run(key, stored);
  if ((key === 'pause_lessons' || key === 'pause_all') && String(value) === '1') {
    markDayFrozen(toDateStr(), 'pause');
  }
}

function getAllSettings() {
  const rows = db.prepare(`SELECT key, value FROM settings`).all();
  const res = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    res[r.key] = SENSITIVE_KEYS.has(r.key) ? decryptSecret(r.value) : r.value;
  }
  return res;
}

// Автоматическая миграция старых незашифрованных секретов в DPAPI при запуске
for (const secretKey of SENSITIVE_KEYS) {
  const row = getSettingStmt.get(secretKey);
  if (row && row.value && !row.value.startsWith('dpapi:')) {
    const encrypted = encryptSecret(row.value);
    if (encrypted !== row.value) {
      setSettingStmt.run(secretKey, encrypted);
    }
  }
}

// Одноразовый перенос старых заметок в «Общие планы», чтобы ничего не пропало
if (getSetting('migrated_v2_notes_to_global', '0') !== '1') {
  try {
    const oldNotes = db.prepare(`SELECT * FROM notes ORDER BY id ASC`).all();
    const ins = db.prepare(
      `INSERT INTO plans (title, list_type, plan_date, remind_time, is_done, category, is_priority)
       VALUES (?, 'global', '', '', 0, 'Личное', ?)`
    );
    for (const n of oldNotes) {
      const txt = String(n.content || '').trim();
      if (txt) {
        ins.run(txt, n.is_pinned ? 1 : 0);
      }
    }
    setSetting('migrated_v2_notes_to_global', '1');
  } catch (err) {
    console.error('[db migrate notes]', err.message);
  }
}

let frozenDaysCache = null;

function ensureFrozenDaysCache() {
  if (frozenDaysCache) return frozenDaysCache;
  const rows = db.prepare(`SELECT date_str FROM frozen_days`).all();
  frozenDaysCache = new Set(rows.map((r) => r.date_str));
  return frozenDaysCache;
}

function markDayFrozen(dateStr, reason = 'pause') {
  db.prepare(`
    INSERT OR IGNORE INTO frozen_days (date_str, reason) VALUES (?, ?)
  `).run(dateStr, reason);
  if (frozenDaysCache) frozenDaysCache.add(dateStr);
}

function isDayFrozen(dateStr) {
  return ensureFrozenDaysCache().has(dateStr);
}

// Определение текущей недели (1 или 2) для двухнедельного цикла
function getWeekTypeForDate(dateStr = toDateStr()) {
  const mode = parseInt(getSetting('week_cycle_mode', '1'), 10);
  if (mode !== 2) return 1;
  const anchor = getSetting('week_cycle_anchor', '2026-11-16');
  const [ay, am, ad] = anchor.split('-').map(Number);
  const [ty, tm, td] = dateStr.split('-').map(Number);
  const anchorDate = new Date(ay, am - 1, ad);
  const targetDate = new Date(ty, tm - 1, td);
  const diffDays = Math.floor((targetDate - anchorDate) / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  return ((diffWeeks % 2) + 2) % 2 === 0 ? 1 : 2;
}

function toggleCurrentWeekType(dateStr = toDateStr()) {
  const current = getWeekTypeForDate(dateStr);
  const anchor = getSetting('week_cycle_anchor', '2026-11-16');
  const newAnchor = addDaysStr(anchor, 7);
  setSetting('week_cycle_anchor', newAnchor);
  return current === 1 ? 2 : 1;
}

// ================= УРОКИ (РАСПИСАНИЕ) =================

function normalizeTime(raw = '') {
  const m = String(raw || '').trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return '';
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return '';
  }
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function timeToMinutes(t = '') {
  const norm = normalizeTime(t);
  if (!norm) return -1;
  const [h, m] = norm.split(':').map(Number);
  return h * 60 + m;
}

function addLesson({
  day_of_week,
  week_type = 0,
  lesson_num = 0,
  start_time,
  end_time = '',
  subject,
  room_or_note = '',
  join_url = '',
}) {
  const day = Math.min(7, Math.max(1, parseInt(day_of_week, 10) || 1));
  const wt = [0, 1, 2].includes(Number(week_type)) ? Number(week_type) : 0;
  const st = normalizeTime(start_time) || '08:30';
  const et = normalizeTime(end_time) || '';
  const cleanSubj = String(subject || '').trim() || 'Событие';

  let num = parseInt(lesson_num, 10) || 0;
  if (!num) {
    const existing = getLessonsForDay(day, wt);
    num = existing.length + 1;
  }

  const info = db
    .prepare(
      `INSERT INTO lessons (day_of_week, week_type, lesson_num, start_time, end_time, subject, room_or_note, join_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      day,
      wt,
      num,
      st,
      et,
      cleanSubj,
      String(room_or_note || '').trim(),
      String(join_url || '').trim()
    );
  return getLessonById(info.lastInsertRowid);
}

function getLessonById(id) {
  return db.prepare(`SELECT * FROM lessons WHERE id = ?`).get(id) || null;
}

function updateLesson(id, fields = {}) {
  const current = getLessonById(id);
  if (!current) return null;

  const updated = {
    day_of_week:
      fields.day_of_week !== undefined
        ? Math.min(7, Math.max(1, parseInt(fields.day_of_week, 10) || current.day_of_week))
        : current.day_of_week,
    week_type:
      fields.week_type !== undefined ? Number(fields.week_type) || 0 : current.week_type,
    lesson_num:
      fields.lesson_num !== undefined
        ? parseInt(fields.lesson_num, 10) || current.lesson_num
        : current.lesson_num,
    start_time:
      fields.start_time !== undefined
        ? normalizeTime(fields.start_time) || current.start_time
        : current.start_time,
    end_time:
      fields.end_time !== undefined
        ? normalizeTime(fields.end_time)
        : current.end_time,
    subject:
      fields.subject !== undefined
        ? String(fields.subject).trim() || current.subject
        : current.subject,
    room_or_note:
      fields.room_or_note !== undefined
        ? String(fields.room_or_note).trim()
        : current.room_or_note,
    join_url:
      fields.join_url !== undefined
        ? String(fields.join_url).trim()
        : current.join_url,
    cancelled_date:
      fields.cancelled_date !== undefined
        ? String(fields.cancelled_date).trim()
        : current.cancelled_date,
  };

  db.prepare(
    `UPDATE lessons
     SET day_of_week = ?, week_type = ?, lesson_num = ?, start_time = ?, end_time = ?,
         subject = ?, room_or_note = ?, join_url = ?, cancelled_date = ?
     WHERE id = ?`
  ).run(
    updated.day_of_week,
    updated.week_type,
    updated.lesson_num,
    updated.start_time,
    updated.end_time,
    updated.subject,
    updated.room_or_note,
    updated.join_url,
    updated.cancelled_date,
    id
  );
  return getLessonById(id);
}

function deleteLesson(id) {
  db.prepare(`DELETE FROM lessons WHERE id = ?`).run(id);
}

function clearDayLessons(dayOfWeek, weekType = null) {
  if (weekType === null) {
    db.prepare(`DELETE FROM lessons WHERE day_of_week = ?`).run(dayOfWeek);
  } else {
    db.prepare(`DELETE FROM lessons WHERE day_of_week = ? AND (week_type = 0 OR week_type = ?)`).run(
      dayOfWeek,
      weekType
    );
  }
}

function clearAllLessons() {
  db.prepare(`DELETE FROM lessons`).run();
}

function toggleCancelLessonForDate(id, dateStr = toDateStr()) {
  const lesson = getLessonById(id);
  if (!lesson) return null;
  const nextVal = lesson.cancelled_date === dateStr ? '' : dateStr;
  return updateLesson(id, { cancelled_date: nextVal });
}

function getAllLessons() {
  return db
    .prepare(
      `SELECT * FROM lessons WHERE is_active = 1
       ORDER BY day_of_week ASC, start_time ASC, lesson_num ASC, id ASC`
    )
    .all();
}

function getLessonsForDay(dayOfWeek, weekType = 0) {
  const mode = parseInt(getSetting('week_cycle_mode', '1'), 10);
  if (mode === 2 && (weekType === 1 || weekType === 2)) {
    return db
      .prepare(
        `SELECT * FROM lessons
         WHERE is_active = 1 AND day_of_week = ? AND (week_type = 0 OR week_type = ?)
         ORDER BY start_time ASC, lesson_num ASC, id ASC`
      )
      .all(dayOfWeek, weekType);
  }
  return db
    .prepare(
      `SELECT * FROM lessons
       WHERE is_active = 1 AND day_of_week = ?
       ORDER BY start_time ASC, lesson_num ASC, id ASC`
    )
    .all(dayOfWeek);
}

function getLessonsForDate(dateStr = toDateStr()) {
  const day = getIsoDayOfWeek(dateStr);
  const wt = getWeekTypeForDate(dateStr);
  const list = getLessonsForDay(day, wt);
  return list.map((item) => ({
    ...item,
    is_cancelled_today: item.cancelled_date === dateStr,
  }));
}

function wasLessonAlertSent(lessonId, dateStr) {
  const row = db
    .prepare(`SELECT 1 FROM lesson_alerts_sent WHERE lesson_id = ? AND date_str = ?`)
    .get(lessonId, dateStr);
  return Boolean(row);
}

function markLessonAlertSent(lessonId, dateStr) {
  db.prepare(
    `INSERT OR IGNORE INTO lesson_alerts_sent (lesson_id, date_str) VALUES (?, ?)`
  ).run(lessonId, dateStr);
}

// ================= ПРИВЫЧКИ =================

function getHabits() {
  return db
    .prepare(
      `SELECT * FROM habits WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`
    )
    .all();
}

function getHabitById(id) {
  return db.prepare(`SELECT * FROM habits WHERE id = ?`).get(id) || null;
}

function addHabit({
  title,
  kind = 'check',
  unit = '',
  target_value = '',
  days_mask = '1,2,3,4,5,6,7',
}) {
  const cleanTitle = String(title || '').trim() || 'Привычка';
  const cleanKind = kind === 'value' ? 'value' : 'check';
  const info = db
    .prepare(
      `INSERT INTO habits (title, kind, unit, target_value, days_mask)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      cleanTitle,
      cleanKind,
      String(unit || '').trim(),
      String(target_value || '').trim(),
      String(days_mask || '1,2,3,4,5,6,7').trim()
    );
  return getHabitById(info.lastInsertRowid);
}

function updateHabit(id, fields = {}) {
  const current = getHabitById(id);
  if (!current) return null;
  const title =
    fields.title !== undefined ? String(fields.title).trim() || current.title : current.title;
  const kind =
    fields.kind !== undefined
      ? fields.kind === 'value'
        ? 'value'
        : 'check'
      : current.kind;
  const unit =
    fields.unit !== undefined ? String(fields.unit).trim() : current.unit;
  const target_value =
    fields.target_value !== undefined
      ? String(fields.target_value).trim()
      : current.target_value;
  const days_mask =
    fields.days_mask !== undefined
      ? String(fields.days_mask).trim() || '1,2,3,4,5,6,7'
      : current.days_mask;

  db.prepare(
    `UPDATE habits
     SET title = ?, kind = ?, unit = ?, target_value = ?, days_mask = ?
     WHERE id = ?`
  ).run(title, kind, unit, target_value, days_mask, id);
  return getHabitById(id);
}

function deleteHabit(id) {
  db.prepare(`DELETE FROM habit_logs WHERE habit_id = ?`).run(id);
  db.prepare(`DELETE FROM habits WHERE id = ?`).run(id);
}

function isHabitScheduledOnDay(habit, isoDay) {
  const mask = String(habit.days_mask || '1,2,3,4,5,6,7')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter(Boolean);
  if (mask.length === 0) return true;
  return mask.includes(isoDay);
}

function getHabitLog(habitId, dateStr = toDateStr()) {
  return (
    db
      .prepare(`SELECT * FROM habit_logs WHERE habit_id = ? AND date_str = ?`)
      .get(habitId, dateStr) || null
  );
}

function setHabitLog(habitId, dateStr = toDateStr(), status = 'done', valueText = '') {
  if (!status || status === 'none') {
    db.prepare(`DELETE FROM habit_logs WHERE habit_id = ? AND date_str = ?`).run(
      habitId,
      dateStr
    );
    return null;
  }
  db.prepare(
    `INSERT INTO habit_logs (habit_id, date_str, status, value_text, updated_at)
     VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
     ON CONFLICT(habit_id, date_str) DO UPDATE SET
       status = excluded.status,
       value_text = excluded.value_text,
       updated_at = datetime('now', 'localtime')`
  ).run(habitId, dateStr, status, String(valueText || '').trim());
  return getHabitLog(habitId, dateStr);
}

function toggleHabitCheck(habitId, dateStr = toDateStr()) {
  const existing = getHabitLog(habitId, dateStr);
  if (!existing) {
    return setHabitLog(habitId, dateStr, 'done', '');
  }
  if (existing.status === 'done') {
    return setHabitLog(habitId, dateStr, 'none', '');
  }
  return setHabitLog(habitId, dateStr, 'done', '');
}

// Подсчет серии дней подряд с учетом расписания дней недели и заморозки на паузе
function calculateHabitStreak(habit, todayStr = toDateStr()) {
  const logs = db
    .prepare(
      `SELECT date_str, status FROM habit_logs
       WHERE habit_id = ? AND date_str <= ?
       ORDER BY date_str DESC LIMIT 120`
    )
    .all(habit.id, todayStr);
  const logMap = new Map(logs.map((r) => [r.date_str, r.status]));
  const pauseActive =
    getSetting('pause_lessons', '0') === '1' ||
    getSetting('pause_all', '0') === '1';

  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const dStr = addDaysStr(todayStr, -i);
    if (dStr < habit.created_at.slice(0, 10) && !logMap.has(dStr)) {
      break;
    }
    const isoDay = getIsoDayOfWeek(dStr);
    const scheduled = isHabitScheduledOnDay(habit, isoDay);
    const st = logMap.get(dStr);

    if (st === 'done') {
      streak++;
      continue;
    }
    if (st === 'freeze') {
      continue;
    }
    if (!scheduled) {
      continue;
    }
    if (i === 0) {
      // Сегодня ещё может быть не заполнено
      continue;
    }
    if (isDayFrozen(dStr) || (i === 0 && pauseActive)) {
      continue;
    }
    break;
  }
  return streak;
}

function getHabitsForDate(dateStr = toDateStr()) {
  const isoDay = getIsoDayOfWeek(dateStr);
  const all = getHabits();
  return all.map((h) => {
    const log = getHabitLog(h.id, dateStr);
    const scheduled = isHabitScheduledOnDay(h, isoDay);
    const streak = calculateHabitStreak(h, dateStr);
    return {
      ...h,
      scheduled_today: scheduled,
      log_status: log ? log.status : '',
      log_value: log ? log.value_text : '',
      streak,
    };
  });
}

function getHabitsHistoryGrid(daysCount = 14, endDateStr = toDateStr()) {
  const dates = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    dates.push(addDaysStr(endDateStr, -i));
  }
  const habits = getHabits();
  const logs = db
    .prepare(
      `SELECT habit_id, date_str, status, value_text
       FROM habit_logs
       WHERE date_str >= ? AND date_str <= ?`
    )
    .all(dates[0], dates[dates.length - 1]);

  const byKey = new Map();
  for (const l of logs) {
    byKey.set(`${l.habit_id}:${l.date_str}`, l);
  }

  return {
    dates,
    habits: habits.map((h) => ({
      ...h,
      streak: calculateHabitStreak(h, endDateStr),
      history: dates.map((d) => {
        const l = byKey.get(`${h.id}:${d}`);
        return {
          date: d,
          scheduled: isHabitScheduledOnDay(h, getIsoDayOfWeek(d)),
          status: l ? l.status : '',
          value: l ? l.value_text : '',
        };
      }),
    })),
  };
}

// ================= ДНЕВНЫЕ ЗАДАНИЯ И ОБЩИЕ ПЛАНЫ =================

// Несделанные дневные задания больше НЕ удаляются в полночь — остаются в списке просроченных
function cleanupExpiredPlans(todayStr = toDateStr()) {
  setSetting('last_cleanup_date', todayStr);
  return 0;
}

function addPlan({
  title,
  list_type = 'dated',
  plan_date = '',
  remind_time = '',
  category = '',
  is_priority = 0,
}) {
  const cleanTitle = String(title || '').trim() || 'Задание';
  const type = list_type === 'global' || list_type === 'simple' ? 'global' : 'dated';
  const pDate = type === 'dated' ? plan_date || toDateStr() : '';
  const rTime = type === 'dated' ? normalizeTime(remind_time) : '';
  const cleanCat = String(category || '').trim();
  const prio = is_priority ? 1 : 0;

  const info = db
    .prepare(
      `INSERT INTO plans (title, list_type, plan_date, remind_time, category, is_priority)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(cleanTitle, type, pDate, rTime, cleanCat, prio);
  return getPlanById(info.lastInsertRowid);
}

function getPlanById(id) {
  return db.prepare(`SELECT * FROM plans WHERE id = ?`).get(id) || null;
}

function togglePlanDone(id) {
  const p = getPlanById(id);
  if (!p) return null;
  const next = p.is_done ? 0 : 1;
  db.prepare(`UPDATE plans SET is_done = ? WHERE id = ?`).run(next, id);
  return getPlanById(id);
}

function togglePlanPriority(id) {
  const p = getPlanById(id);
  if (!p) return null;
  const next = p.is_priority ? 0 : 1;
  db.prepare(`UPDATE plans SET is_priority = ? WHERE id = ?`).run(next, id);
  return getPlanById(id);
}

function updatePlan(id, fields = {}) {
  const current = getPlanById(id);
  if (!current) return null;

  const title =
    fields.title !== undefined ? String(fields.title).trim() || current.title : current.title;
  const list_type =
    fields.list_type !== undefined
      ? fields.list_type === 'global' || fields.list_type === 'simple'
        ? 'global'
        : 'dated'
      : current.list_type === 'simple'
      ? 'global'
      : current.list_type;
  const plan_date =
    list_type === 'global'
      ? ''
      : fields.plan_date !== undefined
      ? String(fields.plan_date).trim()
      : current.plan_date || toDateStr();
  const remind_time =
    list_type === 'global'
      ? ''
      : fields.remind_time !== undefined
      ? normalizeTime(fields.remind_time)
      : current.remind_time;
  const is_done =
    fields.is_done !== undefined ? (fields.is_done ? 1 : 0) : current.is_done;
  const category =
    fields.category !== undefined ? String(fields.category || '').trim() : current.category || '';
  const is_priority =
    fields.is_priority !== undefined ? (fields.is_priority ? 1 : 0) : current.is_priority || 0;

  db.prepare(
    `UPDATE plans
     SET title = ?, list_type = ?, plan_date = ?, remind_time = ?, is_done = ?, category = ?, is_priority = ?, reminded = 0
     WHERE id = ?`
  ).run(title, list_type, plan_date, remind_time, is_done, category, is_priority, id);
  return getPlanById(id);
}

function movePlanToDate(id, dateStr = toDateStr()) {
  const p = getPlanById(id);
  if (!p) return null;
  db.prepare(
    `UPDATE plans SET list_type = 'dated', plan_date = ?, reminded = 0 WHERE id = ?`
  ).run(dateStr, id);
  return getPlanById(id);
}

function moveAllOverdueToToday(todayStr = toDateStr()) {
  const info = db
    .prepare(
      `UPDATE plans
       SET plan_date = ?, reminded = 0
       WHERE list_type = 'dated' AND is_done = 0 AND plan_date != '' AND plan_date < ?`
    )
    .run(todayStr, todayStr);
  return info.changes;
}

function takeGlobalPlanToToday(id, todayStr = toDateStr()) {
  const g = getPlanById(id);
  if (!g) return null;
  return addPlan({
    title: g.title,
    list_type: 'dated',
    plan_date: todayStr,
    remind_time: '',
    category: g.category || '',
  });
}

function deletePlan(id) {
  db.prepare(`DELETE FROM plans WHERE id = ?`).run(id);
}

function clearDoneGlobalPlans() {
  db.prepare(`DELETE FROM plans WHERE list_type IN ('global', 'simple') AND is_done = 1`).run();
}

function clearDoneSimplePlans() {
  return clearDoneGlobalPlans();
}

function getOverdueDailyPlans(todayStr = toDateStr()) {
  return db
    .prepare(
      `SELECT * FROM plans
       WHERE list_type = 'dated' AND is_done = 0 AND plan_date != '' AND plan_date < ?
       ORDER BY plan_date ASC, CASE WHEN remind_time = '' THEN '99:99' ELSE remind_time END ASC, id ASC`
    )
    .all(todayStr);
}

function getPlansForDate(dateStr = toDateStr()) {
  return db
    .prepare(
      `SELECT * FROM plans
       WHERE list_type = 'dated' AND plan_date = ?
       ORDER BY is_done ASC, CASE WHEN remind_time = '' THEN '99:99' ELSE remind_time END ASC, id ASC`
    )
    .all(dateStr);
}

function getUpcomingDatedPlans(fromDateStr = toDateStr()) {
  return db
    .prepare(
      `SELECT * FROM plans
       WHERE list_type = 'dated' AND plan_date >= ?
       ORDER BY plan_date ASC, is_done ASC, CASE WHEN remind_time = '' THEN '99:99' ELSE remind_time END ASC, id ASC`
    )
    .all(fromDateStr);
}

function getGlobalPlans() {
  return db
    .prepare(
      `SELECT * FROM plans
       WHERE list_type IN ('global', 'simple')
       ORDER BY is_done ASC, is_priority DESC, id DESC`
    )
    .all();
}

function getSimpleListPlans() {
  return getGlobalPlans();
}

function getDuePlanReminders(dateStr = toDateStr(), nowTimeStr = toTimeStr()) {
  return db
    .prepare(
      `SELECT * FROM plans
       WHERE list_type = 'dated'
         AND is_done = 0
         AND reminded = 0
         AND plan_date = ?
         AND remind_time != ''
         AND remind_time <= ?`
    )
    .all(dateStr, nowTimeStr);
}

function markPlanReminded(id) {
  db.prepare(`UPDATE plans SET reminded = 1 WHERE id = ?`).run(id);
}

// ================= ЗАМЕТКИ =================

function addNote({ content, media_type = '', media_file_id = '', is_pinned = 0 }) {
  const clean = String(content || '').trim() || (media_type ? `[${media_type}]` : 'Заметка');
  const info = db
    .prepare(
      `INSERT INTO notes (content, media_type, media_file_id, is_pinned)
       VALUES (?, ?, ?, ?)`
    )
    .run(clean, media_type, media_file_id, is_pinned ? 1 : 0);
  return getNoteById(info.lastInsertRowid);
}

function getNoteById(id) {
  return db.prepare(`SELECT * FROM notes WHERE id = ?`).get(id) || null;
}

function updateNote(id, fields = {}) {
  const current = getNoteById(id);
  if (!current) return null;
  const content =
    fields.content !== undefined
      ? String(fields.content).trim() || current.content
      : current.content;
  const is_pinned =
    fields.is_pinned !== undefined
      ? fields.is_pinned
        ? 1
        : 0
      : current.is_pinned;
  db.prepare(`UPDATE notes SET content = ?, is_pinned = ? WHERE id = ?`).run(
    content,
    is_pinned,
    id
  );
  return getNoteById(id);
}

function toggleNotePin(id) {
  const n = getNoteById(id);
  if (!n) return null;
  return updateNote(id, { is_pinned: n.is_pinned ? 0 : 1 });
}

function deleteNote(id) {
  db.prepare(`DELETE FROM notes WHERE id = ?`).run(id);
}

function getNotes(searchQuery = '', limit = 50) {
  const q = String(searchQuery || '').trim().toLowerCase();
  const rows = db
    .prepare(
      `SELECT * FROM notes
       ORDER BY is_pinned DESC, id DESC
       LIMIT ?`
    )
    .all(limit * 3);
  if (!q) return rows.slice(0, limit);
  return rows
    .filter((r) => String(r.content || '').toLowerCase().includes(q))
    .slice(0, limit);
}

// ================= БАЗА КНИГ =================

function normalizeBookStatus(status = 'planned') {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'reading' || s === 'done' || s === 'planned') return s;
  return 'planned';
}

function getBooks(statusFilter = '') {
  const sf = String(statusFilter || '').trim().toLowerCase();
  const baseSql = `
    SELECT * FROM books
    ${sf && ['planned', 'reading', 'done'].includes(sf) ? 'WHERE status = ?' : ''}
    ORDER BY
      CASE status WHEN 'reading' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END ASC,
      updated_at DESC,
      id DESC
  `;
  if (sf && ['planned', 'reading', 'done'].includes(sf)) {
    return db.prepare(baseSql).all(sf);
  }
  return db.prepare(baseSql).all();
}

function getBookById(id) {
  return db.prepare(`SELECT * FROM books WHERE id = ?`).get(id) || null;
}

function addBook({
  title,
  author = '',
  status = 'planned',
  note = '',
  rating = 0,
}) {
  const cleanTitle = String(title || '').trim() || 'Книга';
  const cleanAuthor = String(author || '').trim();
  const cleanStatus = normalizeBookStatus(status);
  const cleanNote = String(note || '').trim();
  const cleanRating = Math.min(5, Math.max(0, parseInt(rating, 10) || 0));

  const info = db
    .prepare(
      `INSERT INTO books (title, author, status, note, rating)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(cleanTitle, cleanAuthor, cleanStatus, cleanNote, cleanRating);
  return getBookById(info.lastInsertRowid);
}

function updateBook(id, fields = {}) {
  const current = getBookById(id);
  if (!current) return null;

  const title =
    fields.title !== undefined ? String(fields.title).trim() || current.title : current.title;
  const author =
    fields.author !== undefined ? String(fields.author || '').trim() : current.author;
  const status =
    fields.status !== undefined ? normalizeBookStatus(fields.status) : current.status;
  const note =
    fields.note !== undefined ? String(fields.note || '').trim() : current.note;
  const rating =
    fields.rating !== undefined
      ? Math.min(5, Math.max(0, parseInt(fields.rating, 10) || 0))
      : current.rating;

  db.prepare(
    `UPDATE books
     SET title = ?, author = ?, status = ?, note = ?, rating = ?, updated_at = datetime('now', 'localtime')
     WHERE id = ?`
  ).run(title, author, status, note, rating, id);
  return getBookById(id);
}

function cycleBookStatus(id) {
  const b = getBookById(id);
  if (!b) return null;
  const order = ['planned', 'reading', 'done'];
  const idx = order.indexOf(b.status);
  const next = order[(idx + 1) % order.length];
  return updateBook(id, { status: next });
}

function deleteBook(id) {
  db.prepare(`DELETE FROM books WHERE id = ?`).run(id);
}

// ================= ИСТОРИЯ АВТОУГАДЫВАНИЯ (ДЛЯ КОРРЕКТИРОВКИ В 1 ТАП) =================

function saveInboxEvent({
  raw_text,
  media_type = '',
  media_file_id = '',
  guessed_type,
  target_id = 0,
  meta = {},
}) {
  const info = db
    .prepare(
      `INSERT INTO inbox_events (raw_text, media_type, media_file_id, guessed_type, target_id, meta_json)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(raw_text || '').trim(),
      media_type,
      media_file_id,
      guessed_type,
      target_id,
      JSON.stringify(meta || {})
    );
  return getInboxEvent(info.lastInsertRowid);
}

function getInboxEvent(id) {
  const row = db.prepare(`SELECT * FROM inbox_events WHERE id = ?`).get(id);
  if (!row) return null;
  try {
    row.meta = JSON.parse(row.meta_json || '{}');
  } catch {
    row.meta = {};
  }
  return row;
}

function removeInboxTarget(ev) {
  if (!ev || !ev.target_id) return;
  if (ev.guessed_type === 'note') {
    deleteNote(ev.target_id);
  } else if (
    ev.guessed_type === 'plan_today' ||
    ev.guessed_type === 'plan_tomorrow' ||
    ev.guessed_type === 'plan_dated' ||
    ev.guessed_type === 'plan_global' ||
    ev.guessed_type === 'plan_simple'
  ) {
    deletePlan(ev.target_id);
  } else if (
    ev.guessed_type === 'book_planned' ||
    ev.guessed_type === 'book_reading' ||
    ev.guessed_type === 'book_done'
  ) {
    deleteBook(ev.target_id);
  } else if (ev.guessed_type === 'habit_log') {
    const dateStr = ev.meta?.date_str || toDateStr();
    setHabitLog(ev.target_id, dateStr, 'none', '');
  } else if (ev.guessed_type === 'lesson') {
    deleteLesson(ev.target_id);
  }
}

// Перенос записи из одного раздела в другой одной кнопкой под ответом бота
function reclassifyInboxEvent(eventId, newType) {
  const ev = getInboxEvent(eventId);
  if (!ev) return null;

  removeInboxTarget(ev);

  if (newType === 'delete') {
    db.prepare(`DELETE FROM inbox_events WHERE id = ?`).run(eventId);
    return { deleted: true, raw_text: ev.raw_text };
  }

  const today = toDateStr();
  const tomorrow = addDaysStr(today, 1);
  const cleanTitle = ev.meta?.clean_title || ev.raw_text || 'Запись';
  const remindTime = ev.meta?.remind_time || '';
  const author = ev.meta?.author || '';

  let newTargetId = 0;
  let resultItem = null;

  if (newType === 'plan_today') {
    resultItem = addPlan({
      title: cleanTitle,
      list_type: 'dated',
      plan_date: today,
      remind_time: remindTime,
    });
    newTargetId = resultItem.id;
  } else if (newType === 'plan_tomorrow') {
    resultItem = addPlan({
      title: cleanTitle,
      list_type: 'dated',
      plan_date: tomorrow,
      remind_time: remindTime,
    });
    newTargetId = resultItem.id;
  } else if (newType === 'plan_global' || newType === 'plan_simple' || newType === 'note') {
    resultItem = addPlan({
      title: cleanTitle,
      list_type: 'global',
      category: ev.meta?.category || '',
    });
    newTargetId = resultItem.id;
  } else if (newType === 'book_planned' || newType === 'book_reading' || newType === 'book_done') {
    const bStatus =
      newType === 'book_reading' ? 'reading' : newType === 'book_done' ? 'done' : 'planned';
    resultItem = addBook({
      title: cleanTitle,
      author,
      status: bStatus,
    });
    newTargetId = resultItem.id;
  }

  db.prepare(
    `UPDATE inbox_events SET guessed_type = ?, target_id = ? WHERE id = ?`
  ).run(newType, newTargetId, eventId);

  return {
    event: getInboxEvent(eventId),
    newType,
    item: resultItem,
  };
}

// ================= ЗАЩИЩЁННЫЙ ЭКСПОРТ И ИМПОРТ БАЗЫ (БЕЗ СЕКРЕТНЫХ ТОКЕНОВ) =================
function exportVaultBackup() {
  const settings = getAllSettings();
  delete settings.bot_token;
  delete settings.gemini_api_key;
  delete settings.owner_user_id;
  delete settings.owner_chat_id;
  delete settings.pin_hash;

  return {
    app: 'HelpTool',
    version: '3.1.0',
    exportedAt: new Date().toISOString(),
    settings,
    lessons: db.prepare(`SELECT * FROM lessons ORDER BY id ASC`).all(),
    plans: db.prepare(`SELECT * FROM plans ORDER BY id ASC`).all(),
    habits: db.prepare(`SELECT * FROM habits ORDER BY id ASC`).all(),
    habitLogs: db.prepare(`SELECT * FROM habit_logs ORDER BY id ASC`).all(),
    books: db.prepare(`SELECT * FROM books ORDER BY id ASC`).all(),
    frozenDays: db.prepare(`SELECT * FROM frozen_days ORDER BY date_str ASC`).all(),
  };
}

function importVaultBackup(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Некорректный формат файла резервной копии');
  }
  const safeSettingKeys = [
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
  ];

  db.exec('BEGIN IMMEDIATE');
  try {
    if (payload.settings && typeof payload.settings === 'object') {
      for (const k of safeSettingKeys) {
        if (payload.settings[k] !== undefined) {
          setSetting(k, String(payload.settings[k]));
        }
      }
    }

    if (Array.isArray(payload.lessons)) {
      db.prepare(`DELETE FROM lessons`).run();
      const ins = db.prepare(`
        INSERT INTO lessons (day_of_week, week_type, lesson_num, start_time, end_time, subject, room_or_note, join_url, cancelled_date, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const l of payload.lessons) {
        ins.run(
          Number(l.day_of_week) || 1,
          Number(l.week_type) || 0,
          Number(l.lesson_num) || 1,
          String(l.start_time || '09:00'),
          String(l.end_time || ''),
          String(l.subject || 'Занятие'),
          String(l.room_or_note || ''),
          String(l.join_url || ''),
          String(l.cancelled_date || ''),
          l.is_active === 0 ? 0 : 1
        );
      }
    }

    if (Array.isArray(payload.plans)) {
      db.prepare(`DELETE FROM plans`).run();
      const ins = db.prepare(`
        INSERT INTO plans (title, list_type, plan_date, remind_time, reminded, is_done, category, is_priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of payload.plans) {
        ins.run(
          String(p.title || 'Задача'),
          p.list_type === 'global' || p.list_type === 'simple' ? 'global' : 'dated',
          String(p.plan_date || ''),
          String(p.remind_time || ''),
          p.reminded ? 1 : 0,
          p.is_done ? 1 : 0,
          String(p.category || ''),
          p.is_priority ? 1 : 0
        );
      }
    }

    if (Array.isArray(payload.habits)) {
      db.prepare(`DELETE FROM habits`).run();
      db.prepare(`DELETE FROM habit_logs`).run();
      const idMap = new Map();
      const insH = db.prepare(`
        INSERT INTO habits (title, kind, unit, target_value, days_mask, is_active, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const h of payload.habits) {
        const info = insH.run(
          String(h.title || 'Привычка'),
          h.kind === 'value' ? 'value' : 'check',
          String(h.unit || ''),
          String(h.target_value || ''),
          String(h.days_mask || '1,2,3,4,5,6,7'),
          h.is_active === 0 ? 0 : 1,
          Number(h.sort_order) || 0
        );
        if (h.id) idMap.set(Number(h.id), Number(info.lastInsertRowid));
      }

      if (Array.isArray(payload.habitLogs)) {
        const insL = db.prepare(`
          INSERT OR REPLACE INTO habit_logs (habit_id, date_str, status, value_text)
          VALUES (?, ?, ?, ?)
        `);
        for (const l of payload.habitLogs) {
          const newHid = idMap.get(Number(l.habit_id)) || Number(l.habit_id);
          if (newHid && l.date_str) {
            insL.run(newHid, String(l.date_str), String(l.status || 'done'), String(l.value_text || ''));
          }
        }
      } else if (payload.habitLogs && typeof payload.habitLogs === 'object') {
        // Совместимость с форматом резервной копии iPhone ("<habitId>:<YYYY-MM-DD>": { status, value })
        const insL = db.prepare(`
          INSERT OR REPLACE INTO habit_logs (habit_id, date_str, status, value_text)
          VALUES (?, ?, ?, ?)
        `);
        for (const [k, v] of Object.entries(payload.habitLogs)) {
          const [hidStr, dStr] = k.split(':');
          const newHid = idMap.get(Number(hidStr)) || Number(hidStr);
          if (newHid && dStr && v && v.status) {
            insL.run(newHid, dStr, String(v.status), String(v.value || ''));
          }
        }
      }
    }

    if (Array.isArray(payload.books)) {
      db.prepare(`DELETE FROM books`).run();
      const insB = db.prepare(`
        INSERT INTO books (title, author, status, note, rating)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const b of payload.books) {
        insB.run(
          String(b.title || 'Книга'),
          String(b.author || ''),
          ['planned', 'reading', 'done'].includes(b.status) ? b.status : 'planned',
          String(b.note || ''),
          Math.max(0, Math.min(5, Number(b.rating) || 0))
        );
      }
    }

    if (Array.isArray(payload.frozenDays)) {
      for (const f of payload.frozenDays) {
        const dStr = typeof f === 'string' ? f : f?.date_str;
        if (dStr) markDayFrozen(String(dStr), 'backup');
      }
    }

    db.exec('COMMIT');
    frozenDaysCache = null;
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch {}
    throw err;
  }
}

module.exports = {
  db,
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
  markDayFrozen,
  isDayFrozen,
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
  isHabitScheduledOnDay,
  getHabitLog,
  setHabitLog,
  toggleHabitCheck,
  calculateHabitStreak,
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
  addNote,
  getNoteById,
  updateNote,
  toggleNotePin,
  deleteNote,
  getNotes,
  saveInboxEvent,
  getInboxEvent,
  removeInboxTarget,
  reclassifyInboxEvent,
  exportVaultBackup,
  importVaultBackup,
};
