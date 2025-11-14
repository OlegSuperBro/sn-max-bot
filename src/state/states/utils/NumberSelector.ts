import format from '@/utils/format'
import IState from '../../IState'
import { get_state_from_id } from '../../state_managing'
import lang from '@/strings/ru.json'
import { Keyboard } from '@maxhub/max-bot-api'
import BetterContext from '@/BetterContext'

interface InitParams {
    nextState: IState<any>
    nextStateFunctionName: string
    nextStateCancelFunctionName?: string
    prompt?: string
    cancel_text?: string
    min?: number
    max?: number
    before_additional_buttons?: {payload: string, text: string}[]
    after_additional_buttons?: {payload: string, text: string}[]
}

interface Metadata {
    selector: {
        next_state_id: string
        callback_name: string
        cancel_callback_name?: string
        min?: number
        max?: number
        text: string
        cancel_text: string

        waiting: boolean

        before_additional_buttons: {payload: string, text: string}[]
        after_additional_buttons: {payload: string, text: string}[]
    }
}

enum payloads {
    CANCEL = 'cancel',
}
function getRangeText(selector_min?: number, selector_max?: number) {
    if (selector_min && selector_max) {
        return format(lang.NUMBER_SELECTOR.RANGE_MIN_MAX_DEFINED, {
            selector_min: selector_min,
            selector_max: selector_max,
        })
    } else if (selector_min) {
        return format(lang.NUMBER_SELECTOR.RANGE_MIN_DEFINED, {
            selector_min: selector_min,
        })
    } else if (selector_max) {
        return format(lang.NUMBER_SELECTOR.RANGE_MAX_DEFINED, {
            selector_max: selector_max,
        })
    }
    return ''
}

export let NumberSelector: IState<InitParams> = {
    state_id: 'number_selector',
    active_on: 'all',
    async process_state(ctx: BetterContext<Metadata>) {
        const next_state = get_state_from_id(
            ctx.metadata.selector.next_state_id
        )!
        const state_callback_func = ctx.metadata.selector.callback_name!
        const state_cancel_callback_func =
            ctx.metadata.selector.cancel_callback_name

        const selector_min = ctx.metadata.selector.min
        const selector_max = ctx.metadata.selector.max

        const selector_text = ctx.metadata.selector.text
        const cancel_text = ctx.metadata.selector.cancel_text

        const before_additional_buttons = ctx.metadata.selector.before_additional_buttons
        const after_additional_buttons = ctx.metadata.selector.after_additional_buttons

        const all_buttons = before_additional_buttons.concat(after_additional_buttons)

        if (all_buttons.find((val) => val.payload === ctx.callback?.payload)) {
            return await next_state.process_state(ctx)
        }

        if (ctx.callback?.payload === payloads.CANCEL) {
            ctx.callback.payload = undefined

            if (state_cancel_callback_func) {
                return await next_state[state_cancel_callback_func](ctx)
            }
            return await next_state.process_state(ctx)
        }

        const waiting = ctx.metadata.selector.waiting

        const input_value = Number(ctx.message?.body.text)

        if (waiting && input_value) {
            if (input_value < (selector_min ?? -Infinity) || input_value > (selector_max ?? Infinity)) {
                await ctx.reply(
                    format(lang.NUMBER_SELECTOR.WRONG_MESSAGE, {
                        range: getRangeText(selector_min, selector_max),
                    }),
                    { format: 'markdown' }
                )
                return NumberSelector
            }

            this.clear!(ctx)

            return await next_state[state_callback_func](ctx, input_value)
        }

        if (waiting) {
            await ctx.reply(
                format(lang.NUMBER_SELECTOR.WRONG_MESSAGE, {
                    range: getRangeText(selector_min, selector_max),
                }),
                {
                    format: 'markdown',
                }
            )
            return NumberSelector
        }

        await ctx.reply(selector_text, {
            attachments: [
                Keyboard.inlineKeyboard([
                    ...before_additional_buttons.map((val) => {
                        return [Keyboard.button.callback(val.text, val.payload)]
                    }),
                    [Keyboard.button.callback(cancel_text, payloads.CANCEL)],
                    ...after_additional_buttons.map((val) => {
                        return [Keyboard.button.callback(val.text, val.payload)]
                    })
                ]),
            ],
            format: 'markdown',
        })

        ctx.metadata.selector.waiting = true

        return NumberSelector
    },

    async init(
        ctx: BetterContext<Metadata>,
        params: InitParams
    ): Promise<IState<InitParams>> {
        // Infinity... can't be serialized to json...
        const selector_min = params.min
        const selector_max = params.max

        let default_selector_text = format(lang.NUMBER_SELECTOR.DEFAULT, {
            range: getRangeText(selector_min, selector_max),
        })

        ctx.metadata.selector = {
            next_state_id: params.nextState.state_id,
            callback_name: params.nextStateFunctionName,
            cancel_callback_name: params.nextStateCancelFunctionName,
            min: selector_min,
            max: selector_max,
            text: params.prompt ?? default_selector_text,
            cancel_text: params.cancel_text ?? lang.CANCEL,
            waiting: false,
            before_additional_buttons: params.before_additional_buttons ?? [],
            after_additional_buttons: params.after_additional_buttons ?? [],
        }

        return NumberSelector
    },

    async clear(ctx) {
        delete ctx.metadata.selector
    },
}
