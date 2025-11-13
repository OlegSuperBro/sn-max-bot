import BetterContext from '@/BetterContext'
import IState from '../../IState'
import {
    createScrollingKeyboard,
    ScrollingKeyboardCallback,
} from '@/utils/keyboard'
import { clamp } from '@/utils/things'
import { ErrorOccured } from '../ErrorOccured'
import { Home } from '../Home'
import { sendOrEdit } from '@/utils/message'
import { Keyboard } from '@maxhub/max-bot-api'
import lang from '@/strings/ru.json'
import { QualityProperty, QualityPropertyType } from '@/typings/api'
import { selectFilterSectionProperty } from './SelectProperty'
import { YesNoPrompt } from '../utils/YesNoPrompt'
import format from '@/utils/format'

interface Metadata {
    propertyQuality: {
        propertyType: QualityPropertyType,
        currentPage: number,

        selectedProperty?: QualityProperty
    }
}

interface InitParams {
    propertyType: QualityPropertyType,
}

enum payloads {
    OPTION = 'option_',
    BACK = 'back',
    DELETE = 'delete'
}

const VALUES_PER_PAGE = 5

export let PropertyQuality: IState<InitParams> = {
    state_id: 'answer_property_quality',
    active_on: 'all',
    async process_state(ctx: BetterContext<Metadata>) {
        const qualityPropertyType = ctx.metadata.propertyQuality.propertyType
        const button_payload = ctx.callback?.payload

        let page = clamp(ctx.metadata.propertyQuality.currentPage, 0, Math.ceil((qualityPropertyType.qualityProperties.length / VALUES_PER_PAGE - 1)))

        if (button_payload === ScrollingKeyboardCallback.SCROLL_LEFT) {
            ctx.metadata.propertyQuality.currentPage = page - 1
        } else if (button_payload === ScrollingKeyboardCallback.SCROLL_RIGHT) {
            ctx.metadata.propertyQuality.currentPage = page + 1
        } else if (button_payload?.startsWith(payloads.OPTION)) {
            const id = Number.parseInt(button_payload.split('_')[1]!)

            const qProperty = qualityPropertyType.qualityProperties.find((val) => {
                return val.id == id
            })

            if (!qProperty) {
                ErrorOccured.init!(ctx, {
                    nextState: Home,
                })

                return ErrorOccured.process_state(ctx)
            }

            if (qProperty.name.length >= 45) {
                await YesNoPrompt.init!(ctx, {
                    nextState: PropertyQuality,
                    yesCallbackName: "confirm",
                    noCallbackName: "abort",
                    prompt: format(lang.FILTER.CONFIRM_VALUE_SELECTION, {
                        value: qProperty.name
                    })
                })

                return await YesNoPrompt.process_state(ctx)
            }

            ctx.userData.portrait.addProperty({
                type: "q",
                property: qualityPropertyType
            }, qProperty)

            return await selectFilterSectionProperty.process_state(ctx)

        } else if (button_payload === payloads.BACK) {
            ctx.callback!.payload = undefined
            return await selectFilterSectionProperty.process_state(ctx)
        } else if (button_payload === payloads.DELETE) {
            ctx.callback!.payload = undefined
            ctx.userData.portrait.removeAllQualityProperties(qualityPropertyType)
            return await selectFilterSectionProperty.process_state(ctx)
        }

        page = clamp(ctx.metadata.propertyQuality.currentPage, 0, Math.ceil((qualityPropertyType.qualityProperties.length / VALUES_PER_PAGE - 1)))

        // TODO hide "delete value" only if value in portrait
        function create_keyboard() {
            if (qualityPropertyType.qualityProperties.length <= 2) {
                return Keyboard.inlineKeyboard([
                    qualityPropertyType.qualityProperties.map((x) => {
                        return Keyboard.button.callback(`${x.name}`, `${payloads.OPTION}${x.id}`)
                    }),
                    [Keyboard.button.callback(lang.GO_BACK, payloads.BACK), Keyboard.button.callback(lang.FILTER.DELETE_VALUE, payloads.DELETE)]
                ])
            } else if (qualityPropertyType.qualityProperties.length <= 8) {
                return Keyboard.inlineKeyboard([
                    ...qualityPropertyType.qualityProperties.map((x) => {
                        return [Keyboard.button.callback(`${x.name}`, `${payloads.OPTION}${x.id}`)]
                    }),
                    [Keyboard.button.callback(lang.GO_BACK, payloads.BACK), Keyboard.button.callback(lang.FILTER.DELETE_VALUE, payloads.DELETE)]
                ])
            } else {
                return createScrollingKeyboard(
                    qualityPropertyType.qualityProperties.map((x) => {
                        return {
                            id: `${payloads.OPTION}${x.id}`,
                            value: `${x.name}`,
                        }
                    }),
                    page,
                    {
                        additionalButtons: [
                            [Keyboard.button.callback(lang.GO_BACK, payloads.BACK), Keyboard.button.callback(lang.FILTER.DELETE_VALUE, payloads.DELETE)]
                        ],
                        valuesPerPage: VALUES_PER_PAGE
                    }
                )
            }
        }

        await sendOrEdit(ctx, {
            message_id: ctx.currentState?.state_id == PropertyQuality.state_id ? ctx.message?.body.mid : undefined,
            text: "test",
            extra: {
                attachments: [
                    create_keyboard()
                ]
            }
        })

        return PropertyQuality
    },

    async init(ctx: BetterContext<Metadata>, args) {
        ctx.metadata.propertyQuality = {
            propertyType: args.propertyType,
            currentPage: 0
        }

        return PropertyQuality
    },

    async fromSelector(ctx: BetterContext<Metadata>, value: number) {
        ctx.metadata.propertyQuality.currentPage = value - 1

        return this.process_state(ctx)
    },

    async fromSelectorCancel(ctx: BetterContext<Metadata>) {
        return await this.process_state(ctx)
    },

    async confirm(ctx: BetterContext<Metadata>) {
        const qProperty = ctx.metadata.propertyQuality.selectedProperty!
        await ctx.reply(`WIP\nCONFIRMED:${qProperty.id} - ${qProperty.name}`)
        return await selectFilterSectionProperty.process_state(ctx);
    },

    async abort(ctx: BetterContext<Metadata>) {
        const qProperty = ctx.metadata.propertyQuality.selectedProperty!
        await ctx.reply(`WIP\nABORTED:${qProperty.id} - ${qProperty.name}`)
        return await PropertyQuality.process_state(ctx)
    },
}
