/**
 * Utility functions for robust numeric and monetary input handling.
 */

/**
 * Strips all non-digit characters except for decimal separators (dot/comma).
 * Normalizes commas to dots and removes spaces.
 */
export const parseNumeric = (value: string | number): string => {
  if (typeof value === 'number') return value.toString();
  if (!value) return '';
  
  // Remove spaces and normalize comma to dot
  let cleaned = value.toString().replace(/\s/g, '').replace(/,/g, '.');
  
  // Keep only the first dot and digits
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Filter out any other characters
  cleaned = cleaned.replace(/[^-?\d.]/g, '');
  
  // Remove leading zeros except if followed by a dot
  cleaned = cleaned.replace(/^0+(?=\d)/, '');
  
  return cleaned;
};

/**
 * Formats a number or string for display with thousands separators (space) 
 * and localized decimal separators (comma for FR context if preferred, but dot is safer for logic).
 */
export const formatNumeric = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '';
  
  const s = parseNumeric(value);
  if (s === '' || isNaN(Number(s))) return s;
  
  const [integerPart, decimalPart] = s.split('.');
  
  // Format integer part with spaces
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // If there's a decimal part or the string ends with a dot (user currently typing)
  if (decimalPart !== undefined) {
    return `${formattedInteger},${decimalPart}`;
  } else if (s.endsWith('.')) {
    return `${formattedInteger},`;
  }
  
  return formattedInteger;
};

/**
 * Validates if a string is a valid numeric input.
 */
export const isValidNumeric = (value: string): boolean => {
  if (value === '') return true;
  const parsed = parseNumeric(value);
  return !isNaN(Number(parsed)) && /^-?\d*\.?\d*$/.test(parsed);
};
