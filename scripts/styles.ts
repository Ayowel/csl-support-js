import { XMLParser } from "fast-xml-parser"

/** Representation of a style with some of its information pre-extracted */
export type StyleInfo = {
    title: string,
    title_short?: string,
    id: string,
    short_id: string,
    parent?: string,
    short_parent?: string,
    content: string,
    old_names?: string[]
}

export function extract_style_info(xml_string: string): StyleInfo {
    const xml_data = new XMLParser({'ignoreAttributes': false, 'htmlEntities': true}).parse(xml_string)
    const info = {
        title: xml_data.style.info.title,
        title_short: xml_data.style.info['title-short'],
        id: xml_data.style.info.id,
        short_id: xml_data.style.info.id.split('/').pop(),
        parent: xml_data.style.info.link,
        short_parent: undefined,
        content: xml_string,
    }
    if (info.parent) {
        if (info.parent.filter) { // array
            // Nothing to do
        } else { // dict
            info.parent = [info.parent]
        }
        info.parent = info.parent.filter((n) => n['@_rel'] === 'independent-parent').map((n) => n['@_href'])
    }
    if (info.parent.length > 1) {
        throw `Too many parents for style ${info.id}`
    } else {
        info.parent = info.parent[0]
        if (info.parent) {
            info.short_parent = info.parent.split('/').pop()
        }
    }

    return info
}

/**
 * Get javascript and mapping code for a style module
 * @param module_name The name of the style module
 * @return An array that contains the main, module, and map files' contents
 */
export function get_simple_main(module_name: string): [string, string, string] {
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
        `  const info: {`,
        '    content: string,',
        '    id: string,',
        '    old_names?: string[],',
        '    parent: string,',
        '    short_id: string,',
        '    short_parent: string,',
        '    title: string,',
        '    title_short?: string,',
        '  }',
        '  export default info',
        '}',
        '',
    ].join('\n')
    return [js_file, mjs_file, map_file]
}
