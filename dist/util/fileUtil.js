"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
function copyFile(inFileName, outFileName) {
    const readStream = fs_1.default.createReadStream(inFileName);
    const writeStream = fs_1.default.createWriteStream(outFileName);
    return new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        readStream.pipe(writeStream);
    });
}
exports.copyFile = copyFile;
function readFile(fileName) {
    return fs_1.default.readFileSync(fileName, 'utf8');
}
exports.readFile = readFile;
function writeFile(fileName, contents) {
    fs_1.default.writeFileSync(fileName, contents, 'utf8');
}
exports.writeFile = writeFile;
