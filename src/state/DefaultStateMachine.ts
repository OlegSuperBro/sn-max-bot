import BetterContext from "@/BetterContext";
import IState from "./IState";
import { set_state } from "./state_managing";

export default async function processState(ctx: BetterContext, state: IState) {
    if (state.active_on !== "all" && state.active_on?.indexOf(ctx.updateType) === -1) {
        return
    }

    let new_state = state.process_state(ctx, state.metadata ?? {});

    if (new_state) {
        await set_state(ctx.user!.user_id.toString(), new_state)
    }
}