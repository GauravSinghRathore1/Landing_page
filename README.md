# thetye.store — Landing Page

A **single-file, zero-dependency** website for [thetye.store](https://thetye.store), built as a playful 404 page disguised as a data-platform dashboard. Markup, styles, animation, mini-games, a mock terminal and all persistence live in one `404.html` — there is no framework, no build step, no package manager and no third-party request.

| | |
|---|---|
| **Live site** | <https://thetye.store> |
| **Repository** | <https://github.com/GauravSinghRathore1/Landing_page> |
| **GitHub Pages** | <https://gauravsinghrathore1.github.io/Landing_page/> |
| **Owner** | Gaurav Singh Rathore — Data Engineer |
| **Stack** | HTML5, CSS3, vanilla JavaScript (ES5-style) |
| **Hosting** | GitHub Pages + custom domain (`CNAME`) |
| **Status** | Active development — `main` is the deployed branch |

> **By design:** there is no `index.html`. The entire site is `404.html`, so every path — including `/` — is answered with HTTP **404** and the full experience still renders.

---

## Contents

- [What this is](#what-this-is)
- [Feature highlights](#feature-highlights)
- [Site anatomy](#site-anatomy)
- [The pipeline simulation](#the-pipeline-simulation)
- [Fix the pipeline (puzzle)](#fix-the-pipeline-puzzle)
- [Mini-games](#mini-games)
- [Terminal](#terminal)
- [Command palette](#command-palette)
- [Settings, effects and sound](#settings-effects-and-sound)
- [Power, boot and the cable](#power-boot-and-the-cable)
- [Hidden secrets](#hidden-secrets)
- [Owner card and contact](#owner-card-and-contact)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Local storage keys](#local-storage-keys)
- [File structure](#file-structure)
- [Run locally](#run-locally)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Development workflow](#development-workflow)
- [Manual test checklist](#manual-test-checklist)
- [Browser support](#browser-support)
- [Accessibility](#accessibility)
- [Privacy](#privacy)
- [Known notes and limitations](#known-notes-and-limitations)
- [License](#license)
- [Author](#author)

---

## What this is

`thetye.store` is a purchased domain with no product behind it yet. Instead of a plain "parked domain" page, this repo turns the dead end into a small interactive toy:

- The visual language is a **data-pipeline orchestrator**: DAG view, scheduler strip, task drawer, log stream, Spark-style job view and a command terminal.
- The copy is honest about the situation — *"This domain has been purchased."* / *"The page you asked for doesn't exist."*
- Visitors can repair the pipeline, play three mini-games, reskin the page, pull the server's power cable and hunt six secrets.
- Everything runs client-side. There is no backend, no database and no tracking.

The page is deliberately a **404 document** so it works as GitHub Pages' custom not-found page for any unknown URL under the domain.

---

## Feature highlights

- **Three themes** — `dark`, `light` and a CRT-style `terminal`, persisted and applied before first paint.
- **Animated 404 scene** — interactive shapes that pop, parallax on pointer move.
- **Live DAG simulation** — five tasks, five dependencies, timestamped logs, status legend and a per-task inspector.
- **"Fix the pipeline" puzzle** — reconnect the wiped dependencies in as few moves as possible.
- **Three mini-games** — Clean Sweep, Flap 404 and Pull the plug.
- **Command terminal** — 30+ commands, history, aliases and several easter eggs.
- **Command palette** — `Ctrl`/`Cmd` + `K` for everything the page can do.
- **Celebration effects** — matrix rain, hyperspace, network burst, lightning and a DNA helix.
- **Synthesised sound** — three packs generated with the Web Audio API, plus optional vibration.
- **Power system** — yank the cable to shut the page down; state survives a reload until you plug it back in.
- **Six hidden secrets** — with an in-page hint system and a progress counter.
- **Accessible by default** — ARIA roles, live regions, keyboard paths and full `prefers-reduced-motion` handling.

---

## Site anatomy

| Tab | Element | Contents |
|---|---|---|
| **Home** | `#pn_pipe` | Hero, animated 404 scene, task graph, log stream, puzzle controls |
| **Games** | `#pn_games` | Cards for Clean Sweep, Flap 404 and Pull the plug |
| **About** | `#pn_about` | Request details (domain, requested path) and the owner card |
| **Spark UI** *(hidden)* | `#sparkview` | Mock Spark job: `Job 404`, SQL, executors, event timeline, Photon engine |
| **Terminal** *(hidden)* | `#pn_term` | Interactive console with output log and command history |

Hidden views are intentionally not shown in the tab strip of the public build. They are reachable from the command palette (**Open the secret console**) and from the terminal (`spark`, `dag`).

The top bar holds the site badge, the **settings** popover and the **menu** button. A draggable power cable sits at the bottom-left of the viewport.

---

## The pipeline simulation

The "Home" tab runs a fake orchestration of a request for a missing page:

```
receive_request ──> resolve_dns ──┐
       └─────────> check_cache ───┴──> lookup_path ──> render_page
```

| Task | Operator | What it pretends to do |
|---|---|---|
| `receive_request` | `HttpSensor` | Accepts the incoming GET request |
| `resolve_dns` | `PythonOperator` | Resolves the domain to the web edge |
| `check_cache` | `PythonOperator` | Looks for a cached copy of the page |
| `lookup_path` | `SqlOperator` | Queries `gold.site_pages` for the requested path |
| `render_page` | `PythonOperator` | Renders the page for the requested path |

- Each run animates tasks through **queued → running → success** (or **skipped**) with an edge label such as `1 row`, `miss` or `0 rows`.
- The log panel is timestamped, level-tagged, capped at 300 entries and announces new lines to screen readers.
- Clicking a task opens a drawer with its operator, state, duration, upstream, downstream and description; it also filters the log stream. **show all** clears the filter.
- **Clear task & re-run** replays the simulation.
- The scheduler strip tracks how many hidden secrets you have found (`0/6`).

---

## Fix the pipeline (puzzle)

**Fix the pipeline** wipes all five dependencies and switches the DAG into puzzle mode.

- Tap a task, then the task that should run **after** it. Data flows left to right, top to bottom.
- A correct link is drawn on the graph and the tasks turn green.
- A wrong pair shakes and logs a warning; a reversed pair warns about the direction.
- Every attempt counts as a move. Linking all five dependencies wins the round: confetti, a sound, a vibration (where supported) and a glow on the contact button.
- **Exit puzzle** restores the normal simulation. The move count and win state feed the shareable run summary.

---

## Mini-games

| Game | How to play | Scoring | Best score key |
|---|---|---|---|
| **Clean Sweep** | 30-second round. Tap falling junk (`SPAM`, `404`, `bug`, `typo`, …) before it lands in the clean zone. Leave the good items alone. | Junk swept `+1`, good item hit `−2`, junk landing `−1` | `thetye-dd` |
| **Flap 404** | Canvas one-tap game. Tap, click or press `Space` to flap through the gaps. | Distance / gaps passed | `thetye-fl` |
| **Pull the plug** | Drag the cable out of the socket, or just tap it. Plug it back in to reboot the page. | No score — the state persists | `thetye-power` |

All three are also launchable from the terminal (`sweep`, `flap`, `poweroff`).

---

## Terminal

The terminal is hidden from the public tab strip. Open it with **`Ctrl`/`Cmd` + `K` → "Open the secret console"**, then type `help`.

- `↑` / `↓` walk through command history.
- Commands are case-insensitive; aliases are listed below.
- Any `select …` statement returns `0 rows` by design (it is not a real SQL engine).
- `spark` opens the mock Spark UI; `dag` / `orchestrator` returns to the DAG view.

### Command reference

| Command | Aliases | What it does |
|---|---|---|
| `help` | | Lists every command |
| `whoami` | | Prints the guest identity |
| `ls` | | Lists the fake warehouse layout |
| `cat <file>` | | `contact`, `domain.purchased`, `readme.md`, `404.html` |
| `status` | | Health summary of the fake scheduler |
| `run` | `rerun` | Replays the pipeline |
| `play` | | Retired puzzle notice (points to the new games) |
| `exit` | | Leaves the active game/puzzle |
| `sweep` | `dedupe`, `dash` | Opens Clean Sweep |
| `flap` | `game` | Opens Flap 404 |
| `poweroff` | `shutdown` | Pulls the plug |
| `theme <name>` | | `dark`, `light`, `terminal` |
| `effect <name>` | `fx` | `matrix`, `warp`, `network`, `lightning`, `helix`, `none` |
| `sound <name>` | `sfx` | `off`, `tick`, `chime`, `8bit` |
| `vibrate on\|off` | | Haptics where supported |
| `hint` | | Clue for the next unfound secret |
| `secrets` | | Progress, e.g. `secrets found: 2/6` |
| `share` | | Copies your run summary |
| `menu` | `palette` | Opens the command palette |
| `spark` | | Opens the hidden Spark UI |
| `dag` | `orchestrator` | Returns to the DAG view |
| `date` | | Current date and time |
| `clear` | | Clears terminal output |
| `konami` | | Triggers the Konami easter egg |
| `ping` | | `pong. the pipeline is healthy, the page is not.` |
| `sudo …` | | Joke responses; one destructive-looking form triggers a secret |
| `rm …` | | Always refuses — the filesystem is "read-only" |
| `vacuum`, `optimize …` | | Data-engineering in-jokes that unlock secrets |
| `git blame` | | Reveals the joke credit and unlocks a secret |

---

## Command palette

Open with **`Ctrl`/`Cmd` + `K`**, the **menu ⌘K** button, or the terminal's `menu` command.

- Type to filter, `↑`/`↓` to move, `Enter` to run, `Esc` to close.
- Includes every theme, every effect, every sound pack, both games, the power cable, vibration, share, hints, the terminal and the games tab.

---

## Settings, effects and sound

The **settings** popover in the top bar controls:

| Setting | Options | Persisted as |
|---|---|---|
| Theme | `dark`, `light`, `terminal` | `thetye-theme` |
| Celebration effect | `none`, `matrix`, `warp`, `network`, `lightning`, `helix` | `thetye-fx` |
| Sound pack | `off`, `tick` (soft tick), `chime`, `8bit` | `thetye-snd` |
| Vibration | `on` / `off` (supported phones only) | `thetye-vib` |

- The first visit follows `prefers-color-scheme`; an explicit choice always wins.
- The `terminal` theme adds scanlines, a green phosphor palette and a black background.
- Effects are drawn on a full-screen overlay canvas, auto-play when a pipeline run completes, and can be previewed with the **▶** button.
- Sounds are synthesised with oscillators (Web Audio API) — no audio files are shipped.
- When reduced motion is enabled, animation, sound, confetti and vibration are all suppressed.

---

## Power, boot and the cable

- **Pull the plug** (game card, command palette or `poweroff`) plays a CRT power-off, cuts the signal and shows a "no signal" screen with the server's blinking red LED.
- The off state is stored in `thetye-power`, so a reload comes back with the power still out — that is intentional.
- **Plug it back in** (drag the cable, tap it, or press `Enter`/`Space` while it is focused) runs a BIOS-style boot: power surge, POST lines, progress bar, then the sections power on in sequence.
- A **Skip ▸** control appears during the boot animation.
- With reduced motion on, the sequence is replaced by an instant restore.

---

## Hidden secrets

There are **six** collectible secrets. The strip under the hero shows progress (`hidden surprises found 0/6`), and the terminal exposes hints:

```text
hint      → clue for the next secret you haven't found
secrets   → how many you have found
```

Progress is stored in `thetye-secrets` as a JSON map, so it survives reloads. Finding all six triggers a hyperspace effect and a small congratulation.

<details>
<summary><strong>Spoilers — what the six secrets are</strong></summary>

| # | Secret | Hint |
|---|---|---|
| 1 | The old gamers' code | Enter the Konami sequence, or type `konami` |
| 2 | `sudo rm -rf /` | Run the destructive `sudo` command and watch the restore |
| 3 | Vacuum | Try `vacuum 0` in the terminal |
| 4 | Optimize Z-Order | Try `optimize … zorder` in the terminal |
| 5 | The logo | Tap the little logo in the header five times |
| 6 | Git blame | Type `git blame` in the terminal |

Secret 5 also reveals the owner's note (`OWNER.note`).

</details>

---

## Owner card and contact

The **About** tab shows the domain, the requested path and an owner card generated from the `OWNER` object. The card derives initials from the name, renders stack tags and safe `http(s)` links, and hides the tag row when empty.

- With `OWNER_EMAIL` empty, the contact button reads **"Contact details coming soon"**, is disabled for interaction and the copy button is hidden.
- With an email set, the button opens a pre-filled `mailto:` and **Copy email** uses the Clipboard API with a `textarea` fallback.
- Winning the pipeline puzzle adds a glow to the contact button.
- A **share** action copies a summary of your run: `host 404: fixed the pipeline in N moves, found X/6 secrets.`

---

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `Ctrl`/`Cmd` + `K` | Open / close the command palette |
| `↑` / `↓` | Move in the palette |
| `Enter` | Run the highlighted palette command / submit a terminal command |
| `Esc` | Close palette, games, settings popover or drawer |
| `↑` / `↓` (terminal) | Command history |
| `Enter` / `Space` (plug focused) | Pull or reconnect the power cable |
| Konami sequence | `↑ ↑ ↓ ↓ ← → ← → B A` |

The header logo easter egg is pointer-based (five taps).

---

## Local storage keys

All state is local to the browser profile; nothing is sent anywhere.

| Key | Values | Purpose |
|---|---|---|
| `thetye-theme` | `dark` \| `light` \| `terminal` | Selected theme |
| `thetye-fx` | `none` \| `matrix` \| `warp` \| `network` \| `lightning` \| `helix` | Celebration effect |
| `thetye-snd` | `off` \| `tick` \| `chime` \| `8bit` | Sound pack |
| `thetye-vib` | `1` / `0` | Haptics preference |
| `thetye-power` | `off` | Present only while the page is powered down |
| `thetye-secrets` | JSON object | Secrets already unlocked |
| `thetye-dd` | integer | Clean Sweep best score |
| `thetye-fl` | integer | Flap 404 best score |

Clearing site data resets the page to its defaults.

---

## File structure

```text
.
├── 404.html      # The entire site: markup, CSS, JS, games, terminal (~124 KB)
├── CNAME         # Custom domain for GitHub Pages: thetye.store
├── .nojekyll     # Tells GitHub Pages to serve files as-is (no Jekyll)
└── README.md     # This document
```

There is no `index.html`, no `package.json`, no bundler and no server code. The only runtime dependency is the browser.

---

## Run locally

Because everything is static, either method works:

**Option A — open the file directly**

```powershell
Start-Process .\404.html
```

The page runs, but `location.hostname` is empty, so the UI falls back to `this-domain`, and clipboard behaviour can vary between browsers.

**Option B — serve it over HTTP (recommended)**

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000/404.html>. Any static server works; there is nothing to install or compile.

> On GitHub Pages, unknown paths automatically render `404.html`. A local server will return its own 404 for those paths unless configured otherwise, so use `/404.html` while developing.

---

## Configuration

Owner details live near the top of the main script in `404.html` (search for **Owner config**):

```js
var OWNER_EMAIL = "";                       // e.g. "hello@thetye.store"; empty shows "coming soon"
var OWNER = {
  name: "Gaurav Singh Rathore",             // leave empty to hide
  title: "Data Engineer",
  bio: "Builds data pipelines and cloud data platforms.",
  stack: [],                                // e.g. ["Databricks", "Azure Data Factory"]
  links: [],                                // e.g. [{ label: "LinkedIn", url: "https://..." }]
  note: "Thanks for poking around..."       // shown by the five-tap logo easter egg (optional)
};
```

| Field | Effect |
|---|---|
| `OWNER_EMAIL` | Enables the `mailto:` contact button, the copy button and `cat contact`; empty disables them gracefully |
| `OWNER.name` | Display name and avatar initials |
| `OWNER.title` | Small label next to the name |
| `OWNER.bio` | Paragraph in the owner card |
| `OWNER.stack` | Rendered as tags |
| `OWNER.links` | Rendered as tags; only `http://` and `https://` URLs are accepted |
| `OWNER.note` | Text inside the hidden note panel; has a default fallback |

The page title is generated client-side as `404 — Page not found | <host>`. The requested path is shown in the About tab exactly as typed; in the request log, paths longer than 48 characters are shortened to 45 characters plus `...`.

---

## Deployment

The site is published with **GitHub Pages** from the root of `main`, served at `thetye.store` through the `CNAME` file.

1. **Settings → Pages → Build and deployment**
   - Source: *Deploy from a branch*
   - Branch: `main`, folder: `/ (root)`
2. Keep `CNAME` containing `thetye.store` and `.nojekyll` at the repo root.
3. **DNS (as currently configured)**
   - Apex `thetye.store` → `A 185.199.108.153`
   - `www` → `CNAME gauravsinghrathore1.github.io`
   - GitHub recommends all four Pages apex records for redundancy: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (plus the matching `AAAA` records).
4. Enable **Enforce HTTPS** once the certificate is issued.
5. Every unknown URL — including `/` — is answered by `404.html` with HTTP status 404. That is the intended architecture, not a misconfiguration.

Deployment notes:

- Pages publishes after a push to `main`; expect a short build delay and CDN caching.
- Feature branches do not deploy (unless Pages is pointed at another branch).
- `README.md`, `CNAME` and `.nojekyll` are not part of the visible page.

---

## Development workflow

Changes are developed on short-lived feature branches and merged into `main`:

```text
main ──●──────────────●──────────────●──►
        \            / \            /
         ●──●──●────●   ●──●──●────●
        feature/a      feature/b
```

1. Update `main` and branch: `git switch main && git pull && git switch -c feature/<name>`
2. Make the change (keep it self-contained; the page is one file by design).
3. Commit with a short, imperative summary — the existing history reads like *"Simplify landing page: hero with contact first, settings popover, tabbed sections"*.
4. Merge with a merge commit (`git merge --no-ff feature/<name>`) so the branch stays visible in history.
5. Push `main`, then delete the feature branch locally and on the remote.

Because there is no build system, a change is complete when `404.html` opens cleanly in a browser and the checklist below passes.

---

## Manual test checklist

There are no automated tests. Before merging a change, verify:

- [ ] Page loads from `404.html` with no console errors.
- [ ] All three themes apply, persist across reload and survive the early-paint script.
- [ ] Animated scene, DAG run and log stream complete; **Clear task & re-run** works.
- [ ] **Fix the pipeline**: wrong pair shakes, reverse pair warns, all five links wins, exit restores the run.
- [ ] Clean Sweep starts, scores and stores a best; exiting with `Esc` works.
- [ ] Flap 404 responds to tap, click and `Space`, and stores a best.
- [ ] Power cable pulls, state persists across reload, plugging back runs the boot (and **Skip** works).
- [ ] Command palette opens with `Ctrl`/`Cmd` + `K`; filtering, arrows and `Enter` work.
- [ ] Terminal opens from the palette; `help`, `theme`, `effect`, `sound`, `secrets`, `hint` behave.
- [ ] Secret counter increments and persists; all six can be unlocked.
- [ ] Contact/copy buttons degrade correctly with `OWNER_EMAIL` empty.
- [ ] Layout at 360 px, 768 px and desktop widths; no horizontal scroll.
- [ ] Reduced motion: animations, sound, confetti and vibration are suppressed.
- [ ] Keyboard-only pass: tabs, palette, plug, drawer and dialogs are reachable and closable with `Esc`.

---

## Browser support

Target is current evergreen browsers: **Chrome, Edge, Firefox and Safari** (desktop and mobile). The page relies on:

- CSS custom properties, Grid, `color-mix()`, `mask-image` and `aspect-ratio`
- SVG for the graph, logo and power cable
- Canvas 2D for effects and Flap 404
- Pointer Events and `navigator.vibrate` where available
- Web Audio API for sound
- `localStorage` (wrapped in `try/catch`, so private modes degrade gracefully)

No legacy (IE) support is intended. `color-mix()` is the main modern-CSS dependency; very old browsers lose some tinted colours but keep the layout and behaviour.

---

## Accessibility

- Semantic landmarks (`main`, headings), a real tablist (`role="tab"` / `aria-selected`) and labelled sections.
- The log and toast are live regions (`aria-live="polite"`); dialogs expose `role="dialog"` and labels.
- Visible `:focus-visible` outlines on controls; the settings popover and palette close with `Esc`.
- Keyboard alternatives exist for the palette, tabs, terminal, drawer and power cable.
- `prefers-reduced-motion` disables parallax, effects, confetti, sound, vibration and the boot animation, and shortens transitions.
- Games are pointer-first; **Pull the plug** is fully keyboard-operable. Flap 404 supports `Space`.

---

## Privacy

- No analytics, no cookies, no tracking pixels, no third-party fonts or CDNs.
- The page makes no network requests at runtime; all assets are inline.
- State stays in `localStorage` on the visitor's device.
- The only outbound interaction is the `mailto:` link, and only when the visitor clicks it.

---

## Known notes and limitations

- **HTTP 404 is intentional.** The homepage is the 404 document; a monitoring tool may flag it as an error.
- **Hidden views.** `Spark UI` and `Terminal` tabs are hidden in the public build and reachable only through the palette/terminal.
- **`cat readme.md` is canned.** It prints a short joke, not the contents of this file.
- **One apex A record.** DNS currently resolves `thetye.store` to `185.199.108.153` only; adding the other three GitHub Pages records improves resilience.
- **Scores and secrets are per browser.** They do not sync between devices.
- **No build pipeline.** Editing `404.html` is the whole development loop; keep the single-file constraint unless the architecture is deliberately changed.

---

## License

No `LICENSE` file is currently included, so the code is **all rights reserved** by the repository owner. Add a license before reusing it outside this project.

---

## Author

**Gaurav Singh Rathore** — Data Engineer
Repo: <https://github.com/GauravSinghRathore1/Landing_page> · Site: <https://thetye.store>
