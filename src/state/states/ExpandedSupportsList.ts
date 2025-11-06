import { Support } from "@/typings/api";
import IState from "../IState";
import SupportInfo from "./SupportInfo";
import Home from "./Home";
import { NumberSelector } from "./NumberSelector";
import { SUPPORTS_PER_PAGE, SupportsList } from "./SupportsList";
import { Keyboard } from "@maxhub/max-bot-api";

import lang from "@/strings/ru.json"
import format from "@/utils/format";
import BetterContext from "@/BetterContext";
import { getSupport } from "@/services/api";
import { createScrollingKeyboard } from "@/utils/keyboard";
import { clamp } from "@/utils/things";
import { sendOrEdit } from "@/utils/message";
import { ErrorOccured } from "./ErrorOccured";

interface InitParams {
    supports: Support[],
    startPage?: number,
}

interface Metadata {
    expandedSupportsList: {
        supports: Support[]
        current_page: number,
        total_supports: number,
        support: Support,
        reply_url?: string,
    }
}

enum payloads {
    BACK = "back",
    FORWARD = "forward",
    SUPPORT = "support_",
    BACK_HOME = "back_home",
    SELECT_PAGE = "select_page",
    SWITCH_TO_COMPACT = "switch_to_compact"
}

export let ExpandedSupportsList: IState<InitParams> = {
    state_id: "expanded_supports_list",
    active_on: "all",
    async process_state(ctx: BetterContext<Metadata>) {
        const supports = ctx.metadata.expandedSupportsList.supports as Support[]
        const button_payload = ctx.callback?.payload

        let page = clamp(ctx.metadata.expandedSupportsList.current_page, 0, ctx.metadata.expandedSupportsList.total_supports)

        if (button_payload === payloads.BACK) {
            ctx.metadata.expandedSupportsList.current_page = page - 1
        } else if (button_payload === payloads.FORWARD) {
            ctx.metadata.expandedSupportsList.current_page = page + 1
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

            delete ctx.metadata.expandedSupportsList.reply_url

            SupportInfo.init!(ctx, {
                support: support,
                nextState: ExpandedSupportsList
            })

            return SupportInfo
        } else if (button_payload === payloads.BACK_HOME) {
            // ctx.metadata = {} // TODO
            ctx.callback!.payload = undefined
            await Home.process_state(ctx)
            return Home
        } else if (button_payload === payloads.SELECT_PAGE) {
            ctx.callback!.payload = undefined

            NumberSelector.init!(ctx, {
                nextState: SupportsList,
                nextStateFunctionName: "fromSelector",
                nextStateCancelFunctionName: "fromSelectorCancel",
                min: 1,
                max: ctx.metadata.expandedSupportsList.total_supports
            })

            return await NumberSelector.process_state(ctx)
        } else if (button_payload === payloads.SWITCH_TO_COMPACT) {
            ctx.callback!.payload = undefined

            SupportsList.init!(ctx, {
                supports: supports,
                startPage: Math.floor((ctx.metadata.expandedSupportsList.current_page / SUPPORTS_PER_PAGE))
            })

            return await SupportsList.process_state(ctx)
        }

        page = clamp(ctx.metadata.expandedSupportsList.current_page, 0, ctx.metadata.expandedSupportsList.total_supports)

        const support = (await getSupport(supports[page]!.id!)).data!

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
                    firstAdditionalButton: [
                        [Keyboard.button.link(lang.SUPPORTS.OPEN_ON_SITE, `https://sn.stavregion.ru/support/${support.id}`)],
                    ],
                    additionalButtons: [
                        [Keyboard.button.callback(lang.SUPPORTS.SWITCH_TO_COMPACT, payloads.SWITCH_TO_COMPACT)],
                        [Keyboard.button.callback(lang.GO_BACK, payloads.BACK_HOME)]
                    ]
                }

            )
        }

        ctx.metadata.expandedSupportsList.reply_url = await sendOrEdit(
            ctx,
            {
                message_id: ctx.metadata.expandedSupportsList.reply_url,
                text: format(lang.SUPPORTS.EXPANDED_TEXT, {
                    name: support.full_name,
                    description: support.description,
                    result: support.result,
                    provider: support.provider,
                    organizations: "- " + support.organizations!.map((val) => `[${val.name}](${val.link})`).join("\n- ")
                }),
                extra: {
                    attachments: [
                        create_keyboard()
                    ],
                    format: "markdown"
                }
            }
        )

        return ExpandedSupportsList
    },

    async init(ctx, args) {
        ctx.metadata.expandedSupportsList = {}
        ctx.metadata.expandedSupportsList.supports = args.supports
        ctx.metadata.expandedSupportsList.total_supports = ctx.metadata.expandedSupportsList.supports.length
        ctx.metadata.expandedSupportsList.current_page = args.startPage ?? 0
        return ExpandedSupportsList
    },

    async clear(ctx) {
        delete ctx.metadata.expandedSupportsList
    },

    async fromSelector(ctx: BetterContext<Metadata>, value: number) {
        const supports = ctx.metadata.expandedSupportsList.supports
        await this.clear!(ctx)
        await this.init!(ctx, {
            startPage: value - 1,
            supports: supports
        })

        return await this.process_state(ctx)
    },

    async fromSelectorCancel(ctx: BetterContext<Metadata>) {
        delete ctx.metadata.expandedSupportsList.reply_url
        return await this.process_state(ctx)
    },
}