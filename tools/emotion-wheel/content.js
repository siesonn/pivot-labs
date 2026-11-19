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
  // `points` and `move` are the same lines as the second shareable image
  // (share-source-feelings.html). Keep the two in step. They also show in step 3 and in the finished note.
  const cores = [
    { id: 'joy', name: 'Joy', words: ['Hopeful', 'Proud', 'Energized', 'Confident', 'Satisfied', 'Relieved'],
      points: 'Something is working or matters to you.',
      move: 'Notice what made it happen, and say so to the people involved.' },
    { id: 'connection', name: 'Connection', words: ['Appreciated', 'Valued', 'Trusted', 'Supported', 'Included', 'Grateful'],
      points: 'Trust or belonging is building.',
      move: 'Thank someone specifically, and protect what is building it.' },
    { id: 'surprise', name: 'Surprise', words: ['Caught off guard', 'Blindsided', 'Confused', 'Stunned', 'Curious', 'Impressed'],
      points: 'A gap between what you expected and what happened.',
      move: 'Get the facts and ask a question before you react.' },
    { id: 'fear', name: 'Fear', words: ['Anxious', 'Worried', 'Overwhelmed', 'Unsure', 'Exposed', 'Out of my depth'],
      points: 'Uncertainty, or something you care about feels at risk.',
      move: 'Name the one thing you don’t know, then ask for it or ask for support.' },
    { id: 'sadness', name: 'Sadness', words: ['Disappointed', 'Discouraged', 'Let down', 'Hurt', 'Lonely', 'Regretful'],
      points: 'A loss, or a hope that didn’t happen.',
      move: 'Name what you hoped for, then decide what is still in your hands.' },
    { id: 'anger', name: 'Anger', words: ['Impatient', 'Frustrated', 'Resentful', 'Disrespected', 'Defensive', 'Fed up'],
      points: 'A standard, a boundary, or a need wasn’t respected.',
      move: 'Pause before you respond. Then name the standard and make a clear request.' }
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
    const HINT_NARROW = 'Pick any that fit. You can choose up to three in total, from anywhere on the wheel.';
    const HINT_ROOMY = 'Pick any that fit. You can tap a word on the wheel or tick it in this list. Either works, and they stay in step. You can choose up to three in total, from anywhere on the wheel.';
    const hint = el('p', 'hint', HINT_ROOMY);
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
      // The words show on the wheel only when there is room, so the hint says so only then.
      hint.textContent = size === 'compact' ? HINT_NARROW : HINT_ROOMY;
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

  // ----- Steps 2 to 4 use the shared planner fields.
  const strengths = [
    { value: '1', label: '1: Barely there' },
    { value: '2', label: '2: Mild' },
    { value: '3', label: '3: Moderate' },
    { value: '4', label: '4: Strong' },
    { value: '5', label: '5: Very strong' }
  ];
  const strengthWord = v => (strengths.find(x => x.value === v) || { label: '' }).label.replace(/^\d: /, '').toLowerCase();

  const behind = [
    { value: 'care', label: 'Something I care about feels at risk.' },
    { value: 'clarity', label: 'I need more clarity about what’s expected.' },
    { value: 'help', label: 'I need more help or support.' },
    { value: 'rest', label: 'I need rest or some breathing room.' },
    { value: 'heard', label: 'I need to be heard.' },
    { value: 'standard', label: 'It’s about a standard I hold myself to.' },
    { value: 'unsure', label: 'I’m not sure yet.' }
  ];
  const help = [
    { value: 'pause', label: 'Pause before I respond.' },
    { value: 'talk', label: 'Talk it through with someone I trust.' },
    { value: 'write', label: 'Write down what I need.' },
    { value: 'break', label: 'Take a short break or a walk.' },
    { value: 'step', label: 'Do the first small step.' },
    { value: 'sleep', label: 'Wait until tomorrow before I decide.' }
  ];
  const convo = [
    { value: 'none', label: 'No conversation right now.' },
    { value: 'lead', label: 'Yes, with someone I lead.' },
    { value: 'boss', label: 'Yes, with my manager or senior leaders.' }
  ];
  // Steps 3 and 4 fit the feelings picked. Good feelings point to something too: what is working, who helped, what to repeat.
  // Surprise is split by word: Curious and Impressed count as good feelings, the rest as hard ones.
  const behindGood = [
    { value: 'worked', label: 'Something I worked toward paid off.' },
    { value: 'came', label: 'Someone helped me or came through.' },
    { value: 'values', label: 'Something I value is showing up.' },
    { value: 'progress', label: 'I can see real progress.' },
    { value: 'eased', label: 'A worry just eased.' },
    { value: 'unsure', label: 'I’m not sure yet.' }
  ];
  const helpGood = [
    { value: 'notice', label: 'Notice what made it work.' },
    { value: 'thank', label: 'Thank someone specifically.' },
    { value: 'tell', label: 'Tell someone what this meant to me.' },
    { value: 'repeat', label: 'Write down what to repeat.' },
    { value: 'enjoy', label: 'Take a moment to enjoy it.' }
  ];
  const goodWords = ['Curious', 'Impressed'];
  const isGood = id => { const { core, word } = lookup[id]; return core.id === 'joy' || core.id === 'connection' || goodWords.includes(word); };
  const hasGood = a => a.feelings.some(isGood);
  const hasHard = a => a.feelings.some(id => !isGood(id));
  const goodOnly = a => hasGood(a) && !hasHard(a);
  const both = (good, hard) => a => (goodOnly(a) ? good : hasGood(a) ? good.filter(o => o.value !== 'unsure').concat(hard) : hard);
  const behindFor = both(behindGood, behind);
  const helpFor = both(helpGood, help);
  const labelsFor = (list, values) => list.filter(o => (values || []).includes(o.value)).map(o => o.label);

  // Step 3: the same lines as the second shareable image, once per core feeling picked in step 1.
  function renderPoints(wrap, api) {
    const seen = [];
    api.answers.feelings.forEach(id => { const c = lookup[id].core; if (!seen.includes(c)) seen.push(c); });
    if (!seen.length) return;
    const box = el('div', 'ew-points');
    box.append(el('h3', null, 'What feelings like yours often point to'));
    seen.forEach(c => {
      const row = el('p', 'ew-points-row');
      const first = el('span');
      first.append(el('strong', null, c.name), document.createTextNode(': ' + c.points));
      row.append(first, el('span', null, 'A next move: ' + c.move));
      box.append(row);
    });
    box.append(el('p', 'small', 'These are starting points for reflection, not a diagnosis. You know your situation best.'));
    wrap.append(box);
  }

  const steps = [
    {
      id: 'name',
      title: 'Name it',
      intro: 'Start with the feeling that’s closest, then pick the words that fit. Mixed feelings are normal, so you can choose up to three.',
      fields: [
        { id: 'situation', type: 'text', maxlength: 200, optional: true, label: 'What’s going on?',
          hint: 'Example: Presenting the budget to my manager tomorrow. Leave out names and sensitive details.' },
        { id: 'feelings', type: 'custom', render: renderWheel, validate: validateWheel }
      ]
    },
    {
      id: 'strength',
      title: 'How strong is it?',
      intro: a => goodOnly(a) ? 'A small spark and a big surge of good feeling can ask for different things.' : 'A feeling that’s barely there asks for something different than one that’s taking over.',
      fields: [
        { id: 'strength', type: 'choice', options: strengths,
          label: a => 'Overall, how strong is ' + (a.feelings.length > 1 ? 'this mix of feelings' : 'this feeling') + ' right now?',
          error: 'Choose how strong it is to continue.' }
      ]
    },
    {
      id: 'behind',
      title: 'What might be behind it?',
      intro: a => goodOnly(a) ? 'Good feelings point to something too: what’s working, what you value, who helped. Nothing here is a diagnosis. These are things to consider.' : 'Feelings often point to something you need or something you care about. Nothing here is a diagnosis. These are things to consider.',
      fields: [
        { id: 'points', type: 'custom', render: renderPoints },
        { id: 'behind', type: 'multi', optional: true, label: 'Which of these might be part of it?', hint: 'Choose any that fit.', options: behindFor },
        { id: 'behindNote', type: 'text', maxlength: 300, optional: true, label: 'In a sentence, what do you think is behind it?',
          hint: a => goodOnly(a) ? 'Example: The team pulled together on short notice, and it showed' : 'Example: I want this to go well, and I’m not sure I have the numbers I need' }
      ]
    },
    {
      id: 'help',
      title: a => goodOnly(a) ? 'What could you do with it?' : 'What could help?',
      intro: a => goodOnly(a) ? 'You don’t have to do anything with a good feeling. Noticing it, and what caused it, can help you get more of it.' : 'You don’t need to fix the feeling. You just need a sensible next move.',
      fields: [
        { id: 'help', type: 'multi', optional: true, label: a => goodOnly(a) ? 'What would you like to do with this feeling?' : 'What could help right now?', hint: 'Choose any that fit.', options: helpFor },
        { id: 'first', type: 'text', maxlength: 300, optional: true, label: 'What will you do first?',
          hint: a => goodOnly(a) ? 'Example: Send the team a thank-you note before lunch' : 'Example: Take a ten-minute walk before the 2:00 meeting' },
        { id: 'convo', type: 'choice', label: 'Is there a conversation coming up because of this?', default: () => 'none', options: convo }
      ]
    }
  ];

  const initialAnswers = () => ({ situation: '', feelings: [], openCore: '', strength: '', behind: [], behindNote: '', help: [], first: '', convo: 'none' });
  const isDirty = a => a.feelings.length > 0 || String(a.situation || '').trim() !== '';

  // ----- The finished note
  const text = v => String(v || '').trim();
  function section(title, step, api, label) {
    const s = el('section', 'brief-section');
    const head = el('div', 'brief-section-head');
    head.append(el('h3', null, title));
    const edit = el('button', 'btn brief-edit no-print', 'Edit');
    edit.type = 'button';
    edit.setAttribute('aria-label', 'Edit ' + label);
    edit.addEventListener('click', () => api.goTo(step));
    head.append(edit);
    s.append(head);
    return s;
  }
  function bullets(items) {
    const ul = el('ul');
    items.forEach(t => ul.append(el('li', null, t)));
    return ul;
  }
  const newTab = (href, label) => {
    const link = el('a', null, label);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener';
    const arrow = el('span', null, ' ↗︎');
    arrow.setAttribute('aria-hidden', 'true');
    link.append(arrow, el('span', 'visually-hidden', ' (opens in a new tab)'));
    return link;
  };

  function renderResult(container, a, api) {
    const words = a.feelings.map(id => lookup[id].word);
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your note'), el('h2', null, 'Your check-in note'),
      el('p', null, 'This note is for you. Use Edit to change any section, then print it or save it as a PDF, or take a screenshot.'));
    container.append(head);

    const actions = el('div', 'result-actions no-print');
    const print = el('button', 'btn primary', 'Print note');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    const editAll = el('button', 'btn', 'Edit my answers');
    editAll.type = 'button';
    editAll.addEventListener('click', () => api.goTo(0));
    const again = el('button', 'btn', 'Start a new check-in');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    actions.append(print, editAll, again);
    container.append(actions);

    if (a.convo === 'lead' || a.convo === 'boss') {
      const box = el('section', 'prep-notes no-print');
      box.setAttribute('aria-labelledby', 'convo-title');
      const h = el('h3', null, 'Before that conversation');
      h.id = 'convo-title';
      const p = el('p');
      if (a.convo === 'lead') p.append(newTab('../feedback-conversation-planner/index.html', 'Open the Feedback Conversation Planner'), document.createTextNode(' to plan what you’ll say and ask.'));
      else p.append(newTab('../executive-ask-builder/index.html', 'Open the Executive Ask Builder'), document.createTextNode(' to prepare what you’re asking for.'));
      box.append(h, p, el('p', 'small', 'It opens in a new tab, and nothing from this note is carried over. This box doesn’t print.'));
      container.append(box);
    }

    const brief = el('article', 'brief');
    brief.setAttribute('aria-label', 'Check-in note');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    titleWrap.append(el('p', 'eyebrow', 'Check-in note'), el('h3', 'brief-title', 'I’m feeling ' + words.join(', ').replace(/, ([^,]*)$/, ' and $1').toLowerCase() + '.'));
    const editTop = el('button', 'btn brief-edit no-print', 'Edit');
    editTop.type = 'button';
    editTop.setAttribute('aria-label', 'Edit the words');
    editTop.addEventListener('click', () => api.goTo(0));
    top.append(titleWrap, editTop);
    brief.append(brand, top);

    if (text(a.situation)) {
      const s = section('What’s going on', 0, api, 'what’s going on');
      s.append(el('p', 'brief-text', text(a.situation)));
      brief.append(s);
    }

    const feel = section('What I’m feeling', 1, api, 'how strong it is');
    const rows = a.feelings.map(id => lookup[id].word + ' (' + lookup[id].core.name + ')');
    feel.append(bullets(rows), el('p', null, 'Strength: ' + a.strength + ' of 5, ' + strengthWord(a.strength) + '.'));
    brief.append(feel);

    // The same lines as the second shareable image, once per core feeling, kept inside this section so the note stays on one page.
    const seenCores = [];
    a.feelings.forEach(id => { const c = lookup[id].core; if (!seenCores.includes(c)) seenCores.push(c); });
    if (seenCores.length > 2) brief.classList.add('three-cores');
    feel.append(el('h4', null, 'What feelings like these often point to'));
    seenCores.forEach(c => {
      const row = el('p', 'often-row');
      const first = el('span');
      first.append(el('strong', null, c.name), document.createTextNode(': ' + c.points));
      row.append(first, el('span', null, 'A next move: ' + c.move));
      feel.append(row);
    });

    const why = labelsFor(behindFor(a), a.behind);
    if (why.length || text(a.behindNote)) {
      const s = section('What might be behind it', 2, api, 'what might be behind it');
      if (why.length) s.append(bullets(why));
      if (text(a.behindNote)) s.append(el('p', 'brief-text', text(a.behindNote)));
      brief.append(s);
    }

    const next = labelsFor(helpFor(a), a.help);
    if (next.length || text(a.first)) {
      const s = section(goodOnly(a) ? 'What I could do with it' : 'What could help', 3, api, 'what could help');
      if (next.length) s.append(bullets(next));
      if (text(a.first)) s.append(el('h4', null, 'My first step'), el('p', 'brief-text', text(a.first)));
      brief.append(s);
    }

    const notes = el('section', 'brief-section');
    notes.append(el('h3', null, 'Notes'), el('p', 'small no-print', 'Space to write on the printout.'));
    const lines = el('div', 'brief-lines');
    lines.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) lines.append(el('div'));
    notes.append(lines);
    brief.append(notes);

    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'A quick check-in with yourself, not therapy or a diagnosis. If a feeling stays heavy, talk with someone you trust or a professional.'));
    foot.append(el('p', null, 'Made with the Pivot Labs Emotion Wheel · ' + new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })));
    brief.append(foot);
    container.append(brief);
  }

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your note', finishLabel: 'See my note',
    // Exposed for testing.
    cores, lookup, wordId, MAX };
})();
