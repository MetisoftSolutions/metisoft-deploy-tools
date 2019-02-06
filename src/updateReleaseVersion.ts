import * as _ from 'lodash';
import * as fs from 'fs';
import { exec } from 'child_process';
import * as path from 'path';
import { Promise } from 'es6-promise';
import * as request from 'request';

let __originalVersion = '';
let __updateVersionStepCompleted = false;
let __gitCommitStepCompleted = false;
const __pathToPackageJson = path.join('.', 'package.json');



function __readFile(fileName: string) {
  return fs.readFileSync(fileName, 'utf8');
}



function __writeFile(fileName: string, contents: string) {
  fs.writeFileSync(fileName, contents, 'utf8');
}



function __runCommand(fullCommand: string) {
  return new Promise((resolve, reject) => {
    console.log(`\n*** Running command: ${fullCommand}`);
    const process = exec(fullCommand);
    process.stdout.on('data', __printOutputFromProcess);
    process.stderr.on('data', __printOutputFromProcess);
    process.on('exit', resolve);
  });
}



function __printOutputFromProcess(chunk: any) {
  process.stdout.write(chunk.toString());
}



function __getPackageJsonAsObject() {
  const sPackageJson = __readFile(__pathToPackageJson);
  const oPackageJson = JSON.parse(sPackageJson);

  if (!oPackageJson) {
    throw new Error("Cannot open package.json.");
  }

  return oPackageJson as any;
}



function __getVersionFromPackageJson() {
  const packageJson = __getPackageJsonAsObject();

  if (!packageJson.version || !_.isString(packageJson.version)) {
    throw new Error("Cannot read version from package.json.");
  }

  return packageJson.version as string;
}



function __setVersionInPackageJson(version: string) {
  const packageJson = __getPackageJsonAsObject();
  packageJson.version = version;
  __writeFile(__pathToPackageJson, JSON.stringify(packageJson, null, 2));
}



function __updateVersion() {
  console.log("Updating the version...");
  __originalVersion = __getVersionFromPackageJson();
  const newVersion = __calcNewVersionFromVersionString(__originalVersion);
  __setVersionInPackageJson(newVersion);
  __updateVersionStepCompleted = true;
  return newVersion;
}



function __rollBackUpdateVersion() {
  console.log("Rolling back version update...");
  if (__originalVersion) {
    __setVersionInPackageJson(__originalVersion);
  }
}



function __gitCommit() {
  console.log("Committing version update...");
  return Promise.resolve()
    .then(() => __runCommand('git add package.json'))
    .then(() => __runCommand('git commit -m "Updating version."'))
    .then(() => __runCommand('git push'))
    .then(() => __gitCommitStepCompleted = true)
    .then(() => {});
}



function __rollBackGitCommit() {
  console.log("Rolling back version update commit...");
  return Promise.resolve()
    .then(() => __runCommand('git revert -n HEAD'))
    .then(() => __runCommand('git commit -m "Reverting previous commit due to error in version update."'))
    .then(() => {});
}



function __gitPush() {
  return __runCommand('git push');
}



type IUpdateType = 'major' | 'minor' | 'patch';

function __calcNewVersionFromVersionString(oldVersion: string) {
  const match = oldVersion.match(/^(\d+)\.(\d+)\.(\d+)-update-(major|minor|patch)+$/);
  if (!match) {
    throw new Error(`Invalid value for "version" in package.json.`);
  }

  const [_wholeMatch, sOldMajor, sOldMinor, sOldPatch, sUpdateType] = match;
  const updateType = sUpdateType as IUpdateType;
  const [oldMajor, oldMinor, oldPatch] = _.map([sOldMajor, sOldMinor, sOldPatch], s => parseInt(s, 10));
  const {major, minor, patch} = __calcNewVersion(oldMajor, oldMinor, oldPatch, updateType);
  return `${major}.${minor}.${patch}`;
}



interface IVersionDelta {
  major: number;
  minor: number;
  patch: number;
}

function __calcNewVersion(oldMajor: number, oldMinor: number, oldPatch: number, updateType: IUpdateType) {
  const versionDeltas = {
    major: {
      major: 1,
      minor: -oldMinor,
      patch: -oldPatch
    },
    minor: {
      major: 0,
      minor: 1,
      patch: -oldPatch
    },
    patch: {
      major: 0,
      minor: 0,
      patch: 1
    }
  } as Record<IUpdateType, IVersionDelta>;

  return _.mergeWith(
    {
      major: oldMajor,
      minor: oldMinor,
      patch: oldPatch
    },
    versionDeltas[updateType],
    (destValue: number, srcValue: number) =>
      destValue + srcValue
  )
}



function __makeRelease(repoPath: string, githubApiKey: string, newVersionString: string) {
  console.log("Making github release...");
  const tagName = `v${newVersionString}`;

  return new Promise((resolve, reject) => {
    request.post(
      `https://api.github.com/repos/${repoPath}/releases`,
      {
        headers: {
          "Content-Type": 'application/json',
          "Authorization": `token ${githubApiKey}`,
          "User-Agent": "Version updater"
        },
        body: {
          tag_name: tagName,
          name: tagName
        },
        json: true
      },
      (err, response, body) => {
        if (err) {
          reject(err);
        } else if (!__isSuccessCode(response.statusCode)) {
          reject(`${response.statusMessage}; ${body}`);
        } else {
          resolve();
        }
      });
  });
}



function __isSuccessCode(statusCode: number) {
  return (statusCode.toString()[0] === '2');
}



function __gitPull() {
  return __runCommand('git pull');
}



function __performRollbacks() {
  return Promise.resolve()

    .then(() => {
      if (__gitCommitStepCompleted) {
        return __rollBackGitCommit();
      }
      return Promise.resolve();
    })

    .then(() => {
      if (__updateVersionStepCompleted) {
        __rollBackUpdateVersion();
      }
    });
}



function __run(repoPath: string, githubApiKey: string) {
  let newVersionString = '';
  return Promise.resolve()
    .then(() => __updateVersion())
    .then((_newVersionString) => newVersionString = _newVersionString)

    .then(() => __gitCommit())
    .then(() => __gitPush())
    .then(() => __makeRelease(repoPath, githubApiKey, newVersionString))    
    
    .catch(err => {
      console.error("Error before pull.");
      console.error(err);
      return __performRollbacks();
    })

    .then(() => {
      if (__updateVersionStepCompleted && __gitCommitStepCompleted) {
        __gitPull();
      }
    })

    .then(() => {
      if (__updateVersionStepCompleted && __gitCommitStepCompleted) {
        console.log("Done.");
      }
    })
    
    .catch(err => {
      console.error("Error after pull.");
      console.error(err);
    });
}



function __printUsage() {
  console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/updateReleaseVersion.js <repoPath> <githubApiKey>");
  console.log("\n<repoPath> is formatted as: <organizationOrUsername>/<repo>");
  console.log("Example: MetisoftSolutions/recruitchute-server-api-interfaces");
}



function main() {
  if (process.argv.length < 4) {
    __printUsage();
    return;
  }

  const repoPath = process.argv[2];
  const githubApiKey = process.argv[3];
  return __run(repoPath, githubApiKey);
}
main();
