"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = void 0;
const child_process_1 = require("child_process");
function __printOutputFromProcess(chunk) {
    process.stdout.write(chunk.toString());
}
function runCommand(fullCommand) {
    return new Promise((resolve, reject) => {
        console.log(`\n*** Running command: ${fullCommand}`);
        const process = child_process_1.exec(fullCommand);
        if (process.stdout && process.stderr) {
            process.stdout.on('data', __printOutputFromProcess);
            process.stderr.on('data', __printOutputFromProcess);
            process.on('exit', code => {
                if (code === 0) {
                    resolve();
                }
                else {
                    console.error(`*** ERROR while running command: ${fullCommand}`);
                    reject();
                }
            });
        }
        else {
            console.error(`*** ERROR could not get process stdout/stderr while running command: ${fullCommand}`);
            reject();
        }
    });
}
exports.runCommand = runCommand;
