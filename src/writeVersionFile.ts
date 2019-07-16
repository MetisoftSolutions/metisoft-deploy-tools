import * as core from './core/writeVersionFile';



function __printUsage() {
  console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/writeVersionFile.js <destinationPath>");
  console.log("Example: node ./node_modules/metisoft-deploy-tools/dist/writeVersionFile.js src/config")
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
