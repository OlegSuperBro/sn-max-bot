import BetterContext from "@/BetterContext";
import State from "./IState";
import { set_metadata, set_state } from "./state_managing";

export default async function processState(ctx: BetterContext, state: State) {
    if (state.active_on !== "all" && state.active_on?.indexOf(ctx.updateType) === -1) {
        return
    }

    let new_state = await state.process_state(ctx);

    if (new_state) {
        await set_state(ctx.user!.user_id.toString(), new_state)
    }

    await set_metadata(ctx.user!.user_id.toString(), ctx.metadata)
}