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
exports.updateReleaseVersion = void 0;
const _ = __importStar(require("lodash"));
const path = __importStar(require("path"));
const es6_promise_1 = require("es6-promise");
const request = __importStar(require("request"));
const fileUtil = __importStar(require("../util/fileUtil"));
const processUtil = __importStar(require("../util/processUtil"));
let __originalVersion = '';
let __updateVersionStepCompleted = false;
let __gitCommitStepCompleted = false;
const __pathToPackageJson = path.join(process.cwd(), 'package.json');
function __getPackageJsonAsObject() {
    const sPackageJson = fileUtil.readFile(__pathToPackageJson);
    const oPackageJson = JSON.parse(sPackageJson);
    if (!oPackageJson) {
        throw new Error("Cannot open package.json.");
    }
    return oPackageJson;
}
function __getVersionFromPackageJson() {
    const packageJson = __getPackageJsonAsObject();
    if (!packageJson.version || !_.isString(packageJson.version)) {
        throw new Error("Cannot read version from package.json.");
    }
    return packageJson.version;
}
function __setVersionInPackageJson(version) {
    const packageJson = __getPackageJsonAsObject();
    packageJson.version = version;
    fileUtil.writeFile(__pathToPackageJson, JSON.stringify(packageJson, null, 2));
}
function __updateVersion() {
    let changedVersion = false;
    __originalVersion = __getVersionFromPackageJson();
    const newVersion = __calcNewVersionFromVersionString(__originalVersion);
    if (newVersion === __originalVersion) {
        console.log("Version doesn't need to be updated.");
    }
    else {
        console.log(`Updating the version to ${newVersion}...`);
        __setVersionInPackageJson(newVersion);
        __updateVersionStepCompleted = true;
        changedVersion = true;
    }
    return {
        changedVersion,
        newVersion
    };
}
function __rollBackUpdateVersion() {
    console.log("Rolling back version update...");
    if (__originalVersion) {
        __setVersionInPackageJson(__originalVersion);
    }
}
function __gitCommit() {
    console.log("Committing version update...");
    return es6_promise_1.Promise.resolve()
        .then(() => processUtil.runCommand('git add package.json'))
        .then(() => processUtil.runCommand('git commit -m "Updating version."'))
        .then(() => processUtil.runCommand('git push'))
        .then(() => __gitCommitStepCompleted = true)
        .then(() => { });
}
function __rollBackGitCommit() {
    console.log("Rolling back version update commit...");
    return es6_promise_1.Promise.resolve()
        .then(() => processUtil.runCommand('git revert -n HEAD'))
        .then(() => processUtil.runCommand('git commit -m "Reverting previous commit due to error in version update."'))
        .then(() => { });
}
function __gitPush() {
    return processUtil.runCommand('git push');
}
function __calcNewVersionFromVersionString(oldVersion) {
    const match = oldVersion.match(/^(\d+)\.(\d+)\.(\d+)-update-(major|minor|patch)+$/);
    if (!match) {
        return oldVersion;
    }
    const [_wholeMatch, sOldMajor, sOldMinor, sOldPatch, sUpdateType] = match;
    const updateType = sUpdateType;
    const [oldMajor, oldMinor, oldPatch] = _.map([sOldMajor, sOldMinor, sOldPatch], (s) => parseInt(s, 10));
    const { major, minor, patch } = __calcNewVersion(oldMajor, oldMinor, oldPatch, updateType);
    return `${major}.${minor}.${patch}`;
}
function __calcNewVersion(oldMajor, oldMinor, oldPatch, updateType) {
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
    };
    return _.mergeWith({
        major: oldMajor,
        minor: oldMinor,
        patch: oldPatch
    }, versionDeltas[updateType], (destValue, srcValue) => destValue + srcValue);
}
function __makeRelease(repoPath, githubApiKey, newVersionString) {
    console.log("Making github release...");
    const tagName = `v${newVersionString}`;
    return new es6_promise_1.Promise((resolve, reject) => {
        request.post(`https://api.github.com/repos/${repoPath}/releases`, {
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
        }, (err, response, body) => {
            if (err) {
                reject(err);
            }
            else if (!__isSuccessCode(response.statusCode)) {
                reject(`${response.statusMessage}; ${_.isObject(body) ? JSON.stringify(body, null, 2) : body}`);
            }
            else {
                resolve();
            }
        });
    });
}
function __isSuccessCode(statusCode) {
    return (statusCode.toString()[0] === '2');
}
function __gitPull() {
    return processUtil.runCommand('git pull');
}
function __performRollbacks() {
    return es6_promise_1.Promise.resolve()
        .then(() => {
        if (__gitCommitStepCompleted) {
            __gitCommitStepCompleted = false;
            return __rollBackGitCommit();
        }
        return es6_promise_1.Promise.resolve();
    })
        .then(() => {
        if (__updateVersionStepCompleted) {
            __updateVersionStepCompleted = false;
            __rollBackUpdateVersion();
        }
    });
}
function updateReleaseVersion(repoPath, githubApiKey) {
    return es6_promise_1.Promise.resolve()
        .then(() => __updateVersion())
        .then(updateResults => {
        if (updateResults.changedVersion) {
            return __commitAndMakeRelease(repoPath, githubApiKey, updateResults.newVersion);
        }
    })
        .catch(err => {
        console.error("Error before pull.");
        console.error(err);
        return __performRollbacks()
            .then(() => {
            throw err;
        });
    });
}
exports.updateReleaseVersion = updateReleaseVersion;
function __commitAndMakeRelease(repoPath, githubApiKey, newVersionString) {
    let errToRethrow;
    return es6_promise_1.Promise.resolve()
        .then(() => __gitCommit())
        .then(() => __gitPush())
        .then(() => __makeRelease(repoPath, githubApiKey, newVersionString))
        .catch(err => {
        errToRethrow = err;
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
        errToRethrow = err;
        console.error("Error after pull.");
        console.error(err);
    })
        .then(() => {
        if (errToRethrow) {
            throw errToRethrow;
        }
    });
}
