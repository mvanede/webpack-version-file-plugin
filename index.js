"use strict";

const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const ejs = require('ejs');
const chalk = require('chalk');
const { sources } = require('webpack');

const defaultOptions = {
    outputFile: 'version.txt',
    packageFile: './package.json',
    templateString: '<%= package.name %>@<%= package.version %>, build at <%= buildTime.toUTCString() %>',
    extras: {}
};

class VersionFilePlugin {

    constructor(options = {}) {
        // Set default config data
        var optionsObject = options || {};
        this.options = _.defaults(optionsObject, defaultOptions);

        // Check for missing arguments
        if (!this.options.packageFile) {
            throw new Error(chalk.red('Missing path to package.json (config option: <packageFile>)'))
        }

        if (!this.options.outputFile) {
            throw new Error(chalk.red('Missing path to outputfile (config option: <outputFile>)'))
        }

        if (!this.options.template && !this.options.templateString) {
            throw new Error(chalk.red('Missing both a template file and template string. (config option: <template> or <templateString>)'))
        }

        // Read the packagefile
        try {
            const package_contents = fs.readFileSync(this.options.packageFile, { encoding: 'utf8' });
            this.options['package'] = JSON.parse(package_contents);
        } catch (err) {
            throw new Error(chalk.red(err))
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
        var fileContent = ejs.render(templateContent, this.options);
        compilation.hooks.processAssets.tap(
            {
                name: 'WebpackVersionFilePlugin',
                stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            },
            (assets) => {
                compilation.emitAsset(
                    this.options.outputFile.replace(compilation.compiler.outputPath + '/', ''),
                    new sources.RawSource(fileContent)
                );
            }
        );
    } /* emitFile */
}
module.exports = VersionFilePlugin;
