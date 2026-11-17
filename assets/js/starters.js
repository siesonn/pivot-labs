'use strict';
/*
  Pivot Labs starter situations: the questions, the tools each answer leads to, and why each fits.

  One copy, used by the home page starter cards (home.js) and by the Find pages (find/<name>/index.html,
  through assets/js/find-page.js). Each key in STARTERS is one situation. The questions run on the shared
  situation picker (assets/js/situation-picker.js).

  To add a tool to a situation: add it to TOOLS, add it to the situation's options, add an answer that
  leads to it, and send that answer to it in suggest(). Keep a question to five answers plus "I'm not sure."
  When a situation needs more, add a question in front that splits it (showIf on the later questions).
  The same answers must always give the same suggestion.
*/
window.PivotStarters = (() => {
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
    },
    executiveAsk: {
      title: 'Executive Ask Builder', href: 'tools/executive-ask-builder/index.html',
      summary: 'Prepare one ask for a decision. Say the ask in one sentence, give just enough context, prepare for concerns, and print a one-page brief.'
    },
    coaching: {
      title: 'Coaching Approach Picker', href: 'tools/coaching-approach-picker/index.html',
      summary: 'Plan one coaching conversation. Describe what’s going on, get a suggested approach and why it fits, plan the questions you’ll ask, and print a short plan.'
    },
    roleClarity: {
      title: 'Role Clarity Builder', href: 'tools/role-clarity-builder/index.html',
      summary: 'Make one role clear. List what it runs, what it shares, and what belongs to someone else, agree on who decides what, and print a sheet to go through together.'
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
        { id: 'scope', type: 'choice', label: 'Is this about one person or the whole team?', options: [
          { value: 'person', label: 'One person.' },
          { value: 'team', label: 'The whole team.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] },
        { id: 'owners', type: 'choice', label: 'What’s going on?', showIf: a => a.scope === 'team', options: [
          { value: 'owns', label: 'People aren’t sure who owns what.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] },
        { id: 'team', type: 'choice', label: 'What’s going on?', showIf: a => a.scope === 'person' || a.scope === 'unsure', options: [
          { value: 'talk', label: 'I need to talk with someone about their work.' },
          { value: 'handoff', label: 'I want to hand off some work to someone.' },
          { value: 'support', label: 'I’m not sure how much support someone needs on a task.' },
          { value: 'hesitant', label: 'Someone seems hesitant about their work lately.' },
          { value: 'grow', label: 'I want to help someone grow.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] },
        { id: 'growTask', type: 'choice', label: 'Where are you starting from?', showIf: a => (a.scope === 'person' || a.scope === 'unsure') && a.team === 'grow', options: [
          { value: 'task', label: 'I have a task or project that could stretch them.' },
          { value: 'ideas', label: 'They know what they want to work on, and I have ideas to share.' },
          { value: 'notTalked', label: 'We haven’t talked yet about where they want to grow.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] }
      ],
      options: [
        tool('feedback', 'When you need to talk with someone about their work.'),
        tool('delegation', 'When you want to hand off a piece of work.'),
        tool('development', 'When you’re deciding how much support someone needs on a task.'),
        tool('coaching', 'When you want to help someone think something through.'),
        tool('roleClarity', 'When people aren’t sure who owns what.')
      ],
      suggest(a) {
        if (a.scope === 'team') {
          if (a.owners === 'owns') return pick('roleClarity', 'The Role Clarity Builder helps you make one role clear: what it runs, what it shares, what belongs to someone else, and who decides what. Then you go through the sheet together.');
          if (a.owners === 'unsure') return pick('roleClarity', 'Start with one role. The Role Clarity Builder lists what the role runs, what it shares, and what belongs to someone else, and marks anything that isn’t settled yet.');
          return null;
        }
        switch (a.team) {
          case 'talk': return pick('feedback', 'Whether it’s praise, a concern, or a nudge to grow, the Feedback Conversation Planner suggests an approach and helps you plan what to say, what to ask, and how to follow up.');
          case 'handoff': return pick('delegation', WHY.handoff);
          case 'support': return pick('development', 'The Team Development Map looks at one person and one task. It asks about their skill and willingness for that task and suggests whether to guide, stretch, re-engage, or direct.');
          case 'hesitant': return pick('development', 'Pick one task to start. The Team Development Map asks what might be behind the hesitation, such as workload, confidence, clarity, or interest, and the answer shapes your next step.');
          case 'grow':
            if (a.growTask === 'task') return pick('development', 'Real work is a good place to grow. The Team Development Map helps you decide how far to stretch them and how much support to give.');
            if (a.growTask === 'ideas') return pick('feedback', 'The Feedback Conversation Planner helps you agree on one thing to work toward and trade ideas for the next chance to try it.');
            if (a.growTask === 'notTalked') return pick('coaching', 'Start with a conversation about where they want to go. The Coaching Approach Picker suggests an approach and helps you plan the questions you’ll ask.');
            if (a.growTask === 'unsure') return pick('coaching', 'The Coaching Approach Picker asks a few questions about the situation, then suggests whether to coach, share your experience, or give direction.');
            return null;
          case 'unsure': return pick('development', 'Start with one person and one task. The Team Development Map suggests a next step and links to the planner that helps you carry it out.');
          default: return null;
        }
      }
    },

    talk: {
      questions: [
        { id: 'talk', type: 'choice', label: 'Who’s the conversation with?', options: [
          { value: 'team', label: 'Someone I lead.' },
          { value: 'senior', label: 'My manager or senior leaders.' },
          { value: 'unsure', label: 'I’m not sure.' }
        ] }
      ],
      options: [
        tool('feedback', 'When you need to talk with someone about their work.'),
        tool('executiveAsk', 'When you need a decision from a manager or senior leaders.')
      ],
      suggest(a) {
        switch (a.talk) {
          case 'team': return pick('feedback', 'Whether it’s praise, a concern, or a nudge to grow, the Feedback Conversation Planner suggests an approach and helps you plan what to say, what to ask, and how to follow up.');
          case 'senior': return pick('executiveAsk', 'You need a decision. The Executive Ask Builder helps you say the ask in one sentence, give just enough context, prepare for concerns, and close by asking again.');
          case 'unsure': return pick('feedback', 'Start here. If the conversation is a request for a decision from senior leaders, use the Executive Ask Builder instead.');
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
  return { TOOLS, STARTERS };
})();
