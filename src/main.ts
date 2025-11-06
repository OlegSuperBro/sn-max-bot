import { Bot } from '@maxhub/max-bot-api'

import BetterContext from '@/BetterContext';
import stateMiddleware from './middleware/state';
import metadataMiddleware from './middleware/metadata';
import processState from './state/DefaultStateMachine';

import lang from '@/strings/ru.json'
import { reset_state } from './state/state_managing';



const bot = new Bot(process.env["BOT_TOKEN"]!, {
    contextType: BetterContext<{}>,
    clientOptions: {
        // @ts-expect-error
        baseUrl: "https://platform-api.max.ru"
    }
});

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
    bot.use(metadataMiddleware)

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
        if (ctx.updateType == "bot_started") {
            console.log(`BOT STARTED. SETTING NULL STATE`)
            ctx.currentState = null
        }

        if (ctx.message?.body.text == "reset") {
            console.log(`GOT RESET COMMAND. RESETING STATE`)
            ctx.currentState = null
            await ctx.reply("RESET")
        }

        if (!ctx.currentState) {
            console.log(`NO CURRENT STATE. RESETING`)
            ctx.currentState = await reset_state(ctx.user!.user_id.toString())
        }
        // console.log(`GOT ${ctx.updateType}. TEXT: ${ctx.message?.body.text}. CURRENT STAGE: ${ctx.currentState.state_id} METADATA: ${JSON.stringify(ctx.metadata)}`)
        console.log(`GOT ${ctx.updateType}. TEXT: ${ctx.message?.body.text}. CURRENT STAGE: ${ctx.currentState.state_id} TIMESTAMP: ${ctx.message?.timestamp}`)
        try {
            await processState(ctx, ctx.currentState!)
        } catch (e) {
            await ctx.reply(lang.ERROR.INTERNAL_ERROR)
            console.log(e)
        }
    })

    loop(bot)
}

async function loop(bot: Bot<BetterContext>) {
    bot.start().catch((r) => {
        console.log("BOT CRASHED")
        console.log(typeof r)
        console.error(r)
        bot.stop()

        setTimeout(() => {
            loop(bot)
        }, 500)
    })
    console.log("BOT STARTED");
}

if (process.env.BOT_STATE === "backup") {
    run_backup()
} else {
    run()
}