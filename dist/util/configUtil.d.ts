export interface IEnvironmentSettings {
    dockerRepo: string;
    ebApplicationName: string;
    ebEnvironmentName: string;
}
export interface IConfig {
    github: {
        apiKey: string;
        repoPath: string;
    };
    aws: {
        s3: {
            bucketName: string;
            sourceBundleDirectoryKey: string;
        };
    };
    envName2Settings: Record<string, IEnvironmentSettings>;
    writeVersionFile: {
        destinationPath: string;
    };
    updatePrivateDependencyVersions: {
        packageNames: string[];
    };
    setEnv: {
        fileSuffix2Destination: Record<string, string>;
    };
    buildAndPushDocker: {
        dockerLocalImageName: string;
    };
}
export declare function getConfig(): IConfig;
