'use strict';
/*
  Johari Window content: the word list, the two steps, and the window.
  The step engine is shared: assets/js/guided-planner.js.

  The Johari Window was created by Joseph Luft and Harrington Ingham (1955). The name joins their
  first names, Joe and Harry. The four boxes (Open, Blind spot, Hidden, Unknown) follow their model.
  The word list, questions and wording are Pivot Labs' own. Built from public sources only.

  How it works: the person picks five or six words for themselves (step 1). One or more people pick
  five or six words for them from the same list (step 2). Each word lands in one box:
    Open       the person picked it and at least one other person did
    Blind spot others picked it, the person didn't
    Hidden     the person picked it, no one else did
    Unknown    no one picked it

  Bias Check: every word is a strength; the list includes quieter strengths (steady, reflective,
  observant, careful) so a quieter style is not underrated; pickers stay unnamed; each set of picks
  hides once it's added, so people pick on their own; counts show how many people picked a word,
  never a score; an empty box is never a problem; it is for conversation, not reviews or hiring;
  the same picks always give the same window.

  Nothing is saved or sent. Picks live in this page until it closes.
*/
const JohariWindow = (() => {
  const el = GuidedPlanner.el;
  const text = value => (value || '').trim();
  const MIN = 3;
  const MAX = 6;
  const MAX_PEOPLE = 10;

  // 48 words in four groups, A to Z within each group. Groups are only for scanning.
  const groups = [
    { name: 'Getting work done', words: ['careful', 'decisive', 'dependable', 'efficient', 'energetic', 'focused', 'organized', 'persistent', 'practical', 'prepared', 'resourceful', 'thorough'] },
    { name: 'Working with people', words: ['approachable', 'attentive', 'collaborative', 'diplomatic', 'encouraging', 'fair', 'generous', 'inclusive', 'patient', 'respectful', 'supportive', 'warm'] },
    { name: 'Thinking', words: ['analytical', 'creative', 'curious', 'imaginative', 'insightful', 'knowledgeable', 'logical', 'observant', 'open-minded', 'reflective', 'strategic', 'thoughtful'] },
    { name: 'When things get hard', words: ['accountable', 'adaptable', 'brave', 'calm', 'candid', 'confident', 'honest', 'humble', 'optimistic', 'resilient', 'steady', 'trustworthy'] }
  ];
  const allWords = groups.flatMap(g => g.words);
  const order = word => allWords.indexOf(word);

  const owner = a => text(a.name);
  const possessive = name => name + (/s$/i.test(name) ? '’' : '’s');
  const subject = a => owner(a) || 'this person';
  const finished = a => a.others.filter(p => !p.open && p.words.length >= MIN);

  // Sort each word into its box. Counts are how many of the other people picked it.
  function windowOf(a) {
    const people = finished(a);
    const count = word => people.filter(p => p.words.includes(word)).length;
    const mine = a.self || [];
    const byCount = (x, y) => count(y) - count(x) || order(x) - order(y);
    const open = mine.filter(w => count(w) > 0).sort(byCount);
    const hidden = mine.filter(w => count(w) === 0).sort((x, y) => order(x) - order(y));
    const blind = allWords.filter(w => !mine.includes(w) && count(w) > 0).sort(byCount);
    const unknown = allWords.filter(w => !mine.includes(w) && count(w) === 0);
    return { people: people.length, count, open, blind, hidden, unknown };
  }

  // The word picker, used for the person's own words and for each other person.
  // Checkboxes in four groups; stops at six with a message instead of a seventh check.
  function picker(prefix, chosen, onChange, labelText) {
    const wrap = el('div', 'jw-picker');
    const counter = el('p', 'jw-count');
    counter.setAttribute('aria-live', 'polite');
    const say = extra => {
      counter.textContent = chosen.length + ' of ' + MAX + ' picked' + (extra ? '. ' + extra : '');
    };
    groups.forEach((g, gi) => {
      const set = el('fieldset', 'jw-group');
      set.append(el('legend', null, g.name));
      const opts = el('div', 'jw-words');
      g.words.forEach(word => {
        const lab = el('label', 'jw-word');
        const input = el('input');
        input.type = 'checkbox';
        input.value = word;
        input.id = prefix + '-' + gi + '-' + word;
        input.checked = chosen.includes(word);
        input.addEventListener('change', () => {
          if (input.checked && chosen.length >= MAX) {
            input.checked = false;
            say('That’s six. Uncheck one to swap it.');
            return;
          }
          const i = chosen.indexOf(word);
          if (input.checked && i < 0) chosen.push(word);
          if (!input.checked && i >= 0) chosen.splice(i, 1);
          say();
          onChange();
        });
        lab.append(input, el('span', null, word));
        opts.append(lab);
      });
      set.append(opts);
      wrap.append(set);
    });
    say();
    if (labelText) wrap.setAttribute('aria-label', labelText);
    return { node: wrap, counter };
  }

  // Step 1: the person's own words
  const selfField = {
    id: 'self', type: 'custom',
    render(container, api) {
      const a = api.answers;
      container.append(el('p', 'jw-ask', 'Pick five or six words that describe you at work. Go with your first instinct.'));
      const p = picker('self', a.self, () => {
        const slot = document.getElementById('err-self');
        if (slot && a.self.length >= MIN) slot.hidden = true;
        api.refresh();
      });
      const err = api.errorSlot('err-self');
      container.append(p.counter, p.node, err);
      p.node.querySelector('input').id = 'self-first';
    },
    validate(a) {
      if (a.self.length >= MIN) return [];
      return [{ errorId: 'err-self', focusId: 'self-first',
        message: 'Pick at least three words, ideally five or six.' }];
    }
  };

  // Print the word list on its own, for people picking on paper
  const teamField = {
    id: 'team', type: 'custom',
    render(container) {
      const panel = el('div', 'jw-team no-print');
      panel.append(el('h3', null, 'Running this with a team?'),
        el('p', null, 'Print the word list so people can pick on paper, then enter their picks here.'));
      const btn = el('button', 'btn', 'Print the word list');
      btn.type = 'button';
      btn.addEventListener('click', printWordList);
      panel.append(btn);
      container.append(panel);
    }
  };

  function printWordList() {
    document.body.classList.add('print-words');
    const done = () => { document.body.classList.remove('print-words'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    // Some browsers don't fire afterprint; clear the class shortly after either way.
    setTimeout(done, 1000);
  }

  // Step 2: other people's words. Each set hides once it's added.
  const othersField = {
    id: 'others', type: 'custom',
    render(container, api) {
      const a = api.answers;
      const list = el('ul', 'jw-people');
      const addBtn = el('button', 'btn', 'Add a person');
      addBtn.type = 'button';
      addBtn.id = 'others-add';
      const editor = el('div', 'jw-editor');
      const err = api.errorSlot('err-others');
      const tip = el('p', 'planner-tip', 'Three or more people give you a fuller picture. You can add up to ten.');

      function draw(focusId) {
        list.replaceChildren();
        editor.replaceChildren();
        editor.hidden = true;
        const openIndex = a.others.findIndex(p => p.open);
        a.others.forEach((person, i) => {
          if (person.open) return;
          const li = el('li');
          const n = person.words.length;
          li.append(el('span', 'jw-person', 'Person ' + (i + 1) + ' · ' + n + (n === 1 ? ' word' : ' words')));
          const actions = el('span', 'jw-person-actions');
          const edit = el('button', 'btn', 'Edit');
          edit.type = 'button';
          edit.id = 'others-edit-' + i;
          edit.setAttribute('aria-label', 'Edit person ' + (i + 1) + '’s words');
          edit.disabled = openIndex >= 0;
          edit.addEventListener('click', () => { person.backup = person.words.slice(); person.open = true; draw(); });
          const remove = el('button', 'btn', 'Remove');
          remove.type = 'button';
          remove.setAttribute('aria-label', 'Remove person ' + (i + 1));
          remove.disabled = openIndex >= 0;
          remove.addEventListener('click', () => {
            a.others.splice(i, 1);
            api.announce('Person ' + (i + 1) + ' removed.');
            api.refresh();
            draw('others-add');
          });
          actions.append(edit, remove);
          li.append(actions);
          list.append(li);
        });
        list.hidden = !a.others.some(p => !p.open);
        addBtn.hidden = openIndex >= 0 || a.others.length >= MAX_PEOPLE;

        if (openIndex >= 0) {
          const person = a.others[openIndex];
          editor.hidden = false;
          const h = el('h3', null, 'Person ' + (openIndex + 1));
          h.id = 'others-editor-title';
          h.tabIndex = -1;
          editor.append(h,
            el('p', 'jw-ask', 'Pick five or six words that describe ' + subject(a) + ' at work. Pick on your own, and go with your first instinct.'),
            el('p', 'small', 'If they sent you their words, check the same ones here.'));
          const p = picker('person' + openIndex, person.words, () => {
            const slot = document.getElementById('err-person');
            if (slot && person.words.length >= MIN) slot.hidden = true;
            api.refresh();
          });
          const perr = api.errorSlot('err-person');
          const row = el('div', 'jw-editor-actions');
          const done = el('button', 'btn primary', 'Done, hide these words');
          done.type = 'button';
          done.addEventListener('click', () => {
            if (person.words.length < MIN) {
              perr.querySelector('.field-error-text').textContent = 'Pick at least three words, ideally five or six.';
              perr.hidden = false;
              p.node.querySelector('input').focus();
              return;
            }
            person.open = false;
            delete person.backup;
            api.announce('Person ' + (openIndex + 1) + '’s words are added and hidden.');
            api.refresh();
            draw('others-add');
          });
          const cancel = el('button', 'btn', 'Cancel');
          cancel.type = 'button';
          cancel.addEventListener('click', () => {
            if (person.backup) { person.words = person.backup; delete person.backup; person.open = false; }
            else a.others.splice(openIndex, 1);
            api.refresh();
            draw('others-add');
          });
          row.append(done, cancel);
          editor.append(p.counter, p.node, perr, row);
          h.focus({ preventScroll: false });
        }
        if (focusId) {
          const target = document.getElementById(focusId);
          if (target && !target.hidden) target.focus();
        }
      }

      addBtn.addEventListener('click', () => {
        a.others.push({ words: [], open: true });
        const slot = document.getElementById('err-others');
        if (slot) slot.hidden = true;
        api.refresh();
        draw();
      });

      container.append(list, editor, addBtn, err, tip);
      draw();
    },
    validate(a) {
      if (a.others.some(p => p.open)) {
        return [{ errorId: 'err-others', focusId: 'others-editor-title',
          message: 'Finish this person’s words with “Done, hide these words,” or cancel.' }];
      }
      if (finished(a).length) return [];
      return [{ errorId: 'err-others', focusId: 'others-add',
        message: 'Add at least one person’s words to see your window.' }];
    }
  };

  const steps = [
    {
      id: 'mine',
      title: 'Your words',
      intro: 'Start with how you see yourself. Nobody else needs to see these.',
      fields: [
        { id: 'name', type: 'text', optional: true, maxlength: 40, label: 'Whose window is this?',
          hint: 'A first name is enough. It shows on your window and in the next step.' },
        selfField,
        teamField
      ]
    },
    {
      id: 'theirs',
      title: 'Their words',
      intro: 'Add each person’s picks. Hand this device to them, or enter the words they send you. Each set hides once it’s added, so the next person picks fresh.',
      fields: [othersField]
    }
  ];

  // The window
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

  const boxes = [
    { key: 'open', name: 'Open', line: 'You and others picked these.', empty: 'No words matched this time. That’s common, and it’s a good place to start talking.' },
    { key: 'blind', name: 'Blind spot', line: 'Others picked these. You didn’t.', empty: 'Others didn’t pick anything you left out.' },
    { key: 'hidden', name: 'Hidden', line: 'You picked these. Others didn’t, yet.', empty: 'Someone else picked every word you chose.' },
    { key: 'unknown', name: 'Unknown', line: 'No one picked these this time. That doesn’t mean they’re missing.' }
  ];

  function wordChips(words, w, withCount) {
    const ul = el('ul', 'jw-chips');
    words.forEach(word => {
      const li = el('li');
      li.append(el('span', null, word));
      if (withCount) li.append(el('span', 'jw-of', ' · ' + w.count(word) + ' of ' + w.people));
      ul.append(li);
    });
    return ul;
  }

  function drawWindow(w) {
    const grid = el('div', 'jw-window');
    const axis = (cls, t) => { const d = el('div', 'jw-axis ' + cls, t); d.setAttribute('aria-hidden', 'true'); return d; };
    grid.append(axis('jw-ax-top1', 'Known to you'), axis('jw-ax-top2', 'Not known to you'),
      axis('jw-ax-side1', 'Known to others'), axis('jw-ax-side2', 'Not known to others'));
    boxes.forEach(b => {
      const box = el('section', 'jw-box jw-' + b.key);
      box.setAttribute('aria-label', b.name);
      box.append(el('h4', null, b.name), el('p', 'jw-line', b.line));
      const words = w[b.key];
      if (b.key === 'unknown' && !words.length) {
        box.append(el('p', 'jw-empty', 'Someone picked every word on the list.'));
      } else if (b.key === 'unknown') {
        const det = el('details', 'jw-unknown-list no-print');
        det.append(el('summary', null, 'Show ' + words.length + (words.length === 1 ? ' word' : ' words')), el('p', null, words.join(', ')));
        box.append(det, el('p', 'print-only jw-unknown-print', words.join(', ')));
      } else if (words.length) {
        box.append(wordChips(words, w, b.key !== 'hidden'));
      } else {
        box.append(el('p', 'jw-empty', b.empty));
      }
      grid.append(box);
    });
    return grid;
  }

  function renderResult(container, a, api) {
    const w = windowOf(a);
    const name = owner(a);
    const head = el('div', 'result-head no-print');
    head.append(el('p', 'eyebrow', 'Your window'), el('h2', null, name ? possessive(name) + ' window' : 'Your window'),
      el('p', null, 'Every word here is a strength. Use the questions below to start a conversation, then print it or save it as a PDF.'));
    container.append(head);

    const actions = el('div', 'result-actions no-print');
    const print = el('button', 'btn primary', 'Print my window');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    const editAll = el('button', 'btn', 'Edit the words');
    editAll.type = 'button';
    editAll.addEventListener('click', () => api.goTo(0));
    const again = el('button', 'btn', 'Start a new window');
    again.type = 'button';
    again.addEventListener('click', () => api.restart());
    actions.append(print, editAll, again);
    container.append(actions,
      el('p', 'small no-print', 'In the print window, choose “Save as PDF” to keep a digital copy, and turn off browser headers and footers for a cleaner page.'));

    const today = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const brief = el('article', 'brief jw-brief');
    brief.setAttribute('aria-label', name ? possessive(name) + ' Johari Window' : 'Johari Window');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    const top = el('div', 'brief-top');
    const titleWrap = el('div');
    titleWrap.append(el('p', 'eyebrow', 'Johari Window'), el('h3', 'brief-title', name ? possessive(name) + ' window' : 'My window'),
      el('p', 'brief-meta', today + ' · Words from ' + (name || 'me') + ' and ' + w.people + (w.people === 1 ? ' other person' : ' other people')));
    top.append(titleWrap);
    brief.append(brand, top);

    const win = section('The window', null, api, '');
    win.classList.add('jw-win');
    win.append(drawWindow(w));
    brief.append(win);

    // Talk about it
    const talk = section('Talk about it', null, api, '');
    talk.classList.add('jw-talk');
    const askWord = w.blind[0] || w.open[0];
    const qs = el('ul', 'jw-questions');
    const q = (label, line) => { const li = el('li'); li.append(el('strong', null, label + ' '), document.createTextNode(line)); qs.append(li); };
    q('Open:', w.open.length ? 'Which of these do you want to keep doing on purpose?' : 'Which of your words would you most like others to see?');
    q('Blind spot:', askWord ? 'Ask someone: “When have you seen me be ' + askWord + '?”' : 'Ask someone what word they’d add to your list.');
    q('Hidden:', w.hidden.length ? 'Which of these would you like people to see more? What’s one way to show it this month?' : 'What’s something about how you work that people might not know yet?');
    q('And:', 'What surprised you most?');
    talk.append(qs);

    // Two optional fields. On paper they print as written, or as blank lines.
    const choices = [...w.blind, ...w.open];
    const ask = el('div', 'jw-field no-print');
    const askLab = el('label', null, 'One word I’ll ask about (optional)');
    askLab.htmlFor = 'jw-ask-word';
    const sel = el('select');
    sel.id = 'jw-ask-word';
    sel.append(el('option', null, 'Choose a word'));
    sel.firstChild.value = '';
    choices.forEach(word => { const o = el('option', null, word); o.value = word; sel.append(o); });
    if (!choices.includes(a.askWord)) a.askWord = '';
    sel.value = a.askWord;
    ask.append(askLab, sel);
    const share = el('div', 'jw-field no-print');
    const shareLab = el('label', null, 'One thing I’ll share more (optional)');
    shareLab.htmlFor = 'jw-share';
    const ta = el('textarea');
    ta.id = 'jw-share';
    ta.maxLength = 300;
    ta.value = a.share || '';
    share.append(shareLab, ta);

    const printed = el('dl', 'print-only jw-printed');
    const askOut = el('dd');
    const shareOut = el('dd');
    printed.append(el('dt', null, 'One word I’ll ask about'), askOut, el('dt', null, 'One thing I’ll share more'), shareOut);
    const fill = (dd, value) => {
      dd.replaceChildren();
      if (text(value)) dd.textContent = text(value);
      else { const line = el('div', 'jw-blank'); line.setAttribute('aria-hidden', 'true'); dd.append(line); }
    };
    const sync = () => { fill(askOut, a.askWord); fill(shareOut, a.share); };
    sel.addEventListener('change', () => { a.askWord = sel.value; sync(); });
    ta.addEventListener('input', () => { a.share = ta.value; sync(); });
    sync();
    talk.append(ask, share, printed);
    // The questions and the footer stay together on paper, so the footer never prints alone.
    const end = el('div', 'brief-end');
    end.append(talk);

    const foot = el('footer', 'brief-foot');
    foot.append(el('p', null, 'Every word on the list is a strength. This window shows how you and a few people see you right now, not who you are. It’s for conversation, not reviews, ratings or hiring.'));
    foot.append(el('p', null, 'Made with the Pivot Labs Johari Window · ' + today +
      ' · Based on the Johari Window by Joseph Luft and Harrington Ingham (1955). Word list and wording are Pivot Labs’ own.'));
    end.append(foot);
    brief.append(end);
    container.append(brief);
  }

  // The printable word list (Print the word list in step 1)
  function wordSheet() {
    const sheet = el('section', 'jw-sheet');
    sheet.setAttribute('aria-hidden', 'true');
    const brand = el('div', 'brief-brand', 'Pivot Labs');
    brand.append(el('span', null, 'Navigating Everyday Leadership'));
    sheet.append(brand, el('h2', null, 'Johari Window word list'),
      el('p', 'jw-sheet-for', 'Words for: ______________________________'),
      el('p', null, 'Pick five or six words that describe this person at work. Pick on your own, and go with your first instinct. Every word is a strength.'));
    const cols = el('div', 'jw-sheet-groups');
    groups.forEach(g => {
      const col = el('div');
      col.append(el('h3', null, g.name));
      const ul = el('ul');
      g.words.forEach(word => ul.append(el('li', null, word)));
      col.append(ul);
      cols.append(col);
    });
    sheet.append(cols, el('p', 'jw-sheet-foot', 'pivotlabsleadership.com · Based on the Johari Window by Joseph Luft and Harrington Ingham (1955). Word list is Pivot Labs’ own.'));
    return sheet;
  }

  function initialAnswers() {
    return { name: '', self: [], others: [], askWord: '', share: '' };
  }
  const isDirty = a => Boolean(text(a.name) || a.self.length || a.others.length || text(a.share));

  return { steps, initialAnswers, isDirty, renderResult, wordSheet, resultTitle: 'Your window', finishLabel: 'See my window',
    // Exposed for testing.
    groups, allWords, windowOf };
})();
