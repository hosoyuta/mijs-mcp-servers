/**
 * Helper utilities
 */

export function helper(input: string): string {
  return `Processed: ${input}`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
