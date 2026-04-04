# Dice Souls - 3D Dice Puzzle Game

A browser-based 3D dice puzzle game built with Three.js and TypeScript. Move your character around the board, push dice to align matching numbers, and trigger chain reactions!

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## How to Play

### Goal
Clear dice from the board by grouping matching numbers together. Score as many points as possible before the board fills up!

### Controls

| Key | Action |
|-----|--------|
| `W` / `Arrow Up` | Move north |
| `A` / `Arrow Left` | Move west |
| `S` / `Arrow Down` | Move south |
| `D` / `Arrow Right` | Move east |
| `R` | Restart |
| `Esc` | Pause |

On mobile devices, a virtual D-pad appears in the bottom-right corner.

### Rules

#### Basic Matching
Dice are cleared when enough of the same number are connected (up/down/left/right adjacency):

- **2** - Connect 2 or more to clear
- **3** - Connect 3 or more to clear
- **4** - Connect 4 or more to clear
- **5** - Connect 5 or more to clear
- **6** - Connect 6 or more to clear

#### Happy One
The **1** die has a special rule:
- It does **not** clear on its own
- When another group of dice is clearing, any adjacent **1** dice will also be cleared
- This triggers the "Happy One" bonus with extra points and a special effect

#### Chains & Combos
- When dice are cleared, the remaining dice may form new matches - this creates a **chain**
- Each chain increases the score multiplier
- Multiple groups clearing at once increase your **combo** count

#### Dice Rolling
When you push a die, it rolls in that direction. The top face changes according to standard dice rotation (opposite faces sum to 7).

### Scoring

| Die Value | Base Points |
|-----------|-------------|
| 1 (Happy One) | 200 |
| 2 | 100 |
| 3 | 150 |
| 4 | 200 |
| 5 | 300 |
| 6 | 500 |

- Points are multiplied by the chain count
- Bonus points for clearing more dice than the minimum required

### Game Over
New dice periodically appear from the edge of the board. The game ends when the board is full and no more moves can be made.

## Tech Stack

- **Vite** - Build tool
- **TypeScript** - Type-safe development
- **Three.js** - 3D rendering
- **Web Audio API** - Sound effects (no external audio files needed)

## Project Structure

```
src/
  main.ts              # Entry point
  game/
    GameManager.ts     # Overall game management
    GameState.ts       # State machine
  board/
    Board.ts           # Board logic (grid management)
    BoardRenderer.ts   # Board 3D rendering
  dice/
    Dice.ts            # Dice data model
    DiceRenderer.ts    # Dice 3D rendering
    DiceRotation.ts    # Face rotation calculation
  player/
    Player.ts          # Player logic
    PlayerRenderer.ts  # Player 3D rendering
  rules/
    MatchRule.ts       # Match detection (BFS)
    ChainManager.ts    # Chain & combo management
    HappyOne.ts        # Special "1" die rule
  ui/
    HUD.ts             # Score display
    Menu.ts            # Title/Pause/GameOver screens
    VirtualPad.ts      # Mobile virtual D-pad
  audio/
    AudioManager.ts    # Sound effects
  input/
    InputManager.ts    # Keyboard & touch input
  types/
    index.ts           # Type definitions
  utils/
    index.ts           # Utility functions
```

## Build

```bash
npm run build    # Production build (outputs to dist/)
npm run preview  # Preview production build
```

## License

ISC
