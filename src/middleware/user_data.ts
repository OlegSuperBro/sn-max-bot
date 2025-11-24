/**
 * Restores userdata from redis and load into context
 */

import BetterContext, { Portrait } from "@/BetterContext";
import { middlewareLog } from "@/LogConfig";
import get_redis from "@/redis"

const log = middlewareLog.getChildCategory("USER_DATA")

export default async function metadataMiddleware(ctx: BetterContext, next: () => Promise<void>) {
    if (!ctx.user) {
        log.error(`USER DON'T EXIST\n${ctx}`)
        return
    }

    const redis = await get_redis()

    const portrait = await redis.get(`user_portrait:${ctx.user.user_id}`)

    ctx.userData = {
        portrait: portrait ? Portrait.fromString(portrait) : new Portrait()
    }

    await next()
}