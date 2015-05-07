var capitalMatcher = /([A-Z])/g;

function addHyphenAndLower(char){
  return "-" + char.toLowerCase();
}

export function hyphenate(name){
  return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
}

export function nextElementSibling(element) {
  if (element.nextElementSibling){ return element.nextElementSibling; }
  do { element = element.nextSibling }
  while (element && element.nodeType !== 1);
  return element;
}
