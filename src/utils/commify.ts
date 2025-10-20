/**
 * Formats a number with comma separators for thousands
 * @param num - The number to format
 * @returns The formatted string with commas
 * @example
 * commify(1245) // "1,245"
 * commify(1000000) // "1,000,000"
 * commify(123.45) // "123.45"
 */
export function commify(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
