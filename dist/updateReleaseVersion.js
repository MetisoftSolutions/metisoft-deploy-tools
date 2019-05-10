"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("./core/updateReleaseVersion"));
function __printUsage() {
    console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/updateReleaseVersion.js <repoPath> <githubApiKey>");
    console.log("\n<repoPath> is formatted as: <organizationOrUsername>/<repo>");
    console.log("Example: MetisoftSolutions/recruitchute-server-api-interfaces");
}
function main() {
    if (process.argv.length < 4) {
        __printUsage();
        return;
    }
    const repoPath = process.argv[2];
    const githubApiKey = process.argv[3];
    return core.updateReleaseVersion(repoPath, githubApiKey);
}
main();
