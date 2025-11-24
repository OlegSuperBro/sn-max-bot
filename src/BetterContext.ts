import { Api, Context } from "@maxhub/max-bot-api";
import State from "./state/IState";
import { BotInfo, Update } from "@maxhub/max-bot-api/types";
import { NumericalProperty, QualityProperty, QualityPropertyType, Support } from "./typings/api";
import get_redis from "./redis";
import { getFilterLayout, getSupports } from "./services/api";
import { FilterProperty, FilterSection } from "./typings/filter";
import { getLogger } from "./LogConfig";

const logger = getLogger("CACHE")

class GlobalCache {
    private _supports: Support[] = [];
    public async supports(): Promise<Support[]> {
        if (this._supports.length == 0) {
            const redis = await get_redis()

            let supports = await redis.get("supports")

            if (supports) {
                this._supports = JSON.parse(supports)
            } else {
                logger.info("No cache for supports found. Fetching new supports");
                let {
                    data,
                    status
                } = await getSupports({
                    limit: 100000, // can't use Infinity cause after JSON.stringify it's null
                    fields: [
                        "id",
                        "created",
                        "created_by",
                        "last_edit",
                        "full_name",
                        "last_edited_by",
                        "department",
                        "portrait",
                        "used_numerical_properties",
                        "used_quality_properties",
                        "short_name",
                        "organizations",
                        "description",
                        "provider",
                        "terms_and_conditions",
                        "regulation",
                        "result",
                        "provide_type",
                        "documents",
                        "municipalities",
                        "hidden",
                        "provide_text",
                        "provide_url",
                        "scopes"
                    ]
                })
                if (status == 200) {
                    let supports = data!.supports
                    await redis.set("supports", JSON.stringify(supports), {
                        expiration: {
                            type: "EX",
                            //     SEC  MIN  HOUR
                            value: 60 * 60 * 12 // 12 hours
                        }
                    })
                    this._supports = supports
                    logger.info(`Update successfully. Supports cache expires at ${new Date((Date.now() + (60 * 60 * 12 * 1000))).toDateString()}`)
                } else {
                    logger.error(`Invalid response status from supports request: ${status}`)
                    throw new Error(`Invalid status: ${status}`)
                }
            }
        }

        return this._supports;
    }

    private _filterLayout: FilterSection[] = [];
    public async filterLayout(): Promise<FilterSection[]> {
        if (this._filterLayout.length == 0) {
            const redis = await get_redis()

            let layout = await redis.get("filterLayout")

            if (layout) {
                this._filterLayout = JSON.parse(layout)
            } else {
                logger.info("No cache for filter layout found. Fetching new layout");
                let {
                    data,
                    status
                } = await getFilterLayout()

                if (status == 200) {
                    let layout = data!
                    await redis.set("filterLayout", JSON.stringify(layout), {
                        expiration: {
                            type: "EX",
                            //     SEC  MIN  HOUR DAY
                            value: 60 * 60 * 24 * 7 // 7 days
                        }
                    })
                    this._filterLayout = layout
                    logger.info(`Update successfully. Layout cache expires at ${new Date((Date.now() + (60 * 60 * 24 * 7 * 1000))).toDateString()}`)
                } else {
                    logger.error(`Invalid response status from filter layout request: ${status}`)
                    throw new Error(`Invalid status: ${status}`)
                }
            }
        }
        return this._filterLayout;
    }
}

export class Portrait {
    private properties: Map<string, number[]> = new Map()

    constructor () {}

    static fromString(value: string): Portrait {
        let portrait = new Portrait();
        value.split("&").forEach((val) => {
            const [key, value] = val.split("=") as [string, string]
            if (key!.startsWith("qt")) {
                let old_value = portrait.properties.get(key)
                portrait.properties.set(key, [...(old_value ?? []), Number.parseInt(value!.slice(1))]);
            } else if (key!.startsWith("n")) {
                let old_value = portrait.properties.get(key)
                portrait.properties.set(key, [...(old_value ?? []), Number.parseInt(value!)]);
            } else {
                throw new Error(`Unknown key for portrait: ${key}`)
            }
        })

        return portrait
    }

    public addProperty(property: FilterProperty, value: QualityProperty | number) {
        if (property.type == "q") {
            const key = `qt${property.property.id}`
            let old_value = this.properties.get(key)
            this.properties.set(key, [...(old_value ?? []), (value as QualityProperty).id])
        } else if (property.type == "n") {
            const key = `n${property.property.id}`
            let old_value = this.properties.get(key)
            this.properties.set(key, [...(old_value ?? []), value as number])
        } else {
            throw new Error(`Unknown property type for portrait: ${property.type}`)
        }
    }

    public removePropertyValue(property: FilterProperty, value: QualityProperty | number) {
        if (property.type == "q") {
            const key = `qt${property.property.id}`
            let old_value = this.properties.get(key)
            if (!old_value) {
                return
            }
            let new_value = old_value?.filter((x) => {
                return x != (value as QualityProperty).id
            })
            this.properties.set(key, new_value)

        } else if (property.type == "n") {
            const key = `n${property.property.id}`
            let old_value = this.properties.get(key)
            if (!old_value) {
                return
            }
            let new_value = old_value?.filter((x) => {
                return x != (value as number)
            })
            this.properties.set(key, new_value)
        } else {
            throw new Error(`Unknown property type for portrait: ${property.type}`)
        }
    }

    public removeAllQualityProperties(property: QualityPropertyType) {
        const key = `qt${property.id}`
        this.properties.delete(key)
    }

    public removeAllNumericalPropertyValues(property: NumericalProperty) {
        const key = `n${property.id}`
        this.properties.delete(key)
    }

    public includes(property: FilterProperty) {
        return !!this.properties.keys().find((val) => val == `${property.type == "q" ? "qt" : "n"}${property.property.id}`)
    }

    toString(): string {
        // Have fun trying to understand this :)
        return this.properties.entries().reduce((prev, curr) => {
            const key = curr[0];
            return prev + curr[1].reduce((prev, curr) => {
                if (key.startsWith("qt")) {
                    return prev + `${key}=q${curr}&`
                } else if (key.startsWith("n")) {
                    return prev + `${key}=${curr}&`
                } else {
                    throw new Error(`Unknown property type in key: ${key}`)
                }
            }, "")
        }, "").slice(0, -1)
    }

    public get lenght() : number {
        return this.properties.keys().reduce((prev) => {return prev+1}, 0)
    }

    public getValue(property: FilterProperty) {
        return this.properties.get(`${property.type == "q" ? "qt" : "n"}${property.property.id}`)
    }

    public clear() {
        this.properties.clear()
    }
}

interface UserData {
    portrait: Portrait
}

class BetterContext<T = any> extends Context {
    currentState: State<any> | null | undefined;
    globalCache: GlobalCache
    userData: UserData

    metadata: T;

    constructor (update: Update, api: Api, botInfo?: BotInfo | undefined) {
        super(update, api, botInfo)
        this.metadata = {} as T
        this.globalCache = new GlobalCache()
        this.userData = {
            portrait: new Portrait()
        }
    }

    public clearMetadata() {
        this.metadata = {} as T
    }
}

export default BetterContext