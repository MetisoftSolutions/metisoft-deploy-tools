"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePrivateDependencyVersions = void 0;
const _ = __importStar(require("lodash"));
const path = __importStar(require("path"));
const request = __importStar(require("request"));
const es6_promise_1 = require("es6-promise");
const fileUtil = __importStar(require("../util/fileUtil"));
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
    return oPackageJson;
}
function __getRepos(packageNames) {
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
    }, {});
}
function __fullRepo2ShortRepo(fullRepo) {
    let match = fullRepo.match(fullRepoMatchRegexGitSsh);
    if (!match) {
        match = fullRepo.match(fullRepoMatchRegexHttps);
        if (!match) {
            throw new Error(`Invalid repo name: ${fullRepo}`);
        }
    }
    return match[1];
}
function __getLatestVersionsOfPackages(githubApiKey, packageName2ShortRepo) {
    return es6_promise_1.Promise.all(_.map(packageName2ShortRepo, (shortRepo, packageName) => {
        return new es6_promise_1.Promise((resolve, reject) => {
            request.get(`https://api.github.com/repos/${shortRepo}/releases/latest`, {
                headers: {
                    "Authorization": `token ${githubApiKey}`,
                    "User-Agent": "Version updater"
                }
            }, (err, response, body) => {
                const oBody = JSON.parse(body);
                if (err) {
                    reject(err);
                }
                else if (!__isSuccessCode(response.statusCode)) {
                    reject(`${response.statusMessage}; ${body}`);
                }
                else {
                    resolve({
                        packageName,
                        version: __tagName2Version(oBody.tag_name) || ''
                    });
                }
            });
        });
    }))
        .then(repoAndVersions => _.reduce(repoAndVersions, (packageName2Version, repoAndVersion) => {
        packageName2Version[repoAndVersion.packageName] = repoAndVersion.version;
        return packageName2Version;
    }, {}));
}
function __isSuccessCode(statusCode) {
    return (statusCode.toString()[0] === '2');
}
function __tagName2Version(tagName) {
    if (!tagName || !tagName.startsWith('v')) {
        return '';
    }
    return tagName.slice(1);
}
function __updatePackageJson(packageName2Version) {
    const packageJson = __getPackageJsonAsObject();
    if (!packageJson.dependencies || !_.isObject(packageJson.dependencies)) {
        throw new Error("Cannot find \"dependencies\" key in package.json.");
    }
    const newPackageJson = _.reduce(packageName2Version, (packageJson, newVersion, packageName) => {
        const repo = packageJson.dependencies[packageName];
        if (!_.isString(repo)) {
            throw new Error(`Cannot access repo string in package.json for "${packageName}".`);
        }
        const newRepo = repo.replace(versionMatchRegex, (_match, preVersion, _oldVersion, _offset, _str) => preVersion + newVersion);
        packageJson.dependencies[packageName] = newRepo;
        return packageJson;
    }, packageJson);
    fileUtil.writeFile(__pathToPackageJson, JSON.stringify(newPackageJson, null, 2));
}
function updatePrivateDependencyVersions(githubApiKey, packageNames) {
    return es6_promise_1.Promise.resolve()
        .then(() => __getRepos(packageNames))
        .then(packageName2ShortRepo => __getLatestVersionsOfPackages(githubApiKey, packageName2ShortRepo))
        .then(packageName2Version => __updatePackageJson(packageName2Version))
        .catch(err => console.error(err));
}
exports.updatePrivateDependencyVersions = updatePrivateDependencyVersions;
