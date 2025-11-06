/**
 * Restores metadata from redis and add it to context
 */

import BetterContext from "@/BetterContext";
import { get_metadata } from "@/state/state_managing";

export default async function metadataMiddleware(ctx: BetterContext, next: () => Promise<void>) {
    if (!ctx.user) {
        console.error(`USER DON'T EXIST\n${ctx}`)
        return
    }

    let metadata = await get_metadata(ctx.user!.user_id.toString())

    ctx.metadata = metadata ?? {}

    await next()
}