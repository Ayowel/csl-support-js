import {promises as fs} from 'fs'
import json_stringify from 'json-stable-stringify'
import * as commons from './commons'
import * as loc from './locales'

const locale_module_prefix = 'csl-locale-'

const markdown_readme_content = [
    '= CSL locales',
    '',
    'This module is part of the embedding modules for [CSL Project](https://citationstyles.org/) locales hosted at https://github.com/Ayowel/csl-support-js.',
    'Consult the base repository for usage instructions.',
    ''
].join('\n')

/**
 * Create the package file for a specific locale
 * @param target_file The path to the package.json file to create
 * @param locale The locale of the dialect for which the package should be created
 * @param name The module's name
 * @param increment_version Whether the version should be incremented if the package already exists
 */
async function create_update_locale_project_package(target_file: string, locale: string, name: string, increment_version = false) {
    const prototype = {...commons.base_project_package}
    prototype['name'] = `${name}`
    prototype['keywords'] = [...prototype['keywords'], "csl-locale"]
    prototype['description'] = `CSL locale for ${locale}`
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
 * 
 * @param target_parent_dir The directory in which the locale's project should be created
 * @param locale_name CSL dialect name
 * @param dialect_source_file Path to the CSL locale's definition file
 * @param locales_info_map The CSL locales.json' content as a JSON object
 */
async function create_update_locale_project(target_parent_dir: string, locale_name: string, dialect_info: string, locales_info_map: loc.LocalesJson) {
    const module_name = `@citation/${locale_module_prefix}${locale_name.toLowerCase()}`
    const new_info_file = json_stringify(loc.build_locale_content(locale_name, dialect_info, locales_info_map))
    const new_impl = loc.get_simple_main(module_name)

    await fs.mkdir(target_parent_dir).catch((r) => {if(r.errno!=-17){throw r}})
    await commons.update_file(`${target_parent_dir}/README.md`, markdown_readme_content)
    await commons.update_file(`${target_parent_dir}/LICENSE.md`, commons.license)
    let is_updated = await commons.update_file(`${target_parent_dir}/index.js`, new_impl[0]) |
                        await commons.update_file(`${target_parent_dir}/index.mjs`, new_impl[1]) |
                        await commons.update_file(`${target_parent_dir}/index.d.ts`, new_impl[2]) |
                        await commons.update_file(`${target_parent_dir}/info.json`, new_info_file)
    await create_update_locale_project_package(`${target_parent_dir}/package.json`, locale_name, module_name, Boolean(is_updated))
}

async function create_update_all_locales_project(all_module_dir, locales_files_map, dialect_index) {
    const package_file_path = `${all_module_dir}/package.json`
    const current_package = await fs.readFile(package_file_path, {encoding: 'utf8'}).then((c) => JSON.parse(c))
    await commons.update_file(`${all_module_dir}/LICENSE.md`, commons.license)
    await commons.update_file(`${all_module_dir}/README.md`, markdown_readme_content)
    const is_updated = await commons.update_file(`${all_module_dir}/content.json`, json_stringify(locales_files_map, {space: 2})) |
                        await commons.update_file(`${all_module_dir}/mappings.json`, json_stringify(dialect_index, {space: 2}))
    if (is_updated) {
        const split_version = current_package['version'].split('.')
        split_version[2] = `${parseInt(split_version[2])+1}`
        current_package['version'] = split_version.join('.')
        await fs.writeFile(package_file_path, json_stringify(current_package, {space: 2}), {encoding: 'utf8'})
    }
}

/**
 * 
 * @param target_parent_dir 
 * @param locales_dir 
 */
async function update_locale_projects(target_parent_dir: string, locales_dir: string) {
    console.log("Scanning directories for locales")
    const locales_info = JSON.parse(await fs.readFile(`${locales_dir}/locales.json`, {encoding: 'utf8'}))
    const file_pattern = /^locales-([a-z]{2}(-[A-Z]{2})?).xml$/
    await fs.mkdir(`${target_parent_dir}/locales`).catch((r) => {if(r.errno!=-17){throw r}})
    const locales_files = (await fs.readdir(locales_dir)).filter((f) => file_pattern.test(f))
    const locales_file_tuple = await Promise.all(locales_files.map(
        async (f) => [
            await fs.readFile(`${locales_dir}/${f}`, {encoding: 'utf8'}),
            f.substring(8, f.length-4)
        ]
    ))
    console.log("Updating all individual locales files")
    await Promise.all(locales_file_tuple.map(async (f) => {
        const dialect_info = f[0]
        const locale_string = f[1]
        await create_update_locale_project(`${target_parent_dir}/locales/${locale_module_prefix}${locale_string}`, locale_string, dialect_info, locales_info)
    }))
    console.log("Updating global locales index")
    const locales_file_map = locales_file_tuple.reduce((p, v) => {p[v[1]] = v[0]; return p}, {})
    await create_update_all_locales_project(`${target_parent_dir}/${locale_module_prefix}all`, locales_file_map, locales_info)
}

update_locale_projects(`${__dirname}/../packages`, `${__dirname}/../locales`)
