export function parseMemoList(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeMemoList(items?: string[]) {
  if (!items || items.length === 0) {
    return "";
  }

  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" | ");
}
