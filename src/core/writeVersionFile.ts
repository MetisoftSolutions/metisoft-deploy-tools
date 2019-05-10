import * as fileUtil from '../util/fileUtil';
import path from 'path';



export function writeVersionFile(destinationPath: string) {
  const packageFile = fileUtil.readFile(path.join(process.cwd(), 'package.json'));
  const packageObj = JSON.parse(packageFile);

  let version: string | null = null;

  if (packageObj && packageObj.version) {
    version = packageObj.version;
  }

  fileUtil.writeFile(path.join(process.cwd(), destinationPath, 'version.json'), JSON.stringify({version}, null, 2));
}
