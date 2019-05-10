import * as configUtil from './util/configUtil';
import { Promise } from 'es6-promise';
import { writeVersionFile } from './core/writeVersionFile';
import { updatePrivateDependencyVersions } from './core/updatePrivateDependencyVersions';
import { updateReleaseVersion } from './core/updateReleaseVersion';
import { buildAndPushDocker } from './core/buildAndPushDocker';
import { deployToAws } from './core/deployToAws';



function main() {
  const config = configUtil.getConfig();
  let envName = '';

  if (process.argv.length < 3) {
    console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/deployToAws.js <envName>");
    return Promise.resolve();
  }

  envName = process.argv[2];
  const envSettings = config.envName2Settings[envName];
  if (!envSettings) {
    throw new Error(`No settings for environment ${envName}.`);
  }

  return Promise.resolve()
    .then(() => updatePrivateDependencyVersions(config.github.apiKey, config.updatePrivateDependencyVersions.packageNames))
    .then(() => updateReleaseVersion(config.github.repoPath, config.github.apiKey))

    .then(() => {
      if (config.writeVersionFile.destinationPath) {
        writeVersionFile(config.writeVersionFile.destinationPath);
      }
    })

    .then(() => buildAndPushDocker(config, envName))

    .then(zipFileName => deployToAws({
      s3BucketName: config.aws.s3.bucketName,
      s3Directory: config.aws.s3.sourceBundleDirectoryKey,
      applicationName: envSettings.ebApplicationName,
      environmentName: envSettings.ebEnvironmentName,
      fileName: zipFileName
    }));
}
main();
