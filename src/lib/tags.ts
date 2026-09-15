/** 本文から #タグ を拾う */
export function extractTags(text: string): string[] {
  const found = text.match(/#[^\s#、。]+/g) ?? []
  return [...new Set(found.map((t) => t.slice(1)))]
}
