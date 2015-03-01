### 0.8.14 (2015-02-28)


#### Bug Fixes

* **package:** change jspm directories ([9ef08cfd](http://github.com/aurelia/templating/commit/9ef08cfd9596600b161ed7c686f53b15cfdaa5de))


### 0.8.13 (2015-02-28)


#### Bug Fixes

* **anim:**
  * local variable instead dereferencing ([2c033daf](http://github.com/aurelia/templating/commit/2c033daf4efd0f69af6572af64543763f08c8a24))
  * Only call animations if anim-class set ([8bf15dce](http://github.com/aurelia/templating/commit/8bf15dce0ed83834c4fecf8d61ff53fefe60b077))
  * Opt-In Animator ([02d83dd7](http://github.com/aurelia/templating/commit/02d83dd78126d45e2966aecf6a8bb8dcfc245314))
  * element enter fix ([172428e3](http://github.com/aurelia/templating/commit/172428e3f942f7e9c61e7afb9efb9729fbeef460))
* **package:** update dependencies ([4a3489f9](http://github.com/aurelia/templating/commit/4a3489f983b75f194f38b0142fd4fe2ee3680184))
* **view-slot:**
  * transformChildNodesIntoView broken with animation ([03b94433](http://github.com/aurelia/templating/commit/03b94433bccf81ef5595d0495b4ba257ffb662ad))
  * prepare for animator implementation ([f922a86f](http://github.com/aurelia/templating/commit/f922a86feb4f42e34ca37650e0533dd75e9d17dc))


#### Features

* **Behaviour:** make UK devs jump for joy ([b5cc76c4](http://github.com/aurelia/templating/commit/b5cc76c4f5ce2aa985244d0bfd8248c71e305984), closes [#18](http://github.com/aurelia/templating/issues/18))
* **anim:** Add animator service ([5d2d6169](http://github.com/aurelia/templating/commit/5d2d616988f723a3c20f06c2ae51ffe8f757c307))


### 0.8.12 (2015-02-18)


#### Bug Fixes

* **view-compiler:** elements with skipped content should not be traversed ([56b585f9](http://github.com/aurelia/templating/commit/56b585f9deac272a09e31dfdfa1591a446f61452))


### 0.8.11 (2015-02-13)


#### Bug Fixes

* **resource-coordinator:** regression in local auto-imports ([8ec09095](http://github.com/aurelia/templating/commit/8ec090957ef33afbf0388427b378b203937a99eb))


### 0.8.10 (2015-02-13)


#### Bug Fixes

* **build:** add missing bower bump ([4484ea7f](http://github.com/aurelia/templating/commit/4484ea7f302d0faca3a0f48b218b9a0b8a00bd46))
* **resource-coordinator:** do not cache dynamic view models ([a29f2bc2](http://github.com/aurelia/templating/commit/a29f2bc2a8a8c3fc40265b310646587ee0601d55))


### 0.8.9 (2015-02-06)


#### Features

* **behaviors:** expose public api for behaviors on element ([fc002606](http://github.com/aurelia/templating/commit/fc002606d5ee3e5646323ad8ff4dc32c456c545f), closes [#10](http://github.com/aurelia/templating/issues/10))
* **custom-element:**
  * add beforeCompile hook ([a7d34b51](http://github.com/aurelia/templating/commit/a7d34b5188c92d8426a4123002bc34a58a672492), closes [#9](http://github.com/aurelia/templating/issues/9))
  * add metadata for skipping for content processing ([1fa4ca9b](http://github.com/aurelia/templating/commit/1fa4ca9bdf2d39f940717bbb407c0c9bec89f06c), closes [#4](http://github.com/aurelia/templating/issues/4))


### 0.8.8 (2015-02-03)


#### Bug Fixes

* **view-compiler:** correctly map renamed attached behaviors at app level ([47f9e2f9](http://github.com/aurelia/templating/commit/47f9e2f93fb8e2552fa0f74dd402968397261c2b))


### 0.8.7 (2015-01-29)


#### Bug Fixes

* **composition-engine:** fix syntax error ([f87668da](http://github.com/aurelia/templating/commit/f87668da917b9fe2ddc0dfa944c29ae9fdd66a4a))


### 0.8.6 (2015-01-25)


#### Features

* **property:** add fluent api helper method for options property properties ([597426b0](http://github.com/aurelia/templating/commit/597426b0d740073b84d71a39f56623173b3886b8))


### 0.8.5 (2015-01-25)


#### Bug Fixes

* **resources:** enable early name analysis of resources ([331fcfd1](http://github.com/aurelia/templating/commit/331fcfd1341acab1c0cc65a103c3951cd047ca6b))


### 0.8.4 (2015-01-24)


#### Bug Fixes

* **package:** update deps and fix bower semver ranges ([5ead6b7f](http://github.com/aurelia/templating/commit/5ead6b7fb19fd4782735526ef8fa188b5917a8b4))


### 0.8.3 (2015-01-24)


#### Bug Fixes

* **composition-engine:** ensure that bind callbacks execute ([74048922](http://github.com/aurelia/templating/commit/7404892281600785fe71bd6c438374301fbd3f81))


### 0.8.2 (2015-01-23)


#### Bug Fixes

* **property:** prevent errors with property meta on composed view models ([0c9ef978](http://github.com/aurelia/templating/commit/0c9ef97870d4174346c55bcf04b7726a286749b6))


### 0.8.1 (2015-01-23)


#### Bug Fixes

* **resource-coordinator:** incorrectly setting analyzed module ids ([7fa47357](http://github.com/aurelia/templating/commit/7fa47357408aedca21eb882a89c3bf8e43560e7b))


## 0.8.0 (2015-01-22)


#### Bug Fixes

* **all:**
  * improve metadata dsl ([0ce71d74](http://github.com/aurelia/templating/commit/0ce71d74bb5cc6692d0b878a24301ccaa79d9e9d))
  * update to work with new metadata api ([8cc938a7](http://github.com/aurelia/templating/commit/8cc938a726ef3cb8bbe64f5ced71c1e53022f766))
* **package:** update dependencies ([b9a0f1e9](http://github.com/aurelia/templating/commit/b9a0f1e9bd6dda4d62ec6008e93c71a9884deb80))
* **property:** ensure default binding mode is set ([e507251e](http://github.com/aurelia/templating/commit/e507251e19f1c5bf55d11c40fcdb7237d2b63d2e))
* **resource coordinator:** fix error when returning function from amd module ([21d6cb0d](http://github.com/aurelia/templating/commit/21d6cb0d605a66212b1d9d1d0f2cc9890351017a))
* **view-engine:**
  * remove module elements from templates ([149e8a8c](http://github.com/aurelia/templating/commit/149e8a8c6d0ca4d1585ab6ff1b446b61f37c0a68))
  * incorrect array access in resource loading ([1cbca7f2](http://github.com/aurelia/templating/commit/1cbca7f2e8b370187a9c02ca15b16f2f612629c5))


#### Features

* **all:**
  * update to new fluid metadata api and add helpers ([e6893eb9](http://github.com/aurelia/templating/commit/e6893eb9aa932cee3e11a6038bc405ec5e47db06))
  * behavior props now defined on prototype ([305054b4](http://github.com/aurelia/templating/commit/305054b4731e694abd1cc6682e40760ee3114039))
* **index:** create alias Behavior for Metadata ([96bcb7bf](http://github.com/aurelia/templating/commit/96bcb7bf4acd75256d597ea58200ddc34dbf0cd7))
* **property:**
  * infrastructure for dynamic commands and options properties ([eb54b5f9](http://github.com/aurelia/templating/commit/eb54b5f9b50fd7814b63d7040f7e4f89cd8c14de))
  * default binding modes for aurelia properties ([769882db](http://github.com/aurelia/templating/commit/769882dbf4ea081eeeeae0ab968bf869b1ab034a), closes [#1](http://github.com/aurelia/templating/issues/1))
* **resource-coordinator:** enable load resources relative to a manifest file ([98a5f01b](http://github.com/aurelia/templating/commit/98a5f01ba5451005215acfba1cd8a9ef5d7b5a96))
* **view-engine:** new import syntax ([3e761e77](http://github.com/aurelia/templating/commit/3e761e77760e999ffae407b297ecaf7d11d07788))
* **view-slot:** add infrastructure for app splash screens ([8a9b6062](http://github.com/aurelia/templating/commit/8a9b606283b873b66ff9bb588f002b3ee8275629))


### 0.7.2 (2015-01-13)


#### Bug Fixes

* **view-strategy:** dynamic strategy hook results should be relative to view-model ([ae6cf40c](http://github.com/aurelia/templating/commit/ae6cf40cbaffc7504867100e10e709a780231d82))


### 0.7.1 (2015-01-12)


#### Bug Fixes

* **view-engine:** double check existing on async load ([e257198b](http://github.com/aurelia/templating/commit/e257198b36c4423d5db6cf1f2ac71dc10abe53c0))


## 0.7.0 (2015-01-12)


#### Bug Fixes

* **behavior:** removed behavior base class ([2121d137](http://github.com/aurelia/templating/commit/2121d13752ffa6936a89f6b01fe00945d126310a))
* **package:** update Aurelia dependencies ([c78936bf](http://github.com/aurelia/templating/commit/c78936bf39d5a81d084c1252c6b72913dd8fd4e4))
* **view:** process bindings before behavior binds ([4e26198b](http://github.com/aurelia/templating/commit/4e26198b16e13e1b9002235ab6bc07673f3243c2))


#### Features

* **property:**
  * add options property ([b8627249](http://github.com/aurelia/templating/commit/b8627249b7dcd71f45b676e6fd680d1d20b524cf))
  * add load responsibility from behavior ([f8790e42](http://github.com/aurelia/templating/commit/f8790e4224f065cd83009bc16dab7a84adfb3038))
* **view-compiler:** update to new binding language interface ([8fb4f7ca](http://github.com/aurelia/templating/commit/8fb4f7ca4f2125e47a6312604f47df3563c3e318))


### 0.6.1 (2015-01-08)


#### Bug Fixes

* **behavior-instance:** classic loop, function var bug ([359749a4](http://github.com/aurelia/templating/commit/359749a43b8cdfc669f4f7c7a9796db3a31d67cd))


## 0.6.0 (2015-01-07)


#### Bug Fixes

* **composition-engine:**
  * more consistent api ([ab419d1a](http://github.com/aurelia/templating/commit/ab419d1a32f0329be5c50f5049d40e66b6db3ad1))
  * do not require view resources ([82bbbdad](http://github.com/aurelia/templating/commit/82bbbdad07fc8a1470cf4331129571380cc99dd2))


#### Features

* **view-strategy:** allow strategies to be made relative via compose ([53f25495](http://github.com/aurelia/templating/commit/53f2549589091dcc5a7a54297d080184d7f2c8be))


## 0.5.0 (2015-01-06)


#### Bug Fixes

* **all:** rename Filter to ValueConverter ([f0963214](http://github.com/aurelia/templating/commit/f0963214a34478dbf5de3e67376bdd29de90817a))
* **resource-coorindator:** return full info for view model load ([78d1b875](http://github.com/aurelia/templating/commit/78d1b875db07fd20050e7582ccb09abd8637ee15))
* **view-factory:** incorrect loop variable name ([1e1dbff6](http://github.com/aurelia/templating/commit/1e1dbff6213cad44715c70185f2ece7cf3209632))


#### Features

* **build:** update compile, switch to register modules, switch to core-js format ([a2b2e63f](http://github.com/aurelia/templating/commit/a2b2e63fe729a9cf206ca71748505c81cdbec2dd))
* **composition-engine:** encapsulate dynamic composition logic in a service ([51638f65](http://github.com/aurelia/templating/commit/51638f65ce0c129e41aa7f3aed10bcd3985d7df9))
* **view-engine:** enable resource renaming ([83683d92](http://github.com/aurelia/templating/commit/83683d921d125507ba574091bcf7e3c422b45288))
* **view-resources:** auto-import own local resources ([9f770029](http://github.com/aurelia/templating/commit/9f77002950aeb8fab347297a5a669efc9ff993f5))


## 0.4.0 (2014-12-22)


#### Bug Fixes

* **view-compiler:** instruction target null class fixed ([655a8938](http://github.com/aurelia/templating/commit/655a8938a80f3bcda0bb13ff006a0bcb106d088f))


### 0.3.2 (2014-12-18)


#### Bug Fixes

* **resource-registry:** symbol was not correctly exported ([bb395edf](http://github.com/aurelia/templating/commit/bb395edf701d58dc814859975f219739174c4a39))


### 0.3.1 (2014-12-18)


#### Bug Fixes

* **package:** update path to the latest version ([a173b15c](http://github.com/aurelia/templating/commit/a173b15cf1d50677dfafb3143bc19d0e6b6720b8))
* **view-engine:** update to use path.relativeToFile ([fa05b092](http://github.com/aurelia/templating/commit/fa05b092b350bbb47e44001322f2e58a7b868165))


#### Features

* **ViewResources:** enable DI of ViewResources ([f5b37e10](http://github.com/aurelia/templating/commit/f5b37e10bada8063a78c02e1b53ab1357ba9668e))


## 0.3.0 (2014-12-17)


#### Bug Fixes

* **package:** updated dependencies to latest versions ([cdcfd6dd](http://github.com/aurelia/templating/commit/cdcfd6dd425f76e17689e645a5aad2f323a4fd40))


### 0.2.1 (2014-12-12)


#### Bug Fixes

* **package:** update dependencies to latest ([c5ba425c](http://github.com/aurelia/templating/commit/c5ba425c1faa51955609067023a486b69c11a528))


## 0.2.0 (2014-12-11)


#### Bug Fixes

* **package:** update dependencies to latest versions ([6d3a3b96](http://github.com/aurelia/templating/commit/6d3a3b966f7dbf94a88de5cf440cad5894962f3a))
* **view-engine:** rename dx-import to import ([fd3ddaf9](http://github.com/aurelia/templating/commit/fd3ddaf90f96271ce545305db5f6adc0533f50b6))


## 0.1.0 (2014-12-11)


#### Bug Fixes

* **package:** add missing polyfills ([bd751f7c](http://github.com/aurelia/templating/commit/bd751f7c2a40e7025ac35dfd563024f608c35474))

