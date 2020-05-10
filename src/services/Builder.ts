/**
 Builder to generate JS code for browser use.
 */
import { Config } from '../configurations/configuration';
import { Compiler } from './Compiler';
import { writeFile } from 'squid-node-utils';
import { TextsBetween } from 'squid-utils';

export class Builder {
  private readonly variablePattern = new TextsBetween('[', ']');

  buildUXJS () {
    const compiler = new Compiler();
    const uxjsFilePaths: string[] = [];

    Config.UXJS_NODE_MODULES.forEach(dir => uxjsFilePaths.push(...compiler.compileUX(dir)));
    uxjsFilePaths.push(...compiler.compileUX(Config.UX_FILES_DIR));

    const uxui = [
      'import { UX } from \'squid-ui\';',
      ...uxjsFilePaths.map(uxjsPath => `UX.add(require('${uxjsPath}'));`)
    ];

    writeFile(`${Config.ROOT_DIR}/${Config.UXUI_DIR}/${Config.UXUI_FILENAME}`, uxui.join('\n'));
  }
}
