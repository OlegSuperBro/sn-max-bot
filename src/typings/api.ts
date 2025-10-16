export type ApiResponse<T> = {
    data: T | null,
    status: number
}

export interface Document {
    id: number
    name: string
}

export interface Municipality {
    id: number
    name: string
}

export interface Organization {
    id: number
    name: string
    link: string
}

export interface Scope {
    id: number
    supports?: Support
    name: string
    hidden: boolean
}

export interface Employee {
    user: string
    departament: string
}

export interface Department {
    id: number
    name: string
}

export interface User {
    id: number
    username: string
    supports: Support[]
    department: Department
}

export interface PortraitQualityPropertyType {
    id: number
    qualityPropertyType?: QualityPropertyType
    qualityPropertyValues: QualityProperty[]
    logic: "and" | "or"
}

export interface PortraitNumericalProperty {
    id: number
    numericalProperty?: NumericalProperty
    value_from: number
    value_to: number
}

export interface Portrait {
    id: number
    name: string | null
    portraitQualityPropertyTypes: PortraitQualityPropertyType[]
    portraitNumericalProperties: PortraitNumericalProperty[]
}

export interface Support {
    id?: number
    created?: Date
    created_by?: User
    last_edit?: Date
    full_name?: string
    last_edited_by?: User
    department?: Department
    portrait?: string
    used_numerical_properties?: NumericalProperty[]
    used_quality_properties?: QualityProperty[]

    short_name?: string
    organizations?: Organization[]
    description?: string
    provider?: string

    terms_and_conditions?: string
    regulation?: string
    result?: string

    provide_text?: string
    provide_url?: string

    scopes?: Scope[]

    provide_type?: string[]
    documents?: Document[]
    municipalities?: Municipality[]
    hidden?: boolean


    // id?: number
    // created?: number  // this is timestamp
    // short_name?: string
    // full_name?: string
    // owner?: Employee
    // portraits?: Portrait[]
    // portraits_logic?: "and" | "or"
    // organizations?: string[]  // ! it's just string in db, but if you reading this and something is broken with it, then you fucked
    // description?: string
    // provider?: string
    // terms_and_conditions?: string
    // regulation?: string
    // result?: string
    // provide_type?: string[]
    // documents?: string[]
    // municipalities?: string[] | null
    // hidden?: boolean
}

export interface SupportSection {
    id: number
    name: string
    hidden: boolean
}

export interface NumericalProperty {
    id: number
    code: string
    filterFieldCode: string
    isShownFor: number
    name: string
    sort: number
    nameList: string
    placeholder: string
    widthInSymbols: number
    hidden: boolean
    type: "n"
}

export interface QualityProperty {
    id: number
    isRejected: boolean
    name: string
    nameList: string
    sort: number
    sortList: number
    hidden: boolean
    type: "q"
}

export interface QualityPropertyType {
    id: number
    code: string
    filterFieldCode: string
    isShownFor: number
    name: string
    sort: number
    qualityProperties: QualityProperty[]
    hidden: boolean
}

export interface Section {
    id: number;
    name: string;
}


export type NotificationLevel = "DISABLED" | "INFO" | "WARNING" | "CRITICAL";
export type QuarantineMode =
    "NO_VIEW" |
    "NO_LOGIN" |
    "NO_SUPPORT_CREATION" |
    "NO_SUPPORT_EDITING" |
    "NO_SUPPORT_DELETION" |
    "EDIT_ONLY_OWN_SUPPORTS" |
    "DISABLE_API";

export interface Settings {
    notificationLevel: NotificationLevel;
    notificationText: string;
    notificationAuthorizedOnly: boolean;
    quarantineModes: QuarantineMode[];
}
