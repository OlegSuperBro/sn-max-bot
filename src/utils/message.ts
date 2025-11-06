import BetterContext from "@/BetterContext";
import { EditMessageExtra, SendMessageExtra } from "@/typings/stupid_max_api_lib";

interface SendOrEditOptions {
    message_id?: string
    text?: string,
    extra?: Omit<SendMessageExtra, 'link'> | Omit<EditMessageExtra, 'link'>
}

export async function sendOrEdit(ctx: BetterContext, options?: SendOrEditOptions) {
    const {
        message_id,
        text,
        extra,
    }: SendOrEditOptions = {
        text: "NO_MESSAGE",
        ...options
    }

    let new_message_id: string = message_id ?? ""

    if (message_id) {
        await ctx.editMessage(
            {
                text: text,
                link: {
                    type: "reply",
                    mid: message_id,
                },
                ...extra
            }
        )
    } else {
        new_message_id = (await ctx.reply(
            text,
            extra
        )).body.mid
    }

    return new_message_id
}