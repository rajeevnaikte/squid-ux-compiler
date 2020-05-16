/**
 Builder to generate JS code for browser use.
 */
import { Config } from '../configurations/configuration';
import { Compiler } from './Compiler';
import { deletePath, writeFile } from 'squid-node-utils';
import { resolve as pathResolve } from 'path';
import { Stats } from 'webpack';
import webpack = require('webpack');

/**
 * UXUI builder.
 */
export class Builder {
  private readonly uxjsFilePaths: string[] = [];

  /**
   * Compiles UX files and app javascript/typescript code.
   * Then builds UXUI webpacked code.
   * UX files are searched in directory as set in env variable `UX_FILES_DIR`.
   * App javascript/typescript code start point will be as set in env variable `APP_ENTRY`.
   */
  buildUXUI () {
    const compiler = new Compiler();

    Config.UXJS_NODE_MODULES.forEach(dir => this.uxjsFilePaths.push(...compiler.compileUX(dir)));
    this.uxjsFilePaths.push(...compiler.compileUX(Config.UX_FILES_DIR));

    const uxui = [
      'import { UX } from \'squid-ui\';',
      ...this.uxjsFilePaths.map(uxjsPath => `UX.add(require('${uxjsPath.replace(/'/g, '\\\'')}'));`)
    ];

    const uxjsIndexFile = `${Config.ROOT_DIR}/${Config.UXUI_DIR}/${Config.UXUI_FILENAME}`;
    writeFile(uxjsIndexFile, uxui.join('\n'));
    this.uxjsFilePaths.push(uxjsIndexFile);

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
      resolve: {
        extensions: ['.tsx', '.ts', '.js']
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

      if (!Config.WATCH) {
        this.uxjsFilePaths.forEach(deletePath);
      }
    };

    if (Config.WATCH) {
      webpackCompiler.watch({}, checkWebpackErrors);
    }
    else {
      webpackCompiler.run(checkWebpackErrors);
    }
  }
}
