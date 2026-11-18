# CX-Lap-Tool: code guide and design decisions

This document is for anyone reading or changing the code. It explains how `index.html` is put together and why. For how to *use* the app, see the [README](README.md).

## Contents

1. [The big picture](#1-the-big-picture)
2. [How the file is laid out](#2-how-the-file-is-laid-out)
3. [From .fit file to analysis: the pipeline](#3-from-fit-file-to-analysis-the-pipeline)
4. [Sections, corners and off-bike zones](#4-sections-corners-and-off-bike-zones)
5. [More than one rider, or more than one race](#5-more-than-one-rider-or-more-than-one-race)
6. [A first lap that differs from the others](#6-a-first-lap-that-differs-from-the-others)
7. [Rendering: map, charts, replay](#7-rendering-map-charts-replay)
8. [State, persistence and saved reports](#8-state-persistence-and-saved-reports)
9. [Units](#9-units)
10. [Phones, print and export](#10-phones-print-and-export)
11. [Testing](#11-testing)
12. [Known limitations](#12-known-limitations)
13. [Glossary of names in the code](#13-glossary-of-names-in-the-code)

---

## 1. The big picture

The whole app is **one HTML file** with no libraries, no build step and no server. It parses Garmin `.fit` files in the browser, works out laps, sections and corners, and draws everything with plain SVG.

**Why one file, no dependencies**
- **Shareable:** you can email it, put it on a USB stick, or host it as a static page (GitHub Pages). It also works from `file://` with no internet.
- **Private:** ride data never leaves the browser. There is no upload and no account.
- **Durable:** nothing to install, nothing that breaks when a library updates.
- **Self-saving:** "Save report as HTML" writes a copy of the app with the data embedded, so a report is just another copy of the same file (see [§8](#8-state-persistence-and-saved-reports)).

**The cost** is one large file of about 2,700 lines. Code is grouped by banner comments (`/* ===== map ===== */`), described in the next section.

## 2. How the file is laid out

In order, top to bottom:

| Block | What it holds |
|---|---|
| `<style>` | CSS variables for colours (light/dark), layout, phone rules (`max-width:700px`), print rules |
| HTML skeleton | Drop zone, toolbar, empty cards (`#map`, `#detail`, `#gap`, `#spd`, …) that the script fills in |
| FIT parsing | `parseFit`, `toSeries` |
| Math helpers | `interp1`, `valAt`, `median`, `roll`, `cummax`, … |
| Race start/finish | `detectStart`, `detectFinish` |
| Device lap markers | `devMarks` |
| Analysis | `analyze` → `analyzeCore` (the engine), `autoSections`, `nameSection` |
| App state | Globals (`RIDERS`, `M`, `S`, `state`, …), unit helpers |
| Sections & persistence | `computeSections`, user sections, corner names, section marks (localStorage) |
| Loading | `handleFiles`, `run`, `analyzeAll`, `activate`, trim timeline, save report |
| Controls & rendering | Toolbar, tiles, findings, map, detail panel / section editor, heat table, charts, corners, off-bike |
| CSV export, print | `csv*` builders, `downloadCsv`, print reflow |
| Multi-rider | Compare, races mode, leaderboard |
| Replay | Moving dots (`RP` state, `rp*` functions) |
| Preload & API | Loads `window.CX_PRELOAD` (saved reports); exposes `window.CXApp` for tests |

## 3. From .fit file to analysis: the pipeline

```
.fit bytes → parseFit → toSeries (1 Hz arrays) → analyzeCore → M (the model) → renderAll
```

### 3.1 Parsing (`parseFit`, `toSeries`)
A small FIT decoder: definition and data messages, compressed-timestamp headers, record (20), lap (19) and session messages. Positions arrive in semicircles and are converted to degrees. `toSeries` resamples everything to **one sample per second**, so array index = seconds since recording started. That makes time arithmetic trivial throughout (`tg[g]` is a time in seconds and also an index into the power array).

*Decision:* write our own parser rather than use a library. FIT is binary but well specified, and only a handful of messages matter here. This keeps the zero-dependency promise.

### 3.2 Race start and finish (`detectStart`, `detectFinish`)
A CX race looks the same in power on every file: a long quiet spell on the grid, a big jump, then sustained effort. At the end there's a last big effort and then power drops off for good.
- **Start:** candidates are ends of quiet spells (power < 30 W) followed by a jump and about a minute of race-level power. They're ranked so that standing still from the beginning of the recording counts strongly. A warm-up is rejected when it's followed by another long quiet spell.
- **Finish:** the last big effort before power stays low.
- **Safety net:** if lap 1 comes out over 1.5× the median lap, the next start candidate is tried (`analyze` wraps `analyzeCore` for this).
- **No power meter:** the start is the first movement, walked back to the last still sample so the lap line isn't moved forward.

Both can be overridden in Settings or by dragging the trim timeline.

### 3.3 Laps
1. **Lap line:** where the race started, unless set in Settings or taken from device lap markers.
2. **Crossings:** every pass within 20 m of the lap line, keeping only passes in the dominant direction. Tight CX courses often pass the start area going the other way too; ties go to the start direction.
3. **Lap length:** estimated from a histogram of distances between crossings, so it doesn't depend on any one lap.
4. **Splitting:** walk forward picking the crossing nearest one lap-length on. Lap 1 gets a much wider window, 0.3 to 1.3 laps, because start routes vary and the lap line may be picked partway round the course (ahead of the start) or behind the grid; within it the pass nearest a full lap wins, so a pass of the line area mid-lap doesn't cut lap 1 short. A trailing partial lap is kept when the finish is short of the line.
5. **Finish away from the line:** a finish past the line needs nothing: the last lap is timed where it passes the line, and the rest (`M.trailing`) isn't a lap. A finish *before* the line, by up to 30% of a lap, leaves the last lap short. It keeps its real time to the finish (`time`), and gets an estimated full lap (`adj`) = that + the median time of the full laps from the finish position to the line (`diff = [{kind:'finish', est}]`). Comparisons use the estimate, marked "≈"; it never counts as the fastest lap or in typical-lap stats. Further short than 30% (a rider pulled mid-lap), the last lap stays partial with no lap time.

*Optional:* `COURSE.lapSplit='device'` uses the Garmin's own lap button presses instead (`devMarks`). This only works if the button was pressed at the same spot every lap, and the app warns when lap lengths disagree.

*Set by hand:* `COURSE.lapSplit='manual'` uses lap ends the user sets for each rider (`r.opt.laps`, seconds into the file). This is the fix when neither the lap line nor the device markers split the race correctly.
- **Nothing changes until an edit.** `r.opt.laps` stays `null`, and the automatic laps are used and shown as the starting list, until the user changes a lap end.
- **Lap ends are hints, not exact times.** Lap times are measured where the rider passes the lap line (§3.4), so `manMarks` keeps the ends inside the race window. Each end then snaps to the closest pass of the lap line within 30 m, in the race direction, inside a window of ±40% of a typical lap (15–90 s). An end with no pass nearby is used as typed and flagged (`M.man.pairs[].near`).
- **The lap line doesn't move.** It stays the race start position, or the point picked on the map, the same as automatic splitting. (An earlier design used the first lap end as the line. That made every lap time depend on how accurately that one end was typed, and broke lap 1 when the start fell behind the line.)
- **Checks:** a lap holding more than 1.6 laps of distance (a missing lap end) or less than 0.6 (an extra one, not lap 1) is listed in `M.man.long` / `M.man.short`. Such laps get a "Check these laps" banner. A double lap only times its first time round, because the position along the lap can only move forward.
- **Finish:** a last lap end up to 60 s after the detected finish moves the finish to it.
- **No start retries:** with hand-set laps, `analyze` doesn't try later start candidates, so the user's first lap end is never silently dropped.
- **Fallback:** if the lap ends can't be used, the lap line is used and the reason is kept in `M.manFail`.
- **Editing:** the lap-end list in Settings (type m:ss or seconds, remove, add, go back to automatic, copy the device markers), or the orange handles on the trim timeline (drag, click to add, double-click to remove).

### 3.4 The reference lap and positions along it
This is the core idea of the whole engine. Comparing "lap 3 vs lap 5 through the hairpin" needs every lap expressed as **time at each position along one shared line**.

- **Reference polyline:** the fastest full lap, smoothed and resampled every 2 m (`G` = distance along the lap, `gx/gy` = coordinates, `Lref` = length).
- **Projection (`project`, `gpsMap`):** each GPS sample is snapped to the nearest point of the reference *within a window just ahead of the previous position*. The position can only move forward. The window matters because a CX course doubles back on itself constantly, and a global nearest-point search would jump between lanes.
- **Re-sync with a check (`follows`):** if the rider is far from the line (a detour or a shortcut), a wider forward search is allowed. A long jump is only accepted if the next ~10 s keep following the course from the new spot at roughly the rider's pace. Without this check, crossing another lane for a moment could lock the position onto the wrong part of the lap.
- **Hybrid mapping:** GPS jitters by a few metres, but the wheel sensor's distance is smooth. Where the course is unambiguous (no other lane within 18 m, the `clean` map), close GPS fixes become **anchors**. Between anchors, position comes from wheel distance. You get GPS where it's reliable and wheel smoothness in between.
- **Off-bike zones use GPS only:** when the bike is carried, the wheel reads zero, so wheel distance stalls. In detected off-bike zones the plain GPS position is used, and display curves are lightly smoothed.
- **Result:** for each lap `k`, `M.laps[k].tg[g]` is the time (s) at reference position `G[g]`. Everything downstream (sections, corners, gap charts, replay) reads from `tg`.

## 4. Sections, corners and off-bike zones

### Corners
Heading along the reference line is smoothed and differenced over about ±12 m (≈80 ft). Peaks over 40° become corners, at least 16 m apart, classed as sweeper, sharp or hairpin by angle. Per lap, the app measures apex (minimum) speed and time through ±65 ft of the apex. Users can name corners; names are stored per course (§8). A corner without a name of its own is called after its section (`cAuto`: "2nd descent, right hairpin (2 of 3)"). A stored name keeps the lap line it was measured from (`ll`), so it still finds its corner after the lap line is moved (`lineShift`).

### Off-bike zones (`M.zones`)
These are stretches where the *median* lap is slow (< 5.5 mph) with little cadence or power. The median is used so one crash or mechanical doesn't create a zone. The **Off the bike** card then looks at each lap on its own: "on foot" means no pedalling and below walking pace. It reports dismount speed, time on foot, slowest speed and remount speed.

Sections you **mark** as Barriers or Run-up are added to the zones used by that card (`offZones`). They show even when nobody dismounted, which is how hopped barriers show up. Marks don't change the engine's timing.

### Automatic sections (`autoSections`)
This is a dynamic-programming search over candidate cut points every 4 m:
- **Section length:** aims for about 28 s per section (penalty grows either side), with a hard ceiling around 60 s.
- **Where cuts go:** cutting inside a turn or near an apex is penalised, so sections break on straights. Cutting at off-bike zone edges and at the start/end of climbs is rewarded.
- **Names:** `nameSection` gives each section a plain-words name from what's in it: climb, descent, fast straight, technical (n turns), hairpin, run-up, and so on.

*Why DP instead of fixed-length chunks:* fixed chunks cut through corners. The cost function encodes what a rider means by "a section".

### User sections
Editing opens in **Adjust**. Clicking a section in the list picks it (`editSelect`): the map zooms to it (`zoomToSpan`), and its start and end move with their handles or the arrow keys (→ ← the end, Shift + → ← the start, 3 m a press, `nudgePicked`). A boundary can be moved past its neighbours (`moveCut`/`cutPlan`): the sections it passes over merge into the one being stretched, and landing on a boundary (within 8 m) merges onto it. Names follow `namesFor`: a section keeps the name of the old one with the same start, else the same end; typed names stay, automatic ones are worked out again. **S** adds a boundary where the pointer is on the map or a chart (`ED.hover`, `splitAtCursor`). "Draw in order" is for building sections from scratch.
Users can draw sections in order on the map or chart, or adjust boundaries by dragging. They're stored as **lat/lon plus fraction of the lap**, not as raw distance. That way they re-match on another file of the same course even when its lap length differs a little (`storeToUser`).

## 5. More than one rider, or more than one race

- **One course reference:** `PRIMARY` is the reference rider. Every other file is projected onto *that* rider's reference line, lap line and lap direction (`opt.ref`, `lapHeading`). Section *i* and corner *j* then mean the same piece of ground for everyone.
- **Basis:** comparisons use each rider's typical lap (median of laps 2+), fastest lap, or lap *n* vs lap *n* (`state.cmp.basis`, `secVal`, `lapVal`, `cornerVal`).
- **W/kg:** optional total system weight (rider + bike + kit) per rider. Power is shown as W/kg only when switched on, and the UI explains why system weight is the right divisor.
- **Leaderboard:** every rider at once: section winners, an ideal lap made of everyone's best sections, and a map coloured by winner.
- **Riders on the line charts (`chartIds`, `chartZero`, `renderChartBar`):** the rider menu is repeated above the time-gap and speed charts. In Compare, the two riders being compared are drawn, plus anyone ticked under "also show" (`state.cmp.more`); the gap chart's zero line is the "Compare" rider. In the Leaderboard everyone is drawn unless unticked (`state.lbHide`), against the fastest shown or a picked zero line (`state.lbZero`). Heart rate follows the same riders.
- **Several sections at once (`selSet`, `multiSel`, `renderMultiDetail`):** Ctrl + click (⌘ + click) adds a section to the selection or takes it out (`state.sels`, two or more; `state.sel` is the last clicked). The section card adds their times up: per lap with each section's own time (one rider), per lap for both riders (Compare), or per rider (Leaderboard). The single-rider section table gets a "Selected" row, the map and side panel highlight them all, and the charts shade each one and zoom to the span. "Clear selection" or Esc clears them.
- **Corner by corner, stacked (`drawCornerStack`):** under the Compare and Leaderboard corner tables, one bar per corner with one block per rider shown: each rider's "time left" (their laps against their own best pass, as in the single-rider corner report) or time behind the quickest of them (`state.stackMetric`). Clicking a bar picks the corner. A third choice draws the riders side by side instead (`drawCornerAvg`): each rider's average time through the corner over their laps, with a line from one standard deviation below to one above; the axis starts just below the lowest value and the legend says where.
- **Same course, different days ("races"):** files on different dates switch the wording to *races* (overridable). Courses get tweaked between race days, so a file is accepted when ≥ 60% of the reference line is followed within 15 m. Stretches that *most of its laps* miss become `offs` (a consensus, so one GPS glitch doesn't count). Sections and corners there show "—" instead of wrong numbers. Files from a different venue are rejected with a distance ("about 33 miles away").

## 6. A first lap that differs from the others

Many CX races send lap 1 on a different route to avoid a pile-up. The engine looks at three kinds of difference on lap 1 only:

| Kind | How it's found |
|---|---|
| **skip** | The forward position jumps more than 45 m: part of the course was cut out |
| **detour** | Runs well away from the line (≥ 4 s and ≥ 25 m away, or ≥ 8 s). Shorter or narrower runs are normal start-bunch noise and are ignored |
| **start** | The race started partway round the course, or joined it from off the course |
| **lead** | The grid is a turn or two before the lap line (the rider passes it within 30% of a lap of the start). Lap 1 runs on to the next pass, so it is a full lap plus the run-in. Its positions are mapped from that first pass like any other lap, so every section keeps a real time; `act` = the run-in time, `est` = 0 |

Overlapping or close-together stretches (within 30 m) are merged so no time is counted twice. For each stretch:

- `act` = lap 1's real time across it, `est` = the **median time of the other full laps** over the same stretch
- **estimated lap 1** (`lapSum[0].adj`) = real time − Σ`act` + Σ`est`
- Sections and corners on those stretches show "—" for lap 1. **Everything shared with later laps keeps its real time.**
- Lap-time comparisons (lap table, Compare, Leaderboard, CSV) use the estimate, marked "≈", with the actual time on hover. **Race time is never changed.**
- Lap 1 stays out of "typical lap" stats by default, as before.

*Known simplification:* the estimate uses the plain median of the other laps, not scaled to lap 1's overall pace.

## 7. Rendering: map, charts, replay

- **Everything is SVG built as strings,** then set with one `innerHTML` per card. This is simple and fast enough at these sizes, and needs no virtual-DOM library. Handlers are re-attached after each render.
- **`renderAll()`** is the single entry point after any state change. It picks single, Compare or Leaderboard renderers. Some interactions redraw only one piece (e.g. `scheduleMap()` during pan and zoom).
- **Map zoom/pan:** changes the SVG `viewBox`. A scale factor `K` keeps lines, dots and labels the same size on screen at any zoom. `requestAnimationFrame` has a `setTimeout` fallback, because headless browsers (used in testing) don't always fire animation frames.
- **Charts (`lineChart`):** x axis is distance along the lap (feet internally), shared by all charts. Drag to zoom, double-click to reset.
- **Start/finish timeline (`drawTrim`):** Ctrl + scroll zooms around the pointer (down to 30 s), Shift + scroll moves along, "Reset zoom" goes back to the whole recording. The view is kept per rider in `TZ` across re-runs.
- **Satellite imagery (`satTiles`):** optional, off by default. Esri World Imagery tiles are placed under the course in the map's own metres (over a course-sized area the projection difference is negligible). It is the only feature that goes online: the tile requests tell Esri roughly where the course is.
- **Side panel (`layoutDock`, `renderDock`, `dockHi`):** on a window at least 1,500 px wide, the report narrows (to no less than about 1,100 px) and a fixed panel on the right holds the lap times and a small course map. Each part appears once its full-size version (the Laps card, the main map) has scrolled out of view. Clicking that map picks the section or corner under the pointer (corners show as small dots); if a section or corner table is in view and the picked row is off screen, the page scrolls it to near the top (`tableInView`, `scrollToPicked`). Hovering a section, a corner, or a point on a line chart anywhere in the report lights it up on that map (one delegated `mouseover` on `#report`, plus `hoverAll` for the charts). Narrower windows get no panel and the full-width report.
- **Replay (`RP`, `rp*`):** each dot's time-at-position (`tg`) is inverted to get *position at time t* (`mkInv`, `invAt`). Gaps (skipped or off-course stretches) hide the dot. Only the dot layer is redrawn each frame.
  - **Sync different lap (`syncTg`):** rebuilds lap 1's timeline. At a shortcut the dot jumps to the rejoin point and *waits* for as long as the other laps typically take over the stretch. Where lap 1's route was longer, the dot runs the regular course at the other laps' pace instead. Either way it leaves the stretch at its estimated time and keeps whatever gap it had going in.

## 8. State, persistence and saved reports

- **In memory:** `RIDERS[]` (one entry per file: raw data, options, model `M`, weight), `PRIMARY`, `COURSE` (lap line, heading, split mode), `state` (view, units, selection, zoom, settings), plus `S` (current sections), `CR` (corners), `TR` (traces) for the active rider.
- **localStorage (per browser, per course):** user sections, corner names and section marks. Each record stores the lap line's lat/lon and lap length, and `courseMatch` finds the right record when you load another file of the same course (also after the lap line has moved, as long as the stored line is on this course). Saving is a setting, **"Save my sections in this browser"** (on by default, `SAVE_ON`, remembered under `cxLapAnalyzer.saveInBrowser`). On: a newly loaded file of a course with saved sections opens on "Mine". Off: nothing is written or read back, and `MEMREC` keeps your sections across re-runs until the page is closed. "Forget saved sections for this course" (`forgetCourse`) removes all of a course's records. A lap line picked on the map is saved with the same setting (`cxLapAnalyzer.lapLine.v1`, matched by the point lying on the course line and by lap length) and is put back when a new file of that course is loaded; "Use start position" forgets it. "Move lap line" on the course map starts picking it.
- **Saved reports:** `saveReport` re-serialises the running app. It takes its own CSS, HTML and script (`STYLE_HTML`, `ROOT_HTML`, `APP_SRC`) and writes a new file with a `window.CX_PRELOAD = {...}` block holding the raw series and settings for the riders you ticked. On load, the preload block is read and everything is **re-analysed from raw data**, so a report always matches the current engine. Old report formats still load.
  - Any `</script>` inside the data is escaped so it can't end the script tag early.
  - Anything user-typed (names, file names) goes through `esc()` before it touches HTML.

## 9. Units

All internal maths runs in one consistent set of units (metres along the course, then feet and mph for display series). **Units only change at display time,** through helpers such as `uSpd`, `uLen`, `uElev`, `uWt`, `cvS`, `cvL`. Imperial is the default. Switching units never re-runs the analysis and can't change a result.

## 10. Phones, print and export

- **Phones:** CSS under `max-width:700px` stacks the layout, enlarges tap targets, stops the toolbar sticking to the top, and scrolls wide tables inside their cards.
  - **Map:** pinch to zoom. One finger pans once zoomed in. At full view the map uses `touch-action: pan-y`, so a one-finger swipe scrolls the page rather than trapping you. A tap selects the nearest section or corner within reach, because fingers are less precise than a cursor.
  - The section editor stays mouse-only by design.
- **Print:** print CSS plus a reflow to a fixed 700 px width, so charts redraw at paper size.
- **CSV:** each view offers its own exports (sections, corners, laps, off-bike, comparisons, leaderboard), with a UTF-8 BOM so Excel reads them correctly.

## 11. Testing

Tests live in [`tests/`](tests/README.md) and run in headless Chrome: `python3 tests/run.py`. There's nothing to install beyond Python 3 and Chrome. (On Windows with Chrome 157, regular Chrome wouldn't run headless; the runner then uses Puppeteer's `chrome-headless-shell` if it is installed.)

- **How:** each case is a JavaScript snippet injected into a copy of `index.html`. It drives the app through `window.CXApp` and clicks real buttons, and the runner reads the `check()` results back.
- **Synthetic races (committed):** `tests/lib/synth.js` generates a made-up cyclocross race with a known truth (lap times, run-up position). That covers laps, first-lap routes, multi-rider views, different days and venues, replay, marks, saving, touch and units, with no personal data in the repo.
- **Real races (local only):** `tests/local/` runs on real .fit files in `tests/fixtures/`, which git ignores. These are the **regression anchors**: any engine change has to reproduce their numbers exactly.

| Race | Start | Laps | Corners | Auto sections |
|---|---|---|---|---|
| West Hill | 75 s | 463.4 / 455.1 / 466.3 / 466.9 / 464.3 / 460.8 s | 33 | 16 |
| Treehouse | 12 s | 473 / 503 / 501.7 / 503.9 / 499.9 s (lap 1 cut ≈ 990–2,360 ft) | 45 | 18 |

Run the suite after any change. Engine changes in particular can shift numbers in ways that only show up as a few tenths of a second.

## 12. Known limitations

- **Lap splitting:** a manual start far from the natural lap line can confuse lap splitting on courses that cross themselves near the line.
- **First-lap estimate:** uses the plain median of other laps, not scaled to lap 1's overall pace.
- **Device laps:** only meaningful when the lap button was pressed in the same spot each lap.
- **Laps set by hand:** a lap end snaps to the nearest pass of the lap line. To split somewhere else, pick a different lap line on the map. A lap that holds two laps is flagged, but it only times its first time round.
- **Phones:** the section editor and lap-line picker are mouse-only.
- **Heart rate:** off by default, since wrist and chest readings can be unreliable.

## 13. Glossary of names in the code

| Name | Meaning |
|---|---|
| `M` | Analysis model of the active rider (laps, reference line, corners, zones, …) |
| `G`, `gx`, `gy`, `Lref`, `STEP` | Reference line: distance every 2 m, coordinates, length, step |
| `tg` | Time at each reference position, per lap |
| `S`, `CR`, `TR` | Current sections, corners, chart traces |
| `RIDERS`, `PRIMARY`, `COURSE` | Loaded files, reference rider index, shared lap-line settings |
| `zones` / `offZones()` | Detected off-bike stretches / those plus marked sections |
| `gaps`, `dev`, `offs` | Lap 1 skipped stretches, lap 1 detours, course differences on another day |
| `skipsOf(L)` | All stretches with no comparable time for lap `L` |
| `lapSum[k].adj` | Estimated regular-course time for a different first lap |
| `AUTO`, `USER` | Automatic and user section sets (`{cuts, names}`) |
| `r.opt.laps`, `M.man` | A rider's hand-set lap ends (seconds into the file, `null` = automatic); how they were used (`pairs` asked → used, `long`, `short`) |
| `CN`, `ST` / `MARKS` | Stored corner names; stored section marks / marks matched to this course |
| `RP` | Replay state |
| `CX_PRELOAD` | Data embedded in a saved report |
| `CXApp` | Small object exposed for testing and scripting |
