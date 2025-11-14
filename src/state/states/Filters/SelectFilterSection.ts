import BetterContext from '@/BetterContext'
import IState from '../../IState'
import {
    createScrollingKeyboard,
    ScrollingKeyboardCallback,
} from '@/utils/keyboard'
import { clamp } from '@/utils/things'
import { ErrorOccured } from '../ErrorOccured'
import { Home } from '../Home'
import { NumberSelector } from '../utils/NumberSelector'
import { sendOrEdit } from '@/utils/message'
import { selectFilterSectionProperty } from './SelectProperty'
import { Keyboard } from '@maxhub/max-bot-api'
import lang from '@/strings/ru.json'
import format from '@/utils/format'

interface Metadata {
    selectFilterSection: {
        currentPage: number
    }
}

interface InitParams {}

enum payloads {
    SECTION = 'section_',
    BACK_HOME = 'back_home',
    SELECT_PAGE = 'select_page',
}

const SECTIONS_PER_PAGE = 5

export let SelectFilterSection: IState<InitParams> = {
    state_id: 'select_filter_section',
    active_on: 'all',
    async process_state(ctx: BetterContext<Metadata>) {
        const layout = await ctx.globalCache.filterLayout()
        const button_payload = ctx.callback?.payload

        let page = clamp(
            ctx.metadata.selectFilterSection.currentPage,
            0,
            Math.ceil(layout.length / SECTIONS_PER_PAGE - 1)
        )

        if (button_payload === ScrollingKeyboardCallback.SCROLL_LEFT) {
            ctx.metadata.selectFilterSection.currentPage = page - 1
        } else if (button_payload === ScrollingKeyboardCallback.SCROLL_RIGHT) {
            ctx.metadata.selectFilterSection.currentPage = page + 1
        } else if (button_payload?.startsWith(payloads.SECTION)) {
            const id = Number.parseInt(button_payload.split('_')[1]!)

            const section = layout.find((val) => {
                return val.id == id
            })

            if (!section) {
                ErrorOccured.init!(ctx, {
                    nextState: Home,
                })

                return ErrorOccured.process_state(ctx)
            }

            await selectFilterSectionProperty.init!(ctx, {
                section: section,
            })

            return await selectFilterSectionProperty.process_state(ctx)
        } else if (button_payload === payloads.BACK_HOME) {
            ctx.callback!.payload = undefined
            return await Home.process_state(ctx)
        } else if (button_payload === payloads.SELECT_PAGE) {
            ctx.callback!.payload = undefined

            NumberSelector.init!(ctx, {
                nextState: SelectFilterSection,
                nextStateFunctionName: 'fromSelector',
                nextStateCancelFunctionName: 'fromSelectorCancel',
                min: 1,
                max: Math.ceil(layout.length / SECTIONS_PER_PAGE),
            })

            return await NumberSelector.process_state(ctx)
        }

        page = clamp(
            ctx.metadata.selectFilterSection.currentPage,
            0,
            Math.ceil(layout.length / SECTIONS_PER_PAGE - 1)
        )

        function create_keyboard() {

            return createScrollingKeyboard(
                layout.map((val) => {
                    const is_done = val.properties.every((property) => {
                        return ctx.userData.portrait.includes(property)
                    })
                    return {
                        id: `${payloads.SECTION}${val.id.toString()}`,
                        value: is_done ?
                            format(lang.FILTER.SECTION_DONE, {name: val.name}) :
                            format(lang.FILTER.SECTION_NOT_DONE, {name: val.name}),
                    }
                }),
                page,
                {
                    additionalButtons: [
                        [
                            Keyboard.button.callback(
                                lang.FILTER.RESET_ALL_BUTTON,
                                payloads.RESET_ALL
                            )
                        ],
                        [
                            Keyboard.button.callback(
                                lang.GO_BACK,
                                payloads.BACK_HOME
                            ),
                        ],
                    ],
                    valuesPerPage: SECTIONS_PER_PAGE,
                }
            )
        }

        await sendOrEdit(ctx, {
            message_id:
                ctx.currentState?.state_id == SelectFilterSection.state_id
                    ? ctx.message?.body.mid
                    : undefined,
            text: lang.FILTER.SELECT_SECTION,
            extra: {
                attachments: [create_keyboard()],
                format: "markdown",
            },
        })

        return SelectFilterSection
    },

    async init(ctx: BetterContext<Metadata>, args) {
        ctx.metadata.selectFilterSection = {
            currentPage: 0,
        }

        return SelectFilterSection
    },

    async fromSelector(ctx: BetterContext, value: number) {
        ctx.metadata.selectFilterSection.currentPage = value - 1
        ctx.metadata.selectFilterSection.replyMid = null

        return this.process_state(ctx)
    },

    async fromSelectorCancel(ctx: BetterContext) {
        ctx.metadata.selectFilterSection.replyUrl = null
        return await this.process_state(ctx)
    },
}
