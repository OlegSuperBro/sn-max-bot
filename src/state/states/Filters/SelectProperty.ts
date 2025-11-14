import { FilterSection } from "@/typings/filter";
import IState from "../../IState";
import lang from "@/strings/ru.json"
import BetterContext from "@/BetterContext";
import { clamp } from "@/utils/things";
import { createScrollingKeyboard, ScrollingKeyboardCallback } from "@/utils/keyboard";
import { NumberSelector } from "../utils/NumberSelector";
import { ErrorOccured } from "../ErrorOccured";
import { Home } from "../Home";
import { sendOrEdit } from "@/utils/message";
import { Keyboard } from "@maxhub/max-bot-api";
import { SelectFilterSection } from "./SelectFilterSection";
import { PropertyQuality } from "./PropertyQuality";
import { NumericalProperty, QualityPropertyType } from "@/typings/api";
import { PropertyNumerical } from "./PropertyNumerical";
import format from "@/utils/format";

interface Metadata {
    selectFilterSectionProperty: {
        section: FilterSection,
        currentPage: number,
    }
}

interface InitParams {
    section: FilterSection
}

enum payloads {
    PROPERTY = "property_",
    BACK = "BACK_HOME",
    SELECT_PAGE = "SELECT_PAGE"
}

const PROPERTIES_PER_PAGE = 5

export let selectFilterSectionProperty: IState<InitParams> = {
    state_id: "select_filter_section_property",
    active_on: "all",
    async process_state(ctx: BetterContext<Metadata>) {
        const section = ctx.metadata.selectFilterSectionProperty.section
        const button_payload = ctx.callback?.payload

        let page = clamp(ctx.metadata.selectFilterSectionProperty.currentPage, 0, Math.ceil((section.properties.length / PROPERTIES_PER_PAGE - 1)))

        if (button_payload === ScrollingKeyboardCallback.SCROLL_LEFT) {
            ctx.metadata.selectFilterSectionProperty.currentPage = page - 1
        } else if (button_payload === ScrollingKeyboardCallback.SCROLL_RIGHT) {
            ctx.metadata.selectFilterSectionProperty.currentPage = page + 1
        } else if (button_payload?.startsWith(payloads.PROPERTY)) {
            const type = button_payload.split("_")[1];
            const id = Number.parseInt(button_payload.split("_")[2]!);

            const property = section.properties.find((val) => {
                return val.property.id == id && val.type === type
            })

            if (!property) {
                ErrorOccured.init!(ctx, {
                    nextState: Home
                })

                return ErrorOccured.process_state(ctx)
            }

            if (type === "q") {
                await PropertyQuality.init!(ctx, {propertyType: property!.property as QualityPropertyType})
                return await PropertyQuality.process_state(ctx)
            } else if (type === "n") {
                await PropertyNumerical.init!(ctx, {property: property!.property as NumericalProperty})
                return await PropertyNumerical.process_state(ctx)
            } else {
                throw Error(`unknown type: ${type}`)
            }

        } else if (button_payload === payloads.BACK) {
            ctx.callback!.payload = undefined
            return await SelectFilterSection.process_state(ctx)
        } else if (button_payload === payloads.SELECT_PAGE) {
            ctx.callback!.payload = undefined

            NumberSelector.init!(ctx, {
                nextState: selectFilterSectionProperty,
                nextStateFunctionName: "fromSelector",
                nextStateCancelFunctionName: "fromSelectorCancel",
                min: 1,
                max: Math.ceil((section.properties.length / PROPERTIES_PER_PAGE)),
            })

            return await NumberSelector.process_state(ctx)
        }

        page = clamp(ctx.metadata.selectFilterSectionProperty.currentPage, 0, Math.ceil((section.properties.length / PROPERTIES_PER_PAGE - 1)))

        function create_keyboard() {
            return createScrollingKeyboard(
                section.properties.map((val) => {
                    return {
                        id: `${payloads.PROPERTY}${val.type}_${val.property.id.toString()}`,
                        value: format(
                            ctx.userData.portrait.includes(val) ? lang.FILTER.SECTION_DONE : lang.FILTER.SECTION_NOT_DONE, {
                            name: val.property.name
                        }),
                    }
                }),
                page,
                {
                    additionalButtons: [
                        [Keyboard.button.callback(lang.SEPARATOR, "none")],
                        [Keyboard.button.callback(lang.GO_BACK, payloads.BACK)]
                    ],
                    valuesPerPage: PROPERTIES_PER_PAGE
                }
            )
        }

        await sendOrEdit(ctx, {
            message_id: ctx.currentState?.state_id == selectFilterSectionProperty.state_id ? ctx.message?.body.mid : undefined,
            text: format(lang.FILTER.SELECT_PROPERTY, {
                section_name: section.name
            }),
            extra: {
                attachments: [
                    create_keyboard()
                ],
                format: "markdown"
            }
        })

        return selectFilterSectionProperty
    },

    async init(ctx: BetterContext<Metadata>, args) {
        if (args.section.properties.length == 1) {
            const property = args.section.properties[0]!
            if (property.type == "q") {
                return await PropertyQuality.init!(ctx, {
                    propertyType: args.section.properties[0]!.property as QualityPropertyType,
                    nextState: SelectFilterSection
                })
            } else if (property.type == "n") {
                return await PropertyNumerical.init!(ctx, {
                    property: property.property as NumericalProperty,
                    nextState: SelectFilterSection,
                })
            }
        }
        ctx.metadata.selectFilterSectionProperty = {
            currentPage: 0,
            section: args.section
        }
        return selectFilterSectionProperty
    },
}
