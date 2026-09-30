# Hospice Dash — Wings update

A one-button browser game created by Inology IT. Play at https://SHAD0WDEM0N.github.io/hospice-dash/.

## Play

Open index.html with an internet connection, or use the live link. No installation, build step or API key is needed.

- Garden: Space, click or tap to jump. Stay down beneath hanging branches and lamps.
- Golden wings appear after a random interval. Collect them to enter Scraped Trees.
- Scraped Trees: tap faster to climb; leave longer gaps between taps to descend. Fly through the openings between tree branches. Avoid the top and bottom edges.
- Wings last 24 seconds, then the same scored run returns to the garden with a safe lead-in.
- Practise flying opens the forest immediately. Practice does not change previous-run or personal-best scores.
- Pause/Resume or Escape pauses a run. Switching tabs pauses automatically.

## Scores

Current run counts distance in the active attempt. Previous run is the last completed scored attempt. Personal best is the highest score recorded in this browser on this device and is never replaced by a lower score. Existing scores from the original game are retained.

A new best is saved at five-second intervals, on pause, when leaving the page and at game over. Previous run is saved only at game over. Private browsing, cleared browser data or blocked storage can prevent persistence; the page displays a storage warning when it cannot save.

## Community leaderboard — not connected yet

Nickname-only submissions were chosen for the first shared leaderboard. Nicknames can currently be saved locally with basic character and profanity checks. The upload button is deliberately disabled: there is no shared database yet and no pretend global ranking.

Next setup step: create a Supabase account and project, then connect a restricted score-submission endpoint. Before enabling uploads, add server-side nickname checks, rate limiting, score validation and a way to remove inappropriate entries. Client-only filtering can be bypassed. No public password sign-in or recovery-code system is implemented. Those optional features are deferred.

Do not put database passwords, service-role keys or OpenAI keys in the browser files. Scores from browser games are not trustworthy enough for prize competitions without additional validation.

## Files explained

| File | What it does |
| --- | --- |
| index.html | Page, three score counters, controls, nickname form and creator credit. |
| styles.css | Colours, responsive layout and stable-width score digits. |
| src/core.js | Fixed-step movement, collisions, random wings, flight and transitions. |
| src/game.js | Two Phaser scenes, input, drawing, pause, overlays and score display. |
| src/art.js | Draws the runner animation, obstacles and wings without external game images. |
| src/scores.js | Reads and saves previous-run and best scores. |
| src/leaderboard.js | Local nickname preparation; uploads remain disabled. |
| assets/inology-it.png | Supplied Inology IT logo. |
| tests/core.test.cjs | Simulation and score-storage checks. |
| .nojekyll | Tells GitHub Pages to serve these files directly. |
| .gitignore | Excludes private settings and unnecessary local files. |

## Editing

Change SETTINGS at the top of src/core.js to adjust running speed, jump strength and flight duration. Save and refresh the browser. Game files are plain HTML/CSS/JavaScript with Phaser 3.90.0 from a CDN.

The repository publishes main / (root) through GitHub Pages. Changes pushed to main should deploy automatically. Keep src and assets with index.html when sharing a local copy.

## Testing and the reported 9,000-point stutter

Run `node --test tests/core.test.cjs` if Node is installed; Node is not needed to play.

Movement and collision checks now use the same fixed 120 Hz simulation. Score text is updated at most ten times per second, and animation textures change only when the pose changes. Removed obstacles and old scenes are cleaned up. Short early taps are buffered for landing. Long frame stalls are capped rather than fast-forwarded through obstacles.

Automated checks cover old-score migration, previous/best persistence, blocked storage, ground/overhead collisions, wings pickup and return, flap controls, boundaries, jump buffering and 30/60/120 FPS equivalence. A 20-minute continuous autopilot simulation reached 19,519 points, visited the forest 21 times, and held at most four obstacles at once, with no collisions.

This verifies simulation behaviour and bounded objects; it does not reproduce every device's rendering performance. If stutter persists, report device, browser, score, whether it occurs in the garden or forest, and whether the tab had been backgrounded.
