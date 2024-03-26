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
exports.buildAndPushDocker = void 0;
const es6_promise_1 = require("es6-promise");
const fs = __importStar(require("fs"));
const archiver = __importStar(require("archiver"));
const processUtil = __importStar(require("../util/processUtil"));
const fileUtil = __importStar(require("../util/fileUtil"));
const path_1 = __importDefault(require("path"));
const setEnv = __importStar(require("./setEnv"));
const moment_1 = __importDefault(require("moment"));
function __genDockerRepoAndTag(dockerRepo, dockerLocalImageName, envName) {
    const timestamp = moment_1.default().format('YYYYMMDDtHHmmss');
    const sPackage = fileUtil.readFile(path_1.default.join(process.cwd(), 'package.json'));
    const packageObj = JSON.parse(sPackage);
    if (!packageObj || !packageObj.version) {
        throw new Error("Cannot open package.json.");
    }
    const version = packageObj.version;
    const dockerRepoAndTag = `${dockerRepo}:${timestamp}_${dockerLocalImageName}_v${version}_${envName}`;
    return dockerRepoAndTag;
}
function __buildDocker(dockerLocalImageName) {
    return processUtil.runCommand(`docker build -t ${dockerLocalImageName} --no-cache --platform linux/x86_64 .`);
}
function __pushDocker(dockerLocalImageName, dockerRepoAndTag) {
    return es6_promise_1.Promise.resolve()
        .then(() => processUtil.runCommand(`docker tag ${dockerLocalImageName} ${dockerRepoAndTag}`))
        .then(() => processUtil.runCommand(`docker push ${dockerRepoAndTag}`));
}
function __getTag(dockerRepoAndTag) {
    const tokens = dockerRepoAndTag.split(':');
    return tokens[1] || '';
}
function __makeElasticBeanstalkBundle(dockerRepoAndTag) {
    const zipFileName = `${__getTag(dockerRepoAndTag)}.zip`;
    return new es6_promise_1.Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipFileName);
        const archive = archiver.create('zip');
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        archive.directory('.ebextensions/', '.ebextensions');
        archive.directory('.platform/', '.platform');
        archive.file('Dockerrun.aws.json', { name: 'Dockerrun.aws.json' });
        archive.finalize();
    })
        .then(() => zipFileName);
}
function buildAndPushDocker(config, envName) {
    const dockerRepo = config.envName2Settings[envName].dockerRepo;
    const dockerLocalImageName = config.buildAndPushDocker.dockerLocalImageName;
    const dockerRepoAndTag = __genDockerRepoAndTag(dockerRepo, dockerLocalImageName, envName);
    return es6_promise_1.Promise.resolve()
        .then(() => setEnv.setEnv(config, envName, dockerRepoAndTag))
        .then(() => __buildDocker(dockerLocalImageName))
        .then(() => __pushDocker(dockerLocalImageName, dockerRepoAndTag))
        .then(() => __makeElasticBeanstalkBundle(dockerRepoAndTag));
}
exports.buildAndPushDocker = buildAndPushDocker;
