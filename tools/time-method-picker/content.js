'use strict';
/*
  Time Method Picker content: the situation questions, the eleven methods and the Eisenhower
  handoff, and the week plan.
  Shared engines: assets/js/guided-planner.js (the steps) and
  assets/js/situation-picker.js (the questions and the suggestion card).

  Answers describe what's happening over the last week or two, never the person.
  Only the two situation questions decide the suggestion, so the same answers always
  suggest the same method. Nothing promises a result: each method is a habit to try for a week.
  Registered names (Pomodoro, Getting Things Done) appear only in About this tool, never here.
  Approved copy: claude/pivot-labs-time-method-picker-copy.md in the project docs.
*/
const TimeMethodPicker = (() => {
  const el = GuidedPlanner.el;
  const text = value => (value || '').trim();

  const HABIT = 'This is a habit to try for a week, not a fix. Notice what changes, and keep what helps.';

  // Each method belongs to one group (the first question's answer). "Other ways to try this"
  // lists the other methods in the same group.
  const methods = [
    { id: 'frog', group: 'first', title: 'Hardest thing first',
      bestFor: 'When one hard task keeps getting put off.',
      why: 'A task you keep putting off tends to follow you around all day. This tries doing it first, before the day fills up.',
      steps: ['The night before, name the one task you’ve been putting off.',
        'Start on it first thing, before email or messages.',
        'If it’s big, do the first 30 minutes and set a time for the rest.'],
      notice: 'Did the days you started with it feel different?' },
    { id: 'ivylee', group: 'first', title: 'Six things, in order',
      bestFor: 'When the day ends without a clear place to start tomorrow.',
      why: 'Deciding tomorrow’s order today means the morning starts with a next step, not a decision.',
      steps: ['Before you stop for the day, write up to six things for tomorrow.',
        'Number them by how much they matter.',
        'Work on number one until it’s done, then number two. Anything left moves to the next list.'],
      notice: 'Which things kept moving to the next list?' },
    { id: 'mits', group: 'first', title: 'Most important first',
      bestFor: 'When the important things are still waiting at the end of the day.',
      why: 'When the day fills with whatever comes in, the important things wait. This picks them before the day does.',
      steps: ['Each morning, pick up to three things that matter most today.',
        'Do at least one before you open email or messages.',
        'Write them where you’ll see them.'],
      notice: 'On the days none got done, what got in the way?' },
    { id: 'onethreefive', group: 'first', title: 'One big, three medium, five small',
      bestFor: 'When the list mixes big and small things and never gets done.',
      why: 'A list with no limit can’t be finished. This gives the day a size: nine things, in three sizes.',
      steps: ['The night before or first thing, pick one big thing, three medium and five small.',
        'On busy days, leave a few spots open for what comes up.',
        'What doesn’t fit stays on your longer list for another day.'],
      notice: 'Was nine about right, or would fewer fit your days?' },
    { id: 'rounds', group: 'focus', title: 'Short focus rounds',
      bestFor: 'When the work keeps getting interrupted after a few minutes.',
      why: 'When interruptions break up the work, short rounds give it a set time, with a break to look forward to.',
      steps: ['Pick one task. Set a timer for 25 minutes and work only on that.',
        'If something comes up, jot it down for later.',
        'Take a 5-minute break. After four rounds, take a longer one.'],
      notice: 'Would shorter or longer rounds suit your work?' },
    { id: 'calendar', group: 'focus', title: 'Put it on the calendar',
      bestFor: 'When there’s no open time on the calendar for the work.',
      why: 'Work without a set time waits for a gap that rarely comes. A block on your calendar gives it one.',
      steps: ['Book a block for the work that keeps getting pushed, like a meeting.',
        'If something comes up, move the block rather than delete it.',
        'When the time is up, stop and note where you left off.'],
      notice: 'Which times of day held up best?' },
    { id: 'deadline', group: 'focus', title: 'Set a shorter deadline',
      bestFor: 'When a task stretches to fill the whole day.',
      why: 'Work tends to stretch to fill the time it’s given. A shorter deadline gives it an edge.',
      steps: ['Before you start, write what done looks like.',
        'Give it less time than feels comfortable, and put the end time where you can see it.',
        'When time’s up, check it against what done looks like.'],
      notice: 'Where did the extra time usually go?' },
    { id: 'twominute', group: 'small', title: 'Do it now if it takes two minutes',
      bestFor: 'When quick things that take a minute or two pile up.',
      why: 'Tiny tasks can take longer to track than to do. Handling them now keeps them off your list.',
      steps: ['When something lands, ask: will this take two minutes or less?',
        'If yes, do it now. If not, put it on your list or calendar.',
        'During focus time, save these for your next break.'],
      notice: 'Did small things start eating into focus time?' },
    { id: 'batch', group: 'small', title: 'Group them',
      bestFor: 'When the same kind of task comes up all through the day.',
      why: 'Switching between kinds of work takes time each switch. Grouping keeps you on one kind at a time.',
      steps: ['Pick one kind of task that shows up all day, like email, calls or approvals.',
        'Set two or three times a day for it, and handle the group then.',
        'If it helps, let people know when to expect a reply.'],
      notice: 'Did anything need a faster answer than the times you set?' },
    { id: 'bigfirst', group: 'small', title: 'Big things in first',
      bestFor: 'When small things fill the day before the big ones get a turn.',
      why: 'If the small things go in first, the week fills before the big ones get a turn.',
      steps: ['At the start of the week, name the two or three big things that matter most.',
        'Put time for them on your calendar before anything else.',
        'Fit meetings and small tasks around them.'],
      notice: 'What pushed into the big work’s time?' },
    { id: 'eisenhower', group: 'too-much', title: 'Sort it first', handoff: true,
      bestFor: 'When you need to sort what’s urgent from what’s important.',
      summary: 'This one has its own tool: the Eisenhower Matrix puts each task in one of four boxes, by how urgent and how important it is.',
      href: '../eisenhower-matrix/index.html' },
    { id: 'pareto', group: 'too-much', title: 'The few that matter most',
      bestFor: 'When you want to find the few things that make the most difference.',
      why: 'Often a few pieces of work make most of the difference. Finding them shows where your best time should go.',
      steps: ['List what’s on your plate this week.',
        'Mark the few that would make the most difference. Aim for about one in five.',
        'Give those your best time. For the rest, ask whether each one can be smaller, later, handed off or dropped.'],
      notice: 'Did your best time go to the ones you marked?' },
    { id: 'onelist', group: 'scattered', title: 'One trusted list',
      bestFor: 'When work is scattered across too many places.',
      why: 'When work lives in many places, things slip, and the rest stays in your head. One list gives everything one place to land.',
      steps: ['Pick one place for your list: an app, a notebook or a document.',
        'Whenever something comes up, add it there, wherever it started.',
        'Write the next small step for each item. Once a week, look over the whole list.'],
      notice: 'Did you trust the list enough to stop holding things in your head?' }
  ];
  const find = id => methods.find(m => m.id === id) || null;

  // The two questions decide the method. Nothing about the person changes the result.
  const routes = {
    first: { frog: 'frog', tomorrow: 'ivylee', waiting: 'mits', mixed: 'onethreefive', unsure: 'mits' },
    focus: { pulled: 'rounds', calendar: 'calendar', stretch: 'deadline', unsure: 'calendar' },
    small: { quick: 'twominute', same: 'batch', crowd: 'bigfirst', unsure: 'batch' },
    'too-much': { sort: 'eisenhower', few: 'pareto', unsure: 'eisenhower' }
  };
  const followUp = { first: 'whatFirst', focus: 'whatFocus', small: 'whatSmall', 'too-much': 'whatMuch' };
  const unsureReason = {
    start: 'That’s OK. Start with the simplest one: pick the few things that matter most and do them first. If everything feels urgent, the Eisenhower Matrix can help you sort it.',
    first: 'Then start simple: pick up to three things that matter most, and do them first.',
    focus: 'Then start by giving the work a set time on your calendar, so it has somewhere to go.',
    small: 'Then start by grouping similar tasks, so they take one block instead of the whole day.',
    'too-much': 'Then start by sorting. The Eisenhower Matrix puts each task in one of four boxes.'
  };

  function route(a) {
    if (a.situation === 'scattered') return 'onelist';
    if (a.situation === 'unsure') return 'mits';
    const key = followUp[a.situation];
    if (!key || !a[key]) return null;
    return routes[a.situation][a[key]] || null;
  }

  function suggest(a) {
    const id = route(a);
    if (!id) return null;
    const m = find(id);
    // The handoff card already says what the Eisenhower Matrix does, so it needs no separate reason.
    let reason = m.handoff ? '' : m.why;
    if (a.situation === 'unsure') reason = unsureReason.start;
    else if (a[followUp[a.situation]] === 'unsure') reason = unsureReason[a.situation];
    return { id, reason };
  }

  const picker = SituationPicker.create({
    options: methods.map(m => ({ id: m.id, title: m.title, bestFor: m.bestFor, summary: m.handoff ? m.summary : '' })),
    suggest,
    questions: [
      { id: 'situation', type: 'choice', label: 'What’s going on with your time right now?',
        hint: 'Think about the last week or two.', options: [
          { value: 'first', label: 'I’m not sure what to work on first.' },
          { value: 'focus', label: 'I can’t get time to focus.' },
          { value: 'small', label: 'Small things keep piling up.' },
          { value: 'too-much', label: 'There’s too much, and I can’t see what matters.' },
          { value: 'scattered', label: 'My work is scattered across too many places, like lists, inboxes, notes and chats.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] },
      { id: 'whatFirst', type: 'choice', label: 'What happens most days?',
        showIf: a => a.situation === 'first', options: [
          { value: 'frog', label: 'I keep putting off one hard task.' },
          { value: 'tomorrow', label: 'I finish the day not sure where to start tomorrow.' },
          { value: 'waiting', label: 'The important things are still waiting at the end of the day.' },
          { value: 'mixed', label: 'My list mixes big and small things, and it never gets done.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] },
      { id: 'whatFocus', type: 'choice', label: 'What usually happens when you sit down to work?',
        showIf: a => a.situation === 'focus', options: [
          { value: 'pulled', label: 'I get pulled away after a few minutes, by messages, questions or other work.' },
          { value: 'calendar', label: 'There’s no open time on my calendar for it.' },
          { value: 'stretch', label: 'The task stretches to fill the whole day.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] },
      { id: 'whatSmall', type: 'choice', label: 'What kind of small things?',
        showIf: a => a.situation === 'small', options: [
          { value: 'quick', label: 'Quick things that take a minute or two, like a reply, a signature or a file to send.' },
          { value: 'same', label: 'The same kind of task, all through the day, like emails, calls or approvals.' },
          { value: 'crowd', label: 'Small things fill the day before the big ones get a turn.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] },
      { id: 'whatMuch', type: 'choice', label: 'What would help most right now?',
        showIf: a => a.situation === 'too-much', options: [
          { value: 'sort', label: 'Sorting what’s urgent from what’s important.' },
          { value: 'few', label: 'Finding the few things that make the most difference.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] }
    ]
  });

  // The group the choices come from: the suggestion's group, so "Other ways to try this" stays on topic.
  const groupOf = a => { const s = suggest(a); return s ? find(s.id).group : null; };
  const chosen = a => find(a.method);

  function link(label, href) {
    const n = el('a', 'btn primary', label);
    n.href = href;
    return n;
  }

  // Step 2: the suggestion and why it fits, then the methods in the same group to choose from.
  const methodField = {
    id: 'method',
    type: 'custom',
    render(wrap, api) {
      const a = api.answers;
      const s = suggest(a);
      if (!s) { wrap.append(el('p', 'planner-note', 'Answer the questions in step 1 to see a suggestion.')); return; }
      if (!a.method || !a.methodPicked || find(a.method).group !== find(s.id).group) {
        a.method = s.id;
        a.methodPicked = false;
      }
      const sm = find(s.id);
      const card = picker.card(picker.find(s.id), s.reason, 'Suggested', a, 3);
      if (sm.handoff) {
        const go = el('p', 'picker-actions');
        go.append(link('Open the Eisenhower Matrix', sm.href));
        card.append(go);
      }
      wrap.append(card);
      const group = methods.filter(m => m.group === sm.group);
      if (group.length < 2) return;
      const set = el('fieldset', 'picker-choice');
      set.append(el('legend', null, 'Which one will you try?'));
      const choices = el('div', 'guide-options picker-options');
      const err = api.errorSlot('err-method');
      group.forEach((m, i) => {
        const lab = el('label');
        const input = el('input');
        input.type = 'radio';
        input.name = 'method';
        input.value = m.id;
        input.id = 'method-' + i;
        input.checked = a.method === m.id;
        input.setAttribute('aria-describedby', 'err-method');
        input.addEventListener('change', () => {
          a.methodPicked = m.id !== s.id;
          err.hidden = true;
          api.set('method', m.id);
        });
        const label = el('span', 'picker-option');
        const t = el('span', 'picker-option-title', m.title);
        if (m.id === s.id) t.append(' ', el('span', 'tag', 'Suggested'));
        label.append(t, el('span', 'picker-option-detail', m.bestFor));
        lab.append(input, label);
        choices.append(lab);
      });
      set.append(choices, err);
      wrap.append(set);
    },
    validate(a) {
      if (!a.method) return [{ errorId: 'err-method', focusId: 'method-0', message: 'Choose one to continue.' }];
      if (find(a.method).handoff) {
        return [{ errorId: 'err-method', focusId: 'method-0',
          message: 'The Eisenhower Matrix is its own tool. Open it above, or choose The few that matter most to plan a week here.' }];
      }
      return [];
    }
  };

  // Dates: the start date as typed (YYYY-MM-DD), read as a local date, and a week later.
  function parseDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text(value));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  const fmt = d => d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  function lookBack(a) {
    const d = parseDate(a.start);
    if (!d) return 'Look back a week from when you start.';
    const later = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    return 'Look back on ' + fmt(later) + '.';
  }

  const steps = [
    {
      id: 'situation',
      title: 'What’s going on',
      intro: 'One or two questions. Your answers suggest a method, and you can choose another in the next step.',
      fields: picker.questions
    },
    {
      id: 'method',
      title: 'Your method',
      intro: 'Here’s the method that fits your answers, and why.',
      fields: [methodField]
    },
    {
      id: 'week',
      title: 'Your week',
      intro: 'All optional. A few words make the plan yours.',
      fields: [
        { id: 'tryOn', type: 'text', optional: true, maxlength: 120, label: 'What will you try it on?',
          hint: 'A task, a project, or your whole week.' },
        { id: 'start', type: 'date', optional: true, label: 'When will you start?', note: a => (parseDate(a.start) ? lookBack(a) : '') },
        { id: 'obstacle', type: 'textarea', optional: true, maxlength: 400,
          label: 'What might get in the way, and what will you do if it does?' }
      ]
    }
  ];

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
  function list(items, tag) {
    const n = el(tag || 'ul');
    items.forEach(t => n.append(el('li', null, t)));
    return n;
  }

  function renderResult(container, a, api) {
    const m = chosen(a);
    const s = suggest(a);
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your plan'), el('h2', null, 'Your week plan'),
      el('p', null, 'Use Edit to change any part, then print it or save it as a PDF to keep.'));
    container.append(head);

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

    const plan = el('article', 'brief');
    plan.setAttribute('aria-label', 'Week plan');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    const meta = [];
    if (text(a.tryOn)) meta.push('Trying it on: ' + text(a.tryOn));
    const d = parseDate(a.start);
    if (d) meta.push('Starting ' + fmt(d));
    titleWrap.append(el('p', 'eyebrow', 'Week plan'), el('h3', 'brief-title', 'Your week: ' + m.title));
    if (meta.length) titleWrap.append(el('p', 'brief-meta', meta.join(' · ')));
    const editTop = el('button', 'btn brief-edit no-print', 'Edit');
    editTop.type = 'button';
    editTop.setAttribute('aria-label', 'Edit what you’ll try it on and when you’ll start');
    editTop.addEventListener('click', () => api.goTo(2));
    top.append(titleWrap, editTop);
    plan.append(brand, top, el('p', 'brief-habit', HABIT));

    const why = section('Why this one', 1, api, 'your method');
    why.append(el('p', null, s && s.id === m.id ? s.reason : m.why));
    plan.append(why);

    const tryIt = section('Try it for a week', null);
    tryIt.append(list(m.steps, 'ol'));
    plan.append(tryIt);

    if (text(a.obstacle)) {
      const ob = section('If something gets in the way', 2, api, 'what might get in the way');
      ob.append(el('p', 'brief-text', text(a.obstacle)));
      plan.append(ob);
    }

    const back = section('At the end of the week', 2, api, 'your start date');
    back.append(el('p', null, lookBack(a)), el('p', null, m.notice));
    plan.append(back);

    const others = methods.filter(o => o.group === m.group && o.id !== m.id);
    if (others.length) {
      const o = section('Other ways to try this', null);
      const ul = el('ul');
      others.forEach(x => {
        const li = el('li');
        li.append(el('strong', null, x.title + '. '), x.bestFor);
        ul.append(li);
      });
      o.append(ul);
      plan.append(o);
    }

    const notes = el('section', 'brief-section');
    notes.append(el('h3', null, 'Notes'));
    notes.append(el('p', 'small no-print', 'Space to write on the printout.'));
    const ruled = el('div', 'brief-lines');
    ruled.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) ruled.append(el('div'));
    notes.append(ruled);
    const end = el('div', 'brief-end');
    end.append(notes);
    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'Made with the Pivot Labs Time Method Picker · ' +
      new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })));
    end.append(foot);
    plan.append(end);
    container.append(plan);
  }

  function initialAnswers() {
    return { situation: '', whatFirst: '', whatFocus: '', whatSmall: '', whatMuch: '',
      method: '', methodPicked: false, tryOn: '', start: '', obstacle: '' };
  }
  const blankAnswers = JSON.stringify(initialAnswers());
  const isDirty = a => JSON.stringify(a) !== blankAnswers;

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your plan', finishLabel: 'See my week plan',
    // Exposed for testing the suggestion logic.
    suggest, route, methods, lookBack };
})();
