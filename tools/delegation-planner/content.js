'use strict';
/*
  Delegation Planner content: the steps, questions, suggestions, and the handoff brief.
  The step engine is shared: assets/js/guided-planner.js.

  Suggestions are starting points. They never decide for the leader, and step 2 answers
  shape support and check-ins, not a judgment of the person.
*/
const DelegationPlanner = (() => {
  const el = GuidedPlanner.el;
  const who = a => (a.person || '').trim() || 'this person';

  // Decision levels: how the leader sees them, and how the brief says them to the person.
  const levels = [
    { value: 'decide', label: 'They decide', brief: 'You decide' },
    { value: 'tell', label: 'They decide, then tell you', brief: 'You decide, then let me know' },
    { value: 'check', label: 'Check with you first', brief: 'Check with me first' },
    { value: 'na', label: 'Doesn’t apply' }
  ];
  // Suggested levels are the same for everyone, so a read of the person never tightens them.
  const decisions = [
    { id: 'how', label: 'How to do the work: methods, tools, and order of steps', brief: 'How to do the work', suggested: 'decide' },
    { id: 'priorities', label: 'Day-to-day priorities within this work', brief: 'Day-to-day priorities within this work', suggested: 'decide' },
    { id: 'spending', label: 'Spending money', brief: 'Spending money', suggested: 'check', limit: true },
    { id: 'deadline', label: 'Changing the deadline', brief: 'Changing the deadline', suggested: 'check' },
    { id: 'scope', label: 'Changing what done looks like', brief: 'Changing what done looks like', suggested: 'check' },
    { id: 'help', label: 'Asking others for help', brief: 'Asking others for help', suggested: 'tell' },
    { id: 'updates', label: 'Updates to senior leaders, clients, or other teams', brief: 'Updates to senior leaders, clients, or other teams', suggested: 'tell' }
  ];

  const frequencyText = { weekly: 'every week', biweekly: 'every two weeks', monthly: 'once a month' };
  const whereText = { oneonone: 'in our regular one-on-one', team: 'in our team meeting', separate: 'in a separate check-in' };
  const reviewDays = { d30: 30, d60: 60, d90: 90 };

  const commitments = [
    { value: 'questions', label: 'Save non-urgent questions for our check-ins.', brief: 'I’ll save non-urgent questions for our check-ins.' },
    { value: 'threads', label: 'Step out of email threads and chats for this work.', brief: 'I’ll step out of email threads and chats for this work.' },
    { value: 'correct', label: 'Before correcting something, ask: will this hurt the result? If not, leave it.', brief: 'Before I correct something, I’ll ask whether it will hurt the result. If it won’t, I’ll leave it.' },
    { value: 'access', label: a => 'Share the files, access, and contacts ' + who(a) + ' needs.', brief: 'I’ll share the files, access, and contacts you need.' },
    { value: 'announce', label: a => 'Tell the people involved that ' + who(a) + ' now owns this.', brief: 'I’ll tell the people involved that you now own this.' }
  ];

  function suggestFrequency(a) {
    const name = who(a);
    switch (a.experience) {
      case 'done': return { value: 'biweekly', note: 'Suggested: every two weeks, because ' + name + ' has done similar work. Your regular one-on-one may be enough.' };
      case 'partly': return { value: 'weekly', note: 'Suggested: weekly at first, because ' + name + ' has done parts of this before. Ease off as it goes well.' };
      case 'new': return { value: 'weekly', note: 'Suggested: weekly at first, because this is new to ' + name + '. Ease off as it goes well.' };
      case 'unsure': return { value: 'weekly', note: 'Suggested: weekly at first, until you’ve seen how ' + name + ' approaches this work.' };
      default: return null;
    }
  }

  // Prep notes come from step 2. They are for the leader and print only on request.
  function prepNotes(a) {
    const name = who(a);
    const notes = [];
    const experience = {
      partly: { text: 'Walk through the first round together, then let them lead.' },
      new: {
        text: 'Show how it’s done, let them try a piece, and give feedback soon after.',
        printText: ' The Team Development Map can help you plan support.',
        link: { href: '../team-development-map/index.html', label: 'Plan support with the Team Development Map (opens in a new tab)' }
      },
      unsure: { text: 'Ask how they’d approach it, or start with a small piece so you can see their work.' }
    }[a.experience];
    if (experience) notes.push(experience);
    const workload = {
      ifmoves: 'Agree with ' + name + ' on what comes off their plate, or what can wait, before the start date.',
      unknown: 'Ask about ' + name + '’s current workload before you finalize this.'
    }[a.workload];
    if (workload) notes.push({ text: workload });
    const talked = {
      concerns: 'Ask what would help, and build the answers into this brief.',
      notyet: 'Talk with ' + name + ' before you finalize this. Bring the brief as a draft and finish it together.'
    }[a.talked];
    if (talked) notes.push({ text: talked });
    const access = {
      approval: 'Get the access or approval in place before the start date.',
      unsure: 'List the tools, files, and permissions the work needs, and check each one.'
    }[a.access];
    if (access) notes.push({ text: access });
    notes.push({ text: 'Walk through the brief together and agree on the date of your first check-in.' });
    return notes;
  }

  function formatDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!m) return '';
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }
  function addDays(value, days) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!m) return '';
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days);
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // Step 4: one row per decision. Custom rows can be added and removed.
  function renderDecisions(wrap, api) {
    const a = api.answers;
    wrap.append(el('p', 'planner-tip', 'For each one, choose who makes the call. Choose “Doesn’t apply” for anything that won’t come up.'));
    const list = el('div', 'decision-list');
    wrap.append(list);

    function levelOptions(name, value, onChange, describedBy) {
      const opts = el('div', 'guide-options decision-options');
      levels.forEach((l, i) => {
        const lab = el('label');
        const input = el('input');
        input.type = 'radio';
        input.name = name;
        input.value = l.value;
        input.id = name + '-' + i;
        input.checked = value === l.value;
        if (describedBy) input.setAttribute('aria-describedby', describedBy);
        input.addEventListener('change', () => onChange(l.value));
        lab.append(input, el('span', null, l.label));
        opts.append(lab);
      });
      return opts;
    }

    decisions.forEach(d => {
      const card = el('div', 'decision-card');
      const set = el('fieldset');
      const legend = el('legend', 'decision-legend');
      const tag = el('span', 'tag', 'Suggested');
      legend.append(el('span', null, d.label + ' '), tag);
      set.append(legend);
      const updateTag = () => { tag.hidden = a.decisions[d.id] !== d.suggested; };
      let limitWrap;
      const onChange = value => {
        a.decisions[d.id] = value;
        updateTag();
        if (limitWrap) limitWrap.hidden = !['decide', 'tell'].includes(value);
        api.set('decisions', a.decisions);
      };
      set.append(levelOptions('decision-' + d.id, a.decisions[d.id], onChange));
      if (d.limit) {
        limitWrap = el('div', 'field decision-limit');
        const lab = el('label', null, 'Up to what amount? (optional)');
        lab.htmlFor = 'spend-limit';
        const hint = el('p', 'small field-hint', 'Example: $500. Anything over this amount stays with you.');
        hint.id = 'spend-limit-hint';
        const input = el('input');
        input.id = 'spend-limit';
        input.maxLength = 40;
        input.autocomplete = 'off';
        input.value = a.spendLimit || '';
        input.setAttribute('aria-describedby', 'spend-limit-hint');
        input.addEventListener('input', () => api.set('spendLimit', input.value));
        limitWrap.append(lab, hint, input);
        limitWrap.hidden = !['decide', 'tell'].includes(a.decisions[d.id]);
        set.append(limitWrap);
      }
      updateTag();
      card.append(set);
      list.append(card);
    });

    const customList = el('div', 'decision-list');
    wrap.append(customList);
    function renderCustom(focusId) {
      customList.replaceChildren();
      a.custom.forEach((c, index) => {
        const card = el('div', 'decision-card');
        const set = el('fieldset');
        set.append(el('legend', 'decision-legend', 'Your decision ' + (index + 1)));
        const textId = 'custom-text-' + c.id;
        const lab = el('label', null, 'Decision');
        lab.htmlFor = textId;
        const hint = el('p', 'small field-hint', 'Example: Choosing which vendors to follow up with');
        hint.id = textId + '-hint';
        const input = el('input');
        input.id = textId;
        input.maxLength = 200;
        input.autocomplete = 'off';
        input.value = c.text;
        input.setAttribute('aria-describedby', hint.id + ' err-' + textId);
        const textErr = api.errorSlot('err-' + textId);
        input.addEventListener('input', () => {
          c.text = input.value;
          if (input.value.trim()) { textErr.hidden = true; input.removeAttribute('aria-invalid'); }
          api.set('custom', a.custom);
        });
        const levelErr = api.errorSlot('err-custom-level-' + c.id);
        const opts = levelOptions('custom-level-' + c.id, c.level, value => {
          c.level = value;
          levelErr.hidden = true;
          opts.querySelectorAll('input').forEach(n => n.removeAttribute('aria-invalid'));
          api.set('custom', a.custom);
        }, 'err-custom-level-' + c.id);
        const remove = el('button', 'btn decision-remove', 'Remove');
        remove.type = 'button';
        remove.setAttribute('aria-label', 'Remove your decision ' + (index + 1));
        remove.addEventListener('click', () => {
          a.custom.splice(index, 1);
          api.set('custom', a.custom);
          renderCustom();
          addButton.focus();
          api.announce('Decision removed.');
        });
        const field = el('div', 'field');
        field.append(lab, hint, input, textErr);
        const levelSet = el('fieldset', 'decision-level');
        levelSet.append(el('legend', null, 'Who makes this call?'), opts, levelErr);
        set.append(field, levelSet, remove);
        card.append(set);
        customList.append(card);
      });
      if (focusId) document.getElementById(focusId)?.focus();
    }
    const addButton = el('button', 'btn decision-add', 'Add your own decision');
    addButton.type = 'button';
    addButton.addEventListener('click', () => {
      const id = a.customNext++;
      a.custom.push({ id, text: '', level: '' });
      api.set('custom', a.custom);
      renderCustom('custom-text-' + id);
    });
    renderCustom();
    wrap.append(addButton);
  }

  function validateDecisions(a) {
    const errors = [];
    a.custom.forEach(c => {
      if (!c.text.trim()) errors.push({ errorId: 'err-custom-text-' + c.id, focusId: 'custom-text-' + c.id, message: 'Name this decision, or remove it.' });
      if (!c.level) errors.push({ errorId: 'err-custom-level-' + c.id, focusId: 'custom-level-' + c.id + '-0', message: 'Choose who makes this call.' });
    });
    return errors;
  }

  // The brief: written to the person, so the two of you can go over it together.
  function decisionGroups(a) {
    const groups = { decide: [], tell: [], check: [] };
    const limit = (a.spendLimit || '').trim();
    decisions.forEach(d => {
      const level = a.decisions[d.id];
      if (!groups[level]) return;
      if (d.limit && limit && level !== 'check') {
        groups[level].push('Spending up to ' + limit);
        groups.check.push('Spending over ' + limit);
      } else groups[level].push(d.brief);
    });
    a.custom.forEach(c => { if (groups[c.level] && c.text.trim()) groups[c.level].push(c.text.trim()); });
    return groups;
  }

  function section(title, step, api, label) {
    const s = el('section', 'brief-section');
    const head = el('div', 'brief-section-head');
    const h = el('h3', null, title);
    const edit = el('button', 'btn brief-edit no-print', 'Edit');
    edit.type = 'button';
    edit.setAttribute('aria-label', 'Edit ' + label);
    edit.addEventListener('click', () => api.goTo(step));
    head.append(h, edit);
    s.append(head);
    return s;
  }
  function list(items) {
    const ul = el('ul');
    items.forEach(t => ul.append(el('li', null, t)));
    return ul;
  }

  function prepBox(a, cls, printing) {
    const box = el('section', 'prep-notes ' + cls);
    box.setAttribute('aria-labelledby', printing ? 'prep-print-title' : 'prep-title');
    const h = el('h3', null, printing ? 'Prep notes for this handoff' : 'Before you share it');
    h.id = printing ? 'prep-print-title' : 'prep-title';
    box.append(h);
    if (printing) box.append(el('p', 'small', 'For the leader. Not part of the brief. Handoff: ' + a.task.trim() + ', with ' + who(a) + '.'));
    const ul = el('ul');
    prepNotes(a).forEach(n => {
      const li = el('li', null, n.text + (printing && n.printText ? n.printText : ''));
      if (n.link && !printing) {
        const link = el('a', null, n.link.label);
        link.href = n.link.href;
        link.target = '_blank';
        link.rel = 'noopener';
        li.append(' ', link);
      }
      ul.append(li);
    });
    box.append(ul);
    if (!printing) box.append(el('p', 'small', 'These notes are for you. They print only if you choose to include them.'));
    return box;
  }

  function renderResult(container, a, api) {
    const head = el('div', 'result-head no-print');
    const h2 = el('h2', null, 'Your handoff brief');
    head.append(el('p', 'eyebrow', 'Your brief'), h2,
      el('p', null, 'Read it the way ' + who(a) + ' will. Use Edit to change any section, then print it and go over it together.'));
    container.append(head, prepBox(a, 'no-print', false));

    const actions = el('div', 'result-actions no-print');
    const print = el('button', 'btn primary', 'Print brief');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    const editAll = el('button', 'btn', 'Edit my answers');
    editAll.type = 'button';
    editAll.addEventListener('click', () => api.goTo(5));
    const again = el('button', 'btn', 'Start a new handoff');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    const include = el('label', 'check-option');
    const box = el('input');
    box.type = 'checkbox';
    box.id = 'include-prep';
    box.checked = !!a.includePrep;
    document.body.classList.toggle('include-prep', box.checked);
    box.addEventListener('change', () => {
      a.includePrep = box.checked;
      document.body.classList.toggle('include-prep', box.checked);
      api.announce(box.checked ? 'Prep notes will print on a separate page.' : 'Prep notes will not print.');
    });
    include.append(box, el('span', null, 'Include my prep notes on a separate page'));
    actions.append(print, editAll, again, include);
    container.append(actions,
      el('p', 'small no-print', 'Printed briefs include the names you entered. In the print window, choose “Save as PDF” to keep a digital copy, and turn off browser headers and footers for a cleaner page.'));

    // The brief itself
    const brief = el('article', 'brief');
    brief.setAttribute('aria-label', 'Handoff brief');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    const meta = ['For ' + who(a), a.start ? 'Starts ' + formatDate(a.start) : 'Start date to agree',
      a.kind === 'oneoff' ? 'One-time project' : 'Ongoing responsibility'];
    titleWrap.append(el('p', 'eyebrow', 'Handoff brief'), el('h3', 'brief-title', a.task.trim()), el('p', 'brief-meta', meta.join(' · ')));
    const editTop = el('button', 'btn brief-edit no-print', 'Edit');
    editTop.type = 'button';
    editTop.setAttribute('aria-label', 'Edit the task, person, and start date');
    editTop.addEventListener('click', () => api.goTo(0));
    top.append(titleWrap, editTop);
    brief.append(brand, top);

    const outcome = section('The outcome', 2, api, 'the outcome');
    const dl = el('dl');
    const pair = (term, text) => { if ((text || '').trim()) dl.append(el('dt', null, term), el('dd', null, text.trim())); };
    pair('What done looks like', a.done);
    pair('Why it matters', a.why);
    pair('Deadline or schedule', a.schedule);
    outcome.append(dl);
    if (['decide', 'tell'].includes(a.decisions.how)) {
      outcome.append(el('p', null, 'You choose how to get there. A different approach from mine can still be a good one.'));
    }
    brief.append(outcome);

    const decide = section('Who decides what', 3, api, 'who decides what');
    const groups = decisionGroups(a);
    const groupWrap = el('div', 'brief-groups');
    levels.slice(0, 3).forEach(l => {
      if (!groups[l.value].length) return;
      const g = el('div');
      g.append(el('h4', null, l.brief), list(groups[l.value]));
      groupWrap.append(g);
    });
    decide.append(groupWrap.children.length ? groupWrap : el('p', null, 'No decisions listed yet.'));
    brief.append(decide);

    const track = section('How we’ll know it’s on track', 4, api, 'how you’ll know it’s on track');
    track.append(list([a.measure1, a.measure2].map(m => (m || '').trim()).filter(Boolean)));
    track.append(el('p', null, (a.offTrack === 'sameday'
      ? 'If a measure goes off track, let me know the same day.'
      : 'If a measure goes off track, bring it to our next check-in with a plan.') + ' We’ll solve it together.'));
    brief.append(track);

    const checkins = section('Check-ins', 5, api, 'check-ins');
    checkins.append(el('p', null, 'We’ll check in ' + frequencyText[a.frequency] + ' ' + whereText[a.where] + '.'));
    let review;
    if (a.review === 'done') review = 'when the project is done';
    else {
      const days = reviewDays[a.review];
      const around = addDays(a.start, days);
      review = 'after ' + days + ' days' + (around ? ', around ' + around : '');
    }
    checkins.append(el('p', null, 'We’ll review how this handoff is going ' + review + ', and adjust together.'));
    // On screen only, for the leader. Opens in a new tab and carries no names or task text.
    const checkinTip = el('p', 'small no-print');
    const feedbackLink = el('a', null, 'Prepare that conversation with the Feedback Conversation Planner (opens in a new tab)');
    feedbackLink.href = '../feedback-conversation-planner/index.html';
    feedbackLink.target = '_blank';
    feedbackLink.rel = 'noopener';
    checkinTip.append('At check-ins, you may want to recognize what’s working or raise what needs to change. ', feedbackLink);
    checkins.append(checkinTip);
    brief.append(checkins);

    const chosen = commitments.filter(c => (a.commitments || []).includes(c.value));
    if (chosen.length) {
      const mine = section('What I’ll do', 5, api, 'what you’ll do');
      mine.append(list(chosen.map(c => c.brief)));
      brief.append(mine);
    }

    const notes = el('section', 'brief-section');
    notes.append(el('h3', null, 'Notes from our conversation'));
    notes.append(el('p', 'small no-print', 'Space to write on the printout.'));
    const lines = el('div', 'brief-lines');
    lines.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) lines.append(el('div'));
    notes.append(lines);
    brief.append(notes);

    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'This brief is a starting point. Review it together and change what doesn’t fit.'));
    foot.append(el('p', null, 'Made with the Pivot Labs Delegation Planner · ' + new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) +
      ' · Decision levels adapted from Oncken and Wass (1974).'));
    brief.append(foot);
    container.append(brief, prepBox(a, 'print-only prep-print', true));
  }

  const steps = [
    {
      id: 'handoff',
      title: 'The handoff',
      intro: 'Start with the work and the person you’re handing it to.',
      fields: [
        { id: 'task', type: 'textarea', label: 'What are you handing off?', hint: 'One task or responsibility. Example: Send the monthly vendor report', maxlength: 300, error: 'Enter the task or responsibility you’re handing off.' },
        { id: 'person', type: 'text', label: 'Who are you handing it to?', hint: 'First name or initials. Example: Jordan', maxlength: 60, error: 'Enter a first name or initials.',
          after: 'Think about who could grow from this work, not only the person you usually ask.' },
        { id: 'kind', type: 'choice', label: 'Is this one-time or ongoing?', options: [
          { value: 'oneoff', label: 'A one-time project' },
          { value: 'ongoing', label: 'An ongoing responsibility' }
        ] },
        { id: 'start', type: 'date', label: 'Start date', optional: true, hint: 'When they take it over. Leave blank if you’ll agree on it together.' }
      ]
    },
    {
      id: 'ready',
      title: 'Getting ready',
      intro: a => 'These answers shape the support and check-ins in your plan. They aren’t a judgment of ' + who(a) + '.',
      fields: [
        { id: 'experience', type: 'choice', label: a => 'Has ' + who(a) + ' done this task, or similar work, before?',
          hint: 'Think about work you’ve seen, not their title, how long they’ve been here, or how confident they sound.', options: [
            { value: 'done', label: 'Yes, they’ve done similar work well on their own.' },
            { value: 'partly', label: 'Partly. They’ve done pieces of it, or done it with help.' },
            { value: 'new', label: 'No, this is new to them.' },
            { value: 'unsure', label: 'I’m not sure. I haven’t seen them do this kind of work.' }
          ] },
        { id: 'workload', type: 'choice', label: a => 'Does ' + who(a) + ' have room for this right now?',
          hint: 'Think about their current workload and deadlines, not how hard they work.', options: [
            { value: 'room', label: 'Yes. We’ve talked, and they have room.' },
            { value: 'ifmoves', label: 'Only if something else comes off their plate.' },
            { value: 'unknown', label: 'I don’t know yet. I haven’t asked.' }
          ] },
        { id: 'talked', type: 'choice', label: a => 'Have you talked with ' + who(a) + ' about taking this on?', options: [
          { value: 'wants', label: 'Yes, and they want to.' },
          { value: 'concerns', label: 'Yes, and they raised questions or concerns.' },
          { value: 'notyet', label: 'Not yet.' }
        ] },
        { id: 'access', type: 'choice', label: 'Can you give them the access and authority this work needs?',
          hint: 'Tools, files, budget, and permission to make the calls in step 4.', options: [
            { value: 'yes', label: 'Yes.' },
            { value: 'approval', label: 'I’ll need approval or access from someone else.' },
            { value: 'unsure', label: 'I’m not sure what it needs.' }
          ] }
      ]
    },
    {
      id: 'outcome',
      title: 'The outcome',
      intro: a => 'Describe the result you need, and let ' + who(a) + ' choose the route.',
      fields: [
        { id: 'done', type: 'textarea', label: 'What does done look like?', maxlength: 2000,
          hint: 'Describe the finished result, not the steps. Example: A one-page report sent to the team by the 5th, with late vendors flagged.',
          error: 'Describe what done looks like.' },
        { id: 'why', type: 'textarea', label: 'Why does it matter?', optional: true, maxlength: 1000,
          hint: 'Example: Finance uses it to approve vendor payments on time.' },
        { id: 'schedule', type: 'text', label: 'Deadline or schedule', optional: true, maxlength: 200, hint: 'Example: Monthly, by the 5th' }
      ]
    },
    {
      id: 'decisions',
      title: 'Who decides what',
      intro: 'Agree on this now so decisions don’t drift back to you. Suggested choices are filled in. Change any that don’t fit.',
      fields: [{ id: 'decisions', type: 'custom', render: renderDecisions, validate: validateDecisions }]
    },
    {
      id: 'track',
      title: 'Staying on track',
      intro: 'Pick one or two signs you can both see without you having to ask.',
      fields: [
        { id: 'measure1', type: 'text', label: 'First measure', maxlength: 300,
          hint: 'A number, a date, or a yes or no. Example: Report sent by the 5th', error: 'Enter at least one measure.',
          after: 'Measure the result, not how busy someone looks.' },
        { id: 'measure2', type: 'text', label: 'Second measure', optional: true, maxlength: 300,
          hint: 'Example: No more than one correction from finance' },
        { id: 'offTrack', type: 'choice', label: a => 'If a measure goes off track, ' + who(a) + ' should:', options: [
          { value: 'nextcheckin', label: 'Bring it to our next check-in with a plan.' },
          { value: 'sameday', label: 'Tell me the same day.' }
        ] }
      ]
    },
    {
      id: 'checkins',
      title: 'Check-ins',
      intro: 'Set check-ins in advance so questions don’t turn into drop-bys, and decide how you’ll step back.',
      fields: [
        { id: 'frequency', type: 'choice', label: 'How often will you check in?',
          default: a => suggestFrequency(a)?.value || '',
          note: a => suggestFrequency(a)?.note || '', options: [
            { value: 'weekly', label: 'Weekly' },
            { value: 'biweekly', label: 'Every two weeks' },
            { value: 'monthly', label: 'Monthly' }
          ] },
        { id: 'where', type: 'choice', label: 'Where?', options: [
          { value: 'oneonone', label: 'Our regular one-on-one' },
          { value: 'team', label: 'Our team meeting' },
          { value: 'separate', label: 'A separate check-in' }
        ] },
        { id: 'review', type: 'choice', label: 'When will you review how the handoff is going?',
          hint: 'A few weeks is often too soon to judge an ongoing handoff.',
          default: a => (a.kind === 'oneoff' ? 'done' : 'd90'),
          note: a => (a.kind === 'ongoing' && a.review === 'done'
            ? 'This is an ongoing responsibility, so there may be no clear end. A set number of days may work better.' : ''),
          options: [
            { value: 'd30', label: 'After 30 days' },
            { value: 'd60', label: 'After 60 days' },
            { value: 'd90', label: 'After 90 days' },
            { value: 'done', label: 'When the project is done' }
          ] },
        { id: 'commitments', type: 'multi', label: 'What will you do to let go?', optional: true, hint: 'Choose any that fit.',
          options: commitments.map(c => ({ value: c.value, label: c.label })) }
      ]
    }
  ];

  function initialAnswers() {
    const levelsBySuggestion = {};
    decisions.forEach(d => { levelsBySuggestion[d.id] = d.suggested; });
    return {
      task: '', person: '', kind: '', start: '',
      experience: '', workload: '', talked: '', access: '',
      done: '', why: '', schedule: '',
      decisions: levelsBySuggestion, spendLimit: '', custom: [], customNext: 1,
      measure1: '', measure2: '', offTrack: '',
      frequency: '', where: '', review: '', commitments: [],
      includePrep: false
    };
  }
  const blank = JSON.stringify(initialAnswers());
  function isDirty(a) {
    const copy = { ...a, includePrep: false };
    return JSON.stringify(copy) !== blank;
  }

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your brief',
    // Exposed for testing the suggestion logic.
    suggestFrequency, prepNotes, decisionGroups };
})();
