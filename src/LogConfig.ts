import { DefaultChannels, LogLevel } from "typescript-logging";
import {CategoryProvider, Category} from "typescript-logging-category-style";
import BetterContext from "./BetterContext";

const mainProvider = CategoryProvider.createProvider("main", {
    level: LogLevel.Debug,
    channel: {
        type: "RawLogChannel",
        write(msg, formatArg) {
            const date = new Date(msg.timeInMillis);
            const dateStr = `${date.getFullYear().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${date.getMilliseconds().toString().padStart(3, "0")}`;
            const ctx = msg.args?.find(x => x instanceof BetterContext)

            let logNames: string

            if (Array.isArray(msg.logNames)) {
                logNames = msg.logNames.join("->")
            } else {
                logNames = (msg.logNames as string).split("#").join(">")
            }

            if (ctx) {
                console.log(`${dateStr} [${logNames}] [${LogLevel[msg.level]}] (${ctx.user?.user_id}) (${ctx.currentState?.state_id}) ${msg.message}`);
            } else {
                console.log(`${dateStr} [${logNames}] [${LogLevel[msg.level]}] ${msg.message}`);
            }
        },
    }
});

export function getLogger(name: string): Category {
  return mainProvider.getCategory(name);
}

export const botLog = getLogger("BOT")
export const middlewareLog = botLog.getChildCategory("MIDDLEWARE")
export const stateLog = botLog.getChildCategory("STATE")

export const redisLog = getLogger("REDIS")

