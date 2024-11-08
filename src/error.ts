import { isAxiosError } from "axios"

export enum NodeClientError {
    InternalError = "InternalError",
    BadRequest = "BadRequest",
    NotFound = "NotFound",
    EntityExists = "EntityExists",
    NoSuchSession = "NoSuchSession",
    BadAuth = "BadAuth",
    InsufficientStorage = "InsufficientStorage",
    NotEmpty = "NotEmpty",
    RangeUnsatisfiable = "RangeUnsatisfiable",
}

export type Result<T> = [T, undefined] | [undefined, NodeClientError]

export function handleError(e: any): Result<any> {
    if (isAxiosError(e) && e.response?.data) {
        return [undefined, (e.response.data.code as NodeClientError | undefined) || NodeClientError.InternalError]
    } else {
        return [undefined, NodeClientError.InternalError]
    }
}