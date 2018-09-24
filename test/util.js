export function createFragment(html) {
  const parser = document.createElement('div');
  parser.innerHTML = `<template>${html}</template>`;
  return parser.removeChild(parser.firstElementChild).content;
}
