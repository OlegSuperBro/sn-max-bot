import IState, { cloneState } from "../IState";
import SettingsState from "./Settings"

let state: IState = {
    state_id: "home",
    active_on: "all",
    metadata: {},
    process_state(ctx, metadata) {
        console.log("Hey, i'm at home")

        ctx.reply(`Switching to settings ${metadata.super_valuable_data}`)

        let next_state: IState = cloneState(SettingsState)

        if (!metadata.super_valuable_data) {
            metadata.super_valuable_data = 0
        }

        metadata.super_valuable_data += 1

        next_state.metadata = metadata

        return next_state
    },
}

export default state