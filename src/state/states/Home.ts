import IState from "../IState";
import { Keyboard } from "@maxhub/max-bot-api";
import lang from "@/strings/ru.json"

import { SupportsList } from "./SupportsList"
import { getSupports } from "@/services/api";

enum payloads {
    ALL_SUPPORTS = "all_supports"
}

let state: IState<{}> = {
    state_id: "home",
    active_on: "message_callback",
    async process_state(ctx) {
        const button_payload = ctx.callback?.payload

        if (ctx.metadata.sent && !button_payload) {
            return state
        }

        if (button_payload === payloads.ALL_SUPPORTS) {
            ctx.metadata = {}

            const supports = (await getSupports({
                limit: 1000,
                fields: [
                    "id",
                    "short_name",
                ]
            })).data?.supports

            return await (await SupportsList.init!(ctx, {
                supports: supports
            })).process_state(ctx)
        }

        if (!button_payload) {
            ctx.reply(lang.HOME.MESSAGE, {
                attachments: [
                    Keyboard.inlineKeyboard([
                        [Keyboard.button.callback(lang.HOME.ALL_SUPPORTS_BUTTON, payloads.ALL_SUPPORTS)]
                    ])
                ]
            })

            ctx.metadata.sent = true
        }

        return state
    },
}

export default state