/**
 * TODO Rewrite to get data from redis and then from navigator
 */
import Axios from "axios";
import {
    Support,
    SupportSection,
    NumericalProperty,
    User,
    QualityPropertyType,
    Settings,
    Document,
    Municipality,
    ApiResponse,
    Scope,
    Organization
} from "@/typings/api";

import { FilterSection, FilterProperty } from "@/typings/filter";

const API_URL = process.env["SN_API_URL"] || "http://localhost:8000";

interface AxiosConfig {
    dontRetry?: boolean,
    ignoreError?: boolean,
}

declare module 'axios' {
    interface AxiosRequestConfig extends AxiosConfig { }
}

const axios = Axios.create({
    baseURL: API_URL,
})

axios.defaults.validateStatus = function (status) {
    // return [200, 201, 400].includes(status);
    return (
        (status >= 200 && status < 300) || status === 400
    )
}

function object2support(support: any): Support {
    return {
        id: support.id && Number.parseInt(support.id),
        created: support.created && new Date(support.created),
        created_by: support.created_by,
        last_edit: support.last_edit && new Date(support.last_edit),
        full_name: support.full_name,
        last_edited_by: support.last_edited_by,
        department: support.department,
        portrait: support.portrait,
        used_numerical_properties: support.used_numerical_properties,
        used_quality_properties: support.used_quality_properties,
        short_name: support.short_name,
        organizations: support.organizations,
        description: support.description,
        provider: support.provider,
        terms_and_conditions: support.terms_and_conditions,
        regulation: support.regulation,
        result: support.result,
        provide_text: support.provide_text,
        provide_url: support.provide_url,
        provide_type: support.provide_type,
        documents: support.documents,
        municipalities: support.municipalities,
        hidden: support.hidden,
        scopes: support.scope
    }
}

type SUPPORT_FIELDS =
    "id" |
    "created" |
    "created_by" |
    "last_edit" |
    "full_name" |
    "last_edited_by" |
    "department" |
    "portrait" |
    "used_numerical_properties" |
    "used_quality_properties" |
    "short_name" |
    "organizations" |
    "description" |
    "provider" |
    "terms_and_conditions" |
    "regulation" |
    "result" |
    "provide_type" |
    "documents" |
    "municipalities" |
    "hidden" |
    "provide_text" |
    "provide_url" |
    "scopes"

export async function getSupports({
    limit = 5,
    offset = 0,
    fields = [
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
    ],
    portrait = "",
    section,
    ids = [],
    query = "",
}: {
    limit?: number;
    offset?: number;
    fields?: Array<SUPPORT_FIELDS>;
    portrait?: string;
    section?: number;
    ids?: Iterable<string | number>;
    query?: string;
}
): Promise<ApiResponse<{ supports: Support[], count: number }>> {
    let response

    try {
        response = await axios.get(
            `/supports/`,
            {
                params: {
                    limit: limit,
                    offset: offset,
                    fields: fields.length > 0 ? fields.join(",") : null,
                    portrait: portrait === "" ? null : portrait,
                    ids: ids && Array.from(ids).length > 0 ? (Array.from(ids)).join(",") : null,
                    section: section,
                    query: query
                }
            })
    } catch (error) {
        if (Axios.isAxiosError(error)) {
            return { data: null, status: error.status! }
        }
        throw error
    }

    let data: any = response.data.supports

    let supports: Support[] = []

    data.forEach((element: any) => {
        supports.push(object2support(element))
    })

    return { data: { supports, count: response.data.count }, status: response.status }
}


export async function getSupport(id: number): Promise<ApiResponse<Support>> {
    let response = await axios.get(
        `/supports/${id}/`)

    let data: any = response.data

    return {
        data: object2support(data),
        status: response.status
    }
}

export async function getSupportsSections(): Promise<ApiResponse<SupportSection[]>> {
    let response = await axios.get(
        `/supports_sections/`)
    let data: any = response.data

    let sections: SupportSection[] = []

    data.forEach((element: any) => {
        sections.push({
            id: element.id,
            name: element.name,
            hidden: element.hidden
        })
    })

    return { data: sections, status: response.status }
}


export async function getFilterLayout(): Promise<ApiResponse<FilterSection[]>> {
    let response = await axios.get(
        `/filter_layout/`)
    // @ts-ignore
    let data: any[] = response.data;

    let layout: FilterSection[] = [];

    data.forEach((element: any) => {
        let properties: FilterProperty[] = [];

        element.properties.forEach((property: any) => {
            properties.push({
                type: property.type,
                property: property
            })
        });

        layout.push({
            id: element.id,
            name: element.name,
            properties: properties
        })

    })
    return { data: layout, status: response.status }
}

export async function getQualityPropertyTypes(): Promise<ApiResponse<QualityPropertyType[]>> {
    let response = await axios.get(`/quality_property_types/`)

    // @ts-ignore
    let data: any[] = response.data

    return { data: data as QualityPropertyType[], status: response.status } as { data: QualityPropertyType[], status: number }
}


export async function getNumericalProperties(): Promise<ApiResponse<NumericalProperty[]>> {
    let response = await axios.get(`/numerical_properties/`)

    // @ts-ignore
    let data: any[] = response.data

    return { data: data as NumericalProperty[], status: response.status }
}


export async function getTotalSupports(): Promise<ApiResponse<number>> {
    let response = await axios.get(
        `/total_supports/`)

    const data: any = response.data

    return { data: Number.parseInt(data.total as string), status: response.status }
}


export async function getSettings(): Promise<ApiResponse<Settings>> {
    let response = await axios.get(`/settings/`)

    return {
        data: {
            notificationLevel: response.data.notification_level,
            notificationText: response.data.notification_text,
            notificationAuthorizedOnly: response.data.notification_only_for_authorized,
            quarantineModes: response.data.quarantine_modes
        }, status: response.status
    };
}


export async function getDocuments(): Promise<ApiResponse<Document[]>> {
    let response = await axios.get(`/documents/`)

    return { data: response.data, status: response.status }
}

export async function getMunicipalities(): Promise<ApiResponse<Municipality[]>> {
    let response = await axios.get(`/municipalities/`)

    return { data: response.data, status: response.status }
}


export async function getScopes(): Promise<ApiResponse<Scope[]>> {
    let response = await axios.get(`/scopes/`)

    return { data: response.data, status: response.status }
}


export async function getOrganizations(): Promise<ApiResponse<Organization[]>> {
    let response = await axios.get(`/organizations/`)

    return { data: response.data, status: response.status }
}
