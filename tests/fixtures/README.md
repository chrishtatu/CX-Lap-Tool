# Local test fixtures (not committed)

Real `.fit` files go here for the cases in `tests/local/`. They are ignored by git because a ride file
contains a GPS track, dates and personal data.

| File | Used for |
|---|---|
| `westhill.fit` | West Hill race: regression numbers, and the base for the time-warped / detoured runs |
| `treehouse.fit` | Treehouse race (Garmin): regression numbers, a real shortcut first lap, and "different venue" rejection |

Without them, `python3 tests/run.py` skips the local cases and runs the synthetic ones only.
