'use strict';
/*
  Readiness Matrix Builder content: steps, questions, the worked example, and the matrix.
  Runs on the guided planner engine (assets/js/guided-planner.js).

  Rules (see the README):
  - Nothing is pre-filled except the four default stage names, which people can rename.
  - The worked example is a made-up role, labeled "Example only," on stage 1 only, and never fills a field.
  - Every field is optional except the role type, which decides the wording.
  - Plain labels in headings and fields. "Return on Expectations" appears only in About this tool (page).
  - Never use "contributing through others" (a registered mark).
  - Describe behavior, never personality. The same answers always give the same matrix.
*/
const ReadinessMatrixBuilder = (() => {
  const { el } = GuidedPlanner;
  const text = v => String(v == null ? '' : v).trim();

  const STAGES = [
    { name: 'Contribution', ic: 'Doing parts of the job with support', lead: 'Early leadership application', when: 'e.g., first 3 months',
      openIc: 'Think about the first weeks and months. What can someone do with help, and what do they still check with you about?',
      openLead: 'Think about a new leader’s first months. What do they handle with support from their own manager?' },
    { name: 'Independence', ic: 'Handling the core job on their own', lead: 'Independent leadership', when: 'e.g., months 4 to 6',
      openIc: 'Think about when you’d stop checking their work so closely. What do they handle on their own?',
      openLead: 'Think about when you’d stop checking in so often. What do they handle with their team on their own?' },
    { name: 'Proficiency', ic: 'Doing the job well and consistently, even the hard cases', lead: 'Stable, effective leadership', when: 'e.g., months 7 to 12',
      openIc: 'Think about the harder cases and the busy weeks. What does doing it well, every time, look like?',
      openLead: 'Think about steady leadership through busy or hard weeks. What does that look like day to day?' },
    { name: 'Mastery', ic: 'Shaping how the work gets done and helping others grow', lead: 'Advanced leadership impact', when: 'e.g., after a year',
      openIc: 'Think about the person others go to. How do they shape the work or help others grow?',
      openLead: 'Think about a leader others learn from. How do they shape their team, the work beyond it, and other leaders?' }
  ];
  const MAX_BEHAVIORS = 8;
  const START_BEHAVIORS = 3;

  const EXAMPLE = {
    role: 'Event Coordinator',
    rows: [
      ['What it means', 'Plans small events with a checklist and a teammate’s review.'],
      ['What you’d see', 'Books rooms and vendors from the approved list. Sends invites using the template. Asks before changing a budget line.'],
      ['How you’d know', 'The teammate’s review of the checklist. Feedback from the event host.'],
      ['What you’d expect by month 3', 'Runs two small events with a teammate’s review.'],
      ['Signs they’re meeting it', 'Few fixes on review. Asks questions before the event, not after. Hosts would book again.']
    ]
  };

  const USING = [
    'Share it. Go through it with the person, ask where they think they are, and compare what you each see.',
    'Point to what you’ve seen and when, not general impressions.',
    'Progress comes from what someone shows, not how long they’ve been in the role. People may move ahead, pause, or come back to a stage.',
    'It guides coaching and development conversations. It isn’t an evaluation on its own, and it doesn’t set timelines or decide promotions.',
    'Once your expectations and signs hold up in real conversations, you’ll be in a better place to look at return on investment, if you need to.'
  ];

  const isLeader = a => a.kind === 'leader';
  const stageName = (a, i) => text(a.stages[i].name) || STAGES[i].name;
  const means = (a, i) => (isLeader(a) ? STAGES[i].lead : STAGES[i].ic);
  const whenOf = (a, i) => text(a.stages[i].when);
  // Timeframes are typed freely ("first 3 months," "after a year"), so they go in parentheses rather than after "by."
  const expectLabel = (a, i) => 'What would you expect by the end of this stage' + (whenOf(a, i) ? ' (' + whenOf(a, i) + ')' : '') + '?';
  const behaviorsOf = (a, i) => a.stages[i].behaviors.map(b => text(b.text)).filter(Boolean);
  // "about a year" should not read "in about about a year".
  const rampText = a => { const r = text(a.ramp); return !r ? '' : /^about\b/i.test(r) ? r : 'about ' + r; };
  const kindLabel = a => (a.kind === 'leader' ? 'Leader' : a.kind === 'ic' ? 'Individual contributor' : '');

  // "Print what you have so far" shows only on the stage steps (it sits under the step buttons in the page).
  function showPartialPrint(show) {
    const p = document.getElementById('partial-print');
    if (p) p.hidden = !show;
  }

  // Step 1: Before you start (no questions, just what to know and have handy)
  const prepField = {
    id: 'prep', type: 'custom',
    render(wrap) {
      showPartialPrint(false);
      const box = el('div', 'prep');
      const part = (title, ...nodes) => { const s = el('section'); s.append(el('h3', null, title), ...nodes); box.append(s); };
      const list = items => { const ul = el('ul'); items.forEach(t => ul.append(el('li', null, t))); return ul; };
      part('What you’ll build', el('p', null, 'A matrix with four stages, from someone’s first weeks in the role to doing it at a high level. For each stage, you’ll describe what it looks like, how you’d know, and about when you’d expect to see it.'));
      part('The question behind it', el('p', null, 'Each stage comes back to one question: is this person performing at the level you’d expect at this stage? You don’t try to put a dollar figure on development. You look for behavior you can actually see.'));
      part('Have these handy', list([
        'The main responsibilities of the role (a job description works)',
        'How the job usually progresses, from new to fully up to speed',
        'How long it usually takes to get up to speed. Some jobs take a year. Simpler ones might take three months.'
      ]));
      part('Keep in mind', list([
        'Describe what people do, not who they are.',
        'Progress comes from what someone shows, not how long they’ve been there. People may move ahead, pause, or come back to a stage.',
        'Use the matrix to guide coaching and development conversations. It isn’t an evaluation on its own, and it doesn’t set timelines or decide promotions.'
      ]));
      wrap.append(box);
    }
  };

  // Step 2: the four stages, renamed and timed. "Means" follows the role type as it changes.
  let updateMeans = null;
  let meansListener = false;
  const stagesField = {
    id: 'stageNames', type: 'custom',
    render(wrap, api) {
      showPartialPrint(false);
      const a = api.answers;
      wrap.append(el('p', 'row-question', 'Your four stages'),
        el('p', 'small field-hint', 'Keep these names, or change any of them to words your team already uses.'));
      const table = el('div', 'stage-table');
      const head = el('div', 'stage-row stage-head');
      head.setAttribute('aria-hidden', 'true');
      head.append(el('span', null, 'Stage'), el('span', null, 'Means'), el('span', null, 'About when?'));
      table.append(head);
      const meansCells = [];
      STAGES.forEach((s, i) => {
        const row = el('div', 'stage-row');
        const nameCell = el('div', 'stage-cell');
        const nameId = 'stage-name-' + i;
        const nameLab = el('label', 'stage-label', 'Stage ' + (i + 1) + ' name');
        nameLab.htmlFor = nameId;
        const name = el('input');
        name.type = 'text';
        name.id = nameId;
        name.autocomplete = 'off';
        name.maxLength = 40;
        name.value = a.stages[i].name;
        name.addEventListener('input', () => { a.stages[i].name = name.value; api.set('stages', a.stages); });
        nameCell.append(nameLab, name);

        const meansCell = el('div', 'stage-cell stage-means');
        const meansLab = el('span', 'stage-label', 'Means');
        meansLab.setAttribute('aria-hidden', 'true');
        const meansText = el('span', null, means(a, i));
        meansText.id = 'stage-means-' + i;
        meansCells.push(meansText);
        meansCell.append(meansLab, meansText);
        name.setAttribute('aria-describedby', meansText.id);

        const whenCell = el('div', 'stage-cell');
        const whenId = 'stage-when-' + i;
        const whenLab = el('label', 'stage-label', 'Stage ' + (i + 1) + ', about when?');
        whenLab.htmlFor = whenId;
        const when = el('input');
        when.type = 'text';
        when.id = whenId;
        when.autocomplete = 'off';
        when.maxLength = 60;
        when.placeholder = s.when;
        when.value = a.stages[i].when;
        when.addEventListener('input', () => { a.stages[i].when = when.value; api.set('stages', a.stages); });
        whenCell.append(whenLab, when);

        row.append(nameCell, meansCell, whenCell);
        table.append(row);
      });
      wrap.append(table, el('p', 'planner-tip', 'Timeframes are a guide, not a deadline. People may move faster, pause, or come back to a stage.'));

      updateMeans = () => { if (wrap.isConnected) meansCells.forEach((n, i) => { n.textContent = means(api.answers, i); }); };
      if (!meansListener) {
        meansListener = true;
        // Runs after the engine has saved the choice (its listener was added first).
        document.getElementById('planner-form').addEventListener('change', e => {
          if (e.target.name === 'kind' && updateMeans) updateMeans();
        });
      }
    }
  };

  // One labeled text box, saved as it's typed
  function textBox(wrap, api, i, key, label, hint, maxlength) {
    const a = api.answers;
    const field = el('div', 'planner-field');
    const id = 'stage-' + i + '-' + key;
    const lab = el('label', null, label);
    lab.htmlFor = id;
    field.append(lab);
    const box = el('textarea');
    box.id = id;
    box.rows = 3;
    box.maxLength = maxlength;
    box.value = a.stages[i][key];
    if (hint) {
      const h = el('p', 'small field-hint', hint);
      h.id = id + '-hint';
      field.append(h);
      box.setAttribute('aria-describedby', h.id);
    }
    box.addEventListener('input', () => { a.stages[i][key] = box.value; api.set('stages', a.stages); });
    field.append(box);
    wrap.append(field);
  }

  // The behaviors: one per line, Add another and Remove, up to eight
  function behaviorList(wrap, api, i) {
    const a = api.answers;
    const field = el('div', 'planner-field');
    const set = el('fieldset');
    const legend = el('legend', null, 'What would you see someone ' + (isLeader(a) ? 'doing with their team' : 'doing') + ' at this stage?');
    const hint = el('p', 'small field-hint', 'One behavior per line. Three to five is plenty. Describe what people do, not who they are.');
    hint.id = 'stage-' + i + '-behaviors-hint';
    const list = el('div', 'behavior-list');
    set.append(legend, hint, list);
    field.append(set);
    wrap.append(field);

    function draw(focusId) {
      list.replaceChildren();
      const rows = a.stages[i].behaviors;
      rows.forEach((row, index) => {
        const line = el('div', 'behavior-row');
        const id = 'stage-' + i + '-behavior-' + row.id;
        const lab = el('label', 'visually-hidden', 'Behavior ' + (index + 1));
        lab.htmlFor = id;
        const input = el('input');
        input.type = 'text';
        input.id = id;
        input.autocomplete = 'off';
        input.maxLength = 200;
        input.value = row.text;
        input.setAttribute('aria-describedby', hint.id);
        input.addEventListener('input', () => { row.text = input.value; api.set('stages', a.stages); });
        line.append(lab, input);
        if (rows.length > 1) {
          const remove = el('button', 'btn behavior-remove', 'Remove');
          remove.type = 'button';
          remove.setAttribute('aria-label', 'Remove behavior ' + (index + 1));
          remove.addEventListener('click', () => {
            rows.splice(index, 1);
            api.set('stages', a.stages);
            draw();
            (field.querySelector('button.behavior-add') || list.querySelector('input'))?.focus();
            api.announce('Removed.');
          });
          line.append(remove);
        }
        list.append(line);
      });
      field.querySelector('.behavior-add')?.remove();
      if (rows.length < MAX_BEHAVIORS) {
        const add = el('button', 'btn behavior-add', 'Add another');
        add.type = 'button';
        add.addEventListener('click', () => {
          const row = { id: a.nextRow++, text: '' };
          rows.push(row);
          api.set('stages', a.stages);
          draw('stage-' + i + '-behavior-' + row.id);
        });
        set.append(add);
      } else {
        set.append(el('p', 'small behavior-add', 'That’s the most this list holds (' + MAX_BEHAVIORS + ').'));
      }
      if (focusId) document.getElementById(focusId)?.focus();
    }
    draw();
  }

  function exampleBox() {
    const det = el('details', 'example');
    det.append(el('summary', null, 'See an example'));
    const body = el('div', 'example-body');
    const lead = el('p');
    lead.append(el('strong', null, 'Example only.'), document.createTextNode(' A made-up role: ' + EXAMPLE.role + '.'));
    const dl = el('dl');
    EXAMPLE.rows.forEach(([k, v]) => dl.append(el('dt', null, k), el('dd', null, v)));
    body.append(lead, dl);
    det.append(body);
    return det;
  }

  // Steps 3 to 6: one per stage, the same five questions each time
  const stageField = i => ({
    id: 'stage-' + i, type: 'custom',
    render(wrap, api) {
      showPartialPrint(true);
      const a = api.answers;
      wrap.append(el('p', 'stage-open', isLeader(a) ? STAGES[i].openLead : STAGES[i].openIc));
      if (i === 0) wrap.append(exampleBox());
      textBox(wrap, api, i, 'meaning', 'What does this stage mean in this role?', 'A sentence or two is plenty.', 500);
      behaviorList(wrap, api, i);
      textBox(wrap, api, i, 'know', 'How would you know?', 'Where would you see it? For example, reviews of their work, results, or feedback from others.', 500);
      textBox(wrap, api, i, 'expect', expectLabel(a, i), 'What should they be delivering by then?', 500);
      textBox(wrap, api, i, 'signs', 'What signs would tell you they’re meeting that expectation?', 'Things you could point to in a conversation, like “needs fewer fixes on review.”', 500);
    }
  });

  // The matrix (also used for "Print what you have so far")
  function blank(lines) {
    const frag = document.createDocumentFragment();
    frag.append(el('span', 'screen-only not-filled', 'Not filled in yet'));
    const box = el('div', 'brief-lines print-only');
    box.setAttribute('aria-hidden', 'true');
    for (let n = 0; n < lines; n++) box.append(el('div'));
    frag.append(box);
    return frag;
  }
  function answerBlock(value, lines = 2) {
    const dd = el('dd');
    if (text(value)) dd.textContent = text(value);
    else dd.append(blank(lines));
    return dd;
  }

  function buildMatrix(a, api, editable) {
    const brief = el('article', 'brief matrix');
    brief.setAttribute('aria-label', 'Readiness matrix');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    titleWrap.append(el('p', 'eyebrow', 'Readiness matrix'), el('h3', 'brief-title', text(a.title) || 'Your readiness matrix'));
    const meta = [kindLabel(a)];
    if (rampText(a)) meta.push('Fully up to speed in ' + rampText(a));
    titleWrap.append(el('p', 'brief-meta', meta.filter(Boolean).join(' · ')));
    top.append(titleWrap);
    if (editable) {
      const edit = el('button', 'btn brief-edit no-print', 'Edit');
      edit.type = 'button';
      edit.setAttribute('aria-label', 'Edit the role and stage names');
      edit.addEventListener('click', () => api.goTo('role'));
      top.append(edit);
    }
    brief.append(brand, top,
      el('p', 'matrix-intro', 'Here’s what ready looks like in this role, stage by stage. Use it to set expectations early and to guide coaching and development conversations along the way.'));

    STAGES.forEach((s, i) => {
      const st = a.stages[i];
      const sec = el('section', 'brief-section matrix-stage');
      const head = el('div', 'brief-section-head');
      head.append(el('h3', null, stageName(a, i)));
      if (editable) {
        const edit = el('button', 'btn brief-edit no-print', 'Edit');
        edit.type = 'button';
        edit.setAttribute('aria-label', 'Edit ' + stageName(a, i));
        edit.addEventListener('click', () => api.goTo('stage-' + i));
        head.append(edit);
      }
      const when = el('p', 'brief-meta');
      when.append(document.createTextNode(means(a, i) + ' · About when: '));
      if (whenOf(a, i)) when.append(document.createTextNode(whenOf(a, i)));
      else {
        when.append(el('span', 'screen-only not-filled', 'Not filled in yet'));
        const line = el('span', 'print-blank');
        line.setAttribute('aria-hidden', 'true');
        when.append(line);
      }
      sec.append(head, when);

      const dl = el('dl');
      dl.append(el('dt', null, 'What it means'), answerBlock(st.meaning));
      dl.append(el('dt', null, 'What you’d see'));
      const seen = behaviorsOf(a, i);
      if (seen.length) {
        const dd = el('dd');
        const ul = el('ul');
        seen.forEach(t => ul.append(el('li', null, t)));
        dd.append(ul);
        dl.append(dd);
      } else dl.append(answerBlock('', 3));
      dl.append(el('dt', null, 'How you’d know'), answerBlock(st.know));
      dl.append(el('dt', null, 'What you’d expect by the end of this stage'), answerBlock(st.expect));
      dl.append(el('dt', null, 'Signs they’re meeting it'), answerBlock(st.signs));
      sec.append(dl);

      const q = el('p', 'matrix-question');
      q.append(el('strong', null, 'The question to ask: '),
        document.createTextNode('Is this ' + (isLeader(a) ? 'leader' : 'person') + ' performing at the level you’d expect at this stage?'));
      sec.append(q);
      brief.append(sec);
    });

    const use = el('section', 'brief-section');
    use.append(el('h3', null, 'Using your matrix'));
    const ul = el('ul');
    USING.forEach(t => ul.append(el('li', null, t)));
    use.append(ul);
    brief.append(use);

    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'Made with the Pivot Labs Readiness Matrix Builder · ' +
      new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })));
    brief.append(foot);
    return brief;
  }

  function renderResult(container, a, api) {
    showPartialPrint(false);
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your matrix'), el('h2', null, 'Your readiness matrix'),
      el('p', null, 'Here’s what ready looks like in this role, stage by stage. Use it to set expectations early and to guide coaching and development conversations along the way.'));
    container.append(head);

    const remind = el('p', 'matrix-remind no-print');
    remind.append(el('strong', null, 'Nothing is saved.'), document.createTextNode(' Print or save as a PDF before you close this tab.'));
    const actions = el('div', 'result-actions no-print');
    const print = el('button', 'btn primary', 'Print or save as PDF');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    const edit = el('button', 'btn', 'Edit');
    edit.type = 'button';
    edit.addEventListener('click', () => api.goTo('role'));
    const again = el('button', 'btn', 'Start over');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    actions.append(print, edit, again);
    container.append(remind, actions,
      el('p', 'small no-print', 'In the print window, choose “Save as PDF” to keep a digital copy, and turn off browser headers and footers for a cleaner page.'));
    container.append(buildMatrix(a, api, true));
  }

  // "Print what you have so far": the same matrix, with blank lines for what isn't filled in yet
  function printSoFar(answers) {
    const slot = document.getElementById('partial-brief');
    slot.replaceChildren(buildMatrix(answers, null, false));
    document.body.classList.add('print-partial');
    const done = () => { document.body.classList.remove('print-partial'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    // Some browsers don't fire afterprint; clear the class shortly after either way.
    setTimeout(done, 1000);
  }

  const stageSteps = STAGES.map((s, i) => ({
    id: 'stage-' + i,
    title: a => stageName(a, i),
    heading: a => 'Stage ' + (i + 1) + ' of 4: ' + stageName(a, i),
    intro: a => means(a, i) + (whenOf(a, i) ? ' · About when: ' + whenOf(a, i) : ''),
    nextLabel: i < STAGES.length - 1 ? a => 'Next: ' + stageName(a, i + 1) : 'See your matrix',
    fields: [stageField(i)]
  }));

  const steps = [
    {
      id: 'start',
      title: 'Before you start',
      intro: 'A little prep makes the next hour easier.',
      nextLabel: 'Start with the role',
      fields: [prepField]
    },
    {
      id: 'role',
      title: 'The role',
      intro: 'Start with the job you’re mapping. Pick one role. You can come back for another.',
      nextLabel: a => 'Next: ' + stageName(a, 0),
      fields: [
        { id: 'kind', type: 'choice', label: 'Is this an individual contributor role or a leader role?',
          hint: 'This changes a few words in the next steps.',
          options: [
            { value: 'ic', label: 'Individual contributor (does the work directly)' },
            { value: 'leader', label: 'Leader (leads people who do the work)' }
          ], error: 'Choose one to continue.' },
        { id: 'title', type: 'text', maxlength: 100, optional: true, label: 'Job title',
          placeholder: 'For example, Claims Specialist', hint: 'Use the title people in your organization would recognize.' },
        { id: 'ramp', type: 'text', maxlength: 60, optional: true, label: 'How long does it usually take someone to get fully up to speed?',
          placeholder: 'For example, about a year', hint: 'A rough answer is fine.' },
        stagesField
      ]
    },
    ...stageSteps
  ];

  function initialAnswers() {
    let id = 1;
    return {
      kind: '', title: '', ramp: '',
      stages: STAGES.map(s => ({
        name: s.name, when: '', meaning: '', know: '', expect: '', signs: '',
        behaviors: Array.from({ length: START_BEHAVIORS }, () => ({ id: id++, text: '' }))
      })),
      nextRow: id
    };
  }
  // Empty behavior lines and the row counter don't count as work.
  function normalized(a) {
    return JSON.stringify({ ...a, nextRow: 0, stages: a.stages.map(s => ({ ...s, behaviors: s.behaviors.map(b => text(b.text)).filter(Boolean) })) });
  }
  const blankState = normalized(initialAnswers());
  const isDirty = a => normalized(a) !== blankState;

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your matrix', finishLabel: 'See your matrix',
    printSoFar,
    // Exposed for testing.
    STAGES, stageName, means, rampText, behaviorsOf };
})();
