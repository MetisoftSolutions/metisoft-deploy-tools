import * as configUtil from './util/configUtil';
import * as core from './core/buildAndPushDocker';



function main() {
  const config = configUtil.getConfig();
  let envName = '';

  if (process.argv.length < 3) {
    console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/buildAndPushDocker.js <envName>");
    return;
  }

  envName = process.argv[2];
  const envSettings = config.envName2Settings[envName];
  if (!envSettings) {
    throw new Error(`No settings for environment ${envName}.`);
  }

  return core.buildAndPushDocker(config, envName);
}
main();
