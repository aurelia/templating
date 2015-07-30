### 0.13.15 (2015-07-30)


#### Bug Fixes

* **view-compiler:** properly handle content process skip ([014185ed](http://github.com/aurelia/templating/commit/014185ed849c71d539fa56f629aa58baf086f6bb))


### 0.13.14 (2015-07-30)


#### Bug Fixes

* **html-behavior:** do not override DOMBoundary for containerless elements ([d3c2ba4e](http://github.com/aurelia/templating/commit/d3c2ba4eeebd8a08dca6cb15d6ee377af4698e52))


### 0.13.13 (2015-07-29)


#### Bug Fixes

* **view-compiler:** missed update to content projection with new instruction lookup ([589c9d7e](http://github.com/aurelia/templating/commit/589c9d7e8c5cd27812c8059f8b88481844657992))


### 0.13.12 (2015-07-29)


#### Bug Fixes

* **view-compiler:** account for web components that alter the DOM structure during creation ([af5584b4](http://github.com/aurelia/templating/commit/af5584b4b2d93c498da920c10327fffed215a7dc), closes [#90](http://github.com/aurelia/templating/issues/90))
* **view-factory:**
  * overwriting part replacments in template controllers ([1c2420dd](http://github.com/aurelia/templating/commit/1c2420ddd4b007e67c0028f9c51de4cfef19e746), closes [#120](http://github.com/aurelia/templating/issues/120))
  * solve IE bug related to anchors ([7764774c](http://github.com/aurelia/templating/commit/7764774cf6621d25a111759cbe1217dfae64812d))
* **view-slot:** use animations on all slot modifications and properly return promises ([e28d776e](http://github.com/aurelia/templating/commit/e28d776e1a24f31d5244b23ae696ae37d3a5ac6d))


#### Features

* **decorators:** warn on deprecated skipContentProcessing decorator ([27822488](http://github.com/aurelia/templating/commit/27822488686535a7f9b5c7364c8cd751259e1c9e))
* **html-behavior:**
  * enable extensible content processing ([aa6c2d62](http://github.com/aurelia/templating/commit/aa6c2d627695000209f5278d6d8f4abb69c4c1b7))
  * introduce dom boundary for better shadow dom support ([74d06240](http://github.com/aurelia/templating/commit/74d0624097fa5dda6bd2fbea2ef7bb5617f2f221))


### 0.13.11 (2015-07-16)


#### Bug Fixes

* **view-strategy:** incorrect variable reference ([3231c77b](http://github.com/aurelia/templating/commit/3231c77b88fecf1364db645631004408c6e9e8c0))


### 0.13.10 (2015-07-16)


#### Bug Fixes

* **view-strategy:** incorrect variable ([7ef25428](http://github.com/aurelia/templating/commit/7ef25428679348fc54210315abc9568ef6ecaccd))


### 0.13.9 (2015-07-16)


#### Bug Fixes

* **build:** missed adding new file ([121ca640](http://github.com/aurelia/templating/commit/121ca6406b3444d1d4bc33c90a70009cfe5e66ee))


### 0.13.8 (2015-07-16)


#### Features

* **view-strategy:** @inlineView and InlineViewStrategy implemented ([bc464a42](http://github.com/aurelia/templating/commit/bc464a421ceeae6301832b656ad0204aa7f0c5a7))


### 0.13.7 (2015-07-16)


#### Bug Fixes

* **module-analyzer:** correct some promise types in the d.ts ([d025abf0](http://github.com/aurelia/templating/commit/d025abf0ea17792a7e56bf5d54120fed3790f837))


### 0.13.6 (2015-07-15)


#### Bug Fixes

* **all:** improve several d.ts definitions with better type info ([51cad257](http://github.com/aurelia/templating/commit/51cad25703786f4edfaa5e08db2ef2c8bf5fc126), closes [#132](http://github.com/aurelia/templating/issues/132))
* **view-compiler:** template elements with template controllers work again ([71c67c21](http://github.com/aurelia/templating/commit/71c67c2109284f6c4adfaa35609b67e66ed11b80), closes [#133](http://github.com/aurelia/templating/issues/133))


### 0.13.5 (2015-07-14)


#### Bug Fixes

* **view-factory:** properly merge element attr overrides with surrogate values ([0ba7c904](http://github.com/aurelia/templating/commit/0ba7c9040354016b64a69f55f95fa5a9b5b80187))


### 0.13.4 (2015-07-14)


#### Bug Fixes

* **view-engine:** handle circular references between views ([5e023a59](http://github.com/aurelia/templating/commit/5e023a59fc12867a0c1d8bb00399f0e3f4ce53b6))


### 0.13.3 (2015-07-13)


#### Features

* **view-compiler:** enable surrogate behaviors, bindings and attributes ([a1fcdffb](http://github.com/aurelia/templating/commit/a1fcdffbcb1b0dcfbd23387c467302d540a9144f), closes [#61](http://github.com/aurelia/templating/issues/61))


### 0.13.2 (2015-07-07)


### 0.13.1 (2015-07-03)


#### Bug Fixes

* **view-strategy:** address changes in jspm/system.js beta ([ac24d3b6](http://github.com/aurelia/templating/commit/ac24d3b68680241c0ce31eefc6edd58f6c8e9858))


## 0.13.0 (2015-07-02)


#### Bug Fixes

* **BindableProperty:** use strict equality operators ([5128617a](http://github.com/aurelia/templating/commit/5128617ad02a5330250624669e67e0a4ac164f32), closes [#100](http://github.com/aurelia/templating/issues/100))
* **ViewCompiler:**
  * clear class attributes containing interpolation expressions ([92aa047b](http://github.com/aurelia/templating/commit/92aa047bdbc39ee0c0a5181887df4368343f79df), closes [#99](http://github.com/aurelia/templating/issues/99))
  * handle undefined instruction attributes ([0f6761b8](http://github.com/aurelia/templating/commit/0f6761b89aba2ab48a98738a44b656b53699e80d))
  * handle adjacent text nodes ([a6db7f30](http://github.com/aurelia/templating/commit/a6db7f30532cdd8ca1401c041c7052ff52ec8644))
* **all:** use new metadata api ([b5ff3fe0](http://github.com/aurelia/templating/commit/b5ff3fe0a41b723f5d94ad70614f3d42e6e4c3ac))
* **children:**
  * delay change handler check for child sync ([e56f0350](http://github.com/aurelia/templating/commit/e56f03503fd2a1b3a3e59e93e63112bfb6f3df29))
  * child sync can now decorate a property ([745c7c00](http://github.com/aurelia/templating/commit/745c7c00f46add7a4cd0a40d937b315e752b6d15))
* **html-behavior:** enable recursive elements when loaded by router first ([e82f44ce](http://github.com/aurelia/templating/commit/e82f44ce8e351ad86f42af342609b67eb9ac50ee))
* **view-compiler:** remove interpolated expression attrs ([b86c6d41](http://github.com/aurelia/templating/commit/b86c6d4116463176921bb4fbff544beb7f1d7842))


#### Features

* **all:** new API for testing HTML behaviors ([f28ea278](http://github.com/aurelia/templating/commit/f28ea2789351e0fbc07de5aaf0ced9ce6093d6a4))
* **anim:**
  * add missing animateTimeout ([28527e18](http://github.com/aurelia/templating/commit/28527e1872b07d11db23d2ee8ec9105ac0307e10))
  * additional animation events ([40c4ab13](http://github.com/aurelia/templating/commit/40c4ab13341b3f02fa00727432fc30ddb698466a))
* **bindable-property:** all behaviors now support propertyChanged ([c1138e51](http://github.com/aurelia/templating/commit/c1138e51068763139e6661096957ec714eb9c619))
* **children:** enable multiple @sync properties on a behavior ([c549ff86](http://github.com/aurelia/templating/commit/c549ff86be818bec2f8e25fdfd37207cabf9daa2))


### 0.12.1 (2015-06-09)


#### Bug Fixes

* **html-behavior:** add htmlName to element with behavior instance reference ([6e224d78](http://github.com/aurelia/templating/commit/6e224d785306c818143c6aab4589717862c154f8))


## 0.12.0 (2015-06-08)


#### Bug Fixes

* **behavior-instance:** update to semi private api usage based on change in binding ([fffba93f](http://github.com/aurelia/templating/commit/fffba93f8ebb48d3bed8589347467b8fe7885a43))
* **bindable-property:** publish custom getObserver on getter ([78238520](http://github.com/aurelia/templating/commit/7823852003408dcc0c86d1e0555336a21f53533b))
* **decorators:** throw on invalid behavior resource names ([b9c4a527](http://github.com/aurelia/templating/commit/b9c4a5279f8d6315859b1717786fadd9010fe858))
* **naming:** fixes naming issues ([2b5c1adb](http://github.com/aurelia/templating/commit/2b5c1adb1b2531866e2b4f7db4fd106defa63dd5))
* **view-engine:** address async loading issues and double loading ([ce82ab1f](http://github.com/aurelia/templating/commit/ce82ab1f4b40aea659bee2627c4c62613cc4be37))
* **view-factory:** template anchors converted to comment anchors ([2079480a](http://github.com/aurelia/templating/commit/2079480ad1ce3d8bc55b03564e7299481ab6a3dc))
* **view-slot:** add fallback for missing nextElementSibling ([7ae88b6f](http://github.com/aurelia/templating/commit/7ae88b6fccf92cc057a7964c952d3ff925301725))


#### Features

* **all:**
  * containerless custom elements ([710e5b38](http://github.com/aurelia/templating/commit/710e5b383bb621a8947019bda73498b58de56ef5))
  * support template part replacement ([1d9ba1c0](http://github.com/aurelia/templating/commit/1d9ba1c06563a12505dd4033ff24932a9f88007e), closes [#70](http://github.com/aurelia/templating/issues/70))
* **anim:** add animation events const ([0378ebe3](http://github.com/aurelia/templating/commit/0378ebe3482c2b023f360bc2774cfd76ad5faea6))
* **animator:** add extra animator methods ([3ad6e884](http://github.com/aurelia/templating/commit/3ad6e884de22021c0f3e578056831826c76b7c1a))
* **customAttribute:** enable defaultBindingMode for customAttribute ([91e503f7](http://github.com/aurelia/templating/commit/91e503f7d850e810ddb277f42a0ef5ff72e1909c))
* **html-behavior:** enable syncChildren on composed views ([ea15104e](http://github.com/aurelia/templating/commit/ea15104e73bb9edf38397a1ea69c844ff7bd1831), closes [#68](http://github.com/aurelia/templating/issues/68))
* **view-compiler:** support compiling of strings ([deb23a83](http://github.com/aurelia/templating/commit/deb23a8336ff84a6c8af221a95fed8df4c85f304), closes [#37](http://github.com/aurelia/templating/issues/37))
* **view-factory:** enable replacement parts to flow through to child templates ([3261af3b](http://github.com/aurelia/templating/commit/3261af3bb532eac3a87766413b3c69854f17aa5b))


### 0.11.2 (2015-05-06)


#### Bug Fixes

* **bindable-property:** use in operator to check for prop definition ([13bac7b9](http://github.com/aurelia/templating/commit/13bac7b9f6288549e3b187d6a6e5b0251fa24a72))


### 0.11.1 (2015-05-06)


#### Bug Fixes

* **bindable:** errors related to property definition ([9d26ad1d](http://github.com/aurelia/templating/commit/9d26ad1d601d54cfa61d3575ec0d15d8b6b26bf0))
* **useshadowdom-noview:** Create an empty shadow root when @noView is used ([66775dda](http://github.com/aurelia/templating/commit/66775ddae911c0ca15398fca9b853e30829e9de1))


## 0.11.0 (2015-04-30)


#### Bug Fixes

* **bindable:** problem with options object when place on a prop initializer ([8d23f132](http://github.com/aurelia/templating/commit/8d23f1329c7f689a36ebded56a37164255999212))
* **composition-engine:** ensure analysis of existing vm instances ([a6803f62](http://github.com/aurelia/templating/commit/a6803f620f8ed0fedac4dcb09a71001be48bc97e))
* **content-selector:** remove undefined variable ([6450a816](http://github.com/aurelia/templating/commit/6450a8165d9b3d76209098095440054030076839), closes [#48](http://github.com/aurelia/templating/issues/48))
* **decorators:** typo in bindable caused incorrect metadata define ([9f683df7](http://github.com/aurelia/templating/commit/9f683df715cf261a2c7e4056228e3319fa0121ec))
* **templating:** update to new bindingMode API ([95192b2f](http://github.com/aurelia/templating/commit/95192b2f7b3d465481f0efde4daadadc460ebf2d))
* **useShadowDOM:** set correct property on behavior ([a2cd7ac8](http://github.com/aurelia/templating/commit/a2cd7ac852b4a4319200b336cb7a4c6b5d6fc8e8), closes [#62](http://github.com/aurelia/templating/issues/62))


#### Features

* **all:** switch to new es7 metadata api ([bbe21bbe](http://github.com/aurelia/templating/commit/bbe21bbebf207e8d2059cca6e0dd6e1576da1e21))


### 0.10.3 (2015-04-12)


#### Bug Fixes

* **view-strategy:** typo in view strategy normalization ([831489ee](http://github.com/aurelia/templating/commit/831489ee838b586ac8ec5a3be9afb43649e2a6fa), closes [#54](http://github.com/aurelia/templating/issues/54))


### 0.10.2 (2015-04-11)


#### Bug Fixes

* **bindable-property:**
  * set default if not undefined ([98e479ad](http://github.com/aurelia/templating/commit/98e479ad621197db2335340cc7bea052e658bf76))
  * ensure changeHandler is always defined, but null by default ([6de4f87e](http://github.com/aurelia/templating/commit/6de4f87e5115819eaa1dc5ff2fab1febfd07ff8a))
* **html-behavior:** custom attrs with one property that is not value should be options ([8486dc45](http://github.com/aurelia/templating/commit/8486dc45a0196ffffbf2c2b9663cab538cfaf22b))
* **html-bheavior:** incorrect identification of options attributes ([ebef7461](http://github.com/aurelia/templating/commit/ebef746164c90feb1d9861f1a599eb4fb0925a25))


### 0.10.1 (2015-04-09)


#### Bug Fixes

* **CompositionEngine:** fix UseViewStrategy import ([5d2cd5c4](http://github.com/aurelia/templating/commit/5d2cd5c41670a8da62b9a9185edf1117e6d43b6e))
* **bindable-property:** regression in dynamic options for custom attributes ([7debc4b0](http://github.com/aurelia/templating/commit/7debc4b0312409b978b772791cce426a10dce5c3))


## 0.10.0 (2015-04-09)


#### Bug Fixes

* **BindableProperty:** added missing declaration ([0f0d0567](http://github.com/aurelia/templating/commit/0f0d0567c492aa997516ffc0e975b9fb8ac83449))
* **ChildObserverBinder:** remove dup target assign ([cb2f343a](http://github.com/aurelia/templating/commit/cb2f343a5aaacd08d959be7b7eafca2f6f89113a))
* **Decorators:** add missing parameter target ([7ccd5cee](http://github.com/aurelia/templating/commit/7ccd5cee89c5bce345618fecefbe8e42252acd16))
* **ElementConfigResource:** return promise in load ([89b52cb1](http://github.com/aurelia/templating/commit/89b52cb166e9ac0952de6e7aec87c9cfc9751828))
* **all:**
  * update compiler and improve core-js integration ([b43caf77](http://github.com/aurelia/templating/commit/b43caf77237a53d064183f317c632cd8d88d3c32))
  * bugs related to new behavior and decorator implementation ([65b7abde](http://github.com/aurelia/templating/commit/65b7abde78f4bb839eec9a8afbb06e2e0329c02a))
* **bindable-property:**
  * incorrect property names in ctor ([6c55c587](http://github.com/aurelia/templating/commit/6c55c5871f31501725df91a74b34384729901464))
  * remove invalid reference ([b5d2faee](http://github.com/aurelia/templating/commit/b5d2faeebde136662cdcf17be9d342bda1f41c58))
* **decorators:**
  * resolve issue with initializer targeted bindable decorator ([41819464](http://github.com/aurelia/templating/commit/41819464cadfb682dca913de8a23676da2013a7c))
  * more robust implementations to handle user variance ([c5fb9ef9](http://github.com/aurelia/templating/commit/c5fb9ef9ab4158381e631b7e84e65b4dba355ccf))
  * parameterless decorators should not return a function ([b3cb56e1](http://github.com/aurelia/templating/commit/b3cb56e1bb74cbd95dc0868a50f57cab1a456fe1))
* **html-behavior:**
  * add missing parameter to compile method ([c51fe1ee](http://github.com/aurelia/templating/commit/c51fe1eeab67b2a733cca7f1d110269ecabae4bc))
  * incorrect bindable property args ([df58e653](http://github.com/aurelia/templating/commit/df58e65318620b3499ead5525a5fc4468933e121))
  * bad dynamic options ref ([d0b122f7](http://github.com/aurelia/templating/commit/d0b122f7c9293c442e0891e918646efd0212361f))
  * incorrect property reference ([5d66373d](http://github.com/aurelia/templating/commit/5d66373d764d203b448d9d60b96f11e12f7b6562))
  * remove invalid reference ([3b02673c](http://github.com/aurelia/templating/commit/3b02673c009af030bc7c4cc7e6abb595b835a1b1))
* **view-strategy:** typo from rename ([c7cc8617](http://github.com/aurelia/templating/commit/c7cc861787e22e638d92270e94ddca3b57cb9ac2))


#### Features

* **all:** new decorator and behavior model ([7c7bc578](http://github.com/aurelia/templating/commit/7c7bc578313e23be4e773c9aa46d19b9f3c1c943))
* **bindableProperty:** enable decorator to work with ES7 property initializers ([773c5eed](http://github.com/aurelia/templating/commit/773c5eed3e4c0b841aeb913dcf17095572b0710f))
* **decorators:** rename bindableProperty to bindable ([b3f8a3b9](http://github.com/aurelia/templating/commit/b3f8a3b9b09528d43e947c141d0a199738fb1226))


## 0.9.0 (2015-03-25)


#### Bug Fixes

* **animator:** remove unused code from interface ([986267f6](http://github.com/aurelia/templating/commit/986267f6e73211618a3c3f659955ba55489f5b3a))
* **behavior:** not all attached/detached were cascaded ([31702e14](http://github.com/aurelia/templating/commit/31702e14f9da0bd844ef60d0dd375c7a375f3d7f), closes [#35](http://github.com/aurelia/templating/issues/35))
* **property:** correct if/else branch for dynamic notifications ([9f79cbb0](http://github.com/aurelia/templating/commit/9f79cbb0c1594cff372d774dae5b5ebb470d72be))
* **view:** first and last child should not be undefined ([43c076c5](http://github.com/aurelia/templating/commit/43c076c5882fe3dfea0c8ce3aeb5c7901bdf944f))
* **view-slot:**
  * Safari and IE are not spec compliant perhaps ([bc1ff2ba](http://github.com/aurelia/templating/commit/bc1ff2bae440e471accc088651f76701bc4311db))
  * improve null checks and array access ([af290c1f](http://github.com/aurelia/templating/commit/af290c1f75f8a78019a35909e15988e7a0fd756e))
  * add firstChild null checks ([d260bdb9](http://github.com/aurelia/templating/commit/d260bdb95e1772610c1083ca7ad6511fb5586d5a), closes [#34](http://github.com/aurelia/templating/issues/34))
  * add firstChild null checks ([a49411dd](http://github.com/aurelia/templating/commit/a49411ddf7b830acf70034babf19de6ea38947ca), closes [#34](http://github.com/aurelia/templating/issues/34))
  * correct null check against nextElementSibling ([9162eeb6](http://github.com/aurelia/templating/commit/9162eeb69bafe2d33b4e9e5e1d2715afbaa9301f))


#### Features

* **animator:** add mechanism for default animator configuration ([eb792bb1](http://github.com/aurelia/templating/commit/eb792bb11edfa78fec4fa8109da576d10c1b9d68))
* **resources:**
  * new, simplified and improved resource pipeline processing ([e6207812](http://github.com/aurelia/templating/commit/e620781248e53387e8a7ca16f778d931edbd7fba))
  * leverage new template loader api ([ee6fea9d](http://github.com/aurelia/templating/commit/ee6fea9d6a279881ec99817c757842082a9c09f6))
* **view-engine:** merge in and simplify resource coordinator ([a836fde9](http://github.com/aurelia/templating/commit/a836fde9efa1ed1efae983d94e13e2fa3872241f))
* **view-strategy:** enable exported view strategy and registry to be used for view models ([03790f85](http://github.com/aurelia/templating/commit/03790f85959a0e541ed0daf7b8c28ad37201c25c), closes [#13](http://github.com/aurelia/templating/issues/13))


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
