import get_redis from "@/redis"
import IState, { cloneState } from "./IState"

import HomeState from "./states/Home"
import allStates from "./states"

const DEFAULT_STATE = HomeState

// TODO move it at better place
let STATES: IState[] = allStates

let NAME_STATE: Map<string, IState> = new Map()

STATES.forEach((state) => {
    NAME_STATE.set(state.state_id, state)
})


function compose_user_key(user_id: string): string {
    return `user_state:${user_id}`
}

function compose_state_key(user_id: string): string {
    return `state_metadata:${user_id}`
}

export async function reset_state(user_id: string) {
    set_state(user_id, DEFAULT_STATE)
}

export async function set_state(user_id: string, state: IState) {
    const redis = await get_redis()
    const user_key = compose_user_key(user_id)
    const state_key = compose_state_key(user_id)

    await redis.del(state_key)

    await redis.set(user_key, state.state_id)

    // :)
    if (JSON.stringify(state.metadata) !== "{}") {
        await redis.set(state_key, JSON.stringify(state.metadata))
    }
}

export async function get_state(user_id: string): Promise<IState | null> {
    const redis = await get_redis()

    const key = compose_user_key(user_id)

    let name = await redis.get(key)

    if (!name) {
        return null
    }

    let state = NAME_STATE.get(name)

    let state_inst: IState | null = state === undefined ? null : cloneState(state)

    if (!state_inst) {
        return null
    }

    const metadata_key = compose_state_key(user_id)
    let metadata = await redis.get(metadata_key)

    if (metadata) {
        state_inst.metadata = JSON.parse(metadata)
    }

    return state_inst

}