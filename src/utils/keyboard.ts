import { Keyboard } from "@maxhub/max-bot-api";
import { Button, CallbackButton } from "@maxhub/max-bot-api/types";

export enum ScrollingKeyboardCallback {
    SCROLL_LEFT = "scroll_left",
    SCROLL_RIGHT = "scroll_right",
    SELECT_PAGE = "select_page",
    VALUE = "value_"
}

interface createScrollingKeyboardOptions {
    scrollLeftCallback?: string,
    scrollRightCallback?: string,
    selectPageCallback?: string,

    scrollLeftText?: string,
    scrollRightText?: string,

    scrollLeftNotAllowedText?: string,
    scrollRightNotAllowedText?: string,

    firstAdditionalButton?: Button[][],
    additionalButtons?: Button[][],

    valuesPerPage?: number
}

export function createScrollingKeyboard(values: {id: string, value: string}[], page: number, options?: createScrollingKeyboardOptions) {
    const {
        scrollLeftCallback,
        scrollRightCallback,
        selectPageCallback,

        scrollLeftText,
        scrollRightText,

        scrollLeftNotAllowedText,
        scrollRightNotAllowedText,

        additionalButtons,

        valuesPerPage
    }: createScrollingKeyboardOptions = {
        scrollLeftCallback: ScrollingKeyboardCallback.SCROLL_LEFT,
        scrollRightCallback: ScrollingKeyboardCallback.SCROLL_RIGHT,
        selectPageCallback: ScrollingKeyboardCallback.SELECT_PAGE,

        scrollLeftText: "<-",
        scrollLeftNotAllowedText: "🚫",

        scrollRightText: "->",
        scrollRightNotAllowedText: "🚫",

        additionalButtons: [],
        valuesPerPage: 5,

        ...options,
    }

    const filtered_values = values.filter((val, idx) => {
        if (
            (idx >= page * valuesPerPage) &&
            (idx < (page + 1) * valuesPerPage)
        ) {
            return true
        }
        return false
    })
    const totalPages = Math.ceil(values.length / valuesPerPage)

    return Keyboard.inlineKeyboard([
        ...filtered_values.map((val) => {
            return [Keyboard.button.callback(val.value, val.id)]
        }),
        [
            Keyboard.button.callback(page <= 0 ? scrollLeftNotAllowedText : scrollLeftText, scrollLeftCallback),
            Keyboard.button.callback(`${page + 1}/${totalPages}`, selectPageCallback),
            Keyboard.button.callback(page + 1 >= totalPages ? scrollRightNotAllowedText : scrollRightText, scrollRightCallback),
        ],
        ...additionalButtons
    ])
}