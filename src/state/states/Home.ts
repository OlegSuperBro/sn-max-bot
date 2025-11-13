import IState from '../IState'
import { Keyboard } from '@maxhub/max-bot-api'
import lang from '@/strings/ru.json'

import { SupportsList } from './SupportsList'
import { getSupports } from '@/services/api'
import { SelectFilterSection } from './Filters/SelectFilterSection'
import BetterContext from '@/BetterContext'
import { YesNoPrompt } from './utils/YesNoPrompt'

interface Metadata {}

enum payloads {
    ALL_SUPPORTS = 'all_supports',
    FILTERED_SUPPORTS = 'filtered_supports',
    SETUP_FILTERS = 'setup_filters',
}

export let Home: IState<{}> = {
    state_id: 'home',
    active_on: 'message_callback',
    async process_state(ctx: BetterContext<Metadata>) {
        const button_payload = ctx.callback?.payload

        if (button_payload === payloads.ALL_SUPPORTS) {
            ctx.callback!.payload = undefined

            const supports = await ctx.globalCache.supports()

            return await (
                await SupportsList.init!(ctx, {
                    supports: supports,
                })
            ).process_state(ctx)
        } else if (button_payload === payloads.FILTERED_SUPPORTS) {
            ctx.callback!.payload = undefined

            if (ctx.userData.portrait.lenght === 0) {
                // TODO redirect to another state instead of this showing.
                await YesNoPrompt.init!(ctx, {
                    nextState: Home,
                    yesCallbackName: 'goto_view_supports',
                    noCallbackName: 'goto_set_filters',
                    prompt: lang.HOME.NO_FILTERS_SET.TEXT,
                    yesText: lang.HOME.NO_FILTERS_SET.CONTINUE,
                    noText: lang.HOME.NO_FILTERS_SET.SET_FILTERS,
                })
                return await YesNoPrompt.process_state(ctx)
            }

            const supports = (
                await getSupports({
                    limit: 10000,
                    portrait: ctx.userData.portrait.toString(),
                })
            ).data!.supports

            return await (
                await SupportsList.init!(ctx, {
                    supports: supports,
                })
            ).process_state(ctx)
        } else if (button_payload === payloads.SETUP_FILTERS) {
            ctx.callback!.payload = undefined

            await SelectFilterSection.init!(ctx, {})
            return await SelectFilterSection.process_state(ctx)
        }

        ctx.reply(lang.HOME.MESSAGE, {
            attachments: [
                Keyboard.inlineKeyboard([
                    [
                        Keyboard.button.callback(
                            lang.HOME.ALL_SUPPORTS_BUTTON,
                            payloads.ALL_SUPPORTS
                        ),
                    ],
                    [
                        Keyboard.button.callback(
                            lang.HOME.FILTERED_SUPPORTS_BUTTON,
                            payloads.FILTERED_SUPPORTS
                        ),
                    ],
                    [
                        Keyboard.button.callback(
                            lang.HOME.SETUP_FILTERS,
                            payloads.SETUP_FILTERS
                        ),
                    ],
                ]),
            ],
        })

        return Home
    },

    async goto_view_supports(ctx: BetterContext<Metadata>) {
        const supports = (
            await getSupports({
                limit: 10000,
                portrait: ctx.userData.portrait.toString(),
            })
        ).data!.supports

        return await (
            await SupportsList.init!(ctx, {
                supports: supports,
            })
        ).process_state(ctx)
    },

    async goto_set_filters(ctx: BetterContext<Metadata>) {
        ctx.callback!.payload = undefined

        await SelectFilterSection.init!(ctx, {})
        return await SelectFilterSection.process_state(ctx)
    },
}
