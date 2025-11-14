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
import { NumericalProperty } from '@/typings/api'
import { selectFilterSectionProperty } from './SelectProperty'
import { YesNoPrompt } from '../utils/YesNoPrompt'
import format from '@/utils/format'
import { NumberSelector } from '../utils/NumberSelector'

interface Metadata {
    propertyNumerical: {
        property: NumericalProperty,
        section?: FilterSection,
    }
}

interface InitParams {
    property: NumericalProperty,
    section?: FilterSection,
}

enum payloads {
    BACK = 'back',
}

export let PropertyNumerical: IState<InitParams> = {
    state_id: 'answer_property_numerical',
    active_on: 'all',
    async process_state(ctx: BetterContext<Metadata>) {
        const section = ctx.metadata.propertyNumerical.section
        const property = ctx.metadata.propertyNumerical.property

        const old_value = ctx.userData.portrait.getValue({
            type: 'n',
            property: property,
        })

        await NumberSelector.init!(ctx, {
            nextState: PropertyNumerical,
            nextStateFunctionName: 'fromSelector',
            nextStateCancelFunctionName: 'fromSelectorCancel',
            prompt:
                (section
                    ? format(lang.FILTER.ENTER_NUMERICAL_VALUE, {
                          section_name: section.name,
                          property_name: property.name,
                      })
                    : format(lang.FILTER.ENTER_SINGLE_NUMERICAL_VALUE, {
                          property_name: property.name,
                      })) +
                (old_value
                    ? format(lang.FILTER.OLD_VALUE, { old_value: old_value[0] })
                    : ''),
            before_additional_buttons:
            old_value ? [
                {
                    payload: payloads.DELETE_VALUE,
                    text: lang.FILTER.DELETE_VALUE
                }
            ] : []
        })

        return await NumberSelector.process_state(ctx)
    },

    async init(ctx: BetterContext<Metadata>, args) {
        ctx.metadata.propertyNumerical = {
            property: args.property,
            section: args.section,
        }

        return PropertyNumerical
    },

    async fromSelector(ctx: BetterContext<Metadata>, value: number) {
        await ctx.reply(`GOT VALUE: ${value}`)
        return await selectFilterSectionProperty.process_state(ctx)
    },

    async fromSelectorCancel(ctx: BetterContext<Metadata>) {
        return await selectFilterSectionProperty.process_state(ctx)
    },
}
