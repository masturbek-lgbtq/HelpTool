// Главный контроллер автономного приложения «Помощник» для iPhone (без inline-скриптов, строгий CSP)
(function (global) {
  'use strict';

  const { SKINS, getTimeSlot, getTimeGreeting, renderChibiMarkup } = global.HelpThemes;
  const Storage = global.HelpStorage;
  const Crypto = global.HelpCrypto;
  const Calendar = global.HelpCalendar;

  const DAY_NAMES = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const MONTH_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const VIEW_TITLES = {
    overview: 'Обзор дня',
    daily: 'Дневные задания',
    goals: 'Общие планы',
    habits: 'База привычек',
    books: 'Книги',
  };

  let UI_PREFS = {
    skinId: 'goth-skull',
    filterCat: 'all',
  };

  let STATE = null;
  let activeView = 'overview';
  let goalFilter = 'all';
  let bookFilter = 'all';
  let editingBookId = null;
  let quoteIdx = 0;
  let liveReactionText = '';
  let liveReactionMood = '';
  let reactionResetTimer = null;
  let swRegistration = null;
  let hiddenAt = 0;

  // ===== Утилиты =====
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatHumanDate(dateStr) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || '';
    const [, m, d] = dateStr.split('-').map(Number);
    return `${d} ${MONTH_GEN[m - 1]}`;
  }

  function formatShortDM(dateStr) {
    if (!dateStr || dateStr.length < 10) return dateStr || '';
    return `${dateStr.slice(8, 10)}.${dateStr.slice(5, 7)}`;
  }

  function bookStatusLabel(st) {
    if (st === 'reading') return 'Читаю';
    if (st === 'done') return 'Прочитана';
    return 'В планах';
  }

  function hexToRgb(hex) {
    const clean = String(hex || '#111111').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function getCurrentSkin() {
    return SKINS.find((s) => s.id === UI_PREFS.skinId) || SKINS[0];
  }

  function loadUiPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem('helptool_ios_ui_prefs_v1') || '{}');
      if (saved && typeof saved === 'object') {
        UI_PREFS = { ...UI_PREFS, ...saved };
      }
    } catch {}
    applyCurrentSkin();
  }

  function saveUiPrefs() {
    try {
      localStorage.setItem('helptool_ios_ui_prefs_v1', JSON.stringify(UI_PREFS));
    } catch {}
  }

  // ===== Милые звуки (iOS Safari-safe Web Audio) =====
  let audioCtx = null;
  let audioUnlocked = false;

  function getOrCreateAudioCtx() {
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    return audioCtx;
  }

  function unlockAudioSync() {
    if (audioUnlocked && audioCtx && audioCtx.state === 'running') return;
    try {
      const ctx = getOrCreateAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      audioUnlocked = true;
    } catch {}
  }

  global.addEventListener('touchstart', unlockAudioSync, { passive: true });
  global.addEventListener('pointerdown', unlockAudioSync, { passive: true });
  global.addEventListener('keydown', unlockAudioSync, { passive: true });

  async function playUiSound(type = 'pop') {
    if (STATE && STATE.settings && STATE.settings.sound_enabled === '0') return;
    try {
      const ctx = getOrCreateAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const now = ctx.currentTime + 0.008;
      const playNote = (f1, f2, start, dur, gainPeak, wave = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(f1, start);
        if (f2 && f2 !== f1) osc.frequency.exponentialRampToValueAtTime(f2, start + dur * 0.72);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(gainPeak, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      };

      if (type === 'done') {
        playNote(523.25, 523.25, now, 0.11, 0.16, 'triangle');
        playNote(659.25, 659.25, now + 0.065, 0.12, 0.18, 'triangle');
        playNote(783.99, 783.99, now + 0.13, 0.14, 0.19, 'sine');
        playNote(1046.5, 1046.5, now + 0.195, 0.24, 0.22, 'sine');
      } else if (type === 'chibi') {
        playNote(740.0, 987.77, now, 0.085, 0.17, 'sine');
        playNote(1174.66, 1318.51, now + 0.07, 0.16, 0.2, 'triangle');
      } else if (type === 'timer') {
        playNote(587.33, 587.33, now, 0.16, 0.22, 'triangle');
        playNote(880.0, 880.0, now + 0.14, 0.18, 0.24, 'sine');
        playNote(1174.66, 1174.66, now + 0.28, 0.34, 0.25, 'sine');
      } else if (type === 'tap') {
        playNote(660, 880, now, 0.075, 0.13, 'sine');
      } else {
        playNote(523.25, 783.99, now, 0.095, 0.17, 'sine');
      }
    } catch {}
  }

  // ===== Точный таймер фокуса (Date.now() — не отстаёт при сворачивании iPhone) =====
  let focusState = {
    running: false,
    paused: false,
    endAt: 0,
    remainingMs: 25 * 60 * 1000,
    label: 'Фокус',
    intervalId: null,
  };

  function startFocusTimer(label = 'Фокус', minutes = 25) {
    clearInterval(focusState.intervalId);
    const ms = minutes * 60 * 1000;
    focusState = {
      running: true,
      paused: false,
      endAt: Date.now() + ms,
      remainingMs: ms,
      label: label || 'Фокус',
      intervalId: null,
    };
    playUiSound('pop');
    renderFocusPill();
    renderHeroArt();
    focusState.intervalId = setInterval(tickFocusTimer, 500);
  }

  function tickFocusTimer() {
    if (!focusState.running || focusState.paused) return;
    const leftMs = focusState.endAt - Date.now();
    if (leftMs <= 0) {
      clearInterval(focusState.intervalId);
      const doneLabel = focusState.label;
      focusState.running = false;
      focusState.remainingMs = 0;
      renderFocusPill();
      playUiSound('timer');
      triggerCharacterReaction('focus_done', doneLabel);
      showToast(`● Фокус завершён: «${doneLabel}» — сделай перерыв`);
      return;
    }
    focusState.remainingMs = leftMs;
    renderFocusPill();
  }

  function toggleFocusPause() {
    if (!focusState.running) return;
    if (focusState.paused) {
      focusState.paused = false;
      focusState.endAt = Date.now() + focusState.remainingMs;
    } else {
      focusState.remainingMs = Math.max(0, focusState.endAt - Date.now());
      focusState.paused = true;
    }
    playUiSound('pop');
    renderFocusPill();
  }

  function stopFocusTimer() {
    clearInterval(focusState.intervalId);
    focusState.running = false;
    focusState.paused = false;
    renderFocusPill();
    renderHeroArt();
  }

  function renderFocusPill() {
    const pill = document.getElementById('focusPill');
    if (!pill) return;
    pill.classList.toggle('active', focusState.running);
    if (!focusState.running) return;
    const totalSec = Math.max(0, Math.ceil((focusState.paused ? focusState.remainingMs : focusState.endAt - Date.now()) / 1000));
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    document.getElementById('focusClock').textContent = `${m}:${s}`;
    document.getElementById('focusTaskLabel').textContent = focusState.label;
    document.getElementById('focusPauseBtn').textContent = focusState.paused ? '▶' : '❚❚';
  }

  // ===== Применение темы и чибик =====
  function applyCurrentSkin() {
    const skin = getCurrentSkin();
    const isDark = skin.mode === 'dark';
    const c = skin.colors;
    const root = document.documentElement;
    const [ar, ag, ab] = hexToRgb(c.pink);
    const [br, bg, bb] = hexToRgb(c.bg);
    const [sr, sg, sb] = hexToRgb(c.surface);

    root.style.setProperty('--bg', c.bg);
    root.style.setProperty('--surface', c.surface);
    root.style.setProperty('--surface-glass', `rgba(${sr}, ${sg}, ${sb}, ${isDark ? 0.8 : 0.86})`);
    root.style.setProperty('--sidebar-glass', `rgba(${sr}, ${sg}, ${sb}, ${isDark ? 0.88 : 0.94})`);
    root.style.setProperty('--glass-border', isDark ? 'rgba(255,255,255,0.09)' : 'rgba(20,20,30,0.08)');
    root.style.setProperty('--divider', isDark ? 'rgba(255,255,255,0.07)' : 'rgba(20,20,30,0.07)');
    root.style.setProperty('--text', c.text);
    root.style.setProperty('--text-muted', c.textMuted);
    root.style.setProperty('--accent', c.pink);
    root.style.setProperty('--accent-soft', `rgba(${ar}, ${ag}, ${ab}, ${isDark ? 0.18 : 0.12})`);
    const accentLuma = 0.299 * ar + 0.587 * ag + 0.114 * ab;
    root.style.setProperty('--accent-ink', accentLuma > 180 ? '#111114' : '#ffffff');
    const bgAbsUrl = skin.img ? new URL(skin.img, window.location.href).href : '';
    root.style.setProperty('--wallpaper-url', bgAbsUrl ? `url('${bgAbsUrl}')` : 'none');
    root.style.setProperty('--wallpaper-pos', skin.cropPos || '50% 20%');
    root.style.setProperty('--wallpaper-opacity', bgAbsUrl ? (isDark ? '0.26' : '0.18') : '0');
    root.style.setProperty('--scrim-bg', `rgba(${br}, ${bg}, ${bb}, ${isDark ? 0.74 : 0.82})`);

    const metaTheme = document.getElementById('metaThemeColor');
    if (metaTheme) metaTheme.setAttribute('content', c.bg);

    renderHeroArt();
    renderStudioThemes();
    renderLockAvatar();
  }

  function renderLockAvatar() {
    const el = document.getElementById('lockAvatar');
    if (!el) return;
    el.innerHTML = renderChibiMarkup(getCurrentSkin().id, 'normal');
  }

  function renderHeroArt() {
    const skin = getCurrentSkin();
    const poster = document.getElementById('sideAnimePoster');
    const nameEl = document.getElementById('sideSkinName');
    const mobSub = document.getElementById('mobSkinSub');
    const topBtn = document.getElementById('topSkinBtn');
    const mobImg = document.getElementById('mobArtImg');
    const quoteAuthor = document.getElementById('heroQuoteAuthor');
    const quoteCount = document.getElementById('heroQuoteCount');
    const quoteText = document.getElementById('heroQuoteText');

    if (nameEl) nameEl.textContent = skin.name;
    if (mobSub) mobSub.textContent = skin.name;
    if (topBtn) topBtn.textContent = skin.name.split('·')[0].trim();

    if (skin.img) {
      if (poster) {
        const cur = document.getElementById('heroArtImg');
        if (!cur || cur.getAttribute('data-skin') !== skin.id) {
          poster.innerHTML = `<img id="heroArtImg" data-skin="${skin.id}" src="${skin.img}" alt="${escapeHtml(skin.name)}" style="object-position:${skin.cropPos || '50% 18%'};" />`;
        }
      }
      if (mobImg) {
        mobImg.src = skin.img;
        mobImg.style.display = 'block';
        mobImg.style.objectPosition = skin.cropPos || '50% 18%';
      }
    } else {
      if (poster) poster.innerHTML = '<div class="anime-poster-fallback">Минимализм</div>';
      if (mobImg) mobImg.style.display = 'none';
    }

    const slot = getTimeSlot();
    const mood = liveReactionMood || (focusState.running ? 'focus' : slot === 'night' ? 'sleepy' : 'normal');
    const chibiWrap = document.getElementById('chibiWrap');
    if (chibiWrap) {
      chibiWrap.classList.toggle('happy', mood === 'happy');
      chibiWrap.classList.toggle('sleepy', mood === 'sleepy');
      chibiWrap.innerHTML = renderChibiMarkup(skin.id, mood);
    }

    const quotes = skin.quotes || [];
    if (quotes.length) {
      const idx = quoteIdx % quotes.length;
      const displayQuote = liveReactionText || (quoteIdx === 0 ? getTimeGreeting(skin) : quotes[idx]);
      if (quoteAuthor) quoteAuthor.textContent = skin.name.split('·')[0].trim();
      if (quoteCount) quoteCount.textContent = liveReactionText ? '★ реакция' : `${idx + 1}/${quotes.length} · ещё →`;
      if (quoteText) quoteText.textContent = `«${displayQuote}»`;
    }
  }

  function triggerCharacterReaction(kind, titleHint = '') {
    const skin = getCurrentSkin();
    const pool = {
      task_done: ['Отлично! Задание закрыто — ещё один шаг сделан.', 'Готово! Список стал короче.'],
      habit_done: ['Привычка засчитана — серия растёт!', 'Отметка стоит, так держать!'],
      book_done: ['Поздравляю с прочитанной книгой! Что возьмём следующим?'],
      focus_done: ['Сессия фокуса завершена! Самое время сделать короткий перерыв.'],
    }[kind] || ['Готово!'];

    let line = pool[Math.floor(Math.random() * pool.length)];
    if (skin.id === 'ellen-zzz' && kind === 'task_done') line = 'На одно задание меньше — ближе к законному отдыху.';
    else if (skin.id === 'vergil-yamato' && kind === 'task_done') line = 'Чистое исполнение. Мотивация растёт.';
    else if (skin.id === 'terrorblade-sakura' && kind === 'task_done') line = 'Ровный штрих туши: одно задание закрыто.';
    else if (skin.id === 'yumeko-kakegurui' && kind === 'task_done') line = 'Партия в твою пользу! Ещё одно задание закрыто ♠';
    else if (titleHint && kind === 'book_done') line = `«${titleHint}» прочитана! Можно выставить оценку.`;

    liveReactionText = line;
    liveReactionMood = 'happy';
    renderHeroArt();

    const card = document.getElementById('sideAnimeCard');
    const box = document.getElementById('heroQuote');
    card?.classList.add('reacting');
    box?.classList.add('reacting');
    clearTimeout(reactionResetTimer);
    reactionResetTimer = setTimeout(() => {
      card?.classList.remove('reacting');
      box?.classList.remove('reacting');
      liveReactionMood = '';
      liveReactionText = '';
      renderHeroArt();
    }, 3400);
  }

  // ===== Экран PIN-кода и шифрование =====
  let pinFlow = {
    mode: '', // 'unlock' | 'setup1' | 'setup2' | 'disable' | 'export_pin' | 'import_pin'
    length: 4,
    buffer: '',
    firstPin: '',
    pendingImportObj: null,
    lockTimer: null,
  };

  function openPinModal(mode, opts = {}) {
    clearInterval(pinFlow.lockTimer);
    const meta = Crypto.loadPinMeta();
    pinFlow.mode = mode;
    pinFlow.buffer = '';
    pinFlow.firstPin = opts.firstPin || '';
    pinFlow.pendingImportObj = opts.importObj || null;
    pinFlow.length = opts.length || (meta ? meta.pinLength : 4);

    const screen = document.getElementById('lockScreen');
    const titleEl = document.getElementById('lockTitle');
    const subEl = document.getElementById('lockSub');
    const leftBtn = document.getElementById('btnPinCancelOrReset');

    subEl.classList.remove('err');
    if (mode === 'unlock') {
      document.body.classList.add('app-locked');
      titleEl.textContent = 'Введите PIN-код';
      subEl.textContent = 'Записи зашифрованы на вашем iPhone';
      leftBtn.textContent = 'Сброс';
    } else if (mode === 'setup1') {
      titleEl.textContent = 'Придумайте PIN-код';
      subEl.textContent = '4 цифры для защиты и шифрования базы';
      leftBtn.textContent = 'Отмена';
    } else if (mode === 'setup2') {
      titleEl.textContent = 'Повторите PIN-код';
      subEl.textContent = 'Подтвердите новый код ещё раз';
      leftBtn.textContent = 'Отмена';
    } else if (mode === 'disable') {
      titleEl.textContent = 'Отключение PIN';
      subEl.textContent = 'Введите текущий PIN-код для подтверждения';
      leftBtn.textContent = 'Отмена';
    } else if (mode === 'export_pin') {
      titleEl.textContent = 'Шифрование копии';
      subEl.textContent = 'Введите ваш PIN — файл копии будет зашифрован';
      leftBtn.textContent = 'Отмена';
    } else if (mode === 'import_pin') {
      titleEl.textContent = 'Копия зашифрована';
      subEl.textContent = 'Введите PIN, которым защищали эту резервную копию';
      leftBtn.textContent = 'Отмена';
    }

    renderLockAvatar();
    renderPinDots();
    screen.classList.add('open');

    if (mode === 'unlock') {
      checkPinBackoffUi();
    }
  }

  function closePinModal() {
    clearInterval(pinFlow.lockTimer);
    pinFlow.mode = '';
    pinFlow.buffer = '';
    document.getElementById('lockScreen').classList.remove('open');
    document.body.classList.remove('app-locked');
  }

  function renderPinDots(shake = false) {
    const wrap = document.getElementById('pinDots');
    if (!wrap) return;
    let html = '';
    for (let i = 0; i < pinFlow.length; i++) {
      html += `<span class="pin-dot ${i < pinFlow.buffer.length ? 'filled' : ''}"></span>`;
    }
    wrap.innerHTML = html;
    if (shake) {
      wrap.classList.remove('shake');
      void wrap.offsetWidth;
      wrap.classList.add('shake');
    }
  }

  function checkPinBackoffUi() {
    const b = Crypto.getBackoffState();
    const subEl = document.getElementById('lockSub');
    if (b.lockUntil > Date.now()) {
      const updateMsg = () => {
        const left = Math.ceil((b.lockUntil - Date.now()) / 1000);
        if (left <= 0) {
          clearInterval(pinFlow.lockTimer);
          subEl.classList.remove('err');
          subEl.textContent = 'Введите PIN-код для входа';
          return;
        }
        subEl.classList.add('err');
        subEl.textContent = `Слишком много попыток. Подождите ${left} сек.`;
      };
      updateMsg();
      clearInterval(pinFlow.lockTimer);
      pinFlow.lockTimer = setInterval(updateMsg, 1000);
      return true;
    }
    return false;
  }

  async function handlePinInputKey(k) {
    if (!pinFlow.mode) return;
    if (pinFlow.mode === 'unlock' && checkPinBackoffUi()) return;

    playUiSound('tap');
    if (k === 'back') {
      pinFlow.buffer = pinFlow.buffer.slice(0, -1);
      renderPinDots();
      return;
    }
    if (!/^\d$/.test(k) || pinFlow.buffer.length >= pinFlow.length) return;
    pinFlow.buffer += k;
    renderPinDots();

    if (pinFlow.buffer.length === pinFlow.length) {
      const entered = pinFlow.buffer;
      setTimeout(() => completePinStep(entered), 90);
    }
  }

  async function completePinStep(entered) {
    const subEl = document.getElementById('lockSub');
    const fail = (msg) => {
      pinFlow.buffer = '';
      subEl.classList.add('err');
      subEl.textContent = msg;
      renderPinDots(true);
    };

    try {
      if (pinFlow.mode === 'unlock') {
        const res = await Storage.unlockWithPin(entered);
        if (!res.ok) {
          fail(res.error || 'Неверный PIN-код');
          if (res.lockedSec) checkPinBackoffUi();
          return;
        }
        playUiSound('done');
        closePinModal();
        refreshAndRender();
        return;
      }

      if (pinFlow.mode === 'setup1') {
        openPinModal('setup2', { firstPin: entered, length: pinFlow.length });
        return;
      }

      if (pinFlow.mode === 'setup2') {
        if (entered !== pinFlow.firstPin) {
          fail('Коды не совпали — попробуйте снова');
          setTimeout(() => openPinModal('setup1', { length: pinFlow.length }), 700);
          return;
        }
        await Storage.enablePin(entered, pinFlow.length);
        playUiSound('done');
        closePinModal();
        refreshAndRender();
        flashStudioToast('● Защита PIN и шифрование включены');
        return;
      }

      if (pinFlow.mode === 'disable') {
        const res = await Storage.disablePin(entered);
        if (!res.ok) {
          fail(res.error || 'Неверный PIN-код');
          return;
        }
        playUiSound('pop');
        closePinModal();
        refreshAndRender();
        flashStudioToast('● Защита PIN отключена');
        return;
      }

      if (pinFlow.mode === 'export_pin') {
        const meta = Crypto.loadPinMeta();
        const key = await Crypto.verifyPin(entered, meta);
        if (!key) {
          fail('Неверный PIN-код');
          return;
        }
        const obj = await Storage.exportBackupObject(entered);
        triggerJsonDownload(obj, `helptool-backup-encrypted-${STATE.todayStr}.json`);
        playUiSound('done');
        closePinModal();
        refreshAndRender();
        flashStudioToast('● Зашифрованная копия сохранена');
        return;
      }

      if (pinFlow.mode === 'import_pin') {
        try {
          await Storage.importBackupObject(pinFlow.pendingImportObj, entered);
          playUiSound('done');
          closePinModal();
          refreshAndRender();
          flashStudioToast('● Данные восстановлены из копии');
        } catch {
          fail('Неверный PIN от этой резервной копии');
        }
      }
    } catch (err) {
      fail(err.message || 'Ошибка защиты');
    }
  }

  function lockAppManually() {
    const meta = Crypto.loadPinMeta();
    if (!meta || !meta.enabled) return;
    closeStudio();
    Storage.lockNow();
    // Стираем открытые списки с экрана до повторной расшифровки
    for (const id of ['ovOverdueBox', 'ovDailyList', 'ovGoalsList', 'ovHabitsWrap', 'ovBooksWrap', 'dailyGroupsSection', 'goalsListWrap', 'habitsMatrixCard', 'booksListWrap']) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    }
    openPinModal('unlock');
  }

  function triggerJsonDownload(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // ===== Рендеринг интерфейса =====
  function refreshAndRender() {
    STATE = Storage.getStateSnapshot();
    const dateInput = document.getElementById('dailyDate');
    if (dateInput && !dateInput.value) dateInput.value = STATE.todayStr;
    renderHeader();
    renderSidebarCounts();
    renderOverview();
    renderDailyView();
    renderGoalsView();
    renderHabitsView();
    renderBooksView();
    renderStudioSettingsState();
  }

  function switchView(viewId) {
    if (!VIEW_TITLES[viewId]) viewId = 'overview';
    if (activeView !== viewId) playUiSound('tap');
    activeView = viewId;
    document.querySelectorAll('.view-pane').forEach((el) => el.classList.remove('active'));
    document.getElementById(`view-${viewId}`)?.classList.add('active');
    document.querySelectorAll('.side-btn, .mob-nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
    });
    renderHeader();
  }

  function renderHeader() {
    if (!STATE) return;
    const dateStr = `${DAY_NAMES[STATE.isoDay]}, ${formatHumanDate(STATE.todayStr)}`;
    document.getElementById('mobDateTitle').textContent = activeView === 'overview' ? dateStr : VIEW_TITLES[activeView];

    const titleEl = document.getElementById('hdrDate');
    const subEl = document.getElementById('hdrSub');
    if (activeView === 'overview') {
      titleEl.textContent = dateStr;
      const openDaily = STATE.todayPlans.filter((p) => !p.is_done).length;
      const overdueCnt = STATE.overduePlans.length;
      const parts = [openDaily ? `Заданий осталось: ${openDaily}` : 'Задания закрыты'];
      if (overdueCnt) parts.push(`С прошлых дней: ${overdueCnt}`);
      subEl.textContent = parts.join(' · ');
    } else {
      titleEl.textContent = VIEW_TITLES[activeView];
      subEl.textContent = dateStr;
    }

    const pinOn = Boolean(STATE.security && STATE.security.pinEnabled);
    document.getElementById('btnMobLock').style.display = pinOn ? 'inline-flex' : 'none';
    document.getElementById('btnTopLock').style.display = pinOn ? 'inline-flex' : 'none';
    const secBtn = document.getElementById('btnSecurityPill');
    if (secBtn) {
      secBtn.textContent = pinOn ? '🔒 Защищено PIN' : '○ Без PIN';
      secBtn.classList.toggle('secured', pinOn);
    }
  }

  function renderSidebarCounts() {
    const openDaily = STATE.todayPlans.filter((p) => !p.is_done).length;
    const overdueCnt = STATE.overduePlans.length;
    const openGoals = STATE.globalPlans.filter((g) => !g.is_done).length;
    const habs = STATE.todayHabits.filter((h) => h.scheduled_today);
    const doneHabs = habs.filter((h) => h.log_status === 'done').length;

    const cntDaily = document.getElementById('cntDaily');
    cntDaily.textContent = overdueCnt ? `${openDaily} (+${overdueCnt})` : String(openDaily);
    cntDaily.classList.toggle('alert', overdueCnt > 0);
    document.getElementById('cntGoals').textContent = String(openGoals);
    document.getElementById('cntHabits').textContent = habs.length ? `${doneHabs}/${habs.length}` : '0';
    document.getElementById('cntBooks').textContent = String(STATE.books.length);
  }

  function renderOverview() {
    // 1. Просроченные + Дневные
    const overdue = STATE.overduePlans;
    const ovOverdue = document.getElementById('ovOverdueBox');
    if (overdue.length === 0) {
      ovOverdue.innerHTML = '';
    } else {
      ovOverdue.innerHTML = `
        <div class="overdue-box">
          <div class="overdue-head">
            <span>С прошлых дней: ${overdue.length}</span>
            <button type="button" class="btn-link" data-action="move-all-overdue">Перенести на сегодня</button>
          </div>
          ${overdue
            .slice(0, 3)
            .map(
              (o) => `
            <div class="row-item" style="padding:7px 15px;">
              <div class="row-left">
                <button type="button" class="check-btn" data-action="toggle-plan" data-id="${o.id}">✓</button>
                <div class="row-main">
                  <div class="row-title">${escapeHtml(o.title)}</div>
                  <div class="row-sub">от ${formatShortDM(o.plan_date)}</div>
                </div>
              </div>
              <div class="row-right">
                <button type="button" class="badge clickable" data-action="move-today" data-id="${o.id}">На сегодня</button>
              </div>
            </div>`
            )
            .join('')}
        </div>`;
    }

    const daily = STATE.todayPlans;
    const doneDaily = daily.filter((p) => p.is_done).length;
    document.getElementById('ovDailyMeta').textContent = daily.length ? `${doneDaily} из ${daily.length}` : '';
    const ovDaily = document.getElementById('ovDailyList');
    if (daily.length === 0) {
      ovDaily.innerHTML = '<div class="empty-line">На сегодня заданий нет — добавьте строкой ниже</div>';
    } else {
      ovDaily.innerHTML = daily
        .map(
          (p) => `
        <div class="row-item">
          <div class="row-left">
            <button type="button" class="check-btn ${p.is_done ? 'checked' : ''}" data-action="toggle-plan" data-id="${p.id}">✓</button>
            <div class="row-main">
              <div class="row-title ${p.is_done ? 'done' : ''}">${escapeHtml(p.title)}</div>
            </div>
          </div>
          <div class="row-right">
            ${p.remind_time ? `<span class="time-col">${escapeHtml(p.remind_time)}</span>` : ''}
            ${!p.is_done ? `<button type="button" class="btn btn-ghost" data-action="cal-task" data-id="${p.id}" title="Добавить в Календарь iPhone">📅</button>` : ''}
            ${!p.is_done ? `<button type="button" class="btn btn-ghost" data-action="focus-task" data-id="${p.id}" title="Фокус 25 мин">⏱</button>` : ''}
            <button type="button" class="btn btn-ghost" data-action="del-plan" data-id="${p.id}" title="Удалить">×</button>
          </div>
        </div>`
        )
        .join('');
    }

    // 2. Общие планы
    const globals = STATE.globalPlans.filter((g) => !g.is_done);
    const ovGoals = document.getElementById('ovGoalsList');
    if (globals.length === 0) {
      ovGoals.innerHTML = '<div class="empty-line">Глобальных планов пока нет</div>';
    } else {
      ovGoals.innerHTML = globals
        .slice(0, 5)
        .map(
          (g) => `
        <div class="row-item">
          <div class="row-left">
            <button type="button" class="check-btn" data-action="toggle-plan" data-id="${g.id}">✓</button>
            <div class="row-main">
              <div class="row-title">${g.is_priority ? '<span style="color:#f59e0b;margin-right:4px;">★</span>' : ''}${escapeHtml(g.title)}</div>
            </div>
          </div>
          <div class="row-right">
            ${g.category ? `<span class="badge">${escapeHtml(g.category)}</span>` : ''}
            <button type="button" class="badge clickable" data-action="goal-today" data-id="${g.id}">В день</button>
          </div>
        </div>`
        )
        .join('');
    }

    // 3. Привычки
    const habs = STATE.todayHabits.filter((h) => h.scheduled_today);
    const doneHabs = habs.filter((h) => h.log_status === 'done').length;
    document.getElementById('ovHabitsMeta').textContent = habs.length ? `${doneHabs}/${habs.length}` : '';
    const ovHabs = document.getElementById('ovHabitsWrap');
    if (habs.length === 0) {
      ovHabs.innerHTML = '<div class="empty-line">Привычек на сегодня нет</div>';
    } else {
      const chips = habs
        .map((h) => {
          const on = h.log_status === 'done';
          const valPart = h.log_value ? ` · ${escapeHtml(h.log_value)}` : h.target_value ? ` (${escapeHtml(`${h.target_value} ${h.unit}`.trim())})` : '';
          return `<button type="button" class="habit-chip ${on ? 'on' : ''}" data-action="toggle-habit-today" data-id="${h.id}">${on ? '✓' : '○'} ${escapeHtml(h.title)}${valPart}</button>`;
        })
        .join('');
      const valRows = habs
        .filter((h) => h.kind === 'value')
        .map(
          (h) => `
        <div class="habit-val-row">
          <span style="font-size:12.5px; color:var(--text-muted);">${escapeHtml(h.title)}</span>
          <input type="text" class="input habit-val-input" data-habit-id="${h.id}" style="width:110px; padding:5px 8px;" placeholder="${escapeHtml(h.unit || 'значение')}" value="${escapeHtml(h.log_value || '')}" />
        </div>`
        )
        .join('');
      ovHabs.innerHTML = `<div class="habit-chips">${chips}</div>${valRows}`;
    }

    // 4. Книги
    const books = STATE.books;
    const reading = books.filter((b) => b.status === 'reading');
    const planned = books.filter((b) => b.status === 'planned');
    const done = books.filter((b) => b.status === 'done');
    const ovBooks = document.getElementById('ovBooksWrap');
    if (books.length === 0) {
      ovBooks.innerHTML = '<div class="empty-line">Полка книг пуста — добавьте первую книгу</div>';
    } else {
      const readRows = reading
        .slice(0, 2)
        .map(
          (b) => `
        <div class="row-item">
          <div class="row-main">
            <div class="row-title" style="font-weight:600;">${escapeHtml(b.title)}</div>
            <div class="row-sub">${escapeHtml(b.author || 'Автор не указан')}${b.note ? ` · ${escapeHtml(b.note)}` : ''}</div>
          </div>
          <button type="button" class="badge accent clickable" data-action="cycle-book" data-id="${b.id}">Читаю ↻</button>
        </div>`
        )
        .join('');
      const planLine = planned.length
        ? `<div style="font-size:12px; color:var(--text-muted); padding:8px 15px 4px;">В планах (${planned.length}): ${planned.slice(0, 2).map((b) => escapeHtml(b.title)).join(' · ')}</div>`
        : '<div style="font-size:12px; color:var(--text-muted); padding:8px 15px 4px;">В планах: 0</div>';
      const foot = `<div style="font-size:12px; color:var(--text-muted); padding:2px 15px 12px;">Прочитано: <b>${done.length}</b></div>`;
      ovBooks.innerHTML = `${readRows}${planLine}${foot}`;
    }
  }

  function renderDailyView() {
    const overdue = STATE.overduePlans;
    const overdueWrap = document.getElementById('dailyOverdueSection');
    if (overdue.length === 0) {
      overdueWrap.innerHTML = '';
    } else {
      overdueWrap.innerHTML = `
        <div class="card card-mb">
          <div class="overdue-head">
            <span>Незакрытые с прошлых дней (${overdue.length})</span>
            <button type="button" class="btn-link" data-action="move-all-overdue">Перенести все на сегодня</button>
          </div>
          ${overdue
            .map(
              (o) => `
            <div class="row-item">
              <div class="row-left">
                <button type="button" class="check-btn" data-action="toggle-plan" data-id="${o.id}">✓</button>
                <div class="row-main">
                  <div class="row-title">${escapeHtml(o.title)}</div>
                  <div class="row-sub">от ${formatHumanDate(o.plan_date)}${o.remind_time ? ` · ${escapeHtml(o.remind_time)}` : ''}</div>
                </div>
              </div>
              <div class="row-right">
                <button type="button" class="badge clickable" data-action="move-today" data-id="${o.id}">На сегодня</button>
                <button type="button" class="btn btn-ghost" data-action="del-plan" data-id="${o.id}">×</button>
              </div>
            </div>`
            )
            .join('')}
        </div>`;
    }

    const upcoming = STATE.upcomingPlans;
    const groupsWrap = document.getElementById('dailyGroupsSection');
    if (upcoming.length === 0) {
      groupsWrap.innerHTML = '<div class="card"><div class="empty-line">Заданий на сегодня и ближайшие дни пока нет</div></div>';
      return;
    }

    const grouped = {};
    for (const p of upcoming) {
      const d = p.plan_date || STATE.todayStr;
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(p);
    }

    groupsWrap.innerHTML = Object.entries(grouped)
      .map(([dateKey, items]) => {
        const label = dateKey === STATE.todayStr ? `Сегодня · ${formatHumanDate(dateKey)}` : formatHumanDate(dateKey);
        const doneCnt = items.filter((i) => i.is_done).length;
        return `
          <div class="card card-mb">
            <div class="card-head">
              <span class="card-title">${label}</span>
              <span class="card-meta">${doneCnt} из ${items.length}</span>
            </div>
            ${items
              .map(
                (p) => `
              <div class="row-item">
                <div class="row-left">
                  <button type="button" class="check-btn ${p.is_done ? 'checked' : ''}" data-action="toggle-plan" data-id="${p.id}">✓</button>
                  <div class="row-main">
                    <div class="row-title ${p.is_done ? 'done' : ''}">${escapeHtml(p.title)}</div>
                  </div>
                </div>
                <div class="row-right">
                  ${p.remind_time ? `<span class="badge">${escapeHtml(p.remind_time)}</span>` : ''}
                  ${!p.is_done ? `<button type="button" class="btn btn-ghost" data-action="cal-task" data-id="${p.id}" title="В Календарь iPhone">📅</button>` : ''}
                  ${!p.is_done ? `<button type="button" class="btn btn-ghost" data-action="focus-task" data-id="${p.id}" title="Фокус 25 мин">⏱</button>` : ''}
                  <button type="button" class="btn btn-ghost" data-action="del-plan" data-id="${p.id}">×</button>
                </div>
              </div>`
              )
              .join('')}
          </div>`;
      })
      .join('');
  }

  function renderGoalsView() {
    const all = STATE.globalPlans;
    document.getElementById('btnClearDoneGoals').style.display = all.some((g) => g.is_done) ? 'inline-flex' : 'none';
    let list = all;
    if (goalFilter === 'priority') list = all.filter((g) => g.is_priority && !g.is_done);
    else if (goalFilter === 'done') list = all.filter((g) => g.is_done);
    else if (['Учёба', 'Проекты', 'Личное'].includes(goalFilter)) list = all.filter((g) => g.category === goalFilter && !g.is_done);

    const wrap = document.getElementById('goalsListWrap');
    if (list.length === 0) {
      wrap.innerHTML = '<div class="empty-line">В этом фильтре общих планов нет</div>';
      return;
    }
    wrap.innerHTML = list
      .map(
        (g) => `
      <div class="row-item">
        <div class="row-left">
          <button type="button" class="check-btn ${g.is_done ? 'checked' : ''}" data-action="toggle-plan" data-id="${g.id}">✓</button>
          <button type="button" class="star-btn ${g.is_priority ? 'on' : ''}" data-action="toggle-prio" data-id="${g.id}">${g.is_priority ? '★' : '☆'}</button>
          <div class="row-main">
            <div class="row-title ${g.is_done ? 'done' : ''}">${escapeHtml(g.title)}</div>
          </div>
        </div>
        <div class="row-right">
          ${g.category ? `<span class="badge">${escapeHtml(g.category)}</span>` : ''}
          ${!g.is_done ? `<button type="button" class="badge clickable" data-action="goal-today" data-id="${g.id}">В день</button>` : ''}
          <button type="button" class="btn btn-ghost" data-action="del-plan" data-id="${g.id}">×</button>
        </div>
      </div>`
      )
      .join('');
  }

  function renderHabitsView() {
    const grid = STATE.habitsGrid;
    const box = document.getElementById('habitsMatrixCard');
    if (!grid.habits.length) {
      box.innerHTML = '<div class="empty-line">Привычек пока нет — нажмите «+ Новая привычка» сверху</div>';
      return;
    }
    const headerCols = grid.dates.map((d) => `<th>${d.slice(8, 10)}.${d.slice(5, 7)}</th>`).join('');
    const rows = grid.habits
      .map((h) => {
        const cells = h.history
          .map(
            (c) =>
              `<td><button type="button" class="m-cell ${c.status === 'done' ? 'done' : ''}" data-action="toggle-habit-date" data-id="${h.id}" data-date="${c.date}" title="${c.date}">${c.status === 'done' ? '✓' : ''}</button></td>`
          )
          .join('');
        const targetInfo = h.kind === 'value' && (h.target_value || h.unit) ? ` · ${escapeHtml(`${h.target_value} ${h.unit}`.trim())}` : '';
        return `
          <tr>
            <td>
              <div style="font-weight:600; font-size:13px;">${escapeHtml(h.title)}</div>
              <div style="font-size:11px; color:var(--text-muted);">серия ${h.streak} дн.${targetInfo}</div>
            </td>
            ${cells}
            <td><button type="button" class="btn btn-ghost" data-action="del-habit" data-id="${h.id}">×</button></td>
          </tr>`;
      })
      .join('');

    box.innerHTML = `
      <div class="matrix-scroll">
        <table class="matrix-table">
          <thead><tr><th>Привычка</th>${headerCols}<th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderBooksView() {
    const all = STATE.books;
    document.querySelector('[data-bf="all"]').textContent = `Все (${all.length})`;
    document.querySelector('[data-bf="reading"]').textContent = `Читаю (${all.filter((b) => b.status === 'reading').length})`;
    document.querySelector('[data-bf="planned"]').textContent = `В планах (${all.filter((b) => b.status === 'planned').length})`;
    document.querySelector('[data-bf="done"]').textContent = `Прочитано (${all.filter((b) => b.status === 'done').length})`;

    const list = bookFilter === 'all' ? all : all.filter((b) => b.status === bookFilter);
    const wrap = document.getElementById('booksListWrap');
    if (list.length === 0) {
      wrap.innerHTML = '<div class="empty-line">В этом разделе книг пока нет</div>';
      return;
    }

    wrap.innerHTML = list
      .map((b) => {
        const isEdit = editingBookId === b.id;
        const stars = b.rating > 0 ? ` · ${'★'.repeat(b.rating)}` : '';
        const meta = [b.author, b.note].filter(Boolean).map(escapeHtml).join(' · ');
        return `
          <div class="row-item">
            <div class="row-main">
              <div class="row-title ${b.status === 'done' ? 'done' : ''}" style="${b.status !== 'done' ? 'font-weight:600;' : ''}">${escapeHtml(b.title)}</div>
              <div class="row-sub">${meta || 'Без автора и заметок'}${stars}</div>
            </div>
            <div class="row-right">
              <button type="button" class="badge ${b.status === 'reading' ? 'accent' : ''} clickable" data-action="cycle-book" data-id="${b.id}">${bookStatusLabel(b.status)} ↻</button>
              <button type="button" class="btn btn-ghost" data-action="edit-book" data-id="${b.id}">✎</button>
              <button type="button" class="btn btn-ghost" data-action="del-book" data-id="${b.id}">×</button>
            </div>
          </div>
          <div class="book-edit-box ${isEdit ? 'open' : ''}">
            <form class="form-row book-edit-form" data-book-id="${b.id}">
              <input type="text" name="note" class="input" value="${escapeHtml(b.note || '')}" placeholder="Заметка или страница..." />
              <select name="status" class="input" style="flex:0 1 135px;">
                <option value="planned" ${b.status === 'planned' ? 'selected' : ''}>В планах</option>
                <option value="reading" ${b.status === 'reading' ? 'selected' : ''}>Читаю сейчас</option>
                <option value="done" ${b.status === 'done' ? 'selected' : ''}>Прочитана</option>
              </select>
              <select name="rating" class="input" style="flex:0 1 110px;">
                <option value="0" ${b.rating === 0 ? 'selected' : ''}>Без оценки</option>
                <option value="5" ${b.rating === 5 ? 'selected' : ''}>★★★★★</option>
                <option value="4" ${b.rating === 4 ? 'selected' : ''}>★★★★</option>
                <option value="3" ${b.rating === 3 ? 'selected' : ''}>★★★</option>
                <option value="2" ${b.rating === 2 ? 'selected' : ''}>★★</option>
                <option value="1" ${b.rating === 1 ? 'selected' : ''}>★</option>
              </select>
              <button type="submit" class="btn btn-primary" style="flex:0 0 auto;">Сохранить</button>
            </form>
          </div>`;
      })
      .join('');
  }

  // ===== Студия тем и настроек =====
  function openStudio(tab = 'themes') {
    document.getElementById('studioModal').classList.add('open');
    switchStudioTab(tab);
    renderStudioThemes();
    renderStudioSettingsState();
  }

  function closeStudio() {
    document.getElementById('studioModal').classList.remove('open');
  }

  function switchStudioTab(tab) {
    const isThemes = tab === 'themes';
    document.getElementById('stTabBtnThemes').classList.toggle('active', isThemes);
    document.getElementById('stTabBtnSettings').classList.toggle('active', !isThemes);
    document.getElementById('studioPaneThemes').style.display = isThemes ? 'flex' : 'none';
    document.getElementById('studioPaneSettings').style.display = isThemes ? 'none' : 'flex';
  }

  function flashStudioToast(msg = '● Сохранено') {
    const el = document.getElementById('studioToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(global._stToast);
    global._stToast = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function showToast(text, actionsHtml = '') {
    const banner = document.getElementById('guessBanner');
    document.getElementById('guessText').textContent = text;
    document.getElementById('guessActions').innerHTML = actionsHtml;
    banner.classList.add('show');
    if (!actionsHtml) {
      clearTimeout(global._toastTmr);
      global._toastTmr = setTimeout(() => banner.classList.remove('show'), 3200);
    }
  }

  function renderStudioThemes() {
    const grid = document.getElementById('skinsGrid');
    if (!grid) return;
    document.querySelectorAll('#skinFilterBar .seg-pill').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-sc') === UI_PREFS.filterCat);
    });
    const list = UI_PREFS.filterCat === 'all' ? SKINS : SKINS.filter((s) => s.category.includes(UI_PREFS.filterCat));
    grid.innerHTML = list
      .map((s) => {
        const thumb = s.img ? `<img src="${s.img}" alt="${escapeHtml(s.name)}" style="object-position:${s.cropPos || '50% 20%'};" loading="lazy" />` : '<span>Без арта</span>';
        return `
          <div class="skin-card ${s.id === UI_PREFS.skinId ? 'active' : ''}" data-select-skin="${s.id}">
            <div class="skin-thumb">${thumb}</div>
            <div class="skin-info">
              <div style="min-width:0;">
                <div class="skin-name">${escapeHtml(s.name)}</div>
                <div class="skin-sub">${escapeHtml(s.sub)}</div>
              </div>
              <span class="swatch-dot" style="background:${s.colors.pink};"></span>
            </div>
          </div>`;
      })
      .join('');
  }

  function renderStudioSettingsState() {
    if (!STATE) return;
    const s = STATE.settings;
    const sec = STATE.security;

    const fxOn = s.fx_enabled !== '0';
    document.body.classList.toggle('no-fx', !fxOn);
    const btnFx = document.getElementById('stFxBtn');
    btnFx.textContent = fxOn ? '● Вкл' : 'Выкл';
    btnFx.classList.toggle('btn-primary', fxOn);

    const sndOn = s.sound_enabled !== '0';
    const btnSnd = document.getElementById('stSoundBtn');
    btnSnd.textContent = sndOn ? '● Вкл' : 'Выкл';
    btnSnd.classList.toggle('btn-primary', sndOn);

    const pauseOn = s.pause_all === '1';
    const btnP = document.getElementById('stPauseAllBtn');
    btnP.textContent = pauseOn ? '● Включена' : 'Выкл';
    btnP.classList.toggle('btn-primary', pauseOn);

    const pinBtn = document.getElementById('stPinToggleBtn');
    const pinSub = document.getElementById('stPinStatusSub');
    const lockRow = document.getElementById('stAutoLockRow');
    if (sec.pinEnabled) {
      pinBtn.textContent = 'Отключить PIN';
      pinBtn.classList.remove('btn-primary');
      pinSub.textContent = '● Включено шифрование записей (AES-256) и замок при входе';
      lockRow.style.display = 'flex';
    } else {
      pinBtn.textContent = 'Включить PIN';
      pinBtn.classList.add('btn-primary');
      pinSub.textContent = sec.hasCrypto
        ? 'Можно защитить записи 4-значным PIN-кодом с шифрованием'
        : 'Для шифрования откройте приложение по защищённой HTTPS-ссылке';
      lockRow.style.display = 'none';
    }

    document.querySelectorAll('#stAutoLockPills .seg-pill').forEach((b) => {
      b.classList.toggle('active', Number(b.getAttribute('data-lock')) === sec.autoLockSec);
    });

    const bSub = document.getElementById('stBackupStatusSub');
    if (s.last_backup_at) {
      const dt = new Date(s.last_backup_at);
      bSub.textContent = `Последняя копия: ${dt.toLocaleDateString('ru-RU')} ${dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}${sec.pinEnabled ? ' (зашифрована PIN)' : ''}`;
    } else {
      bSub.textContent = sec.pinEnabled
        ? 'Файл копии будет автоматически зашифрован вашим PIN-кодом'
        : 'Рекомендуем сохранять копию в «Файлы» iPhone раз в пару недель';
    }

    const pMeta = document.getElementById('stPrivacyMeta');
    pMeta.textContent = `100% локально на телефоне · Постоянная память: ${sec.persistedStorage ? 'защищена' : 'стандартная'}`;
  }

  // ===== Обновление Service Worker (↻) =====
  function setUpdateSpinning(on) {
    document.getElementById('btnAppUpdate')?.classList.toggle('spinning', on);
    document.getElementById('btnMobAppUpdate')?.classList.toggle('spinning', on);
  }

  async function handleUpdateClick() {
    playUiSound('pop');
    setUpdateSpinning(true);
    try {
      if (swRegistration) {
        await swRegistration.update();
        if (swRegistration.waiting) {
          swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
          showToast('● Найдено обновление — перезагружаю экран...');
          setTimeout(() => global.location.reload(), 600);
          return;
        }
      }
      refreshAndRender();
      showToast('● У вас актуальная версия · Записи в безопасности');
    } catch {
      refreshAndRender();
      showToast('● Автономный режим · Данные на месте');
    } finally {
      setUpdateSpinning(false);
    }
  }

  // ===== Частицы и параллакс =====
  function setupParticlesAndParallax() {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    global.addEventListener('mousemove', (e) => {
      if (document.body.classList.contains('no-fx')) return;
      tx = (e.clientX / (global.innerWidth || 1) - 0.5) * -8;
      ty = (e.clientY / (global.innerHeight || 1) - 0.5) * -6;
    });

    const canvas = document.getElementById('fxCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let W = 0, H = 0;
    const parts = [];
    const COUNT = 18;

    function resize() {
      if (!canvas) return;
      W = canvas.width = global.innerWidth;
      H = canvas.height = global.innerHeight;
    }
    resize();
    global.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      parts.push({
        x: Math.random() * (global.innerWidth || 400),
        y: Math.random() * (global.innerHeight || 800),
        r: 2 + Math.random() * 3,
        vy: 0.25 + Math.random() * 0.42,
        vx: (Math.random() - 0.5) * 0.3,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.015,
        a: 0.22 + Math.random() * 0.34,
      });
    }

    function frame() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      const img = document.getElementById('heroArtImg');
      if (img && !document.body.classList.contains('no-fx')) {
        img.style.setProperty('--px', `${cx.toFixed(2)}px`);
        img.style.setProperty('--py', `${cy.toFixed(2)}px`);
      }

      if (ctx) {
        if (!document.hidden && !document.body.classList.contains('no-fx') && !document.body.classList.contains('app-locked')) {
          const skin = getCurrentSkin();
          ctx.clearRect(0, 0, W, H);
          if (skin.id !== 'strict-minimal') {
            const isSakura = skin.id === 'terrorblade-sakura' || skin.id === 'chocola-maid';
            const isSpark = ['ellen-zzz', 'cyber-rave-miku', 'gothic-miku-feathers', 'vergil-yamato', 'pink-poker-cards', 'cc-code-geass'].includes(skin.id);
            ctx.fillStyle = skin.colors.pink || '#e11d74';
            for (const p of parts) {
              p.y += isSpark ? -p.vy * 0.75 : p.vy;
              p.x += p.vx + Math.sin(p.y * 0.012) * 0.16;
              p.rot += p.vr;
              if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
              if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
              if (p.x > W + 10) p.x = -10;
              if (p.x < -10) p.x = W + 10;
              ctx.save();
              ctx.globalAlpha = p.a;
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rot);
              if (isSakura) {
                ctx.beginPath();
                ctx.ellipse(0, 0, p.r * 1.4, p.r * 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
              } else if (isSpark) {
                ctx.fillRect(-p.r * 0.7, -p.r * 0.7, p.r * 1.4, p.r * 1.4);
              } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.r * 0.75, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }
          }
        } else {
          ctx.clearRect(0, 0, W, H);
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function setupIosInstallBanner() {
    const ua = navigator.userAgent || '';
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isStandalone = Boolean(navigator.standalone || global.matchMedia?.('(display-mode: standalone)').matches);
    const dismissed = localStorage.getItem('helptool_ios_install_dismissed') === '1';
    if (isIos && !isStandalone && !dismissed) {
      document.getElementById('iosInstallBanner')?.classList.add('show');
    }
  }

  // ===== Подписка на все события (чистое делегирование, 0 inline JS) =====
  function bindEvents() {
    // Навигация
    document.querySelectorAll('.side-btn[data-view], .mob-nav-btn[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.getAttribute('data-view')));
    });

    document.querySelectorAll('[data-jump-view]').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.getAttribute('data-jump-view')));
    });

    // Карточка темы, чибик, кнопки шапки
    document.getElementById('sideAnimeCard')?.addEventListener('click', () => openStudio('themes'));
    document.getElementById('mobAvatarBtn')?.addEventListener('click', () => openStudio('themes'));
    document.getElementById('btnMobThemes')?.addEventListener('click', () => openStudio('themes'));
    document.getElementById('topSkinBtn')?.addEventListener('click', () => openStudio('themes'));
    document.getElementById('btnOpenSettingsSide')?.addEventListener('click', () => openStudio('settings'));
    document.getElementById('btnMobSettings')?.addEventListener('click', () => openStudio('settings'));
    document.getElementById('btnSecurityPill')?.addEventListener('click', () => openStudio('settings'));

    document.getElementById('btnSkinPrev')?.addEventListener('click', () => stepSkin(-1));
    document.getElementById('btnSkinNext')?.addEventListener('click', () => stepSkin(1));
    document.getElementById('btnAppUpdate')?.addEventListener('click', handleUpdateClick);
    document.getElementById('btnMobAppUpdate')?.addEventListener('click', handleUpdateClick);
    document.getElementById('stCheckUpdateBtn')?.addEventListener('click', () => { closeStudio(); handleUpdateClick(); });

    document.getElementById('btnMobLock')?.addEventListener('click', lockAppManually);
    document.getElementById('btnTopLock')?.addEventListener('click', lockAppManually);

    document.getElementById('heroQuote')?.addEventListener('click', () => {
      liveReactionText = '';
      liveReactionMood = 'happy';
      quoteIdx++;
      playUiSound('chibi');
      renderHeroArt();
      clearTimeout(reactionResetTimer);
      reactionResetTimer = setTimeout(() => {
        liveReactionMood = '';
        renderHeroArt();
      }, 650);
    });

    document.getElementById('focusPauseBtn')?.addEventListener('click', toggleFocusPause);
    document.getElementById('focusStopBtn')?.addEventListener('click', stopFocusTimer);

    // Быстрый ввод
    const toggleQuick = (force) => {
      const box = document.getElementById('quickDrawer');
      const next = typeof force === 'boolean' ? force : !box.classList.contains('open');
      if (next) playUiSound('tap');
      box.classList.toggle('open', next);
      if (next) setTimeout(() => document.getElementById('quickInput')?.focus(), 50);
    };
    document.getElementById('btnQuickToggle')?.addEventListener('click', () => toggleQuick());
    document.getElementById('btnQuickClose')?.addEventListener('click', () => toggleQuick(false));
    document.getElementById('btnHideToast')?.addEventListener('click', () => {
      document.getElementById('guessBanner').classList.remove('show');
    });
    document.getElementById('btnDismissInstall')?.addEventListener('click', () => {
      localStorage.setItem('helptool_ios_install_dismissed', '1');
      document.getElementById('iosInstallBanner').classList.remove('show');
    });

    document.getElementById('quickForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('quickInput');
      const text = input.value.trim();
      if (!text) return;
      const out = await Storage.quickCapture(text);
      input.value = '';
      toggleQuick(false);
      playUiSound('pop');
      const ev = out.event;
      const targets = [
        { key: 'plan_today', label: 'Задание · Сегодня' },
        { key: 'plan_tomorrow', label: 'Задание · Завтра' },
        { key: 'plan_global', label: 'Общий план' },
        { key: 'book_planned', label: 'В книги' },
      ].filter((t) => t.key !== ev.guessed_type);
      const actionsHtml =
        targets.map((t) => `<button type="button" class="btn" style="padding:4px 9px;font-size:11.5px;" data-reclass="${ev.id}" data-type="${t.key}">${t.label}</button>`).join('') +
        `<button type="button" class="btn btn-ghost" data-reclass="${ev.id}" data-type="delete">Удалить</button>`;
      showToast(`● ${out.summary}`, actionsHtml);
      refreshAndRender();
    });

    // Формы добавления
    document.getElementById('ovDailyForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleEl = document.getElementById('ovDailyInput');
      const timeEl = document.getElementById('ovDailyTime');
      if (!titleEl.value.trim()) return;
      await Storage.addPlan({
        title: titleEl.value,
        list_type: 'dated',
        plan_date: STATE.todayStr,
        remind_time: timeEl.value || '',
      });
      titleEl.value = '';
      timeEl.value = '';
      playUiSound('pop');
      refreshAndRender();
    });

    document.getElementById('dailyAddForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('dailyTitle').value.trim();
      if (!title) return;
      await Storage.addPlan({
        title,
        list_type: 'dated',
        plan_date: document.getElementById('dailyDate').value || STATE.todayStr,
        remind_time: document.getElementById('dailyTime').value || '',
      });
      document.getElementById('dailyTitle').value = '';
      document.getElementById('dailyTime').value = '';
      playUiSound('pop');
      refreshAndRender();
    });

    document.getElementById('goalAddForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('goalTitle').value.trim();
      if (!title) return;
      await Storage.addPlan({
        title,
        list_type: 'global',
        category: document.getElementById('goalCategory').value || '',
        is_priority: document.getElementById('goalPriority').checked ? 1 : 0,
      });
      document.getElementById('goalTitle').value = '';
      document.getElementById('goalPriority').checked = false;
      playUiSound('pop');
      refreshAndRender();
    });

    document.getElementById('btnClearDoneGoals')?.addEventListener('click', async () => {
      await Storage.clearDoneGlobals();
      playUiSound('tap');
      refreshAndRender();
    });

    document.getElementById('btnToggleAddHabit')?.addEventListener('click', () => {
      document.getElementById('panelAddHabit').classList.toggle('open');
      playUiSound('tap');
    });

    document.getElementById('habKind')?.addEventListener('change', (e) => {
      document.getElementById('habValueFields').style.display = e.target.value === 'value' ? 'flex' : 'none';
    });

    document.getElementById('habWeekdays')?.addEventListener('click', (e) => {
      const pill = e.target.closest('.wd-pill');
      if (pill) pill.classList.toggle('on');
    });

    document.getElementById('habitAddForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('habTitle').value.trim();
      if (!title) return;
      const days = [...document.querySelectorAll('#habWeekdays .wd-pill.on')].map((x) => x.getAttribute('data-d')).join(',');
      await Storage.addHabit({
        title,
        kind: document.getElementById('habKind').value,
        target_value: document.getElementById('habTarget').value,
        unit: document.getElementById('habUnit').value,
        days_mask: days || '1,2,3,4,5,6,7',
      });
      document.getElementById('habTitle').value = '';
      document.getElementById('habTarget').value = '';
      document.getElementById('habUnit').value = '';
      document.getElementById('panelAddHabit').classList.remove('open');
      playUiSound('pop');
      refreshAndRender();
    });

    document.getElementById('bookAddForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('bookTitle').value.trim();
      if (!title) return;
      await Storage.addBook({
        title,
        author: document.getElementById('bookAuthor').value,
        status: document.getElementById('bookStatus').value,
        note: document.getElementById('bookNote').value,
        rating: Number(document.getElementById('bookRating').value) || 0,
      });
      document.getElementById('bookTitle').value = '';
      document.getElementById('bookAuthor').value = '';
      document.getElementById('bookNote').value = '';
      document.getElementById('bookRating').value = '0';
      playUiSound('pop');
      refreshAndRender();
    });

    // Фильтры планов и книг
    document.getElementById('goalFiltersBar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-gf]');
      if (!btn) return;
      goalFilter = btn.getAttribute('data-gf');
      document.querySelectorAll('#goalFiltersBar .seg-pill').forEach((b) => b.classList.toggle('active', b === btn));
      playUiSound('tap');
      renderGoalsView();
    });

    document.getElementById('bookFiltersBar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-bf]');
      if (!btn) return;
      bookFilter = btn.getAttribute('data-bf');
      document.querySelectorAll('#bookFiltersBar .seg-pill').forEach((b) => b.classList.toggle('active', b === btn));
      playUiSound('tap');
      renderBooksView();
    });

    // Студия
    document.getElementById('studioModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'studioModal') closeStudio();
    });
    document.getElementById('btnCloseStudio')?.addEventListener('click', closeStudio);
    document.getElementById('stTabBtnThemes')?.addEventListener('click', () => switchStudioTab('themes'));
    document.getElementById('stTabBtnSettings')?.addEventListener('click', () => switchStudioTab('settings'));
    document.getElementById('skinFilterBar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sc]');
      if (!btn) return;
      UI_PREFS.filterCat = btn.getAttribute('data-sc');
      renderStudioThemes();
    });
    document.getElementById('skinsGrid')?.addEventListener('click', (e) => {
      const card = e.target.closest('[data-select-skin]');
      if (!card) return;
      UI_PREFS.skinId = card.getAttribute('data-select-skin');
      quoteIdx = 0;
      playUiSound('chibi');
      saveUiPrefs();
      applyCurrentSkin();
      flashStudioToast('● Тема применена');
    });

    // Тумблеры настроек и защита PIN
    document.getElementById('stFxBtn')?.addEventListener('click', async () => {
      const next = STATE.settings.fx_enabled === '0' ? '1' : '0';
      await Storage.updateSetting('fx_enabled', next);
      playUiSound('tap');
      refreshAndRender();
      flashStudioToast();
    });

    document.getElementById('stSoundBtn')?.addEventListener('click', async () => {
      const next = STATE.settings.sound_enabled === '0' ? '1' : '0';
      await Storage.updateSetting('sound_enabled', next);
      refreshAndRender();
      if (next === '1') playUiSound('done');
      flashStudioToast();
    });

    document.getElementById('stPauseAllBtn')?.addEventListener('click', async () => {
      const next = STATE.settings.pause_all === '1' ? '0' : '1';
      await Storage.updateSetting('pause_all', next);
      playUiSound('tap');
      refreshAndRender();
      flashStudioToast();
    });

    document.getElementById('stPinToggleBtn')?.addEventListener('click', () => {
      if (!Crypto.hasWebCrypto()) {
        flashStudioToast('× Нужен HTTPS-адрес');
        return;
      }
      if (STATE.security.pinEnabled) {
        openPinModal('disable');
      } else {
        openPinModal('setup1', { length: 4 });
      }
    });

    document.getElementById('stAutoLockPills')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-lock]');
      if (!btn) return;
      await Storage.updateAutoLockSec(Number(btn.getAttribute('data-lock')));
      playUiSound('tap');
      refreshAndRender();
      flashStudioToast('● Таймер блокировки сохранён');
    });

    // Резервные копии
    document.getElementById('btnExportBackup')?.addEventListener('click', async () => {
      if (STATE.security.pinEnabled) {
        openPinModal('export_pin');
      } else {
        const obj = await Storage.exportBackupObject();
        triggerJsonDownload(obj, `helptool-backup-${STATE.todayStr}.json`);
        playUiSound('done');
        refreshAndRender();
        flashStudioToast('● Резервная копия сохранена');
      }
    });

    document.getElementById('btnImportBackup')?.addEventListener('click', () => {
      document.getElementById('importFileInput').click();
    });

    document.getElementById('importFileInput')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      try {
        const text = await file.text();
        const obj = JSON.parse(text);
        const res = await Storage.importBackupObject(obj);
        if (res && res.needsPin) {
          openPinModal('import_pin', { importObj: obj });
          return;
        }
        playUiSound('done');
        refreshAndRender();
        flashStudioToast('● Данные восстановлены');
      } catch (err) {
        flashStudioToast(`× ${err.message || 'Ошибка чтения файла'}`);
      }
    });

    document.getElementById('btnWipeAll')?.addEventListener('click', async () => {
      if (!global.confirm('Удалить все задачи, привычки, книги и настройки PIN на этом устройстве?')) return;
      await Storage.wipeAllData();
      closeStudio();
      refreshAndRender();
      showToast('● Все локальные данные очищены');
    });

    // Клавиатура PIN-экрана
    document.getElementById('lockNumpad')?.addEventListener('click', (e) => {
      const keyBtn = e.target.closest('[data-pin-key]');
      if (keyBtn) {
        handlePinInputKey(keyBtn.getAttribute('data-pin-key'));
      }
    });

    document.getElementById('btnPinCancelOrReset')?.addEventListener('click', async () => {
      if (pinFlow.mode === 'unlock') {
        if (global.confirm('Забыли PIN? Поскольку записи зашифрованы, восстановить их без PIN невозможно. Сбросить все данные на этом iPhone?')) {
          await Storage.wipeAllData();
          closePinModal();
          refreshAndRender();
          showToast('● Хранилище сброшено');
        }
      } else {
        closePinModal();
      }
    });

    // Делегирование кликов по динамическим спискам и тостам
    document.addEventListener('click', async (e) => {
      const reclassBtn = e.target.closest('[data-reclass]');
      if (reclassBtn) {
        await Storage.reclassifyEvent(Number(reclassBtn.getAttribute('data-reclass')), reclassBtn.getAttribute('data-type'));
        document.getElementById('guessBanner').classList.remove('show');
        playUiSound('tap');
        refreshAndRender();
        return;
      }

      const btn = e.target.closest('[data-action]');
      if (!btn || !STATE) return;
      const action = btn.getAttribute('data-action');
      const id = Number(btn.getAttribute('data-id') || 0);

      if (action === 'toggle-plan') {
        const item = await Storage.togglePlan(id);
        if (item && item.is_done) {
          playUiSound('done');
          triggerCharacterReaction('task_done', item.title);
        } else {
          playUiSound('pop');
        }
        refreshAndRender();
      } else if (action === 'toggle-prio') {
        await Storage.togglePlanPriority(id);
        playUiSound('tap');
        refreshAndRender();
      } else if (action === 'move-today') {
        await Storage.movePlanToday(id);
        playUiSound('pop');
        showToast('● Перенесено на сегодня');
        refreshAndRender();
      } else if (action === 'move-all-overdue') {
        const cnt = await Storage.moveAllOverdueToday();
        playUiSound('pop');
        showToast(`● Перенесено на сегодня: ${cnt}`);
        refreshAndRender();
      } else if (action === 'goal-today') {
        await Storage.takeGoalToToday(id);
        playUiSound('pop');
        showToast('● Добавлено в дневные задания на сегодня');
        refreshAndRender();
      } else if (action === 'del-plan') {
        await Storage.deletePlan(id);
        playUiSound('tap');
        refreshAndRender();
      } else if (action === 'focus-task') {
        const all = [...STATE.todayPlans, ...STATE.overduePlans, ...STATE.globalPlans];
        const found = all.find((x) => x.id === id);
        startFocusTimer(found ? found.title : 'Фокус');
      } else if (action === 'cal-task') {
        const all = [...STATE.todayPlans, ...STATE.upcomingPlans, ...STATE.overduePlans];
        const found = all.find((x) => x.id === id);
        if (found) {
          Calendar.exportTaskToCalendar(found);
          playUiSound('pop');
          showToast('● Файл события для Календаря iPhone готов');
        }
      } else if (action === 'toggle-habit-today') {
        const res = await Storage.toggleHabit(id, STATE.todayStr);
        if (res.status === 'done') {
          playUiSound('done');
          triggerCharacterReaction('habit_done');
        } else {
          playUiSound('pop');
        }
        refreshAndRender();
      } else if (action === 'toggle-habit-date') {
        await Storage.toggleHabit(id, btn.getAttribute('data-date'));
        playUiSound('pop');
        refreshAndRender();
      } else if (action === 'del-habit') {
        await Storage.deleteHabit(id);
        playUiSound('tap');
        refreshAndRender();
      } else if (action === 'cycle-book') {
        const b = await Storage.cycleBookStatus(id);
        if (b && b.status === 'done') {
          playUiSound('done');
          triggerCharacterReaction('book_done', b.title);
        } else {
          playUiSound('pop');
        }
        refreshAndRender();
      } else if (action === 'edit-book') {
        editingBookId = editingBookId === id ? null : id;
        renderBooksView();
      } else if (action === 'del-book') {
        if (editingBookId === id) editingBookId = null;
        await Storage.deleteBook(id);
        playUiSound('tap');
        refreshAndRender();
      }
    });

    // Сохранение числовых привычек и редактирования книг
    document.addEventListener('change', async (e) => {
      const inp = e.target.closest('.habit-val-input');
      if (inp && STATE) {
        await Storage.setHabitValue(Number(inp.getAttribute('data-habit-id')), STATE.todayStr, inp.value);
        playUiSound('pop');
        refreshAndRender();
      }
    });

    document.addEventListener('submit', async (e) => {
      const form = e.target.closest('.book-edit-form');
      if (!form) return;
      e.preventDefault();
      const id = Number(form.getAttribute('data-book-id'));
      await Storage.updateBook(id, {
        note: form.elements.note.value,
        status: form.elements.status.value,
        rating: Number(form.elements.rating.value) || 0,
      });
      editingBookId = null;
      playUiSound('pop');
      refreshAndRender();
    });

    // Горячие клавиши + ввод PIN с клавиатуры
    document.addEventListener('keydown', (e) => {
      if (pinFlow.mode) {
        if (/^\d$/.test(e.key)) {
          e.preventDefault();
          handlePinInputKey(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          handlePinInputKey('back');
        } else if (e.key === 'Escape' && pinFlow.mode !== 'unlock') {
          closePinModal();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault();
        toggleQuick();
      } else if (e.key === 'Escape') {
        closeStudio();
        toggleQuick(false);
      }
    });

    // Автоблокировка при сворачивании iPhone + пересчёт таймера фокуса
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (focusState.running) tickFocusTimer();
      const meta = Crypto.loadPinMeta();
      if (meta && meta.enabled && !pinFlow.mode && hiddenAt > 0) {
        const elapsedSec = (Date.now() - hiddenAt) / 1000;
        const limitSec = Number(meta.autoLockSec ?? 60);
        if (elapsedSec >= limitSec) {
          lockAppManually();
        }
      }
      hiddenAt = 0;
    });
  }

  function stepSkin(delta) {
    const idx = SKINS.findIndex((s) => s.id === UI_PREFS.skinId);
    const next = (idx + delta + SKINS.length) % SKINS.length;
    UI_PREFS.skinId = SKINS[next].id;
    quoteIdx = 0;
    playUiSound('chibi');
    saveUiPrefs();
    applyCurrentSkin();
  }

  // ===== Инициализация приложения =====
  async function boot() {
    loadUiPrefs();
    bindEvents();
    setupParticlesAndParallax();
    setupIosInstallBanner();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          swRegistration = reg;
        })
        .catch(() => {});
    }

    const initRes = await Storage.initStorage();
    if (initRes.locked) {
      openPinModal('unlock');
    } else {
      refreshAndRender();
    }
  }

  boot();
})(window);
