const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const languages = require('./languages');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply("سلام! برای اجرای کد، از این فرمت استفاده کن:\n\n`/python print(\"Hello\")`", { parse_mode: 'Markdown' });
});

bot.command('languages', (ctx) => {
  const list = Object.keys(languages).sort().join(' | ');
  ctx.reply(`🧠 زبان‌های پشتیبانی شده:\n\n${list}`);
});

bot.on('text', async (ctx) => {
  const input = ctx.message.text;
  if (!input.startsWith('/')) return;

  const [cmd, ...codeArr] = input.trim().split(' ');
  const lang = cmd.replace('/', '').toLowerCase();
  const code = codeArr.join(' ');

  if (!languages[lang]) {
    return ctx.reply('زبان وارد شده پشتیبانی نمی‌شود!');
  }

  if (!code) {
    return ctx.reply('هیچ کدی وارد نشده!');
  }

  try {
    const { data } = await axios.post('https://rextester.com/rundotnet/Run', {
      LanguageChoiceWrapper: languages[lang],
      Program: code
    });

    const execTime = data.Stats ? `⏱ زمان اجرا: ${data.Stats.split(',')[0]}` : '⏱ زمان اجرا مشخص نیست';
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('📤 خروجی', 'result')],
      [Markup.button.callback('⚠️ هشدار', 'warnings'), Markup.button.callback('❌ خطا', 'errors')],
      [Markup.button.callback('ℹ️ آمار اجرا', 'stats')]
    ]);



    ctx.reply(`کد با موفقیت اجرا شد. یکی از گزینه‌های زیر را انتخاب کن:`, buttons);

    bot.action('result', (ctx) => ctx.reply(data.Result || 'ندارد'));
    bot.action('warnings', (ctx) => ctx.reply(data.Warnings || 'ندارد'));
    bot.action('errors', (ctx) => ctx.reply(data.Errors || 'ندارد'));
    bot.action('stats', (ctx) => ctx.reply(data.Stats || 'ندارد'));

  } catch (err) {
    ctx.reply('خطایی در اجرا رخ داد!');
  }
});

module.exports = bot;
