import { Readable } from "stream"

export type FileEntity = {
    name: string,
    mime: string,
    size: number,
    content: Readable
}

/**
 * As received from the api, the dates are essentially ISO encoded strings
 * dir and dir_id are uuid's but for the sake of convieniance they'll remain as string's
 */
export type RawEntity = {
    name: String,
    dir: string | undefined,
    dir_id: string | undefined,
    size: number,
    is_dir: boolean,
    created: string,
    last_modified: string,
}

/**
 * Note: the dir is the uuid of the files directory, which is to be referenced manually.
 */
export type Entity = {
    name: String,
    /**
     * Resource parent directory id, undefined if the resource sits in the root dir.
     */
    dir: string | undefined,
    /**
     * If is_dir, the id of the directory
     */
    dir_id: string | undefined,
    size: number,
    is_dir: boolean,
    created: Date,
    last_modified: Date,
}

export type RenameEntityRequest = {
    to: string
}

export type RawEntityList = {
    entities: RawEntity[]
}

export type RawBucket = {
    app_id: string,
    id: string,
    name: string,
    encrypted: boolean,
    atomic_upload: boolean,
    quota: number,
    file_count: number,
    space_taken: number,
    created: string,
    last_modified: string,
}

export type Bucket = Omit<Omit<RawBucket, 'created'>, 'last_modified'> & {
    created: Date,
    last_modified: Date
}

export type UploadSessionInfo = {
    /**
     * Upload code
     */
    code: String,
    /**
     * Session validity in seconds
     */
    validity: number,
    /**
     * Amount of the file already uploaded to meowith.
     */
    uploaded: number,
}

export type UploadSessionResumeResponse = Omit<Omit<UploadSessionInfo, 'validity'>, 'code'>