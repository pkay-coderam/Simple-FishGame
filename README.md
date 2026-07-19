# Hooked: Catch the Big One

A small browser-based fishing game built with HTML, CSS, and JavaScript. The goal is to steer the fishing boat and position the hook so you can catch fish while avoiding the other sea creatures.

## How to play
- Open [index.html](index.html) in a browser, or serve the project folder locally.
- Use the left and right arrow keys to move the boat.
- Use the up and down arrow keys to raise and lower the hook.
- When the hook collides with a creature:
  - Fish add 2 points.
  - Other creatures such as crabs, octopuses, jellyfish, turtles, squid, and seahorses subtract 2 points.
- The game ends when your score reaches 10 to win, or -10 to lose.
- Press the Restart Game button to start a new round.

## Run locally
From the project folder, run:

```bash
python3 -m http.server 8000
```

Then open http://127.0.0.1:8000/index.html in your browser.
