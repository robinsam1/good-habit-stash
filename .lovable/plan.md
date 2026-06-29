# Simplify country/currency selection

Trim the country picker down to a short, opinionated list and add a single "Europe (€)" option for the Eurozone.

## New list (in display order)

1. United States — USD ($)
2. United Kingdom — GBP (£)
3. Canada — CAD ($)
4. Australia — AUD ($)
5. Europe — EUR (€)  *(generic Eurozone entry)*
6. Poland — PLN (zł)  *(non-Euro EU)*
7. Sweden — SEK (kr)  *(non-Euro EU, new)*
8. Denmark — DKK (kr)  *(non-Euro EU, new)*
9. Czechia — CZK (Kč)  *(non-Euro EU, new)*
10. Hungary — HUF (Ft)  *(non-Euro EU, new)*
11. Romania — RON (lei)  *(non-Euro EU, new)*
12. Bulgaria — BGN (лв)  *(non-Euro EU, new)*
13. India — INR (₹)
14. China — CNY (¥)
15. Japan — JPY (¥)
16. Brazil — BRL (R$)

If you'd rather collapse the non-Euro EU countries into a single line too, say the word — but each has its own currency so they can't share one entry the way Eurozone members can.

## Changes

### `src/lib/regions.ts`
- Replace `REGIONS` array with just the entries above.
- Add a generic `EU` region: `{ code: "EU", name: "Europe", currencyCode: "EUR", currencySymbol: "€", locale: "en-IE", minorUnitDigits: 2 }`.
- Add the missing non-Euro EU regions (SE, DK, CZ, HU, RO, BG) with sensible locales.
- Replace `REGION_GROUPS` with a single flat ordered list matching the order above (no group headers — `GetStarted.tsx` already flattens them, so a single group works fine).
- Keep `getRegion` and `unitAmountForRegion` unchanged.

### No other code changes required
- `GetStarted.tsx` already does `REGION_GROUPS.flatMap(...)` so the new flat list renders correctly.
- `useAuth.signUp` / `signInAnonymously` pass region fields through generically — works for the new `EU` entry.
- `handle_new_user` trigger reads `currency_symbol` from metadata, so `€` flows through to seeded activities for the Europe option.

## Notes
- Existing users whose `profiles.region_code` points to a now-removed country (e.g. `DE`, `FR`, `IT`, `ES`) keep working — `profiles` stores the resolved currency fields directly, so `useMoney()` is unaffected. Only the picker shrinks; no data migration needed.
