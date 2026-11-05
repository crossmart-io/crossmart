/**
 * The first `maxLength` characters of `text`, counted as code points so a cut never splits an
 * emoji or other character outside the Basic Multilingual Plane into a lone surrogate.
 */
export function truncate(text: string, maxLength: number): string {
  const characters = Array.from(text);
  return characters.length <= maxLength ? text : characters.slice(0, maxLength).join('');
}
