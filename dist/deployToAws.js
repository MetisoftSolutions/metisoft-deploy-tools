"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const configUtil = __importStar(require("./util/configUtil"));
const es6_promise_1 = require("es6-promise");
const writeVersionFile_1 = require("./core/writeVersionFile");
const updatePrivateDependencyVersions_1 = require("./core/updatePrivateDependencyVersions");
const updateReleaseVersion_1 = require("./core/updateReleaseVersion");
const buildAndPushDocker_1 = require("./core/buildAndPushDocker");
const deployToAws_1 = require("./core/deployToAws");
function main() {
    const config = configUtil.getConfig();
    let envName = '';
    if (process.argv.length < 3) {
        console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/deployToAws.js <envName>");
        return es6_promise_1.Promise.resolve();
    }
    envName = process.argv[2];
    const envSettings = config.envName2Settings[envName];
    if (!envSettings) {
        throw new Error(`No settings for environment ${envName}.`);
    }
    return es6_promise_1.Promise.resolve()
        .then(() => updatePrivateDependencyVersions_1.updatePrivateDependencyVersions(config.github.apiKey, config.updatePrivateDependencyVersions.packageNames))
        .then(() => updateReleaseVersion_1.updateReleaseVersion(config.github.repoPath, config.github.apiKey))
        .then(() => {
        if (config.writeVersionFile.destinationPath) {
            writeVersionFile_1.writeVersionFile(config.writeVersionFile.destinationPath);
        }
    })
        .then(() => buildAndPushDocker_1.buildAndPushDocker(config, envName))
        .then(zipFileName => deployToAws_1.deployToAws({
        s3BucketName: config.aws.s3.bucketName,
        s3Directory: config.aws.s3.sourceBundleDirectoryKey,
        applicationName: envSettings.ebApplicationName,
        environmentName: envSettings.ebEnvironmentName,
        fileName: zipFileName
    }));
}
main();
