import * as core from './core/updatePrivateDependencyVersions';



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
