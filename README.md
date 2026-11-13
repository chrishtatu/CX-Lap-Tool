# CX-Lap-Tool

**made with claude, I unfortunately haven't done any real coding since undergrad, apologies** 

A single-file, offline web app that takes Garmin `.fit` files from lap races (cyclocross) and builds a lap-by-lap analysis: section and corner time by lap, consistency, fastest sections, power and speed along the lap, a course map with a moving-dot replay, and rider-to-rider (or race-to-race) comparisons with a leaderboard.

**Use it online:** https://chrishtatu.github.io/CX-Lap-Tool/

Or download `index.html` and open it in any modern browser. It needs no install and no internet connection.

## Course map background
A muted map background automatically adds streets, paths, buildings and landmarks from OpenFreeMap when a course opens. No account or API key is needed. Use **Map → Aerial (US)** in the map’s bottom-right corner for USGS aerial imagery of US courses. Simple remains the default whenever you open a report or start a new analysis. Imagery resolution and age vary; zooming closer does not add detail beyond the source imagery.

The existing section colors, selection, editing, replay, pan and zoom remain available while the background loads.

If you lose connectivity, a map download fails, or WebGL is unavailable, the original course diagram stays usable. A failed download offers **Retry map**; reconnecting automatically retries. Saved HTML reports behave the same way and work offline. Printouts use the course diagram without background tiles.

## Privacy
Ride analysis runs in your browser. `.fit` files you load are never uploaded anywhere. Opening a course online automatically downloads the mapping library and background tiles from unpkg and OpenFreeMap. Choosing Aerial requests imagery from USGS instead of OpenFreeMap. These services receive normal network information and the approximate area you are viewing. No mapping resources are requested before a course is loaded or when the browser reports it is offline. A report saved with "Save report as HTML" does contain the ride data (including the GPS track), so think before sharing those publicly.

## Quick start
1. Open the app and drop in a `.fit` file (or tap to choose one).
2. The race start and finish are found from power; laps from the lap line. Both can be adjusted in Settings.
3. The background map loads automatically online; the course and analysis also work offline.
4. Add more files ("Add rider") from the same course to compare riders, or the same rider on different days.

## For developers
How the code is organised, and why it was built the way it was, is in [ARCHITECTURE.md](ARCHITECTURE.md).
