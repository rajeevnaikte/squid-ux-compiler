/**
 Builder to generate JS code for browser use.
 */
import { Config } from '../configurations/configuration';
import { Compiler } from './Compiler';
import { writeFile } from 'squid-node-utils';
import { TextsBetween } from 'squid-utils';
import { resolve as pathResolve } from 'path';
import webpack = require('webpack');

export class Builder {
  private readonly variablePattern = new TextsBetween('[', ']');

  buildUXUI (appEntryPath: string) {
    const compiler = new Compiler();
    const uxjsFilePaths: string[] = [];

    Config.UXJS_NODE_MODULES.forEach(dir => uxjsFilePaths.push(...compiler.compileUX(dir)));
    uxjsFilePaths.push(...compiler.compileUX(Config.UX_FILES_DIR));

    const uxui = [
      'import { UX } from \'squid-ui\';',
      ...uxjsFilePaths.map(uxjsPath => `UX.add(require('${uxjsPath.replace(/'/g, '\\\'')}'));`)
    ];

    writeFile(`${Config.ROOT_DIR}/${Config.UXUI_DIR}/${Config.UXUI_FILENAME}`, uxui.join('\n'));

    this.runWebpack(appEntryPath);
  }

  private runWebpack (appEntryPath: string) {
    const webpackCompiler = webpack({
      entry: {
        ux: './.uxui/uxui.js',
        ui: appEntryPath
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
          }
        ]
      },
      resolve: {
        extensions: ['.tsx', '.ts', '.js']
      },
      output: {
        filename: 'uxui.bundle.js',
        path: pathResolve('.uxui')
      }
    });

    if (Config.ENV === 'dev') {
      webpackCompiler.watch({},
        (e) => {
          if (e) console.error(e);
        });
    }
    else {
      webpackCompiler.run((e) => {
        if (e) console.error(e);
      });
    }
  }
}
