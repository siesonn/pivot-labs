'use strict';
/*
  Feedback Conversation Planner content: the situation questions, the six approaches,
  each approach's prompts, and the conversation plan.
  Shared engines: assets/js/guided-planner.js (the steps) and
  assets/js/situation-picker.js (the situation questions and the suggested approach).

  Every prompt asks for actions and their effect, not a judgment of the person.
  The same answers always suggest the same approach, whoever the person is.
  The plan is written for the leader, not to hand to the person.
*/
const FeedbackPlanner = (() => {
  const el = GuidedPlanner.el;
  const who = a => (a.person || '').trim() || 'this person';
  const whose = a => who(a) + '’s';
  const text = value => (value || '').trim();

  // The six approaches, in the order they're listed: positive first, then a change from least to most direct.
  const approaches = [
    { id: 'recognize', title: 'Recognize what’s working',
      summary: 'Name what they did and the difference it made, so they know what to keep doing.',
      bestFor: 'Best when they did something you want to see more of.' },
    { id: 'ahead', title: 'Look ahead',
      summary: 'Agree on one thing to work toward, and trade ideas for the next chance to try it.',
      bestFor: 'Best for growth, when nothing needs fixing.' },
    { id: 'view', title: 'Get their view first',
      summary: 'Share what you’ve heard in neutral terms, ask what happened, and listen before you decide on any feedback.',
      bestFor: 'Best when you heard about it but didn’t see it yourself.' },
    { id: 'describe', title: 'Describe and agree',
      summary: 'Describe what happened and its effect, hear their view, and agree on one next step.',
      bestFor: 'Best for the first conversation about something to change.' },
    { id: 'pattern', title: 'Name the pattern',
      summary: 'Link this moment to your earlier conversation, ask what’s getting in the way, and solve it together.',
      bestFor: 'Best when you’ve raised it once and it has happened again.' },
    { id: 'expect', title: 'Set a clear expectation',
      summary: 'Review what you’ve discussed, then say what needs to change, by when, and what happens if it continues.',
      bestFor: 'Best when you’ve raised it more than once and it’s still happening.' }
  ];
  const changeApproaches = ['view', 'describe', 'pattern', 'expect'];
  const isChange = a => a.about === 'change' || a.about === 'both';

  // Answers lead to one suggestion. Nothing about the person changes it.
  function suggest(a) {
    const name = who(a);
    if (a.about === 'keep') return { id: 'recognize', reason: 'You want ' + name + ' to keep doing something. Specific recognition shows exactly what to repeat. “Great job” doesn’t.' };
    if (a.about === 'grow') return { id: 'ahead', reason: 'Nothing needs fixing, so focus on what’s next. Ideas for the future are easier to take in than a review of the past.' };
    if (!isChange(a) || !a.source) return null;
    const cushion = a.about === 'both' ? ' Keep what’s working as its own point, so it doesn’t sound like a cushion for the change.' : '';
    if (a.source === 'told') return { id: 'view', reason: 'You didn’t see this yourself. Ask what happened before you decide whether there’s feedback to give.' + cushion };
    switch (a.history) {
      case 'first': return { id: 'describe', reason: 'This is the first time you’re raising it. Describe one moment, hear ' + whose(a) + ' view, and agree on what happens next.' + cushion };
      case 'noticed': return { id: 'describe', reason: 'This has happened before, but ' + name + ' hasn’t heard it from you. Treat it as a first conversation, and say you’ve noticed it before.' + cushion };
      case 'once': return { id: 'pattern', reason: 'You’ve raised this once already. Linking the two moments helps ' + name + ' see the pattern. Asking what’s getting in the way helps you solve it together.' + cushion };
      case 'more': return { id: 'expect', reason: 'You’ve raised this more than once and it’s still happening. Be clear about what needs to change, by when, what support you’ll give, and what happens if it continues.' +
        (a.about === 'both' ? ' Save what’s working for a separate conversation, so the expectation stays clear.' : '') };
      default: return null;
    }
  }

  const picker = SituationPicker.create({
    options: approaches,
    suggest,
    questions: [
      { id: 'about', type: 'choice', label: 'What is this feedback about?', options: [
        { value: 'keep', label: a => 'Something ' + who(a) + ' did well that you want to see more of.' },
        { value: 'change', label: 'Something that needs to change.' },
        { value: 'both', label: 'Both: something that went well and something to change.' },
        { value: 'grow', label: a => 'Helping ' + who(a) + ' grow toward a goal. Nothing needs fixing.' }
      ] },
      { id: 'source', type: 'choice', label: 'Did you see or hear it yourself?', showIf: isChange, options: [
        { value: 'saw', label: 'Yes.' },
        { value: 'partly', label: 'Partly. I saw some of it, and others told me the rest.' },
        { value: 'told', label: 'No. Someone told me about it.' }
      ] },
      { id: 'history', type: 'choice', label: 'Is this the first time, or has it come up before?',
        hint: 'Count what you’ve seen yourself and conversations you’ve actually had.',
        showIf: a => isChange(a) && a.source !== 'told', options: [
          { value: 'first', label: 'This is the first time I’ve noticed it.' },
          { value: 'noticed', label: 'I’ve noticed it before, but I haven’t raised it.' },
          { value: 'once', label: a => 'I’ve raised it with ' + who(a) + ' once before.' },
          { value: 'more', label: 'I’ve raised it more than once, and it’s still happening.' }
        ] }
    ]
  });
  const approach = a => picker.find(a.approach);
  const on = (...ids) => a => ids.includes(a.approach);
  const by = (map, fallback) => a => (a.approach in map ? map[a.approach] : fallback);
  const named = fn => a => fn(who(a), a);

  // Step 4: every approach's prompts. Each prompt shows only for the approaches that use it.
  const openExample = {
    recognize: 'I want to tell you about something you did in Tuesday’s client call.',
    ahead: 'I’d like to talk about where you want to grow in client work.',
    view: 'I’d like to hear how Tuesday’s client call went from your side.',
    describe: 'I’d like to talk about Tuesday’s client call and leave with a plan for the next one.',
    pattern: 'I’d like to come back to how client calls are going, and figure this out together.',
    expect: 'I want to talk about client calls again and be clear about where things stand.'
  };
  const traitTip = a => 'Leave out words like careless or rude, and guesses about why. Trait words describe a person, not an action, and you won’t know why until you ask.' +
    (a.source === 'partly' && a.about !== 'keep' ? ' Stick to the parts you saw or heard yourself.' : '');

  const sayFields = [
    { id: 'open', type: 'textarea', label: 'How will you open?', maxlength: 600, error: 'Write how you’ll open the conversation.',
      hint: a => 'Say why you want to talk. Example: ' + (openExample[a.approach] || openExample.describe) },
    { id: 'before', type: 'textarea', label: 'When did you raise it before, and what did you agree?', maxlength: 1000, showIf: on('pattern'),
      hint: 'Example: After the March 3 call, we agreed you’d let clients finish before answering.', error: 'Describe your earlier conversation.' },
    { id: 'discussed', type: 'textarea', label: 'When have you discussed it, and what was agreed?', maxlength: 1000, showIf: on('expect'),
      hint: 'Dates and agreements, briefly. Example: We talked on March 3 and April 7, and agreed you’d let clients finish before answering.',
      error: 'Describe the conversations you’ve had about it.' },
    { id: 'heard', type: 'textarea', label: 'What have you heard?', maxlength: 1000, showIf: on('view'),
      hint: 'What was described, not opinions about it. Example: I heard the call ran long and the client had to repeat a question.',
      after: 'Don’t name who told you unless they’ve agreed.', error: 'Describe what you heard.' },
    { id: 'whenWhere', type: 'text', maxlength: 200, showIf: on('recognize', 'describe', 'pattern'),
      label: by({ pattern: 'When and where has it happened since?' }, 'When and where did it happen?'),
      hint: 'Example: In Tuesday’s client call', error: 'Say when and where it happened.' },
    { id: 'did', type: 'textarea', maxlength: 1500, showIf: on('recognize', 'describe', 'pattern', 'expect'),
      label: a => ({
        recognize: 'What did ' + who(a) + ' do?',
        describe: 'What did you see or hear ' + who(a) + ' do?',
        pattern: 'What have you seen or heard ' + who(a) + ' do since?',
        expect: 'What’s still happening?'
      })[a.approach] || 'What did you see or hear?',
      hint: by({
        recognize: 'Describe what you saw or heard. Example: You told the client about the delay before they asked, and offered two new dates.',
        describe: 'Describe it the way a video would. Example: You answered before the client finished their question, twice.',
        pattern: 'One or two specific examples. Example: In Tuesday’s call, you answered before the client finished, twice.',
        expect: 'Recent, specific examples you’ve seen or heard. Example: In the last two calls I joined, you answered before clients finished their questions.'
      }),
      after: a => (a.approach === 'recognize'
        ? 'Name the action, not a trait. “You told the client before they asked” says more than “You’re so proactive.”'
        : traitTip(a)),
      error: 'Describe what you saw or heard.' },
    { id: 'effect', type: 'textarea', maxlength: 1000, showIf: on('recognize', 'describe', 'pattern', 'expect'),
      label: by({ recognize: 'What difference did it make?' }, 'What was the effect?'),
      hint: by({ recognize: 'For the team, the work, or a client. Example: The client agreed to a new date on the spot.' },
        'On the work, the team, a client, or you. Example: The client repeated the question, and the call ran 15 minutes over.'),
      error: 'Describe the effect.' },
    { id: 'earlier', type: 'text', maxlength: 300, label: 'How will you say you’ve noticed it before?',
      showIf: a => a.approach === 'describe' && isChange(a) && a.source !== 'told' && a.history === 'noticed',
      hint: 'Keep it short. Example: I’ve seen this a couple of times, and I’m raising it now.',
      error: 'Write how you’ll mention the earlier times.' },
    { id: 'keep', type: 'textarea', maxlength: 600, optional: true, showIf: on('recognize'),
      label: named(n => 'What should ' + n + ' keep doing?'), hint: 'Example: Keep giving clients a heads-up when dates move.' },
    { id: 'goal', type: 'textarea', maxlength: 600, showIf: on('ahead'), label: 'What’s one thing to work toward?',
      hint: named(n => 'Ask ' + n + ' what they’d like to work on. Example: Leading a client call from start to finish.'),
      error: 'Name one thing to work toward.' },
    { id: 'nextChance', type: 'text', maxlength: 200, optional: true, showIf: on('ahead'),
      label: 'When is the next chance to try it?', hint: 'Example: The Acme kickoff on the 14th' },
    { id: 'ideas', type: 'textarea', maxlength: 1000, showIf: on('ahead'), label: 'What one or two ideas will you offer?',
      hint: 'Ideas for next time, not a review of last time. Example: Open with a one-minute agenda, and ask the client what a good result looks like.',
      error: 'Add at least one idea.' },
    { id: 'expectation', type: 'textarea', maxlength: 1000, showIf: on('expect'), label: 'What needs to change, and by when?',
      hint: 'Something you can both see. Example: By May 30, clients finish their questions in every call I join.',
      error: 'Say what needs to change and by when.' },
    { id: 'support', type: 'textarea', maxlength: 1000, showIf: on('expect'), label: 'What support will you give?',
      hint: 'Example: A weekly check-in, and I’ll join two calls and share notes after.', error: 'Say what support you’ll give.' },
    { id: 'ifContinues', type: 'textarea', maxlength: 1000, optional: true, showIf: on('expect'), label: 'What happens if it continues?',
      hint: 'A real step you can take and will take. If you’re not sure what’s allowed, leave this blank and check with HR first. Example: We’ll talk about whether this role is the right fit for now.',
      note: () => 'If you’re considering formal steps, such as a performance plan, talk with HR first. This planner doesn’t cover formal processes.' },
    { id: 'askDescribe', type: 'text', maxlength: 300, showIf: on('describe'), label: named(n => 'What will you ask to hear ' + n + '’s view?'),
      default: () => 'How did it look from your side?', after: 'Ask, then listen before you suggest anything.', error: 'Write a question to ask.' },
    { id: 'askPattern', type: 'text', maxlength: 300, showIf: on('pattern'), label: 'What will you ask before you suggest a fix?',
      default: () => 'What’s getting in the way?', after: 'Workload, unclear expectations, or a process may be part of it.', error: 'Write a question to ask.' },
    { id: 'askExpect', type: 'text', maxlength: 300, showIf: on('expect'), label: 'What will you ask?',
      default: () => 'What do you need from me to make this change?', error: 'Write a question to ask.' },
    { id: 'askAhead', type: 'text', maxlength: 300, showIf: on('ahead'), label: 'What will you ask?',
      default: () => 'What ideas do you have?', after: 'Listen and say thank you. You don’t have to agree with every idea.', error: 'Write a question to ask.' },
    { id: 'askView', type: 'text', maxlength: 300, showIf: on('view'), label: 'What will you ask?',
      default: () => 'Can you walk me through what happened?',
      after: 'Then listen. You may learn something that changes the feedback, or that there’s none to give.', error: 'Write a question to ask.' },
    { id: 'nextStep', type: 'textarea', maxlength: 1000, showIf: on('describe'), label: 'What next step do you want to agree on?',
      hint: 'One specific action you can shape together. Example: Let clients finish, then sum up their question before answering.',
      error: 'Describe the next step.' },
    { id: 'change', type: 'textarea', maxlength: 1000, showIf: on('pattern'), label: 'What will change, and what support will you offer?',
      hint: 'Example: You’ll sum up each question before answering. I’ll join the next two calls and share notes after.',
      error: 'Describe what will change and your support.' },
    { id: 'working', type: 'textarea', maxlength: 1000, optional: true,
      showIf: a => a.about === 'both' && ['describe', 'pattern', 'view'].includes(a.approach),
      label: 'What’s going well that you want to name?', hint: 'Specific and true. Example: Your follow-up notes after client calls are clear and quick.',
      after: 'Keep it as its own point. Wrapping a change in compliments makes both easier to miss.' }
  ];
  const askKey = { describe: 'askDescribe', pattern: 'askPattern', expect: 'askExpect', ahead: 'askAhead', view: 'askView' };

  // Step 5: what helps the person. These change how the leader shares it, never what they say.
  const helps = [
    { value: 'direct', label: 'Short and direct, soon after it happens',
      tip: 'Say the main point in the first minute.', recognize: 'Say it soon, in a sentence or two.' },
    { value: 'time', label: 'Time to think before talking it through',
      tip: 'Tell them the topic ahead of time. Don’t expect an answer on the spot.', recognize: 'A short written note can work well, so they can take it in on their own time.' },
    { value: 'reasons', label: 'The reasons behind it, and room to question them',
      tip: 'Bring your examples. Treat questions as part of the conversation, not resistance.', recognize: 'Say why it mattered, with your example.' },
    { value: 'team', label: 'How it connects to the team',
      tip: 'Start with what they bring to the team, then talk through how this affects others.', recognize: 'Say how their work helped the team and the people around them.' },
    { value: 'result', label: 'Clarity on the result, with room to choose how',
      tip: 'Agree on the result, then let them choose how. Skip step-by-step corrections.', recognize: 'Focus on the result they got, not the steps they took.' },
    { value: 'unsure', label: 'I’m not sure. I’ll ask them.',
      tip: 'Ask how they like to get feedback: right away or after time to think, short or with detail.' }
  ];
  const helpTip = (h, a) => (a.approach === 'recognize' && h.recognize) || h.tip;

  function settingNote(a) {
    if (a.setting !== 'team') return '';
    if (changeApproaches.includes(a.approach)) return 'Feedback about a change usually goes better in private.';
    if (a.approach === 'recognize') return 'Some people enjoy thanks in front of others and some don’t. If you’re not sure, ask.';
    return '';
  }

  const followUp = {
    recognize: { note: 'Suggested: no formal follow-up needed. Notice it again the next time it happens.' },
    ahead: { when: 'soon after the next chance to try it', agreed: 'what you’ll try' },
    view: { when: 'within a day, with what you decided, even if there’s no feedback to give' },
    describe: { when: 'about a week after you talk', agreed: 'what you agreed' },
    pattern: { when: 'within a week', agreed: 'what you agreed' },
    expect: { when: 'weekly until the date you set', agreed: 'what you agreed' }
  };
  function followNote(a) {
    const f = followUp[a.approach];
    if (!f) return '';
    if (f.note) return f.note;
    return 'Suggested: check in ' + f.when + '.' +
      (f.agreed ? ' Within a day, send a short note that sums up ' + f.agreed + '.' : '') + ' Your plan includes a starter note.';
  }

  // Before you talk: a self-check adapted from infographics by Amy Gibson and Cicely Simpson.
  const checks = {
    checksChange: [
      { value: 'specific', label: 'My example is specific, and I saw or heard it myself.', reminder: 'Find one specific example you saw or heard yourself.' },
      { value: 'actions', label: 'My words describe actions and their effect, not character or intent.', reminder: 'Reread your words, and swap any trait words for what they did.' },
      { value: 'clear', label: a => who(a) + ' will know exactly what I’m asking for.', reminder: () => 'Put what you’re asking for in one clear sentence.' },
      { value: 'same', label: 'I’d say this the same way to anyone on the team.', reminder: 'Ask yourself whether you’d raise this with anyone on the team, in the same words. If not, rethink it.' },
      { value: 'part', label: 'I’ve thought about my part, such as unclear expectations, workload, or missing tools.', reminder: 'Check whether expectations, workload, or tools played a part, and be ready to own your share.' },
      { value: 'calm', label: 'I’m calm enough to listen.', reminder: 'Wait until you can listen. A short delay is better than a heated conversation.' }
    ],
    checksKeep: [
      { value: 'specific', label: by({ ahead: 'The goal is specific enough to try.' }, 'My example is specific.'),
        reminder: by({ ahead: 'Narrow the goal to one thing they can try next time.' }, 'Pick one specific moment to name.') },
      { value: 'actions', label: 'My words describe actions, not traits.', reminder: 'Swap any trait words for what they did.' },
      { value: 'clear', label: a => who(a) + (a.approach === 'ahead' ? ' will know what to try next.' : ' will know exactly what to keep doing.'),
        reminder: by({ ahead: 'Agree on one thing to try next time.' }, 'Say what to keep doing in one clear sentence.') },
      { value: 'same', label: by({ ahead: 'I’d offer this kind of support to anyone on the team.' }, 'I’d recognize anyone on the team for the same thing.'),
        reminder: by({ ahead: 'Think about who else on the team could use this kind of support.' }, 'Think about whether others who did the same have heard the same thanks.') }
    ],
    checksView: [
      { value: 'heard', label: 'I know exactly what I heard, and I’ll describe it neutrally.', reminder: 'Write down exactly what you heard, without opinions, before you talk.' },
      { value: 'actions', label: 'My words describe actions and their effect, not character or intent.', reminder: 'Reread your words, and swap any trait words for what they did.' },
      { value: 'same', label: 'I’d say this the same way to anyone on the team.', reminder: 'Ask yourself whether you’d raise this with anyone on the team, in the same words. If not, rethink it.' },
      { value: 'part', label: 'I’ve thought about my part, such as unclear expectations, workload, or missing tools.', reminder: 'Check whether expectations, workload, or tools played a part, and be ready to own your share.' },
      { value: 'calm', label: 'I’m calm enough to listen.', reminder: 'Wait until you can listen. A short delay is better than a heated conversation.' }
    ]
  };
  const checkKeyFor = a => (a.approach === 'view' ? 'checksView' : ['recognize', 'ahead'].includes(a.approach) ? 'checksKeep' : 'checksChange');
  const resolve = (value, a) => (typeof value === 'function' ? value(a) : value);

  // Each item in the plan's checklist, and a reminder for anything not checked yet.
  function checklist(a) {
    const key = checkKeyFor(a);
    const items = checks[key].map(c => ({
      label: resolve(c.label, a),
      done: (a[key] || []).includes(c.value),
      reminder: resolve(c.reminder, a)
    }));
    if (a.approach === 'expect') {
      const decided = !!text(a.ifContinues);
      items.push({ label: 'I’ve decided what happens if it continues, with HR if needed.', done: decided,
        reminder: 'Decide, with HR if needed, what happens if it continues.' });
    }
    return items;
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
  function blank() {
    const b = el('span', 'blank');
    b.append(el('span', 'visually-hidden', 'blank to fill in'));
    return b;
  }

  function sayPairs(a) {
    const working = a.about === 'both' ? a.working : '';
    switch (a.approach) {
      case 'recognize': return [['When and where', a.whenWhere], ['What they did', a.did], ['The difference it made', a.effect], ['What to keep doing', a.keep]];
      case 'ahead': return [['The goal', a.goal], ['Next chance to try it', a.nextChance], ['Ideas you’ll offer', a.ideas]];
      case 'view': return [['What you’ve heard', a.heard], ['What’s working', working]];
      case 'describe': return [['When and where', a.whenWhere], ['What you saw or heard', a.did], ['The effect', a.effect],
        ['Noticed before', sayFields.find(f => f.id === 'earlier').showIf(a) ? a.earlier : ''], ['What’s working', working]];
      case 'pattern': return [['Your earlier conversation', a.before], ['When and where since', a.whenWhere], ['What you’ve seen since', a.did],
        ['The effect', a.effect], ['What’s working', working]];
      case 'expect': return [['What you’ve discussed', a.discussed], ['What’s still happening', a.did], ['The effect', a.effect]];
      default: return [];
    }
  }
  function nextPairs(a) {
    switch (a.approach) {
      case 'describe': return { title: 'Next step to agree on', pairs: [['Next step', a.nextStep]] };
      case 'pattern': return { title: 'Next step to agree on', pairs: [['What will change, and your support', a.change]] };
      case 'expect': return { title: 'The expectation', pairs: [['What needs to change, and by when', a.expectation], ['Support you’ll give', a.support],
        ['If it continues', text(a.ifContinues) || 'To decide before you talk, with HR if needed.']] };
      default: return null;
    }
  }
  const credit = {
    recognize: 'Structure adapted from the Situation-Behavior-Impact™ (SBI™) model, Center for Creative Leadership.',
    ahead: 'Draws on feedforward, Marshall Goldsmith’s term for ideas about the future.',
    view: 'Draws on Chris Argyris’s ladder of inference.',
    describe: 'Structure adapted from the Situation-Behavior-Impact™ (SBI™) model, Center for Creative Leadership, and Anna Carroll’s COIN model.',
    pattern: 'Structure adapted from the SBI™ model, Center for Creative Leadership, and inspired by Jonathan Raymond’s Accountability Dial®.',
    expect: 'Inspired by Jonathan Raymond’s Accountability Dial®.'
  };
  const tense = [
    'Tell me more about that.',
    'We see this differently, and I want to understand your view.',
    'Let’s take a short break and come back to this.',
    'Let me think about what you said and follow up tomorrow.'
  ];

  function renderResult(container, a, api) {
    const ap = approach(a);
    const name = who(a);
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your plan'), el('h2', null, 'Your conversation plan'),
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
    plan.setAttribute('aria-label', 'Conversation plan');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    const meta = ['With ' + name, text(a.when) || 'Time to set', ap ? ap.title : ''].filter(Boolean);
    titleWrap.append(el('p', 'eyebrow', 'Conversation plan'), el('h3', 'brief-title', text(a.topic)), el('p', 'brief-meta', meta.join(' · ')));
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

    const say = section('What to say', 3, api, 'what you’ll say');
    say.append(pairs(sayPairs(a)));
    plan.append(say);

    const question = text(a[askKey[a.approach]]);
    if (question || a.approach === 'view') {
      const q = section('Questions to ask', 3, api, 'your questions');
      if (question) q.append(list([question]));
      if (a.approach === 'view') {
        q.append(el('p', null, 'After you listen: if it matches what you heard, describe the effect and agree on a next step. If it doesn’t, thank them, and decide who else needs to hear back.'));
      }
      // For a repeated issue, the answer to "what's getting in the way?" may be a process or tool.
      // On screen only. Opens in a new tab and carries no names or text.
      if (a.approach === 'pattern' || a.approach === 'expect') {
        const tip = el('p', 'small no-print');
        const link = el('a', null, 'find the cause with the Root Cause Finder (opens in a new tab)');
        link.href = '../root-cause-finder/index.html';
        link.target = '_blank';
        link.rel = 'noopener';
        tip.append('If a process or tool is part of it, ', link, '.');
        q.append(tip);
      }
      plan.append(q);
    }

    const next = nextPairs(a);
    if (next) {
      const n = section(next.title, 3, api, next.title.toLowerCase());
      n.append(pairs(next.pairs));
      plan.append(n);
    }

    const share = section('How you’ll share it', 4, api, 'how you’ll share it');
    share.append(el('p', null, 'Where: ' + (a.setting === 'team' ? 'in a team setting.' : 'in private.') + (settingNote(a) ? ' ' + settingNote(a) : '')));
    const tips = helps.filter(h => (a.helps || []).includes(h.value)).map(h => helpTip(h, a));
    if (tips.length) share.append(list(tips));
    plan.append(share);

    if (a.approach !== 'recognize') {
      const t = section('If it gets tense', null, api, '');
      t.append(list(tense), el('p', null, 'A short pause before you answer gives you both time.'));
      plan.append(t);
    }

    const after = section('After the conversation', 4, api, 'your follow-up');
    const f = followUp[a.approach] || {};
    if (f.note) {
      after.append(el('p', null, text(a.followUp) ? 'Follow up: ' + text(a.followUp) + '.' : 'No formal follow-up needed. Notice it again the next time it happens.'));
    } else {
      after.append(el('p', null, 'Follow up: ' + (text(a.followUp) || 'check in ' + f.when) + '.'));
      if (f.agreed) after.append(el('p', null, 'Within a day, send a short note that sums up ' + f.agreed + '.'));
      const note = el('div', 'starter-note');
      note.append(el('h4', null, 'Starter note'));
      const line = el('p');
      const agreeLine = { ahead: 'Here’s what you’ll try next: ', view: 'Here’s where we landed: ' }[a.approach] || 'Here’s what we agreed: ';
      line.append('Hi ' + name + ', thanks for talking with me today. ' + agreeLine, blank(), '. I’ll check in ', blank(), '. Let me know if I missed anything.');
      note.append(line);
      after.append(note);
    }
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
    const lines = el('div', 'brief-lines');
    lines.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) lines.append(el('div'));
    notes.append(lines);
    // Notes and the footer stay together on paper, so the footer never prints alone.
    const end = el('div', 'brief-end');
    end.append(notes);
    plan.append(end);

    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'This plan is a starting point. Bring it as notes, not a script, and change course if you learn something new.'));
    foot.append(el('p', null, 'Made with the Pivot Labs Feedback Conversation Planner · ' +
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
        { id: 'person', type: 'text', label: 'Who is this feedback for?', hint: 'First name or initials. Example: Jordan', maxlength: 60,
          error: 'Enter a first name or initials.' },
        { id: 'topic', type: 'text', label: 'What’s it about?', hint: 'A few words. Example: Client call updates', maxlength: 120,
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
      id: 'say',
      title: a => (approach(a) ? approach(a).title : 'What you’ll say'),
      intro: a => ({
        recognize: 'Be specific, so ' + who(a) + ' knows exactly what to keep doing.',
        ahead: 'Keep it about next time, not last time.',
        view: 'Ask and listen before you decide whether there’s feedback to give.',
        describe: 'Describe one moment and its effect, then hear ' + whose(a) + ' view.',
        pattern: 'Link this to your earlier conversation, then solve it together.',
        expect: 'Be clear and calm. Say it once, then listen.'
      })[a.approach] || 'Plan what you’ll say.',
      fields: sayFields
    },
    {
      id: 'share',
      title: 'How you’ll say it',
      intro: 'Plan how you’ll share it and follow up, then check yourself before you talk.',
      fields: [
        { id: 'helps', type: 'multi', optional: true, label: named(n => 'What helps ' + n + ' in a conversation like this?'),
          hint: named(n => 'Choose any that fit. Go by what ' + n + ' has told you or what’s helped before, not a guess about personality or background. This changes how you share it, not what you say.'),
          options: helps.map(h => ({ value: h.value, label: h.label })) },
        { id: 'setting', type: 'choice', label: 'Where will you talk?', note: settingNote, options: [
          { value: 'private', label: 'In private' },
          { value: 'team', label: 'In a team setting' }
        ] },
        { id: 'followUp', type: 'text', optional: true, maxlength: 200, label: 'When will you follow up?',
          hint: 'Example: Next Thursday’s one-on-one', note: followNote },
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
    return {
      person: '', topic: '', when: '',
      about: '', source: '', history: '', approach: '', approachPicked: false,
      open: '', before: '', discussed: '', heard: '', whenWhere: '', did: '', effect: '', earlier: '', keep: '',
      goal: '', nextChance: '', ideas: '', expectation: '', support: '', ifContinues: '',
      askDescribe: '', askPattern: '', askExpect: '', askAhead: '', askView: '',
      nextStep: '', change: '', working: '',
      helps: [], setting: '', followUp: '', checksChange: [], checksKeep: [], checksView: []
    };
  }
  const blankAnswers = JSON.stringify(initialAnswers());
  const isDirty = a => JSON.stringify(a) !== blankAnswers;

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your plan', finishLabel: 'Review my plan',
    // Exposed for testing the suggestion logic.
    suggest, approaches, checklist, followNote, settingNote };
})();
