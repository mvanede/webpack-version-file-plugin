Webpack Version File Plugin
============
Plugin for Webpack which allows you to generate a static version file that can be deployed. Inspired by [morficus/version-file](https://github.com/morficus/version-file)

## Compatibility
This plugin is compatible with **webpack 5.0 and higher.**

## Use case
This plugin can be used to automatically let Webpack generate a file containing version information, based on the information in your NPM package.json.

Can, for example, be used to let your webapp detect when a new version is available.


## Sample outfile file content
```
{
  "version" : "5.37.0",
  "name": "My AngularJS App",
  "buildDate": "Mon Nov 23 2015 14:26:25 GMT+0100 (CET)"
}
```

## Available config options:

- **outputFile**: the path and filename of where to store the output. _Defaults to `version.text` in your build directory._
- **templateString**: an [EJS](https://www.npmjs.org/package/ejs) template string.
- **template**: path to your EJS template file. _Overwrites templateString option_
- **packageFile**: path to your package.json. _Defaults to `./package.json`_
- **extras**: {}: an object for any extra information you want to use in your template.

## Templating

This modules uses [EJS](https://www.npmjs.org/package/ejs) as its templating system.
As indicated in the config options section, you can utilize your own template by either (a) passing in a path to an external file or (b) typing the template in-line.

The available keys are:
- **package**: contains all keys of your package.json
- **buildTime**: Date object containing build time.
- **extras**: an object containing any custom / additional data that is needed in the template

## Sample Webpack Configuration:
```
const path = require('path');
const VersionFilePlugin = require('webpack-version-file-plugin');
const buildPath = path.join(__dirname, 'build');
const srcPath = path.join(__dirname, 'src');

module.exports = {
  entry: path.join(srcPath, 'index.js'),
    output: {
      path: buildPath,
      filename: 'bundle-[fullhash:6].js'
    },
    plugins: [
	  new VersionFilePlugin({
        outputFile: 'version.txt',
        template: 'version.ejs',
        extras: {
          'foo': 'bar'
        }
      }),
      new VersionFilePlugin({
        outputFile: './foo/bar/version.json',
        templateString: '{\n' +
            '  "name": "<%= package.name %>",\n' +
            '  "version": "<%= package.version %>",\n' +
            '  "buildDate": "<%= buildTime.toString() %>",\n' +
            '  "author": "<%= package.author.name %>",\n' +
            '  "foo": "<%= extras.foo %>"\n' +
            '}\n',
        extras: {
            'foo': "bar"
        }
      })
	]
};

```

## Sample EJS Template
```
export default {
  "name":      "<%= package.name %>",
  "buildDate": "<%= buildTime.toString() %>",
  "version":   "<%= package.version %>"
}
```


## Sample NPM Configuration:
Adding a script which will automatically update the version before building.
```
{
  "name": "My AngularJS App",
  "version": "17.1.0",
  "description": "App descriptions",
  "author": "...",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "build": "npm version minor && rm -rf www/* && webpack -p --mode production",
  }
  ... etc
}  
```
### Usage
`npm run-script build`