import BetterContext from '@/BetterContext'
import IState from '../../IState'

import lang from '@/strings/ru.json'
import { NumericalProperty } from '@/typings/api'
import { selectFilterSectionProperty } from './SelectProperty'
import format from '@/utils/format'
import { NumberSelector } from '../utils/NumberSelector'
import { FilterSection } from '@/typings/filter'
import { get_state_from_id } from '@/state/state_managing'

interface Metadata {
    propertyNumerical: {
        nextStateId: string,
        nextStateInitParams?: any,

        property: NumericalProperty,
        section?: FilterSection,
    }
}

interface InitParams {
    nextState?: IState<any>,
    nextStateInitParams?: any,

    property: NumericalProperty,
    section?: FilterSection,
}

enum payloads {
    BACK = 'back',
    DELETE_VALUE = 'delete_value',
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

        const next_state = get_state_from_id(ctx.metadata.propertyNumerical.nextStateId)!
        const next_state_init_params = ctx.metadata.propertyNumerical.nextStateInitParams

        const button_payload = ctx.callback?.payload

        if (button_payload === payloads.DELETE_VALUE) {
            ctx.userData.portrait.removeAllNumericalPropertyValues(property)

            let new_state = next_state

            if (next_state_init_params) {
                new_state = await next_state.init!(ctx, next_state_init_params)
            }

            return await new_state.process_state(ctx)
        }

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
            nextStateId: args.nextState?.state_id ?? selectFilterSectionProperty.state_id,
            nextStateInitParams: args.nextStateInitParams,
            property: args.property,
            section: args.section,
        }

        return PropertyNumerical
    },

    async fromSelector(ctx: BetterContext<Metadata>, value: number) {
        const next_state = get_state_from_id(ctx.metadata.propertyNumerical.nextStateId)!
        const next_state_init_params = ctx.metadata.propertyNumerical.nextStateInitParams

        const property = ctx.metadata.propertyNumerical.property
        ctx.userData.portrait.addProperty(
            {
                type: 'n',
                property: property,
            },
            value
        )
        let new_state = next_state

        if (next_state_init_params) {
            new_state = await next_state.init!(ctx, next_state_init_params)
        }

        return await new_state.process_state(ctx)
    },

    async fromSelectorCancel(ctx: BetterContext<Metadata>) {
        const next_state = get_state_from_id(ctx.metadata.propertyNumerical.nextStateId)!
        const next_state_init_params = ctx.metadata.propertyNumerical.nextStateInitParams

        let new_state = next_state

        if (next_state_init_params) {
            new_state = await next_state.init!(ctx, next_state_init_params)
        }

        return await new_state.process_state(ctx)
    },
}
