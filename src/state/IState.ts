import BetterContext from "@/BetterContext";
import { UpdateType } from "@maxhub/max-bot-api/types";

export type NextState = IState<any>;

export default interface IState<initT> {
    state_id: string;
    active_on: UpdateType | "all" | null;

    process_state: (ctx: BetterContext) => Promise<NextState | void>;
    force_exit?: (ctx: BetterContext) => void;
    init?: (ctx: BetterContext, args: initT) => Promise<IState<any>>;
    clear?: (ctx: BetterContext) => Promise<void>;

    [key: string]: any
}