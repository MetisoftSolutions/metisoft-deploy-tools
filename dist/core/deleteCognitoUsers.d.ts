export interface ICredentials {
    accessKeyId: string;
    secretAccessKey: string;
}
export interface IDeleteUsersArgs {
    region: string;
    credentials: ICredentials;
    userPoolId: string;
}
export declare function deleteUsers(args: IDeleteUsersArgs): Promise<void>;
