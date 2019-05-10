import aws from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { Promise } from 'es6-promise';



function __uploadToS3(s3: aws.S3, args: IDeployToAwsArgs) {
  console.log("Uploading source bundle to S3...");
  return s3.upload({
    Bucket: args.s3BucketName,
    Key: `${args.s3Directory}${args.fileName}`,
    Body: fs.createReadStream(args.fileName)
  }).promise();
}



function __createApplicationVersion(elasticBeanstalk: aws.ElasticBeanstalk, args: IDeployToAwsArgs) {
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



function __updateEnvironment(elasticBeanstalk: aws.ElasticBeanstalk, args: IDeployToAwsArgs) {
  console.log("Updating environment...");
  return elasticBeanstalk.updateEnvironment({
    ApplicationName: args.applicationName,
    EnvironmentName: args.environmentName,
    VersionLabel: args.fileName
  }).promise();
}



export interface IDeployToAwsArgs {
  s3BucketName: string;
  s3Directory: string;
  fileName: string;
  applicationName: string;
  environmentName: string;
}

export function deployToAws(args: IDeployToAwsArgs) {
  aws.config.loadFromPath(path.join(process.cwd(), 'config', 'aws.json'));
  const s3 = new aws.S3({apiVersion: '2006-03-01'});
  const elasticBeanstalk = new aws.ElasticBeanstalk({apiVersion: '2010-12-01'});
  console.log("Deploying to AWS...");

  return Promise.resolve()
    .then(() => __uploadToS3(s3, args))
    .then(() => __createApplicationVersion(elasticBeanstalk, args))
    .then(() => __updateEnvironment(elasticBeanstalk, args))

    .then(() => console.log("AWS deployment complete."))
    .catch((err: any) => console.error(err));
}
