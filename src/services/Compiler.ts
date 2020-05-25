import { resolve as pathResolve } from 'path';
import { BaseError, TextsBetween } from 'squid-utils';
import { MultipleScript, MultipleStyles, MultipleTemplate, NameMissing, TemplateMissing } from './errors';
import * as cheerio from 'cheerio';
import { UXCode } from '../types';
import { Config } from '../configurations/configuration';
import { JSDOM } from 'jsdom';
import { uniq } from 'lodash';
import { HtmlToJSCodeGenerator } from './HtmlToJSCodeGenerator';
import { js as beautify } from 'js-beautify';
import { getCustomElementName } from '../common/utils';
import { readFile, walkDirTree, writeFile } from 'squid-node-utils';

/**
 * Compiler for UX html code.
 */
export class Compiler {
  private readonly variablePattern = new TextsBetween.Builder('[', ']').withNestedAllowed().build();

  /**
   * Compile the .ux file(s).
   * @param uxDir
   */
  compileUX (uxDir: string): string[] {
    return walkDirTree(uxDir, {
      fileNameMatcher: new RegExp(`[.]${Config.UX_FILE_EXTN}$`, 'g'),
      recursive: true
    })
      .map(uxFilePath => {
        try {
          return this.compile(uxFilePath);
        } catch (e) {
          console.error(e.map((err: BaseError) => err.message));
        }
      })
      .filter(uxjs => uxjs) as string[];
  }

  /**
   * Compile a single .ux file and create custom element.
   * @param uxFilePath
   */
  compile (uxFilePath: string): string {
    const uxCode = this.parse(uxFilePath);
    const uxjsCode = new HtmlToJSCodeGenerator(uxCode)
      .withVariablePattern(this.variablePattern)
      .generate();

    const template = this.getUXJSTemplate();
    const customElementName = getCustomElementName(uxCode);

    const componentCode = this.variablePattern.parse(template).replace(key => {
      const value = uxjsCode[key];
      if (Array.isArray(value)) {
        return value.join('\n');
      }
      else {
        return value;
      }
    });

    // Validate the ux component code.
    new JSDOM(`<body>
        <script>
          const i18n = { translate: () => '' };
          window.ux = {};
          const module = {};
        </script>
        <script>${componentCode}</script>
        <${customElementName}></${customElementName}>
      </body>`, { runScripts: 'dangerously' });

    const uxComponentClassFilePath = `${Config.ROOT_DIR}/${Config.UXUI_DIR}/${Config.UXJS_FILE_EXTN}/${customElementName}.${Config.UXJS_FILE_EXTN}`;
    writeFile(uxComponentClassFilePath, beautify(componentCode, { indent_size: 2 })); // eslint-disable-line @typescript-eslint/camelcase

    return pathResolve(uxComponentClassFilePath);
  }

  /**
   * Parse and extract component ux code parts.
   */
  private parse (uxFilePath: string): UXCode {
    const uxCode = readFile(uxFilePath);
    const errors: BaseError[] = [];

    // extract name
    let nameEndIdx = uxCode.indexOf(';');
    if (!uxCode.substring(0, nameEndIdx).match(/^name: [^<]+$/g)) {
      errors.push(new NameMissing(uxFilePath));
      nameEndIdx = -1;
    }
    const name = uxCode.substring('name: '.length, nameEndIdx).trim().replace(/(\/|\\)+/g, '.');
    if (name.length === 0) {
      errors.push(new NameMissing(uxFilePath));
    }

    const $: CheerioStatic = cheerio.load(uxCode.substr(nameEndIdx + 1), {
      decodeEntities: false
    });

    // extract style
    let style: any;
    const styleEl = $('style');
    if (styleEl.length > 0) {
      if (styleEl.length > 2) {
        errors.push(new MultipleStyles(uxFilePath));
      }
      const style1 = $(styleEl[0]).html()?.trim();
      style = {};
      if (styleEl[0].attribs.scoped === '') {
        style.scoped = style1;
      }
      else {
        style.unscoped = style1;
      }
      if (styleEl.length > 1) {
        const style2 = $(styleEl[1]).html()?.trim();
        if (styleEl[1].attribs.scoped === '') {
          if (style.scoped) {
            errors.push(new MultipleStyles(uxFilePath));
          }
          style.scoped = style2;
        }
        else {
          if (style.unscoped) {
            errors.push(new MultipleStyles(uxFilePath));
          }
          style.unscoped = style2;
        }
      }
      styleEl.remove();
    }

    // extract script
    const scriptEl = $('script');
    if (scriptEl.length > 1) {
      errors.push(new MultipleScript(uxFilePath));
    }
    const script = scriptEl.html()?.trim() ?? undefined;
    scriptEl.remove();

    // extract html
    const templateEl = $('template');
    if (templateEl.length > 1) {
      errors.push(new MultipleTemplate(uxFilePath));
    }
    else if (templateEl.length !== 1) {
      errors.push(new TemplateMissing(uxFilePath));
    }
    const html = templateEl.html()?.trim() ?? '';

    if (errors.length > 0) {
      throw errors;
    }

    const allVariables = uniq(this.variablePattern.parse(html).get());
    return {
      name,
      style,
      html,
      variables: allVariables.filter(variable => !variable.startsWith('i18n:')),
      i18ns: allVariables.filter(variable => variable.startsWith('i18n:')),
      script
    };
  }

  /**
   * Get template for uxjs code.
   */
  private getUXJSTemplate (): string {
    return `
      module.exports = {
       name: '[name]',
       style () {
          [style]
       },
       html () {
          [html]
       },
       script () {
          [script]
       }
      };
    `;
  }
}
