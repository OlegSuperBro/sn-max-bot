import IState from "../IState";
import { Keyboard } from "@maxhub/max-bot-api";
import lang from "@/strings/ru.json"
import { Support } from "@/typings/api";
import { getSupport } from "@/services/api";
import format from "@/utils/format";
import { SupportsList } from "./SupportsList"
import BetterContext from "@/BetterContext";

interface InitParams {
    support: Support,
    nextState: IState<any>,
    passToNextStateInit?: any,
}

interface Metadata {
    supportInfo: {
        support: Support,
        nextStateId: string,
        passToNextStateInit?: any,
    }
}

let state: IState<InitParams> = {
    state_id: "support_info",
    active_on: "all",
    async process_state(ctx) {
        if (ctx.callback?.payload == "back") {
            ctx.callback.payload = undefined

            return await SupportsList.process_state(ctx)
        }

        const support_id = (ctx.metadata.support as Support).id!

        const support = (await getSupport(support_id)).data!

        const result_text = format(lang.SUPPORTS.SUPPORT_INFO, {
            "name": support.full_name,
            "description": support.description,
            "result": support.result,
            "provider": support.provider,
            "organizations": "- " + support.organizations!.map((val) => `[${val.name}](${val.link})`).join("\n- ")
        })

        ctx.reply(result_text, {
            attachments: [
                Keyboard.inlineKeyboard([
                    support.provide_url ? [Keyboard.button.link(support.provide_text!, support.provide_url)] : [],
                    [Keyboard.button.callback(lang.GO_BACK, "back")]
                ])
            ],
            format: "markdown"
        })

        return state
    },

    async init(ctx: BetterContext<Metadata>, args) {
        ctx.metadata.supportInfo = {
            support: args.support,
            nextStateId: args.nextState.state_id,
            passToNextStateInit: args.passToNextStateInit
        }
        return state;
    },
}

export default state