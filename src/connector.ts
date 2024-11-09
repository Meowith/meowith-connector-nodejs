import { MeowithApiAccessor, Range, Resource } from "./api-access";
import { Bucket, Entity, FileEntity, UploadSessionInfo, UploadSessionResumeResponse } from "./entity";
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
        return { appId: this.config.appId, bucketId: this.config.bucketId, path }
    }

    async downloadFile(path: string, range?: Range): Promise<Result<FileEntity>> {
        return this.accessor.downloadFile(this.getResource(path), range)
    }

    async uploadFile(path: string, data: any, size: number): Promise<Result<undefined>> {
        return this.accessor.uploadFile(this.getResource(path), data, size)
    }

    async startUploadSession(path: string, size: number): Promise<Result<UploadSessionInfo>> {
        return this.accessor.startUploadSession(this.getResource(path), size)
    }

    async putFile(session: UploadSessionInfo, data: any): Promise<Result<undefined>> {
        return this.accessor.putFile(this.getResource(''), session, data)
    }

    async resumeUploadSession(session: UploadSessionInfo): Promise<Result<UploadSessionResumeResponse>> {
        return this.accessor.resumeUploadSession(this.getResource(''), session)
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

    async listBucketFiles(pagination?: Range): Promise<Result<Entity[]>> {
        return this.accessor.listBucketFiles(this.getResource(''), pagination)
    }

    async listBucketDirectories(pagination?: Range): Promise<Result<Entity[]>> {
        return this.accessor.listBucketDirectories(this.getResource(''), pagination)
    }

    async listDirectory(path: string, pagination?: Range): Promise<Result<Entity[]>> {
        return this.accessor.listDirectory(this.getResource(path), pagination)
    }

    async statResource(path: string): Promise<Result<Entity>> {
        return this.accessor.statResource(this.getResource(path))
    }

    async fetchBucketInfo(): Promise<Result<Bucket>> {
        return this.accessor.fetchBucketInfo(this.getResource(''))
    }
}
