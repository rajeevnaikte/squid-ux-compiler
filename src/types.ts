/**
 * Sections in .ux file.
 */
export type UXCode = {
  [key: string]: any;
  /**
   * UX component name. Must be unique.
   */
  name: string;
  /**
   * CSS for the component (it will be scoped with shadow dom).
   */
  style?: {
    unscoped?: string;
    scoped?: string;
  };
  /**
   * Layout of the component.
   */
  html: string;
  /**
   * Variables in the html code.
   */
  variables: string[];
  /**
   * Translations requirements.
   */
  i18ns: string[];
  /**
   * JavaScript code to perform UX related changes, such as, resize etc.
   */
  script?: string;
}

/**
 * JS code to build the ux.
 * List of lines of JS code.
 */
export type UXJSCode = {
  [key: string]: string | string[];
  name: string;
  style: string[];
  html: string[];
  script: string[];
};