# Pivot Labs

Interactive tools for everyday leadership. *Navigating Everyday Leadership.*

## What's in this repository

| Path | What it is |
| --- | --- |
| `index.html` | Home page. Lists the tools, grouped by what the leader is working through. |
| `tools/` | One folder per tool. Each tool's page is the `index.html` inside its folder. |
| `tools/eisenhower-matrix/` | The Eisenhower Matrix. `recommendations.js` holds the logic for the guided questions. |
| `tools/team-development-map/` | The Team Development Map. Places one person and one task by skill and willingness. Built on the Eisenhower Matrix engine. `recommendations.js` holds the logic for the guided questions. |
| `tools/delegation-planner/` | The Delegation Planner. Six short steps for one handoff, ending in a printable handoff brief. The first guided planner. `content.js` holds its steps, questions, suggestions, and brief. |
| `tools/feedback-conversation-planner/` | The Feedback Conversation Planner. Five steps to prepare one feedback conversation: a few questions suggest one of six approaches, then the leader plans what to say and ends with a printable plan. The first tool to use the situation picker. `content.js` holds its questions, approaches, prompts, and plan. |
| `assets/css/pivot-labs.css` | Shared styles for every page: fonts, colors, the brand header, buttons, form fields, answer choices, the session notice, dialogs, status messages, the "Suggested" tag, the "About this tool" section, the guided planner layout, and the situation picker. The start of the Pivot Labs design system. |
| `assets/js/guided-planner.js` | The shared step engine for guided planners: the step list, Back and Continue, required answers, Start over with Undo, and showing the finished brief. It holds no tool wording. |
| `assets/js/situation-picker.js` | The shared situation picker: a few questions, a suggested option with the reason it fits, and the other options to choose instead. Works inside a guided planner step or on its own page. It holds no tool wording. |
| `assets/fonts/` | Playfair Display and Source Sans 3, shared by every page. Both use the SIL Open Font License (license files included). |
| `.nojekyll` | Tells GitHub Pages to publish the files as they are. |

## Adding a tool

1. Make a folder in `tools/` named for the tool, for example `tools/learning-solutions-guide/`.
2. Put the tool's `index.html`, and any script files it needs, in that folder.
3. Link the shared stylesheet before the page's own styles: `<link rel="stylesheet" href="../../assets/css/pivot-labs.css">`. It brings in the fonts, colors, header, buttons, and form styles.
4. Add a card for the tool on the home page, under the category that matches what the leader is trying to do. Add a new category section only when it has a tool to show.

Add to the shared stylesheet only what more than one tool will use. Styles for one tool stay on that tool's page.

## Adding a guided planner

Guided planners (for example the Root Cause Finder) reuse the Delegation Planner's setup:

1. Copy `tools/delegation-planner/index.html` as a starting point. Keep `class="planner-page"` on `<body>` and the element ids the engine uses (listed at the top of `assets/js/guided-planner.js`).
2. Write a `content.js` for the new tool: its steps, questions, suggestions, and how to build the finished brief. Set `finishLabel` if the last button should say something other than "Review my brief."
3. Load `../../assets/js/guided-planner.js`, then `content.js`, then call `GuidedPlanner.create(...)` with the tool's content.

## Adding a situation picker

The situation picker suggests one option from a few questions and says why it fits. The leader can always choose another. Use it for the Coaching Approach Picker, the Decision Toolkit, and the home page starter cards.

1. Load `../../assets/js/situation-picker.js` and call `SituationPicker.create(...)` with the questions, the options, and a `suggest(answers)` rule. The same answers must always give the same suggestion, whoever the person is.
2. On its own page, call `picker.mount(container, options)`. Options with an `href` become links to that page or tool.
3. Inside a guided planner, put `picker.questions` in one step and `picker.field(...)` in the next. The Feedback Conversation Planner shows how.

The full setup is described at the top of `assets/js/situation-picker.js`.

## How the tools handle entries

The tools run in the browser. There is no server or login, and each page blocks network requests, so entries are not sent anywhere. Entries clear when the page is refreshed or closed.

## Brand

Built to the Pivot Labs Brand Guide 2.0. New logo variants, palette changes, and program identities need review by the brand owner before release.
