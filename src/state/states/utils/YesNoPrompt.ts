import BetterContext from '@/BetterContext'
import IState from '../../IState'
import { Keyboard } from '@maxhub/max-bot-api'
import lang from '@/strings/ru.json'
import { get_state_from_id } from '@/state/state_managing'

interface Metadata {
    yesNoPrompt: {
        nextStateId: string,
        yesCallbackName: string,
        noCallbackName: string,
        prompt: string,
        yesText: string,
        noText: string,
    }
}

interface InitParams {
    nextState: IState<any>,
    yesCallbackName: string,
    noCallbackName: string,
    prompt: string,
    yesText?: string
    noText?: string
}

enum payloads {
    YES = 'YES',
    NO = 'NO',
}

export let YesNoPrompt: IState<InitParams> = {
    state_id: "yes_no_prompt",
    active_on: "all",
    async process_state(ctx: BetterContext<Metadata>) {
        const next_state = get_state_from_id(ctx.metadata.yesNoPrompt.nextStateId)!
        const state_yes_callback_func = ctx.metadata.yesNoPrompt.yesCallbackName
        const state_no_callback_func = ctx.metadata.yesNoPrompt.noCallbackName

        const selector_text = ctx.metadata.yesNoPrompt.prompt
        const yes_text = ctx.metadata.yesNoPrompt.yesText
        const no_text = ctx.metadata.yesNoPrompt.noText

        if (ctx.callback?.payload === payloads.NO) {
            ctx.callback!.payload = undefined

            return await next_state[state_no_callback_func](ctx)

        } else if (ctx.callback?.payload === payloads.YES) {
            ctx.callback!.payload = undefined

            return await next_state[state_yes_callback_func](ctx)
        }

        ctx.reply(selector_text, {
            attachments: [
                Keyboard.inlineKeyboard([
                    [Keyboard.button.callback(yes_text, payloads.YES), Keyboard.button.callback(no_text, payloads.NO)]
                ])
            ]
        })

        return YesNoPrompt
    },

    async init(ctx: BetterContext<Metadata>, params: InitParams): Promise<IState<InitParams>> {
        ctx.metadata.yesNoPrompt = {
            nextStateId: params.nextState.state_id,
            yesCallbackName: params.yesCallbackName,
            noCallbackName: params.noCallbackName,
            prompt: params.prompt,
            yesText: params.yesText ?? lang.CONFIRM.YES,
            noText: params.noText ?? lang.CONFIRM.NO,
        }

        return YesNoPrompt
    },

    async clear(ctx) {
        delete ctx.metadata.yesNoPrompt
    }
}