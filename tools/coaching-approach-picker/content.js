'use strict';
/*
  Coaching Approach Picker content: the situation questions, the seven approaches,
  each approach's prompts, and the coaching plan.
  Shared engines: assets/js/guided-planner.js (the steps) and
  assets/js/situation-picker.js (the situation questions and the suggested approach).

  Answers describe the situation, never the person. Only questions 1 and 2 decide the
  approach, so the same answers always suggest the same approach, whoever the person is.
  Question 3 changes wording only. The plan is written for the leader, not to hand to the person.
*/
const CoachingPlanner = (() => {
  const el = GuidedPlanner.el;
  const text = value => (value || '').trim();
  const who = a => text(a.person) || 'this person';
  const Who = a => { const n = who(a); return n.charAt(0).toUpperCase() + n.slice(1); };
  const whose = a => who(a) + '’s';
  const lines = value => text(value).split('\n').map(s => s.trim()).filter(Boolean);
  const resolve = (value, a) => (typeof value === 'function' ? value(a) : value);

  // The seven approaches, from most asking to most telling.
  const approaches = [
    { id: 'goal', title: 'Find the goal',
      summary: 'Help them work out what they want to grow toward, then pick one first step.',
      bestFor: 'Best when they want to grow and the goal isn’t clear yet.' },
    { id: 'working', title: 'Build on what’s working',
      summary: 'Look at times it went a little better, and build the next step from there.',
      bestFor: 'Best when they’re stuck on something.' },
    { id: 'weigh', title: 'Weigh the options',
      summary: 'Lay out the choices, what each one gains and costs, and what matters most to them.',
      bestFor: 'Best when they have a decision to make.' },
    { id: 'action', title: 'Turn it into action',
      summary: 'Agree on a first step, a date, and how they’ll know it’s done, in their words.',
      bestFor: 'Best when they know what they want to change and need to get started.' },
    { id: 'reconnect', title: 'Reconnect with the work',
      summary: 'Say what you’ve noticed, ask what’s changed, and listen before you suggest anything.',
      bestFor: 'Best when someone doesn’t seem as engaged as usual.' },
    { id: 'share', title: 'Share what you’ve learned',
      summary: 'Ask what they want to know, share your experience as stories rather than instructions, and let them decide what fits.',
      bestFor: 'Best when they’ve asked how you or others handled something like this.' },
    { id: 'direct', title: 'Start with clear direction',
      summary: 'Explain what good looks like and the first steps, then shift to asking as they find their feet.',
      bestFor: 'Best when the work is new to them or something needs to change soon.' }
  ];
  const coachingIds = ['goal', 'working', 'weigh', 'action'];
  const isCoaching = a => coachingIds.includes(a.approach);

  // Question 2 decides coach, mentor, or give direction. Question 1 then picks the coaching approach.
  // Nothing about the person changes the result.
  const byFocus = { goal: 'goal', stuck: 'working', decide: 'weigh', start: 'action', unsure: 'goal' };
  function route(a) {
    if (a.focus === 'reengage') return 'reconnect';
    if (!byFocus[a.focus] || !a.need) return null;
    if (a.need === 'experience') return 'share';
    if (a.need === 'direction') return 'direct';
    return byFocus[a.focus];
  }

  function suggest(a) {
    const id = route(a);
    if (!id || (id !== 'reconnect' && !a.whose)) return null;
    const name = who(a);
    const Name = Who(a);
    const base = {
      goal: a.focus === 'unsure'
        ? 'When you’re not sure what the conversation is about, start by asking what ' + name + ' wants from it. That’s where this approach begins.'
        : 'The goal isn’t clear yet, so start there. Once ' + name + ' can say what they want, the next step is easier to find.',
      working: Name + ' is stuck. Asking about times it went a little better finds what already works, which is often faster than digging into what’s wrong.',
      weigh: 'The decision is ' + whose(a) + ' to make. Laying out what each choice gains and costs, for them and for others, helps them choose without you choosing for them.',
      action: Name + ' already knows what they want to change. A small first step with a date, in their own words, makes it easier to start.',
      reconnect: 'Something may have changed: workload, clarity, interest, or something you don’t know about. Asking and listening come before any fix.',
      share: Name + ' asked for your experience. Share it as what happened to you, not what they should do, and let them decide what fits. If you haven’t faced this yourself, help them find someone who has.',
      direct: 'Questions can feel like a test when the work is new or time is short. Be clear about what good looks like, then ask more as they find their feet.'
    }[id];
    const askFirst = a.need === 'unsure' && id !== 'reconnect'
      ? ' Start by asking what would help most: room to think, your experience, or clear direction. Be ready to switch if they want something else.' : '';
    const invite = a.whose === 'mine' && id !== 'direct' && id !== 'reconnect'
      ? ' Since this is your idea, ask whether they’d like to talk it through, and accept a no.' : '';
    return { id, reason: base + askFirst + invite };
  }

  const picker = SituationPicker.create({
    options: approaches,
    suggest,
    questions: [
      { id: 'focus', type: 'choice', label: a => 'What would this conversation help ' + who(a) + ' with?',
        hint: 'Choose what’s closest.', options: [
          { value: 'goal', label: 'Growing, when the goal isn’t clear yet.' },
          { value: 'stuck', label: 'Getting unstuck on something they’re working on.' },
          { value: 'decide', label: 'Thinking through a decision they need to make.' },
          { value: 'start', label: 'Getting started on a change they’ve already chosen.' },
          { value: 'reengage', label: 'Getting their energy back for their work. They don’t seem as engaged as usual.' },
          { value: 'unsure', label: 'I’m not sure yet.' }
        ] },
      { id: 'need', type: 'choice', label: a => 'What does ' + who(a) + ' need from you right now?',
        hint: 'Go by what they’ve asked for or what has helped before, not a guess about them.',
        showIf: a => a.focus !== 'reengage', options: [
          { value: 'think', label: 'Room to think it through and reach their own answer.' },
          { value: 'experience', label: 'Your experience. They’ve asked how you, or others, handled something like this.' },
          { value: 'direction', label: 'Clear direction. The work is new to them, or something needs to change soon.' },
          { value: 'unsure', label: 'I’m not sure. I’ll ask them.' }
        ] },
      { id: 'whose', type: 'choice', label: 'Whose idea is this conversation?',
        showIf: a => a.focus !== 'reengage', options: [
          { value: 'theirs', label: a => Who(a) + ' asked for help or brought it up.' },
          { value: 'mine', label: 'Mine. I’ll invite them to talk about it.' }
        ] }
    ]
  });
  const approach = a => picker.find(a.approach);
  const on = (...ids) => a => ids.includes(a.approach);

  // Step 4: every approach's prompts. Each prompt shows only for the approach that uses it.
  const openExample = {
    goal: 'I’d like to talk about where you want to grow over the next year.',
    working: 'You mentioned the Acme proposal is stuck. Want to think it through together?',
    weigh: 'You said you’re deciding whether to apply for the team lead role. Want to talk it through?',
    action: 'You’ve said you want to start leading client calls. Let’s find a first step.',
    reconnect: 'I wanted to check in. How are things going for you lately?',
    share: 'You asked how I handled my first client kickoff. Happy to share what I learned.',
    direct: 'You’re leading the kickoff next week. Let’s walk through what good looks like.'
  };
  const invites = a => a.whose === 'mine' && a.focus !== 'reengage' && !['direct', 'reconnect'].includes(a.approach);

  // The four coaching approaches share four parts. Each approach pre-fills its own questions
  // and marks the part to spend the most time on.
  const parts = [
    { key: 'want', title: 'What they want', hint: a => 'Questions that help ' + who(a) + ' say what they want from this.' },
    { key: 'now', title: 'Where things stand',
      hint: a => (a.approach === 'working' ? 'Questions about when it went better, and where things are now.' : 'Questions about what’s happening now and what they’ve tried.') },
    { key: 'options', title: 'Options', hint: 'Questions that open up more than one way forward.' },
    { key: 'next', title: 'Next step', hint: 'Questions that end with a step they choose.' }
  ];
  const focusPart = { goal: 'want', working: 'now', weigh: 'options', action: 'next' };
  const starterQuestions = {
    goal: {
      want: 'What would you like to be able to do a year from now?\nWhy does that matter to you?',
      now: 'What are you already doing that moves you toward it?',
      options: 'What are two or three ways you could start?',
      next: 'What’s one thing you’ll try before we talk again?'
    },
    working: {
      want: 'What would a good result look like?',
      now: 'When has this gone even a little better? What was different then?\nOn a scale of 1 to 10, where are things now, and what would one point higher look like?',
      options: 'What have you already tried, and what helped, even a little?',
      next: 'What small step could you take in the next few days?'
    },
    weigh: {
      want: 'What would a good outcome look like for you?',
      now: 'What do you know so far, and what’s still unclear?',
      options: 'What are the choices, including ones you’ve ruled out?\nFor each one: what would you gain, what would it cost, and how would it affect others?\nWhich would you feel best about a year from now?',
      next: 'What would help you decide, and by when?'
    },
    action: {
      want: 'What do you want to be different, and why now?',
      now: 'What’s gotten in the way so far?',
      options: 'What’s the smallest first step that would count?',
      next: 'What exactly will you do, and by when?\nHow will we both know it happened?\nWhat could get in the way, and what will you do if it does?\nHow would you like me to check in?'
    }
  };
  const partKey = (part, id) => part + '_' + id;
  const coachTips = a => [
    'Ask one question at a time, then wait. Silence often means they’re thinking.',
    'Before you move on, ask what else. The first answer is rarely the whole story.',
    'If you have an idea, ask for theirs first. Then offer yours as one option among theirs.'
  ].concat(a.approach === 'weigh' ? ['The decision is theirs. If you have a view, share it last.'] : []);

  const coachFields = [];
  coachingIds.forEach(id => parts.forEach(p => coachFields.push({
    id: partKey(p.key, id), type: 'textarea', maxlength: 1000, label: p.title,
    hint: a => (focusPart[id] === p.key ? 'Spend most of your time here. ' : '') + resolve(p.hint, a) + ' One question per line.',
    showIf: on(id),
    default: () => starterQuestions[id][p.key],
    error: 'Add at least one question for this part.'
  })));
  const tipsField = {
    id: 'coachTips', type: 'custom', showIf: isCoaching,
    render(wrap, api) {
      const box = el('div', 'coach-tips');
      box.append(el('p', 'coach-tips-title', 'As you ask'));
      const ul = el('ul');
      coachTips(api.answers).forEach(t => ul.append(el('li', null, t)));
      box.append(ul);
      wrap.append(box);
    }
  };

  // Re-engaging: possibilities to ask about, not conclusions. Each adds a question to the plan.
  const causes = [
    { value: 'workload', label: 'Workload', question: 'Is your workload manageable right now? What would need to move?' },
    { value: 'priorities', label: 'Unclear priorities', question: 'Is it clear what matters most right now, and why?' },
    { value: 'interest', label: 'Interest in the work', question: 'What part of your work do you enjoy most? What would make the rest more worth your effort?' },
    { value: 'growth', label: 'Room to grow', question: 'Is there something you’d like to be learning or doing more of?' },
    { value: 'recognition', label: 'Recognition', question: 'How do you feel about how your work is recognized?' },
    { value: 'unknown', label: 'I don’t know', question: 'What’s getting in the way?' }
  ];
  const personalLine = 'If they mention something personal or health-related, listen, and point them to support such as an employee assistance program or HR. You don’t need to solve it.';

  const planFields = [
    { id: 'open', type: 'textarea', label: 'How will you open?', maxlength: 600, error: 'Write how you’ll open the conversation.',
      hint: a => (invites(a) ? 'Say why you’re asking, and ask if they’d like to talk it through.' : 'Say why you want to talk.') +
        ' Example: ' + (openExample[a.approach] || openExample.goal) },
    ...coachFields,
    tipsField,
    { id: 'noticed', type: 'textarea', maxlength: 1000, showIf: on('reconnect'), label: 'What have you noticed?',
      hint: 'Describe what you’ve seen or heard, not a guess about why. Example: You’ve been quieter in team meetings the last few weeks, and you passed on the Q3 project.',
      after: 'Leave out words like checked out, unmotivated, or attitude. They describe a person, not what you saw.',
      error: 'Describe what you’ve noticed.' },
    { id: 'askReconnect', type: 'textarea', maxlength: 600, showIf: on('reconnect'), label: 'What will you ask first?',
      hint: 'One question per line.', default: () => 'How are things going for you lately?\nWhat’s changed for you?',
      error: 'Add at least one question to ask.' },
    { id: 'causes', type: 'multi', optional: true, showIf: on('reconnect'), label: 'What might be part of it?',
      hint: 'Possibilities to ask about, not conclusions. Each one you choose adds a question to your plan.',
      options: causes.map(c => ({ value: c.value, label: c.label })), after: personalLine },
    { id: 'offer', type: 'textarea', maxlength: 600, optional: true, showIf: on('reconnect'), label: 'What could you change or offer?',
      hint: 'Only what you can actually do. Example: Move the Q3 report to next month.' },
    { id: 'agree', type: 'text', maxlength: 300, showIf: on('reconnect'), label: 'What will you agree on before you finish?',
      default: () => 'One thing to try, and when we’ll talk again.', error: 'Write what you’ll agree on.' },
    { id: 'askShare', type: 'text', maxlength: 300, showIf: on('share'), label: 'What will you ask first?',
      default: () => 'What would be most useful to hear about?', error: 'Write a question to ask.' },
    { id: 'story', type: 'textarea', maxlength: 1500, showIf: on('share'), label: 'What experience could you share?',
      hint: 'A short story: what you faced, what you tried, what happened. Example: For my first kickoff, I over-prepared slides and under-prepared questions.',
      after: 'Include what didn’t work. Share what happened to you, not what they should do.',
      error: 'Describe the experience you’ll share.' },
    { id: 'others', type: 'text', maxlength: 300, optional: true, showIf: on('share'), label: 'Who else could they talk to?',
      hint: 'Someone who has faced this, especially if you haven’t. Example: Priya, who ran the last two kickoffs' },
    { id: 'askEnd', type: 'text', maxlength: 300, showIf: on('share'), label: 'What will you ask at the end?',
      default: () => 'What will you take from this, and what doesn’t fit for you?', error: 'Write a question to ask.' },
    { id: 'good', type: 'textarea', maxlength: 1000, showIf: on('direct'), label: 'What does good look like?',
      hint: 'Specific and visible. Example: The agenda goes to the client two days ahead, and the call ends with agreed next steps.',
      error: 'Describe what good looks like.' },
    { id: 'firstSteps', type: 'textarea', maxlength: 1000, showIf: on('direct'), label: 'What are the first steps?',
      hint: 'Example: Draft the agenda by Monday, and we’ll review it together Tuesday.', error: 'Describe the first steps.' },
    { id: 'supportDirect', type: 'textarea', maxlength: 1000, showIf: on('direct'), label: 'What support will you give, and when will you check in?',
      hint: 'Example: I’ll join the first call, and we’ll debrief after.', error: 'Describe your support and check-ins.' },
    { id: 'checkClear', type: 'text', maxlength: 300, showIf: on('direct'), label: 'How will you check they’re clear?',
      default: () => 'How would you go about it?',
      after: 'Hearing it back in their words checks that you were clear. “Any questions?” usually gets a no.',
      error: 'Write a question to ask.' },
    { id: 'shift', type: 'text', maxlength: 200, optional: true, showIf: on('direct'), label: 'When will you start asking more and telling less?',
      hint: 'Example: After the first two kickoffs' }
  ];

  // Step 5: how much to ask and tell (adapted from slide 61's idea of two separate dials), the check-in, and a self-check.
  const balanceOptions = [
    { value: 'ask', label: 'Mostly ask. I’ll share a view only if they ask for it.' },
    { value: 'askFirst', label: 'Ask first, then offer what I know as one idea among theirs.' },
    { value: 'tell', label: 'Mostly tell. They need what I know.' }
  ];
  function balanceNote(a) {
    if (a.balance === 'askFirst') return 'A good balance for most conversations. Ask what they make of your idea, too.';
    if (a.balance === 'ask' && a.approach === 'direct') return 'With new work, too many questions can feel like a test. Explain first, then ask them to say it back.';
    if (a.balance === 'tell' && isCoaching(a)) return 'That’s closer to giving direction. If that’s what they need, Start with clear direction may fit better.';
    if (a.balance === 'tell' && a.approach === 'reconnect') return 'Re-engaging starts with listening. Hold your view until you understand what’s changed.';
    return '';
  }

  const checkIn = {
    goal: 'about two weeks, after they’ve tried the first step',
    working: 'within a week',
    weigh: 'on or after the date they set to decide',
    action: 'on the date they set, the way they asked you to',
    reconnect: 'within two weeks, even if nothing seems to have changed',
    direct: 'after the first step, then less often as they find their feet'
  };
  const shareCheckIn = 'Ask if they’d like to talk again. They set the pace.';
  const followNote = a => (a.approach === 'share' ? 'Suggested: ' + shareCheckIn.charAt(0).toLowerCase() + shareCheckIn.slice(1)
    : checkIn[a.approach] ? 'Suggested: check in ' + checkIn[a.approach] + '.' : '');

  // Before you talk: traps adapted from Amy Gibson's "How to Coach Your Team," plus a fairness check.
  const coachChecks = [
    { value: 'ready', label: 'I’m ready to let them find the answer, even if I have one in mind.', reminder: 'Decide to hold your own answer until they’ve shared theirs.' },
    { value: 'open', label: 'My questions are open, not suggestions phrased as questions.', reminder: 'Reread your questions. Rewrite any that start with “Don’t you think” or “Have you tried.”' },
    { value: 'silence', label: 'I’ll leave room for silence.', reminder: 'Plan to count to five before you fill a pause.' },
    { value: 'rush', label: 'I won’t rush to a fix before we understand where things stand.', reminder: 'Give “where things stand” its full time before you talk about options.' },
    { value: 'listen', label: 'I plan to listen more than I talk.', reminder: 'Aim to talk less than half the time.' },
    { value: 'same', label: 'I’d offer this kind of conversation to anyone on the team in this situation.', reminder: 'Think about who else on the team could use this kind of conversation.' }
  ];
  const checks = {
    checksCoach: coachChecks,
    checksCoachInvite: coachChecks.concat([
      { value: 'acceptNo', label: 'If they’d rather not talk about it now, I’ll accept that.', reminder: 'Decide now that “not now” is a fine answer.' }
    ]),
    checksReconnect: [
      { value: 'noticed', label: 'I’ll describe what I’ve noticed, not guess at why.', reminder: 'Reread what you noticed, and take out any guesses about why.' },
      { value: 'askFirst', label: 'I’ll ask before I suggest anything.', reminder: 'Plan to ask and listen before you offer any fix.' },
      { value: 'part', label: 'I’ve thought about my part, such as workload, unclear priorities, or recognition.', reminder: 'Check whether workload, priorities, or recognition played a part, and be ready to own your share.' },
      { value: 'support', label: 'I know where to point them if something personal comes up.', reminder: 'Find out what support your organization offers, such as an employee assistance program or HR.' },
      { value: 'same', label: 'I’d have this conversation with anyone on the team who seemed less engaged.', reminder: 'Ask yourself whether you’d check in the same way with anyone on the team.' }
    ],
    checksShare: [
      { value: 'askFirst', label: 'I’ll ask what they want to know before I share.', reminder: 'Start with a question, not a story.' },
      { value: 'story', label: 'I’ll share what happened to me, not what they should do.', reminder: 'Reread your story, and swap any “you should” for what you did.' },
      { value: 'honest', label: 'I’ll be honest about what didn’t work, too.', reminder: 'Add one thing that didn’t go well, and what you learned.' },
      { value: 'same', label: 'I’d make this time for anyone on the team who asked.', reminder: 'Think about who else on the team might want this kind of time and hasn’t asked.' }
    ],
    checksDirect: [
      { value: 'good', label: 'I can describe what good looks like in a sentence or two.', reminder: 'Shorten what good looks like to one or two sentences.' },
      { value: 'sayBack', label: 'I’ll ask them to say the plan back in their own words.', reminder: 'Plan to ask them to say it back, instead of “Any questions?”' },
      { value: 'same', label: 'I’d give the same direction to anyone new to this work.', reminder: 'Ask yourself whether you’d give anyone new to this work the same direction.' },
      { value: 'shift', label: 'I know when I’ll start asking more and telling less.', reminder: 'Pick a point when you’ll start asking more.' }
    ]
  };
  function checkKeyFor(a) {
    if (isCoaching(a)) return invites(a) ? 'checksCoachInvite' : 'checksCoach';
    return { reconnect: 'checksReconnect', share: 'checksShare', direct: 'checksDirect' }[a.approach] || 'checksCoach';
  }
  function checklist(a) {
    const key = checkKeyFor(a);
    return checks[key].map(c => ({ label: c.label, done: (a[key] || []).includes(c.value), reminder: c.reminder }));
  }

  // The plan
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
  function pairs(list) {
    const dl = el('dl');
    list.forEach(([term, value]) => { if (text(value)) dl.append(el('dt', null, term), el('dd', null, text(value))); });
    return dl;
  }
  function list(items, cls) {
    const ul = el('ul', cls);
    items.forEach(t => ul.append(el('li', null, t)));
    return ul;
  }

  const credit = {
    goal: 'The four parts draw on the GROW™ model, Sir John Whitmore and colleagues.',
    working: 'The four parts draw on the GROW™ model; the questions draw on the solution-focused approach of Steve de Shazer and Insoo Kim Berg.',
    weigh: 'The four parts draw on the GROW™ model; weighing gains and costs draws on Irving Janis and Leon Mann’s decisional balance sheet.',
    action: 'The four parts draw on the GROW™ model and Peter Hawkins’s CLEAR model.',
    reconnect: 'Draws on Max Landsberg’s Skill/Will Matrix.',
    share: 'Adapted from Amy Gibson’s coaching, mentoring, and managing infographic.',
    direct: 'Adapted from Amy Gibson’s coaching, mentoring, and managing infographic.'
  };

  function middle(plan, a, api) {
    const name = who(a);
    if (isCoaching(a)) {
      const s = section('Questions to ask', 3, api, 'your questions');
      parts.forEach(p => {
        const h = el('h4', null, p.title);
        if (focusPart[a.approach] === p.key) h.append(' ', el('span', 'tag', 'Most time'));
        s.append(h, list(lines(a[partKey(p.key, a.approach)])));
      });
      s.append(el('h4', null, 'As you ask'), list(coachTips(a)));
      plan.append(s);
      return;
    }
    if (a.approach === 'reconnect') {
      const n = section('What you’ve noticed', 3, api, 'what you’ve noticed');
      n.append(el('p', 'brief-text', text(a.noticed)));
      plan.append(n);
      const q = section('Questions to ask', 3, api, 'your questions');
      const asked = lines(a.askReconnect).concat(causes.filter(c => (a.causes || []).includes(c.value)).map(c => c.question));
      q.append(list(asked), el('p', null, personalLine));
      plan.append(q);
      const g = section('What to agree on', 3, api, 'what you’ll agree on');
      g.append(pairs([['What you could change or offer', a.offer], ['What you’ll agree on', a.agree]]));
      plan.append(g);
      return;
    }
    if (a.approach === 'share') {
      const s = section('The conversation', 3, api, 'the conversation');
      s.append(pairs([['Ask first', a.askShare], ['What you’ll share', a.story],
        ['Who else ' + name + ' could talk to', a.others], ['Ask at the end', a.askEnd]]));
      plan.append(s);
      return;
    }
    if (a.approach === 'direct') {
      const s = section('The direction', 3, api, 'the direction');
      s.append(pairs([['What good looks like', a.good], ['First steps', a.firstSteps], ['Support and check-ins', a.supportDirect],
        ['To check they’re clear, ask', a.checkClear], ['When you’ll ask more and tell less', a.shift]]));
      // Handing off new work is the natural next step. On screen only. Opens in a new tab and carries no names or text.
      const tip = el('p', 'small no-print');
      const link = el('a', null, 'plan the details with the Delegation Planner (opens in a new tab)');
      link.href = '../delegation-planner/index.html';
      link.target = '_blank';
      link.rel = 'noopener';
      tip.append('If you’re handing off this work, ', link, '.');
      s.append(tip);
      plan.append(s);
    }
  }

  function renderResult(container, a, api) {
    const ap = approach(a);
    const name = who(a);
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your plan'), el('h2', null, 'Your coaching plan'),
      el('p', null, 'This plan is for you, not to hand to ' + name + '. Use Edit to change any section, then print it or save it as a PDF to bring with you.'));
    container.append(head);

    const items = checklist(a);
    const open = items.filter(i => !i.done);
    if (open.length) {
      const box = el('section', 'prep-notes no-print');
      box.setAttribute('aria-labelledby', 'reminders-title');
      const h = el('h3', null, 'Before you talk');
      h.id = 'reminders-title';
      box.append(h, list(open.map(i => i.reminder)), el('p', 'small', 'These come from the checklist in step 5. Your printed plan shows the full checklist.'));
      container.append(box);
    }

    const actions = el('div', 'result-actions no-print');
    const print = el('button', 'btn primary', 'Print plan');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    const editAll = el('button', 'btn', 'Edit my answers');
    editAll.type = 'button';
    editAll.addEventListener('click', () => api.goTo(4));
    const again = el('button', 'btn', 'Start a new plan');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    actions.append(print, editAll, again);
    container.append(actions,
      el('p', 'small no-print', 'Printed plans include the names and notes you entered. Keep yours private. In the print window, choose “Save as PDF” to keep a digital copy, and turn off browser headers and footers for a cleaner page.'));

    const plan = el('article', 'brief');
    plan.setAttribute('aria-label', 'Coaching plan');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    const meta = ['With ' + name, text(a.when) || 'Time to set', ap ? ap.title : ''].filter(Boolean);
    titleWrap.append(el('p', 'eyebrow', 'Coaching plan'), el('h3', 'brief-title', text(a.topic)), el('p', 'brief-meta', meta.join(' · ')));
    const editTop = el('button', 'btn brief-edit no-print', 'Edit');
    editTop.type = 'button';
    editTop.setAttribute('aria-label', 'Edit the person, topic, and time');
    editTop.addEventListener('click', () => api.goTo(0));
    top.append(titleWrap, editTop);
    plan.append(brand, top);

    if (ap) {
      const s = section('Your approach', 2, api, 'your approach');
      const p = el('p');
      p.append(el('strong', null, ap.title + '. '), ap.summary);
      s.append(p);
      plan.append(s);
    }

    const opening = section('How to open', 3, api, 'how you’ll open');
    opening.append(el('p', 'brief-text', text(a.open)));
    plan.append(opening);

    middle(plan, a, api);

    const choice = balanceOptions.find(b => b.value === a.balance);
    if (choice) {
      const b = section('How much you’ll ask and tell', 4, api, 'how much you’ll ask and tell');
      b.append(el('p', null, choice.label));
      if (balanceNote(a)) b.append(el('p', null, balanceNote(a)));
      plan.append(b);
    }

    const after = section('After the conversation', 4, api, 'your check-in');
    const planned = text(a.followUp);
    if (a.approach === 'share') after.append(el('p', null, planned ? 'Check in: ' + planned + '.' : shareCheckIn));
    else after.append(el('p', null, 'Check in: ' + (planned || checkIn[a.approach] || 'when you agree') + '.'));
    if (a.approach === 'direct') after.append(el('p', null, 'Before you finish, ask ' + name + ' to say the plan back in their own words.'));
    else if (a.approach !== 'share') after.append(el('p', null, 'Before you finish, ask ' + name + ' to say their next step in their own words.'));
    plan.append(after);

    const before = section('Before you talk', 4, api, 'your checklist');
    const ul = el('ul', 'check-list');
    items.forEach(i => {
      const li = el('li', i.done ? 'is-checked' : null);
      li.append(el('span', 'visually-hidden', i.done ? 'Done: ' : 'Not yet: '), i.label);
      ul.append(li);
    });
    before.append(ul);
    plan.append(before);

    const notes = el('section', 'brief-section');
    notes.append(el('h3', null, 'Notes'));
    notes.append(el('p', 'small no-print', 'Space to write on the printout.'));
    const ruled = el('div', 'brief-lines');
    ruled.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) ruled.append(el('div'));
    notes.append(ruled);
    // Notes and the footer stay together on paper, so the footer never prints alone.
    const end = el('div', 'brief-end');
    end.append(notes);
    plan.append(end);

    const closing = {
      share: 'This plan is a starting point. Follow the conversation where it goes, and let ' + name + ' decide what fits.',
      direct: 'This plan is a starting point. Bring it as notes, not a script, and change course if you learn something new.'
    }[a.approach] || 'This plan is a starting point. Follow the conversation where it goes, and let ' + name + ' own their answers.';
    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, closing));
    foot.append(el('p', null, 'Made with the Pivot Labs Coaching Approach Picker · ' +
      new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) + (credit[a.approach] ? ' · ' + credit[a.approach] : '')));
    end.append(foot);
    container.append(plan);
  }

  const steps = [
    {
      id: 'conversation',
      title: 'The conversation',
      intro: 'Start with the person and the topic.',
      fields: [
        { id: 'person', type: 'text', label: 'Who is this conversation with?', hint: 'First name or initials. Example: Sam', maxlength: 60,
          error: 'Enter a first name or initials.' },
        { id: 'topic', type: 'text', label: 'What’s it about?', hint: 'A few words. Example: Leading client kickoffs', maxlength: 120,
          error: 'Enter a few words about the topic.' },
        { id: 'when', type: 'text', label: 'When will you talk?', optional: true, hint: 'Example: Thursday’s one-on-one', maxlength: 120 }
      ]
    },
    {
      id: 'situation',
      title: 'The situation',
      intro: 'A few questions to suggest an approach. You can choose a different one in the next step.',
      fields: picker.questions
    },
    {
      id: 'approach',
      title: 'Your approach',
      intro: 'Here’s the approach that fits your answers, and why. Choose another if it fits better.',
      fields: [picker.field({
        id: 'approach', pickedKey: 'approachPicked', eyebrow: 'Suggested approach',
        legend: 'Which approach will you use?', error: 'Choose an approach to continue.',
        missing: 'Answer the questions in step 2 to see a suggested approach.',
        choiceNote: chosen => 'You chose ' + chosen.title + '. The next step follows your choice.'
      })]
    },
    {
      id: 'plan',
      title: a => (approach(a) ? approach(a).title : 'Your questions'),
      intro: a => ({
        goal: 'Plan the questions you’ll ask. Spend most of your time on what they want.',
        working: 'Plan the questions you’ll ask. Spend most of your time on when things went better.',
        weigh: 'Plan the questions you’ll ask. Spend most of your time on the options.',
        action: 'Plan the questions you’ll ask. Spend most of your time on the next step.',
        reconnect: 'Describe what you’ve noticed, then plan what you’ll ask. Listen before you suggest anything.',
        share: 'Plan what you’ll ask and what you’ll share. Let ' + who(a) + ' decide what fits.',
        direct: 'Be clear about what good looks like, then check that you were clear.'
      })[a.approach] || 'Plan what you’ll ask.',
      fields: planFields
    },
    {
      id: 'coach',
      title: 'How you’ll coach',
      intro: 'Plan how much you’ll ask and tell, and when you’ll check in. Then check yourself before you talk.',
      fields: [
        { id: 'balance', type: 'choice', optional: true, label: 'How much will you ask, and how much will you tell?',
          hint: 'Asking helps them think. Telling shares what you know. Most coaching leans toward asking.',
          note: balanceNote, options: balanceOptions },
        { id: 'followUp', type: 'text', optional: true, maxlength: 200, label: 'When will you check in?',
          hint: 'Example: Thursday’s one-on-one in two weeks', note: followNote },
        ...Object.keys(checks).map(key => ({
          id: key, type: 'multi', optional: true, label: 'Before you talk, check what’s true.',
          hint: 'Anything unchecked becomes a reminder in your plan.',
          showIf: a => checkKeyFor(a) === key,
          options: checks[key].map(c => ({ value: c.value, label: c.label }))
        }))
      ]
    }
  ];

  function initialAnswers() {
    const answers = {
      person: '', topic: '', when: '',
      focus: '', need: '', whose: '', approach: '', approachPicked: false,
      open: '',
      noticed: '', askReconnect: '', causes: [], offer: '', agree: '',
      askShare: '', story: '', others: '', askEnd: '',
      good: '', firstSteps: '', supportDirect: '', checkClear: '', shift: '',
      balance: '', followUp: ''
    };
    coachFields.forEach(f => { answers[f.id] = ''; });
    Object.keys(checks).forEach(k => { answers[k] = []; });
    return answers;
  }
  const blankAnswers = JSON.stringify(initialAnswers());
  const isDirty = a => JSON.stringify(a) !== blankAnswers;

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your plan', finishLabel: 'Review my plan',
    // Exposed for testing the suggestion logic.
    suggest, route, approaches, checklist, checkKeyFor, followNote, balanceNote };
})();
