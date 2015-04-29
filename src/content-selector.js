import core from 'core-js';

if (Element && !Element.prototype.matches) {
    var proto = Element.prototype;
    proto.matches = proto.matchesSelector ||
      proto.mozMatchesSelector || proto.msMatchesSelector ||
      proto.oMatchesSelector || proto.webkitMatchesSelector;
}

var placeholder = [];

function findInsertionPoint(groups, index){
  var insertionPoint;

  while(!insertionPoint && index >= 0){
    insertionPoint = groups[index][0];
    index--;
  }

  return insertionPoint;
}

export class ContentSelector {
  static applySelectors(view, contentSelectors, callback){
    var currentChild = view.fragment.firstChild,
                       contentMap = new Map(),
                       nextSibling, i, ii, contentSelector;

    while (currentChild) {
      nextSibling = currentChild.nextSibling;

      if(currentChild.viewSlot){
        var viewSlotSelectors = contentSelectors.map(x => x.copyForViewSlot());
        currentChild.viewSlot.installContentSelectors(viewSlotSelectors);
      }else{
        for(i = 0, ii = contentSelectors.length; i < ii; i++){
          contentSelector = contentSelectors[i];
          if(contentSelector.matches(currentChild)){
            var elements = contentMap.get(contentSelector);
            if(!elements){
              elements = [];
              contentMap.set(contentSelector, elements);
            }

            elements.push(currentChild);
            break;
          }
        }
      }

      currentChild = nextSibling;
    }

    for(i = 0, ii = contentSelectors.length; i < ii; ++i){
      contentSelector = contentSelectors[i];
      callback(contentSelector, contentMap.get(contentSelector) || placeholder);
    }
  }

  constructor(anchor, selector){
    this.anchor = anchor;
    this.selector = selector;
    this.all = !this.selector;
    this.groups = [];
  }

  copyForViewSlot(){
    return new ContentSelector(this.anchor, this.selector);
  }

  matches(node){
    return this.all ||
      (node.nodeType === 1 && node.matches(this.selector));
  }

  add(group){
    var anchor = this.anchor,
        parent = anchor.parentNode,
        i, ii;

    for(i = 0, ii = group.length; i < ii; ++i){
      parent.insertBefore(group[i], anchor);
    }

    this.groups.push(group);
  }

  insert(index, group){
    if(group.length){
      var anchor = findInsertionPoint(this.groups, index) || this.anchor,
          parent = anchor.parentNode,
          i, ii;

      for(i = 0, ii = group.length; i < ii; ++i){
        parent.insertBefore(group[i], anchor);
      }
    }

    this.groups.splice(index, 0, group);
  }

  removeAt(index, fragment){
    var group = this.groups[index],
        i, ii;

    for(i = 0, ii = group.length; i < ii; ++i){
      fragment.appendChild(group[i]);
    }

    this.groups.splice(index, 1);
  }
}
