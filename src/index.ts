#!/usr/bin/env node

import { Builder } from './services/Builder';
import { ArgumentParser } from 'argparse';
import { Config, setConfigs } from './configurations/configuration';
import * as getPort from 'get-port';

const argParser = new ArgumentParser({ addHelp: true, description: 'Build UXUI framework app' });

argParser.addArgument('command', {
  type: 'string',
  choices: ['serve', 'build'],
  help: 'serve - Starts dev server with hot reload.\nbuild - Generates production ready webpacked files.'
});

argParser.addArgument(['-u', '--ux-dir'], {
  type: 'string',
  required: true,
  help: 'Directory containing .ux files.'
});

argParser.addArgument(['-e', '--app-entry'], {
  type: 'string',
  required: true,
  help: 'App entry file (.js | .ts).'
});

argParser.addArgument(['-p', '--dev-port'], {
  type: 'string',
  help: 'Dev server port.'
});

const args = argParser.parseArgs();

const main = async () => {
  setConfigs({
    WATCH: (args.command === 'serve'),
    UX_FILES_DIR: args.ux_dir,
    APP_ENTRY: args.app_entry,
    DEV_SERVER_PORT: await getPort({ port: args.dev_port ?? Config.DEV_SERVER_PORT })
  });

  new Builder().build();
};

main();
