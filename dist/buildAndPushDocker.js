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
const core = __importStar(require("./core/buildAndPushDocker"));
function main() {
    const config = configUtil.getConfig();
    let envName = '';
    if (process.argv.length < 3) {
        console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/buildAndPushDocker.js <envName>");
        return;
    }
    envName = process.argv[2];
    const envSettings = config.envName2Settings[envName];
    if (!envSettings) {
        throw new Error(`No settings for environment ${envName}.`);
    }
    return core.buildAndPushDocker(config, envName);
}
main();
