/**
 Builder to generate JS code for browser use.
 */
import { Config } from '../configurations/configuration';
import { Compiler } from './Compiler';
import { writeFile } from 'squid-node-utils';
import { TextsBetween } from 'squid-utils';
import { resolve as pathResolve } from 'path';
import webpack = require('webpack');
import { Stats } from 'webpack';

export class Builder {
  private readonly variablePattern = new TextsBetween('[', ']');

  buildUXUI () {
    const compiler = new Compiler();
    const uxjsFilePaths: string[] = [];

    Config.UXJS_NODE_MODULES.forEach(dir => uxjsFilePaths.push(...compiler.compileUX(dir)));
    uxjsFilePaths.push(...compiler.compileUX(Config.UX_FILES_DIR));

    const uxui = [
      'import { UX } from \'squid-ui\';',
      ...uxjsFilePaths.map(uxjsPath => `UX.add(require('${uxjsPath.replace(/'/g, '\\\'')}'));`)
    ];

    writeFile(`${Config.ROOT_DIR}/${Config.UXUI_DIR}/${Config.UXUI_FILENAME}`, uxui.join('\n'));

    this.runWebpack(Config.APP_ENTRY);
  }

  private runWebpack (appEntryPath: string) {
    const webpackCompiler = webpack({
      entry: {
        uxui: [
          `${Config.ROOT_DIR}/.uxui/uxui.js`,
          appEntryPath
        ]
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
      output: {
        filename: '[name].bundle.js',
        path: pathResolve(`${Config.ROOT_DIR}/.uxui`)
      }
    });

    const checkWebpackErrors = (e: Error, stats: Stats) => {
      if (e || stats.hasErrors()) {
        throw stats.toString('minimal');
      }
    };

    if (JSON.parse(Config.WATCH as any)) {
      webpackCompiler.watch({}, checkWebpackErrors);
    }
    else {
      webpackCompiler.run(checkWebpackErrors);
    }
  }
}
