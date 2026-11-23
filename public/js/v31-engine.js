// ============================================================================
// HelpTool v3.1 — Универсальный модуль:
// 1. Живое перемещение плашек (Bento Drag & Drop) + ширина (1 кол. / вся ширина) + сворачивание
// 2. 6 глубоких ролей + Конструктор своих ролей
// 3. Событийный пружинный моушен-дизайн (FLIP-физика, магнитный индикатор меню, световой импульс, 0% в покое)
// 4. Защита и приватность (режим «Скрыть записи» 👁 / Alt+P, PIN-защита на ПК, безопасные бэкапы)
// ============================================================================
(function (global) {
  'use strict';

  const LS_LAYOUT_KEY = 'helptool_v31_layout_cfg';
  const LS_SEEN_RELEASE_KEY = 'helptool_seen_release_ver';
  const CURRENT_RELEASE_VERSION = '3.1.1';
  const CURRENT_RELEASE_TITLE = 'Обновление 3.1.1 установлено';
  const CURRENT_RELEASE_NOTES = 'HD-ремастер новых тем (1600p) · Полностью обновлён словарь разделов и ролей · Автоматические уведомления о новых версиях · Перемещение плашек (⋮⋮) и 6 ролей';

  // 6 глубоких ролей с приоритетами плашек, шириной и названиями разделов
  const V31_ROLES = {
    study: {
      id: 'study',
      icon: '🚀',
      title: 'Поток и развитие',
      sub: 'Почасовой график блоков и встреч, задачи на день, проекты, привычки и книги',
      quickHint: 'Например: «завтра 14:00 созвон по проекту», «общий план: портфолио», «книга Мастер и Маргарита»',
      cardOrder: ['lessons', 'daily', 'goals', 'habits', 'books'],
      cardSpans: { books: 2 },
      sections: {
        lessons: { enabled: true,  title: 'График и слоты',    navTitle: 'График и слоты',    mobTitle: 'График' },
        daily:   { enabled: true,  title: 'Дневные задания',   navTitle: 'Дневные задания',   mobTitle: 'Задания' },
        goals:   { enabled: true,  title: 'Общие планы',       navTitle: 'Общие планы',       mobTitle: 'Планы' },
        habits:  { enabled: true,  title: 'База привычек',     navTitle: 'База привычек',     mobTitle: 'Привычки' },
        books:   { enabled: true,  title: 'Книги и материалы', navTitle: 'Книги',             mobTitle: 'Книги' },
      },
      categories: ['Проекты', 'Работа', 'Развитие', 'Личное'],
    },
    work: {
      id: 'work',
      icon: '💼',
      title: 'Работа и проекты',
      sub: 'Тайм-слоты и созвоны, задачи дня во всю ширину, спринты и база знаний',
      quickHint: 'Например: «в 15:00 созвон по релизу», «общий план: запуск продукта», «книга Чистый код»',
      cardOrder: ['daily', 'lessons', 'goals', 'habits', 'books'],
      cardSpans: { daily: 2 },
      sections: {
        lessons: { enabled: true,  title: 'Созвоны и тайм-слоты', navTitle: 'Рабочий график',   mobTitle: 'График' },
        daily:   { enabled: true,  title: 'Задачи по дням',       navTitle: 'Задачи по дням',   mobTitle: 'Задачи' },
        goals:   { enabled: true,  title: 'Проекты и спринты',    navTitle: 'Проекты и цели',   mobTitle: 'Проекты' },
        habits:  { enabled: true,  title: 'Рабочие привычки',     navTitle: 'Рабочие привычки', mobTitle: 'Привычки' },
        books:   { enabled: true,  title: 'База знаний и книги',  navTitle: 'База знаний',      mobTitle: 'База' },
      },
      categories: ['Работа', 'Созвоны', 'Срочно', 'Проекты', 'Личное'],
    },
    creator: {
      id: 'creator',
      icon: '🎨',
      title: 'Фриланс и креатив',
      sub: 'Клиенты и контент-план на первом месте, дедлайны, съёмки и референсы',
      quickHint: 'Например: «к пятнице 18:00 сдать обложку», «общий план: шоурил», «книга Кради как художник»',
      cardOrder: ['goals', 'daily', 'books', 'habits', 'lessons'],
      cardSpans: { goals: 2 },
      sections: {
        lessons: { enabled: true,  title: 'Слоты и съёмки',       navTitle: 'Слоты и съёмки',    mobTitle: 'Слоты' },
        daily:   { enabled: true,  title: 'Дедлайны дня',         navTitle: 'Дедлайны дня',      mobTitle: 'Дедлайны' },
        goals:   { enabled: true,  title: 'Клиенты и контент',    navTitle: 'Клиенты и контент', mobTitle: 'Контент' },
        habits:  { enabled: true,  title: 'Ритм и привычки',      navTitle: 'Ритм и привычки',   mobTitle: 'Ритм' },
        books:   { enabled: true,  title: 'Референсы и медиа',    navTitle: 'Референсы',         mobTitle: 'Медиа' },
      },
      categories: ['Клиенты', 'Контент', 'Дизайн', 'Монтаж', 'Идеи'],
    },
    sport: {
      id: 'sport',
      icon: '💪',
      title: 'Спорт и дисциплина',
      sub: 'Трекер дисциплины во всю ширину, расписание тренировок по дням и режим',
      quickHint: 'Например: «в 18:30 тренировка спины», «общий план: жим 100 кг»',
      cardOrder: ['habits', 'lessons', 'daily', 'goals', 'books'],
      cardSpans: { habits: 2 },
      sections: {
        lessons: { enabled: true,  title: 'План тренировок',      navTitle: 'План тренировок',   mobTitle: 'Тренировки' },
        daily:   { enabled: true,  title: 'Режим на сегодня',     navTitle: 'Режим дня',         mobTitle: 'Режим' },
        goals:   { enabled: true,  title: 'Спортивные цели',      navTitle: 'Спортивные цели',   mobTitle: 'Цели' },
        habits:  { enabled: true,  title: 'Трекер дисциплины',    navTitle: 'Дисциплина',        mobTitle: 'Трекер' },
        books:   { enabled: true,  title: 'Статьи и разборы',     navTitle: 'Статьи и база',     mobTitle: 'База' },
      },
      categories: ['Тренировка', 'Питание', 'Восстановление', 'Замеры', 'База'],
    },
    life: {
      id: 'life',
      icon: '🏠',
      title: 'Личная жизнь и дом',
      sub: 'Без почасового графика: домашние дела, покупки, финансы, фильмы и книги',
      quickHint: 'Например: «в 19:00 купить кофе и продукты», «общий план: отпуск», «книга Дюна»',
      cardOrder: ['daily', 'goals', 'habits', 'books', 'lessons'],
      cardSpans: {},
      sections: {
        lessons: { enabled: false, title: 'График недели',        navTitle: 'График недели',     mobTitle: 'График' },
        daily:   { enabled: true,  title: 'Дела на сегодня',      navTitle: 'Дела на сегодня',   mobTitle: 'Дела' },
        goals:   { enabled: true,  title: 'Покупки и планы',      navTitle: 'Покупки и планы',   mobTitle: 'Планы' },
        habits:  { enabled: true,  title: 'Привычки и уют',       navTitle: 'Привычки и уют',    mobTitle: 'Привычки' },
        books:   { enabled: true,  title: 'Фильмы, игры и книги', navTitle: 'Фильмы и книги',    mobTitle: 'Полка' },
      },
      categories: ['Дом', 'Покупки', 'Финансы', 'Отдых', 'Семья'],
    },
    custom: {
      id: 'custom',
      icon: '⚡',
      title: 'Свободный режим',
      sub: 'Чистый универсальный набор: настройте любые разделы, категории и плашки под себя',
      quickHint: 'Например: «в 17:00 задача», «общий план: идея», «книга название»',
      cardOrder: ['daily', 'goals', 'habits', 'books', 'lessons'],
      cardSpans: {},
      sections: {
        lessons: { enabled: false, title: 'График недели',   navTitle: 'График недели',   mobTitle: 'График' },
        daily:   { enabled: true,  title: 'Дневные задания', navTitle: 'Дневные задания', mobTitle: 'Задания' },
        goals:   { enabled: true,  title: 'Общие планы',     navTitle: 'Общие планы',     mobTitle: 'Планы' },
        habits:  { enabled: true,  title: 'База привычек',   navTitle: 'База привычек',   mobTitle: 'Привычки' },
        books:   { enabled: true,  title: 'Книги',           navTitle: 'Книги',           mobTitle: 'Книги' },
      },
      categories: ['Работа', 'Проекты', 'Спорт', 'Личное'],
    },
  };

  const DEFAULT_LAYOUT = () => ({
    cardOrder: ['lessons', 'daily', 'goals', 'habits', 'books'],
    cardSpans: {}, // { daily: 2, ... }
    collapsedCards: {}, // { books: true }
    navOrder: ['overview', 'lessons', 'daily', 'goals', 'habits', 'books'],
    sidebarPos: 'left', // 'left' | 'right'
    quoteMode: 'normal', // 'normal' | 'reversed' | 'hidden'
    layoutLocked: false,
    privacyBlur: false,
    customRoles: [], // [{ id, icon, title, sub, sections, categories, cardOrder, cardSpans }]
  });

  let LAYOUT_CFG = DEFAULT_LAYOUT();
  let lastSyncedLayoutRaw = '';
  let activeDragCardId = '';
  let activeDragNavKey = '';
  let prevCounters = {};

  function isMotionAllowed() {
    return !document.body.classList.contains('no-fx') && !document.body.classList.contains('eco-mode');
  }

  function getBridge() {
    if (global.HelpAppBridge) return global.HelpAppBridge;
    // Прямой мост для Windows-версии (public/index.html)
    return {
      isDesktopApp: true,
      getProfilePresets: () => (typeof PROFILE_PRESETS !== 'undefined' ? PROFILE_PRESETS : V31_ROLES),
      getProfileConfig: () => (typeof PROFILE_CONFIG !== 'undefined' ? PROFILE_CONFIG : V31_ROLES.study),
      setProfileConfig: (cfg) => {
        if (typeof PROFILE_CONFIG !== 'undefined') PROFILE_CONFIG = cfg;
      },
      persistProfileConfig: async () => {
        if (typeof persistProfileConfig === 'function') await persistProfileConfig();
      },
      renderStudioProfilePane: () => {
        if (typeof renderStudioProfilePane === 'function') renderStudioProfilePane();
      },
      getSettings: () => (typeof STATE !== 'undefined' && STATE.settings ? STATE.settings : {}),
      saveSetting: async (key, val) => {
        if (typeof STATE !== 'undefined' && STATE.settings) STATE.settings[key] = val;
        if (typeof api === 'function') {
          await api('/api/settings', { [key]: val });
        }
      },
      playSound: (t) => {
        if (typeof playUiSound === 'function') playUiSound(t);
      },
      toastStudio: (msg) => {
        if (typeof flashStudioToast === 'function') flashStudioToast(msg);
      },
      toastMain: (msg) => {
        if (typeof showToast === 'function') showToast(msg);
      },
      reloadState: async () => {
        if (typeof loadState === 'function') await loadState(true, false);
      },
    };
  }

  function escapeStr(str = '') {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Расширяем глобальный словарь PROFILE_PRESETS всеми 6 ролями
  function upgradePresetsRegistry() {
    const bridge = getBridge();
    const presets = bridge.getProfilePresets();
    if (presets) {
      for (const [k, v] of Object.entries(V31_ROLES)) {
        presets[k] = JSON.parse(JSON.stringify(v));
      }
      for (const cr of LAYOUT_CFG.customRoles || []) {
        if (cr && cr.id) {
          presets[cr.id] = JSON.parse(JSON.stringify(cr));
        }
      }
    }
  }

  function normalizeLayoutConfig(raw) {
    const base = DEFAULT_LAYOUT();
    if (!raw || typeof raw !== 'object') return base;
    if (Array.isArray(raw.cardOrder) && raw.cardOrder.length) {
      const valid = ['lessons', 'daily', 'goals', 'habits', 'books'];
      const cleaned = raw.cardOrder.filter((k) => valid.includes(k));
      for (const k of valid) {
        if (!cleaned.includes(k)) cleaned.push(k);
      }
      base.cardOrder = cleaned;
    }
    if (raw.cardSpans && typeof raw.cardSpans === 'object') {
      base.cardSpans = { ...raw.cardSpans };
    }
    if (raw.collapsedCards && typeof raw.collapsedCards === 'object') {
      base.collapsedCards = { ...raw.collapsedCards };
    }
    if (Array.isArray(raw.navOrder) && raw.navOrder.length) {
      const validNav = ['overview', 'lessons', 'daily', 'goals', 'habits', 'books'];
      const cleanedNav = raw.navOrder.filter((k) => validNav.includes(k));
      for (const k of validNav) {
        if (!cleanedNav.includes(k)) cleanedNav.push(k);
      }
      base.navOrder = cleanedNav;
    }
    base.sidebarPos = raw.sidebarPos === 'right' ? 'right' : 'left';
    base.quoteMode = ['normal', 'reversed', 'hidden'].includes(raw.quoteMode) ? raw.quoteMode : 'normal';
    base.layoutLocked = Boolean(raw.layoutLocked);
    base.privacyBlur = Boolean(raw.privacyBlur);
    if (Array.isArray(raw.customRoles)) {
      base.customRoles = raw.customRoles.filter((r) => r && r.id && r.title);
    }
    return base;
  }

  function loadLayoutLocal() {
    try {
      const raw = localStorage.getItem(LS_LAYOUT_KEY);
      if (raw) {
        LAYOUT_CFG = normalizeLayoutConfig(JSON.parse(raw));
        lastSyncedLayoutRaw = raw;
      }
    } catch {}
    upgradePresetsRegistry();
  }

  function syncLayoutFromSettings() {
    const s = getBridge().getSettings();
    const raw = s && s.layout_config_json;
    if (!raw || raw === lastSyncedLayoutRaw) return;
    try {
      lastSyncedLayoutRaw = raw;
      LAYOUT_CFG = normalizeLayoutConfig(JSON.parse(raw));
      localStorage.setItem(LS_LAYOUT_KEY, raw);
      upgradePresetsRegistry();
      applyLayoutToDom(false);
    } catch {}
  }

  async function persistLayoutConfig(toastMsg = '') {
    const json = JSON.stringify(LAYOUT_CFG);
    lastSyncedLayoutRaw = json;
    try {
      localStorage.setItem(LS_LAYOUT_KEY, json);
    } catch {}
    upgradePresetsRegistry();
    applyLayoutToDom(false);
    if (toastMsg) getBridge().toastStudio(toastMsg);
    try {
      await getBridge().saveSetting('layout_config_json', json);
    } catch {}
  }

  // ===== 1. FLIP-ДВИЖОК ПРУЖИННОЙ ФИЗИКИ (0% НАГРУЗКИ В ПОКОЕ) =====
  function animateBentoFlip(domMutateFn) {
    const grid = document.querySelector('#view-overview .bento-grid');
    if (!grid || !isMotionAllowed()) {
      domMutateFn();
      return;
    }
    const cards = Array.from(grid.querySelectorAll(':scope > .card')).filter(
      (c) => c.offsetParent !== null
    );
    const firstRects = new Map();
    for (const c of cards) {
      firstRects.set(c, c.getBoundingClientRect());
    }

    domMutateFn();

    for (const c of cards) {
      const first = firstRects.get(c);
      if (!first) continue;
      const last = c.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;

      if (typeof c.animate === 'function') {
        c.animate(
          [
            { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(0.985)` },
            { transform: 'translate3d(0, 0, 0) scale(1)' },
          ],
          {
            duration: 310,
            easing: 'cubic-bezier(0.22, 1.32, 0.36, 1)',
          }
        );
      }
    }
  }

  // ===== 2. ПОДГОТОВКА МОДУЛЬНОЙ BENTO-СЕТКИ И КНОПОК ПЛАШЕК =====
  function ensureModularBentoGrid() {
    const grid = document.querySelector('#view-overview .bento-grid');
    if (!grid) return null;

    if (!grid.classList.contains('v31-modular-grid')) {
      grid.classList.add('v31-modular-grid');

      // В Windows-версии Привычки и Книги лежат внутри .bento-stack без id
      const stack = grid.querySelector('.bento-stack');
      if (stack) {
        const stackCards = Array.from(stack.querySelectorAll(':scope > .card'));
        if (stackCards[0] && !stackCards[0].id) stackCards[0].id = 'ovHabitsCard';
        if (stackCards[1] && !stackCards[1].id) stackCards[1].id = 'ovBooksCard';
        for (const sc of stackCards) {
          grid.appendChild(sc);
        }
        stack.remove();
      }

      // В iPhone-версии карточки лежат внутри двух .bento-col
      const cols = Array.from(grid.querySelectorAll(':scope > .bento-col'));
      for (const col of cols) {
        const colCards = Array.from(col.querySelectorAll(':scope > .card'));
        for (const cc of colCards) {
          grid.appendChild(cc);
        }
        col.remove();
      }
    }

    const idToKey = {
      ovLessonsCard: 'lessons',
      ovDailyCard: 'daily',
      ovGoalsCard: 'goals',
      ovHabitsCard: 'habits',
      ovBooksCard: 'books',
    };

    for (const [domId, key] of Object.entries(idToKey)) {
      const card = document.getElementById(domId);
      if (!card) continue;
      card.setAttribute('data-card-id', key);
      ensureCardControls(card, key);
    }

    return grid;
  }

  function ensureCardControls(card, key) {
    const head = card.querySelector('.card-head');
    if (!head || head.querySelector('.card-drag-handle')) return;

    const titleEl = head.querySelector('.card-title');
    if (titleEl) {
      const wrap = document.createElement('div');
      wrap.className = 'card-head-title-wrap';
      const handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'card-drag-handle';
      handle.setAttribute('data-drag-card', key);
      handle.title = 'Потяните, чтобы переместить плашку';
      handle.textContent = '⋮⋮';
      head.insertBefore(wrap, titleEl);
      wrap.appendChild(handle);
      wrap.appendChild(titleEl);

      setupCardDragHandle(card, handle, key);
    }

    let right = head.querySelector('.card-head-right');
    if (!right) {
      right = document.createElement('div');
      right.className = 'card-head-right';
      head.appendChild(right);
    }

    const tools = document.createElement('div');
    tools.className = 'card-layout-tools';

    const spanBtn = document.createElement('button');
    spanBtn.type = 'button';
    spanBtn.className = 'card-tool-btn card-span-btn';
    spanBtn.setAttribute('data-span-card', key);
    spanBtn.title = 'Переключить ширину: 1 колонка / На всю ширину';
    spanBtn.textContent = '↔';
    spanBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCardSpan(key);
    });

    const colBtn = document.createElement('button');
    colBtn.type = 'button';
    colBtn.className = 'card-tool-btn card-collapse-btn';
    colBtn.setAttribute('data-collapse-card', key);
    colBtn.title = 'Свернуть или развернуть плашку';
    colBtn.textContent = '▾';
    colBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCardCollapse(key);
    });

    tools.appendChild(spanBtn);
    tools.appendChild(colBtn);
    right.insertBefore(tools, right.firstChild);
  }

  function setupCardDragHandle(card, handle, key) {
    // Pointer-based живое перетаскивание (работает и мышкой на ПК, и пальцем на iPhone)
    handle.addEventListener('pointerdown', (e) => {
      if (LAYOUT_CFG.layoutLocked) return;
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      activeDragCardId = key;
      card.classList.add('is-dragging');
      getBridge().playSound('tap');

      let lastSwapTs = 0;

      function onMove(ev) {
        if (!activeDragCardId) return;
        const now = performance.now();
        if (now - lastSwapTs < 140) return;

        const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
        const targetCard = elUnder && elUnder.closest ? elUnder.closest('#view-overview .bento-grid > .card') : null;
        if (!targetCard || targetCard === card) return;
        const targetKey = targetCard.getAttribute('data-card-id');
        if (!targetKey || targetKey === activeDragCardId) return;

        const order = [...LAYOUT_CFG.cardOrder];
        const fromIdx = order.indexOf(activeDragCardId);
        const toIdx = order.indexOf(targetKey);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

        order.splice(fromIdx, 1);
        order.splice(toIdx, 0, activeDragCardId);
        LAYOUT_CFG.cardOrder = order;
        lastSwapTs = now;

        animateBentoFlip(() => {
          applyBentoCardsOrderAndSize();
        });
        getBridge().playSound('tap');
      }

      function onUp() {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        card.classList.remove('is-dragging');
        if (activeDragCardId) {
          activeDragCardId = '';
          persistLayoutConfig('● Расположение плашек сохранено');
        }
      }

      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });
  }

  function toggleCardSpan(key) {
    const cur = LAYOUT_CFG.cardSpans[key] === 2 ? 2 : 1;
    const next = cur === 2 ? 1 : 2;
    if (next === 2) LAYOUT_CFG.cardSpans[key] = 2;
    else delete LAYOUT_CFG.cardSpans[key];

    getBridge().playSound('pop');
    animateBentoFlip(() => {
      applyBentoCardsOrderAndSize();
    });
    persistLayoutConfig(next === 2 ? '● Плашка развёрнута на всю ширину' : '● Плашка в одну колонку');
  }

  function toggleCardCollapse(key) {
    const next = !LAYOUT_CFG.collapsedCards[key];
    if (next) LAYOUT_CFG.collapsedCards[key] = true;
    else delete LAYOUT_CFG.collapsedCards[key];

    getBridge().playSound('tap');
    animateBentoFlip(() => {
      applyBentoCardsOrderAndSize();
    });
    persistLayoutConfig();
  }

  function applyBentoCardsOrderAndSize() {
    const grid = ensureModularBentoGrid();
    if (!grid) return;

    for (const key of LAYOUT_CFG.cardOrder) {
      const card = grid.querySelector(`:scope > .card[data-card-id="${key}"]`);
      if (!card) continue;
      grid.appendChild(card);

      const isFull = LAYOUT_CFG.cardSpans[key] === 2;
      card.classList.toggle('card-span-full', isFull);
      const spanBtn = card.querySelector('.card-span-btn');
      if (spanBtn) {
        spanBtn.classList.toggle('active', isFull);
        spanBtn.textContent = isFull ? '⇥⇤' : '↔';
      }

      const isCollapsed = Boolean(LAYOUT_CFG.collapsedCards[key]);
      card.classList.toggle('card-collapsed', isCollapsed);
      const colBtn = card.querySelector('.card-collapse-btn');
      if (colBtn) {
        colBtn.classList.toggle('active', isCollapsed);
        colBtn.textContent = isCollapsed ? '▸' : '▾';
      }
    }
  }

  // ===== 3. НАВИГАЦИЯ: ПЕРЕТАСКИВАНИЕ ПУНКТОВ И МАГНИТНЫЙ ИНДИКАТОР =====
  function ensureSidebarNavEnhancements() {
    const sideNav = document.getElementById('sideNav');
    if (!sideNav) return;

    if (!sideNav.querySelector('.side-nav-glider')) {
      const glider = document.createElement('div');
      glider.className = 'side-nav-glider';
      glider.id = 'sideNavGlider';
      sideNav.insertBefore(glider, sideNav.firstChild);
    }

    const btns = Array.from(sideNav.querySelectorAll('.side-btn[data-view]'));
    for (const btn of btns) {
      if (btn.getAttribute('data-v31-nav-bound')) continue;
      btn.setAttribute('data-v31-nav-bound', '1');
      const viewKey = btn.getAttribute('data-view');
      const cntSpan = btn.querySelector('.side-cnt');
      if (cntSpan && !btn.querySelector('.nav-drag-grip')) {
        const grip = document.createElement('b');
        grip.className = 'nav-drag-grip';
        grip.textContent = '⋮⋮';
        grip.title = 'Потяните, чтобы изменить порядок разделов в меню';
        btn.insertBefore(grip, cntSpan);

        grip.addEventListener('pointerdown', (e) => {
          if (LAYOUT_CFG.layoutLocked) return;
          e.preventDefault();
          e.stopPropagation();
          activeDragNavKey = viewKey;
          btn.classList.add('nav-dragging');

          function onMove(ev) {
            if (!activeDragNavKey) return;
            const el = document.elementFromPoint(ev.clientX, ev.clientY);
            const targetBtn = el && el.closest ? el.closest('#sideNav .side-btn[data-view]') : null;
            if (!targetBtn || targetBtn === btn) return;
            const targetKey = targetBtn.getAttribute('data-view');
            if (!targetKey || targetKey === activeDragNavKey) return;

            const order = [...LAYOUT_CFG.navOrder];
            const fromIdx = order.indexOf(activeDragNavKey);
            const toIdx = order.indexOf(targetKey);
            if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

            order.splice(fromIdx, 1);
            order.splice(toIdx, 0, activeDragNavKey);
            LAYOUT_CFG.navOrder = order;
            applyNavOrderToDom();
            updateNavGliderPosition();
          }

          function onUp() {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            btn.classList.remove('nav-dragging');
            if (activeDragNavKey) {
              activeDragNavKey = '';
              persistLayoutConfig('● Порядок меню сохранён');
            }
          }

          window.addEventListener('pointermove', onMove, { passive: true });
          window.addEventListener('pointerup', onUp);
          window.addEventListener('pointercancel', onUp);
        });
      }
    }
  }

  function applyNavOrderToDom() {
    const sideNav = document.getElementById('sideNav');
    const mobNav = document.getElementById('mobileNav');
    for (const key of LAYOUT_CFG.navOrder) {
      if (sideNav) {
        const sb = sideNav.querySelector(`.side-btn[data-view="${key}"]`);
        if (sb) sideNav.appendChild(sb);
      }
      if (mobNav) {
        const mb = mobNav.querySelector(`.mob-nav-btn[data-view="${key}"]`);
        if (mb) mobNav.appendChild(mb);
      }
    }
  }

  function updateNavGliderPosition() {
    const sideNav = document.getElementById('sideNav');
    const glider = document.getElementById('sideNavGlider');
    if (!sideNav || !glider) return;
    const activeBtn = sideNav.querySelector('.side-btn.active:not(.section-hidden)');
    if (!activeBtn || activeBtn.offsetParent === null) {
      glider.classList.remove('ready');
      return;
    }
    const top = activeBtn.offsetTop;
    const height = activeBtn.offsetHeight;
    glider.style.transform = `translate3d(0, ${top}px, 0)`;
    glider.style.height = `${height}px`;
    glider.classList.add('ready');
  }

  // ===== 4. ВЕРХНИЕ КНОПКИ ПРИВАТНОСТИ (👁) И ЗАМКА МАКЕТА (✥) =====
  function ensureTopbarActionPills() {
    const topActions = document.querySelector('.top-actions');
    if (topActions && !document.getElementById('btnPrivacyToggle')) {
      const updateBtn = document.getElementById('btnAppUpdate');

      const privBtn = document.createElement('button');
      privBtn.type = 'button';
      privBtn.className = 'icon-pill';
      privBtn.id = 'btnPrivacyToggle';
      privBtn.title = 'Режим приватности: скрыть тексты записей от посторонних глаз (Alt+P)';
      privBtn.textContent = '👁';
      privBtn.addEventListener('click', () => togglePrivacyBlur());

      const lockLayoutBtn = document.createElement('button');
      lockLayoutBtn.type = 'button';
      lockLayoutBtn.className = 'icon-pill';
      lockLayoutBtn.id = 'btnLayoutLockToggle';
      lockLayoutBtn.title = 'Свободное перемещение плашек / Закрепить макет';
      lockLayoutBtn.textContent = '✥';
      lockLayoutBtn.addEventListener('click', () => toggleLayoutLocked());

      if (updateBtn) {
        topActions.insertBefore(privBtn, updateBtn);
        topActions.insertBefore(lockLayoutBtn, updateBtn);
      } else {
        topActions.appendChild(privBtn);
        topActions.appendChild(lockLayoutBtn);
      }
    }
  }

  function togglePrivacyBlur() {
    LAYOUT_CFG.privacyBlur = !LAYOUT_CFG.privacyBlur;
    getBridge().playSound('tap');
    persistLayoutConfig(LAYOUT_CFG.privacyBlur ? '● Записи скрыты от чужих глаз' : '● Записи снова видны');
    getBridge().toastMain(
      LAYOUT_CFG.privacyBlur
        ? '👁 Режим приватности включён (наведите курсор на строку, чтобы подсмотреть, или нажмите 👁 / Alt+P)'
        : '👁 Режим приватности выключен'
    );
  }

  function toggleLayoutLocked() {
    LAYOUT_CFG.layoutLocked = !LAYOUT_CFG.layoutLocked;
    getBridge().playSound('tap');
    persistLayoutConfig(LAYOUT_CFG.layoutLocked ? '🔒 Макет плашек закреплён' : '🔓 Перемещение плашек включено');
    getBridge().toastMain(
      LAYOUT_CFG.layoutLocked
        ? '🔒 Макет закреплён — ручки перетаскивания скрыты'
        : '🔓 Макет разблокирован — тяните любую плашку за ⋮⋮ или меняйте ширину кнопкой ↔'
    );
  }

  function applyLayoutToDom(withFlip = false) {
    ensureTopbarActionPills();
    ensureSidebarNavEnhancements();

    document.body.classList.toggle('sidebar-right', LAYOUT_CFG.sidebarPos === 'right');
    document.body.classList.toggle('quote-hidden', LAYOUT_CFG.quoteMode === 'hidden');
    document.body.classList.toggle('quote-reversed', LAYOUT_CFG.quoteMode === 'reversed');
    document.body.classList.toggle('layout-locked', Boolean(LAYOUT_CFG.layoutLocked));
    document.body.classList.toggle('privacy-blur', Boolean(LAYOUT_CFG.privacyBlur));

    const privBtn = document.getElementById('btnPrivacyToggle');
    if (privBtn) privBtn.classList.toggle('active-pill', Boolean(LAYOUT_CFG.privacyBlur));

    const lockBtn = document.getElementById('btnLayoutLockToggle');
    if (lockBtn) {
      lockBtn.classList.toggle('active-pill', !LAYOUT_CFG.layoutLocked);
      lockBtn.textContent = LAYOUT_CFG.layoutLocked ? '🔒' : '✥';
    }

    if (withFlip) {
      animateBentoFlip(() => {
        applyBentoCardsOrderAndSize();
      });
    } else {
      applyBentoCardsOrderAndSize();
    }

    applyNavOrderToDom();
    requestAnimationFrame(updateNavGliderPosition);
    syncStudioLayoutControls();
  }

  // ===== 5. СТУДИЯ: 6 РОЛЕЙ + КОНСТРУКТОР СВОЕЙ РОЛИ + КОНСТРУКТОР КАРКАСА =====
  function ensureStudioV31Blocks() {
    const paneProfile = document.getElementById('studioPaneProfile');
    if (!paneProfile) return;

    // 1. Обновляем сетку ролей (6 встроенных + пользовательские)
    renderRolesGridInStudio();

    // 2. Форма «Сохранить текущую настройку как свою роль»
    const presetsGrid = document.getElementById('profilePresetsGrid');
    if (presetsGrid && !document.getElementById('customRoleCreatorRow')) {
      const creatorRow = document.createElement('form');
      creatorRow.className = 'form-row';
      creatorRow.id = 'customRoleCreatorRow';
      creatorRow.style.marginTop = '8px';
      creatorRow.innerHTML = `
        <input type="text" id="newCustomRoleTitle" class="input" placeholder="Название своей роли (например: Дизайн-студия, Запуск)..." style="flex:2 1 190px;" />
        <button type="submit" class="btn btn-primary" style="flex:0 0 auto;">★ Сохранить как свою роль</button>
      `;
      creatorRow.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSaveCustomRole();
      });
      presetsGrid.parentNode.appendChild(creatorRow);
    }

    // 3. Конструктор макета и каркаса (Боковая панель, шапка, замок плашек, сброс сетки)
    if (!document.getElementById('v31LayoutBuilderBar')) {
      const bar = document.createElement('div');
      bar.className = 'tweak-bar';
      bar.id = 'v31LayoutBuilderBar';
      bar.innerHTML = `
        <div>
          <span class="tweak-label">Конструктор макета и плашек</span>
          <span class="tweak-sub">Тяните любую карточку на главном экране за ручку <b>⋮⋮</b>, меняйте её ширину кнопкой <b>↔</b> и настраивайте расположение панелей</span>
        </div>
        <div class="tweak-row">
          <span class="tweak-label">Расположение бокового меню (на ПК)</span>
          <div class="pill-group" id="v31SidebarPosGroup">
            <button type="button" class="seg-pill" data-spos="left">Слева</button>
            <button type="button" class="seg-pill" data-spos="right">Справа</button>
          </div>
        </div>
        <div class="tweak-row">
          <span class="tweak-label">Плашка с репликой мини-персонажа</span>
          <div class="pill-group" id="v31QuoteModeGroup">
            <button type="button" class="seg-pill" data-qmode="normal">В центре</button>
            <button type="button" class="seg-pill" data-qmode="reversed">Справа налево</button>
            <button type="button" class="seg-pill" data-qmode="hidden">Скрыть</button>
          </div>
        </div>
        <div class="tweak-row">
          <div>
            <span class="tweak-label">Режим перемещения плашек</span>
            <span class="tweak-sub">Закрепите макет, когда расставите карточки идеально под себя</span>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn" id="v31ToggleLockBtn">🔓 Свободно</button>
            <button type="button" class="btn btn-ghost" id="v31ResetLayoutBtn">↺ Сбросить раскладку</button>
          </div>
        </div>
      `;
      paneProfile.insertBefore(bar, paneProfile.children[1] || null);

      bar.querySelector('#v31SidebarPosGroup')?.addEventListener('click', (e) => {
        const b = e.target.closest('[data-spos]');
        if (!b) return;
        LAYOUT_CFG.sidebarPos = b.getAttribute('data-spos') === 'right' ? 'right' : 'left';
        getBridge().playSound('tap');
        persistLayoutConfig('● Позиция меню обновлена');
      });

      bar.querySelector('#v31QuoteModeGroup')?.addEventListener('click', (e) => {
        const b = e.target.closest('[data-qmode]');
        if (!b) return;
        LAYOUT_CFG.quoteMode = b.getAttribute('data-qmode') || 'normal';
        getBridge().playSound('tap');
        persistLayoutConfig('● Шапка обновлена');
      });

      bar.querySelector('#v31ToggleLockBtn')?.addEventListener('click', () => {
        toggleLayoutLocked();
      });

      bar.querySelector('#v31ResetLayoutBtn')?.addEventListener('click', () => {
        const curProfile = getBridge().getProfileConfig();
        const roleDef = V31_ROLES[curProfile?.id] || V31_ROLES.study;
        LAYOUT_CFG.cardOrder = [...(roleDef.cardOrder || ['lessons', 'daily', 'goals', 'habits', 'books'])];
        LAYOUT_CFG.cardSpans = { ...(roleDef.cardSpans || {}) };
        LAYOUT_CFG.collapsedCards = {};
        LAYOUT_CFG.navOrder = ['overview', 'lessons', 'daily', 'goals', 'habits', 'books'];
        getBridge().playSound('done');
        applyLayoutToDom(true);
        persistLayoutConfig('● Раскладка плашек сброшена по роли');
      });
    }

    syncStudioLayoutControls();
  }

  function renderRolesGridInStudio() {
    const grid = document.getElementById('profilePresetsGrid');
    if (!grid) return;

    const curProfile = getBridge().getProfileConfig();
    const activeId = (curProfile && curProfile.id) || 'study';

    const allRoles = [
      ...Object.values(V31_ROLES),
      ...(LAYOUT_CFG.customRoles || []),
    ];

    grid.innerHTML = allRoles
      .map((r) => {
        const isCustomRole = !V31_ROLES[r.id];
        return `
          <button type="button" class="profile-preset-card ${r.id === activeId ? 'active' : ''}" data-preset="${escapeStr(r.id)}">
            <span class="profile-preset-title">${escapeStr(r.icon || '★')} ${escapeStr(r.title)}</span>
            <span class="profile-preset-sub">${escapeStr(r.sub || '')}</span>
            ${isCustomRole ? `<span class="role-del-badge" data-del-role="${escapeStr(r.id)}" title="Удалить свою роль">×</span>` : ''}
          </button>
        `;
      })
      .join('');

    if (!grid.getAttribute('data-v31-roles-bound')) {
      grid.setAttribute('data-v31-roles-bound', '1');
      grid.addEventListener('click', async (e) => {
        const delBadge = e.target.closest('[data-del-role]');
        if (delBadge) {
          e.stopPropagation();
          const delId = delBadge.getAttribute('data-del-role');
          await deleteCustomRole(delId);
          return;
        }
        const card = e.target.closest('[data-preset]');
        if (!card) return;
        e.stopPropagation();
        const roleId = card.getAttribute('data-preset');
        await applyRoleWithLayout(roleId);
      }, true);
    }
  }

  async function applyRoleWithLayout(roleId) {
    upgradePresetsRegistry();
    const bridge = getBridge();
    const presets = bridge.getProfilePresets();
    const role = presets[roleId] || V31_ROLES[roleId];
    if (!role) return;

    const nextProfile = JSON.parse(JSON.stringify(role));
    // На iPhone раздел lessons отсутствует, поэтому храним конфиг совместимо
    bridge.setProfileConfig(nextProfile);

    if (Array.isArray(role.cardOrder) && role.cardOrder.length) {
      LAYOUT_CFG.cardOrder = [...role.cardOrder];
    }
    LAYOUT_CFG.cardSpans = { ...(role.cardSpans || {}) };
    LAYOUT_CFG.collapsedCards = {};

    const quickInput = document.getElementById('quickInput');
    if (quickInput && role.quickHint) {
      quickInput.placeholder = role.quickHint;
    }

    applyLayoutToDom(true);
    await persistLayoutConfig();
    await bridge.persistProfileConfig();
    renderRolesGridInStudio();
    bridge.renderStudioProfilePane();
    bridge.playSound('done');
    bridge.toastStudio(`● Роль «${role.title || roleId}» и раскладка плашек применены`);
  }

  async function handleSaveCustomRole() {
    const input = document.getElementById('newCustomRoleTitle');
    const title = (input && input.value || '').trim();
    if (!title) {
      getBridge().toastStudio('× Введите название для своей роли');
      return;
    }
    const curProfile = getBridge().getProfileConfig();
    const id = 'role-' + Date.now();
    const cats = (curProfile && curProfile.categories) || ['Работа', 'Личное'];
    const newRole = {
      id,
      icon: '★',
      title,
      sub: `Своя роль · Категории: ${cats.slice(0, 4).join(', ')}`,
      sections: JSON.parse(JSON.stringify(curProfile.sections || V31_ROLES.custom.sections)),
      categories: [...cats],
      cardOrder: [...LAYOUT_CFG.cardOrder],
      cardSpans: { ...LAYOUT_CFG.cardSpans },
    };

    LAYOUT_CFG.customRoles = [...(LAYOUT_CFG.customRoles || []), newRole];
    if (input) input.value = '';
    upgradePresetsRegistry();
    await applyRoleWithLayout(id);
    getBridge().toastStudio(`● Своя роль «${title}» сохранена`);
  }

  async function deleteCustomRole(roleId) {
    LAYOUT_CFG.customRoles = (LAYOUT_CFG.customRoles || []).filter((r) => r.id !== roleId);
    const cur = getBridge().getProfileConfig();
    if (cur && cur.id === roleId) {
      await applyRoleWithLayout('custom');
    } else {
      await persistLayoutConfig('● Своя роль удалена');
      renderRolesGridInStudio();
    }
  }

  function syncStudioLayoutControls() {
    document.querySelectorAll('#v31SidebarPosGroup .seg-pill').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-spos') === LAYOUT_CFG.sidebarPos);
    });
    document.querySelectorAll('#v31QuoteModeGroup .seg-pill').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-qmode') === LAYOUT_CFG.quoteMode);
    });
    const lockBtn = document.getElementById('v31ToggleLockBtn');
    if (lockBtn) {
      lockBtn.textContent = LAYOUT_CFG.layoutLocked ? '🔒 Закреплён' : '🔓 Свободно';
      lockBtn.classList.toggle('btn-primary', LAYOUT_CFG.layoutLocked);
    }
    const privStudioBtn = document.getElementById('stPcPrivacyBtn');
    if (privStudioBtn) {
      privStudioBtn.textContent = LAYOUT_CFG.privacyBlur ? '● Включён' : 'Выкл';
      privStudioBtn.classList.toggle('btn-primary', LAYOUT_CFG.privacyBlur);
    }
  }

  // ===== 6. ЗАЩИТА ДАННЫХ И РЕЗЕРВНЫЕ КОПИИ НА ПК =====
  function ensurePcSecurityAndBackupBlock() {
    // На iPhone этот блок уже есть в верстке (#stPinToggleBtn / #btnExportBackup)
    if (document.getElementById('stPinToggleBtn') || document.getElementById('v31PcSecurityBar')) return;
    const settingsPane = document.getElementById('studioPaneSettings');
    if (!settingsPane) return;

    const bar = document.createElement('div');
    bar.className = 'tweak-bar';
    bar.id = 'v31PcSecurityBar';
    bar.innerHTML = `
      <div class="tweak-row">
        <div>
          <span class="tweak-label">Режим приватности (👁 / Alt+P)</span>
          <span class="tweak-sub">Мгновенно размывает тексты задач, графика и книг на экране</span>
        </div>
        <button type="button" class="btn" id="stPcPrivacyBtn">Выкл</button>
      </div>
      <div class="tweak-row">
        <div>
          <span class="tweak-label">Защита входа PIN-кодом (4 цифры)</span>
          <span class="tweak-sub" id="stPcPinStatusSub">Закрывает экран замком при запуске программы</span>
        </div>
        <button type="button" class="btn" id="stPcPinBtn">Включить PIN</button>
      </div>
      <div class="tweak-row">
        <div>
          <span class="tweak-label">Резервная копия базы данных (.json)</span>
          <span class="tweak-sub">Полная локальная копия расписания, задач, привычек, книг, ролей и тем (без утечки ключей)</span>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" id="btnPcExportBackup">⬇ Скачать копию</button>
          <button type="button" class="btn" id="btnPcImportBackup">⬆ Восстановить</button>
          <input type="file" id="pcImportFileInput" accept=".json,application/json" style="display:none;" />
        </div>
      </div>
    `;
    settingsPane.insertBefore(bar, settingsPane.firstChild);

    bar.querySelector('#stPcPrivacyBtn')?.addEventListener('click', () => {
      togglePrivacyBlur();
    });

    bar.querySelector('#stPcPinBtn')?.addEventListener('click', async () => {
      const s = getBridge().getSettings();
      if (s.has_pin) {
        const curPin = window.prompt('Введите текущий 4-значный PIN-код для отключения:');
        if (curPin === null) return;
        try {
          const res = await api('/api/pin/set', { currentPin: curPin.trim(), newPin: '' });
          if (res.ok) {
            getBridge().toastStudio('● PIN-код отключён');
            await getBridge().reloadState();
            syncPcPinStatus();
          }
        } catch (err) {
          getBridge().toastStudio(`× ${err.message}`);
        }
      } else {
        const nextPin = window.prompt('Задайте новый PIN-код из 4 цифр:');
        if (!nextPin) return;
        if (!/^\d{4}$/.test(nextPin.trim())) {
          getBridge().toastStudio('× PIN-код должен состоять ровно из 4 цифр');
          return;
        }
        try {
          const res = await api('/api/pin/set', { newPin: nextPin.trim() });
          if (res.ok) {
            sessionStorage.setItem('helptool_pc_pin_unlocked', '1');
            getBridge().toastStudio('● PIN-защита включена');
            await getBridge().reloadState();
            syncPcPinStatus();
          }
        } catch (err) {
          getBridge().toastStudio(`× ${err.message}`);
        }
      }
    });

    bar.querySelector('#btnPcExportBackup')?.addEventListener('click', async () => {
      try {
        const res = await api('/api/backup/export');
        if (!res || !res.backup) throw new Error('Не удалось сформировать копию');
        const blob = new Blob([JSON.stringify(res.backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `HelpTool-Backup-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        getBridge().playSound('done');
        getBridge().toastStudio('● Резервная копия сохранена');
      } catch (err) {
        getBridge().toastStudio(`× ${err.message}`);
      }
    });

    const fileInp = bar.querySelector('#pcImportFileInput');
    bar.querySelector('#btnPcImportBackup')?.addEventListener('click', () => {
      fileInp?.click();
    });
    fileInp?.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const res = await api('/api/backup/import', { backup: parsed.data || parsed.backup || parsed });
        if (res && res.ok) {
          getBridge().playSound('done');
          getBridge().toastStudio('● База восстановлена (создана автокопия)');
          await getBridge().reloadState();
        }
      } catch (err) {
        getBridge().toastStudio(`× Ошибка импорта: ${err.message}`);
      }
      e.target.value = '';
    });

    syncPcPinStatus();
  }

  function syncPcPinStatus() {
    const s = getBridge().getSettings();
    const btn = document.getElementById('stPcPinBtn');
    const sub = document.getElementById('stPcPinStatusSub');
    if (!btn || !sub) return;
    const on = Boolean(s && s.has_pin);
    btn.textContent = on ? 'Отключить PIN' : 'Включить PIN';
    btn.classList.toggle('btn-primary', !on);
    sub.textContent = on
      ? '● Защита активна (SHA-256) · При запуске запрашивается 4-значный PIN'
      : 'Можно защитить вход в программу 4-значным PIN-кодом';

    if (on && sessionStorage.getItem('helptool_pc_pin_unlocked') !== '1') {
      showPcPinOverlay();
    }
  }

  function showPcPinOverlay() {
    let ov = document.getElementById('pcPinOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'pc-pin-overlay';
      ov.id = 'pcPinOverlay';
      ov.innerHTML = `
        <div class="pc-pin-card">
          <div style="font-size:28px;">🔒</div>
          <div style="font-size:17px; font-weight:700;">Экран защищён PIN-кодом</div>
          <div style="font-size:12.5px; color:var(--text-muted);" id="pcPinHint">Введите 4 цифры вашего PIN-кода</div>
          <form id="pcPinUnlockForm" style="display:flex; gap:8px; width:100%; justify-content:center;">
            <input type="password" id="pcPinInput" class="input" maxlength="4" inputmode="numeric" placeholder="••••" style="width:120px; text-align:center; font-size:20px; letter-spacing:6px;" required />
            <button type="submit" class="btn btn-primary">Войти</button>
          </form>
        </div>
      `;
      document.body.appendChild(ov);

      ov.querySelector('#pcPinUnlockForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inp = document.getElementById('pcPinInput');
        const pin = (inp && inp.value || '').trim();
        try {
          const res = await api('/api/pin/verify', { pin });
          if (res && res.ok) {
            sessionStorage.setItem('helptool_pc_pin_unlocked', '1');
            ov.classList.remove('open');
            getBridge().playSound('done');
          } else {
            document.getElementById('pcPinHint').textContent = '× Неверный PIN-код, попробуйте снова';
            if (inp) inp.value = '';
          }
        } catch {}
      });
    }
    ov.classList.add('open');
    setTimeout(() => document.getElementById('pcPinInput')?.focus(), 60);
  }

  // ===== 7. СОБЫТИЙНЫЙ МОУШЕН: СВЕТОВОЙ ИМПУЛЬС КАРТОЧКИ И СЧЁТЧИКИ =====
  function setupTactileMotionListeners() {
    document.addEventListener('click', (e) => {
      if (!isMotionAllowed()) return;
      const trigger = e.target.closest('.check-btn, .habit-chip, .m-cell');
      if (!trigger) return;
      const card = trigger.closest('.card');
      if (!card) return;
      card.classList.remove('card-sheen-active');
      void card.offsetWidth;
      card.classList.add('card-sheen-active');
      setTimeout(() => card.classList.remove('card-sheen-active'), 580);
    }, { passive: true });

    // Горячая клавиша Alt+P для мгновенного включения/выключения режима приватности
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.code === 'KeyP' || e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З')) {
        e.preventDefault();
        togglePrivacyBlur();
      }
    });

    window.addEventListener('resize', () => {
      requestAnimationFrame(updateNavGliderPosition);
    }, { passive: true });
  }

  function animateChangedCounters() {
    if (!isMotionAllowed()) return;
    const ids = ['cntLessons', 'cntDaily', 'cntGoals', 'cntHabits', 'cntBooks', 'sideCntLessons', 'sideCntDaily', 'sideCntGoals', 'sideCntHabits', 'sideCntBooks'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const val = el.textContent.trim();
      if (prevCounters[id] !== undefined && prevCounters[id] !== val) {
        el.classList.remove('cnt-pop');
        void el.offsetWidth;
        el.classList.add('cnt-pop');
      }
      prevCounters[id] = val;
    }
  }

  // ===== 7.5. АВТООЧИСТКА СТАРЫХ УЧЕБНЫХ НАЗВАНИЙ ИЗ КЭША И ПРОФИЛЕЙ =====
  function sanitizeLegacyTermsInRole(role) {
    if (!role || typeof role !== 'object') return false;
    let changed = false;

    if (typeof role.title === 'string' && /школ|вуз|учёб|учеб|домашк/i.test(role.title)) {
      role.title = 'Поток и развитие';
      changed = true;
    }
    if (role.icon === '🎓') {
      role.icon = '🚀';
      changed = true;
    }
    if (typeof role.sub === 'string' && /школ|домашк|урок|учебн|пар,/i.test(role.sub)) {
      role.sub = 'Почасовой график блоков и встреч, задачи на день, проекты, привычки и книги';
      changed = true;
    }
    if (typeof role.quickHint === 'string' && /лабу|курсов|домашк|школ|урок/i.test(role.quickHint)) {
      role.quickHint = 'Например: «завтра 14:00 созвон по проекту», «общий план: портфолио», «книга Мастер и Маргарита»';
      changed = true;
    }

    if (role.sections && typeof role.sections === 'object') {
      const ls = role.sections.lessons;
      if (ls && typeof ls === 'object') {
        if (typeof ls.title === 'string' && /школ|урок/i.test(ls.title)) {
          ls.title = 'График и слоты';
          changed = true;
        }
        if (typeof ls.navTitle === 'string' && /школ|урок/i.test(ls.navTitle)) {
          ls.navTitle = 'График и слоты';
          changed = true;
        }
        if (typeof ls.mobTitle === 'string' && /школ|урок/i.test(ls.mobTitle)) {
          ls.mobTitle = 'График';
          changed = true;
        }
      }
      const bk = role.sections.books;
      if (bk && typeof bk === 'object') {
        if (typeof bk.title === 'string' && /учебник/i.test(bk.title)) {
          bk.title = 'Книги и материалы';
          changed = true;
        }
      }
    }

    if (Array.isArray(role.categories)) {
      const nextCats = [];
      let catChanged = false;
      for (const rawCat of role.categories) {
        let c = String(rawCat || '').trim();
        if (!c) continue;
        if (/^учёба$|^учеба$|^школа$/i.test(c)) {
          c = 'Развитие';
          catChanged = true;
        } else if (/^домашка$|^домашнее/i.test(c)) {
          c = 'Работа';
          catChanged = true;
        } else if (/^экзамены$/i.test(c)) {
          c = 'Проекты';
          catChanged = true;
        }
        if (!nextCats.includes(c)) nextCats.push(c);
      }
      if (catChanged) {
        role.categories = nextCats.length ? nextCats : ['Проекты', 'Работа', 'Развитие', 'Личное'];
        changed = true;
      }
    }
    return changed;
  }

  let legacySanitizeInFlight = false;
  function sanitizeActiveProfileIfNeeded() {
    if (legacySanitizeInFlight) return;
    const bridge = getBridge();
    const cur = bridge.getProfileConfig();
    let dirty = false;

    if (cur && sanitizeLegacyTermsInRole(cur)) {
      dirty = true;
      bridge.setProfileConfig(cur);
    }

    let customDirty = false;
    for (const cr of LAYOUT_CFG.customRoles || []) {
      if (sanitizeLegacyTermsInRole(cr)) customDirty = true;
    }

    if (customDirty) {
      persistLayoutConfig();
    }

    if (dirty) {
      legacySanitizeInFlight = true;
      try {
        if (typeof global.applyProfileToUi === 'function') {
          global.applyProfileToUi();
        }
        Promise.resolve(bridge.persistProfileConfig()).finally(() => {
          legacySanitizeInFlight = false;
        });
      } catch {
        legacySanitizeInFlight = false;
      }
    }
  }

  // ===== 8. АВТОМАТИЧЕСКИЕ УВЕДОМЛЕНИЯ ОБ ОБНОВЛЕНИЯХ ВНУТРИ ПРИЛОЖЕНИЯ =====
  let pendingRemoteUpdate = null;
  let updateBannerDismissedSession = false;
  let updateCheckTimer = null;
  let lastRemoteCheckAt = 0;
  let notifiedRemoteKey = '';

  function setUpdateButtonsBadge(active) {
    document.getElementById('btnAppUpdate')?.classList.toggle('has-update-badge', Boolean(active));
    document.getElementById('btnMobAppUpdate')?.classList.toggle('has-update-badge', Boolean(active));
  }

  function ensureUpdateBannerEl() {
    let banner = document.getElementById('v31UpdateBanner');
    if (banner) return banner;

    const workspace = document.querySelector('main.workspace');
    if (!workspace) return null;

    banner = document.createElement('section');
    banner.id = 'v31UpdateBanner';
    banner.className = 'v31-update-banner';
    banner.setAttribute('aria-live', 'polite');

    const topbar = workspace.querySelector('.topbar');
    if (topbar && topbar.nextSibling) {
      workspace.insertBefore(banner, topbar.nextSibling);
    } else {
      workspace.insertBefore(banner, workspace.firstChild);
    }
    return banner;
  }

  function renderUpdateBanner(forceReleaseBanner = false) {
    const banner = ensureUpdateBannerEl();
    if (!banner) return;

    let seenRelease = '';
    try {
      seenRelease = localStorage.getItem(LS_SEEN_RELEASE_KEY) || '';
    } catch {}

    const hasRemote = Boolean(pendingRemoteUpdate);
    const hasUnseenRelease = forceReleaseBanner || seenRelease !== CURRENT_RELEASE_VERSION;

    // Индикатор-точка на кнопке ↻ горит, пока есть новое обновление или непрочитанные заметки версии
    setUpdateButtonsBadge(hasRemote || seenRelease !== CURRENT_RELEASE_VERSION);

    if (hasRemote && !updateBannerDismissedSession) {
      const msg = pendingRemoteUpdate.latestMsg
        ? `Что нового: ${pendingRemoteUpdate.latestMsg}`
        : 'Нажмите «Обновить сейчас», чтобы сохранить резервную копию базы и установить свежую версию.';
      banner.innerHTML = `
        <div class="v31-update-info">
          <div class="v31-update-title">
            <span class="v31-update-badge-pill">✦ Новое обновление</span>
            <span>Доступна свежая версия приложения</span>
          </div>
          <div class="v31-update-sub">${escapeStr(msg)}</div>
        </div>
        <div class="v31-update-actions">
          <button type="button" class="btn btn-primary" id="v31BtnApplyNow">Обновить сейчас</button>
          <button type="button" class="btn btn-ghost" id="v31BtnLater">Позже</button>
        </div>
      `;
      banner.classList.add('show');

      banner.querySelector('#v31BtnApplyNow')?.addEventListener('click', () => {
        if (pendingRemoteUpdate && pendingRemoteUpdate.mode === 'sw') {
          if (pendingRemoteUpdate.worker) {
            pendingRemoteUpdate.worker.postMessage({ type: 'SKIP_WAITING' });
          }
          setTimeout(() => location.reload(), 250);
          return;
        }
        if (typeof global.confirmApplyUpdate === 'function') {
          global.confirmApplyUpdate();
        } else {
          document.getElementById('btnAppUpdate')?.click();
        }
      });

      banner.querySelector('#v31BtnLater')?.addEventListener('click', () => {
        updateBannerDismissedSession = true;
        banner.classList.remove('show');
      });
      return;
    }

    if (hasUnseenRelease) {
      banner.innerHTML = `
        <div class="v31-update-info">
          <div class="v31-update-title">
            <span class="v31-update-badge-pill">✦ v${escapeStr(CURRENT_RELEASE_VERSION)}</span>
            <span>${escapeStr(CURRENT_RELEASE_TITLE)}</span>
          </div>
          <div class="v31-update-sub">${escapeStr(CURRENT_RELEASE_NOTES)}</div>
        </div>
        <div class="v31-update-actions">
          <button type="button" class="btn btn-primary" id="v31BtnAckRelease">Отлично, понятно ✓</button>
        </div>
      `;
      banner.classList.add('show');

      banner.querySelector('#v31BtnAckRelease')?.addEventListener('click', () => {
        try {
          localStorage.setItem(LS_SEEN_RELEASE_KEY, CURRENT_RELEASE_VERSION);
        } catch {}
        banner.classList.remove('show');
        setUpdateButtonsBadge(Boolean(pendingRemoteUpdate));
        getBridge().playSound('done');
      });
      return;
    }

    banner.classList.remove('show');
  }

  async function checkForRemoteUpdateSilently(manualFeedback = false) {
    const bridge = getBridge();
    lastRemoteCheckAt = Date.now();

    // 1. Локальное настольное приложение Windows
    if (bridge.isDesktopApp && (location.hostname === '127.0.0.1' || location.hostname === 'localhost')) {
      if (typeof global.api !== 'function') return;
      try {
        const res = await global.api('/api/update/check', {});
        if (res && res.hasUpdate) {
          const key = `${res.remoteSha || res.remoteHash || res.latestMsg || 'upd'}`;
          pendingRemoteUpdate = res;
          if (notifiedRemoteKey !== key) {
            notifiedRemoteKey = key;
            updateBannerDismissedSession = false;
            bridge.playSound('pop');
          }
          renderUpdateBanner(false);
          return;
        }
        pendingRemoteUpdate = null;
        renderUpdateBanner(false);
        if (manualFeedback) {
          bridge.toastMain(`● Установлена актуальная версия v${CURRENT_RELEASE_VERSION}`);
        }
      } catch {}
      return;
    }

    // 2. Автономная версия на iPhone (Service Worker)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;
        await reg.update();
        if (reg.waiting) {
          pendingRemoteUpdate = {
            mode: 'sw',
            worker: reg.waiting,
            latestMsg: 'Свежая версия загружена в фоне — нажмите, чтобы применить прямо сейчас',
          };
          updateBannerDismissedSession = false;
          renderUpdateBanner(false);
          return;
        }
        if (manualFeedback) {
          bridge.toastMain(`● Установлена актуальная версия v${CURRENT_RELEASE_VERSION}`);
        }
      } catch {}
    }
  }

  function ensureUpdateSettingsRow() {
    const settingsPane = document.getElementById('studioPaneSettings');
    if (!settingsPane || document.getElementById('v31UpdateStatusBar')) return;

    const bar = document.createElement('div');
    bar.className = 'tweak-bar';
    bar.id = 'v31UpdateStatusBar';
    bar.innerHTML = `
      <div class="tweak-row">
        <div>
          <span class="tweak-label">Версия и уведомления об обновлениях (v${escapeStr(CURRENT_RELEASE_VERSION)})</span>
          <span class="tweak-sub">Приложение само проверяет свежие патчи при запуске и в фоне — баннер появится сверху автоматически</span>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" id="v31CheckUpdateNowBtn">↻ Проверить сейчас</button>
          <button type="button" class="btn" id="v31ShowWhatsNewBtn">✦ Что нового</button>
        </div>
      </div>
    `;
    settingsPane.appendChild(bar);

    bar.querySelector('#v31CheckUpdateNowBtn')?.addEventListener('click', async () => {
      document.getElementById('studioModal')?.classList.remove('open');
      if (typeof global.handleUpdateClick === 'function') {
        global.handleUpdateClick();
      } else {
        await checkForRemoteUpdateSilently(true);
      }
    });

    bar.querySelector('#v31ShowWhatsNewBtn')?.addEventListener('click', () => {
      document.getElementById('studioModal')?.classList.remove('open');
      renderUpdateBanner(true);
      getBridge().playSound('pop');
    });
  }

  function initUpdateNotificationSystem() {
    renderUpdateBanner(false);
    ensureUpdateSettingsRow();

    // Первая тихая фоновая проверка через 2.5 секунды после запуска
    setTimeout(() => {
      if (!document.hidden) checkForRemoteUpdateSilently(false);
    }, 2500);

    // Периодическая проверка раз в 20 минут, только пока окно активно (0% нагрузки в фоне)
    if (!updateCheckTimer) {
      updateCheckTimer = setInterval(() => {
        if (!document.hidden) checkForRemoteUpdateSilently(false);
      }, 20 * 60 * 1000);
    }

    // Проверка при возвращении в окно, если прошло больше 20 минут
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && Date.now() - lastRemoteCheckAt > 20 * 60 * 1000) {
        checkForRemoteUpdateSilently(false);
      }
    });

    // На iPhone отслеживаем появление нового Service Worker
    if (!getBridge().isDesktopApp && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              pendingRemoteUpdate = {
                mode: 'sw',
                worker: nw,
                latestMsg: 'Свежая версия загружена — нажмите «Обновить сейчас» для перезапуска',
              };
              updateBannerDismissedSession = false;
              renderUpdateBanner(false);
            }
          });
        });
      }).catch(() => {});
    }
  }

  // ===== 9. ИНИЦИАЛИЗАЦИЯ И ПЕРЕХВАТ РЕНДЕРА =====
  function hookGlobalLifecycle() {
    if (typeof global.renderAll === 'function' && !global.renderAll._v31Hooked) {
      const origRenderAll = global.renderAll;
      global.renderAll = function (...args) {
        const res = origRenderAll.apply(this, args);
        syncLayoutFromSettings();
        sanitizeActiveProfileIfNeeded();
        ensureStudioV31Blocks();
        ensurePcSecurityAndBackupBlock();
        ensureUpdateSettingsRow();
        syncPcPinStatus();
        applyLayoutToDom(false);
        animateChangedCounters();
        return res;
      };
      global.renderAll._v31Hooked = true;
    }

    if (typeof global.switchView === 'function' && !global.switchView._v31Hooked) {
      const origSwitchView = global.switchView;
      global.switchView = function (...args) {
        const res = origSwitchView.apply(this, args);
        requestAnimationFrame(updateNavGliderPosition);
        return res;
      };
      global.switchView._v31Hooked = true;
    }

    if (typeof global.openStudio === 'function' && !global.openStudio._v31Hooked) {
      const origOpenStudio = global.openStudio;
      global.openStudio = function (...args) {
        const res = origOpenStudio.apply(this, args);
        sanitizeActiveProfileIfNeeded();
        ensureStudioV31Blocks();
        ensurePcSecurityAndBackupBlock();
        ensureUpdateSettingsRow();
        syncStudioLayoutControls();
        syncPcPinStatus();
        return res;
      };
      global.openStudio._v31Hooked = true;
    }

    if (typeof global.applyProfilePreset === 'function') {
      global.applyProfilePreset = applyRoleWithLayout;
    }
  }

  function initV31Engine() {
    loadLayoutLocal();
    hookGlobalLifecycle();
    setupTactileMotionListeners();
    ensureModularBentoGrid();
    sanitizeActiveProfileIfNeeded();
    ensureStudioV31Blocks();
    ensurePcSecurityAndBackupBlock();
    applyLayoutToDom(false);
    initUpdateNotificationSystem();
  }

  global.HelpV31Engine = {
    V31_ROLES,
    CURRENT_RELEASE_VERSION,
    init: initV31Engine,
    onRender: () => {
      syncLayoutFromSettings();
      sanitizeActiveProfileIfNeeded();
      ensureStudioV31Blocks();
      ensureUpdateSettingsRow();
      applyLayoutToDom(false);
      animateChangedCounters();
    },
    onSwitchView: () => {
      requestAnimationFrame(updateNavGliderPosition);
    },
    onOpenStudio: () => {
      sanitizeActiveProfileIfNeeded();
      ensureStudioV31Blocks();
      ensureUpdateSettingsRow();
      syncStudioLayoutControls();
    },
    applyRoleWithLayout,
    togglePrivacyBlur,
    toggleLayoutLocked,
    showReleaseNotes: () => renderUpdateBanner(true),
    checkUpdateNow: () => checkForRemoteUpdateSilently(true),
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initV31Engine);
  } else {
    initV31Engine();
  }
})(window);
