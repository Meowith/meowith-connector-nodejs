import { MeowithApiAccessor, Resource } from "./api-access";
import { Entity, FileEntity } from "./entity";
import { Result } from "./error";

export type MeowithConnectorConfiguration = {
    /**
     * The access token used with every call.
     */
    apiToken: string,
    /**
     * The id of the application that this connector will make requests to.
     */
    appId: string,
    /**
     * The id of the bucket that this connector will make requests to.
     */
    bucketId: string,
    /**
     * The address of the storage node used for all operations
     */
    nodeAddress: string
    /**
     * Use ssl for all requests
     */
    useSsl: boolean
}

/**
 * Wrapper for the {@link MeowithApiAccessor}. Automatically passes the app_id, and bucket_id to every call.
 */
export class MeowithConnector {

    accessor: MeowithApiAccessor
    config: MeowithConnectorConfiguration

    constructor(config: MeowithConnectorConfiguration) {
        this.config = config
        this.accessor = new MeowithApiAccessor(config.apiToken,
            `http${config.useSsl ? 's' : ''}://${config.nodeAddress}`
        );
    }

    private getResource(path: string): Resource {
        return { app_id: this.config.appId, bucket_id: this.config.bucketId, path }
    }

    /**
     * Download the specified resource.
     * 
     * @param resource resource location
     * @returns A fileentity whose content is an axios stream
     */
    async downloadFile(path: string): Promise<Result<FileEntity>> {
        return this.accessor.downloadFile(this.getResource(path))
    }

    /**
     * Oneshot upload. If an error occures durint this procedure, the part-file will be auto-deleted.
     * 
     * If the provided size of the resource doesn't match the actual size of the payload, the upload will fail.
     * @param resource resource location
     * @param size size of the uploaded resource
     */
    async uploadFile(path: string, data: any, size: number): Promise<Result<undefined>> {
        return this.accessor.uploadFile(this.getResource(path), data, size)
    }

    async renameFile(path: string, to: string): Promise<Result<undefined>> {
        return this.accessor.renameFile(this.getResource(path), to)
    }

    async renameDirectory(path: string, to: string): Promise<Result<undefined>> {
        return this.accessor.renameDirectory(this.getResource(path), to)
    }

    async deleteFile(path: string): Promise<Result<undefined>> {
        return this.accessor.deleteFile(this.getResource(path))
    }

    async deleteDirectory(path: string): Promise<Result<undefined>> {
        return this.accessor.deleteDirectory(this.getResource(path))
    }

    async createDirectory(path: string): Promise<Result<undefined>> {
        return this.accessor.createDirectory(this.getResource(path))
    }

    async listBucketFiles(): Promise<Result<Entity[]>> {
        return this.accessor.listBucketFiles(this.config.appId, this.config.bucketId)
    }

    async listBucketDirectories(): Promise<Result<Entity[]>> {
        return this.accessor.listBucketDirectories(this.config.appId, this.config.bucketId)
    }

    async listDirectory(path: string): Promise<Result<Entity[]>> {
        return this.accessor.listDirectory(this.getResource(path))
    }
}