import * as core from './core/updateReleaseVersion';



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
