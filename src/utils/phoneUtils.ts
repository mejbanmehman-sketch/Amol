/**
 * Bangladeshi Mobile Phone Number Normalization and Validation Utilities
 * Standard format: 01XXXXXXXXX (11 digits, starts with 013-019)
 */

// Convert Bengali numerals (০-৯) to English numerals (0-9)
export function convertBengaliDigitsToEnglish(str: string): string {
  if (!str) return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (char) => {
    const idx = banglaDigits.indexOf(char);
    return idx !== -1 ? String(idx) : char;
  });
}

/**
 * Normalizes any Bangladeshi phone number input into standard 11 digits: 01XXXXXXXXX
 * Handles:
 *  - "+8801860977699" -> "01860977699"
 *  - "8801860977699" -> "01860977699"
 *  - "01860-977699" -> "01860977699"
 *  - "01860 977 699" -> "01860977699"
 *  - "1860977699" -> "01860977699"
 *  - Bengali digits "০১8৬০৯৭৭৬৯৯" -> "01860977699"
 */
export function normalizeBanglaPhone(phone: string): string {
  if (!phone) return '';
  
  // 1. Convert any Bengali digits
  const engPhone = convertBengaliDigitsToEnglish(phone);
  
  // 2. Strip all non-digit characters
  let digits = engPhone.replace(/\D/g, '');

  // 3. Remove country code prefixes (880 or +880)
  if (digits.startsWith('880')) {
    digits = digits.slice(2); // '880' -> '0...'
  } else if (digits.startsWith('88')) {
    digits = digits.slice(2);
  }

  // 4. If user entered 10 digits starting with '1' (omitted leading '0'), prepend '0'
  if (digits.length === 10 && digits.startsWith('1')) {
    digits = '0' + digits;
  }

  return digits;
}

/**
 * Validates if the normalized number is a valid 11-digit Bangladeshi mobile number
 * Operators: 013, 014, 015, 016, 017, 018, 019
 */
export function isValidBanglaPhone(phone: string): boolean {
  const normalized = normalizeBanglaPhone(phone);
  const bdMobileRegex = /^01[3-9]\d{8}$/;
  return bdMobileRegex.test(normalized);
}

/**
 * Compares two phone strings regardless of country code or formatting
 */
export function arePhonesEqual(phoneA: string, phoneB: string): boolean {
  const normA = normalizeBanglaPhone(phoneA);
  const normB = normalizeBanglaPhone(phoneB);
  if (!normA || !normB) return false;
  return normA === normB;
}

/**
 * Formats a clean 11-digit phone number for display (e.g. "01860-977699")
 */
export function formatPhoneDisplay(phone: string): string {
  const norm = normalizeBanglaPhone(phone);
  if (norm.length === 11) {
    return `${norm.slice(0, 5)}-${norm.slice(5)}`;
  }
  return phone;
}
