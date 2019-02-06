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
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const es6_promise_1 = require("es6-promise");
const request = __importStar(require("request"));
let __originalVersion = '';
let __updateVersionStepCompleted = false;
let __gitCommitStepCompleted = false;
const __pathToPackageJson = path.join('.', 'package.json');
function __readFile(fileName) {
    return fs.readFileSync(fileName, 'utf8');
}
function __writeFile(fileName, contents) {
    fs.writeFileSync(fileName, contents, 'utf8');
}
function __runCommand(fullCommand) {
    return new es6_promise_1.Promise((resolve, reject) => {
        console.log(`\n*** Running command: ${fullCommand}`);
        const process = child_process_1.exec(fullCommand);
        process.stdout.on('data', __printOutputFromProcess);
        process.stderr.on('data', __printOutputFromProcess);
        process.on('exit', resolve);
    });
}
function __printOutputFromProcess(chunk) {
    process.stdout.write(chunk.toString());
}
function __getPackageJsonAsObject() {
    const sPackageJson = __readFile(__pathToPackageJson);
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
    __writeFile(__pathToPackageJson, JSON.stringify(packageJson, null, 2));
}
function __updateVersion() {
    console.log("Updating the version...");
    let changedVersion = false;
    __originalVersion = __getVersionFromPackageJson();
    const newVersion = __calcNewVersionFromVersionString(__originalVersion);
    if (newVersion !== __originalVersion) {
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
        .then(() => __runCommand('git add package.json'))
        .then(() => __runCommand('git commit -m "Updating version."'))
        .then(() => __runCommand('git push'))
        .then(() => __gitCommitStepCompleted = true)
        .then(() => { });
}
function __rollBackGitCommit() {
    console.log("Rolling back version update commit...");
    return es6_promise_1.Promise.resolve()
        .then(() => __runCommand('git revert -n HEAD'))
        .then(() => __runCommand('git commit -m "Reverting previous commit due to error in version update."'))
        .then(() => { });
}
function __gitPush() {
    return __runCommand('git push');
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
                reject(`${response.statusMessage}; ${body}`);
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
    return __runCommand('git pull');
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
function __run(repoPath, githubApiKey) {
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
        return __performRollbacks();
    });
}
function __commitAndMakeRelease(repoPath, githubApiKey, newVersionString) {
    return es6_promise_1.Promise.resolve()
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
