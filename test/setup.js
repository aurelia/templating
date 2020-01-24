import 'aurelia-polyfills';
import {initialize} from 'aurelia-pal-browser';

initialize();

const context = require.context('./', true, /\.spec\.[tj]s$/);
context.keys().forEach(context);
