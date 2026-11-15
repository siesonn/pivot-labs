'use strict';
/*
  Executive Ask Builder content: the steps, concern prompts, checklist, and the ask brief.
  The step engine is shared: assets/js/guided-planner.js.

  Adapted from Cicely Simpson's "How to Present to Senior Leadership as a Leader."
  The structure and wording here are our own. The brief is for the leader. Concerns are
  described by type (cost, timing, capacity, risk), never by guesses about a person.
*/
const ExecutiveAskBuilder = (() => {
  const el = GuidedPlanner.el;
  const text = value => (value || '').trim();
  // Drops a final period so the ask can sit inside a sentence.
  const bare = value => text(value).replace(/[.!?\s]+$/, '');

  // The concerns a leader can prepare for. Each gets one prompt and one answer.
  const concerns = [
    { value: 'cost', short: 'Cost', label: 'Cost: what it will take, or what it’s worth',
      prompt: 'How will you show the return, or the cost of doing nothing?',
      hint: 'Example: It pays for itself in nine months, and overtime is already running past that.' },
    { value: 'timing', short: 'Timing', label: 'Timing: why now',
      prompt: 'Why does it matter more now than later?',
      hint: 'Example: The busiest season starts in March, and training takes eight weeks.' },
    { value: 'capacity', short: 'Capacity', label: 'Capacity: whether the team can take it on',
      prompt: 'How will you manage the load on the team?',
      hint: 'Example: We’ll pause two lower-priority projects during the first month.' },
    { value: 'risk', short: 'Risk', label: 'Risk: what could go wrong',
      prompt: 'How will you reduce or manage the risk?',
      hint: 'Example: We’ll start with one team and review results before we expand.' },
    { value: 'other', short: 'Something else', label: 'Something else' },
    { value: 'unsure', short: 'Not sure', label: 'I’m not sure what they’ll ask' }
  ];
  const picked = (a, value) => (a.concerns || []).includes(value);

  const checks = [
    { value: 'sentence', label: 'I can state my ask in one sentence.',
      reminder: 'Say your ask out loud in one sentence. If you can’t, it isn’t ready.' },
    { value: 'lead', label: 'I’ll lead with the decision I need, then give context.',
      reminder: 'Open with the ask, not the background. Put the ask in your first two minutes.' },
    { value: 'context', label: 'My context is only what they need to decide.',
      reminder: 'Cut anything they don’t need to make this decision. You can offer more if they ask.' },
    { value: 'concerns', label: 'I’ve prepared for the concerns I’m likely to hear.',
      reminder: 'Write an answer for each concern you expect, so you can respond without scrambling.' },
    { value: 'close', label: 'I’ll end by asking for the decision again.',
      reminder: 'Plan your closing line. Don’t leave without a yes, a no, or a conditional yes.' }
  ];
  const reminders = a => checks.filter(c => !(a.checks || []).includes(c.value)).map(c => c.reminder);

  // The ask, as you would say it. Used in the live preview and the brief.
  function statement(a) {
    const ask = bare(a.ask), outcome = bare(a.outcome), consequence = bare(a.consequence);
    if (!ask || !outcome || !consequence) return '';
    return 'Here’s the decision I need from you: ' + ask + '. That lets us ' + outcome + ' and keeps us from ' + consequence + '.';
  }
  const askShort = a => bare(a.ask) || 'this';
  const defaultClose = a => 'Can I get your decision on ' + askShort(a) + ' today?';
  const defaultRedirect = a => 'I want to make sure we cover that. Can we settle ' + askShort(a) + ' first, then come back to it?';

  // The brief
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

  function concernPairs(a) {
    const out = [];
    concerns.forEach(c => {
      if (!picked(a, c.value) || c.value === 'unsure') return;
      if (c.value === 'other') out.push([text(a.otherName) || 'Something else', a.otherAnswer]);
      else out.push([c.short + ': ' + c.prompt.replace(/\?$/, ''), a[c.value + 'Answer']]);
    });
    return out;
  }

  function renderResult(container, a, api) {
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your brief'), el('h2', null, 'Your ask brief'),
      el('p', null, 'This brief is for you. Use Edit to change any section, then print it or save it as a PDF to take into the conversation.'));
    container.append(head);

    const open = reminders(a);
    if (open.length) {
      const box = el('section', 'prep-notes no-print');
      box.setAttribute('aria-labelledby', 'reminders-title');
      const h = el('h3', null, 'Before you go in');
      h.id = 'reminders-title';
      box.append(h, list(open), el('p', 'small', 'These come from the checklist in step 6. They don’t print.'));
      container.append(box);
    }

    const actions = el('div', 'result-actions no-print');
    const print = el('button', 'btn primary', 'Print brief');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    const editAll = el('button', 'btn', 'Edit my answers');
    editAll.type = 'button';
    editAll.addEventListener('click', () => api.goTo(0));
    const again = el('button', 'btn', 'Start a new ask');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    actions.append(print, editAll, again);
    container.append(actions,
      el('p', 'small no-print', 'Printed briefs include what you entered. In the print window, choose “Save as PDF” to keep a digital copy, and turn off browser headers and footers for a cleaner page.'));

    const brief = el('article', 'brief');
    brief.setAttribute('aria-label', 'Ask brief');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    const meta = [];
    if (text(a.who)) meta.push('For ' + text(a.who));
    if (text(a.by)) meta.push('Decision needed by ' + text(a.by));
    if (text(a.when)) meta.push('Conversation: ' + text(a.when));
    titleWrap.append(el('p', 'eyebrow', 'Ask brief'), el('h3', 'brief-title', bare(a.ask)));
    if (meta.length) titleWrap.append(el('p', 'brief-meta', meta.join(' · ')));
    const editTop = el('button', 'btn brief-edit no-print', 'Edit');
    editTop.type = 'button';
    editTop.setAttribute('aria-label', 'Edit the ask, who decides, and when');
    editTop.addEventListener('click', () => api.goTo(0));
    top.append(titleWrap, editTop);
    brief.append(brand, top);

    const ask = section('Your ask, in words', 2, api, 'your ask in words');
    ask.append(el('p', 'brief-quote', statement(a)));
    brief.append(ask);

    const ctx = section('What they need to know to decide', 1, api, 'the context');
    ctx.append(pairs([['The situation', a.situation], ['What they need to know', a.know], ['What else you considered', a.alternatives]]));
    brief.append(ctx);

    const cp = concernPairs(a);
    const unsure = picked(a, 'unsure');
    if (cp.length || unsure) {
      const conc = section('If they raise concerns', 3, api, 'the concerns');
      if (cp.length) conc.append(pairs(cp));
      if (unsure) conc.append(el('p', 'small', 'You weren’t sure what they’ll ask. Before you go in, ask someone who has presented to them what questions tend to come up, then add your answers here.'));
      brief.append(conc);
    }

    const room = section('In the room', 4, api, 'what you’ll say in the room');
    room.append(list([
      'Open with the ask: “' + statement(a) + '”',
      'Give only the context they need to decide.',
      'Answer concerns as they come up.',
      'Close by asking again: “' + (text(a.closeLine) || defaultClose(a)) + '”'
    ], 'ol'));
    room.append(el('h4', null, 'If the conversation drifts'),
      el('p', null, '“' + (text(a.redirect) || defaultRedirect(a)) + '”'));
    brief.append(room);

    const next = [['If it’s a yes', a.yesNext], ['If it’s a yes with a condition', a.condNext], ['If it’s a no', a.noNext], ['Who needs to know afterward', a.tell]];
    if (next.some(([, v]) => text(v))) {
      const after = section('After the decision', 4, api, 'what happens after the decision');
      after.append(pairs(next));
      brief.append(after);
    }

    const notes = el('section', 'brief-section');
    notes.append(el('h3', null, 'Notes'));
    notes.append(el('p', 'small no-print', 'Space to write on the printout.'));
    const lines = el('div', 'brief-lines');
    lines.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) lines.append(el('div'));
    notes.append(lines);
    brief.append(notes);

    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'This brief is a starting point. Change what doesn’t fit the people and the moment.'));
    foot.append(el('p', null, 'Made with the Pivot Labs Executive Ask Builder · ' + new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) +
      ' · Adapted from Cicely Simpson’s “How to Present to Senior Leadership as a Leader.”'));
    brief.append(foot);
    container.append(brief);
  }

  const concernFields = [];
  concerns.forEach(c => {
    if (c.value === 'unsure') return;
    if (c.value === 'other') {
      concernFields.push(
        { id: 'otherName', type: 'text', maxlength: 120, showIf: a => picked(a, 'other'), label: 'What’s the other concern?',
          hint: 'Name the concern, not the person. Example: How this fits with the new reporting line', error: 'Name the concern.' },
        { id: 'otherAnswer', type: 'textarea', maxlength: 800, showIf: a => picked(a, 'other'), label: 'How will you answer it?',
          error: 'Write how you’ll answer it.' });
    } else {
      concernFields.push({ id: c.value + 'Answer', type: 'textarea', maxlength: 800, showIf: a => picked(a, c.value),
        label: c.short + ': ' + c.prompt, hint: c.hint, error: 'Write how you’ll answer the ' + c.short.toLowerCase() + ' concern.' });
    }
  });

  const steps = [
    {
      id: 'ask',
      title: 'The ask',
      intro: 'Start with the decision you need. If you can’t say it in one sentence, you’re not ready to ask.',
      fields: [
        { id: 'ask', type: 'textarea', maxlength: 300, label: 'What decision do you need from them?',
          hint: 'Clear: “Approve hiring three quality reviewers.” Unclear: “Update on quality progress.” Start with a verb.',
          after: 'If the ask involves people, such as headcount or a role change, describe the work and the need, not the people. Check with HR where it applies.',
          error: 'Enter the decision you need.' },
        { id: 'who', type: 'text', maxlength: 100, optional: true, label: 'Who makes the decision?',
          hint: 'A role or title is enough. Example: VP of Operations' },
        { id: 'by', type: 'text', maxlength: 100, optional: true, label: 'When do you need the decision by?',
          hint: 'Example: End of this month' },
        { id: 'when', type: 'text', maxlength: 100, optional: true, label: 'When is the conversation?',
          hint: 'Example: Thursday’s leadership meeting' },
        // On screen only. Opens in a new tab and carries no entries.
        { id: 'deciderLink', type: 'custom', render: wrap => {
          const p = el('p', 'small');
          const link = el('a', null, 'the Decision Approach Picker (opens in a new tab)');
          link.href = '../decision-approach-picker/index.html';
          link.target = '_blank';
          link.rel = 'noopener';
          p.append('Not sure how to decide what to recommend? Try ', link, '.');
          wrap.append(p);
        } }
      ]
    },
    {
      id: 'context',
      title: 'The context',
      intro: 'Give just enough context for them to decide. A data dump isn’t context.',
      fields: [
        { id: 'situation', type: 'textarea', maxlength: 1000, label: 'What’s the situation, in a few lines?',
          hint: 'Example: Backlog has grown for three months, and review times are up 40 percent.', error: 'Describe the situation.' },
        { id: 'know', type: 'textarea', maxlength: 1000, label: 'What do they need to know to make this call?',
          hint: 'Only what changes the decision. Ask yourself what they’d want to know, what concerns they’ll have, and what else could work.',
          error: 'Write what they need to know.' },
        { id: 'alternatives', type: 'textarea', maxlength: 800, optional: true, label: 'What else did you consider?',
          hint: 'Other ways to solve it, and why you’re asking for this one.' }
      ]
    },
    {
      id: 'say',
      title: 'Say it',
      intro: 'Put the ask in words you can say out loud. Then stop talking and let them respond.',
      fields: [
        { id: 'outcome', type: 'text', maxlength: 200, label: 'What does this decision let you do?',
          hint: 'Example: Meet the six-month forecast', error: 'Say what the decision lets you do.' },
        { id: 'consequence', type: 'text', maxlength: 200, label: 'What does it keep from happening?',
          hint: 'The cost of not deciding. Example: Missing the March deadline', error: 'Say what the decision keeps from happening.',
          note: a => (statement(a) ? 'Your ask will read: ' + statement(a) : '') }
      ]
    },
    {
      id: 'concerns',
      title: 'Their likely concerns',
      intro: 'Prepare for concerns before you walk in. Predictable concerns shouldn’t surprise you.',
      fields: [
        { id: 'concerns', type: 'multi', label: 'Which concerns do you expect?', hint: 'Choose all that fit. You’ll write an answer for each.',
          options: concerns.map(c => ({ value: c.value, label: c.label })), error: 'Choose at least one, or “I’m not sure.”',
          after: 'Think about the concern, not the person. If you’re not sure, ask someone who has presented to them what questions tend to come up.' },
        ...concernFields
      ]
    },
    {
      id: 'room',
      title: 'In the room',
      intro: 'Plan how you’ll close, and what you’ll do if the conversation goes off track.',
      fields: [
        { id: 'closeLine', type: 'textarea', maxlength: 300, label: 'How will you ask again at the end?',
          default: defaultClose, hint: 'Close by asking for the decision directly. Edit the line to sound like you.' },
        { id: 'redirect', type: 'textarea', maxlength: 300, label: 'What will you say if the conversation drifts?',
          default: defaultRedirect, hint: 'A calm line that brings it back to the decision.' },
        { id: 'yesNext', type: 'text', maxlength: 300, optional: true, label: 'If it’s a yes, what happens next?',
          hint: 'Example: Post the roles by Friday' },
        { id: 'condNext', type: 'text', maxlength: 300, optional: true, label: 'If it’s a yes with a condition, what condition could you meet?',
          hint: 'Example: Start with two reviewers, add the third in Q3' },
        { id: 'noNext', type: 'text', maxlength: 300, optional: true, label: 'If it’s a no, what will you ask or do next?',
          hint: 'Example: Ask what would change the answer' },
        { id: 'tell', type: 'text', maxlength: 300, optional: true, label: 'Who needs to know afterward?',
          hint: 'Example: My team leads' }
      ]
    },
    {
      id: 'ready',
      title: 'Before you go in',
      intro: 'A quick check. These are optional, and unchecked items turn into reminders next to your brief.',
      fields: [
        { id: 'checks', type: 'multi', optional: true, label: 'Before you go in, check what’s true.', hint: 'Choose any that fit.',
          options: checks.map(c => ({ value: c.value, label: c.label })),
          after: 'If you can’t check all five, you’re not ready yet. That’s useful to know before you’re in the room.' }
      ]
    }
  ];

  function initialAnswers() {
    return {
      ask: '', who: '', by: '', when: '',
      situation: '', know: '', alternatives: '',
      outcome: '', consequence: '',
      concerns: [], costAnswer: '', timingAnswer: '', capacityAnswer: '', riskAnswer: '', otherName: '', otherAnswer: '',
      closeLine: '', redirect: '', yesNext: '', condNext: '', noNext: '', tell: '',
      checks: []
    };
  }
  const blank = JSON.stringify(initialAnswers());
  const isDirty = a => JSON.stringify(a) !== blank;

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your brief',
    // Exposed for testing.
    statement, reminders, concernPairs, concerns, checks };
})();
