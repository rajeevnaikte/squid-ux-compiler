#!/usr/bin/env node

import { Builder } from './services/Builder';
import { Config } from './configurations/configuration';

new Builder().buildUXUI(process.argv[2] ?? Config.APP_ENTRY);
