/**
 Builder to generate JS code for browser use.
 */
import { Config } from '../configurations/configuration';
import { Compiler } from './Compiler';
import { writeFile } from 'squid-node-utils';
import { dirname, resolve as pathResolve } from 'path';
import { Stats } from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import * as WebpackDevServer from 'webpack-dev-server';
import webpack = require('webpack');
import HtmlWebpackPlugin = require('html-webpack-plugin');

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
  build () {
    this.runWebpack();
  }

  private buildUXUI () {
    const compiler = new Compiler();

    Config.UXJS_NODE_MODULES.forEach(dir => this.uxjsFilePaths.push(...compiler.compileUX(dir)));
    this.uxjsFilePaths.push(...compiler.compileUX(Config.UX_FILES_DIR));

    const uxui = [
      'import { UX } from \'squid-ui\';',
      ...this.uxjsFilePaths.map(uxjsPath => `UX.add(require('${uxjsPath.replace(/'/g, '\\\'')}'));`)
    ];

    const uxjsIndexFile = `${Config.ROOT_DIR}/${Config.UXUI_DIR}/${Config.UXUI_FILENAME}`;
    writeFile(uxjsIndexFile, uxui.join('\n'));
  }

  private runWebpack () {
    const webpackOptions = {
      entry: {
        uxui: [
          `${Config.ROOT_DIR}/${Config.UXUI_DIR}/uxui.js`,
          Config.APP_ENTRY
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
      plugins: [
        new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
        new HtmlWebpackPlugin({ title: '' })
      ],
      output: {
        filename: '[name].bundle.js',
        path: pathResolve(Config.ROOT_DIR, Config.UXUI_DIR)
      },
      watchOptions: {
        ignored: /node_modules/
      }
    };

    const checkWebpackErrors = (e: Error, stats: Stats) => {
      if (e || stats.hasErrors()) {
        throw stats.toString('minimal');
      }
    };

    if (Config.WATCH) {
      // @ts-ignore
      const webpackCompiler = webpack(Object.assign(webpackOptions, {
        mode: 'development',
        devtool: 'inline-source-map'
      }));

      new WebpackDevServer(webpackCompiler, {
        contentBase: [
          Config.UX_FILES_DIR,
          dirname(Config.APP_ENTRY),
          pathResolve(Config.ROOT_DIR, Config.UXUI_DIR)
        ],
        compress: true,
        open: true,
        before: () => this.buildUXUI()
      })
        .listen(Config.DEV_SERVER_PORT);
    }
    else {
      this.buildUXUI();
      webpack(webpackOptions, checkWebpackErrors);
    }
  }
}
