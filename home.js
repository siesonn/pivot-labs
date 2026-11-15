'use strict';
/*
  Pivot Labs home page: starter cards

  Each starter card opens a question or two in place. The answers suggest one tool, say why it
  fits, and list the card's other tools. The questions run on the shared situation picker
  (assets/js/situation-picker.js). A card with only one fitting tool is a plain link in index.html.

  To add a tool to a card: add it to TOOLS, add it to the card's options, add an answer that leads
  to it, and send that answer to it in suggest(). Keep a question to five answers plus "I'm not sure."
  When a card needs more, add a question in front that splits it (showIf on the later questions).
  A new card goes in index.html (copy a starter <li>) and here under the same data-starter name.
  The same answers must always give the same suggestion.
*/
(() => {
  const TOOLS = {
    eisenhower: {
      title: 'Eisenhower Matrix', href: 'tools/eisenhower-matrix/index.html',
      summary: 'Work through your priorities. Add your tasks, consider urgency and importance, and decide what to do, schedule, delegate, or reconsider.'
    },
    delegation: {
      title: 'Delegation Planner', href: 'tools/delegation-planner/index.html',
      summary: 'Plan one handoff. Agree on what done looks like, who decides what, and when you’ll check in, then print a brief to review together.'
    },
    feedback: {
      title: 'Feedback Conversation Planner', href: 'tools/feedback-conversation-planner/index.html',
      summary: 'Prepare one feedback conversation. Describe what happened, get a suggested approach, and print a plan to bring with you.'
    },
    development: {
      title: 'Team Development Map', href: 'tools/team-development-map/index.html',
      summary: 'Plan how to support someone on a specific task. Add a person and a task, consider their skill and willingness, and decide whether to guide, stretch, re-engage, or direct.'
    },
    rootCause: {
      title: 'Root Cause Finder', href: 'tools/root-cause-finder/index.html',
      summary: 'Work through one problem. Describe what happened, get a suggested method to find the cause, and print a summary of the fix and how you’ll check it worked.'
    }
  };

  // A tool as a card option. bestFor is the line shown under "Other options".
  const tool = (id, bestFor) => ({ id, title: TOOLS[id].title, summary: TOOLS[id].summary, href: TOOLS[id].href, bestFor });
  const pick = (id, reason) => ({ id, reason });

  const WHY = {
    matrix: 'Get everything in one place first. The Eisenhower Matrix helps you sort each task by urgency and importance, then decide what to do now, schedule, delegate, or reconsider.',
    handoff: 'You already know what to hand off. The Delegation Planner helps you agree on what done looks like, who decides what, and when you’ll check in.'
  };

  const STARTERS = {
    time: {
      questions: [
        { id: 'time', type: 'choice', label: 'Which sounds closest?', options: [
          { value: 'list', label: 'I have a long list and don’t know where to start.' },
          { value: 'handoff', label: 'I know what I want to hand off. I need to plan how.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] }
      ],
      options: [
        tool('eisenhower', 'When you have a list to sort.'),
        tool('delegation', 'When you already know what you want to hand off.')
      ],
      suggest(a) {
        if (a.time === 'list') return pick('eisenhower', WHY.matrix);
        if (a.time === 'handoff') return pick('delegation', WHY.handoff);
        if (a.time === 'unsure') return pick('eisenhower', WHY.matrix + ' If a task could go to someone else, the matrix links you to the Delegation Planner.');
        return null;
      }
    },

    team: {
      questions: [
        { id: 'team', type: 'choice', label: 'What’s going on?', options: [
          { value: 'talk', label: 'I need to talk with someone about their work.' },
          { value: 'handoff', label: 'I want to hand off some work to someone.' },
          { value: 'support', label: 'I’m not sure how much support someone needs on a task.' },
          { value: 'hesitant', label: 'Someone seems hesitant about their work lately.' },
          { value: 'grow', label: 'I want to help someone grow.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] },
        { id: 'growTask', type: 'choice', label: 'Do you have a task or project in mind for them?', showIf: a => a.team === 'grow', options: [
          { value: 'yes', label: 'Yes.' },
          { value: 'notYet', label: 'Not yet. I want to talk about where they’re headed.' }
        ] }
      ],
      options: [
        tool('feedback', 'When you need to talk with someone about their work.'),
        tool('delegation', 'When you want to hand off a piece of work.'),
        tool('development', 'When you’re deciding how much support someone needs on a task.')
      ],
      suggest(a) {
        switch (a.team) {
          case 'talk': return pick('feedback', 'Whether it’s praise, a concern, or a nudge to grow, the Feedback Conversation Planner suggests an approach and helps you plan what to say, what to ask, and how to follow up.');
          case 'handoff': return pick('delegation', WHY.handoff);
          case 'support': return pick('development', 'The Team Development Map looks at one person and one task. It asks about their skill and willingness for that task and suggests whether to guide, stretch, re-engage, or direct.');
          case 'hesitant': return pick('development', 'Pick one task to start. The Team Development Map asks what might be behind the hesitation, such as workload, confidence, clarity, or interest, and the answer shapes your next step.');
          case 'grow':
            if (a.growTask === 'yes') return pick('development', 'Real work is a good place to grow. The Team Development Map helps you decide how far to stretch them and how much support to give.');
            if (a.growTask === 'notYet') return pick('feedback', 'Start with a conversation. The Feedback Conversation Planner helps you agree on one thing to work toward and the next chance to try it.');
            return null;
          case 'unsure': return pick('development', 'Start with one person and one task. The Team Development Map suggests a next step and links to the planner that helps you carry it out.');
          default: return null;
        }
      }
    },

    wrong: {
      questions: [
        { id: 'wrong', type: 'choice', label: 'What keeps happening?',
          hint: 'Most repeat problems have something in the setup behind them, even when one person is involved.',
          options: [
            { value: 'process', label: 'A process, handoff, or tool keeps breaking down.' },
            { value: 'fires', label: 'The same urgent problem keeps landing on my desk.' },
            { value: 'person', label: 'It’s about one person’s work, and it has come up more than once.' },
            { value: 'unsure', label: 'I’m not sure yet.' }
          ] }
      ],
      options: [
        tool('rootCause', 'When a process, handoff, or tool is part of the problem.'),
        tool('feedback', 'When it’s about one person’s work, and it has come up more than once.')
      ],
      suggest(a) {
        switch (a.wrong) {
          case 'process': return pick('rootCause', 'The Root Cause Finder suggests a method that fits your problem, helps you find the cause, and ends with a fix and a way to check it worked.');
          case 'fires': return pick('rootCause', 'When the same fire keeps coming back, the cause is usually upstream. The Root Cause Finder helps you find it and plan a fix that lasts.');
          case 'person': return pick('feedback', 'A repeat issue with one person’s work calls for a conversation, not a guess. The Feedback Conversation Planner helps you describe what you’ve seen, ask what’s getting in the way, and agree on next steps. If a process or tool is part of it, it points you to the Root Cause Finder.');
          case 'unsure': return pick('rootCause', 'Start with what happened and what should have happened. The Root Cause Finder suggests a method from your answers and keeps the focus on what failed, not who.');
          default: return null;
        }
      }
    }
  };

  // Open or close a card. Answers stay put when a card closes, so reopening it picks up where you left off.
  function setOpen(item, open) {
    item.classList.toggle('open', open);
    item.querySelector('.starter-toggle').setAttribute('aria-expanded', String(open));
    item.querySelector('.starter-panel').hidden = !open;
  }

  document.querySelectorAll('.starter[data-starter]').forEach(item => {
    const key = item.dataset.starter;
    const config = STARTERS[key];
    if (!config) return;
    SituationPicker.create(config).mount(item.querySelector('.starter-panel'), {
      idPrefix: 'start-' + key,
      headingLevel: 3,
      showAnswers: true,
      changeInActions: true,
      actionLabel: option => 'Open the ' + option.title
    });
    const toggle = item.querySelector('.starter-toggle');
    toggle.addEventListener('click', () => setOpen(item, toggle.getAttribute('aria-expanded') !== 'true'));
  });
})();
