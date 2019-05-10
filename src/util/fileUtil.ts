import fs from 'fs';



export function copyFile(inFileName: string, outFileName: string) {
  const readStream = fs.createReadStream(inFileName);
  const writeStream = fs.createWriteStream(outFileName);

  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    readStream.pipe(writeStream);
  });
}



export function readFile(fileName: string) {
  return fs.readFileSync(fileName, 'utf8');
}



export function writeFile(fileName: string, contents: string) {
  fs.writeFileSync(fileName, contents, 'utf8');
}
