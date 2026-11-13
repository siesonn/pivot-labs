'use strict';

// Suggests an approach for one person on one task, based on Max Landsberg's Skill/Will Matrix.
// The suggestion is a starting point. The leader decides. An unsure answer never places a card.
function recommendPlacement(answers) {
  const {skill, will, cause} = answers;
  const causeSteps = {
    workload: 'Ask what would need to move to make room, and agree on priorities together.',
    confidence: 'Start with a smaller piece, point to related work they’ve done well, and stay available for questions.',
    clarity: 'Explain why the task matters and what a good result looks like.',
    interest: 'Ask what would make the work worth their effort, or whether someone else is a better fit.',
    unknown: 'Ask what’s getting in the way, and listen before suggesting changes.'
  };

  if (skill === 'unsure' || will === 'unsure') {
    const steps = [];
    if (skill === 'unsure') steps.push('Watch them do a small part of the task, or ask how they’d approach it.');
    if (will === 'unsure') steps.push('Ask how they feel about taking it on.');
    else if (will === 'hesitant') steps.push('Ask what’s behind their hesitation.');
    return {
      zone: 'inbox',
      title: 'Find out first',
      reason: 'You don’t have enough to go on yet.',
      action: steps.join(' ')
    };
  }

  if (will === 'willing') {
    if (skill === 'skilled') {
      return {
        zone: 'stretch',
        reason: 'They’ve done this work well and want to take it on.',
        action: 'Check their workload first, so the people you rely on most don’t end up with everything. ' +
          'Agree on the outcome, the deadline, and how you’ll stay informed. Then step back.'
      };
    }
    return {
      zone: 'guide',
      reason: 'They want to take this on and are still building the skill.',
      action: 'Show how it’s done, let them try a piece, and give feedback soon after. ' +
        'Check in often at first, then ease off as their skill grows.'
    };
  }

  const causeStep = causeSteps[cause] || causeSteps.unknown;
  if (skill === 'skilled') {
    return {
      zone: 'reengage',
      reason: 'They can do this work, and something is getting in the way of wanting to.',
      action: causeStep
    };
  }
  return {
    zone: 'direct',
    reason: 'They’re new to this task and hesitant about it right now.',
    action: 'First confirm this is the right task for them now. If it is, give clear steps and a short first goal, ' +
      'check in often, and recognize early progress. ' + causeStep
  };
}
