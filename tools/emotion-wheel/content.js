'use strict';
/*
  Emotion Wheel content

  Step 1 is the wheel: six core feelings, each with six more exact words.
  The wheel is drawn here as an SVG. The six core feelings are real buttons
  (keyboard and screen reader friendly). The words on the outer ring can be
  clicked or tapped, and the same words are always offered as checkboxes
  beside or below the wheel, so nothing depends on the drawing or on color.

  On narrow screens the wheel shows the six core feelings only, and the words
  appear as a list after you choose one.

  The word list and the drawing are Pivot Labs' own.
  Stage 1 of the build: the later steps and the finished note are still to come.
*/
const EmotionWheel = (() => {
  const el = GuidedPlanner.el;
  const NS = 'http://www.w3.org/2000/svg';
  const MAX = 3;

  // Clockwise from the top of the wheel. Colors alternate and carry no meaning.
  const cores = [
    { id: 'joy', name: 'Joy', words: ['Hopeful', 'Proud', 'Energized', 'Confident', 'Satisfied', 'Relieved'] },
    { id: 'connection', name: 'Connection', words: ['Appreciated', 'Valued', 'Trusted', 'Supported', 'Included', 'Grateful'] },
    { id: 'surprise', name: 'Surprise', words: ['Caught off guard', 'Blindsided', 'Confused', 'Stunned', 'Curious', 'Impressed'] },
    { id: 'fear', name: 'Fear', words: ['Anxious', 'Worried', 'Overwhelmed', 'Unsure', 'Exposed', 'Out of my depth'] },
    { id: 'sadness', name: 'Sadness', words: ['Disappointed', 'Discouraged', 'Let down', 'Hurt', 'Lonely', 'Regretful'] },
    { id: 'anger', name: 'Anger', words: ['Impatient', 'Frustrated', 'Resentful', 'Disrespected', 'Defensive', 'Fed up'] }
  ];
  const wordId = (core, word) => core.id + ':' + word.toLowerCase().replace(/[^a-z]+/g, '-');
  const lookup = {};
  cores.forEach(core => core.words.forEach(word => { lookup[wordId(core, word)] = { core, word }; }));
  const coreById = id => cores.find(c => c.id === id);

  // Wheel geometry, in drawing units. The drawing is centered on 0,0.
  const R = { hub: 62, core0: 66, core1: 178, word0: 182, word1: 352, wordText: 257, check: 337 };
  const rad = deg => deg * Math.PI / 180;
  const pt = (r, deg) => (r * Math.cos(rad(deg))).toFixed(2) + ' ' + (r * Math.sin(rad(deg))).toFixed(2);
  const ring = (r0, r1, a0, a1) =>
    'M' + pt(r1, a0) + 'A' + r1 + ' ' + r1 + ' 0 0 1 ' + pt(r1, a1) +
    'L' + pt(r0, a1) + 'A' + r0 + ' ' + r0 + ' 0 0 0 ' + pt(r0, a0) + 'Z';
  // An arc for text to sit on. Text in the lower half runs the other way so it is never upside down.
  const textArc = (r, a0, a1, lower) => (lower
    ? 'M' + pt(r, a1) + 'A' + r + ' ' + r + ' 0 0 0 ' + pt(r, a0)
    : 'M' + pt(r, a0) + 'A' + r + ' ' + r + ' 0 0 1 ' + pt(r, a1));
  function svg(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
    if (text !== undefined) n.textContent = text;
    return n;
  }

  let observer = null;

  function renderWheel(wrap, api) {
    const a = api.answers;
    wrap.classList.add('ew-field');
    const root = el('div', 'ew');
    root.dataset.size = 'full';

    // ----- The drawing
    const holder = el('div', 'ew-wheel');
    const art = svg('g', { class: 'ew-art' });
    const drawing = svg('svg', { viewBox: '-370 -370 740 740', role: 'group', 'aria-label': 'Emotion wheel. Six core feelings. Choose one to see more exact words.' });
    const defs = svg('defs');
    drawing.append(defs, art);
    const coreNodes = {};
    const wordNodes = {};
    const focusRing = svg('g', { class: 'ew-focus', 'aria-hidden': 'true' });

    cores.forEach((core, i) => {
      const mid = -90 + 60 * i;
      const a0 = mid - 30, a1 = mid + 30;
      const lower = Math.sin(rad(mid)) > 0.01;
      const sector = svg('g', { class: 'ew-sector ew-tone-' + (i % 2 ? 'b' : 'a') });

      // Outer ring: the six words. Pointer only; the checkbox list is the keyboard route.
      const words = svg('g', { class: 'ew-words', 'aria-hidden': 'true' });
      core.words.forEach((word, j) => {
        const w0 = a0 + 10 * j, wm = w0 + 5;
        const id = wordId(core, word);
        const g = svg('g', { class: 'ew-word' });
        const flip = Math.cos(rad(wm)) < -0.01;
        const turn = flip ? wm + 180 : wm;
        g.append(
          svg('path', { class: 'ew-seg ew-word-shape', d: ring(R.word0, R.word1, w0, w0 + 10) }),
          svg('text', { class: 'ew-word-text', transform: 'rotate(' + turn + ') translate(' + (flip ? -R.wordText : R.wordText) + ' 0)', 'text-anchor': 'middle', dy: '.35em' }, word),
          svg('text', { class: 'ew-check', transform: 'translate(' + pt(R.check, wm) + ')', 'text-anchor': 'middle', dy: '.35em' }, '✓')
        );
        g.addEventListener('click', () => { toggle(id); open(core.id, false, false); });
        wordNodes[id] = g;
        words.append(g);
      });

      // Inner ring: the core feeling, a real button.
      const btn = svg('g', { class: 'ew-core', role: 'button', tabindex: '0', id: 'ew-core-' + core.id, 'aria-pressed': 'false', 'aria-label': core.name });
      const labelPath = 'ew-arc-' + core.id, badgePath = 'ew-badge-arc-' + core.id;
      defs.append(
        svg('path', { id: labelPath, d: textArc(lower ? 141 : 125, a0, a1, lower) }),
        svg('path', { id: badgePath, d: textArc(lower ? 105 : 91, a0, a1, lower) })
      );
      const label = svg('text', { class: 'ew-core-text', 'aria-hidden': 'true' });
      label.append(svg('textPath', { href: '#' + labelPath, startOffset: '50%', 'text-anchor': 'middle' }, core.name));
      const badge = svg('text', { class: 'ew-badge', 'aria-hidden': 'true' });
      const badgeText = svg('textPath', { href: '#' + badgePath, startOffset: '50%', 'text-anchor': 'middle' }, '');
      badge.append(badgeText);
      const shape = ring(R.core0, R.core1, a0, a1);
      btn.append(
        svg('path', { class: 'ew-seg ew-core-shape', d: shape }),
        svg('path', { class: 'ew-frame', d: ring(R.core0 + 6, R.core1 - 6, a0 + 3.2, a1 - 3.2) }),
        label, badge
      );
      // The keyboard focus ring is drawn on the top layer, so nothing covers it.
      btn.addEventListener('focus', () => {
        if (!btn.matches(':focus-visible')) return;
        focusRing.querySelectorAll('path').forEach(p => p.setAttribute('d', shape));
        focusRing.style.transform = sector.style.transform;
        focusRing.style.display = 'block';
      });
      btn.addEventListener('blur', () => { focusRing.style.display = ''; });
      btn.addEventListener('click', () => open(core.id, false, true));
      btn.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        open(core.id, true, true);
      });
      coreNodes[core.id] = { btn, sector, badge, badgeText, mid };
      sector.append(words, btn);
      art.append(sector);
    });
    // Wider Ivory lines between the six feelings, so each one reads as its own slice.
    const dividers = svg('g', { class: 'ew-dividers', 'aria-hidden': 'true' });
    cores.forEach((core, i) => {
      const edge = -120 + 60 * i;
      dividers.append(
        svg('path', { d: 'M' + pt(R.core0, edge) + 'L' + pt(R.core1 + 1, edge) }),
        svg('path', { class: 'ew-words', d: 'M' + pt(R.core1, edge) + 'L' + pt(R.word1 + 2, edge) })
      );
    });
    art.append(dividers);
    const hub = svg('g', { 'aria-hidden': 'true' });
    hub.append(svg('circle', { class: 'ew-hub', r: R.hub }), svg('text', { class: 'ew-hub-text', 'text-anchor': 'middle', dy: '.35em' }, 'I feel…'));
    art.append(hub);
    focusRing.append(svg('path', { class: 'ew-focus-dark' }), svg('path', { class: 'ew-focus-light' }));
    art.append(focusRing);
    holder.append(drawing);

    // ----- The panel: words for the chosen feeling, and what has been picked
    const panel = el('div', 'ew-panel');
    const start = el('div', 'ew-start');
    start.append(el('p', 'ew-start-title', 'Start with the closest feeling.'),
      el('p', null, 'Choose one of the six feelings on the wheel. You’ll get a short list of more exact words to pick from. It doesn’t have to be perfect.'));
    const set = el('fieldset', 'ew-set');
    set.hidden = true;
    const legend = el('legend', 'ew-legend');
    legend.tabIndex = -1;
    const hint = el('p', 'hint', 'Pick any that fit. You can choose up to three in total, from anywhere on the wheel.');
    hint.id = 'ew-hint';
    set.setAttribute('aria-describedby', 'ew-hint');
    const options = el('div', 'guide-options ew-options');
    set.append(legend, hint, options);

    const picked = el('section', 'ew-picked');
    picked.setAttribute('aria-labelledby', 'ew-picked-title');
    const pickedTitle = el('h3', null, 'Your words');
    pickedTitle.id = 'ew-picked-title';
    pickedTitle.tabIndex = -1;
    const count = el('span', 'ew-count');
    const pickedHead = el('div', 'ew-picked-head');
    pickedHead.append(pickedTitle, count);
    const chips = el('ul', 'ew-chips');
    const empty = el('p', 'ew-empty', 'Nothing picked yet. No rush.');
    picked.append(pickedHead, chips, empty);

    const live = el('p', 'visually-hidden');
    live.setAttribute('aria-live', 'polite');
    panel.append(start, set, picked, api.errorSlot('err-feelings'), live);
    root.append(holder, panel);
    wrap.append(root);

    // ----- Behavior
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function buildOptions(core) {
      legend.textContent = core.name + ': which words fit?';
      options.replaceChildren();
      core.words.forEach((word, j) => {
        const id = wordId(core, word);
        const lab = el('label');
        const input = el('input');
        input.type = 'checkbox';
        input.id = 'ew-word-' + j;
        input.value = id;
        input.checked = a.feelings.includes(id);
        input.addEventListener('change', () => { if (!toggle(id, input.checked)) input.checked = false; });
        lab.append(input, el('span', null, word));
        options.append(lab);
      });
    }

    // Show the words for one core feeling. From the keyboard, focus moves to the list.
    function open(coreId, fromKeyboard, reveal) {
      const changedCore = a.openCore !== coreId;
      if (changedCore) { a.openCore = coreId; buildOptions(coreById(coreId)); }
      sync();
      if (fromKeyboard) legend.focus();
      else if (reveal && changedCore) {
        const box = set.getBoundingClientRect();
        if (box.bottom > window.innerHeight || box.top < 0) set.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      }
      if (changedCore) live.textContent = coreById(coreId).name + '. Six words to choose from.';
    }

    // Add or remove a word. Returns false when the limit stops an add.
    function toggle(id, wanted) {
      const has = a.feelings.includes(id);
      const on = wanted === undefined ? !has : wanted;
      if (on === has) return true;
      if (on && a.feelings.length >= MAX) {
        api.announce('Three is the limit. Take one off to add another.');
        return false;
      }
      const next = on ? a.feelings.concat(id) : a.feelings.filter(x => x !== id);
      api.set('feelings', next);
      const slot = document.getElementById('err-feelings');
      if (slot && next.length) slot.hidden = true;
      live.textContent = lookup[id].word + (on ? ' added. ' : ' removed. ') + next.length + ' of ' + MAX + ' picked.';
      sync();
      return true;
    }

    function sync() {
      cores.forEach(core => {
        const n = coreNodes[core.id];
        const isOpen = a.openCore === core.id;
        const total = a.feelings.filter(id => lookup[id].core === core).length;
        n.btn.setAttribute('aria-pressed', String(isOpen));
        n.btn.setAttribute('aria-label', core.name + (total ? ', ' + total + ' picked' : ''));
        n.sector.style.transform = isOpen ? 'translate(' + (6 * Math.cos(rad(n.mid))).toFixed(2) + 'px,' + (6 * Math.sin(rad(n.mid))).toFixed(2) + 'px)' : '';
        n.badgeText.textContent = total ? '✓ ' + total + ' picked' : '';
      });
      Object.entries(wordNodes).forEach(([id, g]) => g.classList.toggle('is-on', a.feelings.includes(id)));
      start.hidden = !!a.openCore;
      set.hidden = !a.openCore;
      options.querySelectorAll('input').forEach(input => { input.checked = a.feelings.includes(input.value); });
      chips.replaceChildren();
      a.feelings.forEach(id => {
        const { core, word } = lookup[id];
        const li = el('li', 'ew-chip');
        const text = el('span', 'ew-chip-text');
        text.append(el('strong', null, word), el('span', 'ew-chip-core', core.name));
        const remove = el('button', 'ew-chip-remove', '×');
        remove.type = 'button';
        remove.setAttribute('aria-label', 'Remove ' + word);
        remove.addEventListener('click', () => { toggle(id, false); pickedTitle.focus(); });
        li.append(text, remove);
        chips.append(li);
      });
      empty.hidden = a.feelings.length > 0;
      count.textContent = a.feelings.length + ' of ' + MAX;
    }

    // The layout follows the room the tool has, not the screen: core feelings only when narrow,
    // the full wheel when there is room, and the wheel beside the list when wide.
    if (observer) observer.disconnect();
    // When narrow, the inner ring is drawn at twice the size so the six core feelings fill the circle.
    // The scale is set on the drawing itself (it grows from the center, 0,0) so every browser agrees.
    const measure = width => {
      const size = width < 520 ? 'compact' : width >= 800 ? 'wide' : 'full';
      root.dataset.size = size;
      if (size === 'compact') art.setAttribute('transform', 'scale(2)');
      else art.removeAttribute('transform');
    };
    observer = new ResizeObserver(entries => measure(entries[0].contentRect.width));
    observer.observe(wrap);
    measure(wrap.getBoundingClientRect().width || 600);

    if (a.openCore) buildOptions(coreById(a.openCore));
    sync();
  }

  function validateWheel(a) {
    if (a.feelings.length) return [];
    const focusId = a.openCore ? 'ew-word-0' : 'ew-core-' + cores[0].id;
    return [{ errorId: 'err-feelings', focusId, message: 'Pick at least one word to continue.' }];
  }

  const steps = [
    {
      id: 'name',
      title: 'Name it',
      intro: 'Start with the feeling that’s closest, then pick the words that fit. Mixed feelings are normal, so you can choose up to three.',
      fields: [{ id: 'feelings', type: 'custom', render: renderWheel, validate: validateWheel }]
    }
  ];

  const initialAnswers = () => ({ feelings: [], openCore: '' });
  const isDirty = a => a.feelings.length > 0;

  // Stage 1 placeholder. The finished note replaces this when the later steps are built.
  function renderResult(container, a, api) {
    const head = el('div', 'result-head');
    head.append(el('p', 'eyebrow', 'Your words'), el('h2', null, 'You named it'),
      el('p', null, 'The next steps are still being built: how strong it is, what’s behind it, and what could help.'));
    const list = el('ul', 'ew-result-list');
    a.feelings.forEach(id => {
      const li = el('li');
      li.append(el('strong', null, lookup[id].word), document.createTextNode(' (' + lookup[id].core.name + ')'));
      list.append(li);
    });
    const actions = el('div', 'result-actions');
    const edit = el('button', 'btn primary', 'Change my words');
    edit.type = 'button';
    edit.addEventListener('click', () => api.goTo(0));
    const again = el('button', 'btn', 'Start over');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    actions.append(edit, again);
    container.append(head, list, actions);
  }

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your note', finishLabel: 'Continue',
    // Exposed for testing.
    cores, lookup, wordId, MAX };
})();
