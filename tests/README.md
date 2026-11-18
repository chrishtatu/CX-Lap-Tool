# Tests

```
python3 tests/run.py            # everything (about 20 s)
python3 tests/run.py replay     # cases whose file name contains "replay"
python3 tests/run.py -v         # also list the checks that passed
```

Needs Python 3 and Google Chrome or Chromium (set `CHROME=/path/to/chrome` if it isn't found). Nothing to install.
If Puppeteer's `chrome-headless-shell` is installed (under `~/.cache/puppeteer`), the runner uses it first: on Windows,
Chrome 157 would not run headless at all.

## How it works
Each case is a short JavaScript file. `run.py` puts it, with the helpers in `lib/`, into a copy of `index.html`,
opens that in headless Chrome, and reads the results back. Cases drive the app through `window.CXApp`
(`loadRaw`, `handleBuffer`, `addRaw`, `run`, `replay.seek`, …) and click real buttons where that matters.
The run fails (exit code 1) if any check fails.

## Synthetic races (`cases/`, committed)
`lib/synth.js` builds a made-up cyclocross race: a ~1.4 km course with a start straight, 90° turns, a fast straight
and a run-up (off the bike, climbing, wheel stopped), ridden for six laps with a standing start and a cool-down.
It returns the same data the app gets from a .fit file, plus the truth (real lap times, where the run-up is), so the app's
answers can be checked against known values. Options make variants: another rider, another day, a changed course,
a different venue, a shortcut or extra loop on lap 1, a start past or before the lap line, a finish before or past it, no power meter.

| Case | What it checks |
|---|---|
| `01_basics` | start/finish from power, lap times vs truth, run-up zone, sections, no-power file |
| `02_first_lap` | lap 1 shortcut / extra loop / late start: estimated lap 1 vs truth, "—" on the changed part |
| `03_compare_leaderboard` | four riders: Compare, Leaderboard ranking vs truth, W/kg, CSV exports |
| `04_races_different_days` | another day, a course detour on every lap, a different venue rejected |
| `05_replay` | dots start together, faster lap leads, play, "Sync different lap" waiting at a shortcut |
| `06_section_marks` | Barriers / Run-up marks: names, map tag, off-bike card, stored, saved in reports |
| `07_save_report` | saved HTML holds the app, both riders and the settings |
| `08_phone_touch` | tap-to-select, pinch zoom, one-finger and mouse pan, Fit |
| `09_units` | metric labels, unchanged results, replay cursor after unit changes |
| `12_manual_laps` | Lap splitting "Set by hand": wrong device markers overridden; lap ends typed, removed, added, dragged and clicked; snapping to the lap line; warnings; two riders; kept in saved reports |
| `13_start_finish_off_line` | finish before the line: estimated full last lap vs truth, banner, tile, CSV; too short to estimate; finish past the line; grid before the line: lap 1 real time, run-in estimate, replay |
| `14_corner_names_zoom` | corners named after their section; a typed corner name survives moving the lap line and a reload; Ctrl + scroll timeline zoom, Shift + scroll, Reset zoom |
| `15_save_in_browser` | "Save my sections in this browser": saved and reopened on "Mine" when on, Forget, nothing stored when off but kept through re-runs, saved again when turned back on; a lap line picked with "Move lap line" saved, restored on the next file, forgotten by "Use start position" |
| `16_section_editor` | S splits where you point; dragging onto or past a boundary merges; picking a section in the list switches to Adjust and zooms to it; arrow keys move its end / start and merge when they pass a boundary |
| `17_multi_rider_charts` | three riders: rider menu above the charts, a third rider on the Compare charts, switching riders from the chart menu, unticking riders and picking the zero line in the Leaderboard, stacked corner chart (both measures, click to pick) |
| `18_multi_select` | Ctrl + click several sections: added-up section card (one rider, Compare, Leaderboard), "Selected" row, shading, Clear selection and Esc; side-by-side average corner time with spread lines |

## Real races (`local/`, not committed)
Cases in `local/` use your own .fit files from `fixtures/`, which git ignores (rides contain GPS tracks). They are skipped
when the files aren't there. See `fixtures/README.md`.

| Case | What it checks |
|---|---|
| `10_regression_real_races` | exact numbers for West Hill and Treehouse; Treehouse's real shortcut lap 1; a different venue rejected |
| `11_warped_real_rides` | copies of West Hill, time-warped, on other days, with detours and shortcuts, changed first laps, late start, teammates |

## Adding a case
Create `cases/NN_name.js`. Use `check(name, condition, detail)` and `near(name, value, want, tolerance)`.
Helpers: `synthRace(options)`, `view('Compare')`, `$`, `txt`, `sleep`, `captureDownloads()`, `pointer(...)` (see `lib/harness.js`).
For a case that needs a real file, start it with `// fixtures: name` and put `name.fit` in `fixtures/`.
