"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("./core/writeVersionFile"));
function __printUsage() {
    console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/writeVersionFile.js <destinationPath>");
    console.log("Example: node ./node_modules/metisoft-deploy-tools/dist/writeVersionFile.js src/config");
}
function main() {
    if (process.argv.length < 3) {
        __printUsage();
        return;
    }
    const destinationPath = process.argv[2];
    return core.writeVersionFile(destinationPath);
}
main();
