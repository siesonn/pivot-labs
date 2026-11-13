# Pivot Labs

Interactive tools for everyday leadership. *Navigating Everyday Leadership.*

## What's in this repository

| Path | What it is |
| --- | --- |
| `index.html` | Home page. Lists the tools. |
| `tools/` | One folder per tool. Each tool's page is the `index.html` inside its folder. |
| `tools/eisenhower-matrix/` | The Eisenhower Matrix. `recommendations.js` holds the logic for the guided questions. |
| `assets/fonts/` | Playfair Display and Source Sans 3, shared by every page. Both use the SIL Open Font License (license files included). |
| `.nojekyll` | Tells GitHub Pages to publish the files as they are. |

## Adding a tool

1. Make a folder in `tools/` named for the tool, for example `tools/learning-solutions-guide/`.
2. Put the tool's `index.html`, and any script files it needs, in that folder.
3. Load fonts from `../../assets/fonts/`.
4. Add a card for the tool on the home page.

## How the tools handle entries

The tools run in the browser. There is no server or login, and each page blocks network requests, so entries are not sent anywhere. Entries clear when the page is refreshed or closed.

## Brand

Built to the Pivot Labs Brand Guide 2.0. New logo variants, palette changes, and program identities need review by the brand owner before release.
