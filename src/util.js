var capitalMatcher = /([A-Z])/g;

function addHyphenAndLower(char){
  return "-" + char.toLowerCase();
}

export function hyphenate(name){
  return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
}

/**
 * Extracts stylesheet links from template, loads them and inlines its contents
 * @param {HTMLTemplateElement} template
 */
export function swapLinksWithStyleContent(template) {
  var linkElements = template.content.querySelectorAll('link[rel=stylesheet]'),
      links = linkElements.map(link => link.href);
  // remove link elements from template
  for(let link of linkElements) {
    template.content.removeChild(link);
  }
  // get stylesheets content and inline them on the template
  return getLinksContent(links).then( styles => {
    for(let styleContent of styles) {
      let styleElement = document.createElement('style');
      styleElement.appendChild(document.createTextNode(styleContent));
      template.content.appendChild(styleElement);
    }
    return template;
  });
}

function getLinksContent(links) {
  var styles = [];
  for (let link of links) {
    // TODO: support other types of plugins (stylus, less, sass)
    styles.push(System.import(`${link}!text`));
  }
  return Promise.all(styles);
}
