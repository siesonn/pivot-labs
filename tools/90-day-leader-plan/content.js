'use strict';
/*
  90-Day Leader Plan content: the steps, the situation tips, the checklist, and the plan.
  The step engine is shared: assets/js/guided-planner.js.

  Three 30-day parts (listen and learn, make sense of it together, act and check in) are common
  practice. Ideas drawn from Michael D. Watkins (learn before you act, agree on success with your
  manager, match your approach to the situation) and Michaela Schuler's "How to Rebuild Team
  Culture in the First 90 Days" infographic (say what stops, close the loop, steady one-on-ones).
  The structure and wording are our own. "The First 90 Days" is a registered mark (Genesis
  Advisers), so it appears only as Watkins' book title in About this tool, never as a name or heading.

  Bias Check: everyone gets the same questions; the checklist asks for time with quieter people
  and for holding off on judging anyone's ability; nothing labels a person; the same answers
  always give the same plan.
*/
const NinetyDayPlan = (() => {
  const el = GuidedPlanner.el;
  const text = value => (value || '').trim();
  const has = (a, key, value) => (a[key] || []).includes(value);

  // Step 1: what's new, and the one tip each situation gets
  const situations = [
    { value: 'role', label: 'I’m new to this role', plan: 'New to this role',
      tip: 'People expect you to learn first. It’s easier to ask basic questions now than in month four.' },
    { value: 'promoted', label: 'I was promoted, and now lead people I used to work beside', plan: 'Promoted, now leading people I used to work beside',
      tip: 'The relationships are already there, and they’re changing. Say so out loud, and meet one-on-one with each person early.' },
    { value: 'team', label: 'I’m taking over a team that’s new to me', plan: 'Taking over a team that’s new to me',
      tip: 'People will wonder what you’ll change. Say early what you won’t change, at least for now.' },
    { value: 'change', label: 'My team is going through a big change (a reorg, a merger, people leaving)', plan: 'My team is going through a big change',
      tip: 'People need to hear what’s staying, what’s stopping, and why, more than once.' },
    { value: 'fresh', label: 'I’ve been here a while and want a fresh start', plan: 'A fresh start in a role I already hold',
      tip: 'Say that you’re resetting and why, so people don’t have to guess.' }
  ];
  const situation = a => situations.find(s => s.value === a.situation);
  const asksFirstTime = a => ['role', 'promoted', 'team'].includes(a.situation);
  const firstTimeTip = 'Your work now happens through other people. It can feel slower at first, and that’s normal.';
  function tips(a) {
    const out = [];
    if (situation(a)) out.push(situation(a).tip);
    if (asksFirstTime(a) && a.firstTime === 'yes') out.push(firstTimeTip);
    return out;
  }

  // Step 2: who to meet, and the questions everyone gets
  const people = [
    { value: 'team', label: 'Each person on my team', plan: 'Each person on my team' },
    { value: 'manager', label: 'My manager', plan: 'My manager' },
    { value: 'peers', label: 'Peers who lead other teams', plan: 'Peers who lead other teams' },
    { value: 'served', label: 'People my team serves', plan: 'People my team serves' },
    { value: 'before', label: 'Whoever held this role before, if you can', plan: 'Whoever held this role before' }
  ];
  const questions = [
    { value: 'protect', label: 'What’s working that I should be careful not to break?' },
    { value: 'way', label: 'What gets in your way most often?' },
    { value: 'wish', label: 'What do you wish leaders here understood?' },
    { value: 'updates', label: 'How do you like to get updates and feedback?' },
    { value: 'first', label: 'If you were in my role, what would you look at first?' },
    { value: 'own', label: 'Write your own' }
  ];
  function questionList(a) {
    const out = questions.filter(q => q.value !== 'own' && has(a, 'questions', q.value)).map(q => q.label);
    if (has(a, 'questions', 'own') && text(a.ownQuestion)) out.push(text(a.ownQuestion));
    return out;
  }

  // Step 3: your manager
  const managerWhen = [
    { value: 'week', label: 'This week', plan: 'This week' },
    { value: 'two', label: 'In the first two weeks', plan: 'In the first two weeks' },
    { value: 'done', label: 'Already done', plan: 'Already done' }
  ];
  const managerUpdates = [
    { value: 'checkin', label: 'A regular check-in', plan: 'A regular check-in' },
    { value: 'note', label: 'A short written note', plan: 'A short written note' },
    { value: 'asneeded', label: 'Only when something comes up', plan: 'Only when something comes up' },
    { value: 'ask', label: 'I’ll ask', plan: 'Ask how they’d like updates' }
  ];

  // Step 4: make sense of it together
  const shareBack = [
    { value: 'meeting', label: 'A team meeting', plan: 'In a team meeting' },
    { value: 'oneonones', label: 'One-on-ones', plan: 'In one-on-ones' },
    { value: 'summary', label: 'A short written summary, then a team conversation', plan: 'In a short written summary, then a team conversation' }
  ];
  const rhythms = [
    { value: 'oneonones', label: 'Weekly one-on-ones', plan: 'Weekly one-on-ones' },
    { value: 'weekly', label: 'A short weekly team check-in', plan: 'A short weekly team check-in' },
    { value: 'monthly', label: 'A monthly look back with the team', plan: 'A monthly look back with the team' }
  ];

  const labelOf = (list, value) => (list.find(o => o.value === value) || {}).plan || '';
  const planList = (list, values) => list.filter(o => (values || []).includes(o.value)).map(o => o.plan);

  // Step 6: before you start. Unchecked items become reminders beside the plan.
  const checks = [
    { value: 'listen', label: 'I’ll listen before I change anything big.',
      reminder: 'Hold off on big changes until you’ve talked with everyone on your team.' },
    { value: 'same', label: 'I’ll ask everyone the same core questions.',
      reminder: 'Use the same questions with everyone, so you can compare what you hear fairly.' },
    { value: 'everyone', label: 'I’ll make time for everyone, not only the people who reach out first.',
      reminder: 'Book time with the quieter people too. The first people to reach out aren’t the whole picture.' },
    { value: 'notice', label: 'I’ll note what I see and ask about it, and hold off judging anyone’s ability.',
      reminder: 'In the first month, write down what you see and ask about it. Hold off on deciding what anyone can or can’t do.' },
    { value: 'loop', label: 'I’ll close the loop, even when the answer is no.',
      reminder: 'When someone raises something, tell them what happened, even if nothing changed.' }
  ];
  const reminders = a => checks.filter(c => !(a.checks || []).includes(c.value)).map(c => c.reminder);

  // Dates. Day 1 is the start date.
  function addDays(value, days) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!m) return '';
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days);
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }
  function shortDate(value, days) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!m) return '';
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  const span = (a, from, to) => (a.start ? shortDate(a.start, from - 1) + ' to ' + shortDate(a.start, to - 1) : '');

  const checkins = [
    { day: 30, questions: ['What’s working?', 'What isn’t?', 'What will I change?'] },
    { day: 60, questions: ['What’s working?', 'What isn’t?', 'What will I change?'] },
    { day: 90, questions: ['What’s working?', 'What isn’t?', 'What will I change?', 'What should the next 90 days focus on?'] }
  ];

  // Step 5: priorities, one to three rows
  const rowFilled = r => text(r.what) || text(r.measure);
  const keptPriorities = a => a.priorities.filter(rowFilled);
  const blankRow = id => ({ id, what: '', measure: '' });
  const inputId = (rowId, col) => 'priority-' + rowId + '-' + col;
  const errId = (rowId, col) => 'err-' + inputId(rowId, col);
  const columns = [
    { id: 'what', label: 'What matters most', maxlength: 200, req: true, error: 'Name the priority, or remove it.',
      hint: 'Example: Customers get an answer within one business day' },
    { id: 'measure', label: 'How you’ll know it’s moving', maxlength: 200,
      hint: 'Example: Fewer follow-up emails asking for an update' }
  ];

  function renderPriorities(wrap, api) {
    const a = api.answers;
    wrap.append(el('p', 'row-question', 'What’s your best guess at what matters most?'));
    wrap.append(el('p', 'small field-hint', 'Add one to three. It’s fine if these change after you listen. Write results, not tasks.'));
    const list = el('div', 'row-list');
    wrap.append(list);

    function draw(focusId) {
      list.replaceChildren();
      a.priorities.forEach((row, index) => {
        const card = el('div', 'row-card');
        const set = el('fieldset');
        set.append(el('legend', 'row-legend', 'Priority ' + (index + 1)));
        columns.forEach(c => {
          const field = el('div', 'field');
          const id = inputId(row.id, c.id);
          const label = el('label', null, c.label + (c.req ? '' : ' (optional)'));
          label.htmlFor = id;
          const h = el('p', 'small field-hint', c.hint);
          h.id = id + '-hint';
          const slot = api.errorSlot(errId(row.id, c.id));
          const input = el('input');
          input.type = 'text';
          input.autocomplete = 'off';
          input.maxLength = c.maxlength;
          input.id = id;
          input.value = row[c.id];
          input.setAttribute('aria-describedby', h.id + ' ' + slot.id);
          input.addEventListener('input', () => {
            row[c.id] = input.value;
            if (text(input.value)) { slot.hidden = true; input.removeAttribute('aria-invalid'); }
            api.set('priorities', a.priorities);
          });
          field.append(label, h, input, slot);
          set.append(field);
        });
        if (a.priorities.length > 1) {
          const remove = el('button', 'btn row-remove', 'Remove');
          remove.type = 'button';
          remove.setAttribute('aria-label', 'Remove priority ' + (index + 1));
          remove.addEventListener('click', () => {
            a.priorities.splice(index, 1);
            api.set('priorities', a.priorities);
            draw();
            const next = wrap.querySelector('button.row-add');
            if (next) next.focus(); else list.querySelector('input')?.focus();
            api.announce('Removed.');
          });
          set.append(remove);
        }
        card.append(set);
        list.append(card);
      });
      wrap.querySelector('.row-add')?.remove();
      if (a.priorities.length < 3) {
        const add = el('button', 'btn row-add', 'Add another priority');
        add.type = 'button';
        add.addEventListener('click', () => {
          const row = blankRow(a.nextRow++);
          a.priorities.push(row);
          api.set('priorities', a.priorities);
          draw(inputId(row.id, 'what'));
        });
        wrap.append(add);
      } else {
        wrap.append(el('p', 'small row-add', 'Three is the most. Fewer priorities are easier to keep in view.'));
      }
      if (focusId) document.getElementById(focusId)?.focus();
    }
    draw();
  }

  function validatePriorities(a) {
    const errors = [];
    const rows = a.priorities;
    if (!rows.some(rowFilled)) {
      errors.push({ errorId: errId(rows[0].id, 'what'), focusId: inputId(rows[0].id, 'what'), message: 'Add at least one priority. A best guess is fine.' });
    }
    rows.forEach(r => {
      if (rowFilled(r) && !text(r.what)) errors.push({ errorId: errId(r.id, 'what'), focusId: inputId(r.id, 'what'), message: 'Name the priority, or remove it.' });
    });
    return errors;
  }

  // The plan
  function section(title, step, api, label, when) {
    const s = el('section', 'brief-section');
    const head = el('div', 'brief-section-head');
    const h = el('h3', null, title);
    head.append(h);
    const edit = el('button', 'btn brief-edit no-print', 'Edit');
    edit.type = 'button';
    edit.setAttribute('aria-label', 'Edit ' + label);
    edit.addEventListener('click', () => api.goTo(step));
    head.append(edit);
    s.append(head);
    if (when) s.append(el('p', 'brief-meta plan-dates', when));
    return s;
  }
  function list(items, tag = 'ul') {
    const ul = el(tag);
    items.forEach(t => ul.append(el('li', null, t)));
    return ul;
  }
  function pairs(items) {
    const dl = el('dl');
    items.forEach(([term, value]) => {
      if (!value || (Array.isArray(value) && !value.length)) return;
      const dd = el('dd');
      if (Array.isArray(value)) dd.append(list(value)); else dd.textContent = value;
      dl.append(el('dt', null, term), dd);
    });
    return dl;
  }
  // Tables stack into labeled lines on narrow screens (screen only; paper keeps the table).
  function table(headers, rows) {
    const t = el('table', 'brief-table');
    const thead = el('thead');
    const hr = el('tr');
    headers.forEach(h => { const th = el('th', null, h); th.scope = 'col'; hr.append(th); });
    thead.append(hr);
    const tbody = el('tbody');
    rows.forEach(cells => {
      const tr = el('tr');
      cells.forEach((c, i) => { const td = el('td', null, c || ' '); td.dataset.label = headers[i]; tr.append(td); });
      tbody.append(tr);
    });
    t.append(thead, tbody);
    return t;
  }

  function renderResult(container, a, api) {
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your plan'), el('h2', null, 'Your 90-day plan'),
      el('p', null, 'Use Edit to change any section, then print it or save it as a PDF. Expect it to change once you’ve listened. That’s what the check-ins are for.'));
    container.append(head);

    const open = reminders(a);
    if (open.length) {
      const box = el('section', 'prep-notes no-print');
      box.setAttribute('aria-labelledby', 'reminders-title');
      const h = el('h3', null, 'Before you start');
      h.id = 'reminders-title';
      box.append(h, list(open), el('p', 'small', 'These come from the checklist in step 6. They don’t print.'));
      container.append(box);
    }

    const actions = el('div', 'result-actions no-print');
    const print = el('button', 'btn primary', 'Print plan');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    const editAll = el('button', 'btn', 'Edit my answers');
    editAll.type = 'button';
    editAll.addEventListener('click', () => api.goTo(0));
    const again = el('button', 'btn', 'Start a new plan');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    actions.append(print, editAll, again);
    container.append(actions,
      el('p', 'small no-print', 'In the print window, choose “Save as PDF” to keep a digital copy, and turn off browser headers and footers for a cleaner page.'));

    const brief = el('article', 'brief');
    brief.setAttribute('aria-label', '90-day plan');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    titleWrap.append(el('p', 'eyebrow', '90-day plan'), el('h3', 'brief-title', text(a.name) || 'My next 90 days'));
    const meta = [];
    if (situation(a)) meta.push(situation(a).plan);
    if (a.start) meta.push('Day 1: ' + addDays(a.start, 0) + ' · Day 90: ' + addDays(a.start, 89));
    if (meta.length) titleWrap.append(el('p', 'brief-meta', meta.join(' · ')));
    const editTop = el('button', 'btn brief-edit no-print', 'Edit');
    editTop.type = 'button';
    editTop.setAttribute('aria-label', 'Edit where you’re starting');
    editTop.addEventListener('click', () => api.goTo(0));
    top.append(titleWrap, editTop);
    brief.append(brand, top);

    const t = tips(a);
    if (t.length) {
      const s = el('section', 'brief-section plan-tip');
      s.append(el('h3', null, 'Keep in mind'), list(t));
      brief.append(s);
    }

    const p1 = section('Days 1 to 30: Listen and learn', 1, api, 'days 1 to 30', span(a, 1, 30));
    p1.append(pairs([
      ['Meet one-on-one with', planList(people, a.people)],
      ['Ask everyone the same questions', questionList(a)],
      ['What I’ll share about how I work', text(a.share)],
      ['What I’ll hold off on changing for now', text(a.holdOff)]
    ]));
    brief.append(p1);

    const mgr = section('My manager', 2, api, 'your manager');
    mgr.append(pairs([
      ['Talk about this plan', labelOf(managerWhen, a.managerWhen)],
      ['What they most need from me by day 90', text(a.managerNeeds) || 'Ask them: “What do you most need from me by day 90?”'],
      ['Updates', labelOf(managerUpdates, a.managerUpdates)]
    ]));
    brief.append(mgr);

    const p2 = section('Days 31 to 60: Make sense of it together', 3, api, 'days 31 to 60', span(a, 31, 60));
    p2.append(pairs([
      ['Share back what I heard', labelOf(shareBack, a.shareBack) + '. Share themes, not who said what.'],
      ['Ask the team', 'What should we keep, what should we stop, and what should we start?'],
      ['Regular check-ins', planList(rhythms, a.rhythms)],
      ['One early fix', text(a.earlyFix)]
    ]));
    brief.append(p2);

    const p3 = section('Days 61 to 90: Act and check in', 4, api, 'days 61 to 90', span(a, 61, 90));
    p3.append(el('h4', null, 'What matters most (my best guess today)'));
    p3.append(table(['Priority', 'How I’ll know it’s moving'], keptPriorities(a).map(r => [text(r.what), text(r.measure)])));
    p3.append(pairs([
      ['People outside my team I need on board', text(a.outside)],
      ['One thing I’ll protect for myself', text(a.protect)]
    ]));
    brief.append(p3);

    const ci = section('Check-ins', 5, api, 'the checklist');
    ci.classList.add('plan-checkins');
    ci.append(el('p', null, 'Set aside 20 minutes at each one. Write down what you notice, then change the plan if it needs it.'));
    const grid = el('div', 'checkin-grid');
    checkins.forEach(c => {
      const box = el('div', 'checkin');
      const when = a.start ? ' · ' + shortDate(a.start, c.day - 1) : '';
      box.append(el('h4', null, 'Day ' + c.day + when), list(c.questions));
      grid.append(box);
    });
    ci.append(grid);
    brief.append(ci);

    const notes = el('section', 'brief-section');
    notes.append(el('h3', null, 'Notes'));
    notes.append(el('p', 'small no-print', 'Space to write on the printout.'));
    const lines = el('div', 'brief-lines');
    lines.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) lines.append(el('div'));
    notes.append(lines);
    // Notes and the footer stay together on paper, so the footer never prints alone.
    const end = el('div', 'brief-end');
    end.append(notes);

    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'This plan is a starting point. Expect it to change once you’ve listened. Change what doesn’t fit.'));
    foot.append(el('p', null, 'Made with the Pivot Labs 90-Day Leader Plan · ' + new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) +
      ' · Ideas drawn from Michael D. Watkins (2003, 2013) and Michaela Schuler.'));
    end.append(foot);
    brief.append(end);
    container.append(brief);
  }

  const holdOffHint = a => (a.situation === 'change'
    ? 'Example: The team schedule stays the same until we’ve talked about it together.'
    : 'Example: How we run the weekly meeting, until I’ve sat in on a few.');

  const steps = [
    {
      id: 'start',
      title: 'Where you’re starting',
      intro: 'A few questions about what’s new. Your answers shape the tips in your plan.',
      fields: [
        { id: 'situation', type: 'choice', label: 'What’s new for you?', hint: 'Pick the one that fits best.',
          options: situations.map(s => ({ value: s.value, label: s.label })),
          note: a => (situation(a) ? situation(a).tip : ''), error: 'Choose what’s new for you.' },
        { id: 'firstTime', type: 'choice', showIf: asksFirstTime, label: 'Is this your first time leading people?',
          options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
          note: a => (a.firstTime === 'yes' ? firstTimeTip : ''), error: 'Choose yes or no.' },
        { id: 'name', type: 'text', maxlength: 100, optional: true, label: 'Team or role name',
          hint: 'Example: Customer support team' },
        { id: 'start', type: 'date', optional: true, label: 'Start date',
          hint: 'We’ll put dates on each part of your plan. Leave it blank if you’d rather not.' }
      ]
    },
    {
      id: 'listen',
      title: 'Days 1 to 30: Listen and learn',
      intro: 'The first month is for listening. Meet people, ask the same questions, and let them get to know you too.',
      fields: [
        { id: 'people', type: 'multi', label: 'Who will you meet one-on-one?', hint: 'Choose all that fit.',
          options: people.map(p => ({ value: p.value, label: p.label })), default: () => ['team', 'manager'],
          error: 'Choose at least one.' },
        { id: 'questions', type: 'multi', label: 'Which questions will you ask everyone?',
          hint: 'Pick up to four. Asking everyone the same questions makes it easier to notice what you hear more than once.',
          options: questions.map(q => ({ value: q.value, label: q.label })),
          note: a => ((a.questions || []).length > 4 ? 'That’s more than four. Fewer questions leave more time to listen.' : ''),
          error: 'Choose at least one question.' },
        { id: 'ownQuestion', type: 'text', maxlength: 200, showIf: a => has(a, 'questions', 'own'), label: 'Your question',
          hint: 'Example: What’s one thing you’d like to learn this year?', error: 'Write your question, or untick “Write your own.”' },
        { id: 'share', type: 'textarea', maxlength: 600, label: 'What will you share about how you work?',
          hint: 'Example: I’d rather hear about a problem early. I reply within a day. I keep Friday mornings for planning.',
          error: 'Write a line or two about how you work.' },
        { id: 'holdOff', type: 'textarea', maxlength: 400, optional: true, label: 'What will you hold off on changing for now?',
          hint: holdOffHint }
      ]
    },
    {
      id: 'manager',
      title: 'Your manager',
      intro: 'Agree early on what a good 90 days looks like, so you’re working toward the same thing.',
      fields: [
        { id: 'managerWhen', type: 'choice', label: 'When will you talk with your manager about this plan?',
          options: managerWhen.map(o => ({ value: o.value, label: o.label })), error: 'Choose when you’ll talk.' },
        { id: 'managerNeeds', type: 'textarea', maxlength: 400, optional: true, label: 'What do they most need from you by day 90?',
          hint: 'If you don’t know, that’s your first question for them.' },
        { id: 'managerUpdates', type: 'choice', label: 'How do they want updates?',
          options: managerUpdates.map(o => ({ value: o.value, label: o.label })), error: 'Choose one.' }
      ]
    },
    {
      id: 'sense',
      title: 'Days 31 to 60: Make sense of it together',
      intro: 'Tell people what you heard, and decide together what comes next. Your plan will include one question for the team: what should we keep, what should we stop, and what should we start?',
      fields: [
        { id: 'shareBack', type: 'choice', label: 'How will you share back what you heard?', hint: 'Share themes, not who said what.',
          options: shareBack.map(o => ({ value: o.value, label: o.label })), error: 'Choose how you’ll share it.' },
        { id: 'rhythms', type: 'multi', optional: true, label: 'Which regular check-ins will you set up?', hint: 'Choose any that fit.',
          options: rhythms.map(o => ({ value: o.value, label: o.label })), default: () => ['oneonones'] },
        { id: 'earlyFix', type: 'text', maxlength: 200, optional: true, label: 'One early fix',
          hint: 'Something small that more than one person mentioned. A small fix people asked for often means more than a big one they didn’t.' }
      ]
    },
    {
      id: 'act',
      title: 'Days 61 to 90: Act and check in',
      intro: 'Pick what matters most, and how you’ll know it’s moving.',
      fields: [
        { id: 'priorities', type: 'custom', render: renderPriorities, validate: validatePriorities },
        { id: 'outside', type: 'textarea', maxlength: 400, optional: true, label: 'Who outside your team do you need on board?',
          hint: 'Example: The scheduling team, because they set our hours.' },
        { id: 'protect', type: 'text', maxlength: 200, optional: true, label: 'What’s one thing you’ll protect for yourself?',
          hint: 'A new role takes a lot. Example: a real lunch break, or leaving on time two days a week.' }
      ]
    },
    {
      id: 'checkins',
      title: 'Check-ins and before you start',
      intro: a => 'Your plan has three check-ins, at day 30, 60 and 90' +
        (a.start ? ' (' + shortDate(a.start, 29) + ', ' + shortDate(a.start, 59) + ' and ' + shortDate(a.start, 89) + ')' : '') +
        '. At each one, ask yourself: What’s working? What isn’t? What will I change? Day 90 adds: What should the next 90 days focus on?',
      fields: [
        { id: 'checks', type: 'multi', optional: true, label: 'Before you start, check what’s true.', hint: 'Choose any that fit.',
          options: checks.map(c => ({ value: c.value, label: c.label })),
          after: 'Unchecked items turn into reminders next to your plan. They don’t print.' }
      ]
    }
  ];

  function initialAnswers() {
    return {
      situation: '', firstTime: '', name: '', start: '',
      people: [], questions: [], ownQuestion: '', share: '', holdOff: '',
      managerWhen: '', managerNeeds: '', managerUpdates: '',
      shareBack: '', rhythms: [], earlyFix: '',
      priorities: [blankRow(1)], nextRow: 2, outside: '', protect: '',
      checks: []
    };
  }
  // Defaults filled in when a step opens, blank rows and the row counter don't count as work.
  function normalized(a) {
    const copy = { ...a, nextRow: 0, priorities: keptPriorities(a).map(r => ({ ...r, id: 0 })) };
    if (JSON.stringify(copy.people) === '["team","manager"]') copy.people = [];
    if (JSON.stringify(copy.rhythms) === '["oneonones"]') copy.rhythms = [];
    return JSON.stringify(copy);
  }
  const blank = normalized(initialAnswers());
  const isDirty = a => normalized(a) !== blank;

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your plan', finishLabel: 'Review my plan',
    // Exposed for testing.
    tips, questionList, reminders, keptPriorities, checks };
})();
