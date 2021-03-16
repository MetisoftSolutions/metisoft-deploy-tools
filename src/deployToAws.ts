import _ from 'lodash';

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import * as configUtil from './util/configUtil';
import { writeVersionFile } from './core/writeVersionFile';
import { updatePrivateDependencyVersions } from './core/updatePrivateDependencyVersions';
import { updateReleaseVersion } from './core/updateReleaseVersion';
import { buildAndPushDocker } from './core/buildAndPushDocker';
import { deployToAws } from './core/deployToAws';



async function main() {
  const config = configUtil.getConfig();
  let envName = '';

  if (process.argv.length < 3) {
    console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/deployToAws.js <envName>");
    return;
  }

  envName = process.argv[2];
  const envSettings = config.envName2Settings[envName];
  if (!envSettings) {
    throw new Error(`No settings for environment ${envName}.`);
  }

  if (!await __remindToUpdateConfigFiles(envName)) {
    return;
  }

  if (envName === 'prod') {
    if (await __checkIfProdFilesAreOutOfDateComparedToDevFiles()) {
      return;
    }
  }

  await updatePrivateDependencyVersions(config.github.apiKey, config.updatePrivateDependencyVersions.packageNames);
  await updateReleaseVersion(config.github.repoPath, config.github.apiKey);

  if (config.writeVersionFile.destinationPath) {
    writeVersionFile(config.writeVersionFile.destinationPath);
  }

  const zipFileName = await buildAndPushDocker(config, envName);

  await deployToAws({
    s3BucketName: config.aws.s3.bucketName,
    s3Directory: config.aws.s3.sourceBundleDirectoryKey,
    applicationName: envSettings.ebApplicationName,
    environmentName: envSettings.ebEnvironmentName,
    fileName: zipFileName
  });
}
main();



function __remindToUpdateConfigFiles(envName: string) {
  return new Promise(resolve => {
    const rl = readline.createInterface(process.stdin);
    rl.question(`\n\nHave you already updated the config files for ${envName}? (y/n)\n\n`, answer => {
      if (__isAffirmativeAnswer(answer)) {
        return true;

      } else {
        console.log("Please update the config files before proceeding.");
        return false;
      }
    });
  });
}



async function __checkIfProdFilesAreOutOfDateComparedToDevFiles() {
  // TODO replace with checks across all files for these two environments
  const devFileName = 'dev.json';
  const prodFileName = 'prod.json';

  const devStats = fs.statSync(devFileName);
  const prodStats = fs.statSync(prodFileName);

  if (prodStats.mtimeMs < devStats.mtimeMs) {
    return await __warnThatProdFilesAreOutOfDate();
  }

  return false;
}



function __warnThatProdFilesAreOutOfDate() {
  return new Promise(resolve => {
    const rl = readline.createInterface(process.stdin);
    rl.question(
      __genBanner("WARNING! The dev files were last modified later than the prod files. Are you sure the prod files are up to date? (y/n)"),
      answer => {
        if (__isAffirmativeAnswer(answer)) {
          return true;

        } else {
          console.log("Please update the config files before proceeding.");
          return false;
        }
      });
  });
}



function __genBanner(text: string) {
  const stars = _.repeat('*', 30);
  return `
${stars}\n
${text}\n
${stars}\n
  `;
}



function __isAffirmativeAnswer(answer: string) {
  return answer.trim().toLowerCase() === 'y';
}
