# Pivot Labs

Interactive tools for everyday leadership. *Navigating Everyday Leadership.*

## What's in this repository

| Path | What it is |
| --- | --- |
| `index.html` | Home page. Starts with "What do you need help with?", then a featured visual guide card (today, Urgent vs important, with a 520 px web copy of its shareable image), then five starter cards, then lists every tool by category under "Or browse every tool." Shows the Pivot Labs seal. |
| `home.js` | The home page's starter cards: their questions, which tool each answer suggests, and why it fits. Runs on the shared situation picker. See "Home page starter cards" below. |
| `tools/` | One folder per tool. Each tool's page is the `index.html` inside its folder. |
| `tools/eisenhower-matrix/` | The Eisenhower Matrix. `recommendations.js` holds the logic for the guided questions. |
| `tools/team-development-map/` | The Team Development Map. Places one person and one task by skill and willingness. Built on the Eisenhower Matrix engine. `recommendations.js` holds the logic for the guided questions. |
| `tools/delegation-planner/` | The Delegation Planner. Six short steps for one handoff, ending in a printable handoff brief. The first guided planner. `content.js` holds its steps, questions, suggestions, and brief. |
| `tools/feedback-conversation-planner/` | The Feedback Conversation Planner. Five steps to prepare one feedback conversation: a few questions suggest one of six approaches, then the leader plans what to say and ends with a printable plan. The first tool to use the situation picker. `content.js` holds its questions, approaches, prompts, and plan. |
| `tools/root-cause-finder/` | The Root Cause Finder. Six steps to work through one problem: a few questions suggest the 5 Whys, a fishbone diagram, or a quick fix and check, then the leader finds the cause, plans the fix, and ends with a summary to share. Uses the guided planner and the situation picker. `content.js` holds its questions, methods, prompts, and summary. |
| `tools/coaching-approach-picker/` | The Coaching Approach Picker. Five steps to plan one coaching conversation: a few questions about the situation suggest one of seven approaches (find the goal, build on what's working, weigh the options, turn it into action, reconnect with the work, share what you've learned, or start with clear direction), then the leader plans the conversation and ends with a printable plan. Uses the guided planner and the situation picker, the same setup as the Feedback Conversation Planner. `content.js` holds its questions, approaches, routing, prompts, checklists, and plan. |
| `tools/decision-approach-picker/` | The Decision Approach Picker. Six steps to decide how to make one decision: three questions about the situation suggest one of four ways to decide (follow the known way, compare the options, try small and learn, or steady things first), then the leader works through that way and ends with a printable decision record. Compare the options is a small weighted matrix with its own step. Uses the guided planner and the situation picker, the same setup as the Coaching Approach Picker. `content.js` holds its questions, routing, methods, prompts, and record. |
| `tools/executive-ask-builder/` | The Executive Ask Builder. Six steps to prepare one ask for a decision from a manager or senior leaders: the ask, the context, the ask in words, the concerns to expect (cost, timing, capacity, risk, or something else), what to say in the room, and a readiness check. Ends with a printable ask brief. Uses the guided planner only (no situation picker, because it has one structure). `content.js` holds its steps, concern prompts, checklist, and brief. |
| `tools/role-clarity-builder/` | The Role Clarity Builder. Six steps to make one role clear, your own or one on your team: the role and who you'll go through it with, what the role runs, work it shares (with who has the last word) and work that belongs to someone else, the people it works with, who decides what (the Delegation Planner's three levels and suggested choices), and what to confirm. Ends with a printable role clarity sheet that lists anything not settled yet. Uses the guided planner only (no situation picker, because it has one structure). Its repeating lists are custom fields in `content.js`, which also holds its steps, decision levels, checklist, and sheet. |
| `assets/css/pivot-labs.css` | Shared styles for every page: fonts, colors, the brand header and its menu (Tools, Visual guides, About), buttons, form fields, answer choices, the session notice, dialogs, status messages, the "Suggested" tag, the "About this tool" section, the guided planner layout, the plan checklist, and the situation picker. The start of the Pivot Labs design system. |
| `assets/js/guided-planner.js` | The shared step engine for guided planners: the step list, Back and Continue, required answers, Start over with Undo, and showing the finished brief. It holds no tool wording. |
| `assets/js/situation-picker.js` | The shared situation picker: a few questions, a suggested option with the reason it fits, and the other options to choose instead. Works inside a guided planner step or on its own, as on the home page. It holds no tool wording. |
| `assets/img/` | The Pivot Labs seal in web sizes (`pivot-labs-seal-560.webp`, `-800.webp`, and a `-560.png` fallback) and the browser-tab icon (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`). Also the share preview image (`pivot-labs-share-1200x630.png`) and its source (`share-source.html`). |
| `assets/fonts/` | Playfair Display and Source Sans 3, shared by every page. Both use the SIL Open Font License (license files included). |
| `.nojekyll` | Tells GitHub Pages to publish the files as they are. |

## Adding a tool

1. Make a folder in `tools/` named for the tool, for example `tools/learning-solutions-guide/`.
2. Put the tool's `index.html`, and any script files it needs, in that folder.
3. Link the shared stylesheet before the page's own styles: `<link rel="stylesheet" href="../../assets/css/pivot-labs.css">`. It brings in the fonts, colors, header, buttons, and form styles. Add the three browser-tab icon `<link>` tags after `</title>` (see "Brand" below). Add the share preview tags (see "Share previews" below). Copy the header from another tool page, including its `<nav class="site-nav">` menu, which marks Tools as the current section with `aria-current="page"`.
4. Add the tool to the home page's browse list in `index.html`, under the category that matches what the leader is trying to do: its name as a link and one short line about what it's for. Add a new category group only when it has a tool to show.
5. Decide which starter card it belongs on, and add it there in `home.js` (see below). A tool doesn't have to be on a card, but most should be.

Add to the shared stylesheet only what more than one page will use. Styles for one page stay on that page.

## Home page starter cards

Each starter card is written in the leader's words ("Something keeps going wrong"). Clicking it opens a question or two right on the card. The answers suggest one tool, say why it fits, show the answers the suggestion rests on, and list the card's other tools. A card with only one fitting tool is a plain link instead (today, "I have a decision to make" goes straight to its tool). "I have a decision to make" will become a question card when the Role Risk Map is built. "I have a conversation to prepare for" asks "Who's the conversation with?" (someone I lead, my manager or senior leaders, or I'm not sure). "I need help with my team" starts with "Is this about one person or the whole team?" (one person, the whole team, or I'm not sure). The whole team leads to "People aren't sure who owns what" and the Role Clarity Builder; the other two show the questions below. On that card, the "I want to help someone grow" answer asks "Where are you starting from?" with four answers: a task in mind leads to the Team Development Map, ideas to share lead to the Feedback Conversation Planner, and "we haven't talked about it yet" or "I'm not sure" lead to the Coaching Approach Picker.

The cards are in `index.html` (one `<li class="starter">` each, with a `data-starter` name). Their questions and routing are in `home.js` under the same name.

Rules that keep the page from needing a redesign as tools are added:

- **Eight cards at most.** A new tool joins an existing card as an answer before it gets a card of its own.
- **Five answers per question at most, plus "I'm not sure."** Past that, add a question in front that splits the answers, and show the later questions with `showIf`.
- **One fitting tool means a link, not a question.** When a second tool fits that card, turn the link into a card with a question.
- **The same answers always give the same suggestion,** whoever the person is. Answers describe the situation, never the person.
- **A card shows only when it has a live tool.** Planned cards and where future tools fit are in the project's tool roadmap.

To add a tool to a card: add the tool to `TOOLS` in `home.js`, add it to the card's `options` with a one-line `bestFor`, add an answer that leads to it, and return it from the card's `suggest()` with a "why it fits" reason. To add a card: copy a starter `<li>` in `index.html`, give it a new `data-starter` name and ids, and add a matching entry to `STARTERS` in `home.js`.

## Adding a guided planner

Guided planners (for example the Executive Ask Builder and the Role Clarity Builder) reuse the Delegation Planner's setup. For fields the engine doesn't have, use a `custom` field: the Root Cause Finder's numbered why chain and fishbone areas show how, and the Role Clarity Builder's repeating rows (add, remove, and a limit) show another.

1. Copy `tools/delegation-planner/index.html` as a starting point. Keep `class="planner-page"` on `<body>` and the element ids the engine uses (listed at the top of `assets/js/guided-planner.js`).
2. Write a `content.js` for the new tool: its steps, questions, suggestions, and how to build the finished brief. Set `finishLabel` if the last button should say something other than "Review my brief."
3. Load `../../assets/js/guided-planner.js`, then `content.js`, then call `GuidedPlanner.create(...)` with the tool's content.

## Adding a situation picker

The situation picker suggests one option from a few questions and says why it fits. The leader can always choose another. The home page starter cards, the Feedback Conversation Planner, the Root Cause Finder, the Coaching Approach Picker, and the Decision Approach Picker use it.

1. Load `../../assets/js/situation-picker.js` and call `SituationPicker.create(...)` with the questions, the options, and a `suggest(answers)` rule. The same answers must always give the same suggestion, whoever the person is.
2. On its own page, call `picker.mount(container, options)`. Options with an `href` become links to that page or tool. Optional settings: `headingLevel` (3 when the picker sits under a page's h2), `showAnswers` (adds "Based on your answer:" with the answers given), and `changeInActions` (puts "Change my answers" beside the main button).
3. Inside a guided planner, put `picker.questions` in one step and `picker.field(...)` in the next. The Feedback Conversation Planner, the Root Cause Finder, and the Coaching Approach Picker show how.

The full setup is described at the top of `assets/js/situation-picker.js`.

## Visual guides

Each guide is a folder in `guides/` with the page (`index.html`) and a shareable image, 1080 x 1350 px. The hub at `guides/index.html` lists them.

From guide 2 on ("Urgent vs important"), the image's source is kept beside it as `share-source.html`. It is a fixed-size page that uses the site's fonts and colors, with a `noindex` tag because it is not a page for visitors. To change an image, edit `share-source.html`, then remake the PNG from the repository's top folder:

```
python3 -m http.server 8765 &
google-chrome --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1080,1350 --virtual-time-budget=3000 --screenshot=guides/urgent-vs-important/urgent-vs-important-share.png http://127.0.0.1:8765/guides/urgent-vs-important/share-source.html
```

### The featured guide on the home page

The card under the opening question always shows the **newest** guide, and its tag says "Newest visual guide." That is the whole rule, so the card is never an unexplained pick. When a new guide goes live, change the card in the same commit as the hub entry: the image (make a 520 px wide `.webp` copy beside the guide's shareable image, as `urgent-vs-important-share-520.webp` does), the title, the link, and the one-line reason. Keep the tag. Later, once there are several guides and a few weeks of visitor data, the rule could change, for example to the most viewed guide, with a matching tag.

The same command works for any guide: change the folder and file names (for example `guides/skill-and-will/skill-and-will-share.png` and `guides/skill-and-will/share-source.html`). Keep the wording in `share-source.html` in step with the guide page. The guide 1 image ("Find the real cause") has no source file in the repository.

## Share previews

When a Pivot Labs link is posted on LinkedIn or elsewhere, the site shows a title, a short description, and a picture. Every page has these tags right after its `</title>`: `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image` (with width, height, and alt text), and `twitter:card`. The title and description repeat the page's own `<title>` and `description`, and `og:url` is the page's folder address, for example `https://pivotlabsleadership.com/tools/eisenhower-matrix/`. Every page uses the same picture, `assets/img/pivot-labs-share-1200x630.png` (1200 x 630 px, the shape link previews use). Link previews need full web addresses, so `og:image` and `og:url` start with `https://pivotlabsleadership.com`.

For a new page, copy the tags from a similar page and change the title, description, and `og:url`. Keep them matching the page's own title and description.

The picture's source is `assets/img/share-source.html`. To change the picture, edit it, then remake the PNG from the repository's top folder:

```
python3 -m http.server 8765 &
google-chrome --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=3000 --screenshot=assets/img/pivot-labs-share-1200x630.png http://127.0.0.1:8765/assets/img/share-source.html
```

LinkedIn keeps a copy of each link's preview for a while. After a change, clear it with the LinkedIn Post Inspector (linkedin.com/post-inspector) by entering the page's address.

## How the tools handle entries

The tools run in the browser. There is no server or login, and each page blocks network requests except to Cloudflare Web Analytics, which counts page visits. Entries are not sent anywhere. Entries clear when the page is refreshed or closed.

## Brand

Built to the Pivot Labs Brand Guide 2.1 (Deep Navy is the Pivot Labs signature color).

- **Seal.** The folded-ribbon seal with "Navigating Everyday Leadership" appears on the home page only, at 240 px or more of visible seal with clear space around it. The files in `assets/img/` are resized copies of the approved PNG: same proportions, nothing cropped, recolored, or redrawn. To change the seal, replace the files from a new approved PNG.
- **Tool headers** use the live-text brand name, as the guide requires at navigation size.
- **Home page icons.** Added November 15, 2026. Each starter card and each tool in the browse list has a line icon in a soft circle (the navy tint, `--navy-tint`). The icons are Tabler Icons (MIT license, notice in `THIRD_PARTY.md`), copied into `index.html` as inline SVG so nothing loads from outside. They are decorative (`aria-hidden`), always beside a text title. Card icons: too much on my plate (stack), team (users), conversation (messages), keeps going wrong (search), decision (split arrows). Tool icons are in each tool's `<li>` in the browse list. A new tool takes one icon the same way (a `tool-icon` span before a `tool-text` span).
- **Browser-tab icon.** The small mark (ribbon on navy) was approved as a favicon on November 14, 2026. It's on the home page and every tool page (added to the tool pages with the brand owner's OK on November 15, 2026). A new tool page takes the same three `<link>` tags after `</title>`, with `../../` in front of each path: `favicon.svg` (`type="image/svg+xml"`), `favicon-32.png` (`sizes="32x32"`), and `apple-touch-icon.png` (as `rel="apple-touch-icon"`).
- New logo variants, palette changes, and program identities need review by the brand owner before release.
