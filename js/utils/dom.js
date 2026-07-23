const elCache = new Map();
export const $ = (id) => {
  if (!elCache.has(id)) elCache.set(id, document.getElementById(id));
  return elCache.get(id);
};
export const $$ = (sel) => document.querySelectorAll(sel);
