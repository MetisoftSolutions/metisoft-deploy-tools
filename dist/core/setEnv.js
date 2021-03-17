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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setEnv = void 0;
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
