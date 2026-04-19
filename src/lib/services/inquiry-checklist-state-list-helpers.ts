export function uniqueChecklistItems(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

export function toChecklistStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueChecklistItems(value.map((entry) => String(entry)));
}
