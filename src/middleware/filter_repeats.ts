/**
 * Filter event by some rules
 */

import BetterContext from "@/BetterContext";
import { middlewareLog } from "@/LogConfig";

const MS_LIMIT = 5000

const log = middlewareLog.getChildCategory("EVENT_REPEATS")

export default async function stateMiddleware(ctx: BetterContext, next: () => Promise<void>) {
    const currentTime = Date.now()
    if (ctx.updateType === "message_callback") {
        if (ctx.callback!.timestamp + MS_LIMIT < currentTime) {
            log.info(`GOT LATE MESSAGE. MESSAGE TIMESTAMP: ${ctx.message!.timestamp} CURRENT TIME: ${currentTime} DIFFERENCE IS > ${MS_LIMIT}`)
            return
        }
    } else if (ctx.updateType === "message_created") {
        if (ctx.message!.timestamp + MS_LIMIT < currentTime) {
            log.info(`GOT LATE MESSAGE. MESSAGE TIMESTAMP: ${ctx.message!.timestamp} CURRENT TIME: ${currentTime} DIFFERENCE IS > ${MS_LIMIT}`)
            return
        }
    } else {
        log.debug(`Unhandled message type: ${ctx.updateType}`)
    }

    await next()
}