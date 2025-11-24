/**
 * Restores metadata from redis and add it to context
 */

import BetterContext from "@/BetterContext";
import { middlewareLog } from "@/LogConfig";
import { get_metadata } from "@/state/state_managing";

const log = middlewareLog.getChildCategory("METADATA")

export default async function metadataMiddleware(ctx: BetterContext, next: () => Promise<void>) {
    if (!ctx.user) {
        log.error(`USER DON'T EXIST\n${ctx}`)
        return
    }

    let metadata = await get_metadata(ctx.user!.user_id.toString())

    ctx.metadata = metadata ?? {}

    await next()
}