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
exports.getConfig = void 0;
const _ = __importStar(require("lodash"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsonschema_1 = require("jsonschema");
const nonEmptyStringSchema = {
    type: 'string',
    minLength: 1
};
const config_githubSchema = {
    type: 'object',
    properties: {
        'apiKey': nonEmptyStringSchema,
        'repoPath': nonEmptyStringSchema
    },
    required: [
        'apiKey',
        'repoPath'
    ]
};
const config_aws_s3Schema = {
    type: 'object',
    properties: {
        'bucketName': nonEmptyStringSchema,
        'sourceBundleDirectoryKey': nonEmptyStringSchema
    },
    required: [
        'bucketName',
        'sourceBundleDirectoryKey'
    ]
};
const config_awsSchema = {
    type: 'object',
    properties: {
        's3': config_aws_s3Schema
    },
    required: [
        's3'
    ]
};
const environmentSettingsSchema = {
    type: 'object',
    properties: {
        'dockerRepo': nonEmptyStringSchema,
        'ebApplicationName': nonEmptyStringSchema,
        'ebEnvironmentName': nonEmptyStringSchema
    },
    required: [
        'dockerRepo',
        'ebApplicationName',
        'ebEnvironmentName'
    ]
};
const config_envName2SettingsSchema = {
    type: 'object',
    patternProperties: {
        '^.+$': environmentSettingsSchema
    }
};
const config_writeVersionFileSchema = {
    type: 'object',
    properties: {
        'destinationPath': { type: 'string' }
    },
    required: [
        'destinationPath'
    ]
};
const config_updatePrivateDependencyVersionsSchema = {
    type: 'object',
    properties: {
        'packageNames': __genArraySchema(nonEmptyStringSchema)
    },
    required: [
        'packageNames'
    ]
};
const config_setEnvSchema = {
    type: 'object',
    properties: {
        'fileSuffix2Destination': {
            type: 'object',
            patternProperties: {
                '^.+$': nonEmptyStringSchema
            }
        }
    },
    required: [
        'fileSuffix2Destination'
    ]
};
const config_buildAndPushDockerSchema = {
    type: 'object',
    properties: {
        'dockerLocalImageName': nonEmptyStringSchema
    },
    required: [
        'dockerLocalImageName'
    ]
};
const configSchema = {
    type: 'object',
    properties: {
        'github': config_githubSchema,
        'aws': config_awsSchema,
        'envName2Settings': config_envName2SettingsSchema,
        'writeVersionFile': config_writeVersionFileSchema,
        'updatePrivateDependencyVersions': config_updatePrivateDependencyVersionsSchema,
        'setEnv': config_setEnvSchema,
        'buildAndPushDocker': config_buildAndPushDockerSchema
    },
    required: [
        'github',
        'aws',
        'envName2Settings',
        'writeVersionFile',
        'updatePrivateDependencyVersions',
        'setEnv',
        'buildAndPushDocker'
    ]
};
function __genArraySchema(itemSchema) {
    return {
        type: 'array',
        items: itemSchema
    };
}
function __checkAgainstSchema(value, schema, errors) {
    const v = new jsonschema_1.Validator();
    const result = v.validate(value, schema);
    if (result.errors.length > 0) {
        _.forEach(result.errors, err => errors.push(err));
        return false;
    }
    return true;
}
function __validateConfig(config, errors) {
    return __checkAgainstSchema(config, configSchema, errors);
}
const __configFilePath = path_1.default.join(process.cwd(), 'config', 'deploy.json');
function __getConfigFileContents() {
    return fs_1.default.readFileSync(__configFilePath, 'utf8');
}
function getConfig() {
    const config = JSON.parse(__getConfigFileContents());
    const errors = [];
    if (!__validateConfig(config, errors)) {
        console.error(_.repeat('*', 80));
        console.error("DEPLOY TOOLS CONFIG FILE CONTENTS ARE INVALID!");
        console.error(_.repeat('*', 80));
        console.error(`Tried loading from: ${__configFilePath}`);
        console.error(_.repeat('*', 80));
        console.error(JSON.stringify(errors, null, 2));
        console.error(_.repeat('*', 80));
        throw new Error('INVALID_DEPLOY_TOOLS_CONFIG_FILE');
    }
    return config;
}
exports.getConfig = getConfig;
