'use strict';
/*
  Pivot Labs situation picker

  Asks a few questions about the leader's situation, suggests one option with the
  reason it fits, and lists the other options so the leader can choose another.
  It holds no tool wording. A tool supplies its content and calls:

    const picker = SituationPicker.create(config)

  config
    questions         fields in the guided planner's shape (see assets/js/guided-planner.js):
                      { id, type: 'choice' | 'multi', label, hint, options, showIf, optional, error }
    options           [{ id, title, summary, bestFor, href }] the things that can be suggested.
                      href is optional: set it when choosing an option opens another page, such as a tool.
    suggest(answers)  returns { id, reason } for the best fit, or null while answers are missing.
                      The same answers must always give the same suggestion, whoever the person is.

  title, summary, bestFor, reason, and question wording can be text or a function of the answers.

  Two ways to use it
    Inside a guided planner: put picker.questions in one step's fields, and
      picker.field({ id, pickedKey, legend, error }) in the next step's fields. The field shows the
      suggestion and why it fits, then every option as a choice. answers[id] holds the chosen
      option's id. answers[pickedKey] is true when the leader chose something other than the suggestion,
      so a later change to their answers doesn't overwrite their choice.
    On its own page (for example the Coaching Approach Picker, Decision Toolkit, or home page starter
      cards): picker.mount(container, options) shows the questions, then the suggestion and the
      other options. Options with an href become links. Others call options.onChoose(option, answers).
*/
const SituationPicker = (() => {
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  const resolve = (value, answers) => (typeof value === 'function' ? value(answers) : value);
  const isEmpty = value => value === undefined || value === null ||
    (Array.isArray(value) ? value.length === 0 : String(value).trim() === '');

  function errorSlot(id) {
    const p = el('p', 'field-error');
    p.id = id;
    p.hidden = true;
    const icon = el('span', 'field-error-icon', '!');
    icon.setAttribute('aria-hidden', 'true');
    p.append(icon, el('span', 'field-error-text'));
    return p;
  }

  function create(cfg) {
    const find = id => cfg.options.find(o => o.id === id) || null;
    const suggest = answers => {
      const s = cfg.suggest(answers);
      return s && find(s.id) ? s : null;
    };
    const visible = (q, answers) => !q.showIf || q.showIf(answers);

    // The suggested option: what it is and why it fits.
    function card(option, reason, eyebrow, answers) {
      const box = el('section', 'picker-card');
      const h = el('h3', null, resolve(option.title, answers));
      box.setAttribute('aria-label', eyebrow + ': ' + h.textContent);
      box.append(el('p', 'eyebrow', eyebrow), h);
      const summary = resolve(option.summary, answers);
      if (summary) box.append(el('p', null, summary));
      if (reason) {
        const p = el('p', 'picker-why');
        p.append(el('strong', null, 'Why it fits: '), reason);
        box.append(p);
      }
      return box;
    }

    // One option as a radio choice, with "Suggested" on the suggested one.
    function optionLabel(o, suggested, answers) {
      const text = el('span', 'picker-option');
      const title = el('span', 'picker-option-title', resolve(o.title, answers));
      if (suggested) title.append(' ', el('span', 'tag', 'Suggested'));
      text.append(title);
      const detail = resolve(o.bestFor, answers);
      if (detail) text.append(el('span', 'picker-option-detail', detail));
      return text;
    }

    // A custom field for a guided planner step.
    function field(opts) {
      const id = opts.id;
      const pickedKey = opts.pickedKey || id + 'Picked';
      const eyebrow = opts.eyebrow || 'Suggested';
      return {
        id,
        type: 'custom',
        render(wrap, api) {
          const a = api.answers;
          const s = suggest(a);
          // Follow the suggestion unless the leader chose something else.
          if (s && (!a[id] || !a[pickedKey] || a[id] === s.id)) {
            a[id] = s.id;
            a[pickedKey] = false;
          }
          if (s) wrap.append(card(find(s.id), resolve(s.reason, a), eyebrow, a));
          else wrap.append(el('p', 'planner-note', resolve(opts.missing, a) || 'Answer the questions in the last step to see a suggestion.'));

          const set = el('fieldset', 'picker-choice');
          set.append(el('legend', null, resolve(opts.legend, a) || 'Which one will you use?'));
          const choices = el('div', 'guide-options picker-options');
          const err = errorSlot('err-' + id);
          const note = el('p', 'planner-note');
          note.setAttribute('aria-live', 'polite');
          const updateNote = () => {
            const chosen = find(a[id]);
            note.textContent = s && chosen && chosen.id !== s.id && opts.choiceNote ? opts.choiceNote(chosen, find(s.id), a) : '';
          };
          cfg.options.forEach((o, i) => {
            const lab = el('label');
            const input = el('input');
            input.type = 'radio';
            input.name = id;
            input.value = o.id;
            input.id = id + '-' + i;
            input.checked = a[id] === o.id;
            input.setAttribute('aria-describedby', 'err-' + id);
            input.addEventListener('change', () => {
              a[pickedKey] = !s || o.id !== s.id;
              err.hidden = true;
              choices.querySelectorAll('input').forEach(n => n.removeAttribute('aria-invalid'));
              api.set(id, o.id);
              updateNote();
            });
            lab.append(input, optionLabel(o, s && s.id === o.id, a));
            choices.append(lab);
          });
          set.append(choices, err);
          wrap.append(set, note);
          updateNote();
        },
        validate(a) {
          return a[id] ? [] : [{ errorId: 'err-' + id, focusId: id + '-0', message: opts.error || 'Choose one to continue.' }];
        }
      };
    }

    // On its own page: the questions, then the suggestion and the other options.
    function mount(container, opts = {}) {
      const prefix = opts.idPrefix || 'picker';
      const answers = opts.answers || {};
      const form = el('form', 'picker-form');
      form.noValidate = true;
      const questionsWrap = el('div', 'picker-questions');
      const submit = el('button', 'btn primary', opts.submitLabel || 'Show my suggestion');
      submit.type = 'submit';
      const actions = el('div', 'picker-actions');
      actions.append(submit);
      form.append(questionsWrap, actions);
      const result = el('section', 'picker-result');
      result.hidden = true;
      container.append(form, result);

      const qid = (q, i) => prefix + '-' + q.id + '-' + i;

      function question(q) {
        const wrap = el('div', 'picker-question');
        wrap.dataset.question = q.id;
        const set = el('fieldset');
        set.append(el('legend', null, resolve(q.label, answers) + (q.optional ? ' (optional)' : '')));
        const described = [];
        const hint = resolve(q.hint, answers);
        if (hint) {
          const h = el('p', 'hint', hint);
          h.id = prefix + '-hint-' + q.id;
          set.append(h);
          described.push(h.id);
        }
        const choices = el('div', 'guide-options');
        q.options.forEach((o, i) => {
          const lab = el('label');
          const input = el('input');
          input.type = q.type === 'multi' ? 'checkbox' : 'radio';
          input.name = prefix + '-' + q.id;
          input.value = o.value;
          input.id = qid(q, i);
          input.dataset.question = q.id;
          const value = answers[q.id];
          input.checked = q.type === 'multi' ? (value || []).includes(o.value) : value === o.value;
          lab.append(input, el('span', null, resolve(o.label, answers)));
          choices.append(lab);
        });
        const err = errorSlot(prefix + '-err-' + q.id);
        described.push(err.id);
        set.setAttribute('aria-describedby', described.join(' '));
        set.append(choices, err);
        wrap.append(set);
        return wrap;
      }

      function renderQuestions() {
        questionsWrap.replaceChildren(...cfg.questions.map(question));
        refresh();
      }
      function refresh() {
        cfg.questions.forEach(q => {
          const wrap = questionsWrap.querySelector('[data-question="' + q.id + '"]');
          if (wrap) wrap.hidden = !visible(q, answers);
        });
      }

      form.addEventListener('change', e => {
        const key = e.target.dataset.question;
        if (!key) return;
        const q = cfg.questions.find(x => x.id === key);
        answers[key] = q.type === 'multi'
          ? [...questionsWrap.querySelectorAll('input[data-question="' + key + '"]:checked')].map(n => n.value)
          : e.target.value;
        const err = document.getElementById(prefix + '-err-' + key);
        if (err) err.hidden = true;
        questionsWrap.querySelectorAll('input[data-question="' + key + '"]').forEach(n => n.removeAttribute('aria-invalid'));
        refresh();
      });

      form.addEventListener('submit', e => {
        e.preventDefault();
        const missing = cfg.questions.filter(q => visible(q, answers) && !q.optional && isEmpty(answers[q.id]));
        if (missing.length) {
          missing.forEach(q => {
            const err = document.getElementById(prefix + '-err-' + q.id);
            err.querySelector('.field-error-text').textContent = q.error || 'Choose an answer to continue.';
            err.hidden = false;
            questionsWrap.querySelectorAll('input[data-question="' + q.id + '"]').forEach(n => n.setAttribute('aria-invalid', 'true'));
          });
          document.getElementById(qid(missing[0], 0)).focus();
          return;
        }
        showResult();
      });

      function action(option, primary) {
        const label = opts.actionLabel ? opts.actionLabel(option, answers)
          : (option.href ? 'Open ' : 'Choose ') + resolve(option.title, answers);
        let node;
        if (option.href) {
          node = el('a', 'btn' + (primary ? ' primary' : ''), label);
          node.href = option.href;
        } else {
          node = el('button', 'btn' + (primary ? ' primary' : ''), label);
          node.type = 'button';
          node.addEventListener('click', () => opts.onChoose && opts.onChoose(option, answers));
        }
        return node;
      }

      function showResult() {
        const s = suggest(answers);
        if (!s) return;
        const chosen = find(s.id);
        result.replaceChildren();
        const h = el('h2', 'picker-result-title', resolve(opts.resultTitle, answers) || 'Here’s a place to start');
        h.tabIndex = -1;
        result.append(h, card(chosen, resolve(s.reason, answers), opts.eyebrow || 'Suggested', answers));
        const primary = el('div', 'picker-actions');
        primary.append(action(chosen, true));
        result.append(primary);
        const others = cfg.options.filter(o => o.id !== s.id);
        if (others.length) {
          result.append(el('h3', 'picker-others-title', opts.othersTitle || 'Other options'));
          const list = el('ul', 'picker-others');
          others.forEach(o => {
            const li = el('li');
            const text = el('div');
            text.append(el('p', 'picker-option-title', resolve(o.title, answers)));
            const detail = resolve(o.bestFor, answers);
            if (detail) text.append(el('p', 'picker-option-detail', detail));
            li.append(text, action(o, false));
            list.append(li);
          });
          result.append(list);
        }
        const back = el('button', 'btn', 'Change my answers');
        back.type = 'button';
        back.addEventListener('click', () => {
          result.hidden = true;
          form.hidden = false;
          const first = questionsWrap.querySelector('input');
          if (first) first.focus();
        });
        result.append(back);
        form.hidden = true;
        result.hidden = false;
        h.focus();
        if (opts.onResult) opts.onResult(chosen, answers);
      }

      renderQuestions();
      return {
        answers,
        showResult,
        reset() {
          Object.keys(answers).forEach(k => delete answers[k]);
          result.hidden = true;
          form.hidden = false;
          renderQuestions();
        }
      };
    }

    return { questions: cfg.questions, options: cfg.options, suggest, find, field, mount, card };
  }

  return { create };
})();
