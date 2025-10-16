import IState, { cloneState } from "../IState";
import HomeState from "./Home"

let state: IState = {
    state_id: "settings",
    active_on: "all",
    metadata: {},
    process_state(ctx, metadata) {
        console.log("Hey, i'm at settings")

        ctx.reply(`Switching to Home ${metadata?.super_valuable_data}`)

        let next_state: IState = cloneState(HomeState)

        metadata.super_valuable_data = (metadata.super_valuable_data === undefined ? 0 : metadata.super_valuable_data) + 1

        next_state.metadata = metadata

        return next_state
    },
}

export default state