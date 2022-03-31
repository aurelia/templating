export function createFragment(html: string): DocumentFragment {
  const parser = document.createElement('div');
  parser.innerHTML = `<template>${html}</template>`;
  return (parser.removeChild(parser.firstElementChild) as any).content;
}
