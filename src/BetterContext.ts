import { Context } from "@maxhub/max-bot-api";
import IState from "./state/IState";

class BetterContext extends Context {
    currentState: IState | null | undefined
}

export default BetterContext