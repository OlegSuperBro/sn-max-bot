import { Keyboard } from "@maxhub/max-bot-api";
import { Button, CallbackButton } from "@maxhub/max-bot-api/types";

const isDebug = process.env["NODE_ENV"] == "development"

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

    valuesPerPage?: number,
    showValues?: boolean,

    hideControlsIfNotEnough?: boolean
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

        firstAdditionalButton,
        additionalButtons,

        valuesPerPage,
        showValues,

        hideControlsIfNotEnough,
    }: createScrollingKeyboardOptions = {
        scrollLeftCallback: ScrollingKeyboardCallback.SCROLL_LEFT,
        scrollRightCallback: ScrollingKeyboardCallback.SCROLL_RIGHT,
        selectPageCallback: ScrollingKeyboardCallback.SELECT_PAGE,

        scrollLeftText: "<-",
        scrollLeftNotAllowedText: "🚫",

        scrollRightText: "->",
        scrollRightNotAllowedText: "🚫",

        firstAdditionalButton: [],
        additionalButtons: [],
        valuesPerPage: 5,

        showValues: true,

        hideControlsIfNotEnough: false,

        ...options,
    }

    const filtered_values = !showValues ? [] : values.filter((val, idx) => {
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
            if (val.value.length >= 128) {
                if (isDebug) {
                    console.warn(`Value with id=${val.id} is too long (${val.value.length}). Slicing it...`)
                }
            }
            return [Keyboard.button.callback(val.value.slice(0, 128), val.id)]
        }),
        ...firstAdditionalButton,
        hideControlsIfNotEnough && values.length <= valuesPerPage ?
        [] :
        [
            Keyboard.button.callback(page <= 0 ? scrollLeftNotAllowedText : scrollLeftText, scrollLeftCallback),
            Keyboard.button.callback(`${page + 1}/${totalPages}`, selectPageCallback),
            Keyboard.button.callback(page + 1 >= totalPages ? scrollRightNotAllowedText : scrollRightText, scrollRightCallback),
        ],
        ...additionalButtons
    ])
}