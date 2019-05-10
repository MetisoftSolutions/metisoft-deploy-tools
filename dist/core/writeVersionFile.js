"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fileUtil = __importStar(require("../util/fileUtil"));
const path_1 = __importDefault(require("path"));
function writeVersionFile(destinationPath) {
    const packageFile = fileUtil.readFile(path_1.default.join(process.cwd(), 'package.json'));
    const packageObj = JSON.parse(packageFile);
    let version = null;
    if (packageObj && packageObj.version) {
        version = packageObj.version;
    }
    fileUtil.writeFile(path_1.default.join(process.cwd(), destinationPath, 'version.json'), JSON.stringify({ version }, null, 2));
}
exports.writeVersionFile = writeVersionFile;
