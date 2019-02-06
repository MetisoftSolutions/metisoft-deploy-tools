# metisoft-deploy-tools

## Update private dependency versions
If your repo's `package.json` has references to private repositories, run this script to update each of those repo references to
whatever the latest release version is.

```
Usage: node ./node_modules/metisoft-deploy-tools/dist/updatePrivateDependencyVersions.js <githubApiKey> <packageName1> [<packageName2> [... [<packageNameN>]]]");

<packageNameI> is a key in the dependencies object of package.json.
Example: recruitchute-server-api-interfaces
```
  
## Update release version
If your `package.json` has a version update suggestion, this script will perform the update and add the release/tag to github.

For instance, if `"version": "1.9.16-update-minor"`, running this script will change it to `"version": "1.10.0"`, and will add
a new release `v1.10.0` to the github repo.

```
Usage: node ./node_modules/metisoft-deploy-tools/dist/updateReleaseVersion.js <repoPath> <githubApiKey>

<repoPath> is formatted as: <organizationOrUsername>/<repo>
Example: MetisoftSolutions/recruitchute-server-api-interfaces
```
