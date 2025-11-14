import IState from "../IState";
import { Keyboard } from "@maxhub/max-bot-api";
import lang from "@/strings/ru.json"
import { Support } from "@/typings/api";

import SupportInfo from "./SupportInfo"
import { Home } from "./Home"
import format from "@/utils/format";
import { NumberSelector } from "./utils/NumberSelector"
import BetterContext from "@/BetterContext";
import { ExpandedSupportsList } from "./ExpandedSupportsList";
import { clamp, Ending, getWordEnding } from "@/utils/things";
import { createScrollingKeyboard, ScrollingKeyboardCallback } from "@/utils/keyboard";
import { sendOrEdit as sendOrEditMessage } from "@/utils/message";
import { ErrorOccured } from "./ErrorOccured";

export const SUPPORTS_PER_PAGE = 10

enum payloads {
    SUPPORT = "support_",
    BACK_HOME = "back_home",
    SWITCH_TO_EXPANDED = "switch_to_expanded",
}

interface Metadata {
    supportsList: {
        supports: Support[],
        total_supports: number,
        current_page: number,
    }
}

interface InitParams {
    startPage?: number,
    supports?: Support[],
}

export let SupportsList: IState<InitParams> = {
    state_id: "show_supports",
    active_on: "all",
    async process_state(ctx: BetterContext<Metadata>) {
        const supports = ctx.metadata.supportsList.supports as Support[]

        const button_payload = ctx.callback?.payload

        const clamped_page = clamp(ctx.metadata.supportsList.current_page, 0, Math.ceil((ctx.metadata.supportsList.total_supports / SUPPORTS_PER_PAGE - 1)))

        if (button_payload === ScrollingKeyboardCallback.SCROLL_LEFT) {
            ctx.metadata.supportsList.current_page = clamped_page - 1

        } else if (button_payload === ScrollingKeyboardCallback.SCROLL_RIGHT) {
            ctx.metadata.supportsList.current_page = clamped_page + 1

        } else if (button_payload?.startsWith(payloads.SUPPORT)) {
            const id = Number.parseInt(button_payload.split("_")[1]!);

            const support = supports.find((val) => {
                return val.id == id
            })

            if (!support) {
                ErrorOccured.init!(ctx, {
                    nextState: Home
                })

                return ErrorOccured.process_state(ctx)
            }

            await SupportInfo.init!(ctx, {
                nextState: SupportsList,
                support: support,
            })

            return await SupportInfo.process_state(ctx)
        } else if (button_payload === payloads.BACK_HOME) {
            ctx.callback!.payload = undefined
            return await Home.process_state(ctx)

        } else if (button_payload === ScrollingKeyboardCallback.SELECT_PAGE) {
            ctx.callback!.payload = undefined

            NumberSelector.init!(ctx, {
                nextState: SupportsList,
                nextStateFunctionName: "fromSelector",
                nextStateCancelFunctionName: "fromSelectorCancel",
                min: 1,
                max: Math.ceil(ctx.metadata.supportsList.total_supports / SUPPORTS_PER_PAGE)
            })

            return await NumberSelector.process_state(ctx)
        } else if (button_payload === payloads.SWITCH_TO_EXPANDED) {
            ctx.callback!.payload = undefined

            ExpandedSupportsList.init!(ctx, {
                supports: supports,
                startPage: ctx.metadata.supportsList.current_page * SUPPORTS_PER_PAGE
            })

            this.clear!(ctx)

            return await ExpandedSupportsList.process_state(ctx)
        }

        const page = clamp(ctx.metadata.supportsList.current_page, 0, Math.ceil((ctx.metadata.supportsList.total_supports / SUPPORTS_PER_PAGE - 1)))

        function create_keyboard() {
            return createScrollingKeyboard(
                supports.map((val) => {
                    return {
                        id: payloads.SUPPORT + val.id,
                        value: val.short_name!.slice(0, 50),
                    }
                }),
                page,
                {
                    additionalButtons: [
                        [Keyboard.button.callback(lang.SEPARATOR, "none")],
                        [Keyboard.button.callback(lang.SUPPORTS.SWITCH_TO_EXTENDED, payloads.SWITCH_TO_EXPANDED)],
                        [Keyboard.button.callback(lang.GO_BACK, payloads.BACK_HOME)]
                    ],

                    valuesPerPage: SUPPORTS_PER_PAGE,

                    hideControlsIfNotEnough: true,
                },
            )
        }

        const total_supports = ctx.metadata.supportsList.total_supports
        const ending = getWordEnding(total_supports)

        let message = ending === Ending.NONE ? lang.SUPPORTS.SELECT_SUPPORT_FROM_LIST_NONE : ending === Ending.SINGLE ? lang.SUPPORTS.SELECT_SUPPORT_FROM_LIST_SINGLE : lang.SUPPORTS.SELECT_SUPPORT_FROM_LIST_PLURAL

        await sendOrEditMessage(
            ctx,
            {
                message_id: ctx.currentState?.state_id == SupportsList.state_id ? ctx.message?.body.mid : undefined,
                text: format(message, {
                    total_supports: total_supports,
                }),
                extra: {
                    attachments: [
                        create_keyboard()
                    ]
                }
            }
        )

        return SupportsList
    },

    async init(ctx: BetterContext<Metadata>, args) {
        ctx.metadata.supportsList = {
            supports: args.supports ?? [],
            total_supports: (args.supports ?? []).length,
            current_page: args.startPage ?? 0,
        }

        ctx.metadata.supportsList.total_supports = ctx.metadata.supportsList.supports.length
        return SupportsList
    },

    async clear(ctx) {
        delete ctx.metadata.supportsList
    },

    async fromSelector(ctx: BetterContext, value: number) {
        ctx.metadata.supportsList.current_page = value - 1

        return this.process_state(ctx)
    },

    async fromSelectorCancel(ctx: BetterContext<Metadata>) {
        return await this.process_state(ctx)
    },
}
