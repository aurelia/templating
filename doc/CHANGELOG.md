<a name="1.10.1"></a>
## [1.10.1](https://github.com/aurelia/templating/compare/1.10.0...1.10.1) (2018-10-30)


### Bug Fixes

* **doc:** fix html5 syntax ([8452a66](https://github.com/aurelia/templating/commit/8452a66)), closes [/github.com/aurelia/templating/pull/647#issuecomment-427989601](https://github.com//github.com/aurelia/templating/pull/647/issues/issuecomment-427989601)
* **Let:** mark as target after creating instrutions ([93fa9cc](https://github.com/aurelia/templating/commit/93fa9cc))
* **Let:** properly create instruction Id ([ac3cb2b](https://github.com/aurelia/templating/commit/ac3cb2b))
* **static-view-strategy:** correctly handles invalid resources ([4149e73](https://github.com/aurelia/templating/commit/4149e73))
* **static-view-strategy:** correctly loads multiple custom elements in single file ([c0e6204](https://github.com/aurelia/templating/commit/c0e6204))



<a name="1.10.0"></a>
# [1.10.0](https://github.com/aurelia/templating/compare/1.9.0...1.10.0) (2018-09-30)


### Bug Fixes

* **<let/>:** enable backward compat, fix doc ([90684ed](https://github.com/aurelia/templating/commit/90684ed))
* **Let:** respect DOM order ([dd4ff67](https://github.com/aurelia/templating/commit/dd4ff67))
* **test:** remove old implementation fix in test ([88cf718](https://github.com/aurelia/templating/commit/88cf718))
* **typings:** fix let expression typings ([a756dfe](https://github.com/aurelia/templating/commit/a756dfe))


### Features

* **Let:** let element for computed property declaration ([b898ef7](https://github.com/aurelia/templating/commit/b898ef7))



<a name="1.9.0"></a>
# [1.9.0](https://github.com/aurelia/templating/compare/1.8.3...1.9.0) (2018-09-25)


### Bug Fixes

* **StaticViewStrategy:** check for null template before compiling ([37d23ea](https://github.com/aurelia/templating/commit/37d23ea))
* **StaticViewStrategy:** use DOM.Element instead of HTMLTemplateElement ([f9fb639](https://github.com/aurelia/templating/commit/f9fb639))



<a name="1.8.3"></a>
## [1.8.3](https://github.com/aurelia/templating/compare/1.8.2...1.8.3) (2018-09-07)


### Bug Fixes

* **StaticViewStrategy:** set formal ".moduleId" ([86ea2fd](https://github.com/aurelia/templating/commit/86ea2fd))



<a name="1.8.2"></a>
## [1.8.2](https://github.com/aurelia/templating/compare/1.8.1...1.8.2) (2018-07-17)


### Bug Fixes

* **composition-engine:** align class and moduleId behaviour ([31aa677](https://github.com/aurelia/templating/commit/31aa677))
* **CompositionEngine:** ensure bind() after finishing composition ([55a09dc](https://github.com/aurelia/templating/commit/55a09dc))



<a name="1.8.0-rc.1"></a>
# [1.8.0-rc.1](https://github.com/aurelia/templating/compare/1.7.0...1.8.0-rc.1) (2018-06-20)


### Bug Fixes

* **BehaviorPropertyObserver:** use Object.is() for comparison ([bf8ec9a](https://github.com/aurelia/templating/commit/bf8ec9a))
* **child-observation:** unset property in unbind ([7989015](https://github.com/aurelia/templating/commit/7989015))
* **ShadowDOM:** unbind view when remove ([b4abe6e](https://github.com/aurelia/templating/commit/b4abe6e))
* **StaticViewStrategy:** adjust interface for doc ([65aef43](https://github.com/aurelia/templating/commit/65aef43))
* **view-slot:** fix return type ([66a86de](https://github.com/aurelia/templating/commit/66a86de))


### Features

* **CompositionEngine:** compose accepts view model constructor ([524dee4](https://github.com/aurelia/templating/commit/524dee4))
* **decorators:** add decorators for view / resource config ([2af6b28](https://github.com/aurelia/templating/commit/2af6b28))
* **resource:** aurelialess aurelia ([e7da973](https://github.com/aurelia/templating/commit/e7da973))
* **resources:** interop with custom element / attribute decorators ([e06668e](https://github.com/aurelia/templating/commit/e06668e))



<a name="1.7.0"></a>
# [1.7.0](https://github.com/aurelia/templating/compare/1.6.0...v1.7.0) (2017-12-20)


### Bug Fixes

* **view-compiler:** use attribute name ([5a2276c](https://github.com/aurelia/templating/commit/5a2276c)), closes [#575](https://github.com/aurelia/templating/issues/575)



<a name="1.6.0"></a>
# [1.6.0](https://github.com/aurelia/templating/compare/1.5.0...v1.6.0) (2017-10-16)


### Bug Fixes

* **view-engine:** define metadata for SlotCustomAttribute ([e3474bb](https://github.com/aurelia/templating/commit/e3474bb)), closes [#566](https://github.com/aurelia/templating/issues/566)
* **view-engine:** singleton instance of auSlotBehavior ([c08db20](https://github.com/aurelia/templating/commit/c08db20))


### Features

* **html-behavior:** enable processContent via custom attributes ([7096e66](https://github.com/aurelia/templating/commit/7096e66))



<a name="1.5.0"></a>
# [1.5.0](https://github.com/aurelia/templating/compare/1.4.2...v1.5.0) (2017-10-02)


### Bug Fixes

* **primaryProperty:** infinite recursion when used with template controller ([5b5ed56](https://github.com/aurelia/templating/commit/5b5ed56))
* **view-engine:** use .address in case of RegistryEntry ([ab1064c](https://github.com/aurelia/templating/commit/ab1064c))


### Features

* **html-behavior:** Allow inheritance of bindable properties for custom elements ([1209aa6](https://github.com/aurelia/templating/commit/1209aa6))


### Performance Improvements

* **view-engine:** simplify entry url acquisition ([f57cff9](https://github.com/aurelia/templating/commit/f57cff9))



<a name="1.4.1"></a>
## [1.4.1](https://github.com/aurelia/templating/compare/1.4.0...v1.4.1) (2017-04-05)

* Documentation update.

<a name="1.4.0"></a>
# [1.4.0](https://github.com/aurelia/templating/compare/1.3.0...v1.4.0) (2017-03-25)


### Bug Fixes

* **aliases:** add missing filters and test ([5ac9981](https://github.com/aurelia/templating/commit/5ac9981))
* **aliases:** filter aliases ([d00a7d0](https://github.com/aurelia/templating/commit/d00a7d0))
* **aliases:** move to html-behavior ([b659b22](https://github.com/aurelia/templating/commit/b659b22))
* **aliases:** place aliases on metadata ([24201fd](https://github.com/aurelia/templating/commit/24201fd))
* **html-behavior:** remove extraneous filter ([4536135](https://github.com/aurelia/templating/commit/4536135))
* **templating-engine:** enhanced views should attach ([5793d9c](https://github.com/aurelia/templating/commit/5793d9c))


### Features

* **alias:** process aliases for custom attributes ([7af0b42](https://github.com/aurelia/templating/commit/7af0b42))
* **decorators:** customAttribute accepts aliases ([e03c929](https://github.com/aurelia/templating/commit/e03c929))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/aurelia/templating/compare/1.2.0...v1.3.0) (2017-02-26)


### Bug Fixes

* **child-observation:** make property descriptor configurable ([7f07ffb](https://github.com/aurelia/templating/commit/7f07ffb)), closes [#520](https://github.com/aurelia/templating/issues/520)
* **swap:** fix missing return result/controller statement ([e464663](https://github.com/aurelia/templating/commit/e464663))
* **swap-strategies:** correct parameter name on with method ([bb6e09d](https://github.com/aurelia/templating/commit/bb6e09d))
* **view-slot:** check for undefined child ([47a04a7](https://github.com/aurelia/templating/commit/47a04a7))
* **view-slot:** eliminate double lookup ([8639ad5](https://github.com/aurelia/templating/commit/8639ad5))
* **ViewCompiler:** use primary prop's default binding mode ([3a350e8](https://github.com/aurelia/templating/commit/3a350e8))


### Features

* **swapOrder:** add swaporder property for concurrent enter/leave transitions ([6a77043](https://github.com/aurelia/templating/commit/6a77043))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/aurelia/templating/compare/1.1.4...v1.2.0) (2017-01-08)


### Bug Fixes

* Add return to hasAttribute and getAttribute ([1f8bb3a](https://github.com/aurelia/templating/commit/1f8bb3a))
* **composition-engine:** add "host" to CompositionContext ([b9d927c](https://github.com/aurelia/templating/commit/b9d927c))


### Features

* **HtmlBehavior:** primary property/bindable ([dd5ddfa](https://github.com/aurelia/templating/commit/dd5ddfa)), closes [aurelia/templating-binding#56](https://github.com/aurelia/templating-binding/issues/56)

### Performance

* **view-factory:** Avoid creating anonymous function for each containerless anchor.

<a name="1.1.4"></a>
## [1.1.4](https://github.com/aurelia/templating/compare/1.1.3...v1.1.4) (2016-12-03)


### Bug Fixes

* **view-compiler:** account for undefined element instruction ([d1d1fe4](https://github.com/aurelia/templating/commit/d1d1fe4)), closes [#503](https://github.com/aurelia/templating/issues/503)



<a name="1.1.3"></a>
## [1.1.3](https://github.com/aurelia/templating/compare/1.1.2...v1.1.3) (2016-12-03)


### Bug Fixes

* **view-compiler:** proper anchoring for containerless elements inside of a template controller ([0f12514](https://github.com/aurelia/templating/commit/0f12514))


### Performance Improvements

* **view-compiler:** remove unnecessary assignment ([ddde119](https://github.com/aurelia/templating/commit/ddde119))



<a name="1.1.1"></a>
## [1.1.1](https://github.com/aurelia/templating/compare/1.1.0...v1.1.1) (2016-09-29)


### Bug Fixes

* **BehaviorPropertyObserver:** publish immediately when TaskQueue already flushing ([06be105](https://github.com/aurelia/templating/commit/06be105)), closes [aurelia/binding#496](https://github.com/aurelia/binding/issues/496) [aurelia/binding#479](https://github.com/aurelia/binding/issues/479) [#363](https://github.com/aurelia/templating/issues/363)



<a name="1.1.0"></a>
# [1.1.0](https://github.com/aurelia/templating/compare/1.0.1...v1.1.0) (2016-09-07)


### Features

* **controller:** expose container ([8af0372](https://github.com/aurelia/templating/commit/8af0372))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/aurelia/templating/compare/1.0.0...v1.0.1) (2016-08-26)



<a name="1.0.0"></a>
# [1.0.0](https://github.com/aurelia/templating/compare/1.0.0-rc.1.0.3...v1.0.0) (2016-07-27)


### Features

* **interfaces.js:** add Component lifecycle interfaces ([3da0b9f](https://github.com/aurelia/templating/commit/3da0b9f))



<a name="1.0.0-rc.1.0.3"></a>
# [1.0.0-rc.1.0.3](https://github.com/aurelia/templating/compare/1.0.0-rc.1.0.2...v1.0.0-rc.1.0.3) (2016-07-25)


### Bug Fixes

* **html-behavior:** pass target to the underlying viewStrategy ([4764f4a](https://github.com/aurelia/templating/commit/4764f4a))


### Features

* **NoViewStrategy:** allow NoViewStrategy to have dependencies ([3be08fc](https://github.com/aurelia/templating/commit/3be08fc))
* **view-engine:** add a decorator for declaring requires on the ViewModel ([17472d4](https://github.com/aurelia/templating/commit/17472d4))



<a name="1.0.0-rc.1.0.2"></a>
# [1.0.0-rc.1.0.2](https://github.com/aurelia/templating/compare/1.0.0-rc.1.0.1...v1.0.0-rc.1.0.2) (2016-07-24)


### Bug Fixes

* **view-locator:** check 'origin.moduleId' instead of 'origin' ([9a4f587](https://github.com/aurelia/templating/commit/9a4f587))



<a name="1.0.0-rc.1.0.1"></a>
# [1.0.0-rc.1.0.1](https://github.com/aurelia/templating/compare/1.0.0-rc.1.0.0...v1.0.0-rc.1.0.1) (2016-07-12)


### Bug Fixes

* **double-uid:** ([#412](https://github.com/aurelia/templating/issues/412)) ([37d282d](https://github.com/aurelia/templating/commit/37d282d))
* **module-analyzer:** address circular refs in non-globals ([78cd3d3](https://github.com/aurelia/templating/commit/78cd3d3)), closes [#350](https://github.com/aurelia/templating/issues/350)
* **view-factory:** handle instructions directly on enhanced element ([b6630a9](https://github.com/aurelia/templating/commit/b6630a9)), closes [#318](https://github.com/aurelia/templating/issues/318)


### Features

* **decorators:** log exception in process attributes and process content ([a15773f](https://github.com/aurelia/templating/commit/a15773f)), closes [#330](https://github.com/aurelia/templating/issues/330)
* **view:** add more typing info ([1221383](https://github.com/aurelia/templating/commit/1221383)), closes [#370](https://github.com/aurelia/templating/issues/370)



<a name="1.0.0-rc.1.0.0"></a>
# [1.0.0-rc.1.0.0](https://github.com/aurelia/templating/compare/1.0.0-beta.3.0.6...v1.0.0-rc.1.0.0) (2016-06-22)



<a name="1.0.0-beta.3.0.6"></a>
# [1.0.0-beta.3.0.6](https://github.com/aurelia/templating/compare/1.0.0-beta.3.0.5...v1.0.0-beta.3.0.6) (2016-06-19)


### Bug Fixes

* **shadow-dom:** handle elements with no content ([aecc83a](https://github.com/aurelia/templating/commit/aecc83a)), closes [#388](https://github.com/aurelia/templating/issues/388)



### 1.0.0-beta.2.0.1 (2016-05-31)


#### Features

* **view-resources:** enable arbitrary named value resolution ([4f85ecf9](http://github.com/aurelia/templating/commit/4f85ecf97a3176e6f3d61a554e5351562771af38))


### 1.0.0-beta.2.0.0 (2016-05-23)

* Shadow DOM v1 Slots Implementation
* TemplatingEngine test methods removes. They are replaced by the new templating library.

### 1.0.0-beta.1.2.7 (2016-05-12)


### 1.0.0-beta.1.2.6 (2016-05-10)


### 1.0.0-beta.1.2.5 (2016-05-05)


#### Features

* **view-compiler:** add element to processAttributes ([d753e672](http://github.com/aurelia/templating/commit/d753e672b2a0ca6069e9fdfcd1a71458ee9c30e0))


### 1.0.0-beta.1.2.4 (2016-05-03)


### 1.0.0-beta.1.2.3 (2016-04-29)


#### Bug Fixes

* **templating-engine:** allow for overrideContext in enhance ([49c99edf](http://github.com/aurelia/templating/commit/49c99edf254d3102feae8e1cac6f9edb292b109c))


#### Features

* **ViewSlot:**
  * allow removal of many views at once to avoid a race condition ([4b1005b9](http://github.com/aurelia/templating/commit/4b1005b91213a26ff726f9ae29aea7ac09353330))
  * moving Views across the slot ([02e59ef1](http://github.com/aurelia/templating/commit/02e59ef14051a2a03f9d5d2dbd8a0b6e9cb45c17))
* **view:** reference creator container ([9431f536](http://github.com/aurelia/templating/commit/9431f536e6d57ce8ef654eea872c8d795ea02fd5))


### 1.0.0-beta.1.2.2 (2016-04-13)


#### Bug Fixes

* **module-analyzer:** ensure correct cache lookup ([eefd4c69](http://github.com/aurelia/templating/commit/eefd4c69a27d058e607b94e1d1b99582411d021b))
* **view-resources:** ensure correct cache lookup ([53b51902](http://github.com/aurelia/templating/commit/53b519021e0890f2ec045597ee7ef04f49bf283a))


### 1.0.0-beta.1.2.1 (2016-03-29)


#### Bug Fixes

* **BindableProperty:** enable specifying oneTime default binding mode ([a557aade](http://github.com/aurelia/templating/commit/a557aade002133144fa2e2106066d26af2037d78), closes [#298](http://github.com/aurelia/templating/issues/298))
* **View:** preserve bindingContext while unbinding ([ae6feed0](http://github.com/aurelia/templating/commit/ae6feed008ee19dfb0ad9204c562a845c11213ef))
* **view:** incorrect input to dynamic binding ([2069af08](http://github.com/aurelia/templating/commit/2069af0880057858b7758f67faf4f2f9ccdbc96f))


### 1.0.0-beta.1.2.0 (2016-03-22)


#### Bug Fixes

* **bindable-property:** fix typo in comment ([dfde78aa](http://github.com/aurelia/templating/commit/dfde78aa1f261f3664bb0a722e099d5f2f64065f), closes [#291](http://github.com/aurelia/templating/issues/291))


#### Features

* **ViewSlot:** save override context during binding for later eval ([657ff3dc](http://github.com/aurelia/templating/commit/657ff3dc94415bc1c2330b389de208880fdcc5f5))
* **view:** add new view pipeline hooks beforeBind and beforeUnbind ([e39e052b](http://github.com/aurelia/templating/commit/e39e052b93c7aa5f17bf47c3fa02703eb8c8c3f3))


### 1.0.0-beta.1.1.4 (2016-03-04)


#### Bug Fixes

* **composition-engine:** complete composition work on null ([02b8f3d9](http://github.com/aurelia/templating/commit/02b8f3d9bb9446290cfc15d0d0148cfa07bb29c5))


### 1.0.0-beta.1.1.3 (2016-03-04)


#### Bug Fixes

* **element-config:** fix parameter name typo ([000f0de3](http://github.com/aurelia/templating/commit/000f0de38e6abb70244f94a2c189db485ce7bf1b))


### 1.0.0-beta.1.1.2 (2016-03-01)


#### Bug Fixes

* **all:** remove core-js ([0e264f85](http://github.com/aurelia/templating/commit/0e264f853f28fdbf4f497e9b14c93d1a120d41f9))
* **bower:** remove core-js ([942c4b66](http://github.com/aurelia/templating/commit/942c4b66f4c3d62aed0977ebfd4eca18cf64ddb9))
* **composition-transaction:** simplify ([82f52aaa](http://github.com/aurelia/templating/commit/82f52aaad7ea91d2688d9a257525abf0b4df393b))
* **decorators:** hyphenate behavior names with warning ([473ca6af](http://github.com/aurelia/templating/commit/473ca6afd2fd5d830acadd873710d62f8799ca34), closes [#279](http://github.com/aurelia/templating/issues/279))


#### Features

* **composition:**
  * enable composition transaction use ([b8e51df0](http://github.com/aurelia/templating/commit/b8e51df0c2d94254172eca53b66031a37664bc91))
  * introduce composition transaction ([2f2e156f](http://github.com/aurelia/templating/commit/2f2e156fbe1983f9d600345a5afd3a5054e5ba21))


### 1.0.0-beta.1.1.1 (2016-02-08)


#### Features

* **html-behavior:** add processAttributes for custom elements ([f6c7d71f](http://github.com/aurelia/templating/commit/f6c7d71fcdf42248fb5c7ef78424b20b687d0fda))
* **view-compiler:** implement as-element ([3ec30ee5](http://github.com/aurelia/templating/commit/3ec30ee59eeef789cc0ad0c4022ad52fc59b2039), closes [#305](http://github.com/aurelia/templating/issues/305))
* **view-factory:** enable injection and auto-unbind of ElementEvents ([842014fd](http://github.com/aurelia/templating/commit/842014fd6ede2ec88906158d8afff8b4ab84487c))


### 1.0.0-beta.1.1.0 (2016-01-29)


#### Bug Fixes

* **Controller:** handle scope inheritance in template part with repeat Related to #244 ([9a488c44](http://github.com/aurelia/templating/commit/9a488c44e86872c91b2f86953519c8ef7308a262))
* **controller:** stop element from inheriting scope ([a3ced53d](http://github.com/aurelia/templating/commit/a3ced53d67749244a6ea61d5193b04330e392bfc))


#### Features

* **all:** update jspm meta; core-js; aurelia-deps ([bdff3232](http://github.com/aurelia/templating/commit/bdff323282ebd7228063cb08a961a3258215fcea))


### 1.0.0-beta.1.0.3 (2016-01-08)


#### Bug Fixes

* **composition:** properly handle the created callback during dynamic composition ([9b61a681](http://github.com/aurelia/templating/commit/9b61a681fe6dd7c240a0db13dd13885d430c79a1))


### 1.0.0-beta.1.0.2 (2015-12-16)


#### Bug Fixes

* **content-selector:** incorrection projection in nested scenarios ([2e248676](http://github.com/aurelia/templating/commit/2e248676635b6f7c698894e06056f1bd0e11603e), closes [#231](http://github.com/aurelia/templating/issues/231))


## 1.0.0-beta.1.0.1 (2015-12-03)


#### Bug Fixes

* **composition:** bindable bug on composed instances ([fea62558](http://github.com/aurelia/templating/commit/fea62558a63adf3da9f3df7d6944b8efd84e7016))
* **view-compiler:** pass options info to binding lang ([435d1a15](http://github.com/aurelia/templating/commit/435d1a155942f2cf49a9fcfd4e11ea78d57b31ca), closes [#73](http://github.com/aurelia/templating/issues/73))


### 1.0.0-beta.1 (2015-11-16)


### 0.17.5 (2015-11-15)


#### Features

* **controller:** pass not only the owningView to the view-model, but the component's view as well ([5ee79b74](http://github.com/aurelia/templating/commit/5ee79b74a3c7c30ebd95ad34a596f7fed5a0d807))


### 0.17.4 (2015-11-12)


#### Bug Fixes

* **child-observation:** undefined selector and change handler ([b3db0fdd](http://github.com/aurelia/templating/commit/b3db0fddd0c2bd591919df1c830b1e293e3f8f22), closes [#207](http://github.com/aurelia/templating/issues/207))


### 0.17.3 (2015-11-11)


#### Bug Fixes

* **CompositionEngine:** flow overrideContext ([ac02cb7d](http://github.com/aurelia/templating/commit/ac02cb7d5fa1de57bdfe5b0eb480543673a22afb))


### 0.17.2 (2015-11-11)


#### Bug Fixes

* **child-observation:** make decorators more TS friendly ([7cf89017](http://github.com/aurelia/templating/commit/7cf89017d895c6b025e1e4141bc1903dd2f26fe8))
* **controller:** expose some key properties for TS ([20be68fa](http://github.com/aurelia/templating/commit/20be68fa2f818ebcf46df9b356f425c6e9727c2a))
* **decorators:** make TS happier ([d02ac893](http://github.com/aurelia/templating/commit/d02ac893c3e45dcf08d4098ca86f13115ee45c5a))
* **view-resources:** make more api public ([97dc31cd](http://github.com/aurelia/templating/commit/97dc31cd46201e9cc4a7e47b359b2ae96ea1fa02))


### 0.17.1 (2015-11-10)


#### Bug Fixes

* **view-locator:** bad reference to viewStrategy ([cb72feda](http://github.com/aurelia/templating/commit/cb72fedab260cfded37a35bf15bcc18a33d0d1a4))


## 0.17.0 (2015-11-10)


#### Bug Fixes

* **CompositionEngine:** use context.viewModel ([07b6cc92](http://github.com/aurelia/templating/commit/07b6cc92823a62c820a9b26fd1d0a50136f98f0e))
* **all:**
  * privitize the hyphenate utility ([ed8968de](http://github.com/aurelia/templating/commit/ed8968ded292fb7e8f121f56a69658da4eb37a01))
  * better parameter order for resource load ([dc7ce4f0](http://github.com/aurelia/templating/commit/dc7ce4f08905c51d3ac5739fd9813093f5584776))
  * linting, locking down apis, adding types and documenting ([4e163164](http://github.com/aurelia/templating/commit/4e16316449bf71d96de3987f21037568b7651bb8))
  * improve internal representations and fix bugs in static/dynamic views ([7f970da1](http://github.com/aurelia/templating/commit/7f970da107a3e59a1052fde50a4c5b3a11d85931))
  * conflicts in user controlled views and automated controllers ([49576015](http://github.com/aurelia/templating/commit/49576015b734dd6bf3b1208c64bae0fb6c1ca24f))
  * more consistent internal state for controller, view and view-slot ([281edf4b](http://github.com/aurelia/templating/commit/281edf4bfa714b23e018a63f7ba40a3af342c596))
  * update to latest template registry entry api ([fa5ad967](http://github.com/aurelia/templating/commit/fa5ad9675b7303f98b5c3b52adacaa6efed65195))
* **bind:** overrideContext fixes ([936bf482](http://github.com/aurelia/templating/commit/936bf48207abf3a9abb0f91f86989ef3877c28a3))
* **build:** add view locator to build ([404c984f](http://github.com/aurelia/templating/commit/404c984f450047d3ec0597ef71f4aaa74c618a90))
* **child-observation:**
  * bug in decorator and undefined value ([be2044bd](http://github.com/aurelia/templating/commit/be2044bd8c203d6f0e788a4a920c935b704c4ce4))
  * null reference when adding second child observer ([b5fb1691](http://github.com/aurelia/templating/commit/b5fb1691fa26191f19db7414d6096c3d3cf9d045))
* **controller:**
  * make static vs. dynamic element binding order consistent ([bd41b22d](http://github.com/aurelia/templating/commit/bd41b22d7e0ed0cefb3837d2383892a01ea89632))
  * correct view override context binding ([6a962e4a](http://github.com/aurelia/templating/commit/6a962e4a486499c927f053f821cdf626571117cc))
* **decorators:** work with new decorators api ([003b92c9](http://github.com/aurelia/templating/commit/003b92c980e93a253963be64e49347ba9246b0a5))
* **html-behavior:** child bindings always operate on the light dom element ([2f2a13e7](http://github.com/aurelia/templating/commit/2f2a13e73b535f074612add53608ddc18b6b81a1))
* **templating-engine:**
  * rename createModelForUnitTest to createViewModelForUnitTest ([070137e3](http://github.com/aurelia/templating/commit/070137e312a9df0f0df2f7ca61ba91b2f1c06c71))
  * make object into a class ([65ef597c](http://github.com/aurelia/templating/commit/65ef597c23b505d2bf22af1ff3dc98dfaf8b3b4c))
* **view-factory:** update to latest container api ([a34e7be7](http://github.com/aurelia/templating/commit/a34e7be728f434b297502e7b2b7e450c034c3d32))
* **view-slot:** remove unused swap and move ([64160e35](http://github.com/aurelia/templating/commit/64160e357cc94f557cd9428874a4bc2a723373ea))


#### Features

* **all:**
  * finish api lockdown and code docs ([078bac07](http://github.com/aurelia/templating/commit/078bac074b485e5e33c217039ed7e79f683aa67c))
  * more docs and api cleanup ([78018c83](http://github.com/aurelia/templating/commit/78018c83e3f48a22d86dc6838afaf4d461f3d13c))
  * more docs and api refinement ([f884cca3](http://github.com/aurelia/templating/commit/f884cca3944e0b127c2d8578dc348ba3211d244e))
  * introduce ViewLocator; multiple breaking changes for view strategies ([3f08759a](http://github.com/aurelia/templating/commit/3f08759a11cb1a945536461c78931e51037f0b3d))
  * update to new scope with override context ([dbec9d3c](http://github.com/aurelia/templating/commit/dbec9d3c80f96fd873639b627d8929c227f9d9d2))
  * decouple create vs. bind operations entirely ([86902240](http://github.com/aurelia/templating/commit/86902240b942c1be52869435f012d0ddb6f10895))
  * work on templating engine facade ([dce2aa2d](http://github.com/aurelia/templating/commit/dce2aa2dd3eae9344c919ae1cb6779a2eaaa3b70))
* **binding-behaviors:** add binding behavior resource ([92f4d79b](http://github.com/aurelia/templating/commit/92f4d79bf461a75f9ef7c7655eab150f57b558f6))
* **children:** change sync to children decorator and add child ([a561546d](http://github.com/aurelia/templating/commit/a561546d9c88bbf0ab42f16d4f5cdcd3a5ebf9f8))
* **view:** ensure that refs, child and children are available in the bind callback ([09a9a335](http://github.com/aurelia/templating/commit/09a9a335af91ddeb7f220f6d014290c0da425b8e))


## 0.16.0 (2015-10-13)


#### Bug Fixes

* **BindableProperty:**
  * use strict equality operators ([5128617a](http://github.com/aurelia/templating/commit/5128617ad02a5330250624669e67e0a4ac164f32), closes [#100](http://github.com/aurelia/templating/issues/100))
  * added missing declaration ([0f0d0567](http://github.com/aurelia/templating/commit/0f0d0567c492aa997516ffc0e975b9fb8ac83449))
* **ChildObserverBinder:** remove dup target assign ([cb2f343a](http://github.com/aurelia/templating/commit/cb2f343a5aaacd08d959be7b7eafca2f6f89113a))
* **CompositionEngine:** fix UseViewStrategy import ([5d2cd5c4](http://github.com/aurelia/templating/commit/5d2cd5c41670a8da62b9a9185edf1117e6d43b6e))
* **Decorators:** add missing parameter target ([7ccd5cee](http://github.com/aurelia/templating/commit/7ccd5cee89c5bce345618fecefbe8e42252acd16))
* **ElementConfigResource:** return promise in load ([89b52cb1](http://github.com/aurelia/templating/commit/89b52cb166e9ac0952de6e7aec87c9cfc9751828))
* **HtmlBehaviorResource:** missing declaration in compile method ([6f43d688](http://github.com/aurelia/templating/commit/6f43d688b63a67cd8ce4cacbf100e2187a69a6e4))
* **View:** plug memory leak ([f4c0e9bf](http://github.com/aurelia/templating/commit/f4c0e9bfdad1bdb6a2beffb8e21dd85930cd4213))
* **ViewCompiler:**
  * clear class attributes containing interpolation expressions ([92aa047b](http://github.com/aurelia/templating/commit/92aa047bdbc39ee0c0a5181887df4368343f79df), closes [#99](http://github.com/aurelia/templating/issues/99))
  * handle undefined instruction attributes ([0f6761b8](http://github.com/aurelia/templating/commit/0f6761b89aba2ab48a98738a44b656b53699e80d))
  * handle adjacent text nodes ([a6db7f30](http://github.com/aurelia/templating/commit/a6db7f30532cdd8ca1401c041c7052ff52ec8644))
* **all:**
  * update to new metadata/decorators casing change for consistency ([a57aa890](http://github.com/aurelia/templating/commit/a57aa89005242e6463cfeba759c41223158384ba))
  * rename executionContext to bindingContext ([9f5437bf](http://github.com/aurelia/templating/commit/9f5437bf641026b9a6dfb6d918be272198861962))
  * correct some types ([4ed12313](http://github.com/aurelia/templating/commit/4ed123138550c315862d1bdde01a5c691e88853e))
  * cleanup and improving api ([9cb96ff8](http://github.com/aurelia/templating/commit/9cb96ff825519f38b9998d5936431c2b61038856))
  * code cleanup and api stabilization work ([c0220a8d](http://github.com/aurelia/templating/commit/c0220a8da78edee893800958df020da3888a2ed3))
  * improve several d.ts definitions with better type info ([51cad257](http://github.com/aurelia/templating/commit/51cad25703786f4edfaa5e08db2ef2c8bf5fc126), closes [#132](http://github.com/aurelia/templating/issues/132))
  * use new metadata api ([b5ff3fe0](http://github.com/aurelia/templating/commit/b5ff3fe0a41b723f5d94ad70614f3d42e6e4c3ac))
  * update compiler and improve core-js integration ([b43caf77](http://github.com/aurelia/templating/commit/b43caf77237a53d064183f317c632cd8d88d3c32))
  * bugs related to new behavior and decorator implementation ([65b7abde](http://github.com/aurelia/templating/commit/65b7abde78f4bb839eec9a8afbb06e2e0329c02a))
  * improve metadata dsl ([0ce71d74](http://github.com/aurelia/templating/commit/0ce71d74bb5cc6692d0b878a24301ccaa79d9e9d))
  * update to work with new metadata api ([8cc938a7](http://github.com/aurelia/templating/commit/8cc938a726ef3cb8bbe64f5ced71c1e53022f766))
  * rename Filter to ValueConverter ([f0963214](http://github.com/aurelia/templating/commit/f0963214a34478dbf5de3e67376bdd29de90817a))
* **anim:**
  * local variable instead dereferencing ([2c033daf](http://github.com/aurelia/templating/commit/2c033daf4efd0f69af6572af64543763f08c8a24))
  * Only call animations if anim-class set ([8bf15dce](http://github.com/aurelia/templating/commit/8bf15dce0ed83834c4fecf8d61ff53fefe60b077))
  * Opt-In Animator ([02d83dd7](http://github.com/aurelia/templating/commit/02d83dd78126d45e2966aecf6a8bb8dcfc245314))
  * element enter fix ([172428e3](http://github.com/aurelia/templating/commit/172428e3f942f7e9c61e7afb9efb9729fbeef460))
* **animator:**
  * should be able to add/remove css classes ([7d220859](http://github.com/aurelia/templating/commit/7d220859e1e169e35a8bc4984dc493018667670c))
  * remove unused code from interface ([986267f6](http://github.com/aurelia/templating/commit/986267f6e73211618a3c3f659955ba55489f5b3a))
* **behavior:**
  * not all attached/detached were cascaded ([31702e14](http://github.com/aurelia/templating/commit/31702e14f9da0bd844ef60d0dd375c7a375f3d7f), closes [#35](http://github.com/aurelia/templating/issues/35))
  * removed behavior base class ([2121d137](http://github.com/aurelia/templating/commit/2121d13752ffa6936a89f6b01fe00945d126310a))
* **behavior-instance:**
  * update to semi private api usage based on change in binding ([fffba93f](http://github.com/aurelia/templating/commit/fffba93f8ebb48d3bed8589347467b8fe7885a43))
  * classic loop, function var bug ([359749a4](http://github.com/aurelia/templating/commit/359749a43b8cdfc669f4f7c7a9796db3a31d67cd))
* **bindable:**
  * bindable cannot be undefined ([d3e990be](http://github.com/aurelia/templating/commit/d3e990be5b52cc44c58c6ee4a32ba458d7e00ecc))
  * errors related to property definition ([9d26ad1d](http://github.com/aurelia/templating/commit/9d26ad1d601d54cfa61d3575ec0d15d8b6b26bf0))
  * problem with options object when place on a prop initializer ([8d23f132](http://github.com/aurelia/templating/commit/8d23f1329c7f689a36ebded56a37164255999212))
* **bindable-property:**
  * publish custom getObserver on getter ([78238520](http://github.com/aurelia/templating/commit/7823852003408dcc0c86d1e0555336a21f53533b))
  * use in operator to check for prop definition ([13bac7b9](http://github.com/aurelia/templating/commit/13bac7b9f6288549e3b187d6a6e5b0251fa24a72))
  * set default if not undefined ([98e479ad](http://github.com/aurelia/templating/commit/98e479ad621197db2335340cc7bea052e658bf76))
  * ensure changeHandler is always defined, but null by default ([6de4f87e](http://github.com/aurelia/templating/commit/6de4f87e5115819eaa1dc5ff2fab1febfd07ff8a))
  * regression in dynamic options for custom attributes ([7debc4b0](http://github.com/aurelia/templating/commit/7debc4b0312409b978b772791cce426a10dce5c3))
  * incorrect property names in ctor ([6c55c587](http://github.com/aurelia/templating/commit/6c55c5871f31501725df91a74b34384729901464))
  * remove invalid reference ([b5d2faee](http://github.com/aurelia/templating/commit/b5d2faeebde136662cdcf17be9d342bda1f41c58))
* **build:**
  * ViewEngine depends on ModuleAnalyzer ([8cdfd0e5](http://github.com/aurelia/templating/commit/8cdfd0e5e9144b608abeb654626619771e4e2157))
  * update linting, testing and tools ([6ab627dc](http://github.com/aurelia/templating/commit/6ab627dc6a36505b2e6f299fd488218e3b6ca0f1))
  * missed adding new file ([121ca640](http://github.com/aurelia/templating/commit/121ca6406b3444d1d4bc33c90a70009cfe5e66ee))
  * add missing bower bump ([4484ea7f](http://github.com/aurelia/templating/commit/4484ea7f302d0faca3a0f48b218b9a0b8a00bd46))
* **children:**
  * delay change handler check for child sync ([e56f0350](http://github.com/aurelia/templating/commit/e56f03503fd2a1b3a3e59e93e63112bfb6f3df29))
  * child sync can now decorate a property ([745c7c00](http://github.com/aurelia/templating/commit/745c7c00f46add7a4cd0a40d937b315e752b6d15))
* **composition-engine:**
  * missed required compilation instruction in view only branch ([c3784f0a](http://github.com/aurelia/templating/commit/c3784f0acb0d49688f031993013545f349426ba0))
  * ensure analysis of existing vm instances ([a6803f62](http://github.com/aurelia/templating/commit/a6803f620f8ed0fedac4dcb09a71001be48bc97e))
  * fix syntax error ([f87668da](http://github.com/aurelia/templating/commit/f87668da917b9fe2ddc0dfa944c29ae9fdd66a4a))
  * ensure that bind callbacks execute ([74048922](http://github.com/aurelia/templating/commit/7404892281600785fe71bd6c438374301fbd3f81))
  * more consistent api ([ab419d1a](http://github.com/aurelia/templating/commit/ab419d1a32f0329be5c50f5049d40e66b6db3ad1))
  * do not require view resources ([82bbbdad](http://github.com/aurelia/templating/commit/82bbbdad07fc8a1470cf4331129571380cc99dd2))
* **content-selector:** remove undefined variable ([6450a816](http://github.com/aurelia/templating/commit/6450a8165d9b3d76209098095440054030076839), closes [#48](http://github.com/aurelia/templating/issues/48))
* **decorators:**
  * remove deprecated skipContentProcessing decorator ([aa8879bf](http://github.com/aurelia/templating/commit/aa8879bfb1734b1b6c1eab9a733734b74bbd9ffc))
  * property defaultBindingMode in customAttribute decorator is optional ([11556537](http://github.com/aurelia/templating/commit/11556537f94b2ef7aa3636738040255ead901dad))
  * throw on invalid behavior resource names ([b9c4a527](http://github.com/aurelia/templating/commit/b9c4a5279f8d6315859b1717786fadd9010fe858))
  * typo in bindable caused incorrect metadata define ([9f683df7](http://github.com/aurelia/templating/commit/9f683df715cf261a2c7e4056228e3319fa0121ec))
  * resolve issue with initializer targeted bindable decorator ([41819464](http://github.com/aurelia/templating/commit/41819464cadfb682dca913de8a23676da2013a7c))
  * more robust implementations to handle user variance ([c5fb9ef9](http://github.com/aurelia/templating/commit/c5fb9ef9ab4158381e631b7e84e65b4dba355ccf))
  * parameterless decorators should not return a function ([b3cb56e1](http://github.com/aurelia/templating/commit/b3cb56e1bb74cbd95dc0868a50f57cab1a456fe1))
* **dom:**
  * return firstElementChild from parsed template markup ([ea230c84](http://github.com/aurelia/templating/commit/ea230c84f80ac629db6d0add4c1429d5b6fe2f9e))
  * string parsing of views now requires a template tag ([45113364](http://github.com/aurelia/templating/commit/45113364cbe00f91790a64be3a2d0c07144c549c))
* **html-behavior:**
  * remove double compile of template parts ([49a5ad79](http://github.com/aurelia/templating/commit/49a5ad79072791352b2c1db58e4f009fa861a456))
  * do not override DOMBoundary for containerless elements ([d3c2ba4e](http://github.com/aurelia/templating/commit/d3c2ba4eeebd8a08dca6cb15d6ee377af4698e52))
  * enable recursive elements when loaded by router first ([e82f44ce](http://github.com/aurelia/templating/commit/e82f44ce8e351ad86f42af342609b67eb9ac50ee))
  * add htmlName to element with behavior instance reference ([6e224d78](http://github.com/aurelia/templating/commit/6e224d785306c818143c6aab4589717862c154f8))
  * custom attrs with one property that is not value should be options ([8486dc45](http://github.com/aurelia/templating/commit/8486dc45a0196ffffbf2c2b9663cab538cfaf22b))
  * add missing parameter to compile method ([c51fe1ee](http://github.com/aurelia/templating/commit/c51fe1eeab67b2a733cca7f1d110269ecabae4bc))
  * incorrect bindable property args ([df58e653](http://github.com/aurelia/templating/commit/df58e65318620b3499ead5525a5fc4468933e121))
  * bad dynamic options ref ([d0b122f7](http://github.com/aurelia/templating/commit/d0b122f7c9293c442e0891e918646efd0212361f))
  * incorrect property reference ([5d66373d](http://github.com/aurelia/templating/commit/5d66373d764d203b448d9d60b96f11e12f7b6562))
  * remove invalid reference ([3b02673c](http://github.com/aurelia/templating/commit/3b02673c009af030bc7c4cc7e6abb595b835a1b1))
* **html-bheavior:** incorrect identification of options attributes ([ebef7461](http://github.com/aurelia/templating/commit/ebef746164c90feb1d9861f1a599eb4fb0925a25))
* **module-analyzer:** correct some promise types in the d.ts ([d025abf0](http://github.com/aurelia/templating/commit/d025abf0ea17792a7e56bf5d54120fed3790f837))
* **naming:** fixes naming issues ([2b5c1adb](http://github.com/aurelia/templating/commit/2b5c1adb1b2531866e2b4f7db4fd106defa63dd5))
* **package:**
  * change jspm directories ([9ef08cfd](http://github.com/aurelia/templating/commit/9ef08cfd9596600b161ed7c686f53b15cfdaa5de))
  * update dependencies ([4a3489f9](http://github.com/aurelia/templating/commit/4a3489f983b75f194f38b0142fd4fe2ee3680184))
  * update deps and fix bower semver ranges ([5ead6b7f](http://github.com/aurelia/templating/commit/5ead6b7fb19fd4782735526ef8fa188b5917a8b4))
  * update dependencies ([b9a0f1e9](http://github.com/aurelia/templating/commit/b9a0f1e9bd6dda4d62ec6008e93c71a9884deb80))
  * update Aurelia dependencies ([c78936bf](http://github.com/aurelia/templating/commit/c78936bf39d5a81d084c1252c6b72913dd8fd4e4))
  * update path to the latest version ([a173b15c](http://github.com/aurelia/templating/commit/a173b15cf1d50677dfafb3143bc19d0e6b6720b8))
  * updated dependencies to latest versions ([cdcfd6dd](http://github.com/aurelia/templating/commit/cdcfd6dd425f76e17689e645a5aad2f323a4fd40))
  * update dependencies to latest ([c5ba425c](http://github.com/aurelia/templating/commit/c5ba425c1faa51955609067023a486b69c11a528))
  * update dependencies to latest versions ([6d3a3b96](http://github.com/aurelia/templating/commit/6d3a3b966f7dbf94a88de5cf440cad5894962f3a))
  * add missing polyfills ([bd751f7c](http://github.com/aurelia/templating/commit/bd751f7c2a40e7025ac35dfd563024f608c35474))
* **property:**
  * correct if/else branch for dynamic notifications ([9f79cbb0](http://github.com/aurelia/templating/commit/9f79cbb0c1594cff372d774dae5b5ebb470d72be))
  * prevent errors with property meta on composed view models ([0c9ef978](http://github.com/aurelia/templating/commit/0c9ef97870d4174346c55bcf04b7726a286749b6))
  * ensure default binding mode is set ([e507251e](http://github.com/aurelia/templating/commit/e507251e19f1c5bf55d11c40fcdb7237d2b63d2e))
* **resource coordinator:** fix error when returning function from amd module ([21d6cb0d](http://github.com/aurelia/templating/commit/21d6cb0d605a66212b1d9d1d0f2cc9890351017a))
* **resource-coordinator:**
  * regression in local auto-imports ([8ec09095](http://github.com/aurelia/templating/commit/8ec090957ef33afbf0388427b378b203937a99eb))
  * do not cache dynamic view models ([a29f2bc2](http://github.com/aurelia/templating/commit/a29f2bc2a8a8c3fc40265b310646587ee0601d55))
  * incorrectly setting analyzed module ids ([7fa47357](http://github.com/aurelia/templating/commit/7fa47357408aedca21eb882a89c3bf8e43560e7b))
* **resource-coorindator:** return full info for view model load ([78d1b875](http://github.com/aurelia/templating/commit/78d1b875db07fd20050e7582ccb09abd8637ee15))
* **resource-registry:** symbol was not correctly exported ([bb395edf](http://github.com/aurelia/templating/commit/bb395edf701d58dc814859975f219739174c4a39))
* **resources:** enable early name analysis of resources ([331fcfd1](http://github.com/aurelia/templating/commit/331fcfd1341acab1c0cc65a103c3951cd047ca6b))
* **templating:**
  * Use correct import for core-js We were previously using `import core from core-j ([29e4a62b](http://github.com/aurelia/templating/commit/29e4a62b96e594431682682259d852256c46af4b))
  * update to new bindingMode API ([95192b2f](http://github.com/aurelia/templating/commit/95192b2f7b3d465481f0efde4daadadc460ebf2d))
* **useShadowDOM:** set correct property on behavior ([a2cd7ac8](http://github.com/aurelia/templating/commit/a2cd7ac852b4a4319200b336cb7a4c6b5d6fc8e8), closes [#62](http://github.com/aurelia/templating/issues/62))
* **useshadowdom-noview:** Create an empty shadow root when @noView is used ([66775dda](http://github.com/aurelia/templating/commit/66775ddae911c0ca15398fca9b853e30829e9de1))
* **view:**
  * first and last child should not be undefined ([43c076c5](http://github.com/aurelia/templating/commit/43c076c5882fe3dfea0c8ce3aeb5c7901bdf944f))
  * process bindings before behavior binds ([4e26198b](http://github.com/aurelia/templating/commit/4e26198b16e13e1b9002235ab6bc07673f3243c2))
* **view-compiler:**
  * properly handle content process skip ([014185ed](http://github.com/aurelia/templating/commit/014185ed849c71d539fa56f629aa58baf086f6bb))
  * missed update to content projection with new instruction lookup ([589c9d7e](http://github.com/aurelia/templating/commit/589c9d7e8c5cd27812c8059f8b88481844657992))
  * account for web components that alter the DOM structure during creation ([af5584b4](http://github.com/aurelia/templating/commit/af5584b4b2d93c498da920c10327fffed215a7dc), closes [#90](http://github.com/aurelia/templating/issues/90))
  * template elements with template controllers work again ([71c67c21](http://github.com/aurelia/templating/commit/71c67c2109284f6c4adfaa35609b67e66ed11b80), closes [#133](http://github.com/aurelia/templating/issues/133))
  * remove interpolated expression attrs ([b86c6d41](http://github.com/aurelia/templating/commit/b86c6d4116463176921bb4fbff544beb7f1d7842))
  * elements with skipped content should not be traversed ([56b585f9](http://github.com/aurelia/templating/commit/56b585f9deac272a09e31dfdfa1591a446f61452))
  * correctly map renamed attached behaviors at app level ([47f9e2f9](http://github.com/aurelia/templating/commit/47f9e2f93fb8e2552fa0f74dd402968397261c2b))
  * instruction target null class fixed ([655a8938](http://github.com/aurelia/templating/commit/655a8938a80f3bcda0bb13ff006a0bcb106d088f))
* **view-engine:**
  * proxy factories missing cache api ([3670d255](http://github.com/aurelia/templating/commit/3670d25582c4fc5b4939a337f0ef101cbfeafa99))
  * pass correct view address to resources ([ebf99415](http://github.com/aurelia/templating/commit/ebf994159dae11bd0b7a076470674f0877089ac6))
  * correct the view registry entry debug output ([7aff2289](http://github.com/aurelia/templating/commit/7aff2289a9e9f9eae2e480b6166932fd0c3ea627))
  * api cleanup ([a203455a](http://github.com/aurelia/templating/commit/a203455a0d0093e13cdd6289621d111134c8b0ad))
  * handle circular references between views ([5e023a59](http://github.com/aurelia/templating/commit/5e023a59fc12867a0c1d8bb00399f0e3f4ce53b6))
  * address async loading issues and double loading ([ce82ab1f](http://github.com/aurelia/templating/commit/ce82ab1f4b40aea659bee2627c4c62613cc4be37))
  * remove module elements from templates ([149e8a8c](http://github.com/aurelia/templating/commit/149e8a8c6d0ca4d1585ab6ff1b446b61f37c0a68))
  * incorrect array access in resource loading ([1cbca7f2](http://github.com/aurelia/templating/commit/1cbca7f2e8b370187a9c02ca15b16f2f612629c5))
  * double check existing on async load ([e257198b](http://github.com/aurelia/templating/commit/e257198b36c4423d5db6cf1f2ac71dc10abe53c0))
  * update to use path.relativeToFile ([fa05b092](http://github.com/aurelia/templating/commit/fa05b092b350bbb47e44001322f2e58a7b868165))
  * rename dx-import to import ([fd3ddaf9](http://github.com/aurelia/templating/commit/fd3ddaf90f96271ce545305db5f6adc0533f50b6))
* **view-factory:**
  * accidental recursion in isCaching property ([ed88333b](http://github.com/aurelia/templating/commit/ed88333bbf2e4e82d50d6a996243b71218229e91), closes [#168](http://github.com/aurelia/templating/issues/168))
  * additional guards on cache returns ([e7307893](http://github.com/aurelia/templating/commit/e7307893cb2c0d999f19edc156ac623448118520))
  * always merge classes from surrogate ([e0e00c06](http://github.com/aurelia/templating/commit/e0e00c0683b2b82862596fa6dcee84dbf4282f06), closes [#147](http://github.com/aurelia/templating/issues/147))
  * cleanup and standardizing api for view creation ([1258f476](http://github.com/aurelia/templating/commit/1258f476fb9d11979b810d6d7b967c6bed00b006))
  * unnecessary dom boundaries removed ([77452a17](http://github.com/aurelia/templating/commit/77452a1712249229a82252c22abd4a8d9444c78e))
  * overwriting part replacments in template controllers ([1c2420dd](http://github.com/aurelia/templating/commit/1c2420ddd4b007e67c0028f9c51de4cfef19e746), closes [#120](http://github.com/aurelia/templating/issues/120))
  * solve IE bug related to anchors ([7764774c](http://github.com/aurelia/templating/commit/7764774cf6621d25a111759cbe1217dfae64812d))
  * properly merge element attr overrides with surrogate values ([0ba7c904](http://github.com/aurelia/templating/commit/0ba7c9040354016b64a69f55f95fa5a9b5b80187))
  * template anchors converted to comment anchors ([2079480a](http://github.com/aurelia/templating/commit/2079480ad1ce3d8bc55b03564e7299481ab6a3dc))
  * incorrect loop variable name ([1e1dbff6](http://github.com/aurelia/templating/commit/1e1dbff6213cad44715c70185f2ece7cf3209632))
* **view-resources:** switch to PLATFORM.noop from Metadata ([221e1fb3](http://github.com/aurelia/templating/commit/221e1fb33bca26f6d095b5ef5924e23db8388bdb))
* **view-slot:**
  * check index before removing ([8486417b](http://github.com/aurelia/templating/commit/8486417b35c181dda3455420786aa03d5bf80b1d))
  * out of bounds on array for content selector remove all ([eb345050](http://github.com/aurelia/templating/commit/eb3450508ee91aa03e38aeaeac58ffc54bc07870), closes [#136](http://github.com/aurelia/templating/issues/136))
  * use animations on all slot modifications and properly return promises ([e28d776e](http://github.com/aurelia/templating/commit/e28d776e1a24f31d5244b23ae696ae37d3a5ac6d))
  * add fallback for missing nextElementSibling ([7ae88b6f](http://github.com/aurelia/templating/commit/7ae88b6fccf92cc057a7964c952d3ff925301725))
  * Safari and IE are not spec compliant perhaps ([bc1ff2ba](http://github.com/aurelia/templating/commit/bc1ff2bae440e471accc088651f76701bc4311db))
  * improve null checks and array access ([af290c1f](http://github.com/aurelia/templating/commit/af290c1f75f8a78019a35909e15988e7a0fd756e))
  * add firstChild null checks ([d260bdb9](http://github.com/aurelia/templating/commit/d260bdb95e1772610c1083ca7ad6511fb5586d5a), closes [#34](http://github.com/aurelia/templating/issues/34))
  * add firstChild null checks ([a49411dd](http://github.com/aurelia/templating/commit/a49411ddf7b830acf70034babf19de6ea38947ca), closes [#34](http://github.com/aurelia/templating/issues/34))
  * correct null check against nextElementSibling ([9162eeb6](http://github.com/aurelia/templating/commit/9162eeb69bafe2d33b4e9e5e1d2715afbaa9301f))
  * transformChildNodesIntoView broken with animation ([03b94433](http://github.com/aurelia/templating/commit/03b94433bccf81ef5595d0495b4ba257ffb662ad))
  * prepare for animator implementation ([f922a86f](http://github.com/aurelia/templating/commit/f922a86feb4f42e34ca37650e0533dd75e9d17dc))
* **view-strategy:**
  * incorrect variable reference ([3231c77b](http://github.com/aurelia/templating/commit/3231c77b88fecf1364db645631004408c6e9e8c0))
  * incorrect variable ([7ef25428](http://github.com/aurelia/templating/commit/7ef25428679348fc54210315abc9568ef6ecaccd))
  * address changes in jspm/system.js beta ([ac24d3b6](http://github.com/aurelia/templating/commit/ac24d3b68680241c0ce31eefc6edd58f6c8e9858))
  * typo in view strategy normalization ([831489ee](http://github.com/aurelia/templating/commit/831489ee838b586ac8ec5a3be9afb43649e2a6fa), closes [#54](http://github.com/aurelia/templating/issues/54))
  * typo from rename ([c7cc8617](http://github.com/aurelia/templating/commit/c7cc861787e22e638d92270e94ddca3b57cb9ac2))
  * dynamic strategy hook results should be relative to view-model ([ae6cf40c](http://github.com/aurelia/templating/commit/ae6cf40cbaffc7504867100e10e709a780231d82))
* **views:** enhance view engine hook inputs ([02606f53](http://github.com/aurelia/templating/commit/02606f53de32481632d5ef539d612ab7fb08aa5c))


#### Features

* **Behaviour:** make UK devs jump for joy ([b5cc76c4](http://github.com/aurelia/templating/commit/b5cc76c4f5ce2aa985244d0bfd8248c71e305984), closes [#18](http://github.com/aurelia/templating/issues/18))
* **ViewResources:** enable DI of ViewResources ([f5b37e10](http://github.com/aurelia/templating/commit/f5b37e10bada8063a78c02e1b53ab1357ba9668e))
* **all:**
  * new templatingEngine object with createModelForUnitTest helper ([74102905](http://github.com/aurelia/templating/commit/741029055e27446c8193e0132f696f1af28b61e5))
  * solidify view resource pipeline ([953829c6](http://github.com/aurelia/templating/commit/953829c663f6a4018d93ddfc09b1c52997b25202))
  * rename BehaviorInstance to Controller ([fa187a9c](http://github.com/aurelia/templating/commit/fa187a9cb1323f98d0bdb5c900f4e030f2634783))
  * integrate pal and lint source ([ba9e6e22](http://github.com/aurelia/templating/commit/ba9e6e22b31b3abfb764a4996d663bfc931eee0e))
  * enable view-cache size configuration in html ([01ed43f3](http://github.com/aurelia/templating/commit/01ed43f31bdfd9f7d714383089fab4a434f5cecf))
  * new extensible view engine pipeline ([82af961f](http://github.com/aurelia/templating/commit/82af961ff9108c9e1882f26d8c6119e18de66201))
  * new API for testing HTML behaviors ([f28ea278](http://github.com/aurelia/templating/commit/f28ea2789351e0fbc07de5aaf0ced9ce6093d6a4))
  * containerless custom elements ([710e5b38](http://github.com/aurelia/templating/commit/710e5b383bb621a8947019bda73498b58de56ef5))
  * support template part replacement ([1d9ba1c0](http://github.com/aurelia/templating/commit/1d9ba1c06563a12505dd4033ff24932a9f88007e), closes [#70](http://github.com/aurelia/templating/issues/70))
  * switch to new es7 metadata api ([bbe21bbe](http://github.com/aurelia/templating/commit/bbe21bbebf207e8d2059cca6e0dd6e1576da1e21))
  * new decorator and behavior model ([7c7bc578](http://github.com/aurelia/templating/commit/7c7bc578313e23be4e773c9aa46d19b9f3c1c943))
  * update to new fluid metadata api and add helpers ([e6893eb9](http://github.com/aurelia/templating/commit/e6893eb9aa932cee3e11a6038bc405ec5e47db06))
  * behavior props now defined on prototype ([305054b4](http://github.com/aurelia/templating/commit/305054b4731e694abd1cc6682e40760ee3114039))
* **anim:**
  * add missing animateTimeout ([28527e18](http://github.com/aurelia/templating/commit/28527e1872b07d11db23d2ee8ec9105ac0307e10))
  * additional animation events ([40c4ab13](http://github.com/aurelia/templating/commit/40c4ab13341b3f02fa00727432fc30ddb698466a))
  * add animation events const ([0378ebe3](http://github.com/aurelia/templating/commit/0378ebe3482c2b023f360bc2774cfd76ad5faea6))
  * Add animator service ([5d2d6169](http://github.com/aurelia/templating/commit/5d2d616988f723a3c20f06c2ae51ffe8f757c307))
* **animator:**
  * add extra animator methods ([3ad6e884](http://github.com/aurelia/templating/commit/3ad6e884de22021c0f3e578056831826c76b7c1a))
  * add mechanism for default animator configuration ([eb792bb1](http://github.com/aurelia/templating/commit/eb792bb11edfa78fec4fa8109da576d10c1b9d68))
* **behaviors:** expose public api for behaviors on element ([fc002606](http://github.com/aurelia/templating/commit/fc002606d5ee3e5646323ad8ff4dc32c456c545f), closes [#10](http://github.com/aurelia/templating/issues/10))
* **bindable-property:** all behaviors now support propertyChanged ([c1138e51](http://github.com/aurelia/templating/commit/c1138e51068763139e6661096957ec714eb9c619))
* **bindableProperty:** enable decorator to work with ES7 property initializers ([773c5eed](http://github.com/aurelia/templating/commit/773c5eed3e4c0b841aeb913dcf17095572b0710f))
* **build:** update compile, switch to register modules, switch to core-js format ([a2b2e63f](http://github.com/aurelia/templating/commit/a2b2e63fe729a9cf206ca71748505c81cdbec2dd))
* **children:** enable multiple @sync properties on a behavior ([c549ff86](http://github.com/aurelia/templating/commit/c549ff86be818bec2f8e25fdfd37207cabf9daa2))
* **composition-engine:**
  * enable view caching ([69c25b84](http://github.com/aurelia/templating/commit/69c25b84194761382fd88383a60f87a7857fa8b7))
  * encapsulate dynamic composition logic in a service ([51638f65](http://github.com/aurelia/templating/commit/51638f65ce0c129e41aa7f3aed10bcd3985d7df9))
* **custom-element:**
  * add beforeCompile hook ([a7d34b51](http://github.com/aurelia/templating/commit/a7d34b5188c92d8426a4123002bc34a58a672492), closes [#9](http://github.com/aurelia/templating/issues/9))
  * add metadata for skipping for content processing ([1fa4ca9b](http://github.com/aurelia/templating/commit/1fa4ca9bdf2d39f940717bbb407c0c9bec89f06c), closes [#4](http://github.com/aurelia/templating/issues/4))
* **customAttribute:** enable defaultBindingMode for customAttribute ([91e503f7](http://github.com/aurelia/templating/commit/91e503f7d850e810ddb277f42a0ef5ff72e1909c))
* **decorators:**
  * warn on deprecated skipContentProcessing decorator ([27822488](http://github.com/aurelia/templating/commit/27822488686535a7f9b5c7364c8cd751259e1c9e))
  * rename bindableProperty to bindable ([b3f8a3b9](http://github.com/aurelia/templating/commit/b3f8a3b9b09528d43e947c141d0a199738fb1226))
* **docs:**
  * generate api.json from .d.ts file ([10c2e258](http://github.com/aurelia/templating/commit/10c2e25848fcec24d161a4f1cba56738c71c3132))
  * generate api.json from .d.ts file ([65eb1b33](http://github.com/aurelia/templating/commit/65eb1b3385b6ae87bba0e7c16ef328e65df19574))
* **dom:** check markup for <template> wrapper ([18b577e8](http://github.com/aurelia/templating/commit/18b577e89bc6e4958b3af90eee9a777c8a5fefef))
* **html-behavior:**
  * enable extensible content processing ([aa6c2d62](http://github.com/aurelia/templating/commit/aa6c2d627695000209f5278d6d8f4abb69c4c1b7))
  * introduce dom boundary for better shadow dom support ([74d06240](http://github.com/aurelia/templating/commit/74d0624097fa5dda6bd2fbea2ef7bb5617f2f221))
  * enable syncChildren on composed views ([ea15104e](http://github.com/aurelia/templating/commit/ea15104e73bb9edf38397a1ea69c844ff7bd1831), closes [#68](http://github.com/aurelia/templating/issues/68))
* **index:** create alias Behavior for Metadata ([96bcb7bf](http://github.com/aurelia/templating/commit/96bcb7bf4acd75256d597ea58200ddc34dbf0cd7))
* **property:**
  * add fluent api helper method for options property properties ([597426b0](http://github.com/aurelia/templating/commit/597426b0d740073b84d71a39f56623173b3886b8))
  * infrastructure for dynamic commands and options properties ([eb54b5f9](http://github.com/aurelia/templating/commit/eb54b5f9b50fd7814b63d7040f7e4f89cd8c14de))
  * default binding modes for aurelia properties ([769882db](http://github.com/aurelia/templating/commit/769882dbf4ea081eeeeae0ab968bf869b1ab034a), closes [#1](http://github.com/aurelia/templating/issues/1))
  * add options property ([b8627249](http://github.com/aurelia/templating/commit/b8627249b7dcd71f45b676e6fd680d1d20b524cf))
  * add load responsibility from behavior ([f8790e42](http://github.com/aurelia/templating/commit/f8790e4224f065cd83009bc16dab7a84adfb3038))
* **resource-coordinator:** enable load resources relative to a manifest file ([98a5f01b](http://github.com/aurelia/templating/commit/98a5f01ba5451005215acfba1cd8a9ef5d7b5a96))
* **resources:**
  * new, simplified and improved resource pipeline processing ([e6207812](http://github.com/aurelia/templating/commit/e620781248e53387e8a7ca16f778d931edbd7fba))
  * leverage new template loader api ([ee6fea9d](http://github.com/aurelia/templating/commit/ee6fea9d6a279881ec99817c757842082a9c09f6))
* **view:** indicate if a view originates from the cache ([31bc37bc](http://github.com/aurelia/templating/commit/31bc37bc71a7fc8a0681bd2ae1e5dad5855e48fc))
* **view-compiler:**
  * working on cleanup of api ([5654d1a1](http://github.com/aurelia/templating/commit/5654d1a13ed0cc58482e824c08357a72baebb8e0))
  * enable per-view binding languages ([e5e957d1](http://github.com/aurelia/templating/commit/e5e957d17493045b804b640903a4674595c20030))
  * enable surrogate behaviors, bindings and attributes ([a1fcdffb](http://github.com/aurelia/templating/commit/a1fcdffbcb1b0dcfbd23387c467302d540a9144f), closes [#61](http://github.com/aurelia/templating/issues/61))
  * support compiling of strings ([deb23a83](http://github.com/aurelia/templating/commit/deb23a8336ff84a6c8af221a95fed8df4c85f304), closes [#37](http://github.com/aurelia/templating/issues/37))
  * update to new binding language interface ([8fb4f7ca](http://github.com/aurelia/templating/commit/8fb4f7ca4f2125e47a6312604f47df3563c3e318))
* **view-engine:**
  * preliminary support for element enhancement ([e8078686](http://github.com/aurelia/templating/commit/e8078686e7297caef3d7e6b3a9b610c8d5069f30))
  * merge in and simplify resource coordinator ([a836fde9](http://github.com/aurelia/templating/commit/a836fde9efa1ed1efae983d94e13e2fa3872241f))
  * new import syntax ([3e761e77](http://github.com/aurelia/templating/commit/3e761e77760e999ffae407b297ecaf7d11d07788))
  * enable resource renaming ([83683d92](http://github.com/aurelia/templating/commit/83683d921d125507ba574091bcf7e3c422b45288))
* **view-factory:**
  * more efficient provider container registration ([d3c0ed6e](http://github.com/aurelia/templating/commit/d3c0ed6e017c838f4530846d992aab6de2c2e644))
  * add some cache related data properties ([10cdc2f7](http://github.com/aurelia/templating/commit/10cdc2f7f7fc6016d4e5c4beecc5ffb296a534a7))
  * add basic view caching capability to the factory ([c8cfa9b0](http://github.com/aurelia/templating/commit/c8cfa9b02b35d66b3301fb42474867e9adc4030a))
  * enable injection of TargetInstruction ([961604ab](http://github.com/aurelia/templating/commit/961604ab98e4f22326ad38d9cc369c80114c7921))
  * enable replacement parts to flow through to child templates ([3261af3b](http://github.com/aurelia/templating/commit/3261af3bb532eac3a87766413b3c69854f17aa5b))
* **view-resources:**
  * remove ResourceRegistry and simplify class hierarchy ([bcba0896](http://github.com/aurelia/templating/commit/bcba08964bb7c5d188245fa028d1f7d8e2f2d20f))
  * auto-import own local resources ([9f770029](http://github.com/aurelia/templating/commit/9f77002950aeb8fab347297a5a669efc9ff993f5))
* **view-slot:**
  * enable remove with skip animation ([fa36e315](http://github.com/aurelia/templating/commit/fa36e3151e9651ca9de5590a8f849a932637b4b6))
  * add infrastructure for app splash screens ([8a9b6062](http://github.com/aurelia/templating/commit/8a9b606283b873b66ff9bb588f002b3ee8275629))
* **view-strategy:**
  * @inlineView and InlineViewStrategy implemented ([bc464a42](http://github.com/aurelia/templating/commit/bc464a421ceeae6301832b656ad0204aa7f0c5a7))
  * enable exported view strategy and registry to be used for view models ([03790f85](http://github.com/aurelia/templating/commit/03790f85959a0e541ed0daf7b8c28ad37201c25c), closes [#13](http://github.com/aurelia/templating/issues/13))
  * allow strategies to be made relative via compose ([53f25495](http://github.com/aurelia/templating/commit/53f2549589091dcc5a7a54297d080184d7f2c8be))


#### Breaking Changes

* The view resource pipeline hook "analyze" has been
renamed to "initialize".

 ([953829c6](http://github.com/aurelia/templating/commit/953829c663f6a4018d93ddfc09b1c52997b25202))


### 0.15.3 (2015-09-08)


#### Bug Fixes

* **view-engine:** pass correct view address to resources ([ebf99415](http://github.com/aurelia/templating/commit/ebf994159dae11bd0b7a076470674f0877089ac6))


### 0.15.2 (2015-09-08)


#### Bug Fixes

* **view-engine:** correct the view registry entry debug output ([7aff2289](http://github.com/aurelia/templating/commit/7aff2289a9e9f9eae2e480b6166932fd0c3ea627))


### 0.15.1 (2015-09-05)


#### Bug Fixes

* **view-factory:** accidental recursion in isCaching property ([ed88333b](http://github.com/aurelia/templating/commit/ed88333bbf2e4e82d50d6a996243b71218229e91), closes [#168](http://github.com/aurelia/templating/issues/168))


## 0.15.0 (2015-09-04)


#### Bug Fixes

* **all:** rename executionContext to bindingContext ([9f5437bf](http://github.com/aurelia/templating/commit/9f5437bf641026b9a6dfb6d918be272198861962))
* **bindable:** bindable cannot be undefined ([d3e990be](http://github.com/aurelia/templating/commit/d3e990be5b52cc44c58c6ee4a32ba458d7e00ecc))
* **build:** update linting, testing and tools ([6ab627dc](http://github.com/aurelia/templating/commit/6ab627dc6a36505b2e6f299fd488218e3b6ca0f1))
* **decorators:** property defaultBindingMode in customAttribute decorator is optional ([11556537](http://github.com/aurelia/templating/commit/11556537f94b2ef7aa3636738040255ead901dad))
* **view-factory:** additional guards on cache returns ([e7307893](http://github.com/aurelia/templating/commit/e7307893cb2c0d999f19edc156ac623448118520))
* **views:** enhance view engine hook inputs ([02606f53](http://github.com/aurelia/templating/commit/02606f53de32481632d5ef539d612ab7fb08aa5c))


#### Features

* **all:**
  * enable view-cache size configuration in html ([01ed43f3](http://github.com/aurelia/templating/commit/01ed43f31bdfd9f7d714383089fab4a434f5cecf))
  * new extensible view engine pipeline ([82af961f](http://github.com/aurelia/templating/commit/82af961ff9108c9e1882f26d8c6119e18de66201))
* **composition-engine:** enable view caching ([69c25b84](http://github.com/aurelia/templating/commit/69c25b84194761382fd88383a60f87a7857fa8b7))
* **docs:**
  * generate api.json from .d.ts file ([10c2e258](http://github.com/aurelia/templating/commit/10c2e25848fcec24d161a4f1cba56738c71c3132))
  * generate api.json from .d.ts file ([65eb1b33](http://github.com/aurelia/templating/commit/65eb1b3385b6ae87bba0e7c16ef328e65df19574))
* **view:** indicate if a view originates from the cache ([31bc37bc](http://github.com/aurelia/templating/commit/31bc37bc71a7fc8a0681bd2ae1e5dad5855e48fc))
* **view-factory:**
  * add some cache related data properties ([10cdc2f7](http://github.com/aurelia/templating/commit/10cdc2f7f7fc6016d4e5c4beecc5ffb296a534a7))
  * add basic view caching capability to the factory ([c8cfa9b0](http://github.com/aurelia/templating/commit/c8cfa9b02b35d66b3301fb42474867e9adc4030a))
* **view-slot:** enable remove with skip animation ([fa36e315](http://github.com/aurelia/templating/commit/fa36e3151e9651ca9de5590a8f849a932637b4b6))


### 0.14.4 (2015-08-14)


#### Bug Fixes

* **composition-engine:** missed required compilation instruction in view only branch ([c3784f0a](http://github.com/aurelia/templating/commit/c3784f0acb0d49688f031993013545f349426ba0))


### 0.14.3 (2015-08-14)


#### Bug Fixes

* **view-factory:** always merge classes from surrogate ([e0e00c06](http://github.com/aurelia/templating/commit/e0e00c0683b2b82862596fa6dcee84dbf4282f06), closes [#147](http://github.com/aurelia/templating/issues/147))


### 0.14.2 (2015-08-14)


#### Bug Fixes

* **dom:** return firstElementChild from parsed template markup ([ea230c84](http://github.com/aurelia/templating/commit/ea230c84f80ac629db6d0add4c1429d5b6fe2f9e))


### 0.14.1 (2015-08-14)


#### Bug Fixes

* **all:** correct some types ([4ed12313](http://github.com/aurelia/templating/commit/4ed123138550c315862d1bdde01a5c691e88853e))


## 0.14.0 (2015-08-14)


#### Bug Fixes

* **all:**
  * cleanup and improving api ([9cb96ff8](http://github.com/aurelia/templating/commit/9cb96ff825519f38b9998d5936431c2b61038856))
  * code cleanup and api stabilization work ([c0220a8d](http://github.com/aurelia/templating/commit/c0220a8da78edee893800958df020da3888a2ed3))
* **dom:** string parsing of views now requires a template tag ([45113364](http://github.com/aurelia/templating/commit/45113364cbe00f91790a64be3a2d0c07144c549c))
* **templating:** Use correct import for core-js We were previously using `import core from core-j ([29e4a62b](http://github.com/aurelia/templating/commit/29e4a62b96e594431682682259d852256c46af4b))
* **view-engine:** api cleanup ([a203455a](http://github.com/aurelia/templating/commit/a203455a0d0093e13cdd6289621d111134c8b0ad))
* **view-factory:** cleanup and standardizing api for view creation ([1258f476](http://github.com/aurelia/templating/commit/1258f476fb9d11979b810d6d7b967c6bed00b006))


#### Features

* **view-compiler:**
  * working on cleanup of api ([5654d1a1](http://github.com/aurelia/templating/commit/5654d1a13ed0cc58482e824c08357a72baebb8e0))
  * enable per-view binding languages ([e5e957d1](http://github.com/aurelia/templating/commit/e5e957d17493045b804b640903a4674595c20030))
* **view-factory:** enable injection of TargetInstruction ([961604ab](http://github.com/aurelia/templating/commit/961604ab98e4f22326ad38d9cc369c80114c7921))
* **view-resources:** remove ResourceRegistry and simplify class hierarchy ([bcba0896](http://github.com/aurelia/templating/commit/bcba08964bb7c5d188245fa028d1f7d8e2f2d20f))


### 0.13.16 (2015-08-05)


#### Bug Fixes

* **html-behavior:** remove double compile of template parts ([49a5ad79](http://github.com/aurelia/templating/commit/49a5ad79072791352b2c1db58e4f009fa861a456))
* **view-factory:** unnecessary dom boundaries removed ([77452a17](http://github.com/aurelia/templating/commit/77452a1712249229a82252c22abd4a8d9444c78e))
* **view-slot:** out of bounds on array for content selector remove all ([eb345050](http://github.com/aurelia/templating/commit/eb3450508ee91aa03e38aeaeac58ffc54bc07870), closes [#136](http://github.com/aurelia/templating/issues/136))


#### Features

* **view-engine:** preliminary support for element enhancement ([e8078686](http://github.com/aurelia/templating/commit/e8078686e7297caef3d7e6b3a9b610c8d5069f30))


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
  * introduce dom boundary for better shadow dom support ([74d06240](http://github.com/aurelia/templ