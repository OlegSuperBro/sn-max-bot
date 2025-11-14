export function clamp(value: number, from: number, to: number) {
    return Math.min(to, Math.max(from, value))
}

export enum Ending {
    NONE,
    SINGLE,
    PLURAL
}

export function getWordEnding(num: number): Ending {
    /**
     * INTENDED ONLY FOR RUSSIAN!!!
     */
    if ([11, 12, 13, 14].includes(num)) {
        return Ending.NONE
    } else if (num % 10 == 1) {
        return Ending.SINGLE
    } else if ([2, 3, 4, 5].includes(num % 10)) {
        return Ending.PLURAL
    }

    return Ending.NONE
}