import BetterContext from "@/BetterContext";
import { UpdateType } from "@maxhub/max-bot-api/types";

type NextState = IState;

export default interface IState {
    state_id: string;
    active_on: UpdateType | "all" | null;

    metadata: any; // to pass any data to next state

    process_state: (ctx: BetterContext, metadata?: any) => NextState | void

    force_exit?: ((ctx: BetterContext, metadata?: any) => void)
}

export function cloneState(state: IState): IState {
    let cloned_state: IState = JSON.parse(JSON.stringify(state))

    cloned_state.process_state = state.process_state
    cloned_state.force_exit = state.force_exit

    return cloned_state
}