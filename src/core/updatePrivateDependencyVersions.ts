import * as _ from 'lodash';

import * as path from 'path';
import * as request from 'request';
import { Promise } from 'es6-promise';
import * as fileUtil from '../util/fileUtil';

const __pathToPackageJson = path.join(process.cwd(), 'package.json');

const fullRepoMatchRegexGitSsh = /^git\+ssh\:\/\/git\@github\.com\/([a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+)\.git\#semver\:\^\d+\.\d+\.\d+$/;
const fullRepoMatchRegexHttps = /^https\:\/\/github\.com\/([a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+)\.git\#semver\:\^\d+\.\d+\.\d+$/;
const versionMatchRegex = /^((?:git\+ssh\:\/\/git\@|https\:\/\/)github\.com\/[a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+\.git\#semver\:\^)(\d+\.\d+\.\d+)$/;



function __getPackageJsonAsObject() {
  const sPackageJson = fileUtil.readFile(__pathToPackageJson);
  const oPackageJson = JSON.parse(sPackageJson);

  if (!oPackageJson) {
    throw new Error("Cannot open package.json.");
  }

  return oPackageJson as any;
}



function __getRepos(packageNames: string[]) {
  const packageJson = __getPackageJsonAsObject();
  if (!packageJson.dependencies || !_.isObject(packageJson.dependencies)) {
    throw new Error("Cannot find \"dependencies\" key in package.json.");
  }

  return _.reduce(packageNames, (packageName2ShortRepo, packageName) => {
    const fullRepo = packageJson.dependencies[packageName];
    if (!fullRepo) {
      throw new Error(`Cannot find entry in package.json for "${packageName}".`);
    }
    packageName2ShortRepo[packageName] = __fullRepo2ShortRepo(fullRepo);
    return packageName2ShortRepo;
  }, {} as Record<string, string>);
}



function __fullRepo2ShortRepo(fullRepo: string) {
  let match = fullRepo.match(fullRepoMatchRegexGitSsh);
  if (!match) {
    match = fullRepo.match(fullRepoMatchRegexHttps);
    if (!match) {
      throw new Error(`Invalid repo name: ${fullRepo}`);
    }
  }
  return match[1];
}



interface IRepoAndVersion {
  packageName: string;
  version: string;
}

function __getLatestVersionsOfPackages(githubApiKey: string, packageName2ShortRepo: Record<string, string>) {
  return Promise.all(_.map(packageName2ShortRepo, (shortRepo, packageName) => {
      return new Promise<IRepoAndVersion>((resolve, reject) => {
        request.get(
          `https://api.github.com/repos/${shortRepo}/releases/latest`,
          {
            headers: {
              "Authorization": `token ${githubApiKey}`,
              "User-Agent": "Version updater"
            }
          },
          (err, response, body) => {
            const oBody = JSON.parse(body);
            if (err) {
              reject(err);

            } else if (!__isSuccessCode(response.statusCode)) {
              reject(`${response.statusMessage}; ${body}`);

            } else {
              resolve({
                packageName,
                version: __tagName2Version(oBody.tag_name) || ''
              } as IRepoAndVersion);
            }
          }
        )
      })
    }))

    .then(repoAndVersions =>
      _.reduce(repoAndVersions, (packageName2Version, repoAndVersion) => {
        packageName2Version[repoAndVersion.packageName] = repoAndVersion.version;
        return packageName2Version;
      }, {} as Record<string, string>));
}



function __isSuccessCode(statusCode: number) {
  return (statusCode.toString()[0] === '2');
}



function __tagName2Version(tagName: string) {
  if (!tagName || !tagName.startsWith('v')) {
    return '';
  }

  return tagName.slice(1);
}



function __updatePackageJson(packageName2Version: Record<string, string>) {
  const packageJson = __getPackageJsonAsObject();
  if (!packageJson.dependencies || !_.isObject(packageJson.dependencies)) {
    throw new Error("Cannot find \"dependencies\" key in package.json.");
  }

  const newPackageJson = _.reduce(packageName2Version, (packageJson, newVersion, packageName) => {
    const repo = packageJson.dependencies[packageName];
    if (!_.isString(repo)) {
      throw new Error(`Cannot access repo string in package.json for "${packageName}".`);
    }

    const newRepo = repo.replace(versionMatchRegex, (_match, preVersion, _oldVersion, _offset, _str) =>
      preVersion + newVersion);

    packageJson.dependencies[packageName] = newRepo;
    return packageJson;
  }, packageJson);

  fileUtil.writeFile(__pathToPackageJson, JSON.stringify(newPackageJson, null, 2));
}



export function updatePrivateDependencyVersions(githubApiKey: string, packageNames: string[]) {
  return Promise.resolve()
    .then(() => __getRepos(packageNames))
    .then(packageName2ShortRepo => __getLatestVersionsOfPackages(githubApiKey, packageName2ShortRepo))
    .then(packageName2Version => __updatePackageJson(packageName2Version))
    .catch(err => console.error(err));
}
