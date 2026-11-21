// 16 тем оформления, персонализированные фразы без школы и 16 уникальных мини-персонажей
(function (global) {
  'use strict';

  const SKINS = [
    {
      id: 'goth-skull',
      name: 'Готика · Черепа',
      sub: 'Контрастная манга',
      category: ['anime', 'light'],
      mode: 'light',
      img: './assets/gallery/art-02.jpg',
      cropPos: '50% 14%',
      colors: { bg: '#f5f4f8', surface: '#ffffff', text: '#15141b', textMuted: '#666375', pink: '#e11d74', amber: '#f59e0b' },
      quotes: [
        'Не откладывай на завтра то, что можно закрыть сейчас и спокойно открыть книгу.',
        'Вчерашние дела сами себя не закроют — нажми «На сегодня» или добей сразу.',
        'Дисциплина в чёрно-розовом стиле: задания под рукой, общие планы под прицелом.',
        'Полка книг сама себя не пополнит. Что сейчас в планах на чтение?',
        'Одна галочка в привычках за сегодня — и серия уже не смотрит на тебя укоризненно.',
        'Включи таймер фокуса на 25 минут, чтобы быстро разделаться с главным делом.',
      ],
    },
    {
      id: 'ellen-zzz',
      name: 'Эллен Джо · ZZZ',
      sub: 'Алый драйв Виктории',
      category: ['anime', 'games', 'dark'],
      mode: 'dark',
      img: './assets/gallery/art-10.png',
      cropPos: '24% 16%',
      colors: { bg: '#110a0f', surface: '#1b1118', text: '#fdf2f7', textMuted: '#b89aa9', pink: '#ff2e63', amber: '#f8fafc' },
      quotes: [
        'Давай без лишней суеты: закрываем дневные задания, и я официально разрешаю отдыхать.',
        'Если в общих планах висит что-то огромное, просто откуси от него одно задание на день.',
        'Сон и отдых — тоже нормальный план. Хватает одной привычки и пары страниц книги.',
        'Если дел много, включи таймер на 25 минут — закроем главное и пойдём отдыхать.',
        'Полка книг ждёт вечера. Давай разберёмся со списком пораньше.',
      ],
    },
    {
      id: 'yumeko-kakegurui',
      name: 'Юмэко · Азарт',
      sub: 'Кровавый джокер',
      category: ['anime', 'dark'],
      mode: 'dark',
      img: './assets/gallery/art-05.jpg',
      cropPos: '24% 18%',
      colors: { bg: '#0c0914', surface: '#161124', text: '#f8f5ff', textMuted: '#a39bb8', pink: '#e11d48', amber: '#06b6d4' },
      quotes: [
        'Ставка дня: успеешь ли ты закрыть все дневные задания до вечера? ♠',
        'Прошлые дела не сгорают в полночь, но риск копить хвосты всегда щекочет нервы!',
        'Выбирай цель из общих планов покрупнее — маленькие ставки слишком скучны.',
        'Серия привычек — это твоя победная полоса. Не прерывай её по пустякам ♥',
        'В библиотеке новая книга? Поспорим, на сколько вечеров она тебя затянет.',
      ],
    },
    {
      id: 'terrorblade-sakura',
      name: 'Сакура и Тушь',
      sub: 'Свиток Террорблейда',
      category: ['games', 'anime', 'light'],
      mode: 'light',
      img: './assets/gallery/art-15.jpg',
      cropPos: '50% 18%',
      colors: { bg: '#faf7f5', surface: '#ffffff', text: '#161314', textMuted: '#6e6265', pink: '#d9385e', amber: '#8c7a7b' },
      quotes: [
        'Тишина, порядок и ясная мысль. У каждого дела и книги — своё место на свитке.',
        'Даже крупная цель из общих планов покоряется одному спокойному заданию в день.',
        'Отмеченная привычка — как ровный штрих тушью. Серия копится без шума.',
        'Прочитанная книга остаётся на полке тихим трофеем. Что откроешь следующим?',
        'Лишний шум убран — остались только твои шаги на сегодня.',
      ],
    },
    {
      id: 'vergil-yamato',
      name: 'Вергилий · Ямато',
      sub: 'Холодная сталь DMC',
      category: ['games', 'dark'],
      mode: 'dark',
      img: './assets/gallery/art-16.jpg',
      cropPos: '40% 20%',
      colors: { bg: '#080a0f', surface: '#11151f', text: '#eef4ff', textMuted: '#8b9bb4', pink: '#38bdf8', amber: '#cbd5e1' },
      quotes: [
        'Where is your motivation? Глобальные цели ждут действий, а не отговорок.',
        'Ямато отсекает всё лишнее. На экране только то, что ведёт вперёд.',
        'Прошлые задания ещё не закрыты. Либо заверши их сегодня, либо убери с пути.',
        'Сила привычек куётся ежедневно. Ни один пропуск без причины не оправдан.',
        'Книги — это знание, а знание — сила. Отметь свой прогресс на полке.',
        'Бери важные цели из общих планов и руби их на чёткие дневные задачи.',
      ],
    },
    {
      id: 'cc-code-geass',
      name: 'C.C. · Код Гиас',
      sub: 'Изумрудный контракт',
      category: ['anime', 'dark'],
      mode: 'dark',
      img: './assets/gallery/art-03.jpg',
      cropPos: '72% 18%',
      colors: { bg: '#0a0f0c', surface: '#121c16', text: '#f0fdf4', textMuted: '#8da896', pink: '#84cc16', amber: '#f59e0b' },
      quotes: [
        'Условия контракта просты: я храню твои списки, а ты не срываешь дневные планы.',
        'В общих планах уже накопилось дел на целую жизнь. Возьми хотя бы одно на сегодня.',
        'Люди забывают обещания, но база книг и заданий помнит всё до строчки.',
        'Пара глав хорошей книги перед сном — неплохой способ переждать шумный день.',
        'Нам не нужны лишние кнопки, только чистый план и твёрдое решение.',
      ],
    },
    {
      id: 'gothic-miku-feathers',
      name: 'Чёрные перья',
      sub: 'Мятная готика',
      category: ['anime', 'dark'],
      mode: 'dark',
      img: './assets/gallery/art-17.png',
      cropPos: '76% 18%',
      colors: { bg: '#080e11', surface: '#101a20', text: '#ecfeff', textMuted: '#86a6b0', pink: '#2dd4bf', amber: '#e2e8f0' },
      quotes: [
        'Тихая мелодия дня: задания, привычки и книги идут строго в такт.',
        'Чёрные перья любят ночной покой. Отметь прочитанные страницы и выдохни.',
        'Вчерашние задания никуда не исчезли — аккуратно перенеси нужные на сегодня.',
        'В базе привычек каждый отмеченный день складывается в ровный ритм.',
        'Выдели звёздочкой важные общие планы, чтобы не потерять главную ноту.',
      ],
    },
    {
      id: 'cyber-rave-miku',
      name: 'Кибер-рейв · Неон',
      sub: 'Бирюза и пурпур',
      category: ['anime', 'games', 'dark'],
      mode: 'dark',
      img: './assets/gallery/art-13.png',
      cropPos: '22% 18%',
      colors: { bg: '#110917', surface: '#1b1025', text: '#fdf4ff', textMuted: '#b095c2', pink: '#ec4899', amber: '#22d3ee' },
      quotes: [
        'Ритм дня заряжен: дневные задания, цели и трекер привычек на одном пульте.',
        'Закидывай идеи в общие планы, пока трек не сменился — потом заберёшь в день.',
        'Серия привычек светится ярче неона. Не сбавляй темп!',
        'Даже в ритме мегаполиса есть час на книгу. Какую сейчас читаешь?',
        'Кнопка «+ Быстро добавить» сразу отправит задание, цель или книгу в нужное место.',
      ],
    },
    {
      id: 'chocola-maid',
      name: 'Шоколадный Неко',
      sub: 'Тёплый пастельный крем',
      category: ['anime', 'light'],
      mode: 'light',
      img: './assets/gallery/art-18.png',
      cropPos: '68% 18%',
      colors: { bg: '#fff7f9', surface: '#ffffff', text: '#382229', textMuted: '#8a6973', pink: '#e11d74', amber: '#f472b6' },
      quotes: [
        'С возвращением! Все задания, привычки и полка книг уже аккуратно разложены.',
        'Не забывай пить воду и отмечать привычки, чтобы копилась красивая серия.',
        'Если вчера не успелось — не страшно! Перенесём задание на сегодня с новыми силами.',
        'После всех дел самое время заварить чай и открыть книгу из списка «Читаю».',
        'Отметь важные общие планы звёздочкой — так мы точно не забудем о главной цели.',
        'Ты молодец! Даже одно закрытое дело уже делает день лучше.',
      ],
    },
    {
      id: 'pink-demon-lolita',
      name: 'Розовый Демон',
      sub: 'Готик-лолита и цепи',
      category: ['anime', 'dark'],
      mode: 'dark',
      img: './assets/gallery/art-09.jpg',
      cropPos: '34% 20%',
      colors: { bg: '#140b14', surface: '#211221', text: '#fdf2f8', textMuted: '#b894b6', pink: '#f472b6', amber: '#c084fc' },
      quotes: [
        'Даже не думай бросать свои важные общие планы! Бери хотя бы один в работу.',
        'Хвосты с прошлых дней так и смотрят на тебя. Закрой или перенеси, я всё вижу.',
        'Хорошая книжка на ночь — награда для тех, кто закрыл привычки дня.',
        'Неоново-розовый порядок: каждый список строго на своём месте, никакой каши.',
        'Записывай книги в полку сразу, чтобы не забыть, что хотел прочитать.',
      ],
    },
    {
      id: 'night-neko-stripes',
      name: 'Ночная Неко',
      sub: 'Глубокий OLED и розовый',
      category: ['anime', 'dark'],
      mode: 'dark',
      img: './assets/gallery/art-11.png',
      cropPos: '82% 20%',
      colors: { bg: '#060609', surface: '#111118', text: '#f5f3ff', textMuted: '#938fa8', pink: '#ec4899', amber: '#a855f7' },
      quotes: [
        'Ночной режим включён: глаза отдыхают, пока ты разбираешь дела и планы.',
        'Самое уютное время — свернуться в тишине и дочитать пару глав текущей книги.',
        'Не переживай за вчерашние задания — они спокойно ждут тебя наверху списка.',
        'Серия привычек сама себя не удержит — тыкни хотя бы в одну за сегодня.',
        'Все заметки хранятся прямо у тебя в телефоне и открываются даже без сети.',
      ],
    },
    {
      id: 'pink-poker-cards',
      name: 'Розовый Покер',
      sub: 'Неоновая колода карт',
      category: ['games', 'dark'],
      mode: 'dark',
      img: './assets/gallery/art-14.png',
      cropPos: '50% 50%',
      colors: { bg: '#100912', surface: '#1a0f1e', text: '#fdf2fb', textMuted: '#b594b0', pink: '#f472b6', amber: '#e879f9' },
      quotes: [
        'Все козыри на руках: дневные задания, общие планы, привычки и книги ♠ ♥',
        'Хороший расклад начинается с порядка. Расставь приоритеты ★ в общих планах.',
        'На сегодня стол чист или ещё остались карты в руке? Проверь блок заданий.',
        'Не оставляй прошлые дела в долгу — забирай их на сегодня и закрывай партию.',
        'Стабильная серия привычек — лучший джекпот на длинной дистанции ♦',
      ],
    },
    {
      id: 'marston-acid-western',
      name: 'Марстон · Вестерн',
      sub: 'Кислотное золото и гранж',
      category: ['games', 'dark'],
      mode: 'dark',
      img: './assets/gallery/art-06.jpg',
      cropPos: '72% 24%',
      colors: { bg: '#11120c', surface: '#1b1c12', text: '#fefce8', textMuted: '#a8a686', pink: '#ec4899', amber: '#22c55e' },
      quotes: [
        'Ничего лишнего. Задачи на день, список целей и холодная голова.',
        'Просроченные задания не пропадают в полночь — они ждут, пока с ними разберутся.',
        'Большие цели из общих планов берутся шаг за шагом. Забирай одну на сегодня.',
        'Хорошая книга после длинного дня стоит всех пережитых хлопот.',
        'Привычка держится только на слове, данном самому себе. Не срывай серию.',
      ],
    },
    {
      id: 'mechagenda-biomech',
      name: 'Мехагенда · CRT',
      sub: 'Индустриальный биомех',
      category: ['games', 'dark'],
      mode: 'dark',
      img: './assets/gallery/art-08.jpg',
      cropPos: '50% 35%',
      colors: { bg: '#0c0d0b', surface: '#151713', text: '#e6eadf', textMuted: '#8d9483', pink: '#a3b18a', amber: '#d97706' },
      quotes: [
        'Система в норме. Локальное хранилище и шифрование готовы к работе без сети.',
        'Буфер незакрытых задач сохранён — перенос на сегодня выполняется в 1 касание.',
        'Глобальные цели отсортированы по сферам. Приоритет ★ выведен на главный обзор.',
        'Модуль привычек за 14 дней собирает чистую телеметрию твоей серии.',
        'База книг активна: переключай этапы от очереди до прочитанного.',
      ],
    },
    {
      id: 'joker-noir',
      name: 'Джокер · Нуар',
      sub: 'Чёрно-белая плёнка',
      category: ['dark'],
      mode: 'dark',
      img: './assets/gallery/art-01.jpg',
      cropPos: '50% 24%',
      colors: { bg: '#0a0a0b', surface: '#141416', text: '#f4f4f5', textMuted: '#909096', pink: '#e4e4e7', amber: '#a1a1aa' },
      quotes: [
        'Вокруг хватает хаоса, но хотя бы на твоём экране всё разложено чисто.',
        'Шутка в том, что вчерашние дела не сгорают в полночь. Придётся их закрыть.',
        'Книга отвлекает от шума лучше любых новостей. Что сейчас на полке?',
        'Крупные общие планы не любят суеты, но один шаг стоит забрать в сегодняшний день.',
        'На этой чёрно-белой плёнке каждая отмеченная привычка — как редкий знак порядка.',
      ],
    },
    {
      id: 'strict-minimal',
      name: 'Строгий минимализм',
      sub: 'Чистый лист без артов',
      category: ['light'],
      mode: 'light',
      img: '',
      cropPos: '50% 50%',
      colors: { bg: '#fafafa', surface: '#ffffff', text: '#111111', textMuted: '#6e6e6e', pink: '#111111', amber: '#111111' },
      quotes: [
        'Чистый фокус: дневные задания, общие планы, привычки и книги.',
        'Начните с одного главного задания или перенесите шаг из общих планов на сегодня.',
        'Невыполненные прошлые задания ждут наверху списка, пока вы их не закроете.',
        'Отмечайте привычки каждый день, а книги переводите по статусам чтения.',
        'Храните резервную копию в Файлах iPhone, чтобы данные всегда оставались в безопасности.',
      ],
    },
  ];

  const CHIBI_THEMES = {
    'terrorblade-sakura':   { type: 'terrorblade' },
    'vergil-yamato':        { type: 'vergil' },
    'marston-acid-western': { type: 'marston' },
    'mechagenda-biomech':   { type: 'crt' },
    'joker-noir':           { type: 'joker' },
    'pink-poker-cards':     { type: 'poker' },
    'strict-minimal':       { type: 'minimal' },
    'goth-skull':           { type: 'anime', hair: '#18171f', hairDark: '#0d0c12', eye: '#64748b', style: 'twintails', glasses: true, skullClips: true, shirt: '#18181b', choker: '#f472b6' },
    'ellen-zzz':            { type: 'anime', hair: '#181820', hairDark: '#0c0c12', eye: '#ff2e63', style: 'bob', dipDye: '#ff2e63', hairCross: true, shirt: '#141418' },
    'yumeko-kakegurui':     { type: 'anime', hair: '#14111b', hairDark: '#09070d', eye: '#e11d48', style: 'long', shirt: '#be123c', collar: true, hasCard: true },
    'cc-code-geass':        { type: 'anime', hair: '#a3e635', hairDark: '#4d7c0f', eye: '#f59e0b', style: 'long', goldPin: true, shirt: '#1e293b' },
    'gothic-miku-feathers': { type: 'anime', hair: '#2dd4bf', hairDark: '#0f766e', eye: '#14b8a6', style: 'long', maidCrown: true, feather: true, shirt: '#0f172a' },
    'cyber-rave-miku':      { type: 'anime', hair: '#22d3ee', hairDark: '#0e7490', eye: '#ec4899', style: 'twintails', cyberHorns: true, shirt: '#18181b' },
    'chocola-maid':         { type: 'anime', hair: '#6b4639', hairDark: '#422920', eye: '#d97706', style: 'neko', maidCrown: true, maidBows: '#f472b6', earInner: '#fecdd3', shirt: '#3b241c', choker: '#f472b6' },
    'pink-demon-lolita':    { type: 'anime', hair: '#f9a8d4', hairDark: '#ec4899', eye: '#451a1a', style: 'twintails', bows: '#be185d', elfEars: true, batWings: true, shirt: '#1e131e' },
    'night-neko-stripes':   { type: 'anime', hair: '#1e1a2b', hairDark: '#0e0b16', eye: '#a855f7', style: 'neko', earInner: '#f8fafc', catTail: true, shirt: '#ec4899', choker: '#18181b' },
  };

  function getTimeSlot() {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'day';
    if (h >= 18 && h < 23) return 'evening';
    return 'night';
  }

  function getTimeGreeting(skin) {
    const slot = getTimeSlot();
    const first = (skin.quotes && skin.quotes[0]) || '';
    if (slot === 'morning') {
      if (skin.id === 'ellen-zzz') return 'Доброе утро… ещё бы поспать, но сначала закроем задания дня.';
      if (skin.id === 'vergil-yamato') return 'Утро началось. Собери волю и закрой первую задачу дня.';
      if (skin.id === 'terrorblade-sakura') return 'Утро на свитке: без лишней суеты разбери задания дня.';
      if (skin.id === 'chocola-maid') return 'Доброе утро! Список дел и привычек на сегодня уже готов, хорошего дня!';
      return `Доброе утро! ${first}`;
    }
    if (slot === 'evening') {
      if (skin.id === 'night-neko-stripes') return 'Уже темнеет — самое время дожать дневные дела и отметить привычки.';
      if (skin.id === 'ellen-zzz') return 'Вечер близко. Проверь оставшиеся задания, чтобы спокойно отдыхать.';
      if (skin.id === 'terrorblade-sakura') return 'Вечер в тишине: проверь оставшиеся дела на свитке и отметь привычки.';
      return 'Добрый вечер! Не забудь отметить привычки за сегодня и проверить задания.';
    }
    if (slot === 'night') {
      if (skin.id === 'night-neko-stripes') return 'Глубокая ночь… Самое время открыть книгу в тишине и пойти спать.';
      if (skin.id === 'ellen-zzz') return 'Уже ночь. Отложи телефон, дочитай пару страниц и иди спать.';
      if (skin.id === 'chocola-maid') return 'Поздний час! Отдохни с книгой, а остальное подождёт до утра.';
      if (skin.id === 'terrorblade-sakura') return 'Поздний час — береги силы, пара страниц книги среди лепестков сакуры и спать.';
      return 'Поздний час — береги силы, пара страниц книги перед сном и спать.';
    }
    return first;
  }

  function buildUniqueChibiInner(type, mood) {
    if (type === 'terrorblade') {
      const eyes =
        mood === 'happy'
          ? `<path d="M15.8 18.8 Q17.3 16.9 18.8 18.8" fill="none" stroke="#fff1f5" stroke-width="1.6" stroke-linecap="round"/>
             <path d="M21.2 18.8 Q22.7 16.9 24.2 18.8" fill="none" stroke="#fff1f5" stroke-width="1.6" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <path d="M15.3 17.8 L18.9 19.1 L15.8 19.9 Z" fill="#ff9ebb"/>
               <path d="M15.9 18.3 L18.2 19.1 L16.2 19.5 Z" fill="#ffffff"/>
               <path d="M24.7 17.8 L21.1 19.1 L24.2 19.9 Z" fill="#ff9ebb"/>
               <path d="M24.1 18.3 L21.8 19.1 L23.8 19.5 Z" fill="#ffffff"/>
             </g>`;
      return `
        <ellipse cx="6.5" cy="7.5" rx="2.1" ry="1.1" transform="rotate(-30 6.5 7.5)" fill="#f472b6" opacity="0.68"/>
        <ellipse cx="33.5" cy="9.5" rx="2" ry="1" transform="rotate(35 33.5 9.5)" fill="#fda4af" opacity="0.72"/>
        <g class="chibi-hair-sway">
          <path d="M13 31 C6 25 4 14 7 6 C8.5 11.5 10.5 14.5 13 18 C11 21 11 25 14 29 Z" fill="#231c1f"/>
          <path d="M5.2 17 L2 14 L6.7 14.5 Z M6.8 24 L3 24.5 L7.4 21.5 Z" fill="#181316"/>
          <path d="M27 31 C34 25 36 14 33 6 C31.5 11.5 29.5 14.5 27 18 C29 21 29 25 26 29 Z" fill="#231c1f"/>
          <path d="M34.8 17 L38 14 L33.3 14.5 Z M33.2 24 L37 24.5 L32.6 21.5 Z" fill="#181316"/>
        </g>
        <path d="M11.5 38 L14 28 L26 28 L28.5 38 Z" fill="#181315"/>
        <polygon points="20,27.5 24,31.5 20,37.2 16,31.5" fill="#f472b6" opacity="${mood === 'happy' ? '0.92' : '0.68'}"/>
        <polygon points="20,29 22.3,31.5 20,35 17.7,31.5" fill="#fff5f7"/>
        <path d="M14.2 20.8 L13.2 12.8 C11.6 7 13 3.2 15.2 1 C15.2 5.8 16.6 10 18.6 13.8 L20 11 L21.4 13.8 C23.4 10 24.8 5.8 24.8 1 C27 3.2 28.4 7 26.8 12.8 L25.8 20.8 C24.3 25 22 27 20 27 C18 27 15.7 25 14.2 20.8 Z" fill="#141012"/>
        <ellipse cx="20" cy="19" rx="4.2" ry="2.8" fill="#f472b6" opacity="0.22"/>
        ${eyes}
      `;
    }
    if (type === 'vergil') {
      const eyes =
        mood === 'happy'
          ? `<path d="M13.2 20.8 Q15.3 18.6 17.4 20.8" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>
             <path d="M22.6 20.8 Q24.7 18.6 26.8 20.8" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <rect x="13.4" y="19.5" width="3.8" height="2.4" rx="1.1" fill="#38bdf8"/>
               <circle cx="15.8" cy="20.2" r="0.65" fill="#ffffff"/>
               <rect x="22.8" y="19.5" width="3.8" height="2.4" rx="1.1" fill="#38bdf8"/>
               <circle cx="25.2" cy="20.2" r="0.65" fill="#ffffff"/>
               <path d="M12.6 17.8 L17.6 18.8 M27.4 17.8 L22.4 18.8" stroke="#334155" stroke-width="1.2" stroke-linecap="round"/>
             </g>`;
      return `
        <g class="chibi-ear-sway">
          <line x1="6" y1="9" x2="35" y2="33" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="6" y1="9" x2="12.5" y2="14.4" stroke="#f8fafc" stroke-width="2.3" stroke-linecap="round"/>
          <line x1="11.5" y1="16.2" x2="14.5" y2="12.6" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
        </g>
        <path d="M10.5 38 L13.5 28 L26.5 28 L29.5 38 Z" fill="#0f172a"/>
        <path d="M12 32 L14.5 25 L17.2 29.5 Z M28 32 L25.5 25 L22.8 29.5 Z" fill="#1e293b" stroke="#94a3b8" stroke-width="0.6"/>
        <path d="M11 19 C11 26.2 15 30 20 30 C25 30 29 26.2 29 19 C29 12.2 25 9.5 20 9.5 C15 9.5 11 12.2 11 19 Z" fill="#f3e3da"/>
        <g class="chibi-hair-sway">
          <path d="M10.2 18.5 C9.8 11 13.8 6.8 20 6.2 C26.2 6.8 30.2 11 29.8 18.5 L27 12.5 L24.2 14.5 L20.4 9.5 L16.8 14.5 L13.6 12.2 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.5"/>
        </g>
        ${eyes}
        <path d="${mood === 'happy' ? 'M17.8 25.4 Q20 27 22.2 25.4' : 'M18.2 25.8 L21.8 25.8'}" fill="none" stroke="#64748b" stroke-width="1.15" stroke-linecap="round"/>
      `;
    }
    if (type === 'marston') {
      const eyes =
        mood === 'happy'
          ? `<path d="M13.2 21.4 Q15.3 19.2 17.4 21.4" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>
             <path d="M22.6 21.4 Q24.7 19.2 26.8 21.4" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <rect x="13.5" y="20" width="3.6" height="2.4" rx="1" fill="#22c55e"/>
               <circle cx="15.8" cy="20.7" r="0.6" fill="#fef08a"/>
               <rect x="22.9" y="20" width="3.6" height="2.4" rx="1" fill="#22c55e"/>
               <circle cx="25.2" cy="20.7" r="0.6" fill="#fef08a"/>
             </g>`;
      return `
        <polygon points="7,8 8,10.5 10.6,10.5 8.5,12 9.3,14.5 7,13 4.7,14.5 5.5,12 3.4,10.5 6,10.5" fill="#22c55e" opacity="0.68"/>
        <g class="chibi-hair-sway">
          <path d="M9 17 C7.5 23 7.5 31 10.5 35 L29.5 35 C32.5 31 32.5 23 31 17 Z" fill="#141310"/>
        </g>
        <path d="M12 38 L14.5 29.5 L25.5 29.5 L28 38 Z" fill="#115e59"/>
        <path d="M15 30 L20 34.5 L25 30 Z" fill="#be123c"/>
        <circle cx="20" cy="21" r="9.6" fill="#e5bfa8"/>
        <path d="M24 23.5 L26.5 25 M25.2 22.8 L27.2 24.2" stroke="#9a5b4a" stroke-width="0.9" stroke-linecap="round"/>
        ${eyes}
        <path d="${mood === 'happy' ? 'M18 26 Q20 27.6 22 26' : 'M18.3 26.4 L21.8 26.2'}" fill="none" stroke="#7c2d12" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M10.2 15 Q20 13.4 29.8 15 L29.4 18.6 Q20 17.2 10.6 18.6 Z" fill="#ec4899"/>
        <g class="chibi-ear-sway">
          <path d="M29.4 16 L35 13.5 L33.8 17.2 Z M29.4 17.2 L34.2 19.6 L31.6 20 Z" fill="#db2777"/>
        </g>
        <path d="M10.2 15.2 C11.5 9.5 15.5 8 20 8 C24.5 8 28.5 9.5 29.8 15.2 L26.5 13.8 L23 15.6 L20 13 L16.8 15.6 L13.2 13.8 Z" fill="#141310"/>
      `;
    }
    if (type === 'joker') {
      const eyes =
        mood === 'happy'
          ? `<path d="M12.5 19.8 Q15 17 17.5 19.8" fill="none" stroke="#fafafa" stroke-width="1.6" stroke-linecap="round"/>
             <path d="M22.5 19.8 Q25 17 27.5 19.8" fill="none" stroke="#fafafa" stroke-width="1.6" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <ellipse cx="15" cy="19.6" rx="1.6" ry="1.85" fill="#fafafa"/>
               <circle cx="15" cy="19.8" r="0.72" fill="#09090b"/>
               <ellipse cx="25" cy="19.6" rx="1.6" ry="1.85" fill="#fafafa"/>
               <circle cx="25" cy="19.8" r="0.72" fill="#09090b"/>
             </g>`;
      return `
        <g class="chibi-hair-sway">
          <path d="M8.5 15 C6.5 22 7.5 29.5 10.5 32.5 L29.5 32.5 C32.5 29.5 33.5 22 31.5 15 Z" fill="#09090b"/>
        </g>
        <path d="M10.5 38 L13.5 29.2 L26.5 29.2 L29.5 38 Z" fill="#111114"/>
        <line x1="20" y1="30.8" x2="20" y2="38" stroke="#d4d4d8" stroke-width="1.2"/>
        <rect x="19" y="31.5" width="2" height="2.6" rx="0.5" fill="#f4f4f5"/>
        <path d="M10.6 18.8 C10.6 12 14.5 9.2 20 9.2 C25.5 9.2 29.4 12 29.4 18.8 C29.4 25 25.8 29.8 20 30.2 C14.2 29.8 10.6 25 10.6 18.8 Z" fill="#f4f4f5"/>
        <path d="M11.6 19.6 C11.8 17.5 13.5 16.5 15.8 17.2 C17.6 17.8 18.2 19.5 17.6 21.2 C16.6 22.8 13.4 22.6 11.6 19.6 Z" fill="#09090b"/>
        <path d="M28.4 19.6 C28.2 17.5 26.5 16.5 24.2 17.2 C22.4 17.8 21.8 19.5 22.4 21.2 C23.4 22.8 26.6 22.6 28.4 19.6 Z" fill="#09090b"/>
        ${eyes}
        <path d="M12.2 23.2 Q20 29.5 27.8 23.2 Q20 27.2 12.2 23.2 Z" fill="#dc2626"/>
        <path d="M11.2 22.2 Q12.6 23.8 14.5 24.8 M28.8 22.2 Q27.4 23.8 25.5 24.8" fill="none" stroke="#991b1b" stroke-width="1.25" stroke-linecap="round"/>
        <path d="M15.8 25.2 Q20 27.5 24.2 25.2" fill="none" stroke="#ffffff" stroke-width="1.35" stroke-linecap="round"/>
        <g class="chibi-hair-sway">
          <path d="M9.8 17.2 C9.8 10 14.4 7.2 20 7.2 C25.6 7.2 30.2 10 30.2 17.2 L27.6 12.8 L25.6 19.8 L23 12.8 L20.2 18.5 L17.6 12.4 L14.4 19.6 L12.2 13 Z" fill="#18181b"/>
        </g>
        <g class="chibi-ear-sway">
          <rect x="30.2" y="27.2" width="6.2" height="8.6" rx="1" transform="rotate(14 33 31)" fill="#fafafa" stroke="#18181b" stroke-width="0.9"/>
          <text x="31.5" y="33.2" font-size="5" font-weight="800" fill="#dc2626" transform="rotate(14 33 31)" font-family="sans-serif">J</text>
        </g>
      `;
    }
    if (type === 'crt') {
      const eyes =
        mood === 'happy'
          ? `<path d="M14 18.6 Q16 16.4 18 18.6" fill="none" stroke="#d97706" stroke-width="1.6" stroke-linecap="round"/>
             <path d="M22 18.6 Q24 16.4 26 18.6" fill="none" stroke="#d97706" stroke-width="1.6" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <circle cx="16" cy="18.2" r="2.2" fill="#a3b18a"/>
               <circle cx="16" cy="18.2" r="0.9" fill="#d97706"/>
               <circle cx="24" cy="18.2" r="2.2" fill="#a3b18a"/>
               <circle cx="24" cy="18.2" r="0.9" fill="#d97706"/>
             </g>`;
      return `
        <g class="chibi-hair-sway">
          <path d="M4 16 L7 16 M4 22 L7 22 M33 16 L36 16 M33 22 L36 22 M14 33 L13 38 M26 33 L27 38" stroke="#78716c" stroke-width="1.8" stroke-linecap="round"/>
        </g>
        <rect x="6.5" y="7" width="27" height="26" rx="3.5" fill="#4b5046" stroke="#8d9483" stroke-width="1.2"/>
        <rect x="9.5" y="10" width="21" height="17" rx="2" fill="#191b17"/>
        <path d="M13 18 C13 13 27 13 27 18 C27 21.5 24.5 23 23.2 23.5 L23 25.5 L17 25.5 L16.8 23.5 C15.5 23 13 21.5 13 18 Z" fill="#cbd5c0"/>
        ${eyes}
        <polygon points="20,20.2 21.2,22.5 18.8,22.5" fill="#191b17"/>
        <g class="chibi-ear-sway"><circle cx="12" cy="30" r="1.2" fill="#22c55e"/></g>
        <rect x="23" y="29.2" width="5" height="1.6" rx="0.8" fill="#8d9483"/>
      `;
    }
    if (type === 'poker') {
      const eyes =
        mood === 'happy'
          ? `<path d="M15.4 20.5 Q17 18.6 18.6 20.5" fill="none" stroke="#140b18" stroke-width="1.5" stroke-linecap="round"/>
             <path d="M21.4 20.5 Q23 18.6 24.6 20.5" fill="none" stroke="#140b18" stroke-width="1.5" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <circle cx="17" cy="20.4" r="1.45" fill="#140b18"/>
               <circle cx="17.5" cy="19.8" r="0.5" fill="#ffffff"/>
               <circle cx="23" cy="20.4" r="1.45" fill="#140b18"/>
               <circle cx="23.5" cy="19.8" r="0.5" fill="#ffffff"/>
             </g>`;
      return `
        <rect x="6" y="7" width="19" height="25" rx="2.8" transform="rotate(-12 15 19)" fill="#3b1640" stroke="#e879f9" stroke-width="1" opacity="0.72"/>
        <rect x="9.5" y="5.5" width="21" height="29" rx="3" fill="#140b18" stroke="#f472b6" stroke-width="1.4"/>
        <text x="12" y="12.5" font-size="6.5" font-weight="800" fill="#f472b6" font-family="sans-serif">♠</text>
        <g class="chibi-hair-sway">
          <path d="M20 12.2 C16 16.5 12.5 19.5 12.5 22.8 C12.5 25.2 14.5 26.8 16.8 26.8 C18 26.8 19 26.2 19.5 25.5 L18.5 29 L21.5 29 L20.5 25.5 C21 26.2 22 26.8 23.2 26.8 C25.5 26.8 27.5 25.2 27.5 22.8 C27.5 19.5 24 16.5 20 12.2 Z" fill="#f472b6"/>
        </g>
        ${eyes}
        <g class="chibi-ear-sway">
          <text x="24" y="32" font-size="6.5" font-weight="800" fill="#e879f9" font-family="sans-serif">♥</text>
        </g>
      `;
    }
    if (type === 'minimal') {
      const eyes =
        mood === 'happy'
          ? `<path d="M13.5 19.8 Q15.3 17.6 17.1 19.8" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>
             <path d="M22.9 19.8 Q24.7 17.6 26.5 19.8" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <circle cx="15.3" cy="19.5" r="1.7" fill="#18181b"/>
               <circle cx="24.7" cy="19.5" r="1.7" fill="#18181b"/>
             </g>`;
      return `
        <circle cx="20" cy="20" r="12.5" fill="#ffffff" stroke="#18181b" stroke-width="1.6"/>
        ${eyes}
        <path d="${mood === 'happy' ? 'M16.5 24.2 Q20 27.2 23.5 24.2' : 'M17.5 24.6 Q20 26 22.5 24.6'}" fill="none" stroke="#18181b" stroke-width="1.35" stroke-linecap="round"/>
      `;
    }

    const cfg = type;
    const backHair =
      cfg.style === 'twintails'
        ? `<g class="chibi-hair-sway">
             <path d="M9 15 C4 18 4 29 7 35 C10 32 10 24 12 20 Z" fill="${cfg.hairDark}"/>
             <path d="M31 15 C36 18 36 29 33 35 C30 32 30 24 28 20 Z" fill="${cfg.hairDark}"/>
             ${cfg.bows ? `<circle cx="9.5" cy="15.5" r="2.2" fill="${cfg.bows}"/><circle cx="30.5" cy="15.5" r="2.2" fill="${cfg.bows}"/>` : ''}
             ${cfg.skullClips ? `<circle cx="9.5" cy="14" r="2.6" fill="#ffffff" stroke="#18181b" stroke-width="0.7"/><circle cx="8.7" cy="13.8" r="0.65" fill="#18181b"/><circle cx="10.3" cy="13.8" r="0.65" fill="#18181b"/><circle cx="30.5" cy="14" r="2.6" fill="#ffffff" stroke="#18181b" stroke-width="0.7"/><circle cx="29.7" cy="13.8" r="0.65" fill="#18181b"/><circle cx="31.3" cy="13.8" r="0.65" fill="#18181b"/>` : ''}
           </g>`
        : cfg.style === 'long' || cfg.style === 'neko'
        ? `<g class="chibi-hair-sway"><path d="M9 14 C7 22 7 33 10 37 L30 37 C33 33 33 22 31 14 Z" fill="${cfg.hairDark}"/></g>`
        : `<g class="chibi-hair-sway">
             <path d="M10 15 C8 22 8.5 29 11.5 31 L28.5 31 C31.5 29 32 22 30 15 Z" fill="${cfg.hairDark}"/>
             ${cfg.dipDye ? `<path d="M9.2 26 L12 31 L14 27.5 M30.8 26 L28 31 L26 27.5" fill="none" stroke="${cfg.dipDye}" stroke-width="2.1" stroke-linecap="round"/>` : ''}
           </g>`;

    const batWings = cfg.batWings
      ? `<g class="chibi-hair-sway"><path d="M11 26 L3 21 L5 29 L11 30 Z M29 26 L37 21 L35 29 L29 30 Z" fill="#181318"/></g>`
      : '';
    const catTail = cfg.catTail
      ? `<path class="chibi-ear-sway" d="M31 35 C37 33 38 26 34 22" fill="none" stroke="#1e1a2b" stroke-width="2.6" stroke-linecap="round"/>`
      : '';
    const elfEars = cfg.elfEars
      ? `<path d="M10.5 20.5 L4.5 18.5 L10 23.5 Z M29.5 20.5 L35.5 18.5 L30 23.5 Z" fill="#ffe7dc" stroke="#f9a8d4" stroke-width="0.6"/>`
      : '';

    const headAcc =
      cfg.style === 'neko'
        ? `<g class="chibi-ear-sway">
             <path d="M10 14 L8 4 L17 10 Z" fill="${cfg.hair}"/>
             <path d="M11 12 L10 6.5 L15.5 10 Z" fill="${cfg.earInner || '#f472b6'}"/>
             <path d="M30 14 L32 4 L23 10 Z" fill="${cfg.hair}"/>
             <path d="M29 12 L30 6.5 L24.5 10 Z" fill="${cfg.earInner || '#f472b6'}"/>
             ${cfg.maidCrown ? `<path d="M12.5 11.5 Q20 7.5 27.5 11.5" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>` : ''}
             ${cfg.maidBows ? `<circle cx="12" cy="11.5" r="1.8" fill="${cfg.maidBows}"/><circle cx="28" cy="11.5" r="1.8" fill="${cfg.maidBows}"/>` : ''}
           </g>`
        : cfg.cyberHorns
        ? `<g class="chibi-ear-sway"><path d="M11 13 L8.5 5 L15.5 10 Z M29 13 L31.5 5 L24.5 10 Z" fill="#18181b" stroke="#ec4899" stroke-width="1"/></g>`
        : cfg.maidCrown
        ? `<g class="chibi-ear-sway"><path d="M12 11.5 Q20 7.5 28 11.5" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="11.5" r="1.5" fill="#18181b"/><circle cx="28" cy="11.5" r="1.5" fill="#18181b"/></g>`
        : '';

    const eyes =
      mood === 'happy'
        ? `<path d="M13 21 Q15.2 18.2 17.4 21" fill="none" stroke="#18181b" stroke-width="1.8" stroke-linecap="round"/>
           <path d="M22.6 21 Q24.8 18.2 27 21" fill="none" stroke="#18181b" stroke-width="1.8" stroke-linecap="round"/>`
        : `<g class="chibi-eyes-blink">
             <ellipse cx="15.2" cy="21" rx="2.1" ry="2.6" fill="${cfg.eye}"/>
             <circle cx="15.8" cy="20" r="0.8" fill="#ffffff"/>
             <ellipse cx="24.8" cy="21" rx="2.1" ry="2.6" fill="${cfg.eye}"/>
             <circle cx="25.4" cy="20" r="0.8" fill="#ffffff"/>
             ${mood === 'focus' ? `<path d="M12.5 17.5 L17.6 18.6 M27.5 17.5 L22.4 18.6" stroke="#18181b" stroke-width="1.3" stroke-linecap="round"/>` : ''}
           </g>`;

    const glasses = cfg.glasses
      ? `<circle cx="15.2" cy="21" r="3.2" fill="none" stroke="#18181b" stroke-width="0.95"/>
         <circle cx="24.8" cy="21" r="3.2" fill="none" stroke="#18181b" stroke-width="0.95"/>
         <line x1="18.4" y1="21" x2="21.6" y2="21" stroke="#18181b" stroke-width="0.95"/>`
      : '';

    const extras =
      (cfg.goldPin ? `<rect x="10.2" y="23.2" width="3" height="2" rx="0.6" fill="#f59e0b"/>` : '') +
      (cfg.hairCross ? `<path d="M25.5 14 L27.5 16 M27.5 14 L25.5 16" stroke="#e2e8f0" stroke-width="1.1" stroke-linecap="round"/>` : '') +
      (cfg.hasCard ? `<rect x="30" y="27" width="6" height="8.5" rx="1" transform="rotate(14 33 31)" fill="#ffffff" stroke="#e11d48" stroke-width="0.8"/>` : '') +
      (cfg.feather ? `<path d="M5 10 Q7 6 9 11 Q6.5 11.5 5 10 Z" fill="#0f172a"/>` : '');

    const mouth =
      mood === 'happy'
        ? `<path d="M18.2 25.3 Q20 27.6 21.8 25.3" fill="none" stroke="#be123c" stroke-width="1.3" stroke-linecap="round"/>`
        : `<path d="M18.6 25.8 Q20 26.7 21.4 25.8" fill="none" stroke="#713f47" stroke-width="1.15" stroke-linecap="round"/>`;

    return `
      ${batWings}
      ${backHair}
      ${catTail}
      ${elfEars}
      <path d="M13 38 C13 31.8 27 31.8 27 38 Z" fill="${cfg.shirt || '#18181b'}"/>
      ${cfg.collar ? `<path d="M16.5 32 L20 35.5 L23.5 32 Z" fill="#ffffff"/><circle cx="20" cy="34.2" r="1.1" fill="#18181b"/>` : ''}
      ${cfg.choker ? `<rect x="17" y="30" width="6" height="2" rx="1" fill="${cfg.choker}"/>` : ''}
      <circle cx="20" cy="20.5" r="10.2" fill="#ffe7dc"/>
      <ellipse cx="12.8" cy="24" rx="2.1" ry="1.1" fill="#fb7185" opacity="${mood === 'happy' ? '0.62' : '0.3'}"/>
      <ellipse cx="27.2" cy="24" rx="2.1" ry="1.1" fill="#fb7185" opacity="${mood === 'happy' ? '0.62' : '0.3'}"/>
      ${eyes}
      ${glasses}
      ${mouth}
      <path d="M9.5 19 C9.5 11.2 14.2 8.5 20 8.5 C25.8 8.5 30.5 11.2 30.5 19 C28.5 15 26 14 23.5 16.5 L20 13.5 L16.8 16.8 C14.5 14 11.8 15 9.5 19 Z" fill="${cfg.hair}"/>
      ${headAcc}
      ${extras}
    `;
  }

  function renderChibiMarkup(skinId, mood) {
    const cfg = CHIBI_THEMES[skinId] || CHIBI_THEMES['goth-skull'];
    const inner = buildUniqueChibiInner(cfg.type === 'anime' ? cfg : cfg.type, mood);
    return `<svg viewBox="0 0 40 40" aria-hidden="true">${inner}</svg>`;
  }

  global.HelpThemes = {
    SKINS,
    getTimeSlot,
    getTimeGreeting,
    renderChibiMarkup,
  };
})(window);
