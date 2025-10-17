import { Bot } from '@maxhub/max-bot-api'
import dotenv from 'dotenv'
dotenv.config({
    override: false,
})

import BetterContext from '@/BetterContext';
import stateMiddleware from './middleware/state';
import processState from './state/DefaultStateMachine';
import format from './utils/format';

import lang from '@/strings/ru.json'
import { reset_state } from './state/state_managing';

const bot = new Bot(process.env["BOT_TOKEN"]!, {contextType: BetterContext});

async function run_backup() {
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
        ctx.reply(lang.STUB_MESSAGE)
    })
    let bot_promise = bot.start();
    console.log("BOT READY IN BACKUP MODE")

    await bot_promise;
}

async function run() {
    bot.use(stateMiddleware)

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
            ctx.currentState = await reset_state(ctx.user!.user_id.toString())
        }
        await ctx.reply(`${JSON.stringify(ctx.currentState.metadata)}`)
        setTimeout(async () => {
            await processState(ctx, ctx.currentState!)
        }, 200)
    })

    let bot_promise = bot.start();
    console.log("BOT READY");

    await bot_promise;
}

if (process.env.BOT_STATE === "backup") {
    run_backup()
} else {
    run()
}