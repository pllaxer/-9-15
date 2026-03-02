const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const TOKEN = process.env.TOKEN || '8294078013:AAFaPcaDkjrx_fXw5Gqw5zON0btNPHG8KEI';
const CHAT_ID = process.env.CHAT_ID || '822476625';

const bot = new TelegramBot(TOKEN, { polling: true });

// ⚙️ НАСТРОЙКА: укажи какая неделя была в самом начале учёбы (первый понедельник семестра)
// Формат: год, месяц (0-11), день
const SEMESTER_START = new Date(2026, 1, 12); // например 3 февраля 2025 = верхняя неделя

// Функция определяет верхняя или нижняя неделя сейчас
function getWeekType(date) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksPassed = Math.floor((date - SEMESTER_START) / msPerWeek);
  return weeksPassed % 2 === 0 ? 'lower':'upper' ;
}

// 📅 Расписание — заполни под себя!
// upper = верхняя неделя, lower = нижняя
// 1=пн, 2=вт, 3=ср, 4=чт, 5=пт, 6=сб, 0=вс
const schedule = {
  upper: {
    1: [
      '8:30. Кураторский час. (209)',
      '9:10. Основы алгоритмизации и программирования. (211)',
      '10:30. Операционные системы и среды. (207)',
      '12:00. Элементы высшей математики. (306)',
    ],
    2: [
      '8:30. МДК.11.01 Технологии разработки и защиты баз данных. (225)',
      '10:00. История. (306)',
      '11:40. Иностранный язык в профессиональной деятельности. (317)',
    ],
    3: [
      '8:30. Основы алгоритмизации и программирования. (211)',
      '10:00. Стандартизация, сертификация и техническое документирование. (212)',
      '11:40. Элементы высшей математики. (306)',
    ],
    4: [
        '8:30. Основы алгоритмизации и программирования. (211)',
        '10:00. Компьютерные сети. (225)',
        '11:40. Физическая культура / Адаптивная физическая культура. (Спортзал)',
    ],
    5: [
      '8:30. Операционные системы и среды. (207)',
      '10:00. Стандартизация, сертификация и техническое документирование. (212)',
      '11:40. МДК.11.01 Технологии разработки и защиты баз данных. (225)',
      '13:20. Компьютерные сети. (225)',
    ],
    6: [
        '8:30. Психология общения. (306)',
        '10:00. Психология общения. (306)',
    ],
    0: [],
  },
  lower: {
        1: [
      '8:30. Кураторский час. (209)',
      '9:10. Основы алгоритмизации и программирования. (211)',
      '10:30. Операционные системы и среды. (207)',
      '12:00. Элементы высшей математики. (306)',
    ],
    2: [
      '8:30. МДК.11.01 Технологии разработки и защиты баз данных. (225)',
      '10:00. История. (306)',
      '11:40. Иностранный язык в профессиональной деятельности. (317)',
    ],
    3: [
      '8:30. Основы алгоритмизации и программирования. (211)',
      '10:00. Стандартизация, сертификация и техническое документирование. (212)',
      '11:40. Элементы высшей математики. (306)',
      '13:20. Операционные системы и среды. (207)',
    ],
    4: [
        '8:30. Основы алгоритмизации и программирования. (211)',
        '10:00. Компьютерные сети. (225)',
        '11:40. Физическая культура / Адаптивная физическая культура. (Спортзал)',
    ],
    5: [
      '8:30. Операционные системы и среды. (207)',
      '10:00. Элементы высшей математики. (306)',
      '11:40. МДК.11.01 Технологии разработки и защиты баз данных. (225)',
    ],
    6: [
        '8:30. Психология общения. (306)',
        '10:00. Компьютерные сети. (225)',
    0: [],
  },
};

const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const weekLabel = { upper: '🔼 Верхняя неделя', lower: '🔽 Нижняя неделя' };

function getDaySchedule(date) {
  const dayIndex = date.getDay();
  const weekType = getWeekType(date);
  const pairs = schedule[weekType][dayIndex];

  if (!pairs || pairs.length === 0) {
    return `*${dayNames[dayIndex]}* (${weekLabel[weekType]})\n\nВыходной 🎉 Пар нет!`;
  }

  const list = pairs.map((pair, i) => `${i + 1}. ${pair}`).join('\n');
  return `📚 *${dayNames[dayIndex]}* (${weekLabel[weekType]})\n\n${list}`;
}

// ☀️ Утром в 7:00 — расписание на сегодня
cron.schedule('0 7 * * *', () => {
  const today = new Date();
  const message = `☀️ Доброе утро!Расписание на сегодня:\n\n${getDaySchedule(today)}`;
  bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
}, { timezone: 'Moscow' });

// 🌙 Вечером в 21:00 — расписание на завтра
cron.schedule('0 21 * * *', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const message = `🌙 Расписание на завтра:\n\n${getDaySchedule(tomorrow)}`;
  bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
}, { timezone: 'Moscow' });

// Команды
bot.onText(/\/today/, (msg) => {
  bot.sendMessage(msg.chat.id, getDaySchedule(new Date()), { parse_mode: 'Markdown' });
});

bot.onText(/\/tomorrow/, (msg) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  bot.sendMessage(msg.chat.id, getDaySchedule(tomorrow), { parse_mode: 'Markdown' });
});

// /week — показать всё расписание на текущую неделю
bot.onText(/\/week/, (msg) => {
  const weekType = getWeekType(new Date());
  let message = `📅 *Расписание на эту неделю*\n${weekLabel[weekType]}\n\n`;

  [1, 2, 3, 4, 5, 6].forEach(dayIndex => {
    const pairs = schedule[weekType][dayIndex];
    if (pairs && pairs.length > 0) {
      message += `*${dayNames[dayIndex]}:*\n`;
      pairs.forEach((pair, i) => { message += `${i + 1}. ${pair}\n`; });
      message += '\n';
    }
  });

  bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
});

console.log('Бот запущен');