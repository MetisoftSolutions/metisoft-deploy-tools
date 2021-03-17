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
const core = __importStar(require("./core/updatePrivateDependencyVersions"));
function __printUsage() {
    console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/updatePrivateDependencyVersions.js <githubApiKey> <packageName1> [<packageName2> [... [<packageNameN>]]]");
    console.log("\n<packageNameI> is a key in the dependencies object of package.json.");
    console.log("Example: recruitchute-server-api-interfaces");
}
function main() {
    if (process.argv.length < 4) {
        __printUsage();
        return;
    }
    const githubApiKey = process.argv[2];
    const packageNames = [];
    for (let i = 3; i < process.argv.length; ++i) {
        packageNames.push(process.argv[i]);
    }
    return core.updatePrivateDependencyVersions(githubApiKey, packageNames);
}
main();
