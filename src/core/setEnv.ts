import * as _ from 'lodash';

import path from 'path';
import { Promise } from 'es6-promise';
import * as fileUtil from '../util/fileUtil';
import * as configUtil from '../util/configUtil';



function __genPath(pathString: string) {
  return path.join(..._.compact(pathString.split('/')));
}



function __setEnvironment(config: configUtil.IConfig, envName: string, dockerRepoAndTag?: string) {
  return Promise.all(_.map(config.setEnv.fileSuffix2Destination, (destination, fileSuffix) => {
    const sourceDir = path.join(process.cwd(), 'config', 'env');
    const destPath = __genPath(destination);
      const destFileName = fileSuffix === '.json' ?
        'env.json' :
        fileSuffix.slice(1);

      return fileUtil.copyFile(
        path.join(sourceDir, `${envName}${fileSuffix}`),
        path.join(destPath, destFileName)
      );
    }))

    .then(() => {
      const dockerrunAwsJsonKey = '-Dockerrun.aws.json';
      if (dockerRepoAndTag && !_.isUndefined(config.setEnv.fileSuffix2Destination[dockerrunAwsJsonKey])) {
        const dockerrunFileDest = path.join(__genPath(config.setEnv.fileSuffix2Destination[dockerrunAwsJsonKey]), dockerrunAwsJsonKey.slice(1))
        const dockerrunFileContents = fileUtil.readFile(dockerrunFileDest);
        const dockerrunFileObject: any = JSON.parse(dockerrunFileContents);
        dockerrunFileObject["Image"]["Name"] = dockerRepoAndTag;
        fileUtil.writeFile(dockerrunFileDest, JSON.stringify(dockerrunFileObject, null, 2));
      }
    });
}



function __printSuccess(envName: string, dockerRepoAndTag?: string) {
  let message = `Environment set to ${envName}.${dockerRepoAndTag ? ` Docker image set to ${dockerRepoAndTag}.` : ''}`;
  console.log(message);
}



export function setEnv(config: configUtil.IConfig, envName: string, dockerRepoAndTag?: string) {
  return Promise.resolve()
    .then(() => __setEnvironment(config, envName, dockerRepoAndTag))
    .then(() => __printSuccess(envName, dockerRepoAndTag));
}
