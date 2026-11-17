'use strict';
/*
  Pivot Labs home page: starter cards

  Each starter card opens a question or two in place. The answers suggest one tool, say why it
  fits, and list the card's other tools. The questions run on the shared situation picker
  (assets/js/situation-picker.js). A card with only one fitting tool is a plain link in index.html.

  The questions, tools, and reasons live in assets/js/starters.js, which the Find pages share. To add a tool to a card, see the top of that file.
  A new card goes in index.html (copy a starter <li>) and in starters.js under the same data-starter name.
*/
(() => {
  const { STARTERS } = PivotStarters;

  // Open or close a card. Answers stay put when a card closes, so reopening it picks up where you left off.
  function setOpen(item, open) {
    item.classList.toggle('open', open);
    item.querySelector('.starter-toggle').setAttribute('aria-expanded', String(open));
    item.querySelector('.starter-panel').hidden = !open;
  }

  document.querySelectorAll('.starter[data-starter]').forEach(item => {
    const key = item.dataset.starter;
    const config = STARTERS[key];
    if (!config) return;
    SituationPicker.create(config).mount(item.querySelector('.starter-panel'), {
      idPrefix: 'start-' + key,
      headingLevel: 3,
      showAnswers: true,
      changeInActions: true,
      actionLabel: option => 'Open the ' + option.title
    });
    const toggle = item.querySelector('.starter-toggle');
    toggle.addEventListener('click', () => setOpen(item, toggle.getAttribute('aria-expanded') !== 'true'));
  });
})();

/* Browse list: closed on phones to keep the page short, always open on wider screens. */
(function () {
  const details = document.querySelector('.browse-details');
  if (!details) return;
  const phone = window.matchMedia('(max-width: 740px)');
  const sync = () => { details.open = !phone.matches; };
  sync();
  if (phone.addEventListener) phone.addEventListener('change', sync);
  details.querySelector('summary').addEventListener('click', e => { if (!phone.matches) e.preventDefault(); });
  const openAndScroll = () => {
    details.open = true;
    document.getElementById('browse').scrollIntoView();
  };
  if (location.hash === '#browse') openAndScroll();
  window.addEventListener('hashchange', () => { if (location.hash === '#browse') openAndScroll(); });
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href="#browse"]');
    if (a) { e.preventDefault(); history.replaceState(null, '', '#browse'); openAndScroll(); }
  });
})();
