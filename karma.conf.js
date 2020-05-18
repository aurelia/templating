const path = require('path');
const { AureliaPlugin } = require('aurelia-webpack-plugin');

module.exports =
/**
 * 
 * @param {import('karma').Config} config 
 */
function(config) {
  const browsers = config.browsers;

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],
    files: [
      'test/setup.js'
    ],
    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/setup.js': ['webpack', 'sourcemap']
    },
    webpack: {
      mode: 'development',
      entry: '',
      resolve: {
        extensions: [".ts", ".js"],
        modules: ["node_modules"],
        alias: {
          src: path.resolve(__dirname, 'src'),
          // aliasing to this in test folder, instead of src folder
          // to avoid colliding with the legacy build script
          'aurelia-templating': path.resolve(__dirname, 'test/aurelia-templating'),
          test: path.resolve(__dirname, 'test')
        }
      },
      performance: {
        hints: false,
      },
      devtool: Array.isArray(browsers) && browsers.includes('ChromeDebugging') ? 'inline-source-map' : 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.[jt]s$/,
            use: [
              {
                loader: "babel-loader",
                options: {
                  presets: [
                    '@babel/preset-typescript',
                    ['@babel/preset-env', { targets: { chrome: '70' } }]
                  ],
                  plugins: [
                    ['@babel/plugin-transform-typescript', { allExtensions: true }],
                    ["@babel/plugin-transform-runtime", { regenerator: true }],
                    ["@babel/plugin-proposal-decorators", { legacy: true }],
                    ["@babel/plugin-proposal-class-properties", { loose: true }],
                    ["@babel/plugin-proposal-nullish-coalescing-operator", { loose: true }],
                    ["@babel/plugin-proposal-optional-chaining", { loose: true }]
                  ]
                },
              }
            ],
            exclude: /node_modules/
          }
        ]
      },
      plugins: [
        new AureliaPlugin({
          aureliaApp: undefined,
          noWebpackLoader: true,
          dist: 'es2015'
        })
      ]
    },
    mime: {
      "text/x-typescript": ["ts"]
    },
    logLevel: config.LOG_ERROR, // to disable the WARN 404 for image requests
    reporters: ['progress'],
    webpackServer: { noInfo: true },
    browsers: Array.isArray(browsers) && browsers.length > 0 ? browsers : ['ChromeHeadless'],
    customLaunchers: {
      ChromeDebugging: {
        base: 'Chrome',
        flags: [
          '--remote-debugging-port=9333'
        ],
        debug: true
      }
    },
    mochaReporter: {
      ignoreSkipped: true
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
