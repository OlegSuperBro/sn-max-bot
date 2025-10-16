import { Section, QualityPropertyType, NumericalProperty } from "@/typings/api";


export interface ActiveProperties {
    q: Array<number | string>
    n: { id: number | string, value: string | number }[]
}

export interface FilterProperty {
    type: "q" | "n"
    property: QualityPropertyType | NumericalProperty
}

export interface FilterSection {
    id: number
    name: string
    properties: FilterProperty[]
}