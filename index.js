"use strict";

const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const ejs = require('ejs');
const chalk = require('chalk');
const { sources } = require('webpack');

function VersionFile(options) {
  var self = this;

  var defaultOptions = {
    outputFile: 'version.txt',
    template: 'version.ejs',
    templateString: '',
    extras: {}
  };

  //Set default config data
  var optionsObject = options || {};
  self.options = _.defaults(optionsObject, defaultOptions);

  // Check for missing arguments
  if (!this.options.packageFile) {
    throw new Error(chalk.red('Expected path to packageFile'))
  }

  try {
    self.options['package'] = require(self.options.packageFile);
  } catch (err) {
    throw new Error(chalk.red(err))
  }

}

VersionFile.prototype.apply = function(compiler) {
  var self = this;
  self.options.currentTime = new Date();

  compiler.hooks.thisCompilation.tap(
      'WebpackVersionFilePlugin',
      (compilation) => {
        /*
         * If we are given a template string in the config, then use it directly.
         * But if we get a file path, fetch the content then use it.
         */
        if (self.options.templateString) {
          self.emitFile(self.options.templateString, compilation);
        } else {
          fs.readFile(self.options.template, {
            encoding: 'utf8'
          }, function(error, content) {
            if (error) {
              throw error;
              return;
            }

            self.emitFile(content, compilation);
          });
        }
      }
  )
};

/**
 * Renders the template and emit the version file
 * @param templateContent
 * @param compilation
 */
VersionFile.prototype.emitFile = function(templateContent, compilation) {
  var self = this;
  var fileContent = ejs.render(templateContent, self.options);
  compilation.hooks.processAssets.tap(
      {
        name: 'WebpackVersionFilePlugin',
        stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
      },
      (assets) => {
        compilation.emitAsset(
            self.options.outputFile.replace(compilation.compiler.outputPath + '/', ''),
            new sources.RawSource(fileContent)
        );
      }
  );
}

module.exports = VersionFile;
