import IState from "../IState";
import { reset_metadata, reset_state } from "../state_managing";
import { Home } from "./Home"
import lang from "@/strings/ru.json"

let state: IState<{}> = {
    state_id: "start",
    active_on: "all",
    async process_state(ctx) {
        await reset_state(ctx.user!.user_id.toString())
        await reset_metadata(ctx.user!.user_id.toString())
        ctx.metadata = {}

        ctx.reply(lang.WELCOME_MESSAGE)

        await new Promise((res) => {
            setTimeout(() => {
                res(null)
            }, 200)
        })

        return await Home.process_state(ctx)
    },
}

export default state