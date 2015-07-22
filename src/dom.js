let needsTemplateFixup = !('content' in document.createElement('template'));

export let DOMBoundary = 'aurelia-dom-boundary';

export function createTemplateFromMarkup(markup){
  let temp = document.createElement('template');
  temp.innerHTML = markup;

  if(needsTemplateFixup){
    temp.content = document.createDocumentFragment();
    while(temp.firstChild){
      temp.content.appendChild(temp.firstChild);
    }
  }

  return temp;
}
