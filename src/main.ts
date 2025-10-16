import { Bot } from '@maxhub/max-bot-api'
import dotenv from 'dotenv'
dotenv.config()

import BetterContext from '@/BetterContext';
import stateMiddleware from './middleware/state';
import processState from './state/DefaultStateMachine';
import format from './utils/format';

import lang from '@/strings/ru.json'
import { reset_state } from './state/state_managing';

// Создайте экземпляр класса Bot и передайте ему токен 
const bot = new Bot(process.env["BOT_TOKEN"]!, {contextType: BetterContext});

bot.use(stateMiddleware)

// bot.command('test', (ctx) => ctx.reply('Доброasdasd!'));

bot.on('bot_started', async (ctx) => {
    await reset_state(ctx.user!.user_id.toString())

    await ctx.reply(format(lang.WELCOME_MESSAGE))
})

bot.on([
    "message_callback",
    "message_created",
    "message_removed",
    "message_edited",
    "bot_added",
    "bot_removed",
    "user_added",
    "user_removed",
    "bot_started",
    "chat_title_changed",
    "message_construction_request",
    "message_constructed",
    "message_chat_created"
], async (ctx) => {
    if (!ctx.currentState) {
        await ctx.reply(format(lang.CURRENT_STATE_ERROR, {"ctx": ctx}))
        return
    }
    await ctx.reply(`${JSON.stringify(ctx.currentState.metadata)}`)
    setTimeout(async () => {
        await processState(ctx, ctx.currentState!)
    }, 200)
})

// Теперь можно запустить бота, чтобы он подключился к серверам MAX и ждал обновлений
bot.start();
console.log("BOT READY")
