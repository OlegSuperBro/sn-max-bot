import BetterContext from '@/BetterContext'
import IState from '../../IState'
import {
    createScrollingKeyboard,
    ScrollingKeyboardCallback,
} from '@/utils/keyboard'
import { clamp } from '@/utils/things'
import { ErrorOccured } from '../ErrorOccured'
import Home from '../Home'
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
    }
}

interface InitParams {
    property: NumericalProperty,
}

enum payloads {
    BACK = 'back',
}

export let PropertyNumerical: IState<InitParams> = {
    state_id: 'answer_property_numerical',
    active_on: 'all',
    async process_state(ctx: BetterContext<Metadata>) {
        const property = ctx.metadata.propertyNumerical.property

        await NumberSelector.init!(ctx, {
            nextState: PropertyNumerical,
            nextStateFunctionName: "fromSelector",
            nextStateCancelFunctionName: "fromSelectorCancel",
            prompt: "TEST",
        })
    },

    async init(ctx: BetterContext<Metadata>, args) {
        ctx.metadata.propertyNumerical = {
            property: args.property,
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
