// Region & currency dictionary — short, opinionated list.
// minorUnitDigits = number of decimal places for the currency's smallest unit.
// All monetary values in the DB are stored as integers in smallest unit
// (e.g. pence, cents, yen). 1 "unit" of currency = 10^minorUnitDigits.

export interface Region {
  code: string;          // ISO 3166-1 alpha-2 (or "EU" for generic Eurozone)
  name: string;
  currencyCode: string;  // ISO 4217
  currencySymbol: string;
  locale: string;
  minorUnitDigits: number;
}

export const REGIONS: Region[] = [
  { code: "US", name: "United States",  currencyCode: "USD", currencySymbol: "$",  locale: "en-US", minorUnitDigits: 2 },
  { code: "GB", name: "United Kingdom", currencyCode: "GBP", currencySymbol: "£",  locale: "en-GB", minorUnitDigits: 2 },
  { code: "CA", name: "Canada",         currencyCode: "CAD", currencySymbol: "$",  locale: "en-CA", minorUnitDigits: 2 },
  { code: "AU", name: "Australia",      currencyCode: "AUD", currencySymbol: "$",  locale: "en-AU", minorUnitDigits: 2 },
  { code: "EU", name: "Europe",         currencyCode: "EUR", currencySymbol: "€",  locale: "en-IE", minorUnitDigits: 2 },
  { code: "PL", name: "Poland",         currencyCode: "PLN", currencySymbol: "zł", locale: "pl-PL", minorUnitDigits: 2 },
  { code: "SE", name: "Sweden",         currencyCode: "SEK", currencySymbol: "kr", locale: "sv-SE", minorUnitDigits: 2 },
  { code: "DK", name: "Denmark",        currencyCode: "DKK", currencySymbol: "kr", locale: "da-DK", minorUnitDigits: 2 },
  { code: "CZ", name: "Czechia",        currencyCode: "CZK", currencySymbol: "Kč", locale: "cs-CZ", minorUnitDigits: 2 },
  { code: "HU", name: "Hungary",        currencyCode: "HUF", currencySymbol: "Ft", locale: "hu-HU", minorUnitDigits: 2 },
  { code: "RO", name: "Romania",        currencyCode: "RON", currencySymbol: "lei",locale: "ro-RO", minorUnitDigits: 2 },
  { code: "BG", name: "Bulgaria",       currencyCode: "BGN", currencySymbol: "лв", locale: "bg-BG", minorUnitDigits: 2 },
  { code: "IN", name: "India",          currencyCode: "INR", currencySymbol: "₹",  locale: "en-IN", minorUnitDigits: 2 },
  { code: "CN", name: "China",          currencyCode: "CNY", currencySymbol: "¥",  locale: "zh-CN", minorUnitDigits: 2 },
  { code: "JP", name: "Japan",          currencyCode: "JPY", currencySymbol: "¥",  locale: "ja-JP", minorUnitDigits: 0 },
  { code: "BR", name: "Brazil",         currencyCode: "BRL", currencySymbol: "R$", locale: "pt-BR", minorUnitDigits: 2 },
];

export interface RegionGroup {
  label: string;
  regions: Region[];
}

// Single flat group — GetStarted flattens this anyway.
export const REGION_GROUPS: RegionGroup[] = [
  { label: "Countries", regions: REGIONS },
];

export function getRegion(code: string | null | undefined): Region | undefined {
  if (!code) return undefined;
  return REGIONS.find((r) => r.code === code);
}

export function unitAmountForRegion(region: Region): number {
  return Math.pow(10, region.minorUnitDigits);
}
