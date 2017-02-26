var path = require('path');
var fs = require('fs');

// hide warning //
var emitter = require('events');
emitter.defaultMaxListeners = 20;

var appRoot = 'src/';
var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

var paths = {
  root: appRoot,
  source: appRoot + '**/*.js',
  html: appRoot + '**/*.html',
  style: 'styles/**/*.css',
  output: 'dist/',
  doc:'./doc',
  e2eSpecsSrc: 'test/e2e/src/*.js',
  e2eSpecsDist: 'test/e2e/dist/',
  packageName: pkg.name,
  ignore: [],
  useTypeScriptForDTS: false,
  importsToAdd: [],
  sort: false
};

paths.files = [
  'animation-event.js',
  'animator.js',
  'composition-transaction.js',
  'util.js',
  'view-engine-hooks-resource.js',
  'element-events.js',
  'instructions.js',
  'view-strategy.js',
  'view-locator.js',
  'binding-language.js',
  'shadow-dom.js',
  'view-resources.js',
  'view.js',
  'interfaces.js',
  'view-slot.js',
  'view-factory.js',
  'view-compiler.js',
  'module-analyzer.js',
  'view-engine.js',
  'controller.js',
  'behavior-property-observer.js',
  'bindable-property.js',
  'html-behavior.js',
  'child-observation.js',
  'swap-strategies.js',
  'composition-engine.js',
  'element-config.js',
  'decorators.js',
  'templating-engine.js'
].map(function(file){
  return paths.root + file;
});

module.exports = paths;
