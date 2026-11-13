# Tests

```
python3 tests/run.py            # everything (about 20 s)
python3 tests/run.py replay     # cases whose file name contains "replay"
python3 tests/run.py -v         # also list the checks that passed
```

Needs Python 3 and Google Chrome or Chromium (set `CHROME=/path/to/chrome` if it isn't found). Nothing to install.

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
a different venue, a shortcut or extra loop on lap 1, a start past the lap line, no power meter.

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
| `10_map_background` | automatic loading, camera bounds and zoom, selection and replay, graphics-context failure, retry, reconnection, Simple/Aerial switching, preserved interactions, rapid changes and Simple defaults |
| `11_map_offline` | failed resource downloads, unchanged analysis, offline interactions, and saved reports reopening offline without requesting the library |
| `12_map_timeouts` | delayed downloads, disconnecting during a pending map, stalled tiles, and preserved section/replay interactions |

Map lifecycle tests simulate the external provider; they do not download tiles or depend on a third-party service. Visual integration is checked separately with a real course and the live background.

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
