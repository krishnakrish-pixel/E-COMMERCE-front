// Input sanitizers (used while typing) and validators (used when pressing Continue / Review / Place order).

/** Keep digits only. */
export const digitsOnly = (v: string) => v.replace(/\D/g, '');

/** "4532891278234589" -> "4532 8912 7823 4589" (max 16 digits, anything that is not a digit is dropped). */
export const formatCardNumber = (v: string) =>
  digitsOnly(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

/** Name on the card: letters and spaces only (no digits or symbols). */
export const cleanCardName = (v: string) =>
  v.replace(/[^\p{L} ]/gu, '').replace(/ {2,}/g, ' ').slice(0, 40);

/** Person name in an address: letters, spaces and . ' - */
export const cleanPersonName = (v: string) =>
  v.replace(/[^\p{L} .'-]/gu, '').replace(/ {2,}/g, ' ').slice(0, 40);

/** CVV: exactly 3 digits. */
export const cleanCvv = (v: string) => digitsOnly(v).slice(0, 3);

/** "1228" -> "12/28", "1" -> "1", "12" -> "12", "123" -> "12/3" (auto-inserts the slash). */
export const formatExpiry = (v: string) => {
  const d = digitsOnly(v).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};

/** Postal code: 6 digits for India, otherwise up to 10 letters / digits / spaces / hyphens. */
export const cleanZip = (v: string, country: string) =>
  country.trim().toLowerCase() === 'india'
    ? digitsOnly(v).slice(0, 6)
    : v.replace(/[^A-Za-z0-9 -]/g, '').slice(0, 10);

// ---------------------------------------------------------------- validators (return an error message or '')

export const validateCardNumber = (v: string) =>
  digitsOnly(v).length === 16 ? '' : 'Card number must be exactly 16 digits';

export const validateCardName = (v: string) => {
  const name = v.trim();
  if (name.length < 2) return 'Enter the name printed on the card';
  return /^[\p{L}]+( [\p{L}]+)*$/u.test(name) ? '' : 'Name can only contain letters';
};

export const validateCvv = (v: string) => (/^\d{3}$/.test(v) ? '' : 'CVV must be exactly 3 digits');

/**
 * Expiry must be MM/YY, a real month, and not in the past: the current month/year or later
 * (capped at 20 years ahead). Past years are always rejected.
 */
export const validateExpiry = (v: string, now: Date = new Date()) => {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return 'Enter the expiry as MM/YY';
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return 'Month must be between 01 and 12';
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  if (year < curYear || (year === curYear && month < curMonth)) return 'This card has expired';
  if (year > curYear + 20) return 'Enter a valid expiry year';
  return '';
};

export const validateUpi = (v: string) =>
  /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(v.trim()) ? '' : 'Enter a valid UPI ID, e.g. name@okbank';

export const validateEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address';

export const validateRequired = (v: string, label: string) =>
  v.trim() ? '' : `${label} is required`;

export const validateZip = (v: string, country: string) => {
  if (!v.trim()) return 'PIN / postal code is required';
  if (country.trim().toLowerCase() === 'india') return /^\d{6}$/.test(v) ? '' : 'PIN code must be exactly 6 digits';
  return v.trim().length >= 3 ? '' : 'Enter a valid postal code';
};
