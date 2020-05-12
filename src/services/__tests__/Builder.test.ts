import { Builder } from '../Builder';
import { pathExists, readFile } from 'squid-node-utils';
import { setConfigs } from '../..';
import { Config } from '../../configurations/configuration';

describe('Builder', () => {
  setConfigs({
    ROOT_DIR: __dirname,
    UX_FILES_DIR: `${__dirname}/data`
  });

  test('buildUXJS', () => {
    new Builder().buildUXUI();

    const uxuiJsPath = `${Config.ROOT_DIR}/${Config.UXUI_DIR}/${Config.UXUI_FILENAME}`;
    expect(pathExists(uxuiJsPath)).toEqual(true);
    expect(readFile(uxuiJsPath)).toEqual(readFile(`${__dirname}/expected/uxui.js`));
  });
});
