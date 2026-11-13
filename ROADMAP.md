# Roadmap: turning MDN Breakout into an LSAC game

We start from the open-source MDN 2D Breakout game. Over 6 parts we change it into
a game for **LSAC (Learn Student Ambassadors Club)** events.

| # | Part | Owner | Status |
|---|------|-------|--------|
| 1 | Club branding and start screen | Nelly | done |
| 2 | Tech topic bricks and bugs | Nelly | done |
| 3 | Tech tips and levels | Nelly | done |
| 4 | Club leaderboard | friend | todo |
| 5 | Sound effects and mobile touch controls | friend | todo |
| 6 | "Join the club" end screen and final polish | friend | todo |

---

## Part 1: Club branding and start screen
- Rename the game to **Bug Breaker** and show the club name.
- Move the code into `index.html`, `style.css` and `game.js`.
- Blue club colors, a start screen with a Play button, and a game over screen
  instead of browser alert popups.

## Part 2: Tech topic bricks and bugs
- Each row of bricks is a tech topic (Cloud, Code, Data, AI, Security) with its
  own color, label and points.
- Some bricks are **bugs**. They take two hits to break.

## Part 3: Tech tips and levels
- Breaking a topic brick shows a short tip about that topic.
- Clearing all bricks takes you to the next level with a faster ball.
- The top bar shows score, level and lives.

## Part 4: Club leaderboard (friend)
- On game over, ask for a name and save the score to `localStorage`.
- Show the top 5 scores on the start and game over screens.
- Add a "clear scores" button for after events.

## Part 5: Sound effects and mobile touch controls (friend)
- Short sounds for brick hits, losing a life and level up. Use the Web Audio API
  so we don't need sound files. Add a mute button.
- Make finger dragging move the paddle on phones, without the page scrolling.

## Part 6: "Join the club" end screen and final polish (friend)
- On game over, show a short "Join LSAC" message with our club's sign-up link
  and social accounts (fill in the real links).
- Add a favicon and page description.
- Test on phone and laptop, fix anything that looks off, update this table.

---

### How to work on a part
1. `git pull`, then make a branch, for example `git checkout -b part-4-leaderboard`
2. Open `index.html` in a browser to test. There's no build step.
3. Push and open a pull request. Merging to `main` updates the live site.
