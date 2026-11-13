# CX-Lap-Tool

A single-file, offline web app that takes Garmin `.fit` files from lap races (cyclocross) and builds a lap-by-lap analysis: section and corner time by lap, consistency, fastest sections, power and speed along the lap, a course map with a moving-dot replay, and rider-to-rider (or race-to-race) comparisons with a leaderboard.

**Use it online:** https://chrishtatu.github.io/CX-Lap-Tool/

Or download `index.html` and open it in any modern browser. It needs no install and no internet connection.

## Privacy
Everything runs in your browser. `.fit` files you load are never uploaded anywhere. A report saved with "Save report as HTML" does contain the ride data (including the GPS track), so think before sharing those publicly.

## Quick start
1. Open the app and drop in a `.fit` file (or tap to choose one).
2. The race start and finish are found from power; laps from the lap line. Both can be adjusted in Settings.
3. Add more files ("Add rider") from the same course to compare riders, or the same rider on different days.

## For developers
How the code is organised, and why it was built the way it was, is in [ARCHITECTURE.md](ARCHITECTURE.md).
