'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _ResourceRegistry = require('./resource-registry');

var _ViewFactory = require('./view-factory');

var _BindingLanguage = require('./binding-language');

var nextInjectorId = 0,
    defaultCompileOptions = { targetShadowDOM: false },
    hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

function getNextInjectorId() {
  return ++nextInjectorId;
}

function configureProperties(instruction, resources) {
  var type = instruction.type,
      attrName = instruction.attrName,
      attributes = instruction.attributes,
      property,
      key,
      value;

  var knownAttribute = resources.mapAttribute(attrName);
  if (knownAttribute && attrName in attributes && knownAttribute !== attrName) {
    attributes[knownAttribute] = attributes[attrName];
    delete attributes[attrName];
  }

  for (key in attributes) {
    value = attributes[key];

    if (typeof value !== 'string') {
      property = type.attributes[key];

      if (property !== undefined) {
        value.targetProperty = property.name;
      } else {
        value.targetProperty = key;
      }
    }
  }
}

function makeIntoInstructionTarget(element) {
  var value = element.getAttribute('class');
  element.setAttribute('class', value ? value += ' au-target' : 'au-target');
}

var ViewCompiler = (function () {
  function ViewCompiler(bindingLanguage) {
    _classCallCheck(this, ViewCompiler);

    this.bindingLanguage = bindingLanguage;
  }

  _createClass(ViewCompiler, [{
    key: 'compile',
    value: function compile(templateOrFragment, resources) {
      var options = arguments[2] === undefined ? defaultCompileOptions : arguments[2];

      var instructions = [],
          targetShadowDOM = options.targetShadowDOM,
          content;

      targetShadowDOM = targetShadowDOM && hasShadowDOM;

      if (options.beforeCompile) {
        options.beforeCompile(templateOrFragment);
      }

      if (templateOrFragment.content) {
        content = document.adoptNode(templateOrFragment.content, true);
      } else {
        content = templateOrFragment;
      }

      this.compileNode(content, resources, instructions, templateOrFragment, 'root', !targetShadowDOM);

      content.insertBefore(document.createComment('<view>'), content.firstChild);
      content.appendChild(document.createComment('</view>'));

      return new _ViewFactory.ViewFactory(content, instructions, resources);
    }
  }, {
    key: 'compileNode',
    value: function compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
      switch (node.nodeType) {
        case 1:
          return this.compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
        case 3:
          var expression = this.bindingLanguage.parseText(resources, node.textContent);
          if (expression) {
            var marker = document.createElement('au-marker');
            marker.className = 'au-target';
            (node.parentNode || parentNode).insertBefore(marker, node);
            node.textContent = ' ';
            instructions.push({ contentExpression: expression });
          }
          return node.nextSibling;
        case 11:
          var currentChild = node.firstChild;
          while (currentChild) {
            currentChild = this.compileNode(currentChild, resources, instructions, node, parentInjectorId, targetLightDOM);
          }
          break;
      }

      return node.nextSibling;
    }
  }, {
    key: 'compileElement',
    value: function compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
      var tagName = node.tagName.toLowerCase(),
          attributes = node.attributes,
          expressions = [],
          behaviorInstructions = [],
          providers = [],
          bindingLanguage = this.bindingLanguage,
          liftingInstruction,
          viewFactory,
          type,
          elementInstruction,
          elementProperty,
          i,
          ii,
          attr,
          attrName,
          attrValue,
          instruction,
          info,
          property,
          knownAttribute;

      if (tagName === 'content') {
        if (targetLightDOM) {
          instructions.push({
            parentInjectorId: parentInjectorId,
            contentSelector: true,
            selector: node.getAttribute('select'),
            suppressBind: true
          });
          makeIntoInstructionTarget(node);
        }
        return node.nextSibling;
      } else if (tagName === 'template') {
        viewFactory = this.compile(node, resources);
      } else {
        type = resources.getElement(tagName);
        if (type) {
          elementInstruction = { type: type, attributes: {} };
          behaviorInstructions.push(elementInstruction);
        }
      }

      for (i = 0, ii = attributes.length; i < ii; ++i) {
        attr = attributes[i];
        attrName = attr.name;
        attrValue = attr.value;
        info = bindingLanguage.inspectAttribute(resources, attrName, attrValue);
        type = resources.getAttribute(info.attrName);
        elementProperty = null;

        if (type) {
          knownAttribute = resources.mapAttribute(info.attrName);
          if (knownAttribute) {
            property = type.attributes[knownAttribute];

            if (property) {
              info.defaultBindingMode = property.defaultBindingMode;

              if (!info.command && !info.expression) {
                info.command = property.hasOptions ? 'options' : null;
              }
            }
          }
        } else if (elementInstruction) {
          elementProperty = elementInstruction.type.attributes[info.attrName];
          if (elementProperty) {
            info.defaultBindingMode = elementProperty.defaultBindingMode;

            if (!info.command && !info.expression) {
              info.command = elementProperty.hasOptions ? 'options' : null;
            }
          }
        }

        if (elementProperty) {
          instruction = bindingLanguage.createAttributeInstruction(resources, node, info, elementInstruction);
        } else {
          instruction = bindingLanguage.createAttributeInstruction(resources, node, info);
        }

        if (instruction) {
          if (instruction.alteredAttr) {
            type = resources.getAttribute(instruction.attrName);
          }

          if (instruction.discrete) {
            expressions.push(instruction);
          } else {
            if (type) {
              instruction.type = type;
              configureProperties(instruction, resources);

              if (type.liftsContent) {
                instruction.originalAttrName = attrName;
                liftingInstruction = instruction;
                break;
              } else {
                behaviorInstructions.push(instruction);
              }
            } else if (elementProperty) {
              elementInstruction.attributes[info.attrName].targetProperty = elementProperty.name;
            } else {
              expressions.push(instruction.attributes[instruction.attrName]);
            }
          }
        } else {
          if (type) {
            instruction = { attrName: attrName, type: type, attributes: {} };
            instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

            if (type.liftsContent) {
              instruction.originalAttrName = attrName;
              liftingInstruction = instruction;
              break;
            } else {
              behaviorInstructions.push(instruction);
            }
          } else if (elementProperty) {
            elementInstruction.attributes[attrName] = attrValue;
          }
        }
      }

      if (liftingInstruction) {
        liftingInstruction.viewFactory = viewFactory;
        node = liftingInstruction.type.compile(this, resources, node, liftingInstruction, parentNode);
        makeIntoInstructionTarget(node);
        instructions.push({
          anchorIsContainer: false,
          parentInjectorId: parentInjectorId,
          expressions: [],
          behaviorInstructions: [liftingInstruction],
          viewFactory: liftingInstruction.viewFactory,
          providers: [liftingInstruction.type.target]
        });
      } else {
        for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
          instruction = behaviorInstructions[i];
          instruction.type.compile(this, resources, node, instruction, parentNode);
          providers.push(instruction.type.target);
        }

        var injectorId = behaviorInstructions.length ? getNextInjectorId() : false;

        if (expressions.length || behaviorInstructions.length) {
          makeIntoInstructionTarget(node);
          instructions.push({
            anchorIsContainer: true,
            injectorId: injectorId,
            parentInjectorId: parentInjectorId,
            expressions: expressions,
            behaviorInstructions: behaviorInstructions,
            providers: providers
          });
        }

        if (elementInstruction && elementInstruction.type.skipContentProcessing) {
          return node.nextSibling;
        }

        var currentChild = node.firstChild;
        while (currentChild) {
          currentChild = this.compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
        }
      }

      return node.nextSibling;
    }
  }], [{
    key: 'inject',
    value: function inject() {
      return [_BindingLanguage.BindingLanguage];
    }
  }]);

  return ViewCompiler;
})();

exports.ViewCompiler = ViewCompiler;