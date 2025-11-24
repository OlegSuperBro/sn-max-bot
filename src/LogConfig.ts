import { DefaultChannels, LogLevel } from "typescript-logging";
import {CategoryProvider, Category} from "typescript-logging-category-style";
import BetterContext from "./BetterContext";
import { access, constants, FileHandle, mkdir, open } from "fs/promises";

import { type WriteStream as fsWriteStream } from "fs";
import { type WriteStream as ttyWriteStream } from "tty";

const DEBUG = process.env["NODE_ENV"] == "development"

const ALWAYS_WRITE_TO_TTY = true

//                   ms     sec  min  hour
const FILE_TIMEOUT = 1000 * 60 * 60 * 12

/// Timestamp
let fileOpened: number = 0;
let file: FileHandle | null;

let writeStream: fsWriteStream | ttyWriteStream

async function getFileSream() {
    try {
        await access("logs", constants.W_OK);
    } catch (error) {
        // @ts-ignore fuck you
        if (error.code === 'ENOENT') {
            try {
                await mkdir("logs", { recursive: true });
            } catch (mkdirError) {
                // @ts-ignore fuck you
                console.error(`Failed to create directory: ${mkdirError.message}`);
            }
        } else {
            // @ts-ignore fuck you
            console.error(`Error accessing directory: ${error.message}`);
            console.log("Defaulting to stdout")

            return process.stdout
        }
    }

    if (file && (fileOpened + FILE_TIMEOUT < Date.now())) {
        await file.close()
        file = null
    }

    if (!file) {
        const date = new Date()
        const dateStr = `${date.getFullYear().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

        let num = 0
        while (true) {
            try {
                await access(`logs/${dateStr}_${num}.log`)
                num += 1
            } catch (error) {
                // @ts-ignore fuck you
                if (error.code === 'ENOENT') {
                    break
                }
                num += 1
            }
        }

        file = await open(`logs/${dateStr}_${num}.log`, 'a')
        fileOpened = Date.now()

        writeStream = file.createWriteStream()
    }

    return writeStream
}


const mainProvider = CategoryProvider.createProvider("main", {
    level: LogLevel.Debug,
    channel: {
        type: "RawLogChannel",
        async write(msg, formatArg) {
            const date = new Date(msg.timeInMillis);
            const dateStr = `${date.getFullYear().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${date.getMilliseconds().toString().padStart(3, "0")}`;
            const ctx = msg.args?.find(x => x instanceof BetterContext)

            let logNames: string

            if (Array.isArray(msg.logNames)) {
                logNames = msg.logNames.join(">")
            } else {
                logNames = (msg.logNames as string).split("#").join(">")
            }

            let message: string;
            if (ctx) {
                message = `${dateStr} [${logNames}] [${LogLevel[msg.level]}] (${ctx.user?.user_id}) (${ctx.currentState?.state_id}) ${msg.message}`
            } else {
                message = `${dateStr} [${logNames}] [${LogLevel[msg.level]}] ${msg.message}`
            }

            if (!DEBUG) {
                const stream = await getFileSream()
                stream.write(message + "\n")
            }
            if (DEBUG || ALWAYS_WRITE_TO_TTY){
                console.log(message)
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

