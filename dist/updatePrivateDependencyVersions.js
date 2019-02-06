"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const request = __importStar(require("request"));
const es6_promise_1 = require("es6-promise");
const __pathToPackageJson = path.join('.', 'package.json');
const fullRepoMatchRegex = /^git\+ssh\:\/\/git\@github\.com\/([a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+)\.git\#semver\:\^\d+\.\d+\.\d+$/;
const versionMatchRegex = /^(git\+ssh\:\/\/git\@github\.com\/[a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+\.git\#semver\:\^)(\d+\.\d+\.\d+)$/;
function __readFile(fileName) {
    return fs.readFileSync(fileName, 'utf8');
}
function __writeFile(fileName, contents) {
    fs.writeFileSync(fileName, contents, 'utf8');
}
function __getPackageJsonAsObject() {
    const sPackageJson = __readFile(__pathToPackageJson);
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
    const match = fullRepo.match(fullRepoMatchRegex);
    if (!match) {
        throw new Error(`Invalid repo name: ${fullRepo}`);
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
    __writeFile(path.join('.', 'package.json'), JSON.stringify(newPackageJson, null, 2));
}
function __run(githubApiKey, packageNames) {
    return es6_promise_1.Promise.resolve()
        .then(() => __getRepos(packageNames))
        .then(packageName2ShortRepo => __getLatestVersionsOfPackages(githubApiKey, packageName2ShortRepo))
        .then(packageName2Version => __updatePackageJson(packageName2Version))
        .catch(err => console.error(err));
}
function __printUsage() {
    console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/updatePrivateDependencyVersions.js <githubApiKey> <packageName1> [<packageName2> [... [<packageNameN>]]]");
    console.log("\n<packageNameI> is a key in the dependencies object of package.json.");
    console.log("Example: recruitchute-server-api-interfaces");
}
function main() {
    if (process.argv.length < 4) {
        __printUsage();
        return;
    }
    const githubApiKey = process.argv[2];
    const packageNames = [];
    for (let i = 3; i < process.argv.length; ++i) {
        packageNames.push(process.argv[i]);
    }
    return __run(githubApiKey, packageNames);
}
main();
