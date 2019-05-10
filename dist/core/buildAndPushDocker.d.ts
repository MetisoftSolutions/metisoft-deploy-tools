import { Promise } from 'es6-promise';
import * as configUtil from '../util/configUtil';
export declare function buildAndPushDocker(config: configUtil.IConfig, envName: string): Promise<string>;
