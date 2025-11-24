import BetterContext from "@/BetterContext";
import State from "./IState";
import { set_metadata, set_state } from "./state_managing";

import get_redis from "@/redis"
import { stateLog } from "@/LogConfig";

const stateMachineLog = stateLog.getChildCategory("STATE_MACHINE")

export default async function processState(ctx: BetterContext, state: State<any>) {
    if (state.active_on !== "all" && state.active_on?.indexOf(ctx.updateType) === -1) {
        return
    }
    const redis = await get_redis()

    let new_state = await state.process_state(ctx);

    if (new_state) {
        stateMachineLog.debug(`State changes: ${state.state_id} -> ${new_state.state_id}`, ctx)
        await set_state(ctx.user!.user_id.toString(), new_state)
    }

    await set_metadata(ctx.user!.user_id.toString(), ctx.metadata)

    await redis.set(`user_portrait:${ctx.user!.user_id}`, ctx.userData.portrait.toString())
}