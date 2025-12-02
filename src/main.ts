import { Bot } from '@maxhub/max-bot-api'

import BetterContext from '@/BetterContext';
import filterRepeatsMiddleware from './middleware/filter_repeats';
import stateMiddleware from './middleware/state';
import metadataMiddleware from './middleware/metadata';
import userDataMiddleware from './middleware/user_data';
import processState from './state/DefaultStateMachine';

import lang from '@/strings/ru.json'
import { delete_all_user_info, reset_state } from './state/state_managing';
import { botLog } from './LogConfig';

const isDebug = process.env["NODE_ENV"] == "development"


const bot = new Bot(process.env["BOT_TOKEN"]!, {
    contextType: BetterContext<{}>,
    clientOptions: {
        // @ts-expect-error why do they have this set as literal...
        baseUrl: "https://platform-api.max.ru"
    }
});

const messageLog = botLog.getChildCategory("MESSAGES")

function logMessage(ctx: BetterContext) {
    messageLog.debug(`GOT ${ctx.updateType}. TEXT: ${ctx.message?.body.text}. TIMESTAMP: ${ctx.message?.timestamp}`, ctx)
}

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
    botLog.info("BOT READY IN BACKUP MODE")

    await bot_promise;
}

async function run() {
    bot.use(filterRepeatsMiddleware)
    bot.use(stateMiddleware)
    bot.use(metadataMiddleware)
    bot.use(userDataMiddleware)

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
    ], async (ctx, next) => {
        if (ctx.updateType == "bot_started") {
            botLog.debug(`BOT STARTED. SETTING NULL STATE`);

            await delete_all_user_info(ctx.user!.user_id.toString())
            ctx.currentState = null
        }

        if (isDebug && ctx.message?.body.text == "reset") {
            botLog.debug(`GOT RESET COMMAND. RESETING STATE`)
            ctx.currentState = null
            await ctx.reply("RESET")
        }

        if (!ctx.currentState) {
            botLog.debug(`NO CURRENT STATE. RESETING`);

            ctx.currentState = await reset_state(ctx.user!.user_id.toString())
        }
        logMessage(ctx)
        try {
            await processState(ctx, ctx.currentState!)
        } catch (e) {
            await ctx.reply(lang.ERROR.INTERNAL_ERROR)
            botLog.error(`Error occured:\n${(e as Error).stack}`,)
            botLog.debug(`Metadata dump: ${JSON.stringify(ctx.metadata)}`)
        }
        await next()
    })

    let isShuttingDown = false;

    const gracefulShutdown = async () => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        botLog.info('Shutting down gracefully...');
        await bot.stop();
        process.exit(0);
    };

    // Handle signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    loop(bot)
}

async function loop(bot: Bot<BetterContext>) {
    bot.start().catch((r: Error) => {
        botLog.warn("BOT CRASHED")
        botLog.warn(`${r}`)
        bot.stop()

        botLog.info("Restarting in 500 milliseconds")
        setTimeout(() => {
            loop(bot)
        }, 500)
    })
    botLog.info("BOT STARTED");
}

if (process.env.BOT_STATE === "backup") {
    run_backup()
} else {
    run()
}
