import { Promise } from 'es6-promise';
import * as configUtil from '../util/configUtil';
export declare function setEnv(config: configUtil.IConfig, envName: string, dockerRepoAndTag?: string): Promise<void>;
