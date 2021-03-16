import { exec } from 'child_process';



function __printOutputFromProcess(chunk: any) {
  process.stdout.write(chunk.toString());
}



export function runCommand(fullCommand: string) {
  return new Promise<void>((resolve, reject) => {
    console.log(`\n*** Running command: ${fullCommand}`);
    const process = exec(fullCommand);
    if (process.stdout && process.stderr) {
      process.stdout.on('data', __printOutputFromProcess);
      process.stderr.on('data', __printOutputFromProcess);
      process.on('exit', code => {
        if (code === 0) {
          resolve();
  
        } else {
          console.error(`*** ERROR while running command: ${fullCommand}`);
          reject();
        }
      });

    } else {
      console.error(`*** ERROR could not get process stdout/stderr while running command: ${fullCommand}`);
      reject();
    }
  });
}
