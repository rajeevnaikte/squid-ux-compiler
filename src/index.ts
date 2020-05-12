#!/usr/bin/env node

import { Builder } from './services/Builder';
import { Config } from './configurations/configuration';

new Builder().buildUXUI(Config.APP_ENTRY);
