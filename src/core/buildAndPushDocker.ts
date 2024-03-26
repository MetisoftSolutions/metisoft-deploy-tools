import _ from 'lodash';

import { Promise } from 'es6-promise';
import * as fs from 'fs';
import * as archiver from 'archiver';
import * as processUtil from '../util/processUtil';
import * as configUtil from '../util/configUtil';
import * as fileUtil from '../util/fileUtil';
import path from 'path';
import * as setEnv from './setEnv';
import moment from 'moment';



function __genDockerRepoAndTag(dockerRepo: string, dockerLocalImageName: string, envName: string) {
  const timestamp = moment().format('YYYYMMDDtHHmmss');
  const sPackage = fileUtil.readFile(path.join(process.cwd(), 'package.json'));
  const packageObj = JSON.parse(sPackage);
  if (!packageObj || !packageObj.version) {
    throw new Error("Cannot open package.json.");
  }
  const version = packageObj.version;
  const dockerRepoAndTag = `${dockerRepo}:${timestamp}_${dockerLocalImageName}_v${version}_${envName}`;
  return dockerRepoAndTag;
}



function __buildDocker(dockerLocalImageName: string) {
  return processUtil.runCommand(`docker build -t ${dockerLocalImageName} --no-cache --platform linux/x86_64 .`);
}



function __pushDocker(dockerLocalImageName: string, dockerRepoAndTag: string) {
  return Promise.resolve()
    .then(() => processUtil.runCommand(`docker tag ${dockerLocalImageName} ${dockerRepoAndTag}`))
    .then(() => processUtil.runCommand(`docker push ${dockerRepoAndTag}`));
}



function __getTag(dockerRepoAndTag: string) {
  const tokens = dockerRepoAndTag.split(':');
  return tokens[1] || '';
}



function __makeElasticBeanstalkBundle(dockerRepoAndTag: string) {
  const zipFileName = `${__getTag(dockerRepoAndTag)}.zip`;

  return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipFileName);
      const archive = archiver.create('zip');
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory('.ebextensions/', '.ebextensions');
      archive.directory('.platform/', '.platform');
      archive.file('Dockerrun.aws.json', {name: 'Dockerrun.aws.json'});
      archive.finalize();
    })

    .then(() => zipFileName);
}



export function buildAndPushDocker(config: configUtil.IConfig, envName: string) {
  const dockerRepo = config.envName2Settings[envName].dockerRepo;
  const dockerLocalImageName = config.buildAndPushDocker.dockerLocalImageName;
  const dockerRepoAndTag = __genDockerRepoAndTag(dockerRepo, dockerLocalImageName, envName);

  return Promise.resolve()
    .then(() => setEnv.setEnv(config, envName, dockerRepoAndTag))
    .then(() => __buildDocker(dockerLocalImageName))
    .then(() => __pushDocker(dockerLocalImageName, dockerRepoAndTag))
    .then(() => __makeElasticBeanstalkBundle(dockerRepoAndTag));
}
