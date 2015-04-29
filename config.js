System.config({
  "paths": {
    "*": "*.js",
    "github:*": "jspm_packages/github/*.js",
    "aurelia-templating/*": "dist/*.js",
    "npm:*": "jspm_packages/npm/*.js"
  }
});

System.config({
  "map": {
    "aurelia-binding": "github:aurelia/binding@0.5.0",
    "aurelia-dependency-injection": "github:aurelia/dependency-injection@0.6.0",
    "aurelia-html-template-element": "github:aurelia/html-template-element@0.2.0",
    "aurelia-loader": "github:aurelia/loader@0.5.0",
    "aurelia-logging": "github:aurelia/logging@0.3.0",
    "aurelia-metadata": "github:aurelia/metadata@0.4.0",
    "aurelia-path": "github:aurelia/path@0.5.0",
    "aurelia-task-queue": "github:aurelia/task-queue@0.3.0",
    "core-js": "github:zloirock/core-js@0.8.1",
    "text": "github:systemjs/plugin-text@0.0.2",
    "github:aurelia/binding@0.5.0": {
      "aurelia-dependency-injection": "github:aurelia/dependency-injection@0.6.0",
      "aurelia-metadata": "github:aurelia/metadata@0.4.0",
      "aurelia-task-queue": "github:aurelia/task-queue@0.3.0",
      "core-js": "github:zloirock/core-js@0.8.1"
    },
    "github:aurelia/dependency-injection@0.6.0": {
      "aurelia-logging": "github:aurelia/logging@0.3.0",
      "aurelia-metadata": "github:aurelia/metadata@0.4.0",
      "core-js": "github:zloirock/core-js@0.8.1"
    },
    "github:aurelia/loader@0.5.0": {
      "aurelia-html-template-element": "github:aurelia/html-template-element@0.2.0",
      "aurelia-path": "github:aurelia/path@0.5.0",
      "core-js": "github:zloirock/core-js@0.8.1",
      "webcomponentsjs": "github:webcomponents/webcomponentsjs@0.5.5"
    },
    "github:aurelia/metadata@0.4.0": {
      "core-js": "github:zloirock/core-js@0.8.1"
    }
  }
});
