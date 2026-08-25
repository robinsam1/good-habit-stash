/**
 * Best-effort registry of banking apps we can hand the user off to.
 *
 * No UK bank publishes a deep link that pre-fills a transfer amount, so the
 * most we can do is open the app (or its web banking page) — the amount is
 * copied to the clipboard separately.
 *
 * `link` prefers a universal/https link where the bank publishes one, since
 * those degrade gracefully to the web when the app isn't installed.
 * `scheme` is only set where a custom URL scheme is known to work.
 */
export interface BankOption {
  id: string;
  label: string;
  /** Custom app URL scheme, tried first on mobile when present. */
  scheme?: string;
  /** https fallback — always present. */
  link: string;
}

export const BANKS: BankOption[] = [
  { id: "monzo", label: "Monzo", scheme: "monzo://", link: "https://monzo.com/-/app" },
  { id: "starling", label: "Starling Bank", scheme: "starlingbank://", link: "https://www.starlingbank.com/" },
  { id: "revolut", label: "Revolut", scheme: "revolut://", link: "https://revolut.com/app" },
  { id: "chase", label: "Chase UK", link: "https://www.chase.co.uk/" },
  { id: "barclays", label: "Barclays", scheme: "barclaysmobilebanking://", link: "https://bank.barclays.co.uk/" },
  { id: "hsbc", label: "HSBC UK", link: "https://www.hsbc.co.uk/online-banking/" },
  { id: "lloyds", label: "Lloyds Bank", link: "https://online.lloydsbank.co.uk/" },
  { id: "natwest", label: "NatWest", link: "https://www.nwolb.com/" },
  { id: "santander", label: "Santander UK", link: "https://retail.santander.co.uk/" },
  { id: "nationwide", label: "Nationwide", link: "https://onlinebanking.nationwide.co.uk/" },
  { id: "halifax", label: "Halifax", link: "https://www.halifax-online.co.uk/" },
  { id: "other", label: "Other / not listed", link: "" },
];

export function getBank(id: string | null | undefined): BankOption | null {
  if (!id) return null;
  return BANKS.find((b) => b.id === id) ?? null;
}

/**
 * Opens the bank's app if we know a scheme, otherwise its web banking page.
 * Falls back to the https link shortly after when the scheme doesn't resolve.
 */
export function openBank(bank: BankOption) {
  if (!bank.link && !bank.scheme) return;

  if (bank.scheme) {
    const start = Date.now();
    window.location.href = bank.scheme;
    // If the app didn't take over, the page is still here — send them to the web.
    window.setTimeout(() => {
      if (document.visibilityState === "visible" && Date.now() - start < 2500 && bank.link) {
        window.open(bank.link, "_blank", "noopener,noreferrer");
      }
    }, 1200);
    return;
  }

  window.open(bank.link, "_blank", "noopener,noreferrer");
}
