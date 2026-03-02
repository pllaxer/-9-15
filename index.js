const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TOKEN, { polling: true });

const SEMESTER_START = new Date(2026, 2, 2);

function getWeekType(date) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksPassed = Math.floor((date - SEMESTER_START) / msPerWeek);
  return weeksPassed % 2 === 0 ? 'upper' : 'lower';
}

const schedule = {
  upper: {
    1: ['8:30 — Кураторский час (209)', '9:10 — Основы алгоритмизации и программирования (211)', '10:30 — Операционные системы и среды (207)', '12:00 — Элементы высшей математики (306)'],
    2: ['8:30 — МДК.11.01 Технологии разработки и защиты баз данных (225)', '10:00 — История (306)', '11:40 — Иностранный язык в профессиональной деятельности (317)'],
    3: ['8:30 — Основы алгоритмизации и программирования (211)', '10:00 — Стандартизация, сертификация и техническое документирование (212)', '11:40 — Элементы высшей математики (306)'],
    4: ['8:30 — Основы алгоритмизации и программирования (211)', '10:00 — Компьютерные сети (225)', '11:40 — Физическая культура (Спортзал)'],
    5: ['8:30 — Операционные системы и среды (207)', '10:00 — Стандартизация, сертификация и техническое документирование (212)', '11:40 — МДК.11.01 Технологии разработки и защиты баз данных (225)', '13:20 — Компьютерные сети (225)'],
    6: ['8:30 — Психология общения (306)', '10:00 — Психология общения (306)'],
    0: []
  },
  lower: {
    1: ['8:30 — Кураторский час (209)', '9:10 — Основы алгоритмизации и программирования (211)', '10:30 — Операционные системы и среды (207)', '12:00 — Элементы высшей математики (306)'],
    2: ['8:30 — МДК.11.01 Технологии разработки и защиты баз данных (225)', '10:00 — История (306)', '11:40 — Иностранный язык в профессиональной деятельности (317)'],
    3: ['8:30 — Основы алгоритмизации и программирования (211)', '10:00 — Стандартизация, сертификация и техническое документирование (212)', '11:40 — Элементы высшей математики (306)', '13:20 — Операционные системы и среды (207)'],
    4: ['8:30 — Основы алгоритмизации и программирования (211)', '10:00 — Компьютерные сети (225)', '11:40 — Физическая культура (Спортзал)'],
    5: ['8:30 — Операционные системы и среды (207)', '10:00 — Элементы высшей математики (306)', '11:40 — МДК.11.01 Технологии разработки и защиты баз данных (225)'],
    6: ['8:30 — Психология общения (306)', '10:00 — Компьютерные сети (225)'],
    0: []
  }
};

const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const weekLabel = { upper: '🔼 Верхняя неделя', lower: '🔽 Нижняя неделя' };

// Главное меню с кнопками
const mainMenu = {
  reply_markup: {
    keyboard: [
      [{ text: '📅 Сегодня' }, { text: '🌙 Завтра' }],
      [{ text: '📆 Вся неделя' }, { text: '🔄 Какая неделя?' }]
    ],
    resize_keyboard: true,
    persistent: true
  }
};

function getDaySchedule(date) {
  const dayIndex = date.getDay();
  const weekType = getWeekType(date);
  const pairs = schedule[weekType][dayIndex];

  if (!pairs || pairs.length === 0) {
    return '*' + dayNames[dayIndex] + '* (' + weekLabel[weekType] + ')\n\nВыходной 🎉 Пар нет!';
  }

  const list = pairs.map(function(pair, i) { return (i + 1) + '. ' + pair; }).join('\n');
  return '📚 *' + dayNames[dayIndex] + '* (' + weekLabel[weekType] + ')\n\n' + list;
}

// Автоматические сообщения
cron.schedule('0 7 * * *', function() {
  bot.sendMessage(CHAT_ID, '☀️ Доброе утро!\n\n' + getDaySchedule(new Date()), { parse_mode: 'Markdown' });
}, { timezone: 'Europe/Moscow' });

cron.schedule('0 21 * * *', function() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  bot.sendMessage(CHAT_ID, '🌙 Расписание на завтра:\n\n' + getDaySchedule(tomorrow), { parse_mode: 'Markdown' });
}, { timezone: 'Europe/Moscow' });

// /start — показать меню
bot.onText(/\/start/, function(msg) {
  bot.sendMessage(msg.chat.id,
    '👋 Привет! Я бот расписания.\n\nВыбирай что хочешь узнать 👇',
    mainMenu
  );
});

// Кнопка и команда — сегодня
bot.onText(/\/today|📅 Сегодня/, function(msg) {
  bot.sendMessage(msg.chat.id, getDaySchedule(new Date()), { parse_mode: 'Markdown' });
});

// Кнопка и команда — завтра
bot.onText(/\/tomorrow|🌙 Завтра/, function(msg) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  bot.sendMessage(msg.chat.id, getDaySchedule(tomorrow), { parse_mode: 'Markdown' });
});

// Кнопка и команда — вся неделя
bot.onText(/\/week|📆 Вся неделя/, function(msg) {
  const weekType = getWeekType(new Date());
  let message = '📅 *Расписание на эту неделю*\n' + weekLabel[weekType] + '\n\n';
  [1, 2, 3, 4, 5, 6].forEach(function(dayIndex) {
    const pairs = schedule[weekType][dayIndex];
    if (pairs && pairs.length > 0) {
      message += '*' + dayNames[dayIndex] + ':*\n';
      pairs.forEach(function(pair, i) { message += (i + 1) + '. ' + pair + '\n'; });
      message += '\n';
    }
  });
  bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
});

// Кнопка — какая неделя
bot.onText(/\/weektype|🔄 Какая неделя\?/, function(msg) {
  const weekType = getWeekType(new Date());
  bot.sendMessage(msg.chat.id, 'Сейчас ' + weekLabel[weekType], { parse_mode: 'Markdown' });
});

console.log('Бот запущен ✅');