import { basename } from 'path';
import { BaseError, TextsBetween } from 'squid-utils';
import { MultipleScript, MultipleStyles, MultipleTemplate, NamespaceMissing, TemplateMissing } from './errors';
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
  private readonly variablePattern = new TextsBetween('[', ']');

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
          console.error(e);
        }
      })
      .filter(uxjs => uxjs) as string[];
  }

  /**
   * Compile a single .ux file and create custom element.
   * @param uxFilePath
   */
  private compile (uxFilePath: string): string {
    const uxCode = this.parse(uxFilePath);
    const uxjsCode = new HtmlToJSCodeGenerator(uxCode)
      .withVariablePattern(this.variablePattern)
      .generate();

    const template = readFile(`${__dirname}/component.js.template`);
    const customElementName = getCustomElementName(uxCode);

    const componentCode = this.variablePattern.replace(template, key => {
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

    const uxComponentClassFilePath = `${Config.ROOT_DIR}/.uxui/ux/${customElementName}.${Config.UXJS_FILE_EXTN}`;
    writeFile(uxComponentClassFilePath, beautify(componentCode, { indent_size: 2 })); // eslint-disable-line @typescript-eslint/camelcase

    return uxComponentClassFilePath;
  }

  /**
   * Parse and extract component ux code parts.
   * @param uxCode
   */
  private parse (uxFilePath: string): UXCode {
    const uxCode = readFile(uxFilePath);
    const errors: BaseError[] = [];

    // extract namespace
    let nameSpaceEndIdx = uxCode.indexOf(';');
    if (!uxCode.substring(0, nameSpaceEndIdx).match(/^namespace: [^<]+$/g)) {
      errors.push(new NamespaceMissing(uxFilePath));
      nameSpaceEndIdx = -1;
    }
    const namespace = uxCode.substring('namespace: '.length, nameSpaceEndIdx).trim().replace(/(\/|\\)+/g, '.');
    if (namespace.length === 0) {
      errors.push(new NamespaceMissing(uxFilePath));
    }

    const $: CheerioStatic = cheerio.load(uxCode.substr(nameSpaceEndIdx + 1), {
      decodeEntities: false
    });

    // extract style
    const styleEl = $('style');
    if (styleEl.length > 1) {
      errors.push(new MultipleStyles(uxFilePath));
    }
    const style = styleEl.html()?.trim();
    styleEl.remove();

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

    const allVariables = uniq(this.variablePattern.get(html));
    return {
      namespace,
      name: basename(uxFilePath, '.ux'),
      style,
      html,
      variables: allVariables.filter(variable => !variable.startsWith('i18n:')),
      i18ns: allVariables.filter(variable => variable.startsWith('i18n:')),
      script
    };
  }
}
