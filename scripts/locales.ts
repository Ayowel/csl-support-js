
/**
 * The JSON object contained in locales.json in the CSL dialect repository
 */
export type LocalesJson = {'primary-dialects': {[key: string]: string|undefined}, 'language-names': {[key: string]: [string, string]}}

/**
 * A Locale's information representation
 */
export type LocaleInfo = {
    common_name: string;
    native_name: string;
    locale: string;
    primary_dialect: string;
    is_primary: boolean;
    content: string;
}
/**
 * Get javascript and mapping code for a locale module
 * @param module_name The name of the locale module
 * @return An array that contains the main, module, and map files' contents
 */
export function get_simple_main(module_name) {
    const js_file = [
        '"use strict";',
        'Object.defineProperty(exports, "__esModule", { value: true });',
        'exports.default = void 0;',
        "var info = require('./info.json');",
        'exports.default = info && info.__esModule ? info.default : info;',
        '',
    ].join('\n')
    const mjs_file = [
        "import info from './info.json';",
        'export default info;',
        '',
    ].join('\n')
    const map_file = [
        `declare module '${module_name}' {`,
        '  const info: {',
        '    common_name: string,',
        '    native_name: string,',
        '    locale: string,',
        '    primary_dialect: boolean,',
        '    content: string,',
        '  }',
        '  export default info',
        '}',
        '',
    ].join('\n')
    return [js_file, mjs_file, map_file]
}

/**
 * Create an information object for a specific locale
 * @param locale_name Locale of the language
 * @param dialect_file Loaded locale's file
 * @param locales_info_map Loaded locales index
 * @returns The Locale's information representation
 */
export function build_locale_content(locale_name: string, dialect_file: string, locales_info_map: LocalesJson): LocaleInfo {
    const primary_dialect = locale_name.substring(0, 2)
    const info = {
        common_name: locales_info_map['language-names'][locale_name][1],
        native_name: locales_info_map['language-names'][locale_name][0],
        locale: locale_name,
        primary_dialect: primary_dialect,
        is_primary: locales_info_map['primary-dialects'][primary_dialect] == locale_name,
        content: dialect_file,
    }
    return info
}
