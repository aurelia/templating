import 'aurelia-polyfills';
import {initialize} from 'aurelia-pal-browser';

initialize();

const context = require.context('./', true, /\.spec\.js$/);
context.keys().forEach(context);
