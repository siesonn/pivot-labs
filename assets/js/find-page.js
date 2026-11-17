'use strict';
/*
  Pivot Labs Find pages: one page per situation (find/<name>/index.html).

  The page marks its question area with data-find="<situation>" (a key in STARTERS, assets/js/starters.js).
  Tool addresses there are written from the home page, so this script adds "../../" in front of them
  (a Find page is two folders down).
  This script shows that situation's questions on the shared situation picker, then the suggested tool,
  why it fits, and the other tools for that situation.
*/
(() => {
  const root = document.querySelector('[data-find]');
  if (!root) return;
  const key = root.dataset.find;
  const found = PivotStarters.STARTERS[key];
  if (!found) return;
  // Tool addresses in starters.js are written from the home page. A Find page sits two folders down.
  const up = root.dataset.up || '../../';
  const config = Object.assign({}, found, { options: found.options.map(o => Object.assign({}, o, { href: up + o.href })) });
  SituationPicker.create(config).mount(root, {
    idPrefix: 'find-' + key,
    headingLevel: 2,
    showAnswers: true,
    changeInActions: true,
    actionLabel: option => 'Open the ' + option.title
  });
})();
