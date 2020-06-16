import { Compiler } from '../Compiler';
import { MultipleStyles, MultipleTemplate, NameMissing } from '../errors';
import { pathExists, readFile } from 'squid-node-utils';
import { Config, setConfigs } from '../../configurations/configuration';
import { js as beautify } from 'js-beautify';
import { UXExists } from 'squid-ui/dist/exceptions/errors';
import { BaseError } from 'squid-utils';

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
        new NameMissing(uxFile),
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
        name: 'form.field.valid',
        style: {
          scoped: `.form-group {
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
  .some-class.some-class2, .some-class.some-class3,
  .some-class.some-class4 {
    border: 1px solid red;
  }

  div > * {
    padding: 1px;
  }`
        },
        html: `<div class="form-group">
  <label for="[exampleInputEmail1]">[i18n:Email address]</label>
  test
  <input aria-describedby="emailHelp" class="form-control" id="[exampleInputEmail1]" placeholder="[i18n:Enter email]" type="email"/>
  test2<br/>
  <small class="form-text text-muted" id="emailHelp">[i18n:We'll never share your email with anyone else.]</small>
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
        name: 'form.field.no-style',
        html: '<div class="form-group">\n' +
          '  <label for="[exampleInputEmail1]">[i18n:Email address]</label>\n' +
          '  <input aria-describedby="emailHelp" class="form-control" id="[exampleInputEmail1]" placeholder="[i18n:Enter email]" type="email"/>\n' +
          '  <small class="form-text text-muted" id="emailHelp">[i18n:We\'ll never share your email with anyone else.]</small>\n' +
          '</div>',
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
      expect(beautify(actual)).toEqual(beautify(readFile(`${__dirname}/expected/form-field-valid.js`)));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const uxjs = require(outPath);
      expect(uxjs.name).toEqual('form-field-valid');
    });

    test('scoped style', () => {
      const compiler = new Compiler();
      const uxFile = `${__dirname}/data/scoped-style.ux`;

      expect(beautify(readFile(
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        compiler.compile(uxFile)
      ))).toEqual(beautify(readFile(`${__dirname}/expected/style-scoped.js`)));
    });

    test('table', () => {
      const compiler = new Compiler();
      const uxFile = `${__dirname}/data/table.ux`;

      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const tableUxjs = compiler.compile(uxFile);

      const outPath = `${__dirname}/${Config.UXUI_DIR}/${Config.UXJS_FILE_EXTN}/table.uxjs`;
      expect(pathExists(outPath)).toEqual(true);

      expect(beautify(readFile(tableUxjs))).toEqual(beautify(readFile(`${__dirname}/expected/table.js`)));
    });

    test('UX already exists error', () => {
      const compiler = new Compiler();
      const uxFile = `${__dirname}/data/table.ux`;

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        compiler.compile(uxFile);
      }).toThrow(new UXExists('table'));
    });

    test('Multiple items ref error', () => {
      const compiler = new Compiler();
      const uxFile = `${__dirname}/data/invalid-table.ux`;

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        compiler.compile(uxFile);
      }).toThrow(new BaseError('MULTIPLE_ITEMS_TAGS', 'Multiple items tag for ref columns found in UX invalid-table.'));
    });
  });
});
