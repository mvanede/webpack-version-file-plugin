"use strict";

const fs = require('fs');
const _ = require('underscore');
const ejs = require('ejs');
const chalk = require('chalk');

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

VersionFile.prototype.apply = function() {
  var self = this;
  self.options.currentTime = new Date();

  /*
   * If we are given a template string in the config, then use it directly.
   * But if we get a file path, fetch the content then use it.
   */
  if (self.options.templateString) {
    self.writeFile(self.options.templateString);
  } else {
    fs.readFile(self.options.template, {
      encoding: 'utf8'
    }, function(error, content) {
      if (error) {
        throw error;
        return;
      }

      self.writeFile(content);
    });
  }
};

/**
 * Renders the template and writes the version file to the file system.
 * @param templateContent
 */
VersionFile.prototype.writeFile = function(templateContent) {
  var self = this;
  var fileContent = ejs.render(templateContent, self.options);
  fs.writeFileSync(self.options.outputFile, fileContent, {
    flag: 'w'
  });
}

module.exports = VersionFile;
