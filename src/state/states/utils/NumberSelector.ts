import format from "@/utils/format";
import IState from "../../IState";
import { get_state_from_id } from "../../state_managing";
import lang from "@/strings/ru.json"
import { Keyboard } from "@maxhub/max-bot-api";
import BetterContext from "@/BetterContext";

interface InitParams {
    nextState: IState<any>,
    nextStateFunctionName: string,
    nextStateCancelFunctionName?: string,
    prompt?: string,
    cancel_text?: string
    min?: number,
    max?: number
}

interface Metadata {
    selector: {
        next_state_id: string,
        callback_name: string,
        cancel_callback_name?: string,
        min: number,
        max: number,
        text: string,
        cancel_text: string,

        waiting: boolean,
    }
}

enum payloads {
    CANCEL = "cancel"
}
function getRangeText(selector_min: number, selector_max: number) {
    if (selector_min != -Infinity && selector_max != Infinity) {
        return format(lang.NUMBER_SELECTOR.RANGE_MIN_MAX_DEFINED, {
            "selector_min": selector_min,
            "selector_max": selector_max
        })
    } else if (selector_min != -Infinity) {
        return format(lang.NUMBER_SELECTOR.RANGE_MIN_DEFINED, {
            "selector_min": selector_min
        })
    } else if (selector_max != Infinity) {
        return format(lang.NUMBER_SELECTOR.RANGE_MAX_DEFINED, {
            "selector_max": selector_max
        })
    }
    return ""
}

export let NumberSelector: IState<InitParams> = {
    state_id: "number_selector",
    active_on: "all",
    async process_state(ctx: BetterContext<Metadata>) {
        const next_state = get_state_from_id(ctx.metadata.selector.next_state_id)!
        const state_callback_func = ctx.metadata.selector.callback_name!
        const state_cancel_callback_func = ctx.metadata.selector.cancel_callback_name

        const selector_min = ctx.metadata.selector.min
        const selector_max = ctx.metadata.selector.max

        const selector_text = ctx.metadata.selector.text
        const cancel_text = ctx.metadata.selector.cancel_text

        if (ctx.callback?.payload === payloads.CANCEL) {
            ctx.callback.payload = undefined

            if (state_cancel_callback_func) {
                return await next_state[state_cancel_callback_func](ctx)
            }
            return next_state
        }

        const waiting = ctx.metadata.selector.waiting

        const input_value = Number(ctx.message?.body.text)

        if (waiting && input_value) {
            if (input_value < selector_min || input_value > selector_max) {
                ctx.reply(format(lang.NUMBER_SELECTOR.WRONG_MESSAGE, {range: getRangeText(selector_min, selector_max)}))
                return NumberSelector
            }

            this.clear!(ctx)

            return await next_state[state_callback_func](ctx, input_value)
        }

        if (waiting) {
            ctx.reply(format(lang.NUMBER_SELECTOR.WRONG_MESSAGE, { range: getRangeText(selector_min, selector_max) }))
            return NumberSelector
        }

        ctx.reply(selector_text, {
            attachments: [
                Keyboard.inlineKeyboard([
                    [Keyboard.button.callback(cancel_text, payloads.CANCEL)]
                ])
            ]
        })

        ctx.metadata.selector.waiting = true

        return NumberSelector
    },

    async init(ctx: BetterContext<Metadata>, params: InitParams): Promise<IState<InitParams>> {
        const selector_min = params.min ?? -Infinity
        const selector_max = params.max ?? Infinity

        let default_selector_text = format(lang.NUMBER_SELECTOR.DEFAULT, { "range": getRangeText(selector_min, selector_max) })

        ctx.metadata.selector = {
            next_state_id: params.nextState.state_id,
            callback_name: params.nextStateFunctionName,
            cancel_callback_name: params.nextStateCancelFunctionName,
            min: selector_min,
            max: selector_max,
            text: params.prompt ?? default_selector_text,
            cancel_text: params.cancel_text ?? lang.CANCEL,
            waiting: false,
        }

        return NumberSelector
    },

    async clear(ctx) {
        delete ctx.metadata.selector
    }
}