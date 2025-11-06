import BetterContext from "@/BetterContext";
import IState from "../IState";

import lang from "@/strings/ru.json"
import { get_state_from_id } from "../state_managing";

interface InitParams {
    errorText?: string,
    nextState: IState<any>,
    passToNextStateInit?: any
}

interface Metadata {
    error: {
        errorText: string,
        nextStateId: string,
        passToNextStateInit?: any,
        sent: boolean,
    }
}

export let ErrorOccured: IState<InitParams> = {
    state_id: "error",
    active_on: "all",

    async process_state(ctx: BetterContext<Metadata>) {
        if (ctx.metadata.error.sent) {
            const next_state = get_state_from_id(ctx.metadata.error.nextStateId)

            if (!next_state) {
                return;
            }

            if (ctx.metadata.error.passToNextStateInit) {
                next_state.init!(ctx, ctx.metadata.error.passToNextStateInit)
            }

            return next_state.process_state(ctx)
        }

        ctx.metadata.error.sent = true;


        return ErrorOccured
    },

    async init(ctx: BetterContext<Metadata>, args) {
        ctx.metadata.error = {
            errorText: args.errorText ?? lang.ERROR_OCCURED.CRITICAL,
            nextStateId: args.nextState.state_id,
            passToNextStateInit: args.passToNextStateInit,
            sent: false
        }

        return ErrorOccured;
    },
}