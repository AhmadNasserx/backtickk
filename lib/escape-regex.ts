/** Escapes user input so it matches literally inside a RegExp (used for `$regex` filters). */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
