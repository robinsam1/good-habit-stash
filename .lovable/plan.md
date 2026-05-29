## Plan: Export Active Activities to CSV

Run a query against the live database and write the results to a downloadable CSV file. No code changes.

### Steps
1. Query `activities` (where `active = true`) joined with the latest `activity_values` row per activity (by `effective_from DESC`).
2. Write `/mnt/documents/activities_and_prices.csv` with columns: `id`, `name`, `value_pence`, `value_pounds`.
3. Present the file as a downloadable artifact.

### Expected output
- 76 rows, sorted alphabetically by name.
- Includes negative values (penalties) such as "Habits - Streak Broken - GTM" at -2500p / -£25.00.
- Range: -£25.00 (GTM) to £1000.00 (UK Passport / New Job / Invest All Funds / Patriate RBC).
