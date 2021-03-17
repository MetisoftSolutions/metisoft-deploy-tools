"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployToAws = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const es6_promise_1 = require("es6-promise");
function __uploadToS3(s3, args) {
    console.log("Uploading source bundle to S3...");
    return s3.upload({
        Bucket: args.s3BucketName,
        Key: `${args.s3Directory}${args.fileName}`,
        Body: fs_1.default.createReadStream(args.fileName)
    }).promise();
}
function __createApplicationVersion(elasticBeanstalk, args) {
    console.log("Creating application version...");
    return elasticBeanstalk.createApplicationVersion({
        ApplicationName: args.applicationName,
        VersionLabel: args.fileName,
        SourceBundle: {
            S3Bucket: args.s3BucketName,
            S3Key: `${args.s3Directory}${args.fileName}`
        }
    }).promise();
}
function __updateEnvironment(elasticBeanstalk, args) {
    console.log("Updating environment...");
    return elasticBeanstalk.updateEnvironment({
        ApplicationName: args.applicationName,
        EnvironmentName: args.environmentName,
        VersionLabel: args.fileName
    }).promise();
}
function deployToAws(args) {
    aws_sdk_1.default.config.loadFromPath(path_1.default.join(process.cwd(), 'config', 'aws.json'));
    const s3 = new aws_sdk_1.default.S3({ apiVersion: '2006-03-01' });
    const elasticBeanstalk = new aws_sdk_1.default.ElasticBeanstalk({ apiVersion: '2010-12-01' });
    console.log("Deploying to AWS...");
    return es6_promise_1.Promise.resolve()
        .then(() => __uploadToS3(s3, args))
        .then(() => __createApplicationVersion(elasticBeanstalk, args))
        .then(() => __updateEnvironment(elasticBeanstalk, args))
        .then(() => console.log("AWS deployment complete."))
        .catch((err) => console.error(err));
}
exports.deployToAws = deployToAws;
