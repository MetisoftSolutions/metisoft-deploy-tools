import * as _ from 'lodash';

import fs from 'fs';
import path from 'path';
import {
  Schema,
  ValidationError,
  Validator
} from 'jsonschema';



export interface IEnvironmentSettings {
  dockerRepo: string;
  ebApplicationName: string;
  ebEnvironmentName: string;
}

export interface IConfig {
  github: {
    apiKey: string;
    repoPath: string;
  };
  aws: {
    s3: {
      bucketName: string;
      sourceBundleDirectoryKey: string;
    };
  };
  envName2Settings: Record<string, IEnvironmentSettings>;
  writeVersionFile: {
    destinationPath: string;
  };
  updatePrivateDependencyVersions: {
    packageNames: string[];
  };
  setEnv: {
    fileSuffix2Destination: Record<string, string>;
  };
  buildAndPushDocker: {
    dockerLocalImageName: string;
  };
}



const nonEmptyStringSchema: Schema = {
  type: 'string',
  minLength: 1
};



const config_githubSchema: Schema = {
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

const config_aws_s3Schema: Schema = {
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

const config_awsSchema: Schema = {
  type: 'object',
  properties: {
    's3': config_aws_s3Schema
  },
  required: [
    's3'
  ]
};

const environmentSettingsSchema: Schema = {
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

const config_envName2SettingsSchema: Schema = {
  type: 'object',
  patternProperties: {
    '^.+$': environmentSettingsSchema
  }
};

const config_writeVersionFileSchema: Schema = {
  type: 'object',
  properties: {
    'destinationPath': nonEmptyStringSchema
  },
  required: [
    'destinationPath'
  ]
};

const config_updatePrivateDependencyVersionsSchema: Schema = {
  type: 'object',
  properties: {
    'packageNames': __genArraySchema(nonEmptyStringSchema)
  },
  required: [
    'packageNames'
  ]
};

const config_setEnvSchema: Schema = {
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

const config_buildAndPushDockerSchema: Schema = {
  type: 'object',
  properties: {
    'dockerLocalImageName': nonEmptyStringSchema
  },
  required: [
    'dockerLocalImageName'
  ]
};

const configSchema: Schema = {
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



function __genArraySchema(itemSchema: Schema): Schema {
  return {
    type: 'array',
    items: itemSchema
  };
}



function __checkAgainstSchema(value: any, schema: Schema, errors: ValidationError[]) {
  const v = new Validator();
  const result = v.validate(value, schema);

  if (result.errors.length > 0) {
    _.forEach(result.errors, err => errors.push(err));
    return false;
  }

  return true;
}



function __validateConfig(config: IConfig, errors: ValidationError[]) {
  return __checkAgainstSchema(config, configSchema, errors);
}



const __configFilePath = path.join(process.cwd(), 'config', 'deploy.json');

function __getConfigFileContents() {
  return fs.readFileSync(__configFilePath, 'utf8');
}



export function getConfig() {
  const config: IConfig = JSON.parse(__getConfigFileContents());

  const errors: ValidationError[] = [];
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
