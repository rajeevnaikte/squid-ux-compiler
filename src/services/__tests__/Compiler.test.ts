import { Compiler } from '../Compiler';
import { MultipleStyles, MultipleTemplate, NamespaceMissing } from '../errors';
import { pathExists, readFile } from 'squid-node-utils';
import { Config, setConfigs } from '../../configurations/configuration';

describe('Compiler', () => {
  describe('parse', () => {
    test('invalid code', () => {
      const compiler = new Compiler();
      const uxFile = `${__dirname}/data/invalid.ux`;

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        compiler.parse(uxFile, uxFile);
      }).toThrow([
        new NamespaceMissing(uxFile),
        new MultipleStyles(uxFile),
        new MultipleTemplate(uxFile)
      ].join());
    });

    test('valid code', () => {
      const compiler = new Compiler();
      const uxFile = `${__dirname}/data/valid.ux`;

      expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        compiler.parse(uxFile, uxFile)
      ).toEqual({
        namespace: 'form.field',
        name: 'valid',
        style: `.form-group {
    margin: 10px;
  }
  #ux123 {
    padding: 10px;
  }
  #ux123 .some-class {
    .test {
      color: red;
    }
  }
  .some-class.some-class2,.some-class.some-class3,
  .some-class.some-class4 {
    border: 1px solid red;
  }`,
        html: `<div class="form-group">
    <label for="[exampleInputEmail1]">[i18n:Email address]</label>
    test
    <input type="email" class="form-control" id="[exampleInputEmail1]" aria-describedby="emailHelp" placeholder="[i18n:Enter email]">
    test2<br>
    <small id="emailHelp" class="form-text text-muted">[i18n:We'll never share your email with anyone else.]</small>
  </div>`,
        script: `this.onresize = () => {
    console.log('hello');
  };`,
        variables: [
          'exampleInputEmail1'
        ],
        i18ns: [
          'i18n:Email address',
          'i18n:Enter email',
          'i18n:We\'ll never share your email with anyone else.'
        ]
      });
    });

    test('no style', () => {
      const compiler = new Compiler();
      const uxFile = `${__dirname}/data/no-style.ux`;

      expect(
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        compiler.parse(uxFile, uxFile)
      ).toEqual({
        namespace: 'form.field',
        name: 'no-style',
        html: '<div class="form-group">\n' +
          '    <label for="[exampleInputEmail1]">[i18n:Email address]</label>\n' +
          '    <input type="email" class="form-control" id="[exampleInputEmail1]" aria-describedby="emailHelp" placeholder="[i18n:Enter email]">\n' +
          '    <small id="emailHelp" class="form-text text-muted">[i18n:We\'ll never share your email with anyone else.]</small>\n' +
          '  </div>',
        script: undefined,
        style: undefined,
        variables: [
          'exampleInputEmail1'
        ],
        i18ns: [
          'i18n:Email address',
          'i18n:Enter email',
          'i18n:We\'ll never share your email with anyone else.'
        ]
      });
    });
  });

  describe('compile', () => {
    setConfigs({
      ROOT_DIR: __dirname
    });

    test('valid code', () => {
      const compiler = new Compiler();
      const uxFile = `${__dirname}/data/valid.ux`;

      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      compiler.compile(uxFile);

      const outPath = `${__dirname}/${Config.UXUI_DIR}/${Config.UXJS_FILE_EXTN}/form-field-valid.uxjs`;
      expect(pathExists(outPath)).toEqual(true);

      const actual = readFile(outPath);
      expect(actual).toEqual(readFile(`${__dirname}/expected/form-field-valid.js`));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const uxjs = require(outPath);
      expect(uxjs.name).toEqual('form-field-valid');
    });
  });
});
