# Citation - CSL in node

This repository provides statically-loaded NPM modules that expose CSL assets provided by the [CSL project](https://citationstyles.org/).

The code in this repository is under the MIT license, however all CSL assets (locales and styles) are under the [Creative Commons Attribution-ShareAlike 3.0 Unported license](https://creativecommons.org/licenses/by-sa/3.0/)

## Assets

### CSL locales

Baseline repository: https://github.com/citation-style-language/locales

All CSL locales are provided as individual modules (e.g. for the `en-US` locale: `@citation/csl-locale-en-us`).

A global module containing all locales is available under the name `@citation/csl-locale-all`.

### CSL styles

Baseline repository: https://github.com/citation-style-language/styles

All independent CSL styles are provided as individual modules that also contain their dependent styles (e.g. for the `ieee` style: `@citation/csl-style-ieee`).

A global module containing all styles is available under the name `@citation/csl-style-all`.

## Usage

The provided modules load the associated data statically for use in promise-less APIs, thus you should consider whether to load them upfront or to `require` them as-needed as the overall size of styles and locales can be important.
