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
