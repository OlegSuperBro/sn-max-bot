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
import { FilterSection } from '@/typings/filter'
import { get_state_from_id } from '@/state/state_managing'

interface Metadata {
    propertyQuality: {
        nextStateId: string
        nextStateInitParams?: any

        section?: FilterSection
        propertyType: QualityPropertyType
        currentPage: number

        selectedProperty?: QualityProperty
    }
}

interface InitParams {
    nextState?: IState<any>
    nextStateInitParams?: any
    section?: FilterSection
    propertyType: QualityPropertyType
}

enum payloads {
    OPTION = 'option_',
    BACK = 'back',
    DELETE = 'delete',
}

const VALUES_PER_PAGE = 5

export let PropertyQuality: IState<InitParams> = {
    state_id: 'answer_property_quality',
    active_on: 'all',
    async process_state(ctx: BetterContext<Metadata>) {
        const section = ctx.metadata.propertyQuality.section
        const qualityPropertyType = ctx.metadata.propertyQuality.propertyType
        const button_payload = ctx.callback?.payload

        const next_state = get_state_from_id(
            ctx.metadata.propertyQuality.nextStateId
        )!
        const next_state_init_params =
            ctx.metadata.propertyQuality.nextStateInitParams

        let page = clamp(
            ctx.metadata.propertyQuality.currentPage,
            0,
            Math.ceil(
                qualityPropertyType.qualityProperties.length / VALUES_PER_PAGE -
                    1
            )
        )

        if (button_payload === ScrollingKeyboardCallback.SCROLL_LEFT) {
            ctx.metadata.propertyQuality.currentPage = page - 1
        } else if (button_payload === ScrollingKeyboardCallback.SCROLL_RIGHT) {
            ctx.metadata.propertyQuality.currentPage = page + 1
        } else if (button_payload?.startsWith(payloads.OPTION)) {
            const id = Number.parseInt(button_payload.split('_')[1]!)

            const qProperty = qualityPropertyType.qualityProperties.find(
                (val) => {
                    return val.id == id
                }
            )

            if (!qProperty) {
                ErrorOccured.init!(ctx, {
                    nextState: Home,
                })

                return ErrorOccured.process_state(ctx)
            }

            // 45
            if (qProperty.name.length >= 0) {
                ctx.metadata.propertyQuality.selectedProperty = qProperty

                await YesNoPrompt.init!(ctx, {
                    nextState: PropertyQuality,
                    yesCallbackName: 'confirm',
                    noCallbackName: 'abort',
                    prompt: format(lang.FILTER.CONFIRM_VALUE_SELECTION, {
                        value: qProperty.name,
                    }),
                })

                return await YesNoPrompt.process_state(ctx)
            }

            if (qualityPropertyType.filterFieldCode === 'multiselect') {
                ctx.callback!.payload = undefined

                if (
                    ctx.userData.portrait
                        .getValue({
                            type: 'q',
                            property: qualityPropertyType,
                        })
                        ?.includes(qProperty.id)
                ) {
                    ctx.userData.portrait.removePropertyValue(
                        {
                            type: 'q',
                            property: qualityPropertyType,
                        },
                        qProperty
                    )
                } else {
                    ctx.userData.portrait.addProperty(
                        {
                            type: 'q',
                            property: qualityPropertyType,
                        },
                        qProperty
                    )
                }

                return await PropertyQuality.process_state(ctx)
            }

            ctx.userData.portrait.addProperty(
                {
                    type: 'q',
                    property: qualityPropertyType,
                },
                qProperty
            )

            let new_state = next_state

            if (next_state_init_params) {
                new_state = await next_state.init!(ctx, next_state_init_params)
            }

            return await new_state.process_state(ctx)
        } else if (button_payload === payloads.BACK) {
            ctx.callback!.payload = undefined

            if (next_state_init_params) {
                await next_state.init!(ctx, next_state_init_params)
            }
            return await next_state.process_state(ctx)
        } else if (button_payload === payloads.DELETE) {
            ctx.callback!.payload = undefined
            ctx.userData.portrait.removeAllQualityProperties(
                qualityPropertyType
            )

            return await PropertyQuality.process_state(ctx)
        }

        page = clamp(
            ctx.metadata.propertyQuality.currentPage,
            0,
            Math.ceil(
                qualityPropertyType.qualityProperties.length / VALUES_PER_PAGE -
                    1
            )
        )

        // TODO hide "delete value" only if value in portrait
        function create_keyboard() {
            function getPropertyName(x: QualityProperty) {
                return ctx.userData.portrait
                    .getValue({
                        type: 'q',
                        property: qualityPropertyType,
                    })
                    ?.includes(x.id)
                    ? format(lang.FILTER.SECTION_DONE, {
                          name: x.name,
                      })
                    : format(lang.FILTER.SECTION_NOT_DONE, {
                          name: x.name,
                      })
            }

            if (qualityPropertyType.qualityProperties.length <= 2) {
                return Keyboard.inlineKeyboard([
                    qualityPropertyType.qualityProperties.map((x) => {
                        return Keyboard.button.callback(
                            getPropertyName(x),
                            `${payloads.OPTION}${x.id}`
                        )
                    }),
                    [Keyboard.button.callback(lang.SEPARATOR, 'none')],

                    [Keyboard.button.callback(lang.GO_BACK, payloads.BACK)],
                    [
                        Keyboard.button.callback(
                            lang.FILTER.DELETE_ALL_VALUES,
                            payloads.DELETE
                        ),
                    ],
                ])
            } else if (qualityPropertyType.qualityProperties.length <= 8) {
                return Keyboard.inlineKeyboard([
                    ...qualityPropertyType.qualityProperties.map((x) => {
                        return [
                            Keyboard.button.callback(
                                getPropertyName(x),
                                `${payloads.OPTION}${x.id}`
                            ),
                        ]
                    }),
                    [Keyboard.button.callback(lang.SEPARATOR, 'none')],

                    [Keyboard.button.callback(lang.GO_BACK, payloads.BACK)],
                    [
                        Keyboard.button.callback(
                            lang.FILTER.DELETE_ALL_VALUES,
                            payloads.DELETE
                        ),
                    ],
                ])
            } else {
                return createScrollingKeyboard(
                    qualityPropertyType.qualityProperties.map((x) => {
                        return {
                            id: `${payloads.OPTION}${x.id}`,
                            value: getPropertyName(x),
                        }
                    }),
                    page,
                    {
                        additionalButtons: [
                            [Keyboard.button.callback(lang.SEPARATOR, "none")],
                            [
                                Keyboard.button.callback(
                                    lang.GO_BACK,
                                    payloads.BACK
                                ),
                            ],
                            [
                                Keyboard.button.callback(
                                    lang.FILTER.DELETE_ALL_VALUES,
                                    payloads.DELETE
                                ),
                            ],
                        ],
                        valuesPerPage: VALUES_PER_PAGE,
                    }
                )
            }
        }

        await sendOrEdit(ctx, {
            message_id:
                ctx.currentState?.state_id == PropertyQuality.state_id
                    ? ctx.message?.body.mid
                    : undefined,
            text: section
                ? format(lang.FILTER.SELECT_QUALITY_VALUE, {
                      section_name: section.name,
                      property_name: qualityPropertyType.name,
                  })
                : format(lang.FILTER.SELECT_SINGLE_QUALITY_VALUE, {
                      property_name: qualityPropertyType.name,
                  }),
            extra: {
                attachments: [create_keyboard()],
                format: 'markdown',
            },
        })

        return PropertyQuality
    },

    async init(ctx: BetterContext<Metadata>, args) {
        ctx.metadata.propertyQuality = {
            nextStateId:
                args.nextState?.state_id ??
                selectFilterSectionProperty.state_id,
            nextStateInitParams: args.nextStateInitParams,

            propertyType: args.propertyType,
            currentPage: 0,
            section: args.section,
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
        const qualityPropertyType = ctx.metadata.propertyQuality.propertyType
        const qProperty = ctx.metadata.propertyQuality.selectedProperty!

        if (qualityPropertyType.filterFieldCode === 'multiselect') {
            ctx.callback!.payload = undefined

            if (
                ctx.userData.portrait
                    .getValue({
                        type: 'q',
                        property: qualityPropertyType,
                    })
                    ?.includes(qProperty.id)
            ) {
                ctx.userData.portrait.removePropertyValue(
                    {
                        type: 'q',
                        property: qualityPropertyType,
                    },
                    qProperty
                )
            } else {
                ctx.userData.portrait.addProperty(
                    {
                        type: 'q',
                        property: qualityPropertyType,
                    },
                    qProperty
                )
            }

            return await PropertyQuality.process_state(ctx)
        }

        ctx.userData.portrait.addProperty(
            {
                type: 'q',
                property: qualityPropertyType,
            },
            qProperty
        )
        return await selectFilterSectionProperty.process_state(ctx)
    },

    async abort(ctx: BetterContext<Metadata>) {
        return await PropertyQuality.process_state(ctx)
    },
}
