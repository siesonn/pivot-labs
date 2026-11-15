# Pivot Labs

Interactive tools for everyday leadership. *Navigating Everyday Leadership.*

## What's in this repository

| Path | What it is |
| --- | --- |
| `index.html` | Home page. Starts with "What do you need help with?" and four starter cards, then lists every tool by category under "Or browse every tool." Shows the Pivot Labs seal. |
| `home.js` | The home page's starter cards: their questions, which tool each answer suggests, and why it fits. Runs on the shared situation picker. See "Home page starter cards" below. |
| `tools/` | One folder per tool. Each tool's page is the `index.html` inside its folder. |
| `tools/eisenhower-matrix/` | The Eisenhower Matrix. `recommendations.js` holds the logic for the guided questions. |
| `tools/team-development-map/` | The Team Development Map. Places one person and one task by skill and willingness. Built on the Eisenhower Matrix engine. `recommendations.js` holds the logic for the guided questions. |
| `tools/delegation-planner/` | The Delegation Planner. Six short steps for one handoff, ending in a printable handoff brief. The first guided planner. `content.js` holds its steps, questions, suggestions, and brief. |
| `tools/feedback-conversation-planner/` | The Feedback Conversation Planner. Five steps to prepare one feedback conversation: a few questions suggest one of six approaches, then the leader plans what to say and ends with a printable plan. The first tool to use the situation picker. `content.js` holds its questions, approaches, prompts, and plan. |
| `tools/root-cause-finder/` | The Root Cause Finder. Six steps to work through one problem: a few questions suggest the 5 Whys, a fishbone diagram, or a quick fix and check, then the leader finds the cause, plans the fix, and ends with a summary to share. Uses the guided planner and the situation picker. `content.js` holds its questions, methods, prompts, and summary. |
| `assets/css/pivot-labs.css` | Shared styles for every page: fonts, colors, the brand header, buttons, form fields, answer choices, the session notice, dialogs, status messages, the "Suggested" tag, the "About this tool" section, the guided planner layout, and the situation picker. The start of the Pivot Labs design system. |
| `assets/js/guided-planner.js` | The shared step engine for guided planners: the step list, Back and Continue, required answers, Start over with Undo, and showing the finished brief. It holds no tool wording. |
| `assets/js/situation-picker.js` | The shared situation picker: a few questions, a suggested option with the reason it fits, and the other options to choose instead. Works inside a guided planner step or on its own, as on the home page. It holds no tool wording. |
| `assets/img/` | The Pivot Labs seal in web sizes (`pivot-labs-seal-560.webp`, `-800.webp`, and a `-560.png` fallback) and the browser-tab icon (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`). |
| `assets/fonts/` | Playfair Display and Source Sans 3, shared by every page. Both use the SIL Open Font License (license files included). |
| `.nojekyll` | Tells GitHub Pages to publish the files as they are. |

## Adding a tool

1. Make a folder in `tools/` named for the tool, for example `tools/learning-solutions-guide/`.
2. Put the tool's `index.html`, and any script files it needs, in that folder.
3. Link the shared stylesheet before the page's own styles: `<link rel="stylesheet" href="../../assets/css/pivot-labs.css">`. It brings in the fonts, colors, header, buttons, and form styles.
4. Add the tool to the home page's browse list in `index.html`, under the category that matches what the leader is trying to do: its name as a link and one short line about what it's for. Add a new category group only when it has a tool to show.
5. Decide which starter card it belongs on, and add it there in `home.js` (see below). A tool doesn't have to be on a card, but most should be.

Add to the shared stylesheet only what more than one page will use. Styles for one page stay on that page.

## Home page starter cards

Each starter card is written in the leader's words ("Something keeps going wrong"). Clicking it opens a question or two right on the card. The answers suggest one tool, say why it fits, show the answers the suggestion rests on, and list the card's other tools. A card with only one fitting tool is a plain link instead (today, "I have a conversation to prepare for" goes straight to the Feedback Conversation Planner).

The cards are in `index.html` (one `<li class="starter">` each, with a `data-starter` name). Their questions and routing are in `home.js` under the same name.

Rules that keep the page from needing a redesign as tools are added:

- **Eight cards at most.** A new tool joins an existing card as an answer before it gets a card of its own.
- **Five answers per question at most, plus "I'm not sure."** Past that, add a question in front that splits the answers, and show the later questions with `showIf`.
- **One fitting tool means a link, not a question.** When a second tool fits that card, turn the link into a card with a question.
- **The same answers always give the same suggestion,** whoever the person is. Answers describe the situation, never the person.
- **A card shows only when it has a live tool.** Planned cards and where future tools fit are in the project's tool roadmap.

To add a tool to a card: add the tool to `TOOLS` in `home.js`, add it to the card's `options` with a one-line `bestFor`, add an answer that leads to it, and return it from the card's `suggest()` with a "why it fits" reason. To add a card: copy a starter `<li>` in `index.html`, give it a new `data-starter` name and ids, and add a matching entry to `STARTERS` in `home.js`.

## Adding a guided planner

Guided planners (for example the Role Clarity Builder) reuse the Delegation Planner's setup. For fields the engine doesn't have, use a `custom` field: the Root Cause Finder's numbered why chain and fishbone areas show how.

1. Copy `tools/delegation-planner/index.html` as a starting point. Keep `class="planner-page"` on `<body>` and the element ids the engine uses (listed at the top of `assets/js/guided-planner.js`).
2. Write a `content.js` for the new tool: its steps, questions, suggestions, and how to build the finished brief. Set `finishLabel` if the last button should say something other than "Review my brief."
3. Load `../../assets/js/guided-planner.js`, then `content.js`, then call `GuidedPlanner.create(...)` with the tool's content.

## Adding a situation picker

The situation picker suggests one option from a few questions and says why it fits. The leader can always choose another. The home page starter cards use it, and so will the Coaching Approach Picker and the Decision Toolkit.

1. Load `../../assets/js/situation-picker.js` and call `SituationPicker.create(...)` with the questions, the options, and a `suggest(answers)` rule. The same answers must always give the same suggestion, whoever the person is.
2. On its own page, call `picker.mount(container, options)`. Options with an `href` become links to that page or tool. Optional settings: `headingLevel` (3 when the picker sits under a page's h2), `showAnswers` (adds "Based on your answer:" with the answers given), and `changeInActions` (puts "Change my answers" beside the main button).
3. Inside a guided planner, put `picker.questions` in one step and `picker.field(...)` in the next. The Feedback Conversation Planner and the Root Cause Finder show how.

The full setup is described at the top of `assets/js/situation-picker.js`.

## How the tools handle entries

The tools run in the browser. There is no server or login, and each page blocks network requests, so entries are not sent anywhere. Entries clear when the page is refreshed or closed.

## Brand

Built to the Pivot Labs Brand Guide 2.1 (Deep Navy is the Pivot Labs signature color).

- **Seal.** The folded-ribbon seal with "Navigating Everyday Leadership" appears on the home page only, at 240 px or more of visible seal with clear space around it. The files in `assets/img/` are resized copies of the approved PNG: same proportions, nothing cropped, recolored, or redrawn. To change the seal, replace the files from a new approved PNG.
- **Tool headers** use the live-text brand name, as the guide requires at navigation size.
- **Browser-tab icon.** The small mark (ribbon on navy) was approved as a favicon on November 14, 2026. It's on the home page. Adding it to a tool page takes the same three `<link>` tags in that page's `<head>` (with `../../` in front of each path), and needs the brand owner's OK first.
- New logo variants, palette changes, and program identities need review by the brand owner before release.
