import axios, { AxiosInstance } from "axios"
import { FileEntity, RawEntityList, RenameEntityRequest, Entity } from './entity';
import { handleError, Result } from "./error";

export type Resource = { app_id: string, bucket_id: string, path: string }

/**
 * The meowith api accessor. Allows access to the meowith storage node.
 */
export class MeowithApiAccessor {

    axiosInstance: AxiosInstance = axios.create();

    constructor(api_token: string, base_url: string) {
        this.axiosInstance.defaults.baseURL = base_url
        this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${api_token}`
    }

    /**
     * Download the specified resource.
     * 
     * @param resource resource location
     * @returns A fileentity whose content is an axios stream
     */
    async downloadFile(resource: Resource): Promise<Result<FileEntity>> {
        try {
            let response = await this.axiosInstance.get(`/api/file/download/${resource.app_id}/${resource.bucket_id}/${resource.path}`, { responseType: "stream" })
            return [
                {
                    size: parseInt(response.headers["Content-Length"] as string),
                    name: response.headers["Content-Disposition"].match(/filename="(.+)"/)[1], // parse the attachement filename here plz,
                    mime: response.headers["Content-Type"] as string,
                    content: response.data
                }, undefined
            ]
        } catch (e) {
            return handleError(e)
        }
    }

    /**
     * Oneshot upload. If an error occures durint this procedure, the part-file will be auto-deleted.
     * 
     * If the provided size of the resource doesn't match the actual size of the payload, the upload will fail.
     * @param resource resource location
     * @param size size of the uploaded resource
     */
    async uploadFile(resource: Resource, data: any, size: number): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.post(`/api/file/upload/oneshot/${resource.app_id}/${resource.bucket_id}/${resource.path}`, data, {
                headers: {
                    "Content-Length": size
                }
            })
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async renameFile(resource: Resource, to: string): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.post(`/api/file/rename/${resource.app_id}/${resource.bucket_id}/${resource.path}`, { to } as RenameEntityRequest)
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async renameDirectory(resource: Resource, to: string): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.post(`/api/directory/rename/${resource.app_id}/${resource.bucket_id}/${resource.path}`, { to } as RenameEntityRequest)
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async deleteFile(resource: Resource): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.delete(`/api/file/delete/${resource.app_id}/${resource.bucket_id}/${resource.path}`)
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async deleteDirectory(resource: Resource): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.delete(`/api/directory/delete/${resource.app_id}/${resource.bucket_id}/${resource.path}`)
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async createDirectory(resource: Resource): Promise<Result<undefined>> {
        try {
            await this.axiosInstance.post(`/api/directory/create/${resource.app_id}/${resource.bucket_id}/${resource.path}`)
            return [undefined, undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async listBucketFiles(app_id: string, bucket_id: string): Promise<Result<Entity[]>> {
        try {
            let response = await this.axiosInstance.get(`/api/bucket/list/files/${app_id}/${bucket_id}`)
            let entities = response.data as RawEntityList;
            return [entities.entities.map(x => {
                return { ...x, last_modified: new Date(x.last_modified), created: new Date(x.created) } as Entity
            }), undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async listBucketDirectories(app_id: string, bucket_id: string): Promise<Result<Entity[]>> {
        try {
            let response = await this.axiosInstance.get(`/api/bucket/list/directories/${app_id}/${bucket_id}`)
            let entities = response.data as RawEntityList;
            return [entities.entities.map(x => {
                return { ...x, last_modified: new Date(x.last_modified), created: new Date(x.created) } as Entity
            }), undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    async listDirectory(resource: Resource): Promise<Result<Entity[]>> {
        try {
            let response = await this.axiosInstance.get(`/api/directory/list/${resource.app_id}/${resource.bucket_id}/${resource.path}`)
            let entities = response.data as RawEntityList;
            return [entities.entities.map(x => {
                return { ...x, last_modified: new Date(x.last_modified), created: new Date(x.created) } as Entity
            }), undefined]
        } catch (e) {
            return handleError(e)
        }
    }

    // TODO durable upload, list paging
}