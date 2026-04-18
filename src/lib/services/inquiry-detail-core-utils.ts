export function formatCompareList(items?: string[]) {
  if (!items || items.length === 0) {
    return "none";
  }

  return items.slice(0, 3).join(", ");
}

export function findMemoLine(memo: string | null | undefined, prefixes: string[]) {
  if (!memo) {
    return null;
  }

  const lines = memo
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.find((line) => prefixes.some((prefix) => line.startsWith(prefix))) ?? null;
}

export function hasListChanged(previous: string[] | undefined, current: string[] | undefined) {
  return JSON.stringify(previous ?? []) !== JSON.stringify(current ?? []);
}
