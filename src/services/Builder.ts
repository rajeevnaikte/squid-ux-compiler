/**
 Builder to generate JS code for browser use.
 */
import { Config } from '../configurations/configuration';
import { Compiler } from './Compiler';

export class Builder {
  buildUXJS () {
    const compiler = new Compiler();
    const uxjsFilePaths: string[] = [`${__dirname}/../ui/ui.js`];

    Config.UXJS_NODE_MODULES.forEach(dir => uxjsFilePaths.push(...compiler.compileUX(dir)));
    uxjsFilePaths.push(...compiler.compileUX(Config.UX_FILES_DIR));


  }
}
