// 16 тем оформления, персонализированные фразы без школы и 16 уникальных мини-персонажей
(function (global) {
  'use strict';

  const SKINS = [
      {
        id: 'rize-purple-mist',
        name: 'Ризе · Пурпурный Туман',
        sub: 'Фиолетовый нуар и книги',
        category: ['anime', 'dark'],
        mode: 'dark',
        img: './assets/gallery/art-24.jpg',
        cropPos: '72% 22%',
        colors: { bg: '#0d0914', surface: '#171024', text: '#f5f0ff', textMuted: '#a294ba', pink: '#a855f7', amber: '#c084fc' },
        particleType: 'dust',
        quotes: [
          'Тишина книжного кафе и пурпурная дымка: разложи мысли по полкам и закрой дела дня.',
          'Хорошая книга способна увлечь сильнее любой тайны. Что сейчас в твоём списке чтения?',
          'Не позволяй мелким задачам копиться в тени — разбирай их спокойно, одну за другой.',
          'Большие цели требуют терпения и холодного расчёта. Забери один шаг из планов на сегодня.',
          'Каждая отмеченная привычка делает твой ритм устойчивее к любому хаосу.',
        ],
      },
      {
        id: 'columbina-moon',
        name: 'Коломбина · Лунный Сад',
        sub: 'Крылья серафима и луна',
        category: ['anime', 'games', 'dark'],
        mode: 'dark',
        img: './assets/gallery/art-25.jpg',
        cropPos: '36% 32%',
        colors: { bg: '#060d18', surface: '#0e1a2d', text: '#eff6ff', textMuted: '#89a7c7', pink: '#60a5fa', amber: '#f472b6' },
        particleType: 'sparks',
        quotes: [
          'Под светом полной луны даже самый длинный список задач кажется тихим и послушным.',
          'Сделай глубокий вдох, включи таймер фокуса на 25 минут и спокойно заверши главное дело.',
          'Не обязательно видеть весь путь сразу — достаточно выбрать один шаг из общих планов на сегодня.',
          'Пусть серия привычек светится ровно, как ночные цветы в лунном саду.',
          'Когда дневные дела стихнут, останется время для любимой книги и спокойного отдыха.',
        ],
      },
      {
        id: 'miku-morning-coffee',
        name: 'Утренний Кофе · Акварель',
        sub: 'Тёплое какао и книги',
        category: ['anime', 'light'],
        mode: 'light',
        img: './assets/gallery/art-26.jpg',
        cropPos: '68% 36%',
        colors: { bg: '#f8fbf9', surface: '#ffffff', text: '#1c2826', textMuted: '#687d7a', pink: '#14b8a6', amber: '#d97706' },
        particleType: 'dust',
        quotes: [
          'Начни день с глотка тёплого кофе и одного простого задания — дальше пойдёт легко!',
          'Светлая акварельная комната: здесь приятно планировать идеи, чтение и привычки.',
          'Стопка книг рядом уже ждёт — не забудь отметить прочитанные страницы на полке.',
          'Если вчера что-то не успелось, просто перенеси задачу на сегодня в одно нажатие.',
          'Маленькие приятные привычки каждый день создают самое уютное настроение.',
        ],
      },
      {
        id: 'winter-snow-miku',
        name: 'Зимний Вечер · Снегопад',
        sub: 'Тёплый шарф и снежинки',
        category: ['anime', 'light'],
        mode: 'light',
        img: './assets/gallery/art-27.jpg',
        cropPos: '32% 28%',
        colors: { bg: '#f3f5fa', surface: '#ffffff', text: '#1e2433', textMuted: '#69738c', pink: '#e11d74', amber: '#38bdf8' },
        particleType: 'snow',
        quotes: [
          'За окном кружит снег, а на экране — тёплый свет витрин и полный порядок в делах.',
          'Укутайся потеплее, включи таймер фокуса и разберись с главными задачами дня.',
          'Крупные цели из общих планов покоряются шаг за шагом, как зимняя дорога.',
          'Не дай серии привычек замёрзнуть — поставь отметку за сегодняшний день!',
          'Зимний вечер идеально подходит для того, чтобы дочитать главу интересной книги.',
        ],
      },
      {
        id: 'miku-chill-room',
        name: 'Мику · Чилл-комната',
        sub: 'Бирюзовый уют и плюши',
        category: ['anime', 'games', 'dark'],
        mode: 'dark',
        img: './assets/gallery/art-19.jpg',
        cropPos: '74% 24%',
        colors: { bg: '#071217', surface: '#0f2028', text: '#ecfeff', textMuted: '#84a9b8', pink: '#06b6d4', amber: '#84cc16' },
        particleType: 'dust',
        quotes: [
          'Уютный режим включён: разберёмся с делами под тихий свет жалюзи и будем отдыхать.',
          'Даже маленькие чиби-помощники вокруг знают: лучше закрыть одно дело сейчас, чем копить хвосты.',
          'Выбери главную цель из общих планов и перенеси один шаг в сегодняшний день.',
          'Не забудь отметить привычки за сегодня — пусть твоя серия растёт без пропусков.',
          'После всех задач можно спокойно поваляться с хорошей книгой из списка чтения.',
        ],
      },
      {
        id: 'white-sakura-ruby',
        name: 'Белый Шёлк · Сакура',
        sub: 'Рубиновый взгляд весны',
        category: ['anime', 'light'],
        mode: 'light',
        img: './assets/gallery/art-20.jpg',
        cropPos: '50% 42%',
        colors: { bg: '#fdf6f9', surface: '#ffffff', text: '#241720', textMuted: '#7d6373', pink: '#e11d74', amber: '#f472b6' },
        particleType: 'sakura',
        quotes: [
          'Светлый день и лёгкий ветер сакуры: пусть на экране останутся только самые важные шаги.',
          'Каждое выполненное задание очищает голову лучше любой прогулки под цветущими ветвями.',
          'Загляни в общие планы: какую большую мечту пора приблизить сегодня на один шаг?',
          'Ровная серия привычек складывается из тихих ежедневных решений.',
          'Открой страницу любимой книги, когда закончишь дела — вечер создан для спокойного чтения.',
        ],
      },
      {
        id: 'bocchi-rock',
        name: 'Боччи · Рок-драйв',
        sub: 'Розовый панк и Gibson',
        category: ['anime', 'dark'],
        mode: 'dark',
        img: './assets/gallery/art-21.jpg',
        cropPos: '36% 24%',
        colors: { bg: '#10080d', surface: '#1c0f18', text: '#fff0f7', textMuted: '#b88ca4', pink: '#ff2e93', amber: '#eab308' },
        particleType: 'sparks',
        quotes: [
          'Б-без паники! Даже самый страшный список задач разбирается по одному аккорду за раз.',
          'Включай таймер фокуса на 25 минут, будто это репетиция соло, и ни на что не отвлекайся!',
          'Прошлые дела лучше не копить, иначе они начнут давить сильнее выхода на сцену.',
          'Отметь привычку за сегодня — ежедневная практика делает из новичка легенду рока.',
          'Когда все задачи закрыты, можно спокойно спрятаться в уютном углу с книгой.',
        ],
      },
      {
        id: 'midnight-miku-lofi',
        name: 'Полночь · Тихий час',
        sub: 'Ночной лоу-фай без бликов',
        category: ['anime', 'dark'],
        mode: 'dark',
        img: './assets/gallery/art-22.jpg',
        cropPos: '38% 36%',
        colors: { bg: '#080b10', surface: '#111722', text: '#e2ecf5', textMuted: '#7b90a6', pink: '#60a5fa', amber: '#94a3b8' },
        particleType: 'dust',
        quotes: [
          'Тихий ночной экран не слепит глаза — спокойно проверь планы на завтра и отдыхай.',
          'В полуночной тишине лучше всего думается о больших целях и личных проектах.',
          'Если на сегодня остались мелкие дела, закрой их за пару минут или перенеси на утро.',
          'Проверь трекер привычек перед сном, чтобы день завершился с чистой совестью.',
          'Пара глав книги в тишине перед сном — лучший способ переключиться после длинного дня.',
        ],
      },
      {
        id: 'neko-heterochromia',
        name: 'Неко · Сапфир и Янтарь',
        sub: 'Гетерохромия и сферы',
        category: ['anime', 'games', 'dark'],
        mode: 'dark',
        img: './assets/gallery/art-23.jpg',
        cropPos: '50% 34%',
        colors: { bg: '#050814', surface: '#0d1428', text: '#eff6ff', textMuted: '#859cc2', pink: '#38bdf8', amber: '#f59e0b' },
        particleType: 'sparks',
        quotes: [
          'Сапфир и янтарь: держи фокус одновременно и на быстрых задачах дня, и на больших целях.',
          'Лови задачи на лету, как парящие сферы, и закрывай их одну за другой.',
          'Важные планы со звёздочкой ★ всегда на виду — выбери один и забери в сегодняшний день.',
          'Серия привычек светится в темноте ярче неона, не забывай продлевать её каждый день.',
          'Что сегодня на полке книг? Отметь прочитанные страницы и поставь оценку.',
        ],
      },
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
      'rize-purple-mist':     { type: 'anime', hair: '#9333ea', hairDark: '#581c87', eye: '#a855f7', style: 'long', glasses: true, choker: '#09090b', shirt: '#f8fafc', shadowVeil: true },
      'columbina-moon':       { type: 'anime', hair: '#1e1b2e', hairDark: '#0f0d1a', eye: '#ec4899', style: 'long', dipDye: '#ec4899', shirt: '#e0f2fe', angelHeadWings: true, laceMask: true },
      'miku-morning-coffee':  { type: 'anime', hair: '#2dd4bf', hairDark: '#0d9488', eye: '#0284c7', style: 'twintails', bows: '#ffffff', shirt: '#fff1f2', coffeeCup: true },
      'winter-snow-miku':     { type: 'anime', hair: '#5eead4', hairDark: '#0f766e', eye: '#10b981', style: 'twintails', shirt: '#fef3c7', winterEarmuffs: true, winterScarf: true },
      'miku-chill-room':      { type: 'anime', hair: '#38bdf8', hairDark: '#0284c7', eye: '#0891b2', style: 'twintails', bows: '#ffffff', shirt: '#18181b', heartShirt: true, lollipop: true },
      'white-sakura-ruby':    { type: 'anime', hair: '#f8fafc', hairDark: '#cbd5e1', eye: '#e11d74', style: 'long', shirt: '#fff1f5', collar: true, sakuraPin: true },
      'bocchi-rock':          { type: 'anime', hair: '#f472b6', hairDark: '#db2777', eye: '#0ea5e9', style: 'long', shirt: '#ec4899', bocchiCubes: true, guitarHead: true },
      'midnight-miku-lofi':   { type: 'anime', hair: '#64748b', hairDark: '#334155', eye: '#475569', style: 'twintails', bows: '#0f172a', shirt: '#0f172a', moonBadge: true },
      'neko-heterochromia':   { type: 'anime', hair: '#0ea5e9', hairDark: '#0369a1', eye: '#2563eb', eyeRight: '#f59e0b', style: 'neko', earInner: '#e0f2fe', maidBows: '#e11d48', shirt: '#0f172a', glassOrbs: true },
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

function buildUniqueChibiInner(type, mood, skinObj) {
      if (skinObj && skinObj.customAvatar) {
        const ringColor = (skinObj.colors && skinObj.colors.pink) || '#e11d74';
        return `
          <defs>
            <clipPath id="customAvClip"><rect x="3" y="3" width="34" height="34" rx="9"/></clipPath>
          </defs>
          <g class="chibi-body-breath">
            <rect x="2.2" y="2.2" width="35.6" height="35.6" rx="10" fill="none" stroke="${ringColor}" stroke-width="${mood === 'happy' ? '2.2' : '1.4'}" opacity="0.85"/>
            <image href="${skinObj.customAvatar}" x="3" y="3" width="34" height="34" preserveAspectRatio="xMidYMid slice" clip-path="url(#customAvClip)"/>
            ${mood === 'happy' ? `<circle cx="33" cy="7" r="2.2" fill="#facc15"/><path d="M33 3.5 L33 10.5 M29.5 7 L36.5 7" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round"/>` : ''}
          </g>
        `;
      }

      const isHappy = mood === 'happy';
      const isFocus = mood === 'focus';
      const isSleepy = mood === 'sleepy';

      const sparkOverlay = isHappy
        ? `<g class="chibi-ear-sway">
             <path d="M5.5 6.5 L6.3 8.4 L8.2 9.2 L6.3 10 L5.5 11.9 L4.7 10 L2.8 9.2 L4.7 8.4 Z" fill="#fde047" opacity="0.92"/>
             <path d="M34.5 5.5 L35.1 6.9 L36.5 7.5 L35.1 8.1 L34.5 9.5 L33.9 8.1 L32.5 7.5 L33.9 6.9 Z" fill="#ffffff" opacity="0.9"/>
           </g>`
        : isFocus
        ? `<circle cx="20" cy="20" r="18.2" fill="none" stroke="currentColor" stroke-width="0.9" stroke-dasharray="3 3" opacity="0.45"/>`
        : '';

      if (type === 'terrorblade') {
        // Террорблейд 3.0: многогранные демонические рога с багровыми прожилками, сегментированные крылья, доспех с кристаллом души и лепестки сакуры
        const eyes = isHappy
          ? `<path d="M14.8 18.8 Q16.8 16.4 18.8 18.8" fill="none" stroke="#fff1f5" stroke-width="1.7" stroke-linecap="round"/>
             <path d="M21.2 18.8 Q23.2 16.4 25.2 18.8" fill="none" stroke="#fff1f5" stroke-width="1.7" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <path d="M14.2 17.3 L19.1 18.9 L15.4 20.3 L13.8 18.6 Z" fill="#fb7185"/>
               <path d="M15.1 17.9 L18.5 18.9 L15.7 19.7 Z" fill="#fff1f5"/>
               <rect x="16.5" y="17.9" width="0.8" height="1.7" rx="0.4" fill="#881337"/>
               <path d="M25.8 17.3 L20.9 18.9 L24.6 20.3 L26.2 18.6 Z" fill="#fb7185"/>
               <path d="M24.9 17.9 L21.5 18.9 L24.3 19.7 Z" fill="#fff1f5"/>
               <rect x="22.7" y="17.9" width="0.8" height="1.7" rx="0.4" fill="#881337"/>
             </g>`;
        return `
          <defs>
            <linearGradient id="tbHornG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3a242b"/>
              <stop offset="100%" stop-color="#120c0e"/>
            </linearGradient>
            <linearGradient id="tbGemG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#fda4af"/>
              <stop offset="50%" stop-color="#e11d48"/>
              <stop offset="100%" stop-color="#881337"/>
            </linearGradient>
          </defs>
          <g class="chibi-body-breath">
            <ellipse cx="6" cy="7.2" rx="2.2" ry="1.05" transform="rotate(-28 6 7.2)" fill="#f472b6" opacity="0.8"/>
            <ellipse cx="34.2" cy="9.2" rx="2.1" ry="1" transform="rotate(32 34.2 9.2)" fill="#fda4af" opacity="0.82"/>
            <ellipse cx="8.2" cy="33.5" rx="1.6" ry="0.8" transform="rotate(18 8.2 33.5)" fill="#fb7185" opacity="0.65"/>
            <g class="chibi-hair-sway">
              <!-- Демонические крылья с гранями -->
              <path d="M13 31 C5.5 25.5 3.2 14.5 6.4 5.5 C8 11 10.2 14.2 13 17.8 C10.8 21 10.8 25 14 29 Z" fill="#1e1518" stroke="#fb7185" stroke-width="0.45" stroke-opacity="0.55"/>
              <path d="M4.8 16.5 L1.5 13.2 L6.5 14 Z M6.2 23.5 L2.2 24.2 L7.1 21 Z" fill="#120c0e"/>
              <path d="M7.5 11.5 Q9.8 17 12.2 23" fill="none" stroke="#f43f5e" stroke-width="0.65" opacity="0.6"/>
              <path d="M27 31 C34.5 25.5 36.8 14.5 33.6 5.5 C32 11 29.8 14.2 27 17.8 C29.2 21 29.2 25 26 29 Z" fill="#1e1518" stroke="#fb7185" stroke-width="0.45" stroke-opacity="0.55"/>
              <path d="M35.2 16.5 L38.5 13.2 L33.5 14 Z M33.8 23.5 L37.8 24.2 L32.9 21 Z" fill="#120c0e"/>
              <path d="M32.5 11.5 Q30.2 17 27.8 23" fill="none" stroke="#f43f5e" stroke-width="0.65" opacity="0.6"/>
            </g>
            <!-- Нагрудный доспех и наплечники -->
            <path d="M9.5 38.5 L12.5 27.5 L20 29.5 L27.5 27.5 L30.5 38.5 Z" fill="#161012" stroke="#3f2e34" stroke-width="0.7"/>
            <path d="M9 29.5 L14.5 26.8 L15.5 30.8 L10.2 32.5 Z M31 29.5 L25.5 26.8 L24.5 30.8 L29.8 32.5 Z" fill="#261b1f" stroke="#fda4af" stroke-width="0.4" stroke-opacity="0.5"/>
            <polygon points="20,27.2 24.4,31.6 20,37.6 15.6,31.6" fill="url(#tbGemG)" stroke="#ffe4e6" stroke-width="0.55"/>
            <polygon points="20,28.8 22.3,31.6 20,35.2 17.7,31.6" fill="#fff1f2" opacity="0.85"/>
            <!-- Голова и массивные изогнутые рога -->
            <path d="M13.8 21 L12.6 12.6 C10.8 6.8 12.2 2.8 14.8 0.8 C14.8 5.6 16.3 9.8 18.4 13.6 L20 10.6 L21.6 13.6 C23.7 9.8 25.2 5.6 25.2 0.8 C27.8 2.8 29.2 6.8 27.4 12.6 L26.2 21 C24.6 25.3 22.2 27.4 20 27.4 C17.8 27.4 15.4 25.3 13.8 21 Z" fill="url(#tbHornG)" stroke="#4c323b" stroke-width="0.6"/>
            <!-- Энергетические прожилки на рогах и лбу -->
            <path d="M14.3 3.5 C14.3 7.5 15.6 11.2 17.5 14.5 M25.7 3.5 C25.7 7.5 24.4 11.2 22.5 14.5" fill="none" stroke="#fb7185" stroke-width="0.85" stroke-linecap="round" opacity="0.85"/>
            <path d="M20 12.4 L21.1 15.2 L20 17.4 L18.9 15.2 Z" fill="#f43f5e" opacity="0.85"/>
            <!-- Лицевая маска и свечение глаз -->
            <path d="M15.2 21.5 L17.5 25.5 L20 26.8 L22.5 25.5 L24.8 21.5" fill="none" stroke="#3f2b32" stroke-width="0.75"/>
            <ellipse cx="20" cy="18.8" rx="5.4" ry="3.1" fill="#f43f5e" opacity="0.24"/>
            ${eyes}
            ${sparkOverlay}
          </g>
        `;
      }

      if (type === 'vergil') {
        // Вергилий 3.0: детальная рукоять Ямато с оплёткой цука-ито, плащ с вышивкой, объёмные серебристые пряди и стальной взгляд
        const eyes = isHappy
          ? `<path d="M12.8 20.6 Q15.1 18.2 17.4 20.6" fill="none" stroke="#0f172a" stroke-width="1.7" stroke-linecap="round"/>
             <path d="M22.6 20.6 Q24.9 18.2 27.2 20.6" fill="none" stroke="#0f172a" stroke-width="1.7" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <rect x="13" y="19.1" width="4.3" height="2.8" rx="1.2" fill="#0284c7"/>
               <rect x="13.4" y="19.7" width="3.5" height="1.9" rx="0.9" fill="#38bdf8"/>
               <circle cx="15.2" cy="20.4" r="0.9" fill="#0f172a"/>
               <circle cx="15.9" cy="19.8" r="0.65" fill="#ffffff"/>
               <circle cx="14.2" cy="21.1" r="0.35" fill="#e0f2fe"/>
               <rect x="22.7" y="19.1" width="4.3" height="2.8" rx="1.2" fill="#0284c7"/>
               <rect x="23.1" y="19.7" width="3.5" height="1.9" rx="0.9" fill="#38bdf8"/>
               <circle cx="24.8" cy="20.4" r="0.9" fill="#0f172a"/>
               <circle cx="25.5" cy="19.8" r="0.65" fill="#ffffff"/>
               <circle cx="23.8" cy="21.1" r="0.35" fill="#e0f2fe"/>
               <path d="M12.2 17.5 L17.7 18.6 M27.8 17.5 L22.3 18.6" stroke="#334155" stroke-width="1.35" stroke-linecap="round"/>
             </g>`;
        return `
          <defs>
            <linearGradient id="vgHairG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f8fafc"/>
              <stop offset="65%" stop-color="#cbd5e1"/>
              <stop offset="100%" stop-color="#94a3b8"/>
            </linearGradient>
            <linearGradient id="vgCoatG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0f172a"/>
              <stop offset="50%" stop-color="#1e3a5f"/>
              <stop offset="100%" stop-color="#090d16"/>
            </linearGradient>
          </defs>
          <g class="chibi-body-breath">
            <!-- Катана Ямато за плечом с ромбовидной оплёткой и золотой цубой -->
            <g class="chibi-ear-sway">
              <line x1="5" y1="7.5" x2="35.5" y2="33.5" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
              <line x1="5" y1="7.5" x2="12.6" y2="14" stroke="#f8fafc" stroke-width="2.6" stroke-linecap="round"/>
              <path d="M6.2 8.5 L7.5 9.6 M8.2 10.2 L9.5 11.3 M10.2 11.9 L11.5 13" stroke="#334155" stroke-width="0.9"/>
              <line x1="11.2" y1="16.4" x2="14.8" y2="12.2" stroke="#eab308" stroke-width="1.8" stroke-linecap="round"/>
            </g>
            <!-- Плащ Вергилия с высоким воротником и серебряным узором -->
            <path d="M9.5 38.5 L12.8 27.5 L27.2 27.5 L30.5 38.5 Z" fill="url(#vgCoatG)" stroke="#38bdf8" stroke-width="0.5" stroke-opacity="0.5"/>
            <path d="M17.2 28.5 L20 33.8 L22.8 28.5 Z" fill="#38bdf8" opacity="0.85"/>
            <path d="M11.6 32.5 L14.2 24.5 L17.5 29.8 Z M28.4 32.5 L25.8 24.5 L22.5 29.8 Z" fill="#1e293b" stroke="#cbd5e1" stroke-width="0.75"/>
            <!-- Шея и лицо с тенью подбородка -->
            <rect x="17.8" y="26.5" width="4.4" height="3.5" rx="1" fill="#dfc7bc"/>
            <path d="M10.8 18.8 C10.8 26.2 14.8 30.2 20 30.2 C25.2 30.2 29.2 26.2 29.2 18.8 C29.2 12 25.2 9.2 20 9.2 C14.8 9.2 10.8 12 10.8 18.8 Z" fill="#f5e6de"/>
            <path d="M11.5 22.5 C13 27.8 16.5 29.6 20 29.6 C23.5 29.6 27 27.8 28.5 22.5 C27 26.6 23.5 28.3 20 28.3 C16.5 28.3 13 26.6 11.5 22.5 Z" fill="#d9beb2" opacity="0.65"/>
            <!-- Зачёсанные серебристые волосы с прядями -->
            <g class="chibi-hair-sway">
              <path d="M9.8 18.8 C9.2 10.6 13.5 5.6 20 5.2 C26.5 5.6 30.8 10.6 30.2 18.8 L28.2 12.4 L25.6 15.8 L23.5 11.2 L20.2 15.2 L17.2 11.2 L14.8 15.6 L12 12.2 Z" fill="url(#vgHairG)" stroke="#64748b" stroke-width="0.6"/>
              <path d="M14 7.8 Q20 5.8 26 7.8 M16.5 10.2 L20 7.2 L23.5 10.2" fill="none" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round" opacity="0.85"/>
            </g>
            ${eyes}
            <path d="M19.7 22.4 L19.3 23.7 L20.4 23.9" fill="none" stroke="#c2a395" stroke-width="0.85" stroke-linecap="round"/>
            <path d="${isHappy ? 'M17.5 25.4 Q20 27.3 22.5 25.4' : 'M17.8 25.9 L22.2 25.7'}" fill="none" stroke="#64748b" stroke-width="1.25" stroke-linecap="round"/>
            ${sparkOverlay}
          </g>
        `;
      }

      if (type === 'marston') {
        // Джон Марстон 3.0: детальная ковбойская шляпа, неоновая бандана, шрамы на щеке, щетина, жилет и золотая звезда шерифа
        const eyes = isHappy
          ? `<path d="M13 21.4 Q15.2 19 17.4 21.4" fill="none" stroke="#18181b" stroke-width="1.7" stroke-linecap="round"/>
             <path d="M22.6 21.4 Q24.8 19 27 21.4" fill="none" stroke="#18181b" stroke-width="1.7" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <rect x="13.2" y="19.8" width="4" height="2.6" rx="1.1" fill="#15803d"/>
               <rect x="13.6" y="20.2" width="3.2" height="1.8" rx="0.8" fill="#22c55e"/>
               <circle cx="15.2" cy="21" r="0.8" fill="#052e16"/>
               <circle cx="15.9" cy="20.4" r="0.6" fill="#fef08a"/>
               <rect x="22.8" y="19.8" width="4" height="2.6" rx="1.1" fill="#15803d"/>
               <rect x="23.2" y="20.2" width="3.2" height="1.8" rx="0.8" fill="#22c55e"/>
               <circle cx="24.8" cy="21" r="0.8" fill="#052e16"/>
               <circle cx="25.5" cy="20.4" r="0.6" fill="#fef08a"/>
               <path d="M12.6 18.5 L17.5 19.2 M27.4 18.5 L22.5 19.2" stroke="#27272a" stroke-width="1.3" stroke-linecap="round"/>
             </g>`;
        return `
          <g class="chibi-body-breath">
            <!-- Звезда шерифа -->
            <polygon points="6.5,7 7.5,9.5 10.2,9.5 8,11.1 8.8,13.6 6.5,12 4.2,13.6 5,11.1 2.8,9.5 5.5,9.5" fill="#facc15" stroke="#ca8a04" stroke-width="0.5" opacity="0.9"/>
            <g class="chibi-hair-sway">
              <path d="M8.5 17 C7 23.2 7 31.2 10.2 35.2 L29.8 35.2 C33 31.2 33 23.2 31.5 17 Z" fill="#181512"/>
            </g>
            <!-- Жилет и алый шейный платок -->
            <path d="M10.8 38.5 L13.8 29.2 L26.2 29.2 L29.2 38.5 Z" fill="#134e4a" stroke="#2dd4bf" stroke-width="0.45" stroke-opacity="0.5"/>
            <path d="M14.2 29.5 L20 35.6 L25.8 29.5 Z" fill="#e11d48" stroke="#fda4af" stroke-width="0.4"/>
            <!-- Лицо, тень щетины и фирменные шрамы -->
            <circle cx="20" cy="21" r="9.7" fill="#e6bea5"/>
            <path d="M11.6 23.5 C12.8 28.4 16.2 30.5 20 30.5 C23.8 30.5 27.2 28.4 28.4 23.5 C26.8 26.8 23.5 28.2 20 28.2 C16.5 28.2 13.2 26.8 11.6 23.5 Z" fill="#785c4a" opacity="0.38"/>
            <path d="M23.8 22.8 L27.2 24.6 M24.8 21.8 L27.6 23.4 M24.5 24.2 L26.6 25.5" stroke="#884a39" stroke-width="0.85" stroke-linecap="round"/>
            ${eyes}
            <path d="${isHappy ? 'M17.6 26 Q20 27.8 22.4 26' : 'M17.8 26.4 L22.2 26.1'}" fill="none" stroke="#5c2415" stroke-width="1.3" stroke-linecap="round"/>
            <!-- Неоново-розовая бандана/повязка и ковбойская шляпа -->
            <path d="M10 14.8 Q20 13.1 30 14.8 L29.5 18.4 Q20 16.9 10.5 18.4 Z" fill="#ec4899" stroke="#f9a8d4" stroke-width="0.45"/>
            <g class="chibi-ear-sway">
              <path d="M29.4 15.6 L36 12.8 L34.4 16.8 Z M29.4 17 L35.2 19.6 L32 20.2 Z" fill="#db2777"/>
            </g>
            <path d="M6.5 14.2 Q20 11.2 33.5 14.2 Q27.5 15.8 20 15.8 Q12.5 15.8 6.5 14.2 Z" fill="#1c1917" stroke="#44403c" stroke-width="0.6"/>
            <path d="M11.2 14 C12.2 8.2 15.6 6.4 20 6.4 C24.4 6.4 27.8 8.2 28.8 14 Z" fill="#292524" stroke="#57534e" stroke-width="0.55"/>
            <path d="M11.4 12.8 Q20 11.6 28.6 12.8" fill="none" stroke="#eab308" stroke-width="1.1"/>
            ${sparkOverlay}
          </g>
        `;
      }

      if (type === 'joker') {
        // Джокер Нуар 3.0: фактурный грим со скулами, многослойные пряди, шрам-улыбка Глазго с деталями, костюм-тройка и карта Джокера с короной
        const eyes = isHappy
          ? `<path d="M12.2 19.6 Q14.8 16.8 17.4 19.6" fill="none" stroke="#fafafa" stroke-width="1.7" stroke-linecap="round"/>
             <path d="M22.6 19.6 Q25.2 16.8 27.8 19.6" fill="none" stroke="#fafafa" stroke-width="1.7" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <ellipse cx="14.9" cy="19.5" rx="1.85" ry="2.05" fill="#fafafa"/>
               <circle cx="15" cy="19.6" r="0.95" fill="#09090b"/>
               <circle cx="15.5" cy="19" r="0.5" fill="#ffffff"/>
               <ellipse cx="25.1" cy="19.5" rx="1.85" ry="2.05" fill="#fafafa"/>
               <circle cx="25" cy="19.6" r="0.95" fill="#09090b"/>
               <circle cx="25.5" cy="19" r="0.5" fill="#ffffff"/>
             </g>`;
        return `
          <defs>
            <linearGradient id="jkFaceG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="75%" stop-color="#e4e4e7"/>
              <stop offset="100%" stop-color="#a1a1aa"/>
            </linearGradient>
          </defs>
          <g class="chibi-body-breath">
            <g class="chibi-hair-sway">
              <path d="M8 14.5 C6 21.8 7 29.8 10.2 33 L29.8 33 C33 29.8 34 21.8 32 14.5 Z" fill="#09090b"/>
            </g>
            <!-- Костюм, лацканы, рубашка и галстук -->
            <path d="M9.5 38.5 L13 28.8 L27 28.8 L30.5 38.5 Z" fill="#09090b" stroke="#3f3f46" stroke-width="0.6"/>
            <path d="M16.2 29.2 L20 36.8 L23.8 29.2 Z" fill="#e4e4e7"/>
            <path d="M13.5 29.2 L17.5 37.5 L15.5 38.5 L12 31 Z M26.5 29.2 L22.5 37.5 L24.5 38.5 L28 31 Z" fill="#18181b" stroke="#52525b" stroke-width="0.45"/>
            <path d="M19.1 30.2 L20.9 30.2 L20.5 37.5 L20 38.3 L19.5 37.5 Z" fill="#27272a"/>
            <!-- Лицо с белым гримом и тенями на скулах -->
            <path d="M10.4 18.6 C10.4 11.6 14.3 8.8 20 8.8 C25.7 8.8 29.6 11.6 29.6 18.6 C29.6 25.2 25.9 30 20 30.4 C14.1 30 10.4 25.2 10.4 18.6 Z" fill="url(#jkFaceG)" stroke="#52525b" stroke-width="0.5"/>
            <path d="M11.6 21.5 Q13.5 24.5 12.8 26.8 M28.4 21.5 Q26.5 24.5 27.2 26.8" fill="none" stroke="#a1a1aa" stroke-width="0.9" stroke-linecap="round"/>
            <!-- Тёмный грим вокруг глаз и ромбы -->
            <path d="M11.3 19.4 C11.5 17 13.4 15.9 15.9 16.7 C17.8 17.4 18.5 19.2 17.8 21.1 C16.7 22.9 13.2 22.7 11.3 19.4 Z" fill="#09090b"/>
            <path d="M28.7 19.4 C28.5 17 26.6 15.9 24.1 16.7 C22.2 17.4 21.5 19.2 22.2 21.1 C23.3 22.9 26.8 22.7 28.7 19.4 Z" fill="#09090b"/>
            <polygon points="14.9,15.2 15.6,16.5 14.2,16.5" fill="#18181b"/>
            <polygon points="25.1,15.2 25.8,16.5 24.4,16.5" fill="#18181b"/>
            ${eyes}
            <!-- Шрам-улыбка Глазго с объёмом -->
            <path d="M11.6 22.8 Q20 30.2 28.4 22.8 Q20 27.5 11.6 22.8 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="0.5"/>
            <path d="M10.6 21.6 Q12.1 23.6 14.2 24.7 M29.4 21.6 Q27.9 23.6 25.8 24.7" fill="none" stroke="#991b1b" stroke-width="1.35" stroke-linecap="round"/>
            <path d="M15.2 24.9 Q20 27.6 24.8 24.9" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
            <!-- Взъерошенные пряди волос -->
            <g class="chibi-hair-sway">
              <path d="M9.4 17.2 C9.4 9.5 14.1 6.5 20 6.5 C25.9 6.5 30.6 9.5 30.6 17.2 L28.2 12.2 L26 20.1 L23.4 12.1 L20.3 18.8 L17.5 11.8 L14.2 19.8 L11.8 12.5 Z" fill="#18181b" stroke="#3f3f46" stroke-width="0.45"/>
              <path d="M13.5 9.2 Q20 7.2 26.5 9.2" fill="none" stroke="#52525b" stroke-width="0.8" stroke-linecap="round"/>
            </g>
            <!-- Карта Джокера в руке -->
            <g class="chibi-ear-sway">
              <rect x="29.6" y="26.5" width="7.2" height="10" rx="1.2" transform="rotate(14 33 31)" fill="#fafafa" stroke="#18181b" stroke-width="0.95"/>
              <text x="30.8" y="32.4" font-size="4.6" font-weight="900" fill="#dc2626" transform="rotate(14 33 31)" font-family="sans-serif">J</text>
              <text x="32.2" y="35.3" font-size="4.2" font-weight="900" fill="#09090b" transform="rotate(14 33 31)" font-family="sans-serif">♠</text>
            </g>
            ${sparkOverlay}
          </g>
        `;
      }

      if (type === 'crt') {
        // Мехагенда CRT 3.0: бронированный корпус монитора с заклёпками, сканлайнами, армированными шлангами и биомех-черепом с оптикой
        const eyes = isHappy
          ? `<path d="M13.8 18.6 Q16 16.2 18.2 18.6" fill="none" stroke="#f59e0b" stroke-width="1.7" stroke-linecap="round"/>
             <path d="M21.8 18.6 Q24 16.2 26.2 18.6" fill="none" stroke="#f59e0b" stroke-width="1.7" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <circle cx="15.8" cy="18.2" r="2.6" fill="#141612" stroke="#a3b18a" stroke-width="0.7"/>
               <circle cx="15.8" cy="18.2" r="1.5" fill="#d97706"/>
               <circle cx="16.2" cy="17.8" r="0.55" fill="#fef08a"/>
               <circle cx="24.2" cy="18.2" r="2.6" fill="#141612" stroke="#a3b18a" stroke-width="0.7"/>
               <circle cx="24.2" cy="18.2" r="1.5" fill="#d97706"/>
               <circle cx="24.6" cy="17.8" r="0.55" fill="#fef08a"/>
             </g>`;
        return `
          <g class="chibi-body-breath">
            <!-- Армированные биомех-шланги -->
            <g class="chibi-hair-sway">
              <path d="M3 14.5 Q5.5 14.5 6.5 16 M2.5 21.5 Q5.5 21.5 6.5 22.5 M37 14.5 Q34.5 14.5 33.5 16 M37.5 21.5 Q34.5 21.5 33.5 22.5 M13.5 33 L12 38.5 M20 33 L20 38.5 M26.5 33 L28 38.5" fill="none" stroke="#78716c" stroke-width="2" stroke-linecap="round"/>
            </g>
            <!-- Бронированный корпус ЭЛТ -->
            <rect x="6" y="6" width="28" height="27" rx="4" fill="#4b5245" stroke="#a3b18a" stroke-width="1.2"/>
            <circle cx="8.2" cy="8.2" r="0.7" fill="#a3b18a"/><circle cx="31.8" cy="8.2" r="0.7" fill="#a3b18a"/>
            <!-- Экран со сканлайнами -->
            <rect x="8.8" y="9.2" width="22.4" height="18.2" rx="2.4" fill="#111410" stroke="#2b3027" stroke-width="0.9"/>
            <path d="M9.5 12.5 L30.5 12.5 M9.5 16 L30.5 16 M9.5 19.5 L30.5 19.5 M9.5 23 L30.5 23" stroke="#a3b18a" stroke-width="0.35" opacity="0.25"/>
            <!-- Биомеханический череп внутри экрана -->
            <path d="M12.4 17.8 C12.4 12.4 27.6 12.4 27.6 17.8 C27.6 21.4 25 23 23.6 23.6 L23.3 26 L16.7 26 L16.4 23.6 C15 23 12.4 21.4 12.4 17.8 Z" fill="#cfd8c4" stroke="#6b7561" stroke-width="0.6"/>
            <line x1="18.2" y1="23.8" x2="18.2" y2="25.8" stroke="#111410" stroke-width="0.75"/>
            <line x1="20" y1="23.8" x2="20" y2="25.8" stroke="#111410" stroke-width="0.75"/>
            <line x1="21.8" y1="23.8" x2="21.8" y2="25.8" stroke="#111410" stroke-width="0.75"/>
            ${eyes}
            <polygon points="20,19.8 21.3,22.3 18.7,22.3" fill="#111410"/>
            <!-- Панель приборов снизу -->
            <g class="chibi-ear-sway">
              <circle cx="11.2" cy="30.2" r="1.35" fill="#22c55e"/>
              <circle cx="15" cy="30.2" r="1.05" fill="#f59e0b"/>
            </g>
            <rect x="21.5" y="29.3" width="7.5" height="1.8" rx="0.9" fill="#1c2019"/>
            ${sparkOverlay}
          </g>
        `;
      }

      if (type === 'poker') {
        // Розовый Покер 3.0: веер из трёх неоновых карт, гранёная пиковая масть с короной и глазами, золотистые искры
        const eyes = isHappy
          ? `<path d="M15.2 20.6 Q17 18.5 18.8 20.6" fill="none" stroke="#140b18" stroke-width="1.6" stroke-linecap="round"/>
             <path d="M21.2 20.6 Q23 18.5 24.8 20.6" fill="none" stroke="#140b18" stroke-width="1.6" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <circle cx="17" cy="20.5" r="1.6" fill="#140b18"/>
               <circle cx="17.5" cy="19.9" r="0.6" fill="#ffffff"/>
               <circle cx="23" cy="20.5" r="1.6" fill="#140b18"/>
               <circle cx="23.5" cy="19.9" r="0.6" fill="#ffffff"/>
             </g>`;
        return `
          <defs>
            <linearGradient id="pkSpadeG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#f9a8d4"/>
              <stop offset="50%" stop-color="#ec4899"/>
              <stop offset="100%" stop-color="#be185d"/>
            </linearGradient>
          </defs>
          <g class="chibi-body-breath">
            <rect x="4.5" y="7.5" width="18" height="25" rx="2.6" transform="rotate(-16 13.5 20)" fill="#2e1035" stroke="#c084fc" stroke-width="0.9" opacity="0.78"/>
            <rect x="17.5" y="7.5" width="18" height="25" rx="2.6" transform="rotate(14 26.5 20)" fill="#2e1035" stroke="#f472b6" stroke-width="0.9" opacity="0.78"/>
            <rect x="9" y="5" width="22" height="30" rx="3.2" fill="#120917" stroke="#f472b6" stroke-width="1.5"/>
            <rect x="10.8" y="6.8" width="18.4" height="26.4" rx="2" fill="none" stroke="#e879f9" stroke-width="0.5" stroke-opacity="0.6"/>
            <text x="11.8" y="12.2" font-size="5.6" font-weight="900" fill="#f472b6" font-family="sans-serif">A♠</text>
            <g class="chibi-hair-sway">
              <!-- Корона над мастью -->
              <polygon points="16.5,12 18.2,9.2 20,11.2 21.8,9.2 23.5,12" fill="#facc15"/>
              <path d="M20 12.2 C15.8 16.6 12.2 19.6 12.2 23 C12.2 25.5 14.3 27.1 16.7 27.1 C18 27.1 19 26.5 19.5 25.7 L18.3 29.4 L21.7 29.4 L20.5 25.7 C21 26.5 22 27.1 23.3 27.1 C25.7 27.1 27.8 25.5 27.8 23 C27.8 19.6 24.2 16.6 20 12.2 Z" fill="url(#pkSpadeG)" stroke="#fce7f3" stroke-width="0.5"/>
            </g>
            ${eyes}
            <g class="chibi-ear-sway">
              <text x="23.2" y="32.2" font-size="5.6" font-weight="900" fill="#e879f9" font-family="sans-serif">♥A</text>
            </g>
            ${sparkOverlay}
          </g>
        `;
      }

      if (type === 'minimal') {
        // Строгий минимализм 3.0: швейцарская геометрия, костюм с галстуком, очки в тонкой оправе и чистые линии
        const eyes = isHappy
          ? `<path d="M13.5 19.4 Q15.4 17.2 17.3 19.4" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>
             <path d="M22.7 19.4 Q24.6 17.2 26.5 19.4" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>`
          : `<g class="chibi-eyes-blink">
               <circle cx="15.4" cy="19.2" r="1.75" fill="#18181b"/>
               <circle cx="15.9" cy="18.7" r="0.55" fill="#ffffff"/>
               <circle cx="24.6" cy="19.2" r="1.75" fill="#18181b"/>
               <circle cx="25.1" cy="18.7" r="0.55" fill="#ffffff"/>
             </g>`;
        return `
          <g class="chibi-body-breath">
            <circle cx="20" cy="20" r="16.5" fill="none" stroke="#18181b" stroke-width="0.6" stroke-dasharray="2 2" opacity="0.4"/>
            <path d="M11 37 C11 31 29 31 29 37 Z" fill="#18181b"/>
            <path d="M17.5 31.5 L20 36.2 L22.5 31.5 Z" fill="#ffffff"/>
            <line x1="20" y1="32.2" x2="20" y2="36.5" stroke="#18181b" stroke-width="1.2"/>
            <circle cx="20" cy="19.2" r="10.8" fill="#ffffff" stroke="#18181b" stroke-width="1.6"/>
            <rect x="12.4" y="16.8" width="6" height="4.6" rx="1.4" fill="none" stroke="#18181b" stroke-width="1"/>
            <rect x="21.6" y="16.8" width="6" height="4.6" rx="1.4" fill="none" stroke="#18181b" stroke-width="1"/>
            <line x1="18.4" y1="19" x2="21.6" y2="19" stroke="#18181b" stroke-width="1"/>
            ${eyes}
            <path d="${isHappy ? 'M16.8 24.2 Q20 26.8 23.2 24.2' : 'M17.6 24.6 Q20 25.8 22.4 24.6'}" fill="none" stroke="#18181b" stroke-width="1.35" stroke-linecap="round"/>
            ${sparkOverlay}
          </g>
        `;
      }

      // ================= 9 ДЕТАЛИЗИРОВАННЫХ АНИМЕ-ПЕРСОНАЖЕЙ 3.0 =================
      const cfg = type;
      const uid = (cfg.hair || '#18181b').replace(/[^a-z0-9]/gi, '') + (cfg.eye || '').replace(/[^a-z0-9]/gi, '');

      const backHair =
        cfg.style === 'twintails'
          ? `<g class="chibi-hair-sway">
               <path d="M8.5 14 C2.5 17.5 2.5 30 6.5 36.8 C9.8 33.5 10.2 24.5 12.2 19.5 Z" fill="${cfg.hairDark}" stroke="${cfg.hair}" stroke-width="0.5"/>
               <path d="M31.5 14 C37.5 17.5 37.5 30 33.5 36.8 C30.2 33.5 29.8 24.5 27.8 19.5 Z" fill="${cfg.hairDark}" stroke="${cfg.hair}" stroke-width="0.5"/>
               <path d="M6.2 22 Q5 28 7.2 33 M33.8 22 Q35 28 32.8 33" fill="none" stroke="${cfg.hair}" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>
               ${cfg.bows ? `<path d="M7 13.5 L11.5 15.5 L7 17.5 Z M12 13.5 L7.5 15.5 L12 17.5 Z" fill="${cfg.bows}"/><circle cx="9.5" cy="15.5" r="1.4" fill="#ffffff" opacity="0.6"/>
                              <path d="M28 13.5 L32.5 15.5 L28 17.5 Z M33 13.5 L28.5 15.5 L33 17.5 Z" fill="${cfg.bows}"/><circle cx="30.5" cy="15.5" r="1.4" fill="#ffffff" opacity="0.6"/>` : ''}
               ${cfg.skullClips ? `<g>
                 <circle cx="9.2" cy="13.8" r="2.8" fill="#ffffff" stroke="#18181b" stroke-width="0.8"/>
                 <rect x="8.1" y="15.5" width="2.2" height="1.4" rx="0.4" fill="#ffffff" stroke="#18181b" stroke-width="0.6"/>
                 <circle cx="8.3" cy="13.7" r="0.75" fill="#18181b"/><circle cx="10.1" cy="13.7" r="0.75" fill="#18181b"/>
                 <circle cx="30.8" cy="13.8" r="2.8" fill="#ffffff" stroke="#18181b" stroke-width="0.8"/>
                 <rect x="29.7" y="15.5" width="2.2" height="1.4" rx="0.4" fill="#ffffff" stroke="#18181b" stroke-width="0.6"/>
                 <circle cx="29.9" cy="13.7" r="0.75" fill="#18181b"/><circle cx="31.7" cy="13.7" r="0.75" fill="#18181b"/>
               </g>` : ''}
             </g>`
          : cfg.style === 'long' || cfg.style === 'neko'
          ? `<g class="chibi-hair-sway">
               <path d="M8.2 13.5 C6 22 6.2 33.5 9.6 38 L30.4 38 C33.8 33.5 34 22 31.8 13.5 Z" fill="${cfg.hairDark}"/>
               <path d="M8.8 21 Q7.8 29 10.4 36 M31.2 21 Q32.2 29 29.6 36" fill="none" stroke="${cfg.hair}" stroke-width="0.9" stroke-linecap="round" opacity="0.65"/>
             </g>`
          : `<g class="chibi-hair-sway">
               <path d="M9.2 14.5 C7.2 22 7.8 29.5 11.2 31.8 L28.8 31.8 C32.2 29.5 32.8 22 30.8 14.5 Z" fill="${cfg.hairDark}"/>
               ${cfg.dipDye ? `<path d="M8.6 25.2 L11.5 31.6 L14.2 27.2 Z M31.4 25.2 L28.5 31.6 L25.8 27.2 Z" fill="${cfg.dipDye}"/>` : ''}
             </g>`;

      const batWings = cfg.batWings
        ? `<g class="chibi-hair-sway">
             <path d="M11 26.5 L2 19.5 L4.2 25.2 L2.5 28.8 L6.8 28.2 L11 30.5 Z M29 26.5 L38 19.5 L35.8 25.2 L37.5 28.8 L33.2 28.2 L29 30.5 Z" fill="#18111a" stroke="#f472b6" stroke-width="0.55"/>
           </g>`
        : '';

      const catTail = cfg.catTail
        ? `<path class="chibi-ear-sway" d="M30.5 35.5 C37.5 33.5 38.5 25.5 34.2 21.5" fill="none" stroke="${cfg.hairDark}" stroke-width="2.8" stroke-linecap="round"/>`
        : '';

      const elfEars = cfg.elfEars
        ? `<g>
             <path d="M10.5 20.2 L3.8 17.8 L9.8 23.6 Z M29.5 20.2 L36.2 17.8 L30.2 23.6 Z" fill="#ffe7dc" stroke="#f472b6" stroke-width="0.6"/>
             <circle cx="5.6" cy="20.6" r="0.85" fill="#f472b6"/><circle cx="34.4" cy="20.6" r="0.85" fill="#f472b6"/>
           </g>`
        : '';

      const headAcc =
        cfg.style === 'neko'
          ? `<g class="chibi-ear-sway">
               <path d="M9.6 14.2 L7.2 3.2 L17.2 9.8 Z" fill="${cfg.hairDark}" stroke="${cfg.hair}" stroke-width="0.6"/>
               <path d="M10.8 12.4 L9.4 5.8 L15.6 10 Z" fill="${cfg.earInner || '#f472b6'}"/>
               <path d="M10.6 12.2 L12.8 9.6 M11.8 12.6 L14 10.6" stroke="#ffffff" stroke-width="0.65" stroke-linecap="round" opacity="0.8"/>
               <path d="M30.4 14.2 L32.8 3.2 L22.8 9.8 Z" fill="${cfg.hairDark}" stroke="${cfg.hair}" stroke-width="0.6"/>
               <path d="M29.2 12.4 L30.6 5.8 L24.4 10 Z" fill="${cfg.earInner || '#f472b6'}"/>
               <path d="M29.4 12.2 L27.2 9.6 M28.2 12.6 L26 10.6" stroke="#ffffff" stroke-width="0.65" stroke-linecap="round" opacity="0.8"/>
               ${cfg.maidCrown ? `<path d="M12 11.2 Q20 6.8 28 11.2" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
                                   <path d="M12.5 11.2 Q20 7.2 27.5 11.2" fill="none" stroke="#f472b6" stroke-width="0.7" stroke-dasharray="1.5 1.5"/>` : ''}
               ${cfg.maidBows ? `<circle cx="11.8" cy="11.4" r="2" fill="${cfg.maidBows}"/><circle cx="28.2" cy="11.4" r="2" fill="${cfg.maidBows}"/>` : ''}
             </g>`
          : cfg.cyberHorns
          ? `<g class="chibi-ear-sway">
               <path d="M10.8 13.2 L7.8 4.2 L15.8 9.8 Z M29.2 13.2 L32.2 4.2 L24.2 9.8 Z" fill="#18181b" stroke="#ec4899" stroke-width="1.1"/>
               <line x1="9.6" y1="7.5" x2="13.5" y2="10.2" stroke="#22d3ee" stroke-width="0.9"/>
               <line x1="30.4" y1="7.5" x2="26.5" y2="10.2" stroke="#22d3ee" stroke-width="0.9"/>
             </g>`
          : cfg.maidCrown
          ? `<g class="chibi-ear-sway">
               <path d="M11.8 11.2 Q20 6.8 28.2 11.2" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
               <circle cx="11.8" cy="11.4" r="1.7" fill="#18181b" stroke="#2dd4bf" stroke-width="0.6"/>
               <circle cx="28.2" cy="11.4" r="1.7" fill="#18181b" stroke="#2dd4bf" stroke-width="0.6"/>
             </g>`
          : cfg.bows
          ? `<g class="chibi-ear-sway">
               <path d="M12.5 10.5 C10.5 6.5 11.5 4.2 13.5 3.5 C13.2 6.2 14 8.5 15.5 9.8 Z M27.5 10.5 C29.5 6.5 28.5 4.2 26.5 3.5 C26.8 6.2 26 8.5 24.5 9.8 Z" fill="#1f1224" stroke="#f472b6" stroke-width="0.6"/>
             </g>`
          : '';

      const eyes = isHappy
        ? `<g>
             <path d="M12.6 20.8 Q15.1 17.6 17.6 20.8" fill="none" stroke="#18181b" stroke-width="1.85" stroke-linecap="round"/>
             <path d="M22.4 20.8 Q24.9 17.6 27.4 20.8" fill="none" stroke="#18181b" stroke-width="1.85" stroke-linecap="round"/>
           </g>`
        : isSleepy
        ? `<g>
             <path d="M12.8 21.4 Q15.1 22.8 17.4 21.4" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>
             <path d="M22.6 21.4 Q24.9 22.8 27.2 21.4" fill="none" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>
           </g>`
        : `<g class="chibi-eyes-blink">
             <!-- Левый глаз с ресницами, радужкой, зрачком и двойным бликом -->
             <ellipse cx="15.1" cy="21" rx="2.45" ry="2.85" fill="#ffffff"/>
             <ellipse cx="15.1" cy="21.1" rx="2.15" ry="2.55" fill="${cfg.eye}"/>
             <path d="M13 19.6 Q15.1 18.2 17.2 19.6 L17.2 21 Q15.1 20.2 13 21 Z" fill="#09090b" opacity="0.35"/>
             <circle cx="15.1" cy="21.3" r="1.05" fill="#09090b"/>
             <circle cx="15.9" cy="19.9" r="0.9" fill="#ffffff"/>
             <circle cx="14.3" cy="22.3" r="0.45" fill="#ffffff" opacity="0.9"/>
             <path d="M12.4 19.3 Q15.1 17.7 17.7 19.2" fill="none" stroke="#18181b" stroke-width="1.25" stroke-linecap="round"/>
             <!-- Правый глаз (с поддержкой гетерохромии eyeRight) -->
             <ellipse cx="24.9" cy="21" rx="2.45" ry="2.85" fill="#ffffff"/>
             <ellipse cx="24.9" cy="21.1" rx="2.15" ry="2.55" fill="${cfg.eyeRight || cfg.eye}"/>
             <path d="M22.8 19.6 Q24.9 18.2 27 19.6 L27 21 Q24.9 20.2 22.8 21 Z" fill="#09090b" opacity="0.35"/>
             <circle cx="24.9" cy="21.3" r="1.05" fill="#09090b"/>
             <circle cx="25.7" cy="19.9" r="0.9" fill="#ffffff"/>
             <circle cx="24.1" cy="22.3" r="0.45" fill="#ffffff" opacity="0.9"/>
             <path d="M22.3 19.2 Q24.9 17.7 27.6 19.3" fill="none" stroke="#18181b" stroke-width="1.25" stroke-linecap="round"/>
             ${isFocus ? `<path d="M12.3 17.3 L17.6 18.4 M27.7 17.3 L22.4 18.4" stroke="#18181b" stroke-width="1.3" stroke-linecap="round"/>` : `<path d="M13 17.4 Q15.1 16.8 17.1 17.5 M22.9 17.5 Q24.9 16.8 27 17.4" fill="none" stroke="#18181b" stroke-width="0.75" stroke-linecap="round" opacity="0.7"/>`}
           </g>`;

      const glasses = cfg.glasses
        ? `<g>
             <circle cx="15.1" cy="21" r="3.35" fill="rgba(255,255,255,0.12)" stroke="#18181b" stroke-width="1"/>
             <circle cx="24.9" cy="21" r="3.35" fill="rgba(255,255,255,0.12)" stroke="#18181b" stroke-width="1"/>
             <line x1="18.45" y1="21" x2="21.55" y2="21" stroke="#18181b" stroke-width="1"/>
             <line x1="13.2" y1="19.2" x2="14.6" y2="20.6" stroke="#ffffff" stroke-width="0.7" stroke-linecap="round" opacity="0.75"/>
             <line x1="23" y1="19.2" x2="24.4" y2="20.6" stroke="#ffffff" stroke-width="0.7" stroke-linecap="round" opacity="0.75"/>
           </g>`
        : '';

      const extras =
        (cfg.goldPin ? `<g><path d="M9.8 14.5 L12.5 13.2 L11.4 15.8 L13.8 15.8 L10.6 17.6 L11.3 15.3 L9.5 15.5 Z" fill="#f59e0b"/></g>` : '') +
        (cfg.hairCross ? `<g><path d="M25.2 13.4 L28 16.2 M28 13.4 L25.2 16.2" stroke="#ff2e63" stroke-width="1.35" stroke-linecap="round"/>
                              <path d="M11.2 11.2 Q20 7.4 28.8 11.2" fill="none" stroke="#f8fafc" stroke-width="1.9" stroke-linecap="round"/></g>` : '') +
        (cfg.hasCard ? `<g class="chibi-ear-sway"><rect x="29.8" y="26.6" width="6.5" height="9.2" rx="1.1" transform="rotate(14 33 31)" fill="#ffffff" stroke="#e11d48" stroke-width="0.9"/>
                        <text x="31.3" y="32.8" font-size="4.8" font-weight="900" fill="#e11d48" transform="rotate(14 33 31)" font-family="sans-serif">♠</text></g>` : '') +
        (cfg.feather ? `<g class="chibi-ear-sway"><path d="M4.5 10.5 Q6.8 5.2 9.5 11.2 Q6.5 12 4.5 10.5 Z" fill="#0f172a" stroke="#2dd4bf" stroke-width="0.5"/></g>` : '') +
        (cfg.lollipop ? `<g><line x1="21.4" y1="26.2" x2="27.2" y2="29.6" stroke="#ffffff" stroke-width="1.15" stroke-linecap="round"/><circle cx="27.6" cy="29.8" r="1.45" fill="#fb7185" stroke="#ffffff" stroke-width="0.4"/></g>` : '') +
        (cfg.heartShirt ? `<path d="M20 34.4 C19.1 33.3 17.6 33.8 17.6 35 C17.6 36.1 20 37.3 20 37.3 C20 37.3 22.4 36.1 22.4 35 C22.4 33.8 20.9 33.3 20 34.4 Z" fill="#e11d48"/>` : '') +
        (cfg.sakuraPin ? `<g class="chibi-ear-sway">
          <circle cx="11.5" cy="12.2" r="1.6" fill="#fda4af"/><circle cx="13.2" cy="11.4" r="1.6" fill="#f472b6"/><circle cx="13.5" cy="13.2" r="1.6" fill="#fda4af"/><circle cx="11.8" cy="13.9" r="1.6" fill="#f472b6"/><circle cx="10.7" cy="13.1" r="1.5" fill="#fbcfe8"/><circle cx="12.2" cy="12.6" r="0.85" fill="#fef08a"/>
        </g>` : '') +
        (cfg.bocchiCubes ? `<g class="chibi-ear-sway">
          <rect x="8.2" y="15.8" width="3.1" height="3.1" rx="0.6" transform="rotate(-12 9.7 17.3)" fill="#38bdf8" stroke="#0284c7" stroke-width="0.5"/>
          <rect x="8.8" y="18.6" width="3.1" height="3.1" rx="0.6" transform="rotate(8 10.3 20.1)" fill="#facc15" stroke="#ca8a04" stroke-width="0.5"/>
        </g>` : '') +
        (cfg.guitarHead ? `<g class="chibi-ear-sway">
          <path d="M31 28 L35.5 16 L38.2 17.2 L33.5 29.2 Z" fill="#18181b" stroke="#eab308" stroke-width="0.65"/>
          <circle cx="34.2" cy="17.2" r="0.7" fill="#eab308"/><circle cx="33.3" cy="19.5" r="0.7" fill="#eab308"/>
          <circle cx="37.8" cy="18.5" r="0.7" fill="#eab308"/><circle cx="36.9" cy="20.8" r="0.7" fill="#eab308"/>
        </g>` : '') +
        (cfg.moonBadge ? `<g class="chibi-ear-sway">
          <path d="M33.5 6.2 A3.2 3.2 0 1 0 36.8 10.8 A2.5 2.5 0 1 1 33.5 6.2 Z" fill="#93c5fd" opacity="0.88"/>
          <circle cx="6.2" cy="8.2" r="0.85" fill="#e2e8f0" opacity="0.75"/>
        </g>` : '') +
        (cfg.glassOrbs ? `<g class="chibi-ear-sway">
          <circle cx="5.5" cy="9.5" r="2.7" fill="rgba(56,189,248,0.22)" stroke="#7dd3fc" stroke-width="0.65"/><circle cx="4.7" cy="8.6" r="0.65" fill="#ffffff" opacity="0.85"/>
          <circle cx="34.8" cy="28.5" r="2.4" fill="rgba(245,158,11,0.2)" stroke="#fcd34d" stroke-width="0.65"/><circle cx="34.1" cy="27.7" r="0.55" fill="#ffffff" opacity="0.85"/>
        </g>` : '') +
        (cfg.shadowVeil ? `<g class="chibi-hair-sway">
          <path d="M9.8 11 C13.5 11.5 17.5 14 18.8 26.8 C14.5 27.2 10.6 24.5 9.8 18.5 Z" fill="#13091f" opacity="0.84"/>
          <circle cx="14.8" cy="20.8" r="1.45" fill="#e11d48"/><circle cx="15.2" cy="20.4" r="0.5" fill="#ffffff"/>
          <circle cx="6.2" cy="14" r="1.6" fill="#581c87" opacity="0.65"/><circle cx="5.2" cy="21" r="1.2" fill="#3b0764" opacity="0.6"/>
        </g>` : '') +
        (cfg.angelHeadWings ? `<g class="chibi-ear-sway">
          <path d="M9.5 13.5 C4 10.5 2.5 7 3.5 5.2 C6.5 6.2 8.8 8.8 10.5 11.5 Z" fill="#ffffff" stroke="#bfdbfe" stroke-width="0.5"/>
          <path d="M8.8 16 C3.2 14.8 1.8 12.2 2.8 10.5 C5.8 11 8.2 13 9.8 14.8 Z" fill="#f8fafc" stroke="#bfdbfe" stroke-width="0.5"/>
          <path d="M30.5 13.5 C36 10.5 37.5 7 36.5 5.2 C33.5 6.2 31.2 8.8 29.5 11.5 Z" fill="#ffffff" stroke="#bfdbfe" stroke-width="0.5"/>
          <path d="M31.2 16 C36.8 14.8 38.2 12.2 37.2 10.5 C34.2 11 31.8 13 30.2 14.8 Z" fill="#f8fafc" stroke="#bfdbfe" stroke-width="0.5"/>
        </g>` : '') +
        (cfg.laceMask ? `<g>
          <rect x="10.8" y="18.2" width="18.4" height="5.2" rx="2.2" fill="rgba(255,255,255,0.68)" stroke="#e2e8f0" stroke-width="0.6"/>
          <path d="M12.5 18.4 L16 23.2 M16 18.4 L12.5 23.2 M18.2 18.4 L21.8 23.2 M21.8 18.4 L18.2 23.2 M24 18.4 L27.5 23.2 M27.5 18.4 L24 23.2" stroke="#cbd5e1" stroke-width="0.55"/>
          <path d="M10.4 25.2 L12.8 28.2 M12.8 25.2 L10.4 28.2 M27.2 25.2 L29.6 28.2 M29.6 25.2 L27.2 28.2" stroke="#f472b6" stroke-width="0.9" stroke-linecap="round"/>
        </g>` : '') +
        (cfg.coffeeCup ? `<g class="chibi-ear-sway">
          <rect x="27.2" y="28.5" width="6.6" height="6.2" rx="1.5" fill="#ffffff" stroke="#14b8a6" stroke-width="0.8"/>
          <path d="M33.8 29.8 C35.5 29.8 35.5 33.2 33.8 33.2" fill="none" stroke="#14b8a6" stroke-width="0.85"/>
          <ellipse cx="30.5" cy="29.4" rx="2.4" ry="0.8" fill="#78350f"/>
          <path d="M29.4 26.8 Q30 25.2 29.4 24 M31.6 26.8 Q32.2 25.2 31.6 24" fill="none" stroke="#ffffff" stroke-width="0.7" stroke-linecap="round" opacity="0.8"/>
        </g>` : '') +
        (cfg.winterEarmuffs ? `<g class="chibi-ear-sway">
          <path d="M9.2 18.5 C9.2 9.2 14 6.5 20 6.5 C26 6.5 30.8 9.2 30.8 18.5" fill="none" stroke="#fda4af" stroke-width="1.35"/>
          <ellipse cx="8.8" cy="20.4" rx="2.5" ry="3.2" fill="#f472b6" stroke="#fff1f2" stroke-width="0.7"/>
          <ellipse cx="31.2" cy="20.4" rx="2.5" ry="3.2" fill="#f472b6" stroke="#fff1f2" stroke-width="0.7"/>
        </g>` : '') +
        (cfg.winterScarf ? `<g>
          <rect x="13.5" y="28.6" width="13" height="4.2" rx="2" fill="#f472b6" stroke="#db2777" stroke-width="0.55"/>
          <path d="M22.5 31.5 L25.8 37.8 L22.2 38.2 L20.8 32.2 Z" fill="#ec4899"/>
        </g>` : '');

      const mouth = isHappy
        ? `<path d="M17.8 25.1 Q20 28.1 22.2 25.1 Z" fill="#e11d48" stroke="#881337" stroke-width="0.7"/>`
        : `<path d="M18.5 25.8 Q20 26.8 21.5 25.8" fill="none" stroke="#713f47" stroke-width="1.2" stroke-linecap="round"/>`;

      return `
        <g class="chibi-body-breath">
          ${batWings}
          ${backHair}
          ${catTail}
          ${elfEars}
          <!-- Одежда, воротник и украшения -->
          <path d="M11.5 38.5 C11.5 31.2 28.5 31.2 28.5 38.5 Z" fill="${cfg.shirt || '#18181b'}" stroke="rgba(255,255,255,0.18)" stroke-width="0.5"/>
          ${cfg.collar ? `<path d="M15.8 31.5 L20 36.2 L24.2 31.5 Z" fill="#ffffff"/>
                          <path d="M18.2 33.2 L21.8 33.2 L20 36.5 Z" fill="#18181b"/>` : `<path d="M17 31.5 Q20 34.2 23 31.5" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.9"/>`}
          <!-- Шея и чокер -->
          <rect x="18" y="28.6" width="4" height="3.4" rx="1" fill="#f3d2c4"/>
          ${cfg.choker ? `<rect x="17.2" y="29.8" width="5.6" height="1.9" rx="0.9" fill="${cfg.choker}"/>
                          <circle cx="20" cy="31.5" r="0.95" fill="#facc15"/>` : ''}
          <!-- Лицо с объёмной тенью подбородка и под чёлкой -->
          <circle cx="20" cy="20.4" r="10.3" fill="#ffe7dc"/>
          <path d="M11 23 C12.4 28.2 16 30.6 20 30.6 C24 30.6 27.6 28.2 29 23 C27.2 26.8 23.8 28.8 20 28.8 C16.2 28.8 12.8 26.8 11 23 Z" fill="#e8bfb0" opacity="0.65"/>
          <!-- Нежный румянец со штриховкой -->
          <ellipse cx="12.5" cy="23.8" rx="2.3" ry="1.15" fill="#fb7185" opacity="${isHappy ? '0.68' : '0.35'}"/>
          <ellipse cx="27.5" cy="23.8" rx="2.3" ry="1.15" fill="#fb7185" opacity="${isHappy ? '0.68' : '0.35'}"/>
          <circle cx="20" cy="23.3" r="0.55" fill="#d69e8e"/>
          ${eyes}
          ${glasses}
          ${mouth}
          <!-- Боковые локоны и многослойная чёлка с бликовой дугой (angel ring) -->
          <path d="M9.6 18 C9.2 22.8 10 26.8 11.6 28.8 C11.4 24.5 11.4 21 12.2 18 Z M30.4 18 C30.8 22.8 30 26.8 28.4 28.8 C28.6 24.5 28.6 21 27.8 18 Z" fill="${cfg.hair}"/>
          <path d="M9.3 19.2 C9.3 10.8 14.1 8 20 8 C25.9 8 30.7 10.8 30.7 19.2 C28.7 14.8 26.4 13.8 24.2 17.4 L22.2 13.6 L20 17.6 L17.8 13.6 L15.8 17.4 C13.6 13.8 11.3 14.8 9.3 19.2 Z" fill="${cfg.hair}" stroke="${cfg.hairDark}" stroke-width="0.45"/>
          <path d="M13.2 11.8 Q20 9.6 26.8 11.8" fill="none" stroke="#ffffff" stroke-width="1.15" stroke-linecap="round" opacity="0.52"/>
          ${headAcc}
          ${extras}
          ${sparkOverlay}
        </g>
      `;
    }

  function renderChibiMarkup(skinOrId, mood) {
    const isObj = skinOrId && typeof skinOrId === 'object';
    const skinId = isObj ? (skinOrId.chibiKey || skinOrId.id || 'goth-skull') : (skinOrId || 'goth-skull');
    const cfg = CHIBI_THEMES[skinId] || CHIBI_THEMES['goth-skull'];
    const inner = buildUniqueChibiInner(cfg.type === 'anime' ? cfg : cfg.type, mood, isObj ? skinOrId : null);
    return `<svg viewBox="0 0 40 40" aria-hidden="true">${inner}</svg>`;
  }

  global.HelpThemes = {
    DEFAULT_SKINS: SKINS,
    SKINS,
    CHIBI_THEMES,
    getTimeSlot,
    getTimeGreeting,
    renderChibiMarkup,
  };
})(window);
