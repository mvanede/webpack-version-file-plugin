'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const webpack = require('webpack');
const VersionFilePlugin = require('../index');

function withTemporaryDirectory(test) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'webpack-version-file-plugin-'));

    return Promise.resolve()
        .then(() => test(directory))
        .finally(() => fs.rmSync(directory, { recursive: true, force: true }));
}

function writeFixture(directory, relativePath, content) {
    const filePath = path.join(directory, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
    return filePath;
}

function runWebpack(configuration) {
    const compiler = webpack(configuration);

    return new Promise((resolve, reject) => {
        compiler.run((runError, stats) => {
            compiler.close((closeError) => {
                if (runError) {
                    reject(runError);
                } else if (closeError) {
                    reject(closeError);
                } else if (stats.hasErrors()) {
                    reject(new Error(stats.toString({ all: false, errors: true })));
                } else {
                    resolve(stats);
                }
            });
        });
    });
}

function webpackConfiguration(directory, plugin) {
    const outputDirectory = path.join(directory, 'output');

    return {
        mode: 'development',
        context: directory,
        entry: './src/index.js',
        output: {
            path: outputDirectory,
            filename: 'bundle.js'
        },
        plugins: [plugin]
    };
}

describe('VersionFilePlugin', () => {
    it('emits the default version asset from the supplied package manifest', async () => {
        await withTemporaryDirectory(async (directory) => {
            const packageFile = writeFixture(directory, 'package.json', JSON.stringify({
                name: 'fixture-app',
                version: '1.2.3'
            }));
            writeFixture(directory, 'src/index.js', 'module.exports = "fixture";');

            await runWebpack(webpackConfiguration(directory, new VersionFilePlugin({ packageFile })));

            const content = fs.readFileSync(path.join(directory, 'output', 'version.txt'), 'utf8');
            const match = /^fixture-app@1\.2\.3, build at (.+)$/.exec(content);

            assert.ok(match, `unexpected version asset content: ${content}`);
            assert.strictEqual(new Date(match[1]).toUTCString(), match[1]);
        });
    });

    it('renders an inline template with extras to a nested asset path', async () => {
        await withTemporaryDirectory(async (directory) => {
            const packageFile = writeFixture(directory, 'package.json', JSON.stringify({
                name: 'fixture-app',
                version: '2.0.0'
            }));
            writeFixture(directory, 'src/index.js', 'module.exports = "fixture";');

            await runWebpack(webpackConfiguration(directory, new VersionFilePlugin({
                packageFile,
                outputFile: './metadata\\version.json',
                templateString: '{"name":"<%= package.name %>","channel":"<%= extras.channel %>"}',
                extras: { channel: 'canary' }
            })));

            assert.strictEqual(
                fs.readFileSync(path.join(directory, 'output', 'metadata', 'version.json'), 'utf8'),
                '{"name":"fixture-app","channel":"canary"}'
            );
        });
    });

    it('loads and renders an external EJS template file', async () => {
        await withTemporaryDirectory(async (directory) => {
            const packageFile = writeFixture(directory, 'package.json', JSON.stringify({
                name: 'fixture-app',
                version: '3.0.0'
            }));
            const template = writeFixture(directory, 'templates/version.ejs', '<%= package.name %> version <%= package.version %>');
            writeFixture(directory, 'src/index.js', 'module.exports = "fixture";');

            await runWebpack(webpackConfiguration(directory, new VersionFilePlugin({
                packageFile,
                template,
                outputFile: 'external-version.txt'
            })));

            assert.strictEqual(
                fs.readFileSync(path.join(directory, 'output', 'external-version.txt'), 'utf8'),
                'fixture-app version 3.0.0'
            );
        });
    });

    it('rejects an invalid package manifest during construction', async () => {
        await withTemporaryDirectory((directory) => {
            const packageFile = writeFixture(directory, 'package.json', '{ invalid json');

            assert.throws(
                () => new VersionFilePlugin({ packageFile })
            );
        });
    });

    it('rejects a missing package manifest option during construction', () => {
        assert.throws(
            () => new VersionFilePlugin({ packageFile: '' })
        );
    });

    it('rejects an absolute POSIX output asset path during construction', async () => {
        await withTemporaryDirectory((directory) => {
            const packageFile = writeFixture(directory, 'package.json', JSON.stringify({
                name: 'fixture-app',
                version: '1.2.3'
            }));

            assert.throws(
                () => new VersionFilePlugin({ packageFile, outputFile: '/tmp/version.txt' })
            );
        });
    });

    it('rejects an absolute Windows output asset path during construction', async () => {
        await withTemporaryDirectory((directory) => {
            const packageFile = writeFixture(directory, 'package.json', JSON.stringify({
                name: 'fixture-app',
                version: '1.2.3'
            }));

            assert.throws(
                () => new VersionFilePlugin({ packageFile, outputFile: 'C:\\build\\version.txt' })
            );
        });
    });

    it('rejects a traversal output asset path during construction', async () => {
        await withTemporaryDirectory((directory) => {
            const packageFile = writeFixture(directory, 'package.json', JSON.stringify({
                name: 'fixture-app',
                version: '1.2.3'
            }));

            assert.throws(
                () => new VersionFilePlugin({ packageFile, outputFile: '../version.txt' })
            );
        });
    });

    it('rejects a NUL byte in an output asset path during construction', async () => {
        await withTemporaryDirectory((directory) => {
            const packageFile = writeFixture(directory, 'package.json', JSON.stringify({
                name: 'fixture-app',
                version: '1.2.3'
            }));

            assert.throws(
                () => new VersionFilePlugin({ packageFile, outputFile: 'version.txt\0tail' })
            );
        });
    });

    it('rejects output asset paths that normalize to a directory', async () => {
        await withTemporaryDirectory((directory) => {
            const packageFile = writeFixture(directory, 'package.json', JSON.stringify({
                name: 'fixture-app',
                version: '1.2.3'
            }));

            assert.throws(
                () => new VersionFilePlugin({ packageFile, outputFile: './' })
            );
            assert.throws(
                () => new VersionFilePlugin({ packageFile, outputFile: 'metadata/' })
            );
        });
    });

    it('exposes only documented EJS locals to inline templates', async () => {
        await withTemporaryDirectory(async (directory) => {
            const packageFile = writeFixture(directory, 'package.json', JSON.stringify({
                name: 'fixture-app',
                version: '4.0.0'
            }));
            writeFixture(directory, 'src/index.js', 'module.exports = "fixture";');

            await runWebpack(webpackConfiguration(directory, new VersionFilePlugin({
                packageFile,
                outputFile: 'template-locals.txt',
                templateString: '<%= typeof internalOnly %>|<%= package.name %>|<%= extras.channel %>',
                extras: { channel: 'canary' },
                internalOnly: 'sentinel'
            })));

            assert.strictEqual(
                fs.readFileSync(path.join(directory, 'output', 'template-locals.txt'), 'utf8'),
                'undefined|fixture-app|canary'
            );
        });
    });
});
