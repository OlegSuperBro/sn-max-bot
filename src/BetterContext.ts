import { Api, Context } from "@maxhub/max-bot-api";
import State from "./state/IState";
import { BotInfo, Update } from "@maxhub/max-bot-api/types";

class BetterContext<T = any> extends Context {
    currentState: State<any> | null | undefined;
    metadata: T;

    constructor (update: Update, api: Api, botInfo?: BotInfo | undefined) {
        super(update, api, botInfo)
        this.metadata = {} as T
    }

    public clearMetadata() {
        this.metadata = {} as T
    }
}

export default BetterContext