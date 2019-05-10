"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
const path_1 = __importDefault(require("path"));
const es6_promise_1 = require("es6-promise");
const fileUtil = __importStar(require("../util/fileUtil"));
function __genPath(pathString) {
    return path_1.default.join(..._.compact(pathString.split('/')));
}
function __setEnvironment(config, envName, dockerRepoAndTag) {
    return es6_promise_1.Promise.all(_.map(config.setEnv.fileSuffix2Destination, (destination, fileSuffix) => {
        const sourceDir = path_1.default.join(process.cwd(), 'config', 'env');
        const destPath = __genPath(destination);
        const destFileName = fileSuffix === '.json' ?
            'env.json' :
            fileSuffix.slice(1);
        return fileUtil.copyFile(path_1.default.join(sourceDir, `${envName}${fileSuffix}`), path_1.default.join(destPath, destFileName));
    }))
        .then(() => {
        const dockerrunAwsJsonKey = '-Dockerrun.aws.json';
        if (dockerRepoAndTag && !_.isUndefined(config.setEnv.fileSuffix2Destination[dockerrunAwsJsonKey])) {
            const dockerrunFileDest = path_1.default.join(__genPath(config.setEnv.fileSuffix2Destination[dockerrunAwsJsonKey]), dockerrunAwsJsonKey.slice(1));
            const dockerrunFileContents = fileUtil.readFile(dockerrunFileDest);
            const dockerrunFileObject = JSON.parse(dockerrunFileContents);
            dockerrunFileObject["Image"]["Name"] = dockerRepoAndTag;
            fileUtil.writeFile(dockerrunFileDest, JSON.stringify(dockerrunFileObject, null, 2));
        }
    });
}
function __printSuccess(envName, dockerRepoAndTag) {
    let message = `Environment set to ${envName}.${dockerRepoAndTag ? ` Docker image set to ${dockerRepoAndTag}.` : ''}`;
    console.log(message);
}
function setEnv(config, envName, dockerRepoAndTag) {
    return es6_promise_1.Promise.resolve()
        .then(() => __setEnvironment(config, envName, dockerRepoAndTag))
        .then(() => __printSuccess(envName, dockerRepoAndTag));
}
exports.setEnv = setEnv;
