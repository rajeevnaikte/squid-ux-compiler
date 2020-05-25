import { BaseError } from 'squid-utils';

export class NameMissing extends BaseError {
  constructor (uxFilePath: string) {
    super('MISSING_NAME', `${uxFilePath} doesn't contain name. Beginning should be `
      + `'name: <some unique name for this component>;' (semi-colon is important)`);
  }
}

export class MultipleStyles extends BaseError {
  constructor (uxFilePath: string) {
    super('MULTI_STYLE', `${uxFilePath} has multiple style tags. Expected one style tag and/or another with scoped.`);
  }
}

export class MultipleTemplate extends BaseError {
  constructor (uxFilePath: string) {
    super('MULTI_TEMPLATE', `${uxFilePath} has multiple template tags. Expected all html code to be wrapped in a template tag.`);
  }
}

export class MultipleScript extends BaseError {
  constructor (uxFilePath: string) {
    super('MULTI_SCRIPT', `${uxFilePath} has multiple script tags. Expected only one.`);
  }
}

export class TemplateMissing extends BaseError {
  constructor (uxFilePath: string) {
    super('MISSING_TEMPLATE', `${uxFilePath} has no html for the view. Expected html code wrapped in a template tag.`);
  }
}
