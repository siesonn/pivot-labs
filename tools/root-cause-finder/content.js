'use strict';
/*
  Root Cause Finder content: the situation questions, the three methods, each method's
  prompts, the fix, and the summary.
  Shared engines: assets/js/guided-planner.js (the steps) and
  assets/js/situation-picker.js (the situation questions and the suggested method).

  Every prompt looks at what failed in the work, not who failed.
  The same answers always suggest the same method.
  The summary is written to share with the people working on the fix.
*/
const RootCauseFinder = (() => {
  const el = GuidedPlanner.el;
  const text = value => (value || '').trim();
  const clip = (value, max) => (value.length > max ? value.slice(0, max - 1).trimEnd() + '…' : value);

  // Words that often mean an answer stops at a person instead of a cause.
  // The check is a nudge only. It never blocks an answer, and it can't catch names.
  // "Forget" on its own is left out, because "easy to forget" is the kind of answer we want.
  const blamePatterns = [
    /\bforg(?:ot|ets|etting)\b/i, /\bcareless(?:ly|ness)?\b/i, /\blazy\b|\blaziness\b/i, /\bsloppy\b/i,
    /\bdid(?:n['’]t| not) care\b/i, /\bdid(?:n['’]t| not) bother\b/i,
    /\b(?:not|wasn['’]t|weren['’]t) paying attention\b/i, /\bshould(?:['’]ve| have) known\b/i,
    /\b(?:wasn['’]t|weren['’]t) thinking\b/i, /\bhuman error\b/i
  ];
  function blameWord(value) {
    const t = text(value);
    for (const p of blamePatterns) {
      const m = t.match(p);
      if (m) return m[0];
    }
    return '';
  }
  const blameNote = value => {
    const word = blameWord(value);
    return word ? 'This may point to a person rather than a cause (“' + word + '”). Ask why once more: what in the setup made it likely?' : '';
  };

  // The three methods, simplest analysis first.
  const methods = [
    { id: 'whys', title: 'The 5 Whys',
      summary: 'Ask why it happened, then why that happened, until you reach a cause you can fix.',
      bestFor: 'Best when one thing seems to have led to another.' },
    { id: 'fishbone', title: 'Fishbone diagram',
      summary: 'Look at four areas that could have played a part (people, process, tools, and environment), then choose the causes that mattered most.',
      bestFor: 'Best when several things seem to have played a part.' },
    { id: 'quick', title: 'Fix it and check',
      summary: 'A full analysis may not be needed. Note the cause, make the fix, and check that it worked.',
      bestFor: 'Best for a small, one-time problem with a fix you’re confident in.' }
  ];

  // A full analysis isn't needed for a first-time, small problem with a fix the leader is confident in.
  const isQuick = a => a.history === 'first' && a.impact === 'small' && a.fix === 'confident';
  const stakes = a => [a.impact === 'serious' ? 'is serious' : '', a.history === 'often' ? 'keeps happening' : ''].filter(Boolean).join(' and ');

  // Answers lead to one suggestion. Nothing about the people involved changes it.
  function suggest(a) {
    if (!a.history || !a.impact || !a.fix) return null;
    if (isQuick(a)) {
      return { id: 'quick', reason: 'This is the first time, the effect was small, and you’re confident in the fix. A full analysis would cost more time than the problem did. If it happens again, come back and use the 5 Whys.' };
    }
    if (!a.shape) return null;
    let id;
    let reason;
    if (a.shape === 'chain') {
      id = 'whys';
      reason = 'One thing seems to have led to another. Asking why at each link follows the chain down to a cause you can fix.';
    } else if (a.shape === 'many') {
      id = 'fishbone';
      reason = 'Several things seem to have played a part. Looking at each area before you settle on a cause keeps you from stopping at the first one you find.';
    } else if (stakes(a)) {
      id = 'fishbone';
      reason = 'This ' + stakes(a) + ', and you’re not sure what played a part. Looking at each area first keeps you from stopping at the first cause you find.';
    } else {
      id = 'whys';
      reason = 'Start with the simpler method. If your answers branch into several causes, switch to the fishbone diagram.';
    }
    const extra = [];
    if (a.fix === 'confident') extra.push('You have a fix in mind. Use this method to check that it reaches the cause, not just this one time.');
    if (a.fix === 'guess') extra.push('Treat your guess as one possible cause, and test it as you go.');
    if (a.history === 'unsure') extra.push('Find out whether it has happened before. Records and the people who do the work can tell you.');
    if (a.impact === 'serious') extra.push('Serious problems bring pressure to find someone to blame. Looking at how the work is set up is what keeps it from happening again.');
    return { id, reason: [reason, ...extra].join(' ') };
  }

  const picker = SituationPicker.create({
    options: methods,
    suggest,
    questions: [
      { id: 'history', type: 'choice', label: 'Has this happened before?',
        hint: 'Count the times the problem happened, whoever was involved.', options: [
          { value: 'first', label: 'No. This is the first time I know of.' },
          { value: 'once', label: 'Yes, once or twice before.' },
          { value: 'often', label: 'Yes, it keeps happening.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] },
      { id: 'impact', type: 'choice', label: 'How big was the effect?',
        note: a => (a.impact === 'serious' ? 'If anyone was hurt or could have been, or this may involve a legal, HR, or compliance matter, follow your organization’s process first. This tool doesn’t replace a formal investigation.' : ''),
        options: [
          { value: 'small', label: 'Small. Easy to correct, and few people were affected.' },
          { value: 'noticeable', label: 'Noticeable. It cost time, money, or goodwill.' },
          { value: 'serious', label: 'Serious. It affected customers, safety, quality, or many people.' }
        ] },
      { id: 'fix', type: 'choice', label: 'Do you already know the fix?',
        hint: 'If the fix is “remind people” or “be more careful,” choose “I have a guess.” Those fixes rarely last, because the cause is usually in how the work is set up.',
        options: [
          { value: 'confident', label: 'Yes. I know the cause, and I’m confident the fix will stop it from happening again.' },
          { value: 'guess', label: 'I have a guess, but I haven’t checked it.' },
          { value: 'unknown', label: 'No. I’m not sure why it happened.' }
        ] },
      { id: 'shape', type: 'choice', label: 'Does it look like one thing led to another, or like several things played a part?',
        showIf: a => !isQuick(a), options: [
          { value: 'chain', label: 'One thing led to another.' },
          { value: 'many', label: 'Several things played a part.' },
          { value: 'unsure', label: 'I’m not sure yet.' }
        ] }
    ]
  });
  const method = a => picker.find(a.method);
  const on = (...ids) => a => ids.includes(a.method);

  // A labeled text area inside a custom field. It saves as you type, like the engine's own fields.
  function textBox(api, key, opts) {
    const wrap = el('div', opts.cls || 'sub-field');
    const id = 'field-' + key;
    const label = el('label');
    label.htmlFor = id;
    if (opts.srPrefix) label.append(el('span', 'visually-hidden', opts.srPrefix));
    label.append(opts.label + (opts.optional ? ' (optional)' : ''));
    wrap.append(label);
    const described = [];
    let hint = null;
    if (opts.hint !== undefined) {
      hint = el('p', 'small field-hint', opts.hint);
      hint.id = 'hint-' + key;
      hint.hidden = !opts.hint;
      wrap.append(hint);
      described.push(hint.id);
    }
    const input = el('textarea');
    input.id = id;
    input.maxLength = opts.maxlength || 1000;
    input.value = api.answers[key] || '';
    let err = null;
    if (opts.error !== false) {
      err = GuidedPlanner.errorSlot('err-' + key);
      described.push(err.id);
    }
    input.setAttribute('aria-describedby', described.join(' '));
    wrap.append(input);
    if (err) wrap.append(err);
    if (opts.tip) wrap.append(el('p', 'planner-tip', opts.tip));
    let note = null;
    if (opts.blame) {
      note = el('p', 'planner-note');
      note.setAttribute('aria-live', 'polite');
      note.textContent = blameNote(api.answers[key]);
      wrap.append(note);
    }
    input.addEventListener('input', () => {
      if (err && !err.hidden && text(input.value)) {
        err.hidden = true;
        input.removeAttribute('aria-invalid');
      }
      api.set(key, input.value);
      if (note) note.textContent = blameNote(input.value);
      if (opts.onInput) opts.onInput(input.value);
    });
    return { wrap, input, hint };
  }

  // The 5 Whys: up to five answers, each showing the one before it. The first two are required.
  const WHYS = 5;
  const whyKeys = Array.from({ length: WHYS }, (_, i) => 'why' + (i + 1));
  const chainField = {
    id: 'chain',
    type: 'custom',
    showIf: on('whys'),
    render(wrap, api) {
      const a = api.answers;
      const set = el('fieldset');
      set.append(el('legend', null, 'Your why chain'));
      const hint = el('p', 'hint', 'Most chains take three to five whys. Stop when you reach something you can change.');
      hint.id = 'hint-chain';
      const example = el('p', 'small why-example', 'Example: Why was it late? Two data files arrived on the 6th. Why? Finance sends them after its month-end close. Why? No date for the files was ever agreed with Finance.');
      set.append(hint, example);
      set.setAttribute('aria-describedby', hint.id);
      const list = el('ol', 'why-chain');
      const rows = [];
      // Each row shows the answer it builds on.
      const update = () => {
        rows.forEach((row, i) => {
          const before = i === 0 ? text(a.happened) : text(a[whyKeys[i - 1]]);
          row.hint.textContent = before ? (i === 0 ? 'The problem: ' : 'Your last answer: ') + clip(before, 200) : '';
          row.hint.hidden = !before;
        });
      };
      whyKeys.forEach((key, i) => {
        const li = el('li');
        const num = el('span', 'why-num', String(i + 1));
        num.setAttribute('aria-hidden', 'true');
        const row = textBox(api, key, {
          cls: 'why-row', label: i === 0 ? 'Why did this happen?' : 'Why did that happen?', srPrefix: 'Why ' + (i + 1) + ': ',
          optional: i > 1, hint: '', maxlength: 400, error: i < 2, blame: true, onInput: update
        });
        rows.push(row);
        li.append(num, row.wrap);
        list.append(li);
      });
      set.append(list);
      wrap.append(set,
        el('p', 'planner-tip', 'If an answer names a person or stops at “human error,” ask why once more. What made the mistake easy to make: no checklist, not enough time, unclear steps, or missing information?'));
      update();
    },
    validate(a) {
      const errors = [];
      if (!text(a.why1)) errors.push({ errorId: 'err-why1', focusId: 'field-why1', message: 'Answer the first why to continue.' });
      if (!text(a.why2)) errors.push({ errorId: 'err-why2', focusId: 'field-why2', message: 'Ask why at least twice to continue.' });
      return errors;
    }
  };

  // The fishbone's four areas. "People" covers skills, training, workload, and communication, never an individual.
  const areas = [
    { key: 'people', answer: 'areaPeople', short: 'People', sub: 'Skills, training, workload, and communication',
      label: 'People: skills, training, workload, and communication',
      hint: 'Did people have the skills, training, time, and information they needed? Was anything unclear or not passed on? Example: No one covering the report had been shown the data checks.',
      tip: 'Describe what was missing, not who fell short. “No one was trained on the new system” points to a fix. “Alex isn’t good with systems” doesn’t.' },
    { key: 'process', answer: 'areaProcess', short: 'Process', sub: 'Steps, handoffs, and timing',
      label: 'Process: steps, handoffs, and timing',
      hint: 'Were the steps clear and written down? Did work wait at a handoff? Was the timeline realistic? Example: There’s no agreed date for Finance to send the data files.' },
    { key: 'tools', answer: 'areaTools', short: 'Tools', sub: 'Systems, equipment, and information',
      label: 'Tools: systems, equipment, and information',
      hint: 'Did the systems, data, and materials work, and were they there when needed? Example: The export needs 30 minutes of cleanup by hand.' },
    { key: 'environment', answer: 'areaEnvironment', short: 'Environment', sub: 'Workspace, culture, and outside factors',
      label: 'Environment: workspace, culture, and outside factors',
      hint: 'Did anything around the work play a part, such as competing deadlines, how problems get raised, a busy season, or a vendor? Example: Month-end close and the report land in the same week.' }
  ];
  const anyArea = a => areas.some(ar => text(a[ar.answer]));
  const areasField = {
    id: 'areas',
    type: 'custom',
    showIf: on('fishbone'),
    render(wrap, api) {
      const set = el('fieldset');
      set.append(el('legend', null, 'The four areas'));
      const hint = el('p', 'hint', 'Fill in at least one.');
      hint.id = 'hint-areas';
      const err = GuidedPlanner.errorSlot('err-areas');
      set.setAttribute('aria-describedby', hint.id + ' ' + err.id);
      set.append(hint);
      let first = null;
      areas.forEach(ar => {
        const box = textBox(api, ar.answer, {
          label: ar.label, hint: ar.hint, tip: ar.tip, maxlength: 1000, error: false, blame: true,
          onInput: () => {
            if (!err.hidden && anyArea(api.answers)) { err.hidden = true; first.removeAttribute('aria-invalid'); }
          }
        });
        if (!first) first = box.input;
        set.append(box.wrap);
      });
      set.append(err);
      wrap.append(set);
    },
    validate: a => (anyArea(a) ? [] : [{ errorId: 'err-areas', focusId: 'field-areaPeople', message: 'Add what you found in at least one area.' }])
  };

  const analysisFields = [
    { id: 'facts', type: 'textarea', maxlength: 1500, showIf: on('whys', 'fishbone'), label: 'What do you know for sure?',
      hint: 'What you’ve seen or checked: records, data, or what people who were there said. Example: The report went out on the 8th. Two of the four data files arrived on the 6th.',
      error: 'Write what you know so far.' },
    chainField,
    areasField,
    { id: 'top', type: 'textarea', maxlength: 600, showIf: on('fishbone'), label: 'Which one or two causes mattered most?',
      hint: 'The ones that, if fixed, would most likely stop this from happening again. Example: No agreed date for the Finance files.',
      error: 'Name the one or two causes that mattered most.' },
    { id: 'deeper', type: 'textarea', maxlength: 600, optional: true, showIf: on('fishbone'),
      label: 'Ask why once more: why does that cause exist?',
      hint: 'Example: The report was set up without agreeing who sends what, and when.' },
    { id: 'quickCause', type: 'textarea', maxlength: 600, showIf: on('quick'), label: 'What caused it?',
      hint: 'Example: The template still had last year’s date range.',
      after: 'If the cause is a mistake, ask what made it easy to make. That’s usually the part to fix.',
      note: a => blameNote(a.quickCause), error: 'Describe what caused it.' },
    { id: 'quickKnow', type: 'textarea', maxlength: 600, optional: true, showIf: on('quick'), label: 'How do you know?',
      hint: 'What you saw or checked. Example: The template header still reads 2025.' },
    { id: 'toFind', type: 'textarea', maxlength: 600, optional: true, showIf: on('whys', 'fishbone'),
      label: 'What do you still need to find out?', hint: 'Example: Whether the files were late in other months too.' }
  ];

  // The root cause starts as the analysis's answer and follows it until the leader edits it.
  function analysisCause(a) {
    if (a.method === 'whys') return whyKeys.map(k => text(a[k])).filter(Boolean).at(-1) || '';
    if (a.method === 'fishbone') return text(a.deeper) || text(a.top);
    if (a.method === 'quick') return text(a.quickCause);
    return '';
  }
  function syncRootCause(a) {
    const from = analysisCause(a);
    if (!text(a.rootCause) || a.rootCause === a.rootCauseFrom) {
      a.rootCause = from;
      a.rootCauseFrom = from;
    }
  }
  function rootCauseSource(a) {
    if (!text(a.rootCause) || a.rootCause !== a.rootCauseFrom) return '';
    if (a.method === 'whys') return 'your last why';
    if (a.method === 'fishbone') return text(a.deeper) ? 'your answer to why that cause exists' : 'your top cause';
    if (a.method === 'quick') return 'what caused it';
    return '';
  }

  // Step 6: who to involve, and the checklist. Unchecked items become reminders on screen.
  const involveOptions = [
    { value: 'doers', label: 'The people who do the work' },
    { value: 'handoffs', label: 'People at the handoffs before and after' },
    { value: 'owners', label: 'Whoever owns the systems or tools involved' },
    { value: 'outside', label: 'Someone outside the work, for a fresh view' },
    { value: 'affected', label: 'Customers or others affected' },
    { value: 'hr', label: 'HR, safety, or compliance' }
  ];
  const checks = [
    { value: 'changeable', label: 'The root cause names something we can change, not a person.',
      reminder: 'Reword the root cause so it names a step, tool, handoff, or condition you can change.' },
    { value: 'facts', label: 'What I’ve written is fact I’ve checked, or I’ve noted what still needs checking.',
      reminder: 'Check your answers against records or with the people who do the work, and note anything still unconfirmed.' },
    { value: 'seen', label: 'The people closest to the work have seen this, or will.',
      reminder: 'Share your draft with the people who do the work. They’ll spot what you missed.' },
    { value: 'setup', label: 'The fix changes the setup, not just this one time.',
      reminder: 'Add a change to the setup so the fix lasts.' },
    { value: 'same', label: 'I’d describe this the same way whoever was involved.',
      reminder: 'Read it again as if someone else had been involved. If you’d word it differently, rethink it.' }
  ];
  const reminders = a => checks.filter(c => !(a.checks || []).includes(c.value)).map(c => c.reminder);
  const checkNote = a => (a.history === 'often'
    ? 'Suggested: check after the next two or three times it would normally happen.'
    : 'Suggested: check the next time it would normally happen.');

  // The summary
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
  function list(items, tag = 'ul', cls) {
    const ul = el(tag, cls);
    items.forEach(t => ul.append(el('li', null, t)));
    return ul;
  }
  function newTabLink(label, href) {
    const a = el('a', null, label);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  }

  // The four areas around the problem, like a simple fishbone. Reads in order: the problem, then each area.
  function fishbone(a) {
    const fig = el('div', 'fishbone');
    fig.setAttribute('role', 'group');
    fig.setAttribute('aria-label', 'Fishbone diagram');
    const head = el('div', 'fb-head');
    head.append(el('span', 'fb-head-label', 'The problem'), el('p', null, text(a.name)));
    fig.append(head);
    areas.forEach(ar => {
      const box = el('div', 'fb-area fb-' + ar.key);
      const value = text(a[ar.answer]);
      box.append(el('h4', null, ar.short), el('p', 'fb-sub', ar.sub), el('p', value ? 'fb-text' : 'fb-empty', value || 'Nothing noted'));
      fig.append(box);
    });
    const spine = el('div', 'fb-spine');
    spine.setAttribute('aria-hidden', 'true');
    fig.append(spine);
    return fig;
  }

  const credit = {
    whys: 'The 5 Whys was developed by Sakichi Toyoda and made widely known by Taiichi Ohno at Toyota.',
    fishbone: 'The fishbone diagram was developed by Kaoru Ishikawa. Its four areas are adapted from Christian Rebernik’s Root Cause Analysis infographic.',
    quick: 'Deciding when a full analysis isn’t needed is adapted from Christian Rebernik’s Root Cause Analysis infographic.'
  };

  function renderResult(container, a, api) {
    syncRootCause(a);
    const m = method(a);
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your summary'), el('h2', null, 'Your root cause summary'),
      el('p', null, 'Use Edit to change any section, then print it or save it as a PDF to share with the people working on the fix.'));
    container.append(head);

    const open = reminders(a);
    if (open.length) {
      const box = el('section', 'prep-notes no-print');
      box.setAttribute('aria-labelledby', 'reminders-title');
      const h = el('h3', null, 'Before you share it');
      h.id = 'reminders-title';
      box.append(h, list(open), el('p', 'small', 'These come from the checklist in step 6. They don’t print.'));
      container.append(box);
    }

    const actions = el('div', 'result-actions no-print');
    const print = el('button', 'btn primary', 'Print summary');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    const editAll = el('button', 'btn', 'Edit my answers');
    editAll.type = 'button';
    editAll.addEventListener('click', () => api.goTo(5));
    const again = el('button', 'btn', 'Start a new problem');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    actions.append(print, editAll, again);
    container.append(actions,
      el('p', 'small no-print', 'This summary is written to share. Read it once the way the people involved would. In the print window, choose “Save as PDF” to keep a digital copy, and turn off browser headers and footers for a cleaner page.'));

    const doc = el('article', 'brief');
    doc.setAttribute('aria-label', 'Root cause summary');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    const today = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    titleWrap.append(el('p', 'eyebrow', 'Root cause summary'), el('h3', 'brief-title', text(a.name)),
      el('p', 'brief-meta', [m ? m.title : '', today].filter(Boolean).join(' · ')));
    const editTop = el('button', 'btn brief-edit no-print', 'Edit');
    editTop.type = 'button';
    editTop.setAttribute('aria-label', 'Edit the problem');
    editTop.addEventListener('click', () => api.goTo(0));
    top.append(titleWrap, editTop);
    doc.append(brand, top);

    const problem = section('The problem', 0, api, 'the problem');
    problem.append(pairs([['What happened', a.happened], ['What should have happened', a.should]]));
    doc.append(problem);

    const how = section('How the cause was found', 3, api, 'how the cause was found');
    if (m) {
      const p = el('p');
      p.append(el('strong', null, 'Method: '), m.title);
      how.append(p);
    }
    if (a.method === 'whys') {
      how.append(pairs([['What we know', a.facts]]), el('h4', null, 'The why chain'));
      const ol = el('ol', 'why-list');
      whyKeys.map(k => text(a[k])).filter(Boolean).forEach(answer => {
        const li = el('li');
        li.append(el('span', 'why-label', 'Why? '), answer);
        ol.append(li);
      });
      how.append(ol, pairs([['Still to find out', a.toFind]]));
    } else if (a.method === 'fishbone') {
      how.append(pairs([['What we know', a.facts]]), fishbone(a),
        pairs([['Causes that mattered most', a.top], ['Why that cause exists', a.deeper], ['Still to find out', a.toFind]]));
    } else if (a.method === 'quick') {
      how.append(pairs([['What caused it', a.quickCause], ['How we know', a.quickKnow]]),
        el('p', null, 'A full analysis wasn’t needed for this one. If it happens again, dig deeper with the 5 Whys.'));
    }
    doc.append(how);

    const root = section('Root cause', 4, api, 'the root cause');
    root.append(el('p', 'root-cause', text(a.rootCause)));
    doc.append(root);

    const fix = section('The fix', 4, api, 'the fix');
    fix.append(pairs([['Right away', a.fixNow], ['For good', a.fixLasting], ['Who and by when', a.owner]]));
    // On screen only. Opens in a new tab and carries no entries.
    const talk = el('p', 'small no-print');
    talk.append('If part of the fix is a conversation with someone about their work, ',
      newTabLink('plan it with the Feedback Conversation Planner (opens in a new tab)', '../feedback-conversation-planner/index.html'), '.');
    fix.append(talk);
    doc.append(fix);

    const involve = section('Who to involve', 5, api, 'who to involve');
    const chosen = involveOptions.filter(o => (a.involve || []).includes(o.value)).map(o => o.label);
    if (chosen.length) involve.append(list(chosen));
    if (text(a.involveNames)) involve.append(el('p', 'brief-text', 'Names or roles: ' + text(a.involveNames)));
    if (!chosen.length && !text(a.involveNames)) involve.append(el('p', null, 'No one else named yet.'));
    doc.append(involve);

    const check = section('How we’ll know it worked', 5, api, 'how you’ll know it worked');
    check.append(pairs([['What we’ll look for', a.measure], ['When we’ll check', a.checkWhen]]),
      el('p', null, 'If it hasn’t worked, come back to the analysis. The cause may be one level deeper, or there may be more than one.'));
    doc.append(check);

    const notes = el('section', 'brief-section');
    notes.append(el('h3', null, 'Notes'), el('p', 'small no-print', 'Space to write on the printout.'));
    const lines = el('div', 'brief-lines');
    lines.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) lines.append(el('div'));
    notes.append(lines);
    const end = el('div', 'brief-end');
    end.append(notes);
    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'This summary is a starting point. It looks at what failed, not who failed. Update it as you learn more.'),
      el('p', null, 'Made with the Pivot Labs Root Cause Finder · ' + today + (credit[a.method] ? ' · ' + credit[a.method] : '')));
    end.append(foot);
    doc.append(end);
    container.append(doc);
  }

  const steps = [
    {
      id: 'problem',
      title: 'The problem',
      intro: 'Start with what happened and what should have happened. The gap between them is the problem to solve.',
      fields: [
        { id: 'name', type: 'text', maxlength: 120, label: 'What’s the problem, in a few words?',
          hint: 'Example: Late monthly client report', error: 'Enter a few words about the problem.' },
        { id: 'happened', type: 'textarea', maxlength: 1000, label: 'What happened?',
          hint: 'What, when, and how much, the way a report would describe it. Example: The March client report went out on the 8th, three days late.',
          after: 'Describe the event, not who was involved. “The report went out late” leaves room to find the cause. “Sam sent it late” points to an answer before you’ve looked.',
          error: 'Describe what happened.' },
        { id: 'should', type: 'textarea', maxlength: 600, label: 'What should have happened?',
          hint: 'The standard or result you expected. Example: Client reports go out by the 5th of each month.',
          error: 'Describe what should have happened.' }
      ]
    },
    {
      id: 'situation',
      title: 'The situation',
      intro: 'A few questions to suggest a method. You can choose a different one in the next step.',
      fields: picker.questions
    },
    {
      id: 'method',
      title: 'Your method',
      intro: 'Here’s the method that fits your answers, and why. Choose another if it fits better.',
      fields: [picker.field({
        id: 'method', pickedKey: 'methodPicked', eyebrow: 'Suggested method',
        legend: 'Which method will you use?', error: 'Choose a method to continue.',
        missing: 'Answer the questions in step 2 to see a suggested method.',
        choiceNote: (chosen, suggested, a) => {
          if (chosen.id === 'quick') {
            const why = [a.impact === 'serious' ? 'is serious' : '',
              a.history === 'often' ? 'keeps happening' : a.history === 'once' ? 'has happened before' : ''].filter(Boolean).join(' and ');
            if (why) return 'You chose Fix it and check. Because this ' + why + ', plan to dig deeper if the fix doesn’t hold.';
          }
          return 'You chose ' + chosen.title + '. The next step follows your choice.';
        }
      })]
    },
    {
      id: 'analysis',
      title: a => (method(a) ? method(a).title : 'Find the cause'),
      intro: a => ({
        whys: 'Start with the facts, then ask why until you reach something you can change. This works best with two to four people who know the work. If you’re working alone, treat your answers as a draft to check with them.',
        fishbone: 'Start with the facts, then look at each area. Leave an area blank if nothing there played a part. This works best with two to four people who know the work. If you’re working alone, treat your answers as a draft to check with them.',
        quick: 'Note what caused it and how you know, so you can check the fix.'
      })[a.method] || 'Find the cause.',
      fields: analysisFields
    },
    {
      id: 'fix',
      title: 'The fix',
      intro: 'Name the cause, then fix it for good, not just this once.',
      fields: [
        // Keeps the root cause in step with the analysis until the leader edits it. Shows nothing.
        { id: 'rootCauseSync', type: 'custom', showIf: () => false, render: (wrap, api) => syncRootCause(api.answers) },
        { id: 'rootCause', type: 'textarea', maxlength: 400, label: 'What’s the root cause, in one sentence?',
          hint: a => {
            const from = rootCauseSource(a);
            return (from ? 'Starts with ' + from + '. Edit it if it doesn’t fit. ' : '') +
              'Name something you can change: a step, a handoff, a tool, training, workload, or how information is shared.';
          },
          after: 'If it names a person, ask why once more.',
          note: a => blameNote(a.rootCause), error: 'Write the root cause in one sentence.' },
        { id: 'fixNow', type: 'textarea', maxlength: 600, optional: true, label: 'What will you do right away?',
          hint: 'A short-term fix for this time, if one is needed. Example: Send the March report today with a note to the client.' },
        { id: 'fixLasting', type: 'textarea', maxlength: 1000, label: 'What will you change so it doesn’t happen again?',
          hint: 'Example: Agree with Finance that the files arrive by the 3rd, and add the date to the shared calendar.',
          after: 'Changes to the setup (a step, a checklist, a tool, a handoff, or workload) last longer than reminders to be careful.',
          error: 'Describe what you’ll change.' },
        { id: 'owner', type: 'text', maxlength: 200, label: 'Who will make the change, and by when?',
          hint: 'Example: Me and the Finance lead, by April 15', error: 'Say who will make the change and by when.' }
      ]
    },
    {
      id: 'follow',
      title: 'Follow through',
      intro: 'Plan who to involve and how you’ll know the fix worked.',
      fields: [
        { id: 'involve', type: 'multi', optional: true, label: 'Who else should help check the cause or make the fix?',
          hint: 'Choose any that fit. The people closest to the work usually know where it breaks.', options: involveOptions },
        { id: 'involveNames', type: 'text', maxlength: 200, optional: true, label: 'Names or roles',
          hint: 'Example: Report team, Finance lead', after: 'Invite people to improve the process, not to explain what they did.' },
        { id: 'measure', type: 'textarea', maxlength: 600, label: 'How will you know the fix worked?',
          hint: 'Something you can see or count. Example: The April, May, and June reports go out by the 5th.',
          after: 'Check the result, not a person.', error: 'Describe how you’ll know it worked.' },
        { id: 'checkWhen', type: 'text', maxlength: 120, label: 'When will you check?',
          hint: 'Example: June 6, after the third report', note: checkNote, error: 'Say when you’ll check.' },
        { id: 'checks', type: 'multi', optional: true, label: 'Before you share it, check what’s true.',
          hint: 'Anything unchecked becomes a reminder above your summary.',
          options: checks.map(c => ({ value: c.value, label: c.label })) }
      ]
    }
  ];

  function initialAnswers() {
    const a = {
      name: '', happened: '', should: '',
      history: '', impact: '', fix: '', shape: '', method: '', methodPicked: false,
      facts: '', areaPeople: '', areaProcess: '', areaTools: '', areaEnvironment: '',
      top: '', deeper: '', quickCause: '', quickKnow: '', toFind: '',
      rootCause: '', rootCauseFrom: '', fixNow: '', fixLasting: '', owner: '',
      involve: [], involveNames: '', measure: '', checkWhen: '', checks: []
    };
    whyKeys.forEach(k => { a[k] = ''; });
    return a;
  }
  const blankAnswers = JSON.stringify(initialAnswers());
  const isDirty = a => JSON.stringify(a) !== blankAnswers;

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your summary', finishLabel: 'Review my summary',
    // Exposed for testing.
    suggest, methods, isQuick, blameWord, analysisCause, syncRootCause, reminders };
})();
