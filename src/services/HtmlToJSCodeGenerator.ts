import * as cheerio from 'cheerio';
import { TextsBetween } from 'squid-utils';
import { UXCode, UXJSCode } from '../types';
import { getCustomElementName } from '../common/utils';

/**
 * Given html code, generate JS code which will build the html.
 */
export class HtmlToJSCodeGenerator {
  private varCount = 0;
  private variablePattern: TextsBetween | undefined;
  private readonly ux: UXCode;

  constructor (ux: UXCode) {
    this.ux = ux;
  }

  /**
   * Optionally set-up variable pattern to add events for variable in html code.
   * @param variablePattern
   */
  withVariablePattern (variablePattern: TextsBetween) {
    this.variablePattern = variablePattern;
    return this;
  }

  /**
   * Generate JS code to build the given html.
   * @return lines of JS code
   */
  generate (): UXJSCode {
    const name = getCustomElementName(this.ux);
    const style: string[] = [];
    const html: string[] = [];
    const script: string[] = [];
    if (this.ux.style) style.push(...this.htmlToJSCode(`<style>${this.addIdToStyle(this.ux.style)}</style>`));

    for (const variable of this.ux.variables ?? []) {
      if (variable === 'id') continue;
      html.push(`this.onDataUpdate['${variable}'] = [];`);
    }
    html.push(...this.htmlToJSCode(this.ux.html));

    if (this.ux.script) script.push(this.ux.script);

    return { name, style, html, script };
  }

  private stylePattern = new TextsBetween.Builder('{', '}').withNestedAllowed().build();

  /**
   * Add the id variable as class to every style.
   * @param style
   */
  private addIdToStyle (style: string): string {
    style = style.replace(/[\[\]]/g, match => `\\${match}`);
    return this.stylePattern.parse(style).split()
      .map(part => {
        if (typeof part === 'string') {
          return part.split(',')
            .map(sr => sr.trim())
            .filter(sr => sr.length > 0)
            .map(styleRef => styleRef.split(' ')
              .map(sr => sr.trim())
              .filter(sr => sr.length > 0)
              .map(sr => {
                if (['*', '>', '+'].includes(sr)) return sr;
                return `${sr}.[id]`;
              })
              .join(' '))
            .join(', ');
        }
        else {
          return part.text;
        }
      })
      .join('');
  }

  /**
   * Process text content of the html so that it can be placed in JS code (string form) as valid string.
   * @param text
   */
  private codifyText (text: string) {
    return `'${text.replace(/'/g, '\\\'').replace(/\n/g, ' ')}'`;
  }

  /**
   * Code to add given text in a text-node. The code will be generated such that to
   * resolve any variables to be taken dynamically.
   * @param text
   */
  private getTextCreationCode (text: string) {
    if (this.variablePattern) {
      text = this.variablePattern.parse(text).split()
        .map(item => {
          if (typeof item === 'string') {
            return this.codifyText(item);
          }
          return `this.getData(${this.codifyText(item.textBetween)})`;
        })
        .join(' + ');
    }
    return text;
  }

  /**
   * Given html code a string, returns JS code lines to build the html layout.
   * @param html
   */
  private htmlToJSCode (html: string): string[] {
    const codeLines: string[] = [];
    const elVars: (string | undefined)[] = [];
    const $: CheerioStatic = cheerio.load(html, {
      decodeEntities: false
    });

    $('head > *').each((idx, el) => elVars.push(this.traverseHtmlAndGetJSCode(el, codeLines)));
    $('body > *').each((idx, el) => elVars.push(this.traverseHtmlAndGetJSCode(el, codeLines)));

    codeLines.push(`return [${elVars.join()}];`);

    return codeLines;
  }

  /**
   * Traverse html tree and return JS lines of code to build the html.
   * @param el
   * @param codeLines
   */
  private traverseHtmlAndGetJSCode (el: CheerioElement, codeLines: string[] = []): string | undefined {
    const childVars: string[] = [];
    el.children?.forEach(childEl => {
      const childVar = this.traverseHtmlAndGetJSCode(childEl, codeLines);
      if (childVar) childVars.push(childVar);
    });

    const elVar = `el${this.varCount++}`;
    if (el.type === 'text') {
      const text = el.data?.trim() ?? '';

      if (text.length === 0) return undefined;

      const textCode = this.getTextCreationCode(text);
      codeLines.push(`const ${elVar} = document.createTextNode(${textCode});`);
      for (const variable of this.variablePattern?.parse(text).get() ?? []) {
        if (variable !== 'id' && !variable.startsWith('i18n')) {
          codeLines.push(`this.onDataUpdate['${variable}'].push(() => ${elVar}.nodeValue = ${textCode});`);
        }
      }
    }
    else {
      cheerio(el).addClass('[id]');
      codeLines.push(`const ${elVar} = document.createElement('${el.name}');`);
      for (const attr in el.attribs) {
        const attrValue = el.attribs[attr];
        const textCode = this.getTextCreationCode(attrValue);
        codeLines.push(`${elVar}.setAttribute('${attr}', ${textCode});`);
        for (const variable of this.variablePattern?.parse(attrValue).get() ?? []) {
          if (variable !== 'id' && !variable.startsWith('i18n')) {
            codeLines.push(`this.onDataUpdate['${variable}'].push(() => ${elVar}.setAttribute('${attr}', ${textCode}));`);
          }
        }
      }
      for (const childVar of childVars) {
        codeLines.push(`${elVar}.appendChild(${childVar});`);
      }
    }

    return elVar;
  }
}