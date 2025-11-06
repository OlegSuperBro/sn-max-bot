import get_redis from "@/redis"
import IState from "./IState"

import Start from "./states/Start"
import allStates from "./states"

const DEFAULT_STATE = Start

type State = IState<any>

// TODO move it at better place
let STATES: State[] = allStates

let NAME_STATE: Map<string, State> = new Map()

STATES.forEach((state) => {
    NAME_STATE.set(state.state_id, state)
})


function compose_user_key(user_id: string): string {
    return `user_state:${user_id}`
}

function compose_metadata_key(user_id: string): string {
    return `user_metadata:${user_id}`
}

export async function reset_state(user_id: string): Promise<State> {
    await set_state(user_id, DEFAULT_STATE)
    return DEFAULT_STATE
}

export async function set_state(user_id: string, state: State) {
    const redis = await get_redis()
    const user_key = compose_user_key(user_id)

    await redis.set(user_key, state.state_id)
}

export async function get_state(user_id: string): Promise<State | null> {
    const redis = await get_redis()

    const key = compose_user_key(user_id)

    let name = await redis.get(key)

    if (!name) {
        return null
    }

    let state = NAME_STATE.get(name)
    let state_inst: State | null = state === undefined ? null : state

    return state_inst
}

export function get_state_from_id(id: string): State | null {
    let state = NAME_STATE.get(id)
    return state === undefined ? null : state
}

export async function reset_metadata(user_id: string) {
    const redis = await get_redis()
    const metadata_key = compose_metadata_key(user_id)
    await redis.del(metadata_key)
}

export async function set_metadata(user_id: string, metadata: any) {
    const redis = await get_redis()
    const metadata_key = compose_metadata_key(user_id)

    await redis.set(metadata_key, JSON.stringify(metadata))
}

export async function get_metadata(user_id: string): Promise<any> {
    const redis = await get_redis()
    const metadata_key = compose_metadata_key(user_id)

    const data = await redis.get(metadata_key)

    return data ? JSON.parse(data) : {}
}
