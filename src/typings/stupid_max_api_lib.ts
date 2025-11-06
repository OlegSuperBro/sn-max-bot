import { AttachmentRequest, MessageLinkType } from "@maxhub/max-bot-api/types";

// fuck you
type SendMessageDTO = {
    query: {
        user_id?: number;
        chat_id?: number;
        disable_link_preview?: boolean;
    };
    body: {
        text?: string | null;
        attachments?: AttachmentRequest[] | null;
        link?: {
            type: MessageLinkType;
            mid: string;
        } | null;
        notify?: boolean;
        format?: 'markdown' | 'html' | null;
    };
};
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ReqOptions = {
    method?: HTTPMethod;
    body?: object | null;
    query?: Record<string, string | number | boolean | null | undefined>;
    path?: Record<string, string | number>;
};

type FlattenReq<T extends Omit<ReqOptions, 'method'>> = T['body'] & T['query'] & T['path'];

export type SendMessageExtra = Omit<FlattenReq<SendMessageDTO>, 'chat_id' | 'user_id' | 'text'>;

type EditMessageDTO = {
    query: {
        message_id: string;
    };
    body: SendMessageDTO['body'];
};

export type EditMessageExtra = Omit<FlattenReq<EditMessageDTO>, 'message_id'>;