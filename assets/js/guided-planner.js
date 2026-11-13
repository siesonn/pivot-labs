'use strict';
/*
  Pivot Labs guided planner engine

  Runs any planner that works through short steps and ends with a printable brief.
  It holds no tool wording. A tool page supplies its content and calls:

    GuidedPlanner.create(config)

  config
    steps            [{ id, title, intro, fields }]
    initialAnswers() the starting answers object (a fresh copy each time)
    resultTitle      label for the last item in the step list, for example "Your brief"
    finishLabel      text of the last step's button (optional, default "Review my brief")
    renderResult(container, answers, api)  builds the finished brief
    isDirty(answers) true when leaving the page would lose work

  field
    id        answer key
    type      'text' | 'textarea' | 'date' | 'choice' (radio) | 'multi' (checkboxes) | 'custom'
    label     question or field label
    hint      help text shown under the label (put examples here)
    optional  true to mark "(optional)" and skip the required check
    maxlength for text fields
    options   [{ value, label }] for choice and multi
    default(answers)  value set the first time the step opens, if the answer is still empty
    note(answers)     suggestion shown under the control; updates as answers change
    showIf(answers)   hide the field unless this returns true (its answer is kept)
    after     tip shown under the control
    error     message when a required answer is missing
    render(container, api) and validate(answers) for custom fields;
      validate returns [{ errorId, focusId, message }]

  label, hint, intro, title, after, and option labels can be text or a function of the answers.

  Required markup (ids): planner-steps, planner-count, planner-title, planner-intro,
  planner-step-head, planner-form, planner-fields, planner-back, planner-next,
  planner-result, status, undo-bar, undo-label, undo, restart, restart-dialog,
  confirm-restart, cancel-restart.
*/
const GuidedPlanner = (() => {
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  const resolve = (value, answers) => (typeof value === 'function' ? value(answers) : value);
  const clone = value => JSON.parse(JSON.stringify(value));
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
    const $ = id => document.getElementById(id);
    const dom = {
      steps: $('planner-steps'), count: $('planner-count'), title: $('planner-title'),
      intro: $('planner-intro'), head: $('planner-step-head'), form: $('planner-form'),
      fields: $('planner-fields'), back: $('planner-back'), next: $('planner-next'),
      result: $('planner-result'), status: $('status'), undoBar: $('undo-bar'),
      undoLabel: $('undo-label'), undo: $('undo'), restart: $('restart'),
      dialog: $('restart-dialog'), confirm: $('confirm-restart'), cancel: $('cancel-restart')
    };
    const total = cfg.steps.length;
    let answers = cfg.initialAnswers();
    let current = 0;   // step index; total means the finished brief
    let furthest = 0;  // furthest step reached, so the step list can jump back to it
    let undoState = null;
    let statusTimer;
    let stepTitles = '';  // the step list as last drawn, so it is redrawn only when a title changes
    const titles = () => cfg.steps.map(s => resolve(s.title, answers)).concat(cfg.resultTitle);

    function announce(message) {
      dom.status.textContent = message;
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => { dom.status.textContent = ''; }, 5000);
    }

    function hideUndo() {
      undoState = null;
      dom.undoBar.hidden = true;
    }

    // Called whenever an answer changes. Undo for "Start over" ends once new work begins.
    function changed() {
      if (undoState) hideUndo();
      refresh();
    }

    const api = {
      get answers() { return answers; },
      set(key, value) { answers[key] = value; changed(); },
      errorSlot,
      el,
      announce,
      goTo: index => go(typeof index === 'string' ? cfg.steps.findIndex(s => s.id === index) : index),
      restart: () => dom.dialog.showModal(),
      refresh: () => refresh()
    };

    // Step list: finished and reached steps are buttons; later steps are plain text.
    function renderSteps() {
      dom.steps.replaceChildren();
      const items = titles();
      stepTitles = items.join('\n');
      items.forEach((title, i) => {
        const li = el('li');
        const reached = i <= furthest;
        const node = el(reached ? 'button' : 'span', reached ? null : 'step-locked');
        if (reached) {
          node.type = 'button';
          node.addEventListener('click', () => go(i));
        }
        if (i === current) node.setAttribute('aria-current', 'step');
        else if (reached && i < furthest) node.classList.add('step-done');
        const num = el('span', 'step-num', i < total ? String(i + 1) : '✓');
        num.setAttribute('aria-hidden', 'true');
        const label = el('span', 'step-title', title);
        const extra = (i < total ? ', step ' + (i + 1) + ' of ' + total : '') + (reached ? '' : ', not reached yet');
        node.append(num, label, el('span', 'visually-hidden', extra));
        li.append(node);
        dom.steps.append(li);
      });
    }

    function standardField(f) {
      const wrap = el('div', 'planner-field');
      wrap.dataset.field = f.id;
      const hintId = 'hint-' + f.id;
      const errId = 'err-' + f.id;
      const described = [];
      const label = resolve(f.label, answers) + (f.optional ? ' (optional)' : '');
      const hint = resolve(f.hint, answers);
      if (f.type === 'choice' || f.type === 'multi') {
        const set = el('fieldset');
        set.append(el('legend', null, label));
        if (hint) { const h = el('p', 'hint', hint); h.id = hintId; set.append(h); described.push(hintId); }
        const opts = el('div', 'guide-options');
        const value = answers[f.id];
        f.options.forEach((o, i) => {
          const lab = el('label');
          const input = el('input');
          input.type = f.type === 'choice' ? 'radio' : 'checkbox';
          input.name = f.id;
          input.value = o.value;
          input.id = f.id + '-' + i;
          input.dataset.answer = f.id;
          input.checked = f.type === 'choice' ? value === o.value : (value || []).includes(o.value);
          lab.append(input, el('span', null, resolve(o.label, answers)));
          opts.append(lab);
        });
        set.append(opts, errorSlot(errId));
        described.push(errId);
        set.setAttribute('aria-describedby', described.join(' '));
        wrap.append(set);
      } else {
        const id = 'field-' + f.id;
        const lab = el('label', null, label);
        lab.htmlFor = id;
        wrap.append(lab);
        if (hint) { const h = el('p', 'small field-hint', hint); h.id = hintId; wrap.append(h); described.push(hintId); }
        const input = el(f.type === 'textarea' ? 'textarea' : 'input');
        if (f.type !== 'textarea') input.type = f.type === 'date' ? 'date' : 'text';
        if (f.type === 'text') input.autocomplete = 'off';
        input.id = id;
        input.dataset.answer = f.id;
        if (f.maxlength) input.maxLength = f.maxlength;
        input.value = answers[f.id] || '';
        described.push(errId);
        input.setAttribute('aria-describedby', described.join(' '));
        wrap.append(input, errorSlot(errId));
      }
      if (f.note) {
        const note = el('p', 'planner-note');
        note.dataset.note = f.id;
        note.setAttribute('aria-live', 'polite');
        wrap.append(note);
      }
      if (f.after) wrap.append(el('p', 'planner-tip', resolve(f.after, answers)));
      return wrap;
    }

    function renderStep() {
      const step = cfg.steps[current];
      step.fields.forEach(f => {
        if (f.default && isEmpty(answers[f.id])) answers[f.id] = f.default(answers);
      });
      dom.count.textContent = 'Step ' + (current + 1) + ' of ' + total;
      dom.title.textContent = resolve(step.title, answers);
      const intro = resolve(step.intro, answers);
      dom.intro.textContent = intro || '';
      dom.intro.hidden = !intro;
      dom.fields.replaceChildren();
      step.fields.forEach(f => {
        if (f.type === 'custom') {
          const wrap = el('div', 'planner-field');
          wrap.dataset.field = f.id;
          f.render(wrap, api);
          dom.fields.append(wrap);
        } else dom.fields.append(standardField(f));
      });
      dom.back.hidden = current === 0;
      dom.next.textContent = current === total - 1 ? (cfg.finishLabel || 'Review my brief') : 'Continue';
      refresh();
    }

    // Show or hide conditional fields and update suggestion notes without rebuilding inputs.
    // Step titles can depend on answers (for example the chosen approach), so the step list follows.
    function refresh() {
      if (titles().join('\n') !== stepTitles) renderSteps();
      if (current >= total) return;
      cfg.steps[current].fields.forEach(f => {
        const wrap = dom.fields.querySelector('[data-field="' + f.id + '"]');
        if (!wrap) return;
        if (f.showIf) wrap.hidden = !f.showIf(answers);
        const note = wrap.querySelector('[data-note="' + f.id + '"]');
        if (note) note.textContent = f.note(answers) || '';
      });
    }

    function stepErrors(index) {
      const errors = [];
      cfg.steps[index].fields.forEach(f => {
        if (f.showIf && !f.showIf(answers)) return;
        if (f.type === 'custom') {
          if (f.validate) errors.push(...f.validate(answers));
          return;
        }
        if (f.optional || !isEmpty(answers[f.id])) return;
        const choice = f.type === 'choice' || f.type === 'multi';
        errors.push({
          errorId: 'err-' + f.id,
          focusId: choice ? f.id + '-0' : 'field-' + f.id,
          fieldId: f.id,
          message: f.error || (choice ? 'Choose an answer to continue.' : 'Fill this in to continue.')
        });
      });
      return errors;
    }

    function clearErrors() {
      dom.fields.querySelectorAll('.field-error').forEach(p => { p.hidden = true; });
      dom.fields.querySelectorAll('[aria-invalid]').forEach(n => n.removeAttribute('aria-invalid'));
    }

    function showErrors(errors) {
      clearErrors();
      errors.forEach(e => {
        const slot = document.getElementById(e.errorId);
        if (slot) { slot.querySelector('.field-error-text').textContent = e.message; slot.hidden = false; }
        const target = e.fieldId
          ? dom.fields.querySelectorAll('[data-answer="' + e.fieldId + '"]')
          : [document.getElementById(e.focusId)];
        target.forEach(n => n && n.setAttribute('aria-invalid', 'true'));
      });
      const first = document.getElementById(errors[0].focusId);
      if (first) first.focus();
      announce(errors.length === 1 ? 'One answer needs attention.' : errors.length + ' answers need attention.');
    }

    function go(index, focus = true) {
      if (index < 0 || index > total) return;
      dom.status.textContent = '';
      if (index === total) {
        // Check every step before showing the brief.
        for (let i = 0; i < total; i++) {
          const errors = stepErrors(i);
          if (errors.length) {
            current = i;
            render();
            showErrors(errors);
            return;
          }
        }
      }
      current = index;
      furthest = Math.max(furthest, index);
      render();
      if (focus) {
        const heading = current === total ? dom.result.querySelector('h2') : dom.title;
        if (heading) { heading.tabIndex = -1; heading.focus(); }
      }
    }

    function render() {
      const done = current === total;
      dom.head.hidden = done;
      dom.form.hidden = done;
      dom.result.hidden = !done;
      if (done) {
        dom.result.replaceChildren();
        cfg.renderResult(dom.result, answers, api);
      } else renderStep();
      // Drawn after the step, so titles reflect answers the step sets as it opens.
      renderSteps();
    }

    // Typing and choosing save answers right away, so Back and the step list keep them.
    function readInput(e) {
      const key = e.target.dataset.answer;
      if (!key) return;
      const field = cfg.steps[current].fields.find(f => f.id === key);
      if (field.type === 'multi') {
        answers[key] = [...dom.fields.querySelectorAll('[data-answer="' + key + '"]:checked')].map(n => n.value);
      } else answers[key] = e.target.value;
      const slot = document.getElementById('err-' + key);
      if (slot && !slot.hidden && !isEmpty(answers[key])) {
        slot.hidden = true;
        dom.fields.querySelectorAll('[data-answer="' + key + '"]').forEach(n => n.removeAttribute('aria-invalid'));
      }
      changed();
    }
    dom.form.addEventListener('input', readInput);
    dom.form.addEventListener('change', e => { if (e.target.type === 'radio' || e.target.type === 'checkbox') readInput(e); });
    dom.form.addEventListener('submit', e => {
      e.preventDefault();
      const errors = stepErrors(current);
      if (errors.length) { showErrors(errors); return; }
      go(current + 1);
    });
    dom.back.addEventListener('click', () => go(current - 1));

    // Start over: confirm first, then offer undo until new answers are entered.
    dom.restart.addEventListener('click', () => dom.dialog.showModal());
    dom.cancel.addEventListener('click', () => dom.dialog.close());
    dom.confirm.addEventListener('click', () => {
      undoState = { answers: clone(answers), current, furthest };
      dom.dialog.close();
      answers = cfg.initialAnswers();
      current = 0;
      furthest = 0;
      render();
      dom.undoLabel.textContent = 'Answers cleared.';
      dom.undoBar.hidden = false;
      dom.title.tabIndex = -1;
      dom.title.focus();
      announce('Answers cleared. Undo is available.');
    });
    dom.undo.addEventListener('click', () => {
      if (!undoState) return;
      ({ answers, current, furthest } = undoState);
      hideUndo();
      render();
      const heading = current === total ? dom.result.querySelector('h2') : dom.title;
      if (heading) { heading.tabIndex = -1; heading.focus(); }
      announce('Answers restored.');
    });

    // Keep keyboard focus inside open dialogs.
    document.querySelectorAll('dialog').forEach(dialog => {
      dialog.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const controls = [...dialog.querySelectorAll('button,input,select,textarea,[tabindex="0"]')]
          .filter(c => !c.matches(':disabled') && c.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });
    });

    window.addEventListener('beforeunload', e => {
      if (cfg.isDirty(answers)) { e.preventDefault(); e.returnValue = ''; }
    });

    render();
    return api;
  }

  return { create, el, errorSlot };
})();
