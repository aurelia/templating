let needsTemplateFixup = !('content' in document.createElement('template'));
let shadowPoly = window.ShadowDOMPolyfill || null;

export let DOMBoundary = 'aurelia-dom-boundary';

export function createTemplateFromMarkup(markup){
  let parser = document.createElement('div');
  parser.innerHTML = markup;

  let temp = parser.firstChild;

  if(needsTemplateFixup){
    temp.content = document.createDocumentFragment();
    while(temp.firstChild){
      temp.content.appendChild(temp.firstChild);
    }
  }

  return temp;
}

export function replaceNode(newNode, node, parentNode){
  if(node.parentNode){
    node.parentNode.replaceChild(newNode, node);
  }else if(shadowPoly){ //HACK: IE template element and shadow dom polyfills not quite right...
    shadowPoly.unwrap(parentNode).replaceChild(
      shadowPoly.unwrap(newNode),
      shadowPoly.unwrap(node)
      );
  }else{ //HACK: same as above
    parentNode.replaceChild(newNode, node);
  }
}

export function removeNode(node, parentNode) {
  if(node.parentNode){
    node.parentNode.removeChild(node);
  }else if(shadowPoly){ //HACK: IE template element and shadow dom polyfills not quite right...
    shadowPoly.unwrap(parentNode).removeChild(
      shadowPoly.unwrap(node)
      );
  }else{ //HACK: same as above
    parentNode.removeChild(node);
  }
}
