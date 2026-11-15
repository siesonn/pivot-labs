'use strict';
/*
  Role Clarity Builder content: the steps, the repeating lists, the decision levels, the
  checklist, and the role clarity sheet.
  The step engine is shared: assets/js/guided-planner.js.

  Inspired by Cicely Simpson's "Role Clarity Document." The ideas (separate what a role runs,
  what it shares, and what belongs to someone else; name the people it depends on; separate
  what it decides alone from what it checks first; go through it together) are used here.
  The structure and wording are our own. Everything describes the role, never the person.
  Suggested decision levels are the same for everyone.
*/
const RoleClarityBuilder = (() => {
  const el = GuidedPlanner.el;
  const text = value => (value || '').trim();
  const isOwn = a => a.whose === 'own';
  const isTeam = a => a.whose === 'team';
  const personName = a => text(a.person);

  // Who has the last word on shared work
  const lastWord = [
    { value: 'role', label: 'This role' },
    { value: 'other', label: 'The other person or team' },
    { value: 'together', label: 'We decide together' },
    { value: 'open', label: 'Not settled yet' }
  ];
  const lastWordLabel = value => (lastWord.find(l => l.value === value) || {}).label || '';

  // Decision levels. The same suggested choices as the Delegation Planner, so the two tools agree.
  const levels = [
    { value: 'decide', label: 'Decides without checking' },
    { value: 'tell', label: 'Decides, then lets people know' },
    { value: 'check', label: 'Checks first' },
    { value: 'na', label: 'Doesn’t apply' }
  ];
  const decisions = [
    { id: 'how', label: 'How to do the work: methods, tools, and order of steps', brief: 'How to do the work', suggested: 'decide' },
    { id: 'priorities', label: 'Day-to-day priorities', brief: 'Day-to-day priorities', suggested: 'decide' },
    { id: 'spending', label: 'Spending money', brief: 'Spending money', suggested: 'check', limit: true },
    { id: 'deadline', label: 'Changing a deadline other people are counting on', brief: 'Changing a deadline other people are counting on', suggested: 'check' },
    { id: 'scope', label: 'Changing what a piece of work is meant to deliver', brief: 'Changing what a piece of work is meant to deliver', suggested: 'check' },
    { id: 'help', label: 'Asking others for help', brief: 'Asking others for help', suggested: 'tell' },
    { id: 'updates', label: 'Updates to senior leaders, clients, or other teams', brief: 'Updates to senior leaders, clients, or other teams', suggested: 'tell' }
  ];

  // Who the leader will go through the sheet with. The choices depend on whose role it is.
  const readerOwn = [
    { value: 'manager', label: 'My manager' },
    { value: 'team', label: 'My team' },
    { value: 'other', label: 'Someone else' }
  ];
  const readerTeam = [
    { value: 'person', label: 'The person in this role' },
    { value: 'manager', label: 'My manager' },
    { value: 'team', label: 'My team' },
    { value: 'other', label: 'Someone else' }
  ];
  const readerValue = a => (isOwn(a) ? a.readerOwn : isTeam(a) ? a.readerTeam : '');
  function readerText(a) {
    switch (readerValue(a)) {
      case 'manager': return 'my manager';
      case 'team': return 'my team';
      case 'person': return personName(a) || 'the person in this role';
      case 'other': return text(a.readerOther) || 'someone else';
      default: return '';
    }
  }

  const revisitOptions = [
    { value: 'd30', label: 'In 30 days' },
    { value: 'd90', label: 'In 90 days' },
    { value: 'change', label: 'When the role or team changes' },
    { value: 'review', label: 'At the next review' }
  ];

  const checks = [
    { value: 'results', label: 'I wrote results, not tasks.',
      reminder: 'Look at what the role runs. Rewrite any task as the result the role answers for.' },
    { value: 'lastword', label: 'Every shared item has a name beside it and a last word, or is marked not settled.',
      reminder: 'For each shared item, add who it’s shared with and who has the last word, or mark it not settled yet.' },
    { value: 'others', label: 'I named what belongs to someone else, including what people might assume is this role’s.',
      reminder: 'Think about what people might assume this role handles, and name whose it is.' },
    { value: 'same', label: 'I’d describe this role the same way no matter who holds it.',
      reminder: 'Reread each line. If it describes a person instead of the role, change it.' },
    { value: 'ahead', label: 'I’m sending it a day ahead so there’s time to read.',
      reminder: 'Send it at least a day before you meet, so nobody reads it for the first time in the room.' }
  ];
  const reminders = a => checks.filter(c => !(a.checks || []).includes(c.value)).map(c => c.reminder);

  // The repeating lists. Each row is an object with an id and one value per column.
  const lists = {
    runs: {
      word: 'Item', max: 6, requireOne: true, noneError: 'Add at least one thing this role runs.',
      lead: a => ({
        question: isOwn(a) ? 'What do you decide and answer for in this role?' : 'What does this role decide and answer for?',
        hint: 'Add one to six. Write results the role answers for, not tasks it does. Example: The weekly plan for the team, not “update the spreadsheet.”'
      }),
      columns: [{ id: 'text', label: 'What the role runs', maxlength: 200, req: true, error: 'Fill this in or remove the item.',
        placeholder: 'Example: Who gets assigned to which request' }]
    },
    shared: {
      word: 'Shared item', max: 5,
      lead: () => ({
        question: 'What work does this role share with others?',
        hint: 'Work that needs more than one person or team to get done. Leave it blank if nothing comes to mind.'
      }),
      columns: [
        { id: 'work', label: 'The shared work', maxlength: 200, req: true, error: 'Name the shared work, or remove the item.', hint: 'Example: The quarterly plan' },
        { id: 'with', label: 'Shared with', maxlength: 120, hint: 'A role or team is enough. Example: Finance team' },
        { id: 'last', label: 'Who has the last word?', type: 'select', req: true, error: 'Choose who has the last word.',
          options: lastWord, hint: 'If it isn’t clear, choose “Not settled yet.” It goes on the list of what to agree on.' }
      ]
    },
    others: {
      word: 'Item', max: 5,
      lead: () => ({
        question: 'What work belongs to someone else?',
        hint: 'Think about what people might assume this role handles. Naming it now saves a harder conversation later.'
      }),
      columns: [
        { id: 'work', label: 'The work', maxlength: 200, req: true, error: 'Name the work, or remove the item.', hint: 'Example: Choosing the software vendor' },
        { id: 'whose', label: 'Whose it is', maxlength: 120, req: true, error: 'Say whose it is.', hint: 'A role or team is enough. Example: IT director' }
      ]
    },
    people: {
      word: 'Person or group', max: 6, two: true,
      lead: a => ({
        question: isOwn(a) ? 'Who do you work with most, and what does each side need?' : 'Who does this role work with most, and what does each side need?',
        hint: 'Describe the working relationship, not what you think of the person. Use roles or first names. Leave it blank if you’d rather skip it.'
      }),
      columns: [
        { id: 'who', label: 'Name or role', maxlength: 100, req: true, error: 'Enter a name or role, or remove the row.', hint: 'Example: Finance partner' },
        { id: 'team', label: 'Team or department', maxlength: 100, hint: 'Example: Finance' },
        { id: 'needs', label: 'What this role needs from them', maxlength: 200, hint: 'Example: Budget numbers by the 5th' },
        { id: 'gives', label: 'What they need from this role', maxlength: 200, hint: 'Example: Staffing changes, as soon as they’re known' }
      ]
    }
  };
  const columnIds = key => lists[key].columns.map(c => c.id);
  const blankRow = (key, id) => { const r = { id }; columnIds(key).forEach(c => { r[c] = ''; }); return r; };
  const filled = (key, row) => columnIds(key).some(c => text(row[c]));
  const kept = (a, key) => a[key].filter(r => filled(key, r));
  const inputId = (key, rowId, col) => key + '-' + rowId + '-' + col;
  const errId = (key, rowId, col) => 'err-' + inputId(key, rowId, col);

  function renderRows(key, wrap, api) {
    const o = lists[key];
    const a = api.answers;
    const lead = o.lead(a);
    wrap.append(el('p', 'row-question', lead.question));
    if (lead.hint) wrap.append(el('p', 'small field-hint', lead.hint));
    const list = el('div', 'row-list');
    wrap.append(list);
    const single = o.columns.length === 1;

    function draw(focusId) {
      list.replaceChildren();
      a[key].forEach((row, index) => {
        const card = el('div', 'row-card');
        const set = el('fieldset');
        set.append(el('legend', 'row-legend', o.word + ' ' + (index + 1)));
        const grid = el('div', 'row-fields' + (o.two ? ' two' : ''));
        o.columns.forEach(c => {
          const field = el('div', 'field');
          const id = inputId(key, row.id, c.id);
          const label = el('label', null, single ? o.word + ' ' + (index + 1) + ' (what the role runs)' : c.label + (c.req ? '' : ' (optional)'));
          label.htmlFor = id;
          if (single) label.className = 'visually-hidden';
          field.append(label);
          const described = [];
          if (c.hint) {
            const h = el('p', 'small field-hint', c.hint);
            h.id = id + '-hint';
            field.append(h);
            described.push(h.id);
          }
          let input;
          const slot = api.errorSlot(errId(key, row.id, c.id));
          described.push(slot.id);
          const clear = () => { slot.hidden = true; input.removeAttribute('aria-invalid'); };
          if (c.type === 'select') {
            input = el('select');
            const none = el('option', null, 'Choose one');
            none.value = '';
            input.append(none);
            c.options.forEach(opt => { const op = el('option', null, opt.label); op.value = opt.value; input.append(op); });
            input.value = row[c.id];
            input.addEventListener('change', () => {
              row[c.id] = input.value;
              if (input.value) clear();
              api.set(key, a[key]);
            });
          } else {
            input = el('input');
            input.type = 'text';
            input.autocomplete = 'off';
            input.maxLength = c.maxlength;
            if (c.placeholder) input.placeholder = c.placeholder;
            input.value = row[c.id];
            input.addEventListener('input', () => {
              row[c.id] = input.value;
              if (text(input.value)) clear();
              api.set(key, a[key]);
            });
          }
          input.id = id;
          input.setAttribute('aria-describedby', described.join(' '));
          field.append(input, slot);
          grid.append(field);
        });
        set.append(grid);
        if (a[key].length > 1) {
          const remove = el('button', 'btn row-remove', 'Remove');
          remove.type = 'button';
          remove.setAttribute('aria-label', 'Remove ' + o.word.toLowerCase() + ' ' + (index + 1));
          remove.addEventListener('click', () => {
            a[key].splice(index, 1);
            api.set(key, a[key]);
            draw();
            const next = wrap.querySelector('button.row-add');
            if (next) next.focus(); else list.querySelector('input,select')?.focus();
            api.announce('Removed.');
          });
          set.append(remove);
        }
        card.append(set);
        list.append(card);
      });
      if (wrap.querySelector('.row-add')) wrap.querySelector('.row-add').remove();
      if (a[key].length < o.max) {
        const add = el('button', 'btn row-add', single ? 'Add another' : 'Add another ' + o.word.toLowerCase());
        add.type = 'button';
        add.addEventListener('click', () => {
          const row = blankRow(key, a.nextRow++);
          a[key].push(row);
          api.set(key, a[key]);
          draw(inputId(key, row.id, o.columns[0].id));
        });
        wrap.append(add);
      } else {
        wrap.append(el('p', 'small row-add', 'That’s the most this list holds (' + o.max + ').'));
      }
      if (focusId) document.getElementById(focusId)?.focus();
    }
    draw();
  }

  function validateRows(key, a) {
    const o = lists[key];
    const errors = [];
    const rows = a[key];
    const first = o.columns[0].id;
    if (o.requireOne && !rows.some(r => filled(key, r))) {
      errors.push({ errorId: errId(key, rows[0].id, first), focusId: inputId(key, rows[0].id, first), message: o.noneError });
    }
    rows.forEach(r => {
      if (!filled(key, r)) return;
      o.columns.forEach(c => {
        if (c.req && !text(r[c.id])) errors.push({ errorId: errId(key, r.id, c.id), focusId: inputId(key, r.id, c.id), message: c.error });
      });
    });
    return errors;
  }
  const listField = key => ({ id: key, type: 'custom', render: (wrap, api) => renderRows(key, wrap, api), validate: a => validateRows(key, a) });

  // Step 5: one card per decision, plus the leader's own. The same suggested choices for every role.
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
        const hint = el('p', 'small field-hint', 'Example: $500. Anything over this amount is checked first.');
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
    wrap.append(el('p', 'planner-tip', 'Pay, hiring, and changes to someone’s job: check with HR before you decide.'));
  }

  function validateDecisions(a) {
    const errors = [];
    a.custom.forEach(c => {
      if (!c.text.trim()) errors.push({ errorId: 'err-custom-text-' + c.id, focusId: 'custom-text-' + c.id, message: 'Name this decision, or remove it.' });
      if (!c.level) errors.push({ errorId: 'err-custom-level-' + c.id, focusId: 'custom-level-' + c.id + '-0', message: 'Choose who makes this call.' });
    });
    return errors;
  }

  function decisionGroups(a) {
    const groups = { decide: [], tell: [], check: [] };
    const limit = text(a.spendLimit);
    decisions.forEach(d => {
      const level = a.decisions[d.id];
      if (!groups[level]) return;
      if (d.limit && limit && level !== 'check') {
        groups[level].push('Spending up to ' + limit);
        groups.check.push('Spending over ' + limit);
      } else groups[level].push(d.brief);
    });
    a.custom.forEach(c => { if (groups[c.level] && text(c.text)) groups[c.level].push(text(c.text)); });
    return groups;
  }

  function addDays(value, days) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!m) return '';
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days);
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }
  function formatDate(value) { return addDays(value, 0); }
  function revisitText(a) {
    const days = { d30: 30, d90: 90 }[a.revisit];
    if (days) {
      const around = addDays(a.when, days);
      return 'in ' + days + ' days' + (around ? ', around ' + around : '');
    }
    return { change: 'when the role or team changes', review: 'at the next review' }[a.revisit] || '';
  }

  // Items for "Where we need to agree": unsettled shared work, plus the leader's own notes.
  function toAgree(a) {
    const out = [];
    kept(a, 'shared').forEach(r => {
      if (r.last === 'open') out.push('Who has the last word on ' + text(r.work) + (text(r.with) ? ' (shared with ' + text(r.with) + ')' : ''));
    });
    if (text(a.confirm)) out.push('To confirm: ' + text(a.confirm));
    if (text(a.unsure)) out.push('Least sure about: ' + text(a.unsure));
    return out;
  }

  // The sheet
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
  function list(items, tag = 'ul') {
    const ul = el(tag);
    items.forEach(t => ul.append(el('li', null, t)));
    return ul;
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
    const own = isOwn(a);
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your sheet'), el('h2', null, 'Your role clarity sheet'),
      el('p', null, 'Use Edit to change any section, then print it or save it as a PDF. Go through it with ' + (readerText(a) || 'them') + ' one section at a time.'));
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
    const print = el('button', 'btn primary', 'Print sheet');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    const editAll = el('button', 'btn', 'Edit my answers');
    editAll.type = 'button';
    editAll.addEventListener('click', () => api.goTo(0));
    const again = el('button', 'btn', 'Start a new sheet');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    actions.append(print, editAll, again);
    container.append(actions,
      el('p', 'small no-print', 'Printed sheets include the names you entered. In the print window, choose “Save as PDF” to keep a digital copy, and turn off browser headers and footers for a cleaner page.'));

    const brief = el('article', 'brief');
    brief.setAttribute('aria-label', 'Role clarity sheet');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    const meta = [];
    if (!own && personName(a)) meta.push('Held by ' + personName(a));
    if (readerText(a)) meta.push('To go through with ' + readerText(a));
    if (a.when) meta.push('Conversation: ' + formatDate(a.when));
    titleWrap.append(el('p', 'eyebrow', 'Role clarity sheet'), el('h3', 'brief-title', text(a.title)));
    if (meta.length) titleWrap.append(el('p', 'brief-meta', meta.join(' · ')));
    if (text(a.prompting)) titleWrap.append(el('p', 'brief-meta', 'Why now: ' + text(a.prompting)));
    const editTop = el('button', 'btn brief-edit no-print', 'Edit');
    editTop.type = 'button';
    editTop.setAttribute('aria-label', 'Edit the role, who it’s for, and when');
    editTop.addEventListener('click', () => api.goTo(0));
    top.append(titleWrap, editTop);
    brief.append(brand, top);

    const runs = section(own ? 'Mine to run' : 'This role runs', 1, api, 'what the role runs');
    runs.append(list(kept(a, 'runs').map(r => text(r.text))));
    brief.append(runs);

    const sharedRows = kept(a, 'shared');
    if (sharedRows.length) {
      const s = section('Shared with others', 2, api, 'shared work');
      s.append(table(['Work', 'Shared with', 'Last word'], sharedRows.map(r => [text(r.work), text(r.with), lastWordLabel(r.last)])));
      brief.append(s);
    }

    const otherRows = kept(a, 'others');
    if (otherRows.length) {
      const s = section('Belongs to someone else', 2, api, 'work that belongs to someone else');
      s.append(table(['Work', 'Whose it is'], otherRows.map(r => [text(r.work), text(r.whose)])));
      brief.append(s);
    }

    const peopleRows = kept(a, 'people');
    if (peopleRows.length) {
      const s = section(own ? 'People I work with' : 'People this role works with', 3, api, 'the people you work with');
      s.append(table(['Name or role', 'Team', 'The role needs', 'They need'],
        peopleRows.map(r => [text(r.who), text(r.team), text(r.needs), text(r.gives)])));
      brief.append(s);
    }

    const decide = section('Decisions', 4, api, 'decisions');
    const groups = decisionGroups(a);
    const groupWrap = el('div', 'brief-groups');
    levels.slice(0, 3).forEach(l => {
      if (!groups[l.value].length) return;
      const g = el('div');
      g.append(el('h4', null, l.label), list(groups[l.value]));
      groupWrap.append(g);
    });
    decide.append(groupWrap.children.length ? groupWrap : el('p', null, 'No decisions listed yet.'));
    brief.append(decide);

    const agree = toAgree(a);
    if (agree.length) {
      const s = section('Where we need to agree', 5, api, 'what you want to agree on');
      s.append(list(agree));
      brief.append(s);
    }

    const how = el('section', 'brief-section');
    how.append(el('h3', null, 'How to use this sheet'));
    how.append(list(['Read this before we meet.', 'Go through it one section at a time.', 'Write down what changes, and agree on it before we finish.'], 'ol'));
    if (revisitText(a)) how.append(el('p', null, 'We’ll look at it again ' + revisitText(a) + '.'));
    brief.append(how);

    const notes = el('section', 'brief-section');
    notes.append(el('h3', null, 'Notes'));
    notes.append(el('p', 'small no-print', 'Space to write on the printout.'));
    const lines = el('div', 'brief-lines');
    lines.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) lines.append(el('div'));
    notes.append(lines);
    brief.append(notes);

    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'This sheet is a starting point for a conversation about one role, not a description of a person. Change what doesn’t fit.'));
    foot.append(el('p', null, 'Made with the Pivot Labs Role Clarity Builder · ' + new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) +
      ' · Inspired by Cicely Simpson’s Role Clarity Document. Decision levels adapted from Oncken and Wass (1974).'));
    brief.append(foot);
    container.append(brief);
  }

  const steps = [
    {
      id: 'role',
      title: 'The role',
      intro: 'Start with the role and who you’ll go through the sheet with. The sheet is about the role, not the person.',
      fields: [
        { id: 'whose', type: 'choice', label: 'Whose role is this?', options: [
          { value: 'own', label: 'My own role' },
          { value: 'team', label: 'A role on my team' }
        ], error: 'Choose whose role this is.' },
        { id: 'title', type: 'text', maxlength: 100, label: 'What’s the role called?',
          hint: 'The title or a plain description. Example: Operations supervisor', error: 'Enter the role.' },
        { id: 'person', type: 'text', maxlength: 60, optional: true, showIf: isTeam, label: 'Who holds the role?',
          hint: 'First name or initials. Example: Jordan' },
        { id: 'readerOwn', type: 'choice', showIf: isOwn, label: 'Who will you go through this with?', options: readerOwn,
          error: 'Choose who you’ll go through it with.' },
        { id: 'readerTeam', type: 'choice', showIf: isTeam, label: 'Who will you go through this with?', options: readerTeam,
          after: 'Go through it with them rather than handing it over. A sheet agreed together works better than one written for someone.',
          error: 'Choose who you’ll go through it with.' },
        { id: 'readerOther', type: 'text', maxlength: 100, showIf: a => readerValue(a) === 'other', label: 'Who?',
          hint: 'A role or title is enough. Example: The new regional director', error: 'Enter who you’ll go through it with.' },
        { id: 'prompting', type: 'text', maxlength: 200, optional: true, label: 'What’s prompting this?',
          hint: 'A new manager, a new role, or work that keeps falling between people are all good reasons.' },
        { id: 'when', type: 'date', optional: true, label: 'When will you talk it through?', hint: 'Leave blank if it isn’t set yet.' }
      ]
    },
    {
      id: 'runs',
      title: 'What the role runs',
      intro: 'Start with what’s clearly this role’s to run.',
      fields: [listField('runs')]
    },
    {
      id: 'shared',
      title: 'Shared and someone else’s',
      intro: 'Two short lists. Both are optional, and both save a harder conversation later.',
      fields: [listField('shared'), listField('others')]
    },
    {
      id: 'people',
      title: 'People the role works with',
      intro: 'Name the people this role depends on and the people who depend on it. This list is optional.',
      fields: [listField('people')]
    },
    {
      id: 'decisions',
      title: 'Decisions',
      intro: 'Agree on this so decisions don’t land in the wrong place. Suggested choices are filled in, and they’re the same for every role. Change any that don’t fit.',
      fields: [{ id: 'decisions', type: 'custom', render: renderDecisions, validate: validateDecisions }]
    },
    {
      id: 'talk',
      title: 'Talk it through',
      intro: 'A few last questions, and a quick check. All of them are optional.',
      fields: [
        { id: 'confirm', type: 'text', maxlength: 300, optional: true, label: 'What do you most want to confirm?',
          hint: 'Example: Who signs off on changes to the schedule' },
        { id: 'unsure', type: 'text', maxlength: 300, optional: true, label: 'What are you least sure about?',
          hint: 'Example: Whether onboarding belongs to this role or to HR' },
        { id: 'revisit', type: 'choice', label: 'When will you look at this again?', default: () => 'd90', options: revisitOptions,
          hint: 'A role changes over time, so set a date to check that the sheet still fits.' },
        { id: 'checks', type: 'multi', optional: true, label: 'Before you share it, check what’s true.', hint: 'Choose any that fit.',
          options: checks.map(c => ({ value: c.value, label: c.label })),
          after: 'Unchecked items turn into reminders next to your sheet. They don’t print.' }
      ]
    }
  ];

  function initialAnswers() {
    const levelsBySuggestion = {};
    decisions.forEach(d => { levelsBySuggestion[d.id] = d.suggested; });
    return {
      whose: '', title: '', person: '', readerOwn: '', readerTeam: '', readerOther: '', prompting: '', when: '',
      runs: [blankRow('runs', 1)], shared: [blankRow('shared', 2)], others: [blankRow('others', 3)], people: [blankRow('people', 4)],
      nextRow: 5,
      decisions: levelsBySuggestion, spendLimit: '', custom: [], customNext: 1,
      confirm: '', unsure: '', revisit: '', checks: []
    };
  }
  // Blank rows and the row counter don't count as work, so adding and removing an empty row doesn't warn on leaving.
  function normalized(a) {
    const copy = { ...a, nextRow: 0 };
    Object.keys(lists).forEach(key => { copy[key] = a[key].filter(r => filled(key, r)).map(r => ({ ...r, id: 0 })); });
    return JSON.stringify(copy);
  }
  const blank = normalized(initialAnswers());
  const isDirty = a => normalized(a) !== blank;

  return { steps, initialAnswers, isDirty, renderResult, resultTitle: 'Your sheet', finishLabel: 'Review my sheet',
    // Exposed for testing.
    decisionGroups, toAgree, reminders, readerText, revisitText, checks, lists, kept };
})();
