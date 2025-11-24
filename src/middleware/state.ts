/**
 * Restores current state from redis and add it to context
 */

import BetterContext from "@/BetterContext";
import { middlewareLog } from "@/LogConfig";
import { get_state } from "@/state/state_managing";

const log = middlewareLog.getChildCategory("STATE")

export default async function stateMiddleware(ctx: BetterContext, next: () => Promise<void>) {
    if (!ctx.user) {
        log.error(`USER DON'T EXIST\n${ctx}`)
        return
    }

    let state = await get_state(ctx.user!.user_id.toString())

    if (state) {
        ctx.currentState = state
    }

    await next()
}