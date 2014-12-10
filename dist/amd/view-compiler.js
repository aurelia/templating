define(["exports", "./resource-registry", "./view-factory", "./binding-language"], function (exports, _resourceRegistry, _viewFactory, _bindingLanguage) {
  "use strict";

  var ResourceRegistry = _resourceRegistry.ResourceRegistry;
  var ViewFactory = _viewFactory.ViewFactory;
  var BindingLanguage = _bindingLanguage.BindingLanguage;


  var nextInjectorId = 0, defaultCompileOptions = { targetShadowDOM: false }, hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

  function getNextInjectorId() {
    return (++nextInjectorId).toString();
  }

  function configureProperties(instruction) {
    var type = instruction.type, attributes = instruction.attributes, property, key, value;

    for (key in attributes) {
      value = attributes[key];

      if (typeof value !== "string") {
        property = type.getPropertyForAttribute(key);
        value.targetProperty = property.name;
      }
    }
  }

  var ViewCompiler = (function () {
    var ViewCompiler = function ViewCompiler(bindingLanguage) {
      this.bindingLanguage = bindingLanguage;
    };

    ViewCompiler.inject = function () {
      return [BindingLanguage];
    };

    ViewCompiler.prototype.compile = function (templateOrFragment, resources, options) {
      var _this = this;
      if (options === undefined) options = defaultCompileOptions;
      return (function () {
        var instructions = [], targetShadowDOM = options.targetShadowDOM, content;

        targetShadowDOM = targetShadowDOM && hasShadowDOM;

        if (templateOrFragment.content) {
          content = document.adoptNode(templateOrFragment.content, true);
        } else {
          content = templateOrFragment;
        }

        _this.compileNode(content, resources, instructions, templateOrFragment, "root", !targetShadowDOM);

        content.insertBefore(document.createComment("<view>"), content.firstChild);
        content.appendChild(document.createComment("</view>"));

        return new ViewFactory(content, instructions);
      })();
    };

    ViewCompiler.prototype.compileNode = function (node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
      switch (node.nodeType) {
        case 1:
          return this.compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
        case 3:
          var expression = this.bindingLanguage.parseText(resources, node.textContent);
          if (expression) {
            var marker = document.createElement("ai-marker");
            marker.className = "ai-target";
            node.parentNode.insertBefore(marker, node);
            node.textContent = " ";
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
    };

    ViewCompiler.prototype.compileElement = function (node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
      var tagName = node.tagName.toLowerCase(), attributes = node.attributes, expressions = [], behaviorInstructions = [], providers = [], bindingLanguage = this.bindingLanguage, liftingInstruction, viewFactory, type, elementInstruction, elementProperty, i, ii, attr, attrName, attrValue, instruction;

      if (tagName === "content") {
        if (targetLightDOM) {
          instructions.push({
            parentInjectorId: parentInjectorId,
            contentSelector: true,
            selector: node.getAttribute("select"),
            suppressBind: true
          });
          node.setAttribute("class", node.getAttribute("class") + " " + "ai-target");
        }
        return node.nextSibling;
      } else if (tagName === "template") {
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
        instruction = bindingLanguage.parseAttribute(resources, node, attrName, attrValue);

        if (instruction) {
          if (instruction.discrete) {
            expressions.push(instruction);
          } else {
            type = resources.getAttribute(instruction.attrName);

            if (type) {
              instruction.type = type;
              configureProperties(instruction);

              if (type.liftsContent) {
                liftingInstruction = instruction;
                break;
              } else {
                behaviorInstructions.push(instruction);
              }
            } else if (elementInstruction && (elementProperty = elementInstruction.type.getPropertyForAttribute(instruction.attrName))) {
              elementInstruction.attributes[instruction.attrName] = instruction.attributes[instruction.attrName];
              elementInstruction.attributes[instruction.attrName].targetProperty = elementProperty.name;
            } else {
              expressions.push(instruction.attributes[instruction.attrName]);
            }
          }
        } else {
          type = resources.getAttribute(attrName);
          if (type) {
            instruction = { attrName: attrName, type: type, attributes: {} };
            instruction.attributes[attrName] = attrValue;

            if (type.liftsContent) {
              liftingInstruction = instruction;
              break;
            } else {
              behaviorInstructions.push(instruction);
            }
          } else if (elementInstruction && elementInstruction.type.getPropertyForAttribute(attrName)) {
            elementInstruction.attributes[attrName] = attrValue;
          } else {}
        }
      }

      if (liftingInstruction) {
        liftingInstruction.viewFactory = viewFactory;
        node = liftingInstruction.type.compile(this, resources, node, liftingInstruction, parentNode);
        node.setAttribute("class", node.getAttribute("class") + " " + "ai-target");
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
          node.setAttribute("class", node.getAttribute("class") + " " + "ai-target");
          instructions.push({
            anchorIsContainer: true,
            injectorId: injectorId,
            parentInjectorId: parentInjectorId,
            expressions: expressions,
            behaviorInstructions: behaviorInstructions,
            providers: providers
          });
        }

        var currentChild = node.firstChild;
        while (currentChild) {
          currentChild = this.compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
        }
      }

      return node.nextSibling;
    };

    return ViewCompiler;
  })();

  exports.ViewCompiler = ViewCompiler;
});