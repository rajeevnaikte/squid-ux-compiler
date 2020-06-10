/**
 Builder to generate JS code for browser use.
 */
import { watch as fsWatch } from 'fs';
import { Config } from '../configurations/configuration';
import { Compiler } from './Compiler';
import { pathExists, writeFile } from 'squid-node-utils';
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
  private readonly compiler = new Compiler();
  private readonly uxjsFilePaths: string[] = [];

  /**
   * Compiles UX files and app javascript/typescript code.
   * Then builds UXUI webpacked code.
   * UX files are searched in directory as set in env variable `UX_FILES_DIR`.
   * App javascript/typescript code start point will be as set in env variable `APP_ENTRY`.
   */
  build () {
    this.buildUXUI();
    this.runWebpack();
  }

  /**
   * Compile UX files into JS code.
   */
  private buildUXUI () {
    this.uxjsFilePaths.splice(0, this.uxjsFilePaths.length);

    Config.UXJS_NODE_MODULES.forEach(dir => this.uxjsFilePaths.push(...this.compiler.compileUX(dir)));
    this.uxjsFilePaths.push(...this.compiler.compileUX(Config.UX_FILES_DIR));

    const uxui = [
      `import { UX } from \'${Config.UI_MODULE_NAME}\';`,
      ...this.uxjsFilePaths.map(uxjsPath => `UX.add(require('${uxjsPath.replace(/'/g, '\\\'')}'));`)
    ];

    const uxjsIndexFile = `${Config.ROOT_DIR}/${Config.UXUI_DIR}/${Config.UXUI_FILENAME}`;
    writeFile(uxjsIndexFile, uxui.join('\n'));
  }

  /**
   * Configure webpack and build/serve.
   */
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
      // without this import statements with no extension will not be resolved
      resolve: {
        extensions: ['.tsx', '.ts', '.js', '.uxjs']
      },
      plugins: [
        // to delete the temp build files
        new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
        // to generate the index.html
        new HtmlWebpackPlugin({ title: '' })
      ],
      output: {
        filename: '[name].bundle.js',
        // out dir cannot be same as .uxui, because the webpack deletes it
        path: pathResolve(Config.ROOT_DIR, 'dist')
      },
      watchOptions: {
        ignored: /node_modules/
      }
    };

    const webpackConfigJSFilePath = pathResolve('./webpack.config.js');
    console.log(`checking if user webpack config exists at ${webpackConfigJSFilePath}`);
    if (pathExists(webpackConfigJSFilePath)) {
      const userWebpackConfig = import(webpackConfigJSFilePath) as any;
      delete userWebpackConfig.entry;
      userWebpackConfig.resolve?.extensions?.push('.uxjs', '.js');
      delete userWebpackConfig.output;

      Object.assign(webpackOptions, userWebpackConfig);
    }

    // on webpack error log the message
    const checkWebpackErrors = (e: Error, stats: Stats) => {
      if (e || stats.hasErrors()) {
        throw stats.toString('minimal');
      }
    };

    if (Config.WATCH) {
      // add watcher to .ux files dir
      const watcher = fsWatch(Config.UX_FILES_DIR, { recursive: true })
        .on('change', (eventType, fileName) => {
          this.buildUXUI();
        });

      // @ts-ignore
      const webpackCompiler = webpack(Object.assign(webpackOptions, {
        mode: 'development',
        devtool: 'inline-source-map'
      }));

      const devServer = new WebpackDevServer(webpackCompiler, {
        // source files will the dir of the app entry file and .uxui dir
        contentBase: [
          dirname(Config.APP_ENTRY),
          pathResolve(Config.ROOT_DIR, Config.UXUI_DIR)
        ],
        compress: true,
        open: true,
        hot: true
      })
        .listen(Config.DEV_SERVER_PORT);

      // close all on exit
      process.on('SIGHUP', () => {
        devServer.close();
        watcher.close();
      });
    }
    else {
      webpack(webpackOptions, checkWebpackErrors);
    }
  }
}
