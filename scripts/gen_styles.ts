import {promises as fs} from 'fs'
import json_stringify from 'json-stable-stringify'
import * as commons from './commons'
import * as styles from './styles'

const style_module_prefix = 'csl-style-'

const markdown_readme_content = [
    '= CSL styles',
    '',
    'This module is part of the embedding modules for [CSL Project](https://citationstyles.org/) styles hosted at https://github.com/Ayowel/csl-support-js.',
    'Consult the base repository for usage instructions.',
    ''
].join('\n')

/**
 * Create the package file for a specific locale
 * @param target_file The path to the package.json file to create
 * @param style_info The locale of the dialect for which the package should be created
 * @param name The module's name
 * @param increment_version Whether the version should be incremented if the package already exists
 */
async function create_update_style_project_package(target_file: string, style_info: {[key: string]: any}, name: string, increment_version = false) {
    const prototype = {...commons.base_project_package}
    prototype['name'] = `${name}`
    prototype['keywords'] = [...prototype['keywords'], "csl-style"]
    prototype['description'] = `CSL style for ${style_info.title}`
    const current_package = await fs.readFile(target_file, {encoding: 'utf8'}).catch(() => '')
    if (current_package) {
        const package_data = JSON.parse(current_package)
        const version_segments = package_data['version'].split('.')
        if (increment_version) {
            version_segments[2] = `${parseInt(version_segments[2])+1}`
        }
        prototype['version'] = version_segments.join('.')
    }
    const package_content = json_stringify(prototype, {space: 2})
    await fs.writeFile(target_file, package_content , {encoding: 'utf8'})
}

/**
 * Update an individual style projects
 * @param target_parent_dir The directory in which the locale's project should be created
 * @param style_info CSL dialect name
 */
async function create_update_style_project(target_parent_dir: string, style_info: {[key: string]: any}) {
    const module_name = `@citation/${style_module_prefix}${style_info.short_id}`
    const new_info_file = json_stringify(style_info)
    const new_impl = styles.get_simple_main(module_name)

    await fs.mkdir(target_parent_dir).catch((r) => {if(r.errno!=-17){throw r}})
    await commons.update_file(`${target_parent_dir}/README.md`, markdown_readme_content)
    await commons.update_file(`${target_parent_dir}/LICENSE.md`, commons.license)
    let is_updated = await commons.update_file(`${target_parent_dir}/index.js`, new_impl[0]) |
                        await commons.update_file(`${target_parent_dir}/index.mjs`, new_impl[1]) |
                        await commons.update_file(`${target_parent_dir}/index.d.ts`, new_impl[2]) |
                        await commons.update_file(`${target_parent_dir}/info.json`, new_info_file)
    await create_update_style_project_package(`${target_parent_dir}/package.json`, style_info, module_name, Boolean(is_updated))
}

/**
 * Updates the information in the module that contains all styles
 * @param target_parent_dir The directory that contains the module to update
 * @param style_map The styles to save in the module
 */
async function create_update_all_styles_project(target_parent_dir: string, style_map: {[key: string]: styles.StyleInfo}) {
    const package_file_path = `${target_parent_dir}/package.json`
    const current_package = await fs.readFile(package_file_path, {encoding: 'utf8'}).then((c) => JSON.parse(c))
    await commons.update_file(`${target_parent_dir}/README.md`, markdown_readme_content)
    await commons.update_file(`${target_parent_dir}/LICENSE.md`, commons.license)
    const is_updated = await commons.update_file(`${target_parent_dir}/info.json`, json_stringify(style_map))
    if (is_updated) {
        const split_version = current_package['version'].split('.')
        split_version[2] = `${parseInt(split_version[2])+1}`
        current_package['version'] = split_version.join('.')
        await fs.writeFile(package_file_path, json_stringify(current_package, {space: 2}), {encoding: 'utf8'})
    }
}

/**
 * Update all style projects
 * @param target_parent_dir The base directory that contains all individual style projects
 * @param styles_dir The directory that contains the csl styles repository
 */
async function update_style_projects(target_parent_dir: string, styles_dir: string) {
    console.log("Scanning directories for styles")
    const renames_info = JSON.parse(await fs.readFile(`${styles_dir}/renamed-styles.json`, {encoding: 'utf8'}))
    const oldnames_info: {[key: string]: string[]} = Object.keys(renames_info).reduce((p, k) => {
        if (renames_info[k] in p) p[renames_info[k]].push(k)
        else p[renames_info[k]] = [k]
        return p
    }, {})
    /**
     * Get the content of a style file
     * @param file_path The path to the style's XML file
     * @return 
     */
    async function base_extractor(file_path: string): Promise<styles.StyleInfo> {
        const file_content = await fs.readFile(file_path, {encoding: 'utf8'})
        const info = styles.extract_style_info(file_content)
        const shortname = info.short_id
        if (shortname in oldnames_info) {
            info.old_names = oldnames_info[shortname]
        }
        return info
    }
    /**
     * Update a style's module and return the style
     * @param style_promise The style's information
     * @returns The style's information
     */
    async function module_updater (style_promise: Promise<styles.StyleInfo>): Promise<styles.StyleInfo> {
        const style = await style_promise
        await create_update_style_project(`${target_parent_dir}/styles/${style_module_prefix}${style.short_id}`, style)
        return style
    }
    /**
     * Helper function to use with {@link Array.reduce} on an array of {@link styles.StyleInfo} to obtain a style index
     * @param p A map of {@link styles.StyleInfo}
     * @param v A {@link styles.StyleInfo}
     * @returns A map of {@link styles.StyleInfo}
     */
    function style_accumulator(p: {[key: string]: styles.StyleInfo}, v: styles.StyleInfo) {
        if (v.short_id in p) {
            throw `Style declaration is present more that once for ${v.short_id}`
        }
        p[v.short_id] = v
        return p
    }

    await fs.mkdir(`${target_parent_dir}/styles/`).catch((r) => {if(r.errno!=-17){throw r}})

    console.log("Reading dependent style files and updating corresponding modules")
    const dependent_style_files = (await Promise.all(
        (await fs.readdir(`${styles_dir}/dependent`))
            .filter((f) => f.endsWith('.csl'))
            .map((f) => `${styles_dir}/dependent/${f}`).map(base_extractor)
            .map(module_updater)
    )).reduce(style_accumulator, {})

    console.log("Reading independent style files and updating corresponding modules")
    const all_style_files = (await Promise.all(
        (await fs.readdir(styles_dir))
        .filter((f) => f.endsWith('.csl'))
        .map((f) => `${styles_dir}/${f}`)
        .map(base_extractor)
        .map(module_updater)
    )).reduce(style_accumulator, dependent_style_files)

    console.log("Updating global styles index")
    await create_update_all_styles_project(`${target_parent_dir}/${style_module_prefix}all`, all_style_files)
}

update_style_projects(`${__dirname}/../packages`, `${__dirname}/../styles`)
