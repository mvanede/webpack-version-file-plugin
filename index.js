"use strict";

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { sources } = require('webpack');

const defaultOptions = {
    outputFile: 'version.txt',
    packageFile: './package.json',
    templateString: '<%= package.name %>@<%= package.version %>, build at <%= buildTime.toUTCString() %>',
    extras: {}
};

function optionOrDefault(options, optionName) {
    const hasOption = Object.prototype.hasOwnProperty.call(options, optionName);
    return hasOption && options[optionName] !== undefined
        ? options[optionName]
        : defaultOptions[optionName];
}

function validateOutputFile(outputFile) {
    if (typeof outputFile !== 'string' || outputFile.length === 0) {
        throw new Error('Missing path to outputfile (config option: <outputFile>)');
    }

    const assetName = outputFile.replace(/\\/g, '/');
    const segments = assetName.split('/');

    if (
        path.isAbsolute(outputFile) ||
        path.win32.isAbsolute(outputFile) ||
        /^[a-zA-Z]:/.test(outputFile) ||
        assetName.includes('\0') ||
        segments.includes('..')
    ) {
        throw new Error('Output file must be a relative asset path without traversal segments');
    }

    const normalizedAssetName = path.posix.normalize(assetName).replace(/^\.\/+/, '');

    if (
        normalizedAssetName.length === 0 ||
        normalizedAssetName === '.' ||
        normalizedAssetName.endsWith('/')
    ) {
        throw new Error('Output file must name a file');
    }

    return normalizedAssetName;
}

class VersionFilePlugin {

    constructor(options = {}) {
        const optionsObject = options || {};
        this.options = {
            outputFile: optionOrDefault(optionsObject, 'outputFile'),
            packageFile: optionOrDefault(optionsObject, 'packageFile'),
            templateString: optionOrDefault(optionsObject, 'templateString'),
            template: optionOrDefault(optionsObject, 'template'),
            extras: optionOrDefault(optionsObject, 'extras')
        };

        // Check for missing arguments
        if (typeof this.options.packageFile !== 'string' || this.options.packageFile.length === 0) {
            throw new Error('Missing path to package.json (config option: <packageFile>)');
        }

        this.options.outputFile = validateOutputFile(this.options.outputFile);

        if (
            (!this.options.template || typeof this.options.template !== 'string') &&
            (typeof this.options.templateString !== 'string' || this.options.templateString.length === 0)
        ) {
            throw new Error('Missing both a template file and template string. (config option: <template> or <templateString>)');
        }

        // Read the packagefile
        try {
            const package_contents = fs.readFileSync(this.options.packageFile, { encoding: 'utf8' });
            this.options['package'] = JSON.parse(package_contents);
        } catch (err) {
            throw new Error(String(err));
        }
    } /* constructor */

    apply(compiler) {
        this.options.buildTime = new Date();

        compiler.hooks.thisCompilation.tap(
            'WebpackVersionFilePlugin',
            (compilation) => {
                /*
                 * If we are given a file path to a template, then use it directly.
                 * Otherwise, use the templateString
                 */
                let template;
                if (this.options.template) {
                    template = fs.readFileSync(this.options.template, { encoding: 'utf8' });
                } else {
                    template = this.options.templateString
                }
                this.emitFile(template, compilation);
            }
        )
    } /* appy */

    /**
     * Renders the template and emit the version file
     * @param templateContent
     * @param compilation
     */
    emitFile(templateContent, compilation) {
        const templateLocals = Object.create(null);
        templateLocals.package = this.options.package;
        templateLocals.buildTime = this.options.buildTime;
        templateLocals.extras = this.options.extras;
        const fileContent = ejs.render(templateContent, templateLocals);
        compilation.hooks.processAssets.tap(
            {
                name: 'WebpackVersionFilePlugin',
                stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            },
            (assets) => {
                compilation.emitAsset(
                    this.options.outputFile,
                    new sources.RawSource(fileContent)
                );
            }
        );
    } /* emitFile */
}
module.exports = VersionFilePlugin;
