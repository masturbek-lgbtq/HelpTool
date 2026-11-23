// Надёжное локальное хранилище iPhone (IndexedDB + зеркало localStorage + шифрование AES-GCM)
(function (global) {
  'use strict';

  const IDB_NAME = 'HelpTool_iPhone_Vault_v1';
  const IDB_STORE = 'vault';
  const VAULT_RECORD_KEY = 'main';
  const LS_MIRROR_KEY = 'helptool_ios_vault_mirror_v1';

  const DEFAULT_DATA = () => ({
    version: 1,
    nextId: 1,
    settings: {
      pause_all: '0',
      sound_enabled: '1',
      fx_enabled: '1',
      auto_lock_sec: '60',
      last_backup_at: '',
      user_profile: 'custom',
      profile_config_json: '',
      custom_themes_json: '',
    },
    plans: [],      // { id, title, list_type:'dated'|'global', plan_date, remind_time, category, is_priority, is_done, created_at }
    habits: [],     // { id, title, kind:'check'|'value', target_value, unit, days_mask, created_at }
    habitLogs: {},  // { "<habitId>:<YYYY-MM-DD>": { status:'done'|'frozen'|'', value:'' } }
    books: [],      // { id, title, author, status:'planned'|'reading'|'done', note, rating, created_at }
    events: [],     // последние 10 событий быстрого ввода для переклассификации
  });

  let dbInstance = null;
  let activeKey = null; // CryptoKey в памяти, пока разблокировано
  let dataCache = DEFAULT_DATA();
  let isPersistedGranted = false;

  function openIdb() {
    return new Promise((resolve) => {
      if (!global.indexedDB) {
        resolve(null);
        return;
      }
      if (dbInstance) {
        resolve(dbInstance);
        return;
      }
      try {
        const req = global.indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE);
          }
        };
        req.onsuccess = () => {
          dbInstance = req.result;
          resolve(dbInstance);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function idbGet(key) {
    const db = await openIdb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function idbSet(key, val) {
    const db = await openIdb();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(val, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  async function requestPersistence() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        isPersistedGranted = await navigator.storage.persist();
      }
    } catch {}
    return isPersistedGranted;
  }

  function normalizeData(raw) {
    const base = DEFAULT_DATA();
    if (!raw || typeof raw !== 'object') return base;
    return {
      version: 1,
      nextId: Number(raw.nextId) || 1,
      settings: { ...base.settings, ...(raw.settings || {}) },
      plans: Array.isArray(raw.plans) ? raw.plans : [],
      habits: Array.isArray(raw.habits) ? raw.habits : [],
      habitLogs: raw.habitLogs && typeof raw.habitLogs === 'object' ? raw.habitLogs : {},
      books: Array.isArray(raw.books) ? raw.books : [],
      events: Array.isArray(raw.events) ? raw.events.slice(-10) : [],
    };
  }

  async function readRawContainer() {
    const fromIdb = await idbGet(VAULT_RECORD_KEY);
    if (fromIdb) return fromIdb;
    try {
      const fromLs = localStorage.getItem(LS_MIRROR_KEY);
      if (fromLs) return JSON.parse(fromLs);
    } catch {}
    return null;
  }

  async function writeRawContainer(container) {
    await idbSet(VAULT_RECORD_KEY, container);
    try {
      localStorage.setItem(LS_MIRROR_KEY, JSON.stringify(container));
    } catch {}
  }

  async function persistNow() {
    const pinMeta = global.HelpCrypto.loadPinMeta();
    if (pinMeta && pinMeta.enabled) {
      if (!activeKey) {
        throw new Error('Хранилище заблокировано');
      }
      const enc = await global.HelpCrypto.encryptJson(dataCache, activeKey);
      await writeRawContainer({ encrypted: true, payload: enc });
    } else {
      await writeRawContainer({ encrypted: false, data: dataCache });
    }
  }

  async function initStorage() {
    await requestPersistence();
    const pinMeta = global.HelpCrypto.loadPinMeta();
    if (pinMeta && pinMeta.enabled) {
      activeKey = null;
      dataCache = DEFAULT_DATA();
      return { locked: true, pinMeta };
    }
    const raw = await readRawContainer();
    if (raw && !raw.encrypted && raw.data) {
      dataCache = normalizeData(raw.data);
    } else {
      dataCache = DEFAULT_DATA();
    }
    return { locked: false, pinMeta: null };
  }

  async function unlockWithPin(pin) {
    const meta = global.HelpCrypto.loadPinMeta();
    if (!meta) return { ok: true };
    const backoff = global.HelpCrypto.getBackoffState();
    if (backoff.lockUntil > Date.now()) {
      const waitSec = Math.ceil((backoff.lockUntil - Date.now()) / 1000);
      return { ok: false, lockedSec: waitSec, error: `Слишком много попыток. Подождите ${waitSec} сек.` };
    }
    const key = await global.HelpCrypto.verifyPin(pin, meta);
    if (!key) {
      const nextB = global.HelpCrypto.recordFailedAttempt();
      const leftBeforePause = Math.max(0, 5 - nextB.fails);
      return {
        ok: false,
        lockedSec: nextB.lockSec,
        error:
          nextB.lockSec > 0
            ? `Неверный PIN. Пауза ${nextB.lockSec} сек.`
            : `Неверный PIN (до паузы попыток: ${leftBeforePause || 1})`,
      };
    }

    global.HelpCrypto.resetFailedAttempts();
    activeKey = key;

    const raw = await readRawContainer();
    if (raw && raw.encrypted && raw.payload) {
      try {
        const plain = await global.HelpCrypto.decryptJson(raw.payload, activeKey);
        dataCache = normalizeData(plain);
      } catch {
        dataCache = DEFAULT_DATA();
      }
    } else if (raw && !raw.encrypted && raw.data) {
      dataCache = normalizeData(raw.data);
      await persistNow();
    } else {
      dataCache = DEFAULT_DATA();
      await persistNow();
    }
    return { ok: true };
  }

  function lockNow() {
    activeKey = null;
    dataCache = DEFAULT_DATA();
  }

  async function enablePin(pin, pinLength) {
    const { meta, key } = await global.HelpCrypto.createPinBundle(pin, pinLength);
    meta.autoLockSec = Number(dataCache.settings.auto_lock_sec || 60);
    activeKey = key;
    global.HelpCrypto.savePinMeta(meta);
    global.HelpCrypto.resetFailedAttempts();
    await persistNow();
    return meta;
  }

  async function disablePin(currentPin) {
    const meta = global.HelpCrypto.loadPinMeta();
    if (!meta) return { ok: true };
    const key = await global.HelpCrypto.verifyPin(currentPin, meta);
    if (!key) return { ok: false, error: 'Неверный текущий PIN-код' };
    activeKey = null;
    global.HelpCrypto.savePinMeta(null);
    global.HelpCrypto.resetFailedAttempts();
    await persistNow();
    return { ok: true };
  }

  async function updateAutoLockSec(sec) {
    dataCache.settings.auto_lock_sec = String(sec);
    const meta = global.HelpCrypto.loadPinMeta();
    if (meta) {
      meta.autoLockSec = Number(sec);
      global.HelpCrypto.savePinMeta(meta);
    }
    await persistNow();
  }

  // ===== Бизнес-логика (планы, привычки, книги, быстрый ввод, бэкапы) =====

  function allocId() {
    const id = dataCache.nextId || 1;
    dataCache.nextId = id + 1;
    return id;
  }

  function isHabitScheduledOnDay(habit, isoDay) {
    const mask = String(habit.days_mask || '1,2,3,4,5,6,7')
      .split(',')
      .map((x) => parseInt(x.trim(), 10));
    return mask.includes(isoDay);
  }

  function calculateHabitStreak(habit, endDateStr) {
    const pauseAll = dataCache.settings.pause_all === '1';
    let streak = 0;
    let cursor = endDateStr;
    for (let i = 0; i < 365; i++) {
      const iso = global.HelpParser.getIsoDayOfWeek(cursor);
      const scheduled = isHabitScheduledOnDay(habit, iso);
      const log = dataCache.habitLogs[`${habit.id}:${cursor}`];
      const status = log ? log.status : '';
      if (!scheduled) {
        cursor = global.HelpParser.addDaysStr(cursor, -1);
        continue;
      }
      if (status === 'done') {
        streak++;
      } else if (status === 'frozen' || (i === 0 && (status === '' || pauseAll))) {
        // Сегодняшний ещё не отмеченный день не обнуляет вчерашнюю серию
      } else {
        break;
      }
      cursor = global.HelpParser.addDaysStr(cursor, -1);
    }
    return streak;
  }

  function getStateSnapshot() {
    const today = global.HelpParser.toDateStr();
    const now = new Date();
    const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isoDay = global.HelpParser.getIsoDayOfWeek(today);

    const datedPlans = dataCache.plans.filter((p) => p.list_type === 'dated');
    const overduePlans = datedPlans
      .filter((p) => !p.is_done && p.plan_date && p.plan_date < today)
      .sort((a, b) => String(a.plan_date).localeCompare(String(b.plan_date)));
    const todayPlans = datedPlans
      .filter((p) => p.plan_date === today)
      .sort((a, b) => Number(a.is_done) - Number(b.is_done) || String(a.remind_time || '99').localeCompare(String(b.remind_time || '99')));
    const upcomingPlans = datedPlans
      .filter((p) => p.plan_date >= today)
      .sort((a, b) => String(a.plan_date).localeCompare(String(b.plan_date)) || Number(a.is_done) - Number(b.is_done));
    const globalPlans = dataCache.plans
      .filter((p) => p.list_type === 'global')
      .sort((a, b) => Number(a.is_done) - Number(b.is_done) || Number(b.is_priority) - Number(a.is_priority) || b.id - a.id);

    const todayHabits = dataCache.habits.map((h) => {
      const log = dataCache.habitLogs[`${h.id}:${today}`] || { status: '', value: '' };
      return {
        ...h,
        scheduled_today: isHabitScheduledOnDay(h, isoDay),
        log_status: log.status || '',
        log_value: log.value || '',
        streak: calculateHabitStreak(h, today),
      };
    });

    const dates = [];
    for (let i = 13; i >= 0; i--) {
      dates.push(global.HelpParser.addDaysStr(today, -i));
    }
    const habitsGrid = {
      dates,
      habits: dataCache.habits.map((h) => ({
        ...h,
        streak: calculateHabitStreak(h, today),
        history: dates.map((d) => {
          const log = dataCache.habitLogs[`${h.id}:${d}`];
          return {
            date: d,
            scheduled: isHabitScheduledOnDay(h, global.HelpParser.getIsoDayOfWeek(d)),
            status: log ? log.status : '',
            value: log ? log.value : '',
          };
        }),
      })),
    };

    const statusRank = { reading: 0, planned: 1, done: 2 };
    const books = [...dataCache.books].sort(
      (a, b) => (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) || b.id - a.id
    );

    const pinMeta = global.HelpCrypto.loadPinMeta();
    return {
      todayStr: today,
      nowTimeStr,
      isoDay,
      settings: { ...dataCache.settings },
      security: {
        pinEnabled: Boolean(pinMeta && pinMeta.enabled),
        pinLength: pinMeta ? pinMeta.pinLength : 4,
        autoLockSec: pinMeta ? Number(pinMeta.autoLockSec ?? 60) : Number(dataCache.settings.auto_lock_sec || 60),
        persistedStorage: isPersistedGranted,
        hasCrypto: global.HelpCrypto.hasWebCrypto(),
      },
      overduePlans,
      todayPlans,
      upcomingPlans,
      globalPlans,
      todayHabits,
      habitsGrid,
      books,
    };
  }

  async function addPlan({ title, list_type = 'dated', plan_date = '', remind_time = '', category = '', is_priority = 0 }) {
    const clean = String(title || '').trim();
    if (!clean) return null;
    const item = {
      id: allocId(),
      title: clean,
      list_type: list_type === 'global' ? 'global' : 'dated',
      plan_date: list_type === 'global' ? '' : plan_date || global.HelpParser.toDateStr(),
      remind_time: global.HelpParser.normalizeTime(remind_time),
      category: String(category || '').trim(),
      is_priority: is_priority ? 1 : 0,
      is_done: 0,
      created_at: new Date().toISOString(),
    };
    dataCache.plans.push(item);
    await persistNow();
    return item;
  }

  async function togglePlan(id) {
    const item = dataCache.plans.find((p) => p.id === id);
    if (!item) return null;
    item.is_done = item.is_done ? 0 : 1;
    await persistNow();
    return item;
  }

  async function togglePlanPriority(id) {
    const item = dataCache.plans.find((p) => p.id === id);
    if (!item) return null;
    item.is_priority = item.is_priority ? 0 : 1;
    await persistNow();
    return item;
  }

  async function movePlanToday(id) {
    const item = dataCache.plans.find((p) => p.id === id);
    if (!item) return null;
    item.list_type = 'dated';
    item.plan_date = global.HelpParser.toDateStr();
    item.is_done = 0;
    await persistNow();
    return item;
  }

  async function moveAllOverdueToday() {
    const today = global.HelpParser.toDateStr();
    let count = 0;
    for (const p of dataCache.plans) {
      if (p.list_type === 'dated' && !p.is_done && p.plan_date && p.plan_date < today) {
        p.plan_date = today;
        count++;
      }
    }
    if (count > 0) await persistNow();
    return count;
  }

  async function takeGoalToToday(id) {
    const goal = dataCache.plans.find((p) => p.id === id);
    if (!goal) return null;
    return addPlan({
      title: goal.title,
      list_type: 'dated',
      plan_date: global.HelpParser.toDateStr(),
    });
  }

  async function deletePlan(id) {
    dataCache.plans = dataCache.plans.filter((p) => p.id !== id);
    await persistNow();
  }

  async function renameCategoryInPlans(oldName, newName) {
    let changed = 0;
    for (const p of dataCache.plans) {
      if (p.category === oldName) {
        p.category = newName;
        changed++;
      }
    }
    if (changed > 0) await persistNow();
    return changed;
  }

  async function clearDoneGlobals() {
    dataCache.plans = dataCache.plans.filter((p) => !(p.list_type === 'global' && p.is_done));
    await persistNow();
  }

  async function addHabit({ title, kind = 'check', target_value = '', unit = '', days_mask = '1,2,3,4,5,6,7' }) {
    const clean = String(title || '').trim();
    if (!clean) return null;
    const item = {
      id: allocId(),
      title: clean,
      kind: kind === 'value' ? 'value' : 'check',
      target_value: String(target_value || '').trim(),
      unit: String(unit || '').trim(),
      days_mask: String(days_mask || '1,2,3,4,5,6,7'),
      created_at: new Date().toISOString(),
    };
    dataCache.habits.push(item);
    await persistNow();
    return item;
  }

  async function toggleHabit(id, dateStr) {
    const key = `${id}:${dateStr || global.HelpParser.toDateStr()}`;
    const cur = dataCache.habitLogs[key];
    const nextStatus = cur && cur.status === 'done' ? '' : 'done';
    if (!nextStatus) {
      delete dataCache.habitLogs[key];
    } else {
      dataCache.habitLogs[key] = { status: 'done', value: cur ? cur.value : '' };
    }
    await persistNow();
    return { status: nextStatus };
  }

  async function setHabitValue(id, dateStr, valueText) {
    const key = `${id}:${dateStr || global.HelpParser.toDateStr()}`;
    const val = String(valueText || '').trim();
    if (!val) {
      delete dataCache.habitLogs[key];
    } else {
      dataCache.habitLogs[key] = { status: 'done', value: val };
    }
    await persistNow();
    return { status: val ? 'done' : '', value: val };
  }

  async function deleteHabit(id) {
    dataCache.habits = dataCache.habits.filter((h) => h.id !== id);
    const prefix = `${id}:`;
    for (const k of Object.keys(dataCache.habitLogs)) {
      if (k.startsWith(prefix)) delete dataCache.habitLogs[k];
    }
    await persistNow();
  }

  async function addBook({ title, author = '', status = 'planned', note = '', rating = 0 }) {
    const clean = String(title || '').trim();
    if (!clean) return null;
    const item = {
      id: allocId(),
      title: clean,
      author: String(author || '').trim(),
      status: ['planned', 'reading', 'done'].includes(status) ? status : 'planned',
      note: String(note || '').trim(),
      rating: Math.max(0, Math.min(5, Number(rating) || 0)),
      created_at: new Date().toISOString(),
    };
    dataCache.books.push(item);
    await persistNow();
    return item;
  }

  async function cycleBookStatus(id) {
    const book = dataCache.books.find((b) => b.id === id);
    if (!book) return null;
    const order = ['planned', 'reading', 'done'];
    const next = order[(order.indexOf(book.status) + 1) % order.length];
    book.status = next;
    await persistNow();
    return book;
  }

  async function updateBook(id, { note, status, rating }) {
    const book = dataCache.books.find((b) => b.id === id);
    if (!book) return null;
    if (note !== undefined) book.note = String(note || '').trim();
    if (status && ['planned', 'reading', 'done'].includes(status)) book.status = status;
    if (rating !== undefined) book.rating = Math.max(0, Math.min(5, Number(rating) || 0));
    await persistNow();
    return book;
  }

  async function deleteBook(id) {
    dataCache.books = dataCache.books.filter((b) => b.id !== id);
    await persistNow();
  }

  async function updateSetting(key, val) {
    dataCache.settings[key] = String(val);
    await persistNow();
  }

  async function quickCapture(rawText) {
    const parsed = global.HelpParser.classifyQuickInput(rawText, dataCache.habits);
    const today = global.HelpParser.toDateStr();
    let targetId = 0;
    let summary = 'Сохранено';

    if (parsed.type === 'habit_log') {
      await setHabitValue(parsed.habit.id, today, parsed.value_text || '+');
      targetId = parsed.habit.id;
      summary = `Привычка отмечена: ${parsed.habit.title}`;
    } else if (parsed.type === 'book_planned' || parsed.type === 'book_reading' || parsed.type === 'book_done') {
      const st = parsed.type === 'book_reading' ? 'reading' : parsed.type === 'book_done' ? 'done' : 'planned';
      const bk = await addBook({ title: parsed.clean_title, author: parsed.author, status: st });
      targetId = bk ? bk.id : 0;
      summary = `Книга добавлена: ${parsed.clean_title}`;
    } else if (parsed.type === 'plan_today' || parsed.type === 'plan_tomorrow' || parsed.type === 'plan_dated') {
      const pl = await addPlan({
        title: parsed.clean_title,
        list_type: 'dated',
        plan_date: parsed.plan_date || today,
        remind_time: parsed.remind_time || '',
      });
      targetId = pl ? pl.id : 0;
      summary = `Дневное задание: ${parsed.clean_title}`;
    } else {
      const pl = await addPlan({
        title: parsed.clean_title,
        list_type: 'global',
        category: parsed.category || '',
      });
      targetId = pl ? pl.id : 0;
      summary = `Общий план: ${parsed.clean_title}`;
    }

    const ev = {
      id: allocId(),
      raw_text: String(rawText || '').trim(),
      guessed_type: parsed.type,
      target_id: targetId,
      clean_title: parsed.clean_title,
    };
    dataCache.events.push(ev);
    if (dataCache.events.length > 10) dataCache.events = dataCache.events.slice(-10);
    await persistNow();
    return { summary, event: ev };
  }

  async function reclassifyEvent(eventId, newType) {
    const ev = dataCache.events.find((e) => e.id === eventId);
    if (!ev) return;

    // Удаляем прежний созданный объект
    if (ev.guessed_type.startsWith('book_')) {
      dataCache.books = dataCache.books.filter((b) => b.id !== ev.target_id);
    } else if (ev.guessed_type.startsWith('plan_')) {
      dataCache.plans = dataCache.plans.filter((p) => p.id !== ev.target_id);
    }

    if (newType === 'delete') {
      await persistNow();
      return;
    }

    const today = global.HelpParser.toDateStr();
    if (newType === 'plan_today') {
      const pl = await addPlan({ title: ev.clean_title || ev.raw_text, list_type: 'dated', plan_date: today });
      ev.target_id = pl ? pl.id : 0;
    } else if (newType === 'plan_tomorrow') {
      const pl = await addPlan({
        title: ev.clean_title || ev.raw_text,
        list_type: 'dated',
        plan_date: global.HelpParser.addDaysStr(today, 1),
      });
      ev.target_id = pl ? pl.id : 0;
    } else if (newType === 'plan_global') {
      const pl = await addPlan({ title: ev.clean_title || ev.raw_text, list_type: 'global' });
      ev.target_id = pl ? pl.id : 0;
    } else if (newType === 'book_planned') {
      const bk = await addBook({ title: ev.clean_title || ev.raw_text, status: 'planned' });
      ev.target_id = bk ? bk.id : 0;
    }
    ev.guessed_type = newType;
    await persistNow();
  }

  // Экспорт и импорт резервной копии (зашифрованной, если включён PIN!)
  async function exportBackupObject(pinForEncryption = '') {
    dataCache.settings.last_backup_at = new Date().toISOString();
    await persistNow();
    const pinMeta = global.HelpCrypto.loadPinMeta();
    if (pinMeta && pinMeta.enabled && pinForEncryption) {
      return global.HelpCrypto.encryptBackupWithPin(dataCache, pinForEncryption);
    }
    return {
      format: 'helptool-ios-backup-plain-v1',
      createdAt: new Date().toISOString(),
      data: dataCache,
    };
  }

  async function importBackupObject(obj, pinIfEncrypted = '') {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Файл не является резервной копией Помощника');
    }
    if (obj.format === 'helptool-ios-backup-encrypted-v1') {
      if (!pinIfEncrypted) {
        return { needsPin: true };
      }
      const decrypted = await global.HelpCrypto.decryptBackupWithPin(obj, pinIfEncrypted);
      dataCache = normalizeData(decrypted);
      await persistNow();
      return { ok: true };
    }
    if (obj.format === 'helptool-ios-backup-plain-v1' && obj.data) {
      dataCache = normalizeData(obj.data);
      await persistNow();
      return { ok: true };
    }
    throw new Error('Неподдерживаемый формат резервной копии');
  }

  async function wipeAllData() {
    dataCache = DEFAULT_DATA();
    activeKey = null;
    global.HelpCrypto.savePinMeta(null);
    global.HelpCrypto.resetFailedAttempts();
    await writeRawContainer({ encrypted: false, data: dataCache });
  }

  global.HelpStorage = {
    initStorage,
    unlockWithPin,
    lockNow,
    enablePin,
    disablePin,
    updateAutoLockSec,
    getStateSnapshot,
    addPlan,
    togglePlan,
    togglePlanPriority,
    movePlanToday,
    moveAllOverdueToday,
    takeGoalToToday,
    deletePlan,
    renameCategoryInPlans,
    clearDoneGlobals,
    addHabit,
    toggleHabit,
    setHabitValue,
    deleteHabit,
    addBook,
    cycleBookStatus,
    updateBook,
    deleteBook,
    updateSetting,
    quickCapture,
    reclassifyEvent,
    exportBackupObject,
    importBackupObject,
    wipeAllData,
  };
})(window);
