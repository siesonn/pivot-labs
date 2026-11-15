'use strict';
/*
  Decision Approach Picker content: the situation questions, the four ways to decide,
  each way's prompts, who's involved, making it hold, and the decision record.
  Shared engines: assets/js/guided-planner.js (the steps) and
  assets/js/situation-picker.js (the situation questions and the suggested way to decide).

  The questions describe the decision, never a person. Only the three answers in step 2 decide
  the suggestion, so the same answers always give the same suggestion, whoever is affected.
  "Whose call is it?" and "Where it stands" change wording only.
  The record is written to share with the people involved. For decisions about people it is marked private.
*/
const DecisionPicker = (() => {
  const el = GuidedPlanner.el;
  const text = value => (value || '').trim();
  const lines = value => text(value).split('\n').map(s => s.trim()).filter(Boolean);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const isPeople = a => a.people === 'yes';
  // "How hard is it to undo?" is hidden when something is going wrong right now, so an old answer is ignored.
  const undoOf = a => (a.kind === 'urgent' ? '' : a.undo);

  // The four ways to decide, from most known to least.
  const methods = [
    { id: 'known', title: 'Follow the known way',
      summary: 'Use the policy, standard, or approach that worked before, after checking nothing is different this time.',
      bestFor: 'Best when you’ve decided things like this before.' },
    { id: 'compare', title: 'Compare the options',
      summary: 'Agree on what matters, weigh it, and score every option against the same criteria.',
      bestFor: 'Best when there’s a good answer to find and it takes some analysis.' },
    { id: 'try', title: 'Try small and learn',
      summary: 'Run one to three small tests you can stop or undo, see what happens, then decide.',
      bestFor: 'Best when no one can know ahead of time what will work.' },
    { id: 'steady', title: 'Steady things first',
      summary: 'Take the action that stops the harm now. Decide the rest once things are calmer.',
      bestFor: 'Best when something is going wrong right now.' }
  ];

  // The first matching rule wins. Nothing about the people involved changes the result.
  function route(a) {
    if (!a.kind || !a.people) return null;
    if (a.kind === 'urgent') return 'steady';
    if (!a.undo) return null;
    if (a.kind === 'known') return 'known';
    if (isPeople(a)) return 'compare';
    if (a.kind === 'analyze') return 'compare';
    if (a.kind === 'new') return 'try';
    return a.undo === 'easy' ? 'try' : 'compare';
  }

  function suggest(a) {
    const id = route(a);
    if (!id) return null;
    const undo = undoOf(a);
    let base;
    if (id === 'steady') {
      base = 'When something is going wrong right now, the first job is to stop the harm. Act, see what changes, then decide the rest once things are calmer.';
    } else if (id === 'known') {
      base = isPeople(a)
        ? 'There’s a known process for decisions like this. Use it, with the same steps for everyone, and check whether anything is different this time.'
        : 'You’ve handled decisions like this before, so there’s no need to start from scratch. Use the known way, and check whether anything is different this time.';
    } else if (id === 'compare') {
      if (isPeople(a)) base = 'This decision affects people’s opportunities. Setting the criteria before you look at the options, and using the same ones for everyone, makes it fairer and easier to explain.';
      else if (a.kind === 'unsure') base = 'You’re not sure what kind of decision this is, and a wrong call would be costly. Comparing the options against clear criteria is the safer start.';
      else base = 'There’s a good answer to find, and it takes some analysis. Scoring every option against the same few criteria shows the trade-offs and makes the reasons easy to share.';
    } else {
      base = a.kind === 'new'
        ? 'No one can know ahead of time what will work. Small tests you can stop or undo will teach you more than more analysis.'
        : 'It’s easy to undo, so a small test will tell you more than more debate.';
    }
    const extra = [];
    if (id === 'try' && undo === 'hard') extra.push('The decision itself is hard to undo, so test the parts you can before you commit to the whole, and hear from the people it affects.');
    else if (id !== 'steady' && undo === 'hard') extra.push('Because it’s hard to undo, hear from the people it affects, and ask what could go wrong before you commit.');
    if (id === 'compare' && undo === 'easy') extra.push('Since it’s easy to undo, keep it light: two or three criteria, and a date to decide.');
    if (id !== 'steady' && a.kind === 'unsure') extra.push('If parts of it feel familiar and parts feel new, split it and decide each part its own way.');
    if (isPeople(a)) {
      extra.push(id === 'steady'
        ? 'Follow your organization’s process for decisions about people, and bring in HR as soon as you can.'
        : 'Check your process with HR, and keep notes about people private.');
    }
    return { id, reason: [base, ...extra].join(' ') };
  }

  const picker = SituationPicker.create({
    options: methods,
    suggest,
    questions: [
      { id: 'kind', type: 'choice', label: 'Which sounds most like this decision?',
        hint: 'Go by how much anyone can know ahead of time, not by how big it feels.', options: [
          { value: 'known', label: 'We’ve decided things like this before. There’s a known way to handle it, such as a policy, a standard, or what worked last time.' },
          { value: 'analyze', label: 'There’s a good answer, but finding it takes comparing options or getting expert input.' },
          { value: 'new', label: 'It’s new for us. No one can know ahead of time what will work, because it depends on how people or things respond.' },
          { value: 'urgent', label: 'Something is going wrong right now, and waiting will make it worse.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] },
      { id: 'undo', type: 'choice', label: 'If it turns out to be the wrong call, how hard is it to change course?',
        showIf: a => a.kind !== 'urgent', options: [
          { value: 'easy', label: 'Easy. We could change it back without much cost.' },
          { value: 'costly', label: 'Possible, but it would cost time, money, or trust.' },
          { value: 'hard', label: 'Hard or impossible to undo.' }
        ] },
      { id: 'people', type: 'choice', label: 'Does the decision choose between people, or change someone’s work?',
        hint: 'For example, hiring, promotion, or who gets an assignment or opportunity. Decisions about pay, discipline, or ending someone’s employment follow your organization’s process, so talk with HR first.',
        note: a => (isPeople(a) ? 'The tool will ask you to treat everyone the same way and to use initials or letters instead of names. Keep your record private.' : ''),
        options: [
          { value: 'no', label: 'No.' },
          { value: 'yes', label: 'Yes.' }
        ] }
    ]
  });
  const method = a => picker.find(a.method);
  const on = (...ids) => a => ids.includes(a.method);

  // A labeled text box inside a custom field. It saves as you type, like the engine's own fields.
  function labeledInput(o) {
    const wrap = el('div', o.cls || 'part');
    const label = el('label');
    label.htmlFor = o.id;
    if (o.srPrefix) label.append(el('span', 'visually-hidden', o.srPrefix));
    label.append(o.label + (o.optional ? ' (optional)' : ''));
    wrap.append(label);
    const described = [];
    if (o.hint) {
      const h = el('p', 'small field-hint', o.hint);
      h.id = 'hint-' + o.id;
      wrap.append(h);
      described.push(h.id);
    }
    const input = el(o.multiline ? 'textarea' : 'input');
    if (!o.multiline) { input.type = 'text'; input.autocomplete = 'off'; }
    input.id = o.id;
    input.maxLength = o.maxlength || 200;
    input.value = o.value || '';
    let err = null;
    if (o.error) {
      err = GuidedPlanner.errorSlot('err-' + o.id);
      described.push(err.id);
    }
    if (described.length) input.setAttribute('aria-describedby', described.join(' '));
    wrap.append(input);
    if (err) wrap.append(err);
    input.addEventListener('input', () => {
      if (err && !err.hidden && text(input.value)) { err.hidden = true; input.removeAttribute('aria-invalid'); }
      o.onInput(input.value);
    });
    return { wrap, input };
  }

  // A numbered list the leader can add rows to and remove rows from (criteria, options, tests).
  function rowList(api, cfg) {
    const box = el('div', 'edit-rows-wrap');
    const ol = el('ol', 'edit-rows');
    const add = el('button', 'btn edit-add', cfg.addLabel);
    add.type = 'button';
    const limit = el('p', 'small edit-limit');
    box.append(ol, add, limit);
    const items = () => api.answers[cfg.key];
    function draw(focusIndex) {
      ol.replaceChildren();
      const list = items();
      list.forEach((item, i) => {
        const li = el('li', 'edit-row');
        const num = el('span', 'row-num', String(i + 1));
        num.setAttribute('aria-hidden', 'true');
        const body = el('div', 'row-body');
        body.append(...cfg.renderRow(item, i));
        li.append(num, body);
        if (list.length > cfg.min) {
          const rm = el('button', 'btn row-remove', 'Remove');
          rm.type = 'button';
          rm.setAttribute('aria-label', 'Remove ' + cfg.itemName + ' ' + (i + 1));
          rm.addEventListener('click', () => {
            if (cfg.onRemove) cfg.onRemove(item);
            const next = items().filter(x => x !== item);
            api.set(cfg.key, next);
            draw(Math.min(i, next.length - 1));
            if (cfg.onChange) cfg.onChange();
            api.announce(cap(cfg.itemName) + ' ' + (i + 1) + ' removed.');
          });
          li.append(rm);
        }
        ol.append(li);
      });
      const full = list.length >= cfg.max;
      add.hidden = full;
      limit.textContent = full ? 'That’s the most this list holds.' : '';
      if (focusIndex !== undefined && ol.children[focusIndex]) {
        const target = ol.children[focusIndex].querySelector('input,textarea');
        if (target) target.focus();
      }
    }
    add.addEventListener('click', () => {
      const next = items().concat([cfg.make(api.answers)]);
      api.set(cfg.key, next);
      draw(next.length - 1);
      if (cfg.onChange) cfg.onChange();
    });
    draw();
    return { box, draw };
  }

  // Compare the options: criteria with importance, options, must-haves, and scores.
  const weights = [
    { value: '3', label: 'Essential', counts: 'counts three times' },
    { value: '2', label: 'Important', counts: 'counts twice' },
    { value: '1', label: 'Nice to have', counts: 'counts once' }
  ];
  const weightOf = c => Number(c.weight) || 2;
  const weightLabel = c => (weights.find(w => Number(w.value) === weightOf(c)) || weights[1]).label;
  const named = list => (list || []).filter(x => text(x.name));
  const inScope = a => named(a.options).filter(o => !(text(a.musts) && o.out));
  const ruledOut = a => (text(a.musts) ? named(a.options).filter(o => o.out) : []);
  const scoreKey = (o, c) => o.id + '|' + c.id;
  const scoreOf = (a, o, c) => Number(a.scores[scoreKey(o, c)]) || 0;

  function totals(a) {
    const crits = named(a.criteria);
    const max = crits.reduce((sum, c) => sum + 5 * weightOf(c), 0);
    const rows = inScope(a).map(o => {
      let total = 0;
      let complete = true;
      crits.forEach(c => {
        const v = scoreOf(a, o, c);
        if (v) total += v * weightOf(c);
        else complete = false;
      });
      return { id: o.id, name: text(o.name), total, complete };
    });
    const ranked = rows.slice().sort((x, y) => y.total - x.total);
    const complete = crits.length >= 2 && named(a.options).length >= 2 && rows.length >= 1 && rows.every(r => r.complete);
    let top = null;
    let tie = false;
    let close = false;
    if (complete) {
      top = ranked[0];
      if (ranked.length > 1) {
        const gap = ranked[0].total - ranked[1].total;
        tie = gap === 0;
        close = !tie && gap <= Math.max(2, Math.round(max * 0.05));
      }
    }
    return { crits, max, rows, ranked, complete, top: tie ? null : top, tie, close };
  }
  const closeNote = t => (t.tie
    ? 'There’s a tie at the top. The scores alone can’t decide. Look at the criterion that matters most, or ask what would break the tie.'
    : t.close ? 'The top two are close. The scores alone shouldn’t decide. Look at the criterion that matters most, or ask what would break the tie.' : '');

  // Criteria that are hard to score the same way for everyone. A nudge only, for decisions about people.
  const vaguePatterns = [/\bculture fit\b/i, /\bfit\b/i, /\bpersonality\b/i, /\battitude\b/i, /\bpresence\b/i,
    /\bpolish(?:ed)?\b/i, /\blik(?:e)?ab(?:le|ility)\b/i, /\bgut(?: feel(?:ing)?)?\b/i];
  function vagueWord(value) {
    const t = text(value);
    for (const p of vaguePatterns) {
      const m = t.match(p);
      if (m) return m[0];
    }
    return '';
  }
  const vagueNote = value => {
    const word = vagueWord(value);
    return word ? 'This may be hard to score the same way for everyone (“' + word + '”). Describe what the work needs instead. Example: Explains changes clearly to customers.' : '';
  };

  const compareField = {
    id: 'compare',
    type: 'custom',
    showIf: on('compare'),
    render(wrap, api) {
      const a = api.answers;
      const people = isPeople(a);

      // Must-haves come first: an option that misses one is out before scoring.
      const musts = labeledInput({
        id: 'field-musts', label: 'Must-haves', optional: true, multiline: true, maxlength: 600, value: a.musts,
        hint: 'Anything an option has to meet to stay in. An option that misses one is out before you score. Example: Works with our calendar system.',
        onInput: v => { api.set('musts', v); showOut(); drawScores(); }
      });

      // What matters, set before the options.
      const critSet = el('fieldset', 'part');
      critSet.append(el('legend', null, 'What matters most?'));
      const critHint = el('p', 'hint', people
        ? 'Two to five criteria. Set these before you look at the options, based on what the work needs. For assignments, weigh workload and who hasn’t had a chance yet, not only who’s done it before.'
        : 'Two to five criteria. Describe what good looks like, so anyone could score it the same way. Example: Easy for shift leads to learn.');
      critHint.id = 'hint-criteria';
      const critErr = GuidedPlanner.errorSlot('err-criteria');
      critSet.setAttribute('aria-describedby', critHint.id + ' ' + critErr.id);
      const crit = rowList(api, {
        key: 'criteria', min: 2, max: 5, itemName: 'criterion', addLabel: 'Add a criterion',
        make: x => ({ id: 'c' + (++x.seq), name: '', weight: '2' }),
        onRemove: item => Object.keys(a.scores).forEach(k => { if (k.endsWith('|' + item.id)) delete a.scores[k]; }),
        onChange: () => drawScores(),
        renderRow(item, i) {
          const note = el('p', 'planner-note');
          note.setAttribute('aria-live', 'polite');
          note.textContent = people ? vagueNote(item.name) : '';
          const name = labeledInput({
            id: 'crit-' + item.id, cls: 'row-part', label: 'Criterion ' + (i + 1), maxlength: 100, value: item.name,
            onInput: v => {
              item.name = v;
              if (people) note.textContent = vagueNote(v);
              if (!critErr.hidden && named(a.criteria).length >= 2) critErr.hidden = true;
              api.set('criteria', a.criteria);
              drawScores();
            }
          });
          const wWrap = el('div', 'row-part');
          const wLab = el('label', null, 'How important is it?');
          wLab.htmlFor = 'weight-' + item.id;
          const sel = el('select');
          sel.id = 'weight-' + item.id;
          weights.forEach(w => {
            const op = el('option', null, w.label + ' (' + w.counts + ')');
            op.value = w.value;
            sel.append(op);
          });
          sel.value = String(weightOf(item));
          sel.addEventListener('change', () => { item.weight = sel.value; api.set('criteria', a.criteria); drawScores(); });
          wWrap.append(wLab, sel);
          return [name.wrap, note, wWrap];
        }
      });
      critSet.append(critHint, crit.box, critErr);

      // The options.
      const optSet = el('fieldset', 'part');
      optSet.append(el('legend', null, 'What are the options?'));
      const optHint = el('p', 'hint', people
        ? 'Two to five. Use a letter or initials for each person, such as Candidate A.'
        : 'Two to five. Include “keep things as they are” if it’s a real choice.');
      optHint.id = 'hint-options';
      const optErr = GuidedPlanner.errorSlot('err-options');
      optSet.setAttribute('aria-describedby', optHint.id + ' ' + optErr.id);
      const opts = rowList(api, {
        key: 'options', min: 2, max: 5, itemName: 'option', addLabel: 'Add an option',
        make: x => ({ id: 'o' + (++x.seq), name: '', out: false }),
        onRemove: item => Object.keys(a.scores).forEach(k => { if (k.startsWith(item.id + '|')) delete a.scores[k]; }),
        onChange: () => { showOut(); drawScores(); },
        renderRow(item, i) {
          const name = labeledInput({
            id: 'opt-' + item.id, cls: 'row-part', label: 'Option ' + (i + 1), maxlength: 100, value: item.name,
            onInput: v => {
              item.name = v;
              if (!optErr.hidden && named(a.options).length >= 2) optErr.hidden = true;
              api.set('options', a.options);
              drawScores();
            }
          });
          const out = el('label', 'check-option row-out');
          const box = el('input');
          box.type = 'checkbox';
          box.id = 'out-' + item.id;
          box.checked = !!item.out;
          box.addEventListener('change', () => { item.out = box.checked; api.set('options', a.options); drawScores(); });
          out.append(box, el('span', null, 'Misses a must-have'));
          out.hidden = !text(a.musts);
          return [name.wrap, out];
        }
      });
      optSet.append(optHint, opts.box, optErr);
      function showOut() {
        optSet.querySelectorAll('.row-out').forEach(n => { n.hidden = !text(a.musts); });
      }

      // Scores, grouped by option so they stack in reading order on any screen.
      const scoreSet = el('fieldset', 'part');
      scoreSet.append(el('legend', null, 'Score each option'));
      const scoreHint = el('p', 'hint', '1 is poor, 3 is okay, and 5 is strong. Score every option on every criterion.' +
        (people ? ' Base each score on evidence, not impressions.' : ''));
      scoreHint.id = 'hint-scores';
      const scoreErr = GuidedPlanner.errorSlot('err-scores');
      scoreSet.setAttribute('aria-describedby', scoreHint.id + ' ' + scoreErr.id);
      const groups = el('div', 'score-groups');
      const totalsBox = el('section', 'score-totals');
      totalsBox.setAttribute('aria-labelledby', 'totals-title');
      scoreSet.append(scoreHint, groups, scoreErr);

      function drawTotals() {
        totalsBox.replaceChildren();
        const t = totals(a);
        const h = el('h3', null, 'Totals');
        h.id = 'totals-title';
        totalsBox.append(h);
        if (!t.complete) {
          totalsBox.append(el('p', 'small', 'Totals appear when every option has a score for every criterion.'));
          return;
        }
        const ol = el('ol', 'score-rank');
        t.ranked.forEach(r => {
          const li = el('li');
          li.append(el('span', 'score-name', r.name), el('span', 'score-total', r.total + ' of ' + t.max));
          ol.append(li);
        });
        totalsBox.append(ol);
        const note = closeNote(t);
        if (note) totalsBox.append(el('p', 'planner-note', note));
        totalsBox.append(el('p', 'small', 'Each score is multiplied by how important the criterion is. Essential counts three times, Important twice, and Nice to have once.'));
      }

      function drawScores() {
        groups.replaceChildren();
        const crits = named(a.criteria);
        const scope = inScope(a);
        if (crits.length < 2 || named(a.options).length < 2) {
          groups.append(el('p', 'small', 'Name at least two criteria and two options, and the scores will appear here.'));
        } else if (!scope.length) {
          groups.append(el('p', 'planner-note', 'Every option misses a must-have. Add an option, or check whether each must-have is truly required.'));
        } else {
          scope.forEach(o => {
            const g = el('fieldset', 'score-group');
            g.append(el('legend', null, text(o.name)));
            crits.forEach(c => {
              const row = el('div', 'score-row');
              const id = 'score-' + o.id + '-' + c.id;
              const lab = el('label');
              lab.htmlFor = id;
              lab.append(text(c.name), ' ', el('span', 'score-weight', '(' + weightLabel(c) + ')'));
              const sel = el('select');
              sel.id = id;
              [['', 'Choose a score'], ['1', '1 Poor'], ['2', '2'], ['3', '3 Okay'], ['4', '4'], ['5', '5 Strong']].forEach(([v, l]) => {
                const op = el('option', null, l);
                op.value = v;
                sel.append(op);
              });
              sel.value = a.scores[scoreKey(o, c)] || '';
              sel.setAttribute('aria-describedby', scoreErr.id);
              sel.addEventListener('change', () => {
                if (sel.value) a.scores[scoreKey(o, c)] = sel.value;
                else delete a.scores[scoreKey(o, c)];
                sel.removeAttribute('aria-invalid');
                api.set('scores', a.scores);
                if (!scoreErr.hidden && totals(a).complete) scoreErr.hidden = true;
                drawTotals();
              });
              row.append(lab, sel);
              g.append(row);
            });
            groups.append(g);
          });
          const out = ruledOut(a);
          if (out.length) groups.append(el('p', 'small', 'Not scored, because they miss a must-have: ' + out.map(o => text(o.name)).join(', ') + '.'));
        }
        drawTotals();
      }

      wrap.append(musts.wrap, critSet, optSet, scoreSet, totalsBox);
      drawScores();
    },
    validate(a) {
      const errors = [];
      const crits = named(a.criteria);
      const opts = named(a.options);
      if (crits.length < 2) {
        const first = a.criteria.find(c => !text(c.name)) || a.criteria[0];
        errors.push({ errorId: 'err-criteria', focusId: 'crit-' + first.id, message: 'Name at least two criteria to continue.' });
      }
      if (opts.length < 2) {
        const first = a.options.find(o => !text(o.name)) || a.options[0];
        errors.push({ errorId: 'err-options', focusId: 'opt-' + first.id, message: 'Name at least two options to continue.' });
      }
      if (errors.length) return errors;
      const scope = inScope(a);
      if (!scope.length) {
        return [{ errorId: 'err-scores', focusId: 'out-' + opts[0].id, message: 'Every option misses a must-have. Add an option, or check the must-haves.' }];
      }
      let missing = null;
      scope.forEach(o => crits.forEach(c => { if (!missing && !scoreOf(a, o, c)) missing = 'score-' + o.id + '-' + c.id; }));
      if (missing) errors.push({ errorId: 'err-scores', focusId: missing, message: 'Score every option on every criterion to continue.' });
      return errors;
    }
  };

  function judgmentNote(a) {
    if (a.judgment !== 'no') return '';
    return isPeople(a)
      ? 'Write down why before you change anything, and talk it through with HR or a second reviewer. Changing criteria after scoring can tilt the result toward someone.'
      : 'Ask what the scores aren’t capturing. You may be missing a criterion or a weight, or your reaction may be worth naming. Adjust, then score again.';
  }

  // Try small and learn: one to three tests.
  const testParts = [
    { key: 'try', label: 'What will you try?', hint: 'Example: Shift leads use a five-line handoff note for two weeks.', required: true, multiline: true,
      error: 'Describe what you’ll try.' },
    { key: 'helping', label: 'How will you know it’s helping?', hint: 'Example: Fewer questions in the first hour of each shift.', required: true,
      error: 'Say how you’ll know it’s helping.' },
    { key: 'stop', label: 'What would tell you to stop?', hint: 'Example: Handoffs take longer than ten minutes.' },
    { key: 'undoIt', label: 'How would you undo it?', hint: 'Example: Go back to the old checklist.' },
    { key: 'howLong', label: 'For how long?', hint: 'Example: Two weeks' }
  ];
  const testHasContent = t => testParts.some(p => text(t[p.key]));
  const testsField = {
    id: 'tests',
    type: 'custom',
    showIf: on('try'),
    render(wrap, api) {
      const a = api.answers;
      const set = el('fieldset');
      set.append(el('legend', null, 'Your tests'));
      const hint = el('p', 'hint', 'One to three. Each should be small enough that it’s fine if it fails. Trying more than one idea at a time helps you learn faster.');
      hint.id = 'hint-tests';
      set.setAttribute('aria-describedby', hint.id);
      const list = rowList(api, {
        key: 'tests', min: 1, max: 3, itemName: 'test', addLabel: 'Add a test',
        make: x => ({ id: 't' + (++x.seq), try: '', helping: '', stop: '', undoIt: '', howLong: '' }),
        renderRow: (item, i) => testParts.map(p => labeledInput({
          id: 'test-' + p.key + '-' + item.id, cls: 'row-part', label: p.label, srPrefix: 'Test ' + (i + 1) + ': ',
          hint: i === 0 ? p.hint : '', optional: !p.required, multiline: p.multiline, maxlength: p.multiline ? 400 : 200,
          value: item[p.key], error: p.required,
          onInput: v => { item[p.key] = v; api.set('tests', a.tests); }
        }).wrap)
      });
      set.append(hint, list.box);
      wrap.append(set);
    },
    validate(a) {
      const errors = [];
      a.tests.forEach((t, i) => {
        if (i > 0 && !testHasContent(t)) return;
        testParts.filter(p => p.required && !text(t[p.key])).forEach(p => {
          errors.push({ errorId: 'err-test-' + p.key + '-' + t.id, focusId: 'test-' + p.key + '-' + t.id, message: p.error });
        });
      });
      return errors;
    }
  };

  const steadyNote = {
    id: 'steadyNote',
    type: 'custom',
    showIf: on('steady'),
    render(wrap) {
      wrap.append(el('p', 'planner-note', 'If anyone is hurt or could be, or this may be a safety, legal, HR, or compliance matter, follow your organization’s process first. This tool doesn’t replace it.'));
    }
  };

  const workFields = [
    // Follow the known way
    { id: 'knownWay', type: 'textarea', maxlength: 1000, showIf: on('known'), label: 'What’s the known way?',
      hint: 'The policy, standard, or approach that worked before, and where it’s written down. Example: The travel policy caps hotel costs at $200 a night.',
      after: a => (isPeople(a) ? 'Use the same steps for everyone, in the same order.' : ''),
      error: 'Describe the known way.' },
    { id: 'different', type: 'choice', showIf: on('known'), label: 'Is anything different this time?',
      options: [
        { value: 'no', label: 'No. This case is like the others.' },
        { value: 'yes', label: 'Yes, something’s different.' },
        { value: 'unsure', label: 'I’m not sure.' }
      ],
      note: a => ({
        yes: 'If the difference matters, Compare the options may fit better. You can choose it in step 3.',
        unsure: 'Check with someone who has handled cases like this before you decide.'
      })[a.different] || '' },
    { id: 'differentWhat', type: 'textarea', maxlength: 600, optional: true, showIf: a => a.method === 'known' && a.different === 'yes',
      label: 'What’s different?', hint: 'Example: This trip includes a client dinner the policy doesn’t cover.' },
    { id: 'confirm', type: 'text', maxlength: 120, optional: true, showIf: on('known'), label: 'Who can confirm it?',
      hint: 'Someone who knows the standard. Example: Dana in Finance' },
    // Compare the options
    compareField,
    { id: 'basis', type: 'textarea', maxlength: 600, optional: true, showIf: on('compare'), label: 'What are the scores based on?',
      hint: a => (isPeople(a)
        ? 'The same kinds of evidence for everyone, such as work samples, results you’ve seen, or answers to the same interview questions.'
        : 'Example: Vendor demos, a two-week trial, and price quotes.') },
    { id: 'judgment', type: 'choice', showIf: on('compare'), label: 'Does the top score match your judgment?',
      options: [
        { value: 'yes', label: 'Yes.' },
        { value: 'no', label: 'No. Something seems off.' }
      ],
      note: judgmentNote, error: 'Choose an answer to continue.' },
    { id: 'judgmentWhy', type: 'textarea', maxlength: 600, optional: true, showIf: a => a.method === 'compare' && a.judgment === 'no',
      label: a => (isPeople(a) ? 'Why doesn’t it match?' : 'What do the scores seem to miss?'),
      hint: a => (isPeople(a) ? 'Write it down before you change anything.' : 'Example: None of the criteria covers how much training each option needs.') },
    // Try small and learn
    { id: 'hope', type: 'textarea', maxlength: 600, showIf: on('try'), label: 'What are you hoping for?',
      hint: 'A direction, not a fixed target. Example: Fewer late handoffs between shifts.', error: 'Describe what you’re hoping for.' },
    testsField,
    { id: 'lookWhen', type: 'text', maxlength: 120, showIf: on('try'), label: 'When will you look at what you’ve learned?',
      hint: 'Example: Friday, March 13, at the team meeting', error: 'Say when you’ll look at what you’ve learned.' },
    { id: 'notice', type: 'text', maxlength: 200, optional: true, showIf: on('try'), label: 'Who will notice first if it’s working?',
      hint: 'Often the people doing the work. Ask them to tell you. Example: The night shift leads',
      after: 'Expect some tests not to work. That’s information, not failure.' },
    // Steady things first
    steadyNote,
    { id: 'nowAction', type: 'textarea', maxlength: 600, showIf: on('steady'), label: 'What will you do right now to stop the harm?',
      hint: 'One or two actions. Example: Pause the automated reminder emails until the error is fixed.', error: 'Describe what you’ll do right now.' },
    { id: 'tellNow', type: 'text', maxlength: 200, optional: true, showIf: on('steady'), label: 'Who needs to know right now?',
      hint: 'Example: My manager and the client lead' },
    { id: 'reviewWhen', type: 'text', maxlength: 120, showIf: on('steady'), label: 'When will you stop and review?',
      hint: 'Example: Tomorrow at 9, once things are stable', default: () => 'Within a day, once things are stable', error: 'Say when you’ll review.' },
    { id: 'decideLater', type: 'textarea', maxlength: 600, optional: true, showIf: on('steady'), label: 'What will you decide once things are calmer?',
      hint: 'Example: Whether to switch email vendors. Come back to this tool then.' }
  ];

  // Step 5: who's involved. The roles use plain names.
  const whoseOptions = [
    { value: 'me', label: 'Mine.', record: 'One person decides' },
    { value: 'above', label: 'Someone else’s. I’m making a recommendation.', record: 'A recommendation to the person who makes the final call' },
    { value: 'group', label: 'Ours. We’ll decide together.', record: 'Decided together as a group' },
    { value: 'handoff', label: 'I’m handing it to someone else to decide.', record: 'Handed to someone else to decide' }
  ];
  const whoseNote = a => ({
    me: 'If you’re asking for input, say up front that you’ll make the call, so no one expects a vote.',
    above: 'Your record becomes a recommendation. Ask how and by when they’d like it.',
    group: 'Agree before you start how you’ll decide if you can’t all agree. Example: If we haven’t agreed by Friday, Sam decides.',
    handoff: 'Tell them the limits, such as budget, deadline, and must-haves, and whether they decide and tell you or check with you first.'
  })[a.whose] || '';
  const roleFields = [
    { id: 'whose', type: 'choice', label: 'Whose call is it?', options: whoseOptions.map(o => ({ value: o.value, label: o.label })),
      note: whoseNote, error: 'Choose whose call it is.' },
    { id: 'decides', type: 'text', maxlength: 120, label: 'Who makes the final call?',
      hint: 'A name or role, the way people will read it on the record. For a group, list who’s in it. Example: Jordan, team lead',
      error: 'Say who makes the final call.' },
    { id: 'driver', type: 'text', maxlength: 120, optional: true, label: 'Who keeps it moving?',
      hint: 'The person who gathers input and makes sure it’s decided on time. Often you.' },
    { id: 'input', type: 'textarea', maxlength: 600, optional: true, label: 'Who will you ask for input?',
      hint: a => (a.method === 'steady'
        ? 'In the moment, you may not have time to ask. Ask afterward, at the review.'
        : 'People who know the work or will feel the effects. Example: Priya (scheduling) and the two shift leads'),
      after: 'Is anyone affected who hasn’t been asked? People on other shifts, part-time, or remote are easy to miss.' },
    { id: 'carry', type: 'text', maxlength: 200, optional: true, label: 'Who will carry it out?', hint: 'Example: The scheduling team' },
    { id: 'inform', type: 'text', maxlength: 200, optional: true, label: 'Who needs to know once it’s decided?', hint: 'Example: Everyone on the floor, and the client lead' }
  ];

  // Step 6: make it hold. Unchecked checklist items become reminders on screen.
  const C = {
    one: { value: 'one', label: 'I can say the decision in one sentence.', reminder: 'Shorten the decision to one sentence anyone could repeat.' },
    why: { value: 'why', label: 'I can explain why in a sentence or two.', reminder: 'Write the two or three reasons that matter most, in plain words.' },
    reopen: { value: 'reopen', label: 'I’ve named what would reopen it, and what wouldn’t.', reminder: 'Name the new information that would reopen it, so pushback alone doesn’t.' },
    heard: { value: 'heard', label: 'Everyone it affects has been asked, or will be told.', reminder: 'Check who it affects, including people on other shifts, part-time, or remote, and plan how they’ll hear.' },
    same: { value: 'same', label: 'I’d make this call the same way whoever it affects.', reminder: 'Read it again as if it affected someone else. If you’d decide differently, rethink it.' },
    small: { value: 'small', label: 'Every test is small enough to stop or undo.', reminder: 'Shrink any test you couldn’t easily stop or undo.' },
    before: { value: 'before', label: 'I set the criteria before I looked at the options.', reminder: 'If you set the criteria after looking at the options, review them with HR or a second reviewer.' },
    evidence: { value: 'evidence', label: 'I scored every option on the same criteria, with the same kinds of evidence.', reminder: 'Check that every option was scored on the same criteria, with the same kinds of evidence.' },
    steps: { value: 'steps', label: 'I followed the same steps, in the same order, for everyone.', reminder: 'Check that everyone went through the same steps, in the same order.' },
    hr: { value: 'hr', label: 'I’ve checked my process with HR.', reminder: 'Check your process with HR before you share the decision.' },
    told: { value: 'told', label: 'The people who need to know right now know.', reminder: 'Tell the people who need to know right now.' },
    review: { value: 'review', label: 'I’ve set a time to stop and review.', reminder: 'Set a time to stop and review, even if it’s tomorrow morning.' },
    cause: { value: 'cause', label: 'Once things are calm, I’ll look at what led to this.', reminder: 'Plan to look at what led to this once things are calm.' },
    hrSoon: { value: 'hrSoon', label: 'I’ve brought in HR, or will as soon as I can.', reminder: 'Bring in HR as soon as you can.' }
  };
  function checkItems(methodId, people) {
    if (methodId === 'steady') return [C.told, C.review, C.cause, C.same].concat(people ? [C.hrSoon] : []);
    return [C.one, C.why, C.reopen, C.heard, C.same]
      .concat(methodId === 'try' ? [C.small] : [])
      .concat(people ? (methodId === 'compare' ? [C.before, C.evidence] : [C.steps]).concat([C.hr]) : []);
  }
  const checkKeyFor = a => 'checks_' + (a.method || 'known') + (isPeople(a) ? '_people' : '');
  const checkFields = [];
  methods.forEach(m => [false, true].forEach(people => {
    const key = 'checks_' + m.id + (people ? '_people' : '');
    checkFields.push({
      id: key, type: 'multi', optional: true, label: 'Before you share it, check what’s true.',
      hint: 'Anything unchecked becomes a reminder above your record. The checklist doesn’t print.',
      showIf: a => checkKeyFor(a) === key,
      options: checkItems(m.id, people).map(c => ({ value: c.value, label: c.label }))
    });
  }));
  function checklist(a) {
    const done = a[checkKeyFor(a)] || [];
    return checkItems(a.method, isPeople(a)).map(c => ({ label: c.label, done: done.includes(c.value), reminder: c.reminder }));
  }

  function suggestedCheck(a, we) {
    return ({
      known: 'after the next few cases like this one',
      compare: 'in four to six weeks',
      try: we ? 'when we look at what we’ve learned' : 'when you look at what you’ve learned',
      steady: 'once things are stable, then again in a week'
    })[a.method] || 'in a few weeks';
  }

  // The decision starts as the top-scoring option and follows it until the leader edits it.
  function statementFrom(a) {
    if (a.method !== 'compare') return '';
    const t = totals(a);
    return t.complete && t.top && !t.close ? 'We’ll go with ' + t.top.name + '.' : '';
  }
  function syncStatement(a) {
    const from = statementFrom(a);
    if (!text(a.statement) || a.statement === a.statementFrom) {
      a.statement = from;
      a.statementFrom = from;
    }
  }

  const statusOptions = [
    { value: 'decided', label: 'It’s decided.', record: 'Decided' },
    { value: 'recommend', label: 'It’s my recommendation. Someone else makes the final call.', record: 'Recommended' },
    { value: 'plan', label: 'It’s not decided yet. This is the plan to decide.', record: 'In progress' }
  ];
  const hasRisks = a => a.method !== 'steady' && ['costly', 'hard'].includes(undoOf(a));
  const holdFields = [
    // Keeps the decision in step with the top-scoring option until the leader edits it. Shows nothing.
    { id: 'statementSync', type: 'custom', showIf: () => false, render: (wrap, api) => syncStatement(api.answers) },
    { id: 'status', type: 'choice', label: 'Where does it stand?', options: statusOptions.map(o => ({ value: o.value, label: o.label })),
      note: a => (a.whose === 'above' && a.status === 'decided' ? 'You said someone else makes the final call. “It’s my recommendation” may fit better.' : ''),
      error: 'Choose where it stands.' },
    { id: 'statement', type: 'textarea', maxlength: 300, label: 'What’s the decision, in one sentence?',
      hint: a => (text(a.statement) && a.statement === a.statementFrom ? 'Starts with your top-scoring option. Edit it if it doesn’t fit. ' : '') +
        'One sentence anyone could repeat. If it isn’t final yet, write your recommendation or your next step. Example: We’ll move the team to Shiftboard on April 1.',
      error: 'Write the decision in one sentence.' },
    { id: 'why', type: 'textarea', maxlength: 800, label: 'Why?',
      hint: a => 'The two or three reasons that matter most, in plain words. People can only explain a decision if they’ve heard why. ' +
        (a.method === 'compare' ? 'Example: It scored highest on what matters most, ease of use for shift leads and cost.' : 'Example: It cuts handoff time, and the team asked for it.'),
      error: 'Write why, in a sentence or two.' },
    { id: 'reopen', type: 'textarea', maxlength: 600, showIf: a => a.method !== 'steady', label: 'What would make you look at it again?',
      hint: 'Name the new information that would reopen it. Example: If error rates go up two weeks in a row.',
      after: 'Disagreement is welcome. It reopens a decision when it brings new information, whoever raises it.',
      error: 'Name what would make you look at it again.' },
    { id: 'expect', type: 'textarea', maxlength: 800, optional: true, showIf: a => a.method !== 'steady',
      label: 'What questions or pushback do you expect, and how will you answer?',
      hint: 'Naming them now means they won’t feel like a reason to start over. Example: Will the new tool be slower? We’ll check speed at the four-week review.' },
    { id: 'risks', type: 'textarea', maxlength: 800, optional: true, showIf: hasRisks, label: 'What could go wrong?',
      hint: 'Imagine it’s six months from now and this didn’t work. What’s the most likely reason, and what can you do now to prevent it?' },
    { id: 'firstSteps', type: 'textarea', maxlength: 1000, label: 'What are the first steps?',
      hint: 'Who does what, by when. Use a date, not “soon.” One per line. Example: Priya sets up accounts by March 20.',
      error: 'Add at least one first step.' },
    { id: 'checkWhen', type: 'text', maxlength: 120, optional: true, label: 'When will you check how it’s going?',
      hint: 'Example: Thursday, April 30, at the team meeting', note: a => 'Suggested: check ' + suggestedCheck(a, false) + '.' },
    ...checkFields
  ];

  // The record
  function section(title, step, api, label) {
    const s = el('section', 'brief-section');
    const head = el('div', 'brief-section-head');
    head.append(el('h3', null, title));
    if (step !== null) {
      const edit = el('button', 'btn brief-edit no-print', 'Edit');
      edit.type = 'button';
      edit.setAttribute('aria-label', 'Edit ' + label);
      edit.addEventListener('click', () => api.goTo(step));
      head.append(edit);
    }
    s.append(head);
    return s;
  }
  function pairs(items) {
    const dl = el('dl');
    items.forEach(([term, value]) => { if (text(value)) dl.append(el('dt', null, term), el('dd', null, text(value))); });
    return dl;
  }
  function list(items, cls) {
    const ul = el('ul', cls);
    items.forEach(t => ul.append(el('li', null, t)));
    return ul;
  }
  // A line that links to another tool. On screen only: it opens in a new tab and carries no entries.
  function toolLink(before, label, href) {
    const p = el('p', 'small no-print');
    const a = el('a', null, label + ' (opens in a new tab)');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    p.append(before, a, '.');
    return p;
  }

  // The scores as a table for wide screens and print, and as a list on phones.
  function matrix(a) {
    const t = totals(a);
    const scope = inScope(a);
    const wrap = el('div', 'matrix');
    const table = el('table', 'matrix-table');
    table.append(el('caption', 'visually-hidden', 'Scores for each option, from 1 to 5, and weighted totals'));
    const thead = el('thead');
    const hr = el('tr');
    [['What matters'], ['Importance']].concat(scope.map(o => [text(o.name)])).forEach(([label]) => {
      const th = el('th', null, label);
      th.scope = 'col';
      hr.append(th);
    });
    thead.append(hr);
    const tbody = el('tbody');
    t.crits.forEach(c => {
      const tr = el('tr');
      const th = el('th', null, text(c.name));
      th.scope = 'row';
      tr.append(th, el('td', null, weightLabel(c)));
      scope.forEach(o => tr.append(el('td', 'num', String(scoreOf(a, o, c) || ''))));
      tbody.append(tr);
    });
    const tfoot = el('tfoot');
    const fr = el('tr');
    const fth = el('th', null, 'Total, out of ' + t.max);
    fth.scope = 'row';
    fth.colSpan = 2;
    fr.append(fth);
    scope.forEach(o => {
      const r = t.rows.find(x => x.id === o.id);
      const top = t.top && t.top.id === o.id;
      fr.append(el('td', 'num' + (top ? ' is-top' : ''), String(r.total) + (top ? ' (highest)' : '')));
    });
    tfoot.append(fr);
    table.append(thead, tbody, tfoot);

    const stack = el('ol', 'matrix-stack');
    t.ranked.forEach(r => {
      const li = el('li');
      const o = scope.find(x => x.id === r.id);
      li.append(el('p', 'matrix-stack-name', r.name + ': ' + r.total + ' of ' + t.max + (t.top && t.top.id === r.id ? ' (highest)' : '')));
      li.append(list(t.crits.map(c => text(c.name) + ' (' + weightLabel(c) + '): ' + scoreOf(a, o, c))));
      stack.append(li);
    });
    wrap.append(table, stack,
      el('p', 'small', 'Scores run from 1 (poor) to 5 (strong). Essential criteria count three times, Important twice, and Nice to have once.'));
    if (t.tie) wrap.append(el('p', null, 'There was a tie at the top, so the scores alone didn’t decide this.'));
    else if (t.close) wrap.append(el('p', null, 'The top two were close, so the scores alone didn’t decide this.'));
    return wrap;
  }

  function howDecided(doc, a, api) {
    const m = method(a);
    const how = section('How we decided', 3, api, 'how you decided');
    if (m) {
      const p = el('p');
      p.append(el('strong', null, m.title + '. '), m.summary);
      how.append(p);
    }
    if (a.method === 'known') {
      const diff = { no: 'No. This case is like the others.', yes: 'Yes.', unsure: 'Not sure yet.' }[a.different] || '';
      how.append(pairs([['The known way', a.knownWay], ['Anything different this time', diff],
        ['What’s different', a.different === 'yes' ? a.differentWhat : ''], ['Confirmed by', a.confirm]]));
    } else if (a.method === 'compare') {
      if (text(a.musts)) how.append(pairs([['Must-haves', a.musts]]));
      how.append(matrix(a));
      const out = ruledOut(a);
      if (out.length) how.append(pairs([['Ruled out by a must-have', out.map(o => text(o.name)).join(', ')]]));
      how.append(pairs([['What the scores are based on', a.basis],
        ['Where the scores and our judgment differed', a.judgment === 'no' ? (text(a.judgmentWhy) || 'The top score didn’t match our judgment.') : '']]));
    } else if (a.method === 'try') {
      how.append(pairs([['What we’re hoping for', a.hope]]));
      a.tests.filter(t => text(t.try)).forEach((t, i, all) => {
        how.append(el('h4', null, all.length > 1 ? 'Test ' + (i + 1) : 'The test'),
          pairs([['What we’ll try', t.try], ['How we’ll know it’s helping', t.helping], ['What would tell us to stop', t.stop],
            ['How we’d undo it', t.undoIt], ['For how long', t.howLong]]));
      });
      how.append(pairs([['When we’ll look at what we’ve learned', a.lookWhen], ['Who will notice first', a.notice]]));
    } else if (a.method === 'steady') {
      how.append(pairs([['What we did right away', a.nowAction], ['Who was told', a.tellNow], ['When we’ll stop and review', a.reviewWhen],
        ['What we’ll decide once things are calmer', a.decideLater]]));
    }
    doc.append(how);
  }

  const credit = {
    known: 'The four ways to decide draw on the Cynefin® framework by Dave Snowden.',
    compare: 'The four ways to decide draw on the Cynefin® framework by Dave Snowden. The scoring table adapts Stuart Pugh’s concept selection method.',
    try: 'The four ways to decide draw on the Cynefin® framework by Dave Snowden.',
    steady: 'The four ways to decide draw on the Cynefin® framework by Dave Snowden.'
  };

  function renderResult(container, a, api) {
    syncStatement(a);
    const m = method(a);
    const people = isPeople(a);
    const status = statusOptions.find(s => s.value === a.status);
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your record'), el('h2', null, 'Your decision record'),
      el('p', null, people
        ? 'Use Edit to change any section, then print it or save it as a PDF. This record includes notes about people, so keep it private and follow your organization’s rules for hiring and promotion records.'
        : 'Use Edit to change any section, then print it or save it as a PDF to share with the people involved.'));
    container.append(head);

    const open = checklist(a).filter(i => !i.done);
    if (open.length) {
      const box = el('section', 'prep-notes no-print');
      box.setAttribute('aria-labelledby', 'reminders-title');
      const h = el('h3', null, 'Before you share it');
      h.id = 'reminders-title';
      box.append(h, list(open.map(i => i.reminder)), el('p', 'small', 'These come from the checklist in step 6. They don’t print.'));
      container.append(box);
    }

    const actions = el('div', 'result-actions no-print');
    const print = el('button', 'btn primary', 'Print record');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    const editAll = el('button', 'btn', 'Edit my answers');
    editAll.type = 'button';
    editAll.addEventListener('click', () => api.goTo(5));
    const again = el('button', 'btn', 'Start a new decision');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    actions.append(print, editAll, again);
    container.append(actions, el('p', 'small no-print', (people
      ? 'Printed records include the names and notes you entered. Keep yours private.'
      : 'This record is written to share. Read it once the way the people involved would.') +
      ' In the print window, choose “Save as PDF” to keep a digital copy, and turn off browser headers and footers for a cleaner page.'));

    const doc = el('article', 'brief');
    doc.setAttribute('aria-label', 'Decision record');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    const today = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const meta = [status ? status.record : '', text(a.decideBy) ? 'Decide by ' + text(a.decideBy) : '', m ? m.title : '', today].filter(Boolean);
    titleWrap.append(el('p', 'eyebrow', people ? 'Decision record · Private' : 'Decision record'),
      el('h3', 'brief-title', text(a.question)), el('p', 'brief-meta', meta.join(' · ')));
    const editTop = el('button', 'btn brief-edit no-print', 'Edit');
    editTop.type = 'button';
    editTop.setAttribute('aria-label', 'Edit the decision question');
    editTop.addEventListener('click', () => api.goTo(0));
    top.append(titleWrap, editTop);
    doc.append(brand, top);

    const decision = section('The decision', 5, api, 'the decision');
    decision.append(el('p', 'decision-statement', text(a.statement)));
    if (a.status === 'recommend') decision.append(el('p', null, 'This is a recommendation.' + (text(a.decides) ? ' ' + text(a.decides) + ' makes the final call.' : '')));
    if (a.status === 'plan') decision.append(el('p', null, 'Not decided yet. This record is the plan to decide.'));
    doc.append(decision);

    const why = section('Why', 5, api, 'why');
    why.append(el('p', 'brief-text', text(a.why)));
    doc.append(why);

    if (text(a.prompt)) {
      const bg = section('Background', 0, api, 'the background');
      bg.append(el('p', 'brief-text', text(a.prompt)));
      doc.append(bg);
    }

    howDecided(doc, a, api);

    const whose = whoseOptions.find(o => o.value === a.whose);
    const roles = section('Who’s involved', 4, api, 'who’s involved');
    roles.append(pairs([['How it’s decided', whose ? whose.record : ''], ['Makes the final call', a.decides], ['Keeps it moving', a.driver],
      ['Gives input', a.input], ['Carries it out', a.carry], ['Needs to know', a.inform]]));
    if (a.whose === 'handoff') {
      roles.append(toolLink('To plan the handoff, including what they can decide on their own, use ', 'the Delegation Planner', '../delegation-planner/index.html'));
    }
    doc.append(roles);

    const next = section('What happens next', 5, api, 'what happens next');
    next.append(el('h4', null, 'First steps'), list(lines(a.firstSteps)),
      pairs([['When we’ll check how it’s going', text(a.checkWhen) || cap(suggestedCheck(a, true))]]));
    if (a.method === 'steady') {
      next.append(toolLink('Once things are calm, find out what led to this with ', 'the Root Cause Finder', '../root-cause-finder/index.html'));
    }
    doc.append(next);

    if (a.method !== 'steady' && text(a.reopen)) {
      const reopen = section('What would reopen it', 5, api, 'what would reopen it');
      reopen.append(el('p', 'brief-text', text(a.reopen)),
        el('p', null, 'Disagreement is welcome. It reopens a decision when it brings new information, whoever raises it.'));
      doc.append(reopen);
    }
    if (a.method !== 'steady' && text(a.expect)) {
      const expect = section('Questions we expect', 5, api, 'the questions you expect');
      expect.append(el('p', 'brief-text', text(a.expect)));
      doc.append(expect);
    }
    if (hasRisks(a) && text(a.risks)) {
      const risks = section('Risks we’re watching', 5, api, 'the risks');
      risks.append(el('p', 'brief-text', text(a.risks)));
      doc.append(risks);
    }

    if (a.status !== 'plan') {
      const landed = section('Check that it landed', null, api);
      landed.append(el('p', null, 'A week or two after you share it, ask a few people to explain it back. Tick each one that’s true.'));
      const ul = el('ul', 'check-list');
      ['People can say what was decided.', 'People can explain why.', 'The decision holds up when someone questions it.']
        .forEach(t => ul.append(el('li', null, t)));
      landed.append(ul, el('p', null, 'If one isn’t true yet, go over the decision and the reasons again with the people involved.'));
      doc.append(landed);
    }

    const notes = el('section', 'brief-section');
    notes.append(el('h3', null, 'Notes'), el('p', 'small no-print', 'Space to write on the printout.'));
    const ruled = el('div', 'brief-lines');
    ruled.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) ruled.append(el('div'));
    notes.append(ruled);
    // Notes and the footer stay together on paper, so the footer never prints alone.
    const end = el('div', 'brief-end');
    end.append(notes);
    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'This record shows what was decided and why, so the reasoning travels with the decision. Update it if new information changes the decision.' +
      (people ? ' Keep it private, and follow your organization’s rules for hiring and promotion records.' : '')));
    foot.append(el('p', null, 'Made with the Pivot Labs Decision Approach Picker · ' + today +
      (credit[a.method] ? ' · ' + credit[a.method] : '') + ' Making it hold is adapted from Cicely Simpson’s “The Alignment Gap.”'));
    end.append(foot);
    doc.append(end);
    container.append(doc);
  }

  const workIntro = a => {
    if (a.method === 'compare') {
      return isPeople(a)
        ? 'Set what matters before you look at the options. Then score every option the same way, based on evidence.'
        : 'Decide what matters before you score. Then score every option the same way.';
    }
    return ({
      known: 'Name the known way, then check whether this case is different.',
      try: 'Plan small tests you can stop or undo, and set a date to look at what you learned.',
      steady: 'Stop the harm first. Decide the rest once things are calmer.'
    })[a.method] || 'Work through the way to decide you chose.';
  };

  const steps = [
    {
      id: 'decision',
      title: 'The decision',
      intro: 'Start with the decision in front of you, written as a question.',
      fields: [
        { id: 'question', type: 'text', maxlength: 160, label: 'What’s the decision?',
          hint: 'Write it as a question. Example: Which scheduling tool should the team use?', error: 'Write the decision as a question.' },
        { id: 'prompt', type: 'textarea', maxlength: 600, optional: true, label: 'What’s prompting it?',
          hint: 'What’s happening, and what happens if you wait. Example: The current tool’s contract ends March 31.' },
        { id: 'decideBy', type: 'text', maxlength: 80, optional: true, label: 'When does it need to be decided?',
          hint: 'Example: Friday, February 6' }
      ]
    },
    {
      id: 'situation',
      title: 'The situation',
      intro: 'Three questions to suggest a way to decide. You can choose a different one in the next step.',
      fields: picker.questions
    },
    {
      id: 'method',
      title: 'Your way to decide',
      intro: 'Here’s the way to decide that fits your answers, and why. Choose another if it fits better.',
      fields: [picker.field({
        id: 'method', pickedKey: 'methodPicked', eyebrow: 'Suggested way to decide',
        legend: 'Which way will you use?', error: 'Choose a way to decide to continue.',
        missing: 'Answer the questions in step 2 to see a suggested way to decide.',
        choiceNote: (chosen, suggested, a) => {
          if (chosen.id === 'try' && isPeople(a)) return 'You chose Try small and learn. For decisions about people, set clear criteria first, so everyone is treated the same way.';
          if (a.kind === 'urgent' && chosen.id !== 'steady') return 'You chose ' + chosen.title + '. If something is still going wrong, stop the harm first.';
          return 'You chose ' + chosen.title + '. The next step follows your choice.';
        }
      })]
    },
    {
      id: 'work',
      title: a => (method(a) ? method(a).title : 'Work it through'),
      intro: workIntro,
      fields: workFields
    },
    {
      id: 'roles',
      title: 'Who’s involved',
      intro: 'Say whose call it is and who plays which part. Clear roles keep a decision from stalling or being reopened.',
      fields: roleFields
    },
    {
      id: 'hold',
      title: 'Make it hold',
      intro: 'A decision holds when people can say what was decided and why. Write it so they can.',
      fields: holdFields
    }
  ];

  function initialAnswers() {
    const a = {
      question: '', prompt: '', decideBy: '',
      kind: '', undo: '', people: '', method: '', methodPicked: false,
      knownWay: '', different: '', differentWhat: '', confirm: '',
      musts: '',
      criteria: [{ id: 'c1', name: '', weight: '2' }, { id: 'c2', name: '', weight: '2' }],
      options: [{ id: 'o1', name: '', out: false }, { id: 'o2', name: '', out: false }],
      scores: {}, basis: '', judgment: '', judgmentWhy: '',
      hope: '', tests: [{ id: 't1', try: '', helping: '', stop: '', undoIt: '', howLong: '' }], lookWhen: '', notice: '',
      nowAction: '', tellNow: '', reviewWhen: '', decideLater: '',
      whose: '', decides: '', driver: '', input: '', carry: '', inform: '',
      status: '', statement: '', statementFrom: '', why: '', reopen: '', expect: '', risks: '', firstSteps: '', checkWhen: '',
      seq: 2
    };
    checkFields.forEach(f => { a[f.id] = []; });
    return a;
  }
  const blankAnswers = JSON.stringify(initialAnswers());
  const isDirty = a => JSON.stringify(a) !== blankAnswers;

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your record', finishLabel: 'Review my record',
    // Exposed for testing.
    suggest, route, methods, totals, vagueWord, checklist, checkKeyFor, statementFrom, syncStatement, suggestedCheck };
})();
