import { isAxiosError } from "axios"

export class ConnectorError extends Error {
    apiError: NodeClientError;
    jsError: Error;

    constructor(apiError: NodeClientError, jsError: Error) {
        super(`Connector Error: ${apiError} | ${jsError.message}`);
        this.apiError = apiError;
        this.jsError = jsError;
        this.name = "ConnectorError";

        // Maintain stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConnectorError);
        }
    }
}


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
    LocalInternalError = "LocalInternalError"
}

export type Result<T> = [T, undefined] | [undefined, ConnectorError]

export function handleError(e: any): Result<any> {
    if (isAxiosError(e) && e.response?.data) {
        let ncr = e.response.data.code as NodeClientError || NodeClientError.LocalInternalError
        return [undefined, new ConnectorError(ncr, e)]
    } else {
        return [undefined, new ConnectorError(NodeClientError.LocalInternalError, e)]
    }
}