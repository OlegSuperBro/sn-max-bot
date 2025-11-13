import IState from "../IState";
import { Keyboard } from "@maxhub/max-bot-api";
import lang from "@/strings/ru.json"

import { SupportsList } from "./SupportsList"
import { getSupports } from "@/services/api";
import { SelectFilterSection } from "./Filters/SelectFilterSection";
import BetterContext from "@/BetterContext";

interface Metadata {

}

enum payloads {
    ALL_SUPPORTS = "all_supports",
    FILTERED_SUPPORTS = "filtered_supports",
    SETUP_FILTERS = "setup_filters",
}

let state: IState<{}> = {
    state_id: "home",
    active_on: "message_callback",
    async process_state(ctx: BetterContext<Metadata>) {
        const button_payload = ctx.callback?.payload

        if (button_payload === payloads.ALL_SUPPORTS) {
            ctx.callback!.payload = undefined

            const supports = await ctx.globalCache.supports()

            return await (await SupportsList.init!(ctx, {
                supports: supports
            })).process_state(ctx)
        } else if (button_payload === payloads.FILTERED_SUPPORTS) {
            ctx.callback!.payload = undefined

            if (ctx.userData.portrait.lenght === 0) {
                // TODO redirect to another state instead of this showing.
            }

            const supports = (await getSupports({
                limit: 10000,
                portrait: ctx.userData.portrait.toString()
            })).data!.supports

            return await (await SupportsList.init!(ctx, {
                supports: supports
            })).process_state(ctx)

        } else if (button_payload === payloads.SETUP_FILTERS) {
            ctx.callback!.payload = undefined

            await SelectFilterSection.init!(ctx, {})
            return await SelectFilterSection.process_state(ctx)
        }

        ctx.reply(lang.HOME.MESSAGE, {
            attachments: [
                Keyboard.inlineKeyboard([
                    [Keyboard.button.callback(lang.HOME.ALL_SUPPORTS_BUTTON, payloads.ALL_SUPPORTS)],
                    [Keyboard.button.callback(lang.HOME.FILTERED_SUPPORTS_BUTTON, payloads.FILTERED_SUPPORTS)],
                    [Keyboard.button.callback(lang.HOME.SETUP_FILTERS, payloads.SETUP_FILTERS)]
                ])
            ]
        })

        return state
    },
}

export default state