import { Promise } from 'es6-promise';
export interface IDeployToAwsArgs {
    s3BucketName: string;
    s3Directory: string;
    fileName: string;
    applicationName: string;
    environmentName: string;
}
export declare function deployToAws(args: IDeployToAwsArgs): Promise<void>;
