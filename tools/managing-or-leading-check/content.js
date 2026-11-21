'use strict';
/*
  Managing or Leading Check content: the statements, the areas, the suggested next steps, and the snapshot.
  The step engine is shared: assets/js/guided-planner.js.

  The managing and leading distinction comes from John P. Kotter ("What Leaders Really Do," 1990)
  and Abraham Zaleznik ("Managers and Leaders: Are They Different?," 1977). Two infographics with no
  creator named ("Managing vs Leading" and "13 Signs You're Only Managing And Not Leading") were
  inspiration only. The statements, areas and wording are our own.

  Bias Check: the check is about the person using it, never their team; statements describe actions,
  not character; there is no score, number or type ("you're a manager"); the intro and the snapshot
  say both managing and leading matter; a busy stretch counts as context; "Not sure" points to asking
  the team; the same answers always give the same snapshot.

  Scoring (not shown to the person): each statement leans "through you" or "without you".
  For a through-you statement: Most weeks 2, Some weeks 1, Rarely 0. A without-you statement is reversed.
  Not sure counts 1. Two statements per area, so an area totals 0 to 4:
  0 or 1 runs without you, 2 a mix, 3 or 4 runs through you.
*/
const ManagingLeadingCheck = (() => {
  const el = GuidedPlanner.el;
  const text = value => (value || '').trim();

  // Step 1: what's going on right now. Each choice adds a line to "Keep in mind".
  const contexts = [
    { value: 'crunch', label: 'A deadline or crunch',
      line: 'In a crunch, more running through you is normal. Look again once it eases.' },
    { value: 'new', label: 'I’m new to this team',
      line: 'When you’re new, more runs through you while you learn.', tool: 'ninetyDay' },
    { value: 'short', label: 'We’re short on people',
      line: 'When you’re short on people, stepping in is often the right call. Note what you’d hand back once you’re fully staffed.' },
    { value: 'newPerson', label: 'Someone new joined the team',
      line: 'Someone new needs more direction for a while. That’s managing done well.' },
    { value: 'none', label: 'Nothing unusual' }
  ];

  const tools = {
    eisenhower: { name: 'Eisenhower Matrix', href: '../eisenhower-matrix/index.html' },
    coaching: { name: 'Coaching Approach Picker', href: '../coaching-approach-picker/index.html' },
    delegation: { name: 'Delegation Planner', href: '../delegation-planner/index.html' },
    roleClarity: { name: 'Role Clarity Builder', href: '../role-clarity-builder/index.html' },
    teamMap: { name: 'Team Development Map', href: '../team-development-map/index.html' },
    ninetyDay: { name: '90-Day Leader Plan', href: '../90-day-leader-plan/index.html' }
  };

  // The five areas, in tie-break order. lean: 'through' or 'without' for each statement.
  const areas = [
    { id: 'time', name: 'Your time', step: 1,
      statements: [
        { id: 'timeWeek', lean: 'through', text: 'Most of my week goes to things due this week.' },
        { id: 'timeAhead', lean: 'without', text: 'I set aside time to think about the months ahead.' }
      ],
      why: 'Most of your week is going to what’s due now, which leaves little room for what’s coming.',
      move: 'Block 30 minutes this week for something more than a month away. Protect it like a meeting.',
      tool: 'eisenhower', toolLine: 'Sort what’s on your plate, so the bigger work gets time.' },
    { id: 'decisions', name: 'Decisions', step: 1,
      statements: [
        { id: 'decAnswer', lean: 'through', text: 'When people bring me a problem, I give them the answer.' },
        { id: 'decOwn', lean: 'without', text: 'People on my team make everyday decisions without checking with me first.' }
      ],
      why: 'Problems and calls are coming to you, so people wait on you, and you have less time for the bigger work.',
      move: 'Next time someone brings you a problem, ask “What do you think we should do?” before you answer.',
      tool: 'coaching', toolLine: 'Plan a conversation that asks more than it tells.' },
    { id: 'handoff', name: 'Handing off', step: 2,
      statements: [
        { id: 'handBack', lean: 'through', text: 'Work comes back to me because I’m the fastest at it.' },
        { id: 'handStays', lean: 'without', text: 'When I hand something off, it stays handed off.' }
      ],
      why: 'Work is finding its way back to you, so the team doesn’t get the practice.',
      move: 'Pick one thing you usually do or check yourself, and hand it over with clear limits.',
      tool: 'delegation', toolLine: 'Hand off one piece of work and agree on who decides what.' },
    { id: 'direction', name: 'Direction', step: 2,
      statements: [
        { id: 'dirWhy', lean: 'without', text: 'My team could explain why our top priority matters, without me there.' },
        { id: 'dirTasks', lean: 'through', text: 'I give people tasks more often than results to own.' }
      ],
      why: 'The “why” lives mostly with you, so people need you to fill in the gaps.',
      move: 'Share why the top priority matters, then ask someone to say it back in their own words.',
      tool: 'roleClarity', toolLine: 'Agree on the results each role owns, not only the tasks.' },
    { id: 'growth', name: 'Growing people', step: 3,
      statements: [
        { id: 'growLearn', lean: 'without', text: 'Someone on my team is learning to do something I used to do.' },
        { id: 'growStep', lean: 'without', text: 'Someone on my team could step in for me on something important.' }
      ],
      why: 'Few people are learning what you do now, so it stays with you.',
      move: 'Pick one thing someone else could learn, and plan the first step with them.',
      tool: 'teamMap', toolLine: 'Decide how much support each person needs for a task.' }
  ];
  const statements = areas.flatMap(area => area.statements.map(s => ({ ...s, area: area.id })));

  const answerOptions = [
    { value: 'most', label: 'Most weeks' },
    { value: 'some', label: 'Some weeks' },
    { value: 'rarely', label: 'Rarely' },
    { value: 'unsure', label: 'Not sure' }
  ];
  const answerLabel = value => (answerOptions.find(o => o.value === value) || {}).label || '';

  function points(s, value) {
    if (value === 'some' || value === 'unsure') return 1;
    const through = s.lean === 'through';
    if (value === 'most') return through ? 2 : 0;
    if (value === 'rarely') return through ? 0 : 2;
    return 0;
  }
  const areaTotal = (a, area) => area.statements.reduce((sum, s) => sum + points(s, a[s.id]), 0);
  function leanLabel(total) {
    if (total >= 3) return 'Runs through you';
    if (total === 2) return 'A mix';
    return 'Runs without you';
  }

  // Where to start: the area that runs most through you. Ties go in the order above.
  // When every area runs without you, there is no single area to start with.
  function startArea(a) {
    let best = null;
    let bestTotal = -1;
    areas.forEach(area => {
      const total = areaTotal(a, area);
      if (total > bestTotal) { best = area; bestTotal = total; }
    });
    return bestTotal >= 2 ? best : null;
  }
  const noLean = {
    why: 'Not much is waiting on you right now.',
    move: 'Pick the area you want to grow next, and keep doing what’s working.',
    tool: 'teamMap', toolLine: 'Plan how you’ll keep growing your people.'
  };
  const startPlan = a => startArea(a) || noLean;

  function contextLines(a) {
    return contexts.filter(c => c.line && (a.context || []).includes(c.value));
  }
  const unsureStatements = a => statements.filter(s => a[s.id] === 'unsure');

  // Check again in four weeks, as a date field value (YYYY-MM-DD).
  function inFourWeeks() {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    const pad = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function longDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!m) return '';
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      .toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // The small move is filled in for the suggested area. If the answers change the suggestion and the
  // person hasn't edited the move, it follows the new suggestion. Runs as step 5 opens (before its fields draw).
  function syncMove(a) {
    const move = startPlan(a).move;
    if (!text(a.tryThis) || a.tryThis === a.tryAuto) a.tryThis = move;
    a.tryAuto = move;
  }

  function statementField(s) {
    return { id: s.id, type: 'choice', label: s.text, options: answerOptions,
      error: 'Choose the answer that’s closest.' };
  }
  const fieldsFor = step => areas.filter(area => area.step === step).flatMap(area => area.statements.map(statementField));

  // The snapshot
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
  function list(items) {
    const ul = el('ul');
    items.forEach(item => {
      const li = el('li');
      if (typeof item === 'string') li.textContent = item; else li.append(...item);
      ul.append(li);
    });
    return ul;
  }
  function toolLink(key) {
    const t = tools[key];
    const a = el('a', null, t.name);
    a.href = t.href;
    return a;
  }
  function pairs(items) {
    const dl = el('dl');
    items.forEach(([term, value]) => {
      if (!value) return;
      const dd = el('dd');
      if (typeof value === 'string') dd.textContent = value; else dd.append(...value);
      dl.append(el('dt', null, term), dd);
    });
    return dl;
  }

  // The picture: one row per area, a marker on a three-stop scale, the lean in words, and a
  // "Start here" tag on the start area. Built from the same totals as the table, so they always agree.
  // Screen readers hear one summary sentence; the drawn rows are hidden from them (the table repeats it).
  const scaleStops = ['Runs without you', 'A mix', 'Runs through you'];
  function stopIndex(total) {
    if (total >= 3) return 2;
    if (total === 2) return 1;
    return 0;
  }
  function joinNames(names) {
    if (names.length < 2) return names.join('');
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }
  function leanSummary(a) {
    const area = startArea(a);
    const parts = scaleStops.map((label, i) => {
      const names = areas.filter(ar => stopIndex(areaTotal(a, ar)) === i).map(ar => ar.name.toLowerCase());
      return names.length ? label + ': ' + joinNames(names) + '.' : '';
    }).filter(Boolean);
    return 'Where things lean. ' + parts.join(' ') + (area ? ' Start here: ' + area.name.toLowerCase() + '.' : '');
  }
  function leanPicture(a) {
    const start = startArea(a);
    const fig = el('figure', 'lean-pic');
    fig.append(el('p', 'visually-hidden', leanSummary(a)));
    const drawn = el('div', 'lean-drawn');
    drawn.setAttribute('aria-hidden', 'true');
    drawn.append(el('p', 'lean-title', 'Where things lean, at a glance'));
    const scale = el('div', 'lean-row lean-scale');
    scale.append(el('span', 'lean-name'));
    const stops = el('span', 'lean-stops');
    scaleStops.forEach(label => stops.append(el('span', null, label)));
    scale.append(stops, el('span', 'lean-word'));
    drawn.append(scale);
    areas.forEach(area => {
      const total = areaTotal(a, area);
      const row = el('div', 'lean-row' + (area === start ? ' is-start' : ''));
      const name = el('span', 'lean-name', area.name);
      if (area === start) name.append(el('span', 'lean-tag', 'Start here'));
      const track = el('span', 'lean-track');
      const at = stopIndex(total);
      for (let i = 0; i < 3; i++) {
        const seg = el('span', 'lean-seg');
        if (i === at) seg.append(el('span', 'lean-dot'));
        track.append(seg);
      }
      row.append(name, track, el('span', 'lean-word', leanLabel(total)));
      drawn.append(row);
    });
    drawn.append(el('p', 'lean-caption', 'A picture of the last two weeks, not a grade.'));
    fig.append(drawn);
    return fig;
  }

  function renderResult(container, a, api) {
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your snapshot'), el('h2', null, 'Your managing and leading snapshot'),
      el('p', null, 'This shows where things lean right now, based on your last two weeks. It’s not a grade. Use Edit to change an answer, then print it or save it as a PDF.'));
    container.append(head);

    const actions = el('div', 'result-actions no-print');
    const print = el('button', 'btn primary', 'Print snapshot');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    const editAll = el('button', 'btn', 'Edit my answers');
    editAll.type = 'button';
    editAll.addEventListener('click', () => api.goTo(0));
    const again = el('button', 'btn', 'Take it again');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    actions.append(print, editAll, again);
    container.append(actions,
      el('p', 'small no-print', 'In the print window, choose “Save as PDF” to keep a digital copy, and turn off browser headers and footers for a cleaner page.'));

    const today = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const brief = el('article', 'brief');
    brief.setAttribute('aria-label', 'Managing and leading snapshot');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    titleWrap.append(el('p', 'eyebrow', 'Managing or Leading Check'), el('h3', 'brief-title', 'My managing and leading snapshot'),
      el('p', 'brief-meta', 'Based on the two weeks before ' + today));
    top.append(titleWrap);
    brief.append(brand, top);

    // Keep in mind: what's going on right now, and anything marked Not sure
    const keep = [];
    contextLines(a).forEach(c => {
      if (c.tool) keep.push([document.createTextNode(c.line + ' The '), toolLink(c.tool), document.createTextNode(' can help you plan the first months.')]);
      else keep.push(c.line);
    });
    unsureStatements(a).forEach(s => keep.push('You weren’t sure about “' + s.text + '” Ask someone on your team how they see it.'));
    if (keep.length) {
      const s = section('Keep in mind', 0, api, 'what’s going on right now');
      s.classList.add('snap-keep');
      s.append(list(keep));
      brief.append(s);
    }

    const lean = section('Where things lean', 1, api, 'your answers');
    lean.classList.add('snap-lean');
    lean.append(leanPicture(a));
    const t = el('table', 'brief-table');
    const thead = el('thead');
    const hr = el('tr');
    ['Area', 'Right now', 'Your answers'].forEach(h => { const th = el('th', null, h); th.scope = 'col'; hr.append(th); });
    thead.append(hr);
    const tbody = el('tbody');
    areas.forEach(area => {
      const tr = el('tr');
      const name = el('td', null, area.name);
      name.dataset.label = 'Area';
      const now = el('td', 'snap-now', leanLabel(areaTotal(a, area)));
      now.dataset.label = 'Right now';
      const said = el('td');
      said.dataset.label = 'Your answers';
      const ul = el('ul', 'snap-answers');
      area.statements.forEach(s => {
        const li = el('li');
        li.append(el('span', null, s.text + ' '), el('strong', null, answerLabel(a[s.id])));
        ul.append(li);
      });
      said.append(ul);
      tr.append(name, now, said);
      tbody.append(tr);
    });
    t.append(thead, tbody);
    lean.append(t);
    lean.append(el('p', 'small snap-note', 'Both columns matter. “Runs through you” is often right in a crunch or with someone new. It’s worth a look when it’s the usual week.'));
    brief.append(lean);

    const plan = startPlan(a);
    const area = startArea(a);
    const start = section(area ? 'Where to start: ' + area.name : 'Where to start', 4, api, 'your next step');
    start.classList.add('snap-start');
    start.append(pairs([
      ['Why', plan.why],
      ['One small thing I’ll try this week', text(a.tryThis)],
      ['A tool that can help', [toolLink(plan.tool), document.createTextNode('. ' + plan.toolLine)]],
      ['What I’d do with the time I get back', text(a.timeBack)],
      ['I’ll look at this again', longDate(a.again)]
    ]));
    brief.append(start);

    const notes = el('section', 'brief-section');
    notes.append(el('h3', null, 'Notes'));
    notes.append(el('p', 'small no-print', 'Space to write on the printout.'));
    const lines = el('div', 'brief-lines');
    lines.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) lines.append(el('div'));
    notes.append(lines);
    // Notes and the footer stay together on paper, so the footer never prints alone.
    const end = el('div', 'brief-end');
    end.append(notes);
    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'Both managing and leading matter. This snapshot shows where things lean right now, not what kind of leader you are.'));
    foot.append(el('p', null, 'Made with the Pivot Labs Managing or Leading Check · ' + today +
      ' · Ideas drawn from John P. Kotter (1990) and Abraham Zaleznik (1977).'));
    end.append(foot);
    brief.append(end);
    container.append(brief);
  }

  const steps = [
    {
      id: 'now',
      title: 'Right now',
      intro: 'First, a quick question about what’s going on. A busy stretch changes what a normal week looks like.',
      fields: [
        { id: 'context', type: 'multi', optional: true, label: 'Is anything unusual going on?', hint: 'Choose any that fit, or skip it.',
          options: contexts.map(c => ({ value: c.value, label: c.label })),
          note: a => contextLines(a).map(c => c.line + (c.tool ? ' Your snapshot will point you to the 90-Day Leader Plan.' : '')).join(' ') }
      ]
    },
    {
      id: 'time',
      title: 'Your time and decisions',
      intro: 'Think about your last two weeks. Pick what’s closest. There are no right answers.',
      fields: fieldsFor(1)
    },
    {
      id: 'handoff',
      title: 'Handing off and direction',
      intro: 'Still thinking about your last two weeks.',
      fields: fieldsFor(2)
    },
    {
      id: 'growth',
      title: 'Growing people',
      intro: 'Two more. Then you’ll pick one small thing to try.',
      fields: fieldsFor(3)
    },
    {
      id: 'next',
      title: 'Your next step',
      intro: a => {
        syncMove(a);
        const area = startArea(a);
        return area
          ? 'Start with ' + area.name.toLowerCase() + '. ' + area.why
          : 'Not much is waiting on you right now. Pick the area you want to grow next, and keep doing what’s working.';
      },
      fields: [
        { id: 'tryThis', type: 'textarea', maxlength: 400, label: 'What’s one small thing you’ll try this week?',
          hint: 'We filled in a suggestion. Change it to fit.', error: 'Write one small thing to try.' },
        { id: 'timeBack', type: 'textarea', maxlength: 400, optional: true, label: 'What would you do with the time you get back?',
          hint: 'Example: Plan next quarter with the team, or finally get to the project I keep pushing back.' },
        { id: 'again', type: 'date', optional: true, label: 'When will you look at this again?',
          hint: 'Four weeks out is filled in. Leave it blank if you’d rather not.', default: () => inFourWeeks() }
      ]
    }
  ];

  function initialAnswers() {
    const a = { context: [], tryThis: '', tryAuto: '', timeBack: '', again: '' };
    statements.forEach(s => { a[s.id] = ''; });
    return a;
  }
  // The filled-in move and date don't count as work.
  function normalized(a) {
    const copy = { ...a };
    if (copy.tryThis === copy.tryAuto) copy.tryThis = '';
    copy.tryAuto = '';
    if (copy.again === inFourWeeks()) copy.again = '';
    return JSON.stringify(copy);
  }
  const blank = normalized(initialAnswers());
  const isDirty = a => normalized(a) !== blank;

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your snapshot', finishLabel: 'See my snapshot',
    // Exposed for testing.
    areas, statements, areaTotal, leanLabel, startArea, startPlan, contextLines, unsureStatements };
})();
