import axios, { AxiosInstance } from "axios"
import { FileEntity, RawEntityList, RenameEntityRequest, Entity, RawEntity, Bucket, RawBucket, UploadSessionInfo, UploadSessionResumeResponse } from './entity';
import { handleError, Result } from "./error";

export type BucketId = { appId: string, bucketId: string }
export type Resource = BucketId & { path: string }
export type Range = { start: number, end: number } | { start: number } | { end: number };

/**
 * The meowith api accessor. Allows access to the meowith storage node.
 * This class acts as an api access layer
 */
export class MeowithApiAccessor {

    axiosInstance: AxiosInstance = axios.create();

    constructor(apiToken: string, baseUrl: string) {
        this.axiosInstance.defaults.baseURL = baseUrl
        this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${apiToken}`
    }

    private constructRangeHeader(range: Range): string {
        if ('start' in range && 'end' in range) {
            return `bytes=${range.start}-${range.end}`;
        } else if ('start' in range) {
            return `bytes=${range.start}-`;
        } else if ('end' in range) {
            return `bytes=-${range.end}`;
        }
        throw new Error("Invalid range object");
    }

    private constructPaginationQuery(range: Range | undefined): string {
        if (!range) {
            return ""
        } else if ('start' in range && 'end' in range) {
            return `?start=${range.start}&end=${range.end}`;
        } else if ('start' in range) {
            return `?start=${range.start}-`;
        } else if ('end' in range) {
            return `?end=${range.end}`;
        } else {
            return ""
        }
    }

    /**
     * Download the specified resource.
     *
     * @param resource resource location
     * @param range byte range to download
     * @returns A file entity which content is contained in an axios stream
     */
    async downloadFile(resource: Resource, range?: Range): Promise<Result<FileEntity>> {
        try {
            let headers = {};
            if (range) headers['Range'] = this.constructRangeHeader(range)
            let response = await this.axiosInstance.get(`/api/file/download/${resource.appId}/${resource.bucketId}/${resource.path}`, { responseType: "stream", headers })
            return [
                {
                    size: parseInt(response.headers["Content-Length"] as string),
                    name: response.headers["Content-Disposition"].match(/filename="(.+)"/)[1],
                    mime: response.headers["Content-Type"] as string,
                    content: response.data
                }, undefined
            ]
        } catch (e) {
            return handleError(e)
        }
    }

    /**
     * One shot upload. If an error occurs during this procedure, the part-file will be auto-deleted.
     *
     * If the provided size of the resource doesn't match the actual size of the payload, the upload will fail.
     * @param resource resource location
     * @param data additional request configuration
     * @param size size of the uploaded resource
     */
    async uploadFile(resource: Resource, data: any, size: number): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.post(`/api/file/upload/oneshot/${resource.appId}/${resource.bucketId}/${resource.path}`, data, {
                headers: {
                    "Content-Length": size
                }
            })
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    /**
     * Starts a durable upload session. This session may be interrupted and resumed later.
     * @param resource resource location
     * @param size size of the uploaded resource
     * @returns Session information
     */
    async startUploadSession(resource: Resource, size: number): Promise<Result<UploadSessionInfo>> {
        try {
            let result = await this.axiosInstance.post(`/api/file/upload/oneshot/${resource.appId}/${resource.bucketId}/${resource.path}`, { size })
            return [result.data as UploadSessionInfo, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    /**
     * Allows to put file content during a durable upload session
     * @param bucketId bucket identifier
     * @param session the active upload session
     * @param data additional request configuration
     */
    async putFile(bucketId: BucketId, session: UploadSessionInfo, data: any): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.put(`/api/file/upload/put/${bucketId.appId}/${bucketId.bucketId}/${session.code}`, data)
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    /**
     * Resumes an interrupted upload session.
     *
     * @param bucketId bucket identifier
     * @param session the active upload session
     * @returns Resume response containing the already uploaded file size
     */
    async resumeUploadSession(bucketId: BucketId, session: UploadSessionInfo): Promise<Result<UploadSessionResumeResponse>> {
        try {
            let result = await this.axiosInstance.post(`/api/file/upload/resume/${bucketId.appId}/${bucketId.bucketId}`, { session_id: session.code })
            return [result.data as UploadSessionResumeResponse, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async renameFile(resource: Resource, to: string): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.post(`/api/file/rename/${resource.appId}/${resource.bucketId}/${resource.path}`, { to } as RenameEntityRequest)
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async renameDirectory(resource: Resource, to: string): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.post(`/api/directory/rename/${resource.appId}/${resource.bucketId}/${resource.path}`, { to } as RenameEntityRequest)
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async deleteFile(resource: Resource): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.delete(`/api/file/delete/${resource.appId}/${resource.bucketId}/${resource.path}`)
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async deleteDirectory(resource: Resource, recursive: boolean): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.delete(`/api/directory/delete/${resource.appId}/${resource.bucketId}/${resource.path}`, {
                data: {recursive}
            })
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async createDirectory(resource: Resource): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.post(`/api/directory/create/${resource.appId}/${resource.bucketId}/${resource.path}`)
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async listBucketFiles(bucketId: BucketId, paginate?: Range): Promise<Result<Entity[]>> {
        try {
            let response = await this.axiosInstance.get(`/api/bucket/list/files/${bucketId.appId}/${bucketId.bucketId}${this.constructPaginationQuery(paginate)}`)
            let entities = response.data as RawEntityList;
            return [entities.entities.map(x => {
                return { ...x, last_modified: new Date(x.last_modified), created: new Date(x.created) } as Entity
            }), undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async listBucketDirectories(bucketId: BucketId, paginate?: Range): Promise<Result<Entity[]>> {
        try {
            let response = await this.axiosInstance.get(`/api/bucket/list/directories/${bucketId.appId}/${bucketId.bucketId}${this.constructPaginationQuery(paginate)}`)
            let entities = response.data as RawEntityList;
            return [entities.entities.map(x => {
                return { ...x, last_modified: new Date(x.last_modified), created: new Date(x.created) } as Entity
            }), undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async listDirectory(resource: Resource, paginate?: Range): Promise<Result<Entity[]>> {
        try {
            let response = await this.axiosInstance.get(`/api/directory/list/${resource.appId}/${resource.bucketId}/${resource.path}${this.constructPaginationQuery(paginate)}`)
            let entities = response.data as RawEntityList;
            return [entities.entities.map(x => {
                return { ...x, last_modified: new Date(x.last_modified), created: new Date(x.created) } as Entity
            }), undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    /**
     * Retrieves information about the specific resource provided.
     * @param resource the resource
     */
    async statResource(resource: Resource): Promise<Result<Entity>> {
        try {
            let response = await this.axiosInstance.get(`/api/bucket/stat/${resource.appId}/${resource.bucketId}/${resource.path}`)
            let entity = response.data as RawEntity;
            return [{ ...entity, last_modified: new Date(entity.last_modified), created: new Date(entity.created) } as Entity, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    /**
     * Retrieves information about the bucket including space taken and the quota.
     * @param bucketId bucket identifier
     * @returns A bucket entity
     */
    async fetchBucketInfo(bucketId: BucketId): Promise<Result<Bucket>> {
        try {
            let response = await this.axiosInstance.get(`/api/bucket/info/${bucketId.appId}/${bucketId.bucketId}`)
            let entity = response.data as RawBucket;
            return [{ ...entity, last_modified: new Date(entity.last_modified), created: new Date(entity.created) } as Bucket, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

}
