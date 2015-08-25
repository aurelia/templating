let needsTemplateFixup = !('content' in document.createElement('template'));
let shadowPoly = window.ShadowDOMPolyfill || null;

export let DOMBoundary = 'aurelia-dom-boundary';
export let hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;

export function nextElementSibling(element:Node):Element {
  if (element.nextElementSibling){ return element.nextElementSibling; }
  do { element = element.nextSibling }
  while (element && element.nodeType !== 1);
  return element;
}

export function createTemplateFromMarkup(markup:string):Element{
  let parser = document.createElement('div');
  parser.innerHTML = markup;

  let temp = parser.firstElementChild;

  if(needsTemplateFixup){
    temp.content = document.createDocumentFragment();
    while(temp.firstChild){
      temp.content.appendChild(temp.firstChild);
    }
  }

  return temp;
}

export function replaceNode(newNode:Node, node:Node, parentNode:Node):void{
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

export function removeNode(node:Node, parentNode:Node):void {
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

export function injectStyles(styles: string, destination?: Element, prepend?:boolean) {
  let node = document.createElement('style');
  node.innerHTML = styles;
  node.type = 'text/css';

  destination = destination || document.head;

  if(prepend && destination.childNodes.length > 0){
    destination.insertBefore(node, destination.childNodes[0]);
  }else{
    destination.appendChild(node);
  }

  return node;
}
