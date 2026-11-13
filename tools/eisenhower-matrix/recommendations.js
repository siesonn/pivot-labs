'use strict';

// The guide recommends a next action. Placement never assigns or removes work.
function recommendTask(answers) {
  const {purpose, timing, owner} = answers;
  const clarifyTiming = 'Confirm the latest safe start with the requester, allowing for preparation and dependencies.';
  const discuss = (reason, action) => ({
    zone: 'delegate',
    title: 'Discuss before deciding',
    reason,
    action
  });
  const ownWork = reason => ({
    zone: timing === 'later' ? 'schedule' : 'do',
    reason,
    action: timing === 'later'
      ? 'Block time to start before the deadline, with time for preparation and review.'
      : 'Choose your next action and protect time for it now.'
  });

  if (purpose === 'low') {
    return {
      zone: 'reconsider',
      reason: 'The work has limited value and no known requirement. It may be worth reducing, combining, deferring, or stopping.',
      action: (timing === 'now' ? 'Check with the requester today. ' :
        timing === 'unsure' ? clarifyTiming + ' ' : '') +
        'Check what would happen if you changed the work. Agree on the change with anyone relying on it.'
    };
  }
  if (purpose === 'unsure') {
    return discuss('The purpose or requirement is unclear.',
      (timing === 'now' ? 'Ask today' : 'Ask') +
      ' what outcome is needed and what happens if work is delayed. Honor existing commitments while you clarify.' +
      (timing === 'unsure' ? ' ' + clarifyTiming : ''));
  }
  if (owner === 'unsure') {
    return discuss('Ownership is unclear. Even important or required work can be shared.',
      (timing === 'now' ? 'Confirm ownership today. ' : 'Confirm ownership. ') +
      'Agree on who will do the work and who will review it. Keep the current owner until a handoff is agreed.' +
      (timing === 'unsure' ? ' ' + clarifyTiming : ''));
  }
  if (owner === 'me') {
    if (timing === 'unsure') {
      return discuss('This work needs your involvement. The latest safe start is unclear.',
        clarifyTiming + ' Keep responsibility for the task.');
    }
    const value = purpose === 'required' ? 'required or already committed' : 'tied to a meaningful outcome';
    return ownWork('This work is ' + value + ' and needs your authority, expertise, or judgment.');
  }

  const checks = {
    skills: 'the skills needed',
    capacity: 'the person’s available capacity',
    handoff: 'time to brief the person and complete the work',
    review: 'time for review and corrections',
    authority: 'approval to assign the work'
  };
  const blocked = Object.keys(checks).filter(key => key !== 'authority' && answers[key] === 'no');
  const unconfirmed = Object.keys(checks).filter(key => answers[key] !== 'yes');
  const list = keys => new Intl.ListFormat('en', {type: 'conjunction'}).format(keys.map(key => checks[key]));
  if (blocked.length && timing !== 'unsure') {
    const result = ownWork('A handoff is impractical given ' + list(blocked) + '. Keep responsibility for now.');
    result.action += ' If you cannot complete it, agree on support, scope, or timing with the requester.';
    return result;
  }
  if (unconfirmed.length || timing === 'unsure') {
    const checkAction = unconfirmed.length ? 'Resolve ' + list(unconfirmed) + ' before assigning the work. ' : '';
    return discuss('A workable handoff still needs confirmation.',
      (timing === 'unsure' ? clarifyTiming + ' ' : timing === 'now' ? 'Have the conversation today. ' : '') +
      checkAction + 'Keep the current owner until a handoff is agreed.');
  }
  return {
    zone: 'delegate',
    title: 'Delegate all or part',
    reason: 'Someone with the skills and capacity can take on the work. There is time to brief them, complete the work, and review it. You have permission to assign it.',
    action: (timing === 'now' ? 'Start the handoff today. ' : '') +
      'Agree on the owner, scope, due date, and review checkpoint. Retain any decisions or review that require you.'
  };
}
