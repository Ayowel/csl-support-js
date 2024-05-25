import {promises as fs} from 'fs'

/** The default package.json declaration used */
export const base_project_package = {
    "name": `@citation/module`,
    "version": "1.0.0",
    "author": "Ayowel",
    "license": "MIT",
    "description": "All CSL locales as a single package for easier linking",
    "main": "index.js",
    "module": "index.mjs",
    "keywords": [
        "citation-style-language",
    ],
    "homepage": "https://github.com/Ayowel/csl-support-js",
    "bugs": {
        "url": "https://github.com/Ayowel/csl-support-js/issues"
    },
    "publishConfig": {
        "access": "public"
    },
}

/**
 * Update a file and indicate whether a change occured
 * @param file Path to the file to update
 * @param content Content of the new file
 * @return Whether the file was actually updated
 */
export async function update_file(file: string, content: string): Promise<number> {
    const old_content = await fs.readFile(file, {encoding: 'utf8'}).catch((r) => undefined)
    if (old_content === content) {
        return 0
    }
    await fs.writeFile(file, content, {encoding: 'utf8'})
    return 1
}
