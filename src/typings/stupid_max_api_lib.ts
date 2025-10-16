export enum UpdateType {
    message_created,
    message_callback,
    message_edited,
    message_remove,

    bot_added,
    bot_removed,

    dialog_muted,
    dialog_unmuted,
    dialog_cleared,
    dialog_removed,

    user_added,
    user_removed,

    bot_started,
    bot_stopped,

    chat_title_changed,
    message_chat_created
}