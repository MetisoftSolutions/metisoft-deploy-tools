import * as core from './core/deleteCognitoUsers';



function __main() {
  if (process.argv.length < 6) {
    console.log("Usage: node ./node_modules/metisoft-deploy-tools/dist/deleteCognitoUsers.js <region> <accessKeyId> <secretAccessKey> <userPoolId>");
    return;
  }

  const [, , region, accessKeyId, secretAccessKey, userPoolId] = process.argv;

  return core.deleteUsers({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    userPoolId
  });
}
__main();
