export function clamp(value: number, from: number, to: number) {
    return Math.min(to, Math.max(from, value))
}