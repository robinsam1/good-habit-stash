// Region & currency dictionary — covers the 50 most populous countries.
// minorUnitDigits = number of decimal places for the currency's smallest unit.
// All monetary values in the DB are stored as integers in smallest unit
// (e.g. pence, cents, yen). 1 "unit" of currency = 10^minorUnitDigits.

export interface Region {
  code: string;          // ISO 3166-1 alpha-2
  name: string;
  currencyCode: string;  // ISO 4217
  currencySymbol: string;
  locale: string;
  minorUnitDigits: number;
}

export const REGIONS: Region[] = [
  { code: "IN", name: "India",           currencyCode: "INR", currencySymbol: "₹",  locale: "en-IN", minorUnitDigits: 2 },
  { code: "CN", name: "China",           currencyCode: "CNY", currencySymbol: "¥",  locale: "zh-CN", minorUnitDigits: 2 },
  { code: "US", name: "United States",   currencyCode: "USD", currencySymbol: "$",  locale: "en-US", minorUnitDigits: 2 },
  { code: "ID", name: "Indonesia",       currencyCode: "IDR", currencySymbol: "Rp", locale: "id-ID", minorUnitDigits: 2 },
  { code: "PK", name: "Pakistan",        currencyCode: "PKR", currencySymbol: "₨",  locale: "en-PK", minorUnitDigits: 2 },
  { code: "NG", name: "Nigeria",         currencyCode: "NGN", currencySymbol: "₦",  locale: "en-NG", minorUnitDigits: 2 },
  { code: "BR", name: "Brazil",          currencyCode: "BRL", currencySymbol: "R$", locale: "pt-BR", minorUnitDigits: 2 },
  { code: "BD", name: "Bangladesh",      currencyCode: "BDT", currencySymbol: "৳",  locale: "bn-BD", minorUnitDigits: 2 },
  { code: "RU", name: "Russia",          currencyCode: "RUB", currencySymbol: "₽",  locale: "ru-RU", minorUnitDigits: 2 },
  { code: "MX", name: "Mexico",          currencyCode: "MXN", currencySymbol: "$",  locale: "es-MX", minorUnitDigits: 2 },
  { code: "ET", name: "Ethiopia",        currencyCode: "ETB", currencySymbol: "Br", locale: "am-ET", minorUnitDigits: 2 },
  { code: "JP", name: "Japan",           currencyCode: "JPY", currencySymbol: "¥",  locale: "ja-JP", minorUnitDigits: 0 },
  { code: "PH", name: "Philippines",     currencyCode: "PHP", currencySymbol: "₱",  locale: "en-PH", minorUnitDigits: 2 },
  { code: "EG", name: "Egypt",           currencyCode: "EGP", currencySymbol: "E£", locale: "ar-EG", minorUnitDigits: 2 },
  { code: "CD", name: "DR Congo",        currencyCode: "CDF", currencySymbol: "FC", locale: "fr-CD", minorUnitDigits: 2 },
  { code: "VN", name: "Vietnam",         currencyCode: "VND", currencySymbol: "₫",  locale: "vi-VN", minorUnitDigits: 0 },
  { code: "IR", name: "Iran",            currencyCode: "IRR", currencySymbol: "﷼",  locale: "fa-IR", minorUnitDigits: 2 },
  { code: "TR", name: "Turkey",          currencyCode: "TRY", currencySymbol: "₺",  locale: "tr-TR", minorUnitDigits: 2 },
  { code: "DE", name: "Germany",         currencyCode: "EUR", currencySymbol: "€",  locale: "de-DE", minorUnitDigits: 2 },
  { code: "TH", name: "Thailand",        currencyCode: "THB", currencySymbol: "฿",  locale: "th-TH", minorUnitDigits: 2 },
  { code: "GB", name: "United Kingdom",  currencyCode: "GBP", currencySymbol: "£",  locale: "en-GB", minorUnitDigits: 2 },
  { code: "FR", name: "France",          currencyCode: "EUR", currencySymbol: "€",  locale: "fr-FR", minorUnitDigits: 2 },
  { code: "TZ", name: "Tanzania",        currencyCode: "TZS", currencySymbol: "TSh",locale: "sw-TZ", minorUnitDigits: 2 },
  { code: "ZA", name: "South Africa",    currencyCode: "ZAR", currencySymbol: "R",  locale: "en-ZA", minorUnitDigits: 2 },
  { code: "IT", name: "Italy",           currencyCode: "EUR", currencySymbol: "€",  locale: "it-IT", minorUnitDigits: 2 },
  { code: "KE", name: "Kenya",           currencyCode: "KES", currencySymbol: "KSh",locale: "en-KE", minorUnitDigits: 2 },
  { code: "MM", name: "Myanmar",         currencyCode: "MMK", currencySymbol: "K",  locale: "my-MM", minorUnitDigits: 2 },
  { code: "CO", name: "Colombia",        currencyCode: "COP", currencySymbol: "$",  locale: "es-CO", minorUnitDigits: 2 },
  { code: "KR", name: "South Korea",     currencyCode: "KRW", currencySymbol: "₩",  locale: "ko-KR", minorUnitDigits: 0 },
  { code: "SD", name: "Sudan",           currencyCode: "SDG", currencySymbol: "ج.س",locale: "ar-SD", minorUnitDigits: 2 },
  { code: "UG", name: "Uganda",          currencyCode: "UGX", currencySymbol: "USh",locale: "en-UG", minorUnitDigits: 0 },
  { code: "ES", name: "Spain",           currencyCode: "EUR", currencySymbol: "€",  locale: "es-ES", minorUnitDigits: 2 },
  { code: "DZ", name: "Algeria",         currencyCode: "DZD", currencySymbol: "د.ج",locale: "ar-DZ", minorUnitDigits: 2 },
  { code: "IQ", name: "Iraq",            currencyCode: "IQD", currencySymbol: "ع.د",locale: "ar-IQ", minorUnitDigits: 3 },
  { code: "AR", name: "Argentina",       currencyCode: "ARS", currencySymbol: "$",  locale: "es-AR", minorUnitDigits: 2 },
  { code: "AF", name: "Afghanistan",     currencyCode: "AFN", currencySymbol: "؋",  locale: "fa-AF", minorUnitDigits: 2 },
  { code: "YE", name: "Yemen",           currencyCode: "YER", currencySymbol: "﷼",  locale: "ar-YE", minorUnitDigits: 2 },
  { code: "CA", name: "Canada",          currencyCode: "CAD", currencySymbol: "$",  locale: "en-CA", minorUnitDigits: 2 },
  { code: "PL", name: "Poland",          currencyCode: "PLN", currencySymbol: "zł", locale: "pl-PL", minorUnitDigits: 2 },
  { code: "MA", name: "Morocco",         currencyCode: "MAD", currencySymbol: "د.م",locale: "ar-MA", minorUnitDigits: 2 },
  { code: "AO", name: "Angola",          currencyCode: "AOA", currencySymbol: "Kz", locale: "pt-AO", minorUnitDigits: 2 },
  { code: "UA", name: "Ukraine",         currencyCode: "UAH", currencySymbol: "₴",  locale: "uk-UA", minorUnitDigits: 2 },
  { code: "UZ", name: "Uzbekistan",      currencyCode: "UZS", currencySymbol: "soʻm",locale:"uz-UZ", minorUnitDigits: 2 },
  { code: "MY", name: "Malaysia",        currencyCode: "MYR", currencySymbol: "RM", locale: "ms-MY", minorUnitDigits: 2 },
  { code: "MZ", name: "Mozambique",      currencyCode: "MZN", currencySymbol: "MT", locale: "pt-MZ", minorUnitDigits: 2 },
  { code: "GH", name: "Ghana",           currencyCode: "GHS", currencySymbol: "₵",  locale: "en-GH", minorUnitDigits: 2 },
  { code: "PE", name: "Peru",            currencyCode: "PEN", currencySymbol: "S/", locale: "es-PE", minorUnitDigits: 2 },
  { code: "SA", name: "Saudi Arabia",    currencyCode: "SAR", currencySymbol: "﷼",  locale: "ar-SA", minorUnitDigits: 2 },
  { code: "MG", name: "Madagascar",      currencyCode: "MGA", currencySymbol: "Ar", locale: "fr-MG", minorUnitDigits: 2 },
  { code: "CI", name: "Côte d'Ivoire",   currencyCode: "XOF", currencySymbol: "CFA",locale: "fr-CI", minorUnitDigits: 0 },
  { code: "AU", name: "Australia",       currencyCode: "AUD", currencySymbol: "$",  locale: "en-AU", minorUnitDigits: 2 },
];

export function getRegion(code: string | null | undefined): Region | undefined {
  if (!code) return undefined;
  return REGIONS.find((r) => r.code === code);
}

export function unitAmountForRegion(region: Region): number {
  return Math.pow(10, region.minorUnitDigits);
}
